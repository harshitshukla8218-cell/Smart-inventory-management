from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from uuid import UUID
from app.core.database import get_db
from app.api.deps import get_current_user, require_procurement
from app.models.user import User
from app.models.vendor import Vendor, VendorProduct, VendorPriceHistory
from app.schemas.vendor import (
    VendorCreate, VendorUpdate, VendorResponse,
    VendorProductCreate, VendorProductUpdate, VendorProductResponse,
    VendorComparisonItem,
)
from decimal import Decimal

router = APIRouter(prefix="/vendors", tags=["Vendors"])


@router.get("/", response_model=List[VendorResponse])
async def list_vendors(
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    is_active: Optional[bool] = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Vendor)
    if is_active is not None:
        query = query.where(Vendor.is_active == is_active)
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()


@router.post("/", response_model=VendorResponse, status_code=status.HTTP_201_CREATED)
async def create_vendor(
    request: VendorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_procurement),
):
    vendor = Vendor(**request.model_dump())
    db.add(vendor)
    await db.commit()
    await db.refresh(vendor)
    return vendor


@router.get("/{vendor_id}", response_model=VendorResponse)
async def get_vendor(
    vendor_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@router.put("/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: UUID,
    request: VendorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_procurement),
):
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    for field, value in request.model_dump(exclude_unset=True).items():
        setattr(vendor, field, value)
    await db.commit()
    await db.refresh(vendor)
    return vendor


@router.delete("/{vendor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deactivate_vendor(
    vendor_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_procurement),
):
    result = await db.execute(select(Vendor).where(Vendor.id == vendor_id))
    vendor = result.scalar_one_or_none()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    vendor.is_active = False
    await db.commit()


# Vendor Products
@router.post("/products", response_model=VendorProductResponse, status_code=status.HTTP_201_CREATED)
async def create_vendor_product(
    request: VendorProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_procurement),
):
    vp = VendorProduct(**request.model_dump())
    db.add(vp)
    await db.flush()

    # Record initial price in history
    ph = VendorPriceHistory(vendor_product_id=vp.id, price=request.unit_price)
    db.add(ph)
    await db.commit()
    await db.refresh(vp)
    return vp


@router.get("/products/{vp_id}", response_model=VendorProductResponse)
async def get_vendor_product(
    vp_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(VendorProduct).where(VendorProduct.id == vp_id))
    vp = result.scalar_one_or_none()
    if not vp:
        raise HTTPException(status_code=404, detail="Vendor product not found")
    return vp


@router.put("/products/{vp_id}", response_model=VendorProductResponse)
async def update_vendor_product(
    vp_id: UUID,
    request: VendorProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_procurement),
):
    result = await db.execute(select(VendorProduct).where(VendorProduct.id == vp_id))
    vp = result.scalar_one_or_none()
    if not vp:
        raise HTTPException(status_code=404, detail="Vendor product not found")

    old_price = vp.unit_price
    for field, value in request.model_dump(exclude_unset=True).items():
        setattr(vp, field, value)

    # Track price change in history
    if request.unit_price and request.unit_price != old_price:
        ph = VendorPriceHistory(vendor_product_id=vp.id, price=request.unit_price)
        db.add(ph)

    await db.commit()
    await db.refresh(vp)
    return vp


@router.get("/compare/{product_id}", response_model=List[VendorComparisonItem])
async def compare_vendors_for_product(
    product_id: UUID,
    quantity: int = Query(default=1, ge=1),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Compare all vendor offerings for a product, sorted by total cost."""
    result = await db.execute(
        select(VendorProduct)
        .options(selectinload(VendorProduct.vendor))
        .where(VendorProduct.product_id == product_id)
    )
    vendor_products = result.scalars().all()

    comparison = []
    for vp in vendor_products:
        total_cost = (vp.unit_price * quantity) + (vp.delivery_charges or Decimal("0"))
        comparison.append(
            VendorComparisonItem(
                vendor_id=vp.vendor_id,
                vendor_name=vp.vendor.name,
                unit_price=vp.unit_price,
                delivery_days_estimate=vp.delivery_days_estimate,
                delivery_charges=vp.delivery_charges or Decimal("0"),
                total_cost=total_cost,
                available_quantity=vp.available_quantity,
                platform=vp.platform.value,
                rating=vp.rating,
            )
        )

    comparison.sort(key=lambda x: x.total_cost)
    return comparison
