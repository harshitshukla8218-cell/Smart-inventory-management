from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import case, select, func, distinct
from datetime import date, datetime, time, timedelta, timezone
import io
from app.core.database import get_db
from app.api.deps import get_current_user, require_management
from app.models.user import User
from app.models.inventory import Inventory, InventoryTransaction, Warehouse
from app.models.sales_order import SalesOrder, SalesOrderItem, SalesOrderStatus
from app.models.purchase_order import PurchaseOrder, POStatus
from app.models.procurement import ProcurementRequest, ProcurementStatus
from app.models.product import Product, Category
from app.models.allocation import ProductAllocation, AllocationStatus

router = APIRouter(prefix="/reports", tags=["Reports"])


@router.get("/kpis")
async def dashboard_kpis(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    product_stock = (
        select(
            Inventory.product_id.label("product_id"),
            func.sum(Inventory.available_quantity).label("available"),
            func.sum(Inventory.reorder_level).label("reorder_level"),
        )
        .group_by(Inventory.product_id)
        .subquery()
    )
    stock_totals = await db.execute(
        select(
            func.coalesce(func.sum(Inventory.available_quantity), 0),
            func.coalesce(func.sum(Inventory.incoming_quantity), 0),
        )
    )
    available_stock, incoming_stock = stock_totals.one()
    product_counts = await db.execute(
        select(
            func.count(Product.id),
            func.count(
                case(
                    (func.coalesce(product_stock.c.available, 0) <= 0, Product.id),
                    else_=None,
                )
            ),
            func.count(
                case(
                    (
                        func.coalesce(product_stock.c.available, 0)
                        <= func.coalesce(product_stock.c.reorder_level, 0),
                        Product.id,
                    ),
                    else_=None,
                )
            ),
        ).outerjoin(product_stock, product_stock.c.product_id == Product.id)
    )
    total_products, out_of_stock, low_stock = product_counts.one()
    pending_procurement = await db.scalar(
        select(func.count(ProcurementRequest.id)).where(
            ProcurementRequest.status.not_in(
                [ProcurementStatus.COMPLETED, ProcurementStatus.CANCELLED]
            )
        )
    )
    active_purchase_orders = await db.scalar(
        select(func.count(PurchaseOrder.id)).where(
            PurchaseOrder.status.not_in([POStatus.COMPLETED, POStatus.CANCELLED])
        )
    )
    pending_sales_orders = await db.scalar(
        select(func.count(SalesOrder.id)).where(
            SalesOrder.status.not_in(
                [SalesOrderStatus.COMPLETED, SalesOrderStatus.CANCELLED]
            )
        )
    )
    completed_orders = await db.scalar(
        select(func.count(SalesOrder.id)).where(
            SalesOrder.status == SalesOrderStatus.COMPLETED
        )
    )
    allocated_products = await db.scalar(
        select(func.coalesce(func.sum(ProductAllocation.quantity_allocated), 0)).where(
            ProductAllocation.status == AllocationStatus.ACTIVE
        )
    )

    return {
        "total_products": total_products or 0,
        "available_stock": available_stock or 0,
        "out_of_stock": out_of_stock or 0,
        "low_stock": low_stock or 0,
        "pending_procurement": pending_procurement or 0,
        "active_purchase_orders": active_purchase_orders or 0,
        "incoming_warehouse": incoming_stock or 0,
        "pending_sales_orders": pending_sales_orders or 0,
        "allocated_products": allocated_products or 0,
        "completed_orders": completed_orders or 0,
    }


@router.get("/inventory-overview")
async def dashboard_inventory_overview(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(
            func.coalesce(Category.name, "Uncategorized").label("category"),
            func.sum(Inventory.available_quantity).label("available"),
            func.sum(Inventory.reserved_quantity).label("reserved"),
            func.sum(Inventory.incoming_quantity).label("incoming"),
        )
        .join(Product, Inventory.product_id == Product.id)
        .outerjoin(Category, Product.category_id == Category.id)
        .group_by(Category.name)
        .order_by(Category.name)
    )
    return [
        {
            "category": row.category,
            "available": row.available or 0,
            "reserved": row.reserved or 0,
            "incoming": row.incoming or 0,
        }
        for row in result
    ]


@router.get("/stock-chart")
async def dashboard_stock_chart(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(
            func.coalesce(func.sum(Inventory.available_quantity), 0),
            func.coalesce(func.sum(Inventory.reserved_quantity), 0),
            func.coalesce(func.sum(Inventory.incoming_quantity), 0),
            func.coalesce(func.sum(Inventory.damaged_quantity), 0),
        )
    )
    available, reserved, incoming, damaged = result.one()
    return [
        {"name": "Available", "value": available},
        {"name": "Reserved", "value": reserved},
        {"name": "Incoming", "value": incoming},
        {"name": "Damaged", "value": damaged},
    ]


def _trailing_months(month_count: int = 6) -> list[tuple[datetime, str]]:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    current_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    months = []
    for offset in range(month_count - 1, -1, -1):
        month_index = current_month.month - 1 - offset
        year = current_month.year + month_index // 12
        month = month_index % 12 + 1
        month_start = current_month.replace(year=year, month=month)
        months.append((month_start, month_start.strftime("%b")))
    return months


@router.get("/procurement-expenses")
async def dashboard_procurement_expenses(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    months = _trailing_months()
    result = await db.execute(
        select(PurchaseOrder.order_date, PurchaseOrder.total_amount).where(
            PurchaseOrder.order_date >= months[0][0],
            PurchaseOrder.status != POStatus.CANCELLED,
        )
    )
    amounts_by_month = {month.strftime("%Y-%m"): 0.0 for month, _ in months}
    for order_date, amount in result:
        key = order_date.strftime("%Y-%m")
        if key in amounts_by_month:
            amounts_by_month[key] += float(amount or 0)
    return [
        {"month": month_label, "amount": amounts_by_month[month.strftime("%Y-%m")]}
        for month, month_label in months
    ]


@router.get("/sales-stats")
async def dashboard_sales_stats(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    months = _trailing_months()
    result = await db.execute(
        select(SalesOrder.created_at).where(SalesOrder.created_at >= months[0][0])
    )
    orders_by_month = {month.strftime("%Y-%m"): 0 for month, _ in months}
    for (created_at,) in result:
        key = created_at.strftime("%Y-%m")
        if key in orders_by_month:
            orders_by_month[key] += 1
    return [
        {"month": month_label, "orders": orders_by_month[month.strftime("%Y-%m")]}
        for month, month_label in months
    ]


@router.get("/low-stock-alerts")
async def dashboard_low_stock_alerts(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Inventory, Product, Warehouse)
        .join(Product, Inventory.product_id == Product.id)
        .join(Warehouse, Inventory.warehouse_id == Warehouse.id)
        .where(Inventory.available_quantity <= Inventory.reorder_level)
        .order_by(Inventory.available_quantity, Product.name)
        .limit(20)
    )
    return [
        {
            "product_id": str(inventory.product_id),
            "product_name": product.name,
            "sku": product.sku,
            "warehouse": warehouse.name,
            "available": inventory.available_quantity,
            "reorder_level": inventory.reorder_level,
            "status": "OUT_OF_STOCK" if inventory.available_quantity == 0 else "LOW_STOCK",
        }
        for inventory, product, warehouse in result
    ]


@router.get("/recent-activities")
async def dashboard_recent_activities(
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(InventoryTransaction)
        .order_by(InventoryTransaction.created_at.desc())
        .limit(10)
    )
    return [
        {
            "id": str(transaction.id),
            "type": transaction.transaction_type.value,
            "reference_type": transaction.reference_type,
            "quantity_change": transaction.quantity_change,
            "created_at": transaction.created_at,
        }
        for transaction in result.scalars()
    ]


@router.get("/inventory/summary")
async def inventory_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(
            func.sum(Inventory.total_quantity).label("total_units"),
            func.sum(Inventory.available_quantity).label("available_units"),
            func.sum(Inventory.reserved_quantity).label("reserved_units"),
            func.sum(Inventory.damaged_quantity).label("damaged_units"),
            func.count(Inventory.id).label("total_records"),
        )
    )
    row = result.one()
    return {
        "total_units": row.total_units or 0,
        "available_units": row.available_units or 0,
        "reserved_units": row.reserved_units or 0,
        "damaged_units": row.damaged_units or 0,
        "total_records": row.total_records or 0,
    }


@router.get("/inventory/low-stock")
async def low_stock_report(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Inventory).where(Inventory.available_quantity <= Inventory.min_stock_level)
    )
    records = result.scalars().all()
    return [
        {
            "inventory_id": str(r.id),
            "product_id": str(r.product_id),
            "warehouse_id": str(r.warehouse_id),
            "available_quantity": r.available_quantity,
            "min_stock_level": r.min_stock_level,
        }
        for r in records
    ]


@router.get("/sales/summary")
async def sales_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_management),
):
    result = await db.execute(
        select(
            SalesOrder.status,
            func.count(SalesOrder.id).label("count"),
        ).group_by(SalesOrder.status)
    )
    rows = result.all()
    return {row.status.value: row.count for row in rows}


@router.get("/sales/daily")
async def daily_sales_report(
    report_date: date | None = None,
    db: AsyncSession = Depends(get_db),
    _current_user: User = Depends(get_current_user),
):
    day = report_date or datetime.now(timezone.utc).date()
    start = datetime.combine(day, time.min)
    end = start + timedelta(days=1)
    completed_orders = SalesOrder.status == SalesOrderStatus.COMPLETED
    dispatched_on_day = (
        SalesOrder.updated_at >= start,
        SalesOrder.updated_at < end,
    )

    totals = await db.execute(
        select(
            func.count(distinct(SalesOrder.id)),
            func.coalesce(func.sum(SalesOrderItem.quantity_allocated), 0),
            func.coalesce(
                func.sum(SalesOrderItem.quantity_allocated * SalesOrderItem.unit_price),
                0,
            ),
        )
        .join(SalesOrderItem, SalesOrderItem.sales_order_id == SalesOrder.id)
        .where(completed_orders, *dispatched_on_day)
    )
    order_count, units_sold, revenue = totals.one()

    product_totals = await db.execute(
        select(
            Product.sku,
            Product.name,
            func.coalesce(func.sum(SalesOrderItem.quantity_allocated), 0).label("units_sold"),
            func.coalesce(
                func.sum(SalesOrderItem.quantity_allocated * SalesOrderItem.unit_price),
                0,
            ).label("revenue"),
        )
        .join(SalesOrderItem, SalesOrderItem.product_id == Product.id)
        .join(SalesOrder, SalesOrderItem.sales_order_id == SalesOrder.id)
        .where(completed_orders, *dispatched_on_day)
        .group_by(Product.sku, Product.name)
        .order_by(Product.name)
    )
    return {
        "date": day.isoformat(),
        "completed_orders": order_count or 0,
        "units_sold": units_sold or 0,
        "revenue": float(revenue or 0),
        "products": [
            {
                "sku": row.sku,
                "name": row.name,
                "units_sold": row.units_sold,
                "revenue": float(row.revenue or 0),
            }
            for row in product_totals
        ],
    }


@router.get("/procurement/summary")
async def procurement_summary(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_management),
):
    result = await db.execute(
        select(
            ProcurementRequest.status,
            func.count(ProcurementRequest.id).label("count"),
        ).group_by(ProcurementRequest.status)
    )
    rows = result.all()
    return {row.status.value: row.count for row in rows}


@router.get("/inventory/export/csv")
async def export_inventory_csv(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export inventory data as CSV."""
    import csv

    result = await db.execute(select(Inventory))
    records = result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "ID", "Product ID", "Warehouse ID", "Total Qty", "Available Qty",
        "Reserved Qty", "Incoming Qty", "Damaged Qty", "Min Stock", "Reorder Level",
    ])
    for r in records:
        writer.writerow([
            str(r.id), str(r.product_id), str(r.warehouse_id),
            r.total_quantity, r.available_quantity, r.reserved_quantity,
            r.incoming_quantity, r.damaged_quantity, r.min_stock_level, r.reorder_level,
        ])

    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode()),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=inventory_export.csv"},
    )


@router.get("/inventory/export/pdf")
async def export_inventory_pdf(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export inventory summary as PDF using reportlab."""
    from reportlab.lib.pagesizes import letter, landscape
    from reportlab.lib import colors
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet

    result = await db.execute(select(Inventory))
    records = result.scalars().all()

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(letter))
    styles = getSampleStyleSheet()
    elements = []

    elements.append(Paragraph("Inventory Report", styles["Title"]))
    elements.append(Paragraph(f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}", styles["Normal"]))
    elements.append(Spacer(1, 12))

    data = [["Product ID", "Warehouse ID", "Total", "Available", "Reserved", "Damaged", "Min Stock"]]
    for r in records:
        data.append([
            str(r.product_id)[:8] + "...",
            str(r.warehouse_id)[:8] + "...",
            r.total_quantity,
            r.available_quantity,
            r.reserved_quantity,
            r.damaged_quantity,
            r.min_stock_level,
        ])

    table = Table(data)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.grey),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.whitesmoke),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 11),
        ("BOTTOMPADDING", (0, 0), (-1, 0), 12),
        ("BACKGROUND", (0, 1), (-1, -1), colors.beige),
        ("GRID", (0, 0), (-1, -1), 1, colors.black),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
    ]))
    elements.append(table)

    doc.build(elements)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=inventory_report.pdf"},
    )


@router.get("/inventory/export/excel")
async def export_inventory_excel(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export inventory data as Excel using openpyxl."""
    import openpyxl
    from openpyxl.styles import Font, PatternFill, Alignment
    from openpyxl.utils import get_column_letter

    result = await db.execute(select(Inventory))
    records = result.scalars().all()

    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Inventory"

    headers = ["ID", "Product ID", "Warehouse ID", "Total Qty", "Available Qty",
               "Reserved Qty", "Incoming Qty", "Damaged Qty", "Min Stock", "Reorder Level"]
    header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
    header_font = Font(color="FFFFFF", bold=True)

    for col_num, header in enumerate(headers, 1):
        cell = ws.cell(row=1, column=col_num, value=header)
        cell.fill = header_fill
        cell.font = header_font
        cell.alignment = Alignment(horizontal="center")
        ws.column_dimensions[get_column_letter(col_num)].width = 18

    for row_num, r in enumerate(records, 2):
        ws.cell(row=row_num, column=1, value=str(r.id))
        ws.cell(row=row_num, column=2, value=str(r.product_id))
        ws.cell(row=row_num, column=3, value=str(r.warehouse_id))
        ws.cell(row=row_num, column=4, value=r.total_quantity)
        ws.cell(row=row_num, column=5, value=r.available_quantity)
        ws.cell(row=row_num, column=6, value=r.reserved_quantity)
        ws.cell(row=row_num, column=7, value=r.incoming_quantity)
        ws.cell(row=row_num, column=8, value=r.damaged_quantity)
        ws.cell(row=row_num, column=9, value=r.min_stock_level)
        ws.cell(row=row_num, column=10, value=r.reorder_level)

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=inventory_export.xlsx"},
    )
