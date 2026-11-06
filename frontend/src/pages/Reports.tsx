import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  BarChart3,
  Download,
  Calendar,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Filter,
  Layers,
  ShoppingBag,
  Truck,
  Scale,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const Reports: React.FC = () => {
  const [activeReport, setActiveReport] = useState<string>('inventory');
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const reportTypes = [
    { id: 'inventory', name: '1. Current Inventory Report', desc: 'Real-time stock on hand across all warehouses' },
    { id: 'low-stock', name: '2. Low Stock Report', desc: 'SKUs at or below replenishment threshold' },
    { id: 'out-of-stock', name: '3. Out-of-Stock Report', desc: 'Critical zero available inventory items' },
    { id: 'procurement-history', name: '4. Procurement History', desc: 'All requisitions, status history, and costs' },
    { id: 'vendor-comparison', name: '5. Vendor Price Comparison', desc: 'Side-by-side pricing, delivery lead times' },
    { id: 'purchase-orders', name: '6. Purchase Order Report', desc: 'Official vendor commitments and payment status' },
    { id: 'warehouse-arrivals', name: '7. Warehouse Arrival Report', desc: 'Inward gate receipts, inspected & damaged counts' },
    { id: 'sales-orders', name: '8. Sales Order Report', desc: 'Customer fulfillment, backlog, and pipeline' },
    { id: 'allocations', name: '9. Product Allocation Report', desc: 'Reserved inventory by customer sales order' },
    { id: 'inventory-movement', name: '10. Inventory Movement Audit', desc: 'Ledger of all receipts, issues, and adjustments' },
    { id: 'procurement-expenses', name: '11. Monthly Procurement Spend', desc: 'Total purchase expenditure over past months' },
    { id: 'vendor-performance', name: '12. Vendor Performance Report', desc: 'Vendor ratings, fulfillment speed, lead times' },
  ];

  const fetchReportData = async (reportId: string) => {
    setLoading(true);
    try {
      // Dynamic endpoint mapping
      let endpoint = '/inventory';
      if (reportId === 'low-stock') endpoint = '/reports/low-stock-alerts';
      else if (reportId === 'out-of-stock') endpoint = '/reports/low-stock-alerts';
      else if (reportId === 'procurement-history') endpoint = '/procurement';
      else if (reportId === 'vendor-comparison') endpoint = '/vendors/products/compare';
      else if (reportId === 'purchase-orders') endpoint = '/purchase-orders';
      else if (reportId === 'warehouse-arrivals') endpoint = '/warehouse/receipts';
      else if (reportId === 'sales-orders') endpoint = '/sales-orders';
      else if (reportId === 'allocations') endpoint = '/sales-orders/allocations/list';
      else if (reportId === 'inventory-movement') endpoint = '/reports/recent-activities';
      else if (reportId === 'procurement-expenses') endpoint = '/reports/procurement-expenses';
      else if (reportId === 'vendor-performance') endpoint = '/vendors';

      const res = await api.get(endpoint);
      setReportData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load report data', err);
      setReportData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData(activeReport);
  }, [activeReport]);

  const handleExportCSV = () => {
    if (reportData.length === 0) return;
    const headers = Object.keys(reportData[0] || {}).join(',');
    const rows = reportData
      .map((row) =>
        Object.values(row)
          .map((v) => (typeof v === 'object' ? JSON.stringify(v) : `"${String(v || '').replace(/"/g, '""')}"`))
          .join(',')
      )
      .join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,' + headers + '\n' + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${activeReport}-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" /> Enterprise Reports & Executive Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Access 12 standardized business intelligence reports with instant CSV / Excel data exports.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition"
        >
          <FileSpreadsheet className="w-4 h-4" /> Export CSV / Excel
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: 12 Standard Reports Nav Menu */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 py-2 block">
            Report Modules
          </span>
          {reportTypes.map((r) => (
            <button
              key={r.id}
              onClick={() => setActiveReport(r.id)}
              className={`w-full text-left px-3 py-2.5 rounded-xl transition text-xs flex flex-col ${
                activeReport === r.id
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-700 hover:bg-slate-100 font-medium'
              }`}
            >
              <span className="leading-tight">{r.name}</span>
              <span className={`text-[10px] mt-0.5 ${activeReport === r.id ? 'text-blue-100' : 'text-slate-400'}`}>
                {r.desc}
              </span>
            </button>
          ))}
        </div>

        {/* Right: Data View & Table */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {reportTypes.find((r) => r.id === activeReport)?.name}
              </h2>
              <p className="text-xs text-slate-500">
                {reportTypes.find((r) => r.id === activeReport)?.desc}
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
              {reportData.length} Records
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading live analytics...</div>
          ) : reportData.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No records found for this report.</div>
          ) : (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    {Object.keys(reportData[0] || {})
                      .slice(0, 6)
                      .map((key) => (
                        <th key={key} className="py-2.5 px-3">
                          {key.replace(/_/g, ' ')}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reportData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      {Object.keys(reportData[0] || {})
                        .slice(0, 6)
                        .map((key) => {
                          const val = row[key];
                          const displayVal =
                            typeof val === 'object' && val !== null
                              ? val.name || val.order_number || val.po_number || JSON.stringify(val)
                              : String(val ?? '-');
                          return (
                            <td key={key} className="py-2.5 px-3 font-medium text-slate-800 truncate max-w-xs">
                              {displayVal}
                            </td>
                          );
                        })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
