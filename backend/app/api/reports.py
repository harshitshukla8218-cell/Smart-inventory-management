from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
from datetime import datetime, date
import io
from app.core.database import get_db
from app.api.deps import get_current_user, require_management
from app.models.user import User
from app.models.inventory import Inventory
from app.models.sales_order import SalesOrder, SalesOrderStatus
from app.models.purchase_order import PurchaseOrder
from app.models.procurement import ProcurementRequest

router = APIRouter(prefix="/reports", tags=["Reports"])


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
