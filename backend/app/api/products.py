from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from uuid import UUID
from app.core.database import get_db
from app.api.deps import get_current_user, require_inventory
from app.models.user import User
from app.models.product import Product, Category
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, CategoryCreate, CategoryUpdate, CategoryResponse

router = APIRouter(prefix="/products", tags=["Products"])
cat_router = APIRouter(prefix="/categories", tags=["Categories"])


@cat_router.get("/", response_model=List[CategoryResponse])
async def list_categories(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(select(Category))
    return result.scalars().all()


@cat_router.post("/", response_model=CategoryResponse, status_code=status.HTTP_201_CREATED)
async def create_category(
    request: CategoryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory),
):
    cat = Category(**request.model_dump())
    db.add(cat)
    await db.commit()
    await db.refresh(cat)
    return cat


@cat_router.put("/{cat_id}", response_model=CategoryResponse)
async def update_category(
    cat_id: UUID,
    request: CategoryUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory),
):
    result = await db.execute(select(Category).where(Category.id == cat_id))
    cat = result.scalar_one_or_none()
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    for field, value in request.model_dump(exclude_unset=True).items():
        setattr(cat, field, value)
    await db.commit()
    await db.refresh(cat)
    return cat


@router.get("/", response_model=List[ProductResponse])
async def list_products(
    skip: int = 0,
    limit: int = Query(default=50, le=200),
    category_id: Optional[UUID] = None,
    is_active: Optional[bool] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = select(Product)
    if category_id:
        query = query.where(Product.category_id == category_id)
    if is_active is not None:
        query = query.where(Product.is_active == is_active)
    if search:
        query = query.where(
            Product.name.ilike(f"%{search}%") | Product.sku.ilike(f"%{search}%")
        )
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
async def create_product(
    request: ProductCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory),
):
    existing = await db.execute(select(Product).where(Product.sku == request.sku))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="SKU already exists")

    product = Product(**request.model_dump(), created_by=current_user.id)
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: UUID,
    request: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    for field, value in request.model_dump(exclude_unset=True).items():
        setattr(product, field, value)
    await db.commit()
    await db.refresh(product)
    return product


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_inventory),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_active = False
    await db.commit()
