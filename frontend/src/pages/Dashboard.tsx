import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardKPIs } from '../types';
import {
  Package,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  FileCheck,
  Truck,
  ShoppingBag,
  Layers,
  CheckCheck,
  TrendingUp,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { Link } from 'react-router-dom';

const PIE_COLORS = ['#16A34A', '#2563EB', '#F59E0B', '#DC2626'];

export const Dashboard: React.FC = () => {
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [inventoryOverview, setInventoryOverview] = useState<any[]>([]);
  const [stockChart, setStockChart] = useState<any[]>([]);
  const [procurementExpenses, setProcurementExpenses] = useState<any[]>([]);
  const [salesStats, setSalesStats] = useState<any[]>([]);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [kpisRes, invRes, stockRes, expRes, salesRes, alertsRes, actRes] = await Promise.all([
          api.get('/reports/kpis'),
          api.get('/reports/inventory-overview'),
          api.get('/reports/stock-chart'),
          api.get('/reports/procurement-expenses'),
          api.get('/reports/sales-stats'),
          api.get('/reports/low-stock-alerts'),
          api.get('/reports/recent-activities'),
        ]);

        setKpis(kpisRes.data);
        setInventoryOverview(invRes.data);
        setStockChart(stockRes.data);
        setProcurementExpenses(expRes.data);
        setSalesStats(salesRes.data);
        setLowStockAlerts(alertsRes.data);
        setRecentActivities(actRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const kpiCards = [
    { label: 'Total Products', value: kpis?.total_products || 0, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
    { label: 'Available Stock', value: kpis?.available_stock || 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    { label: 'Out-of-Stock Products', value: kpis?.out_of_stock || 0, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200' },
    { label: 'Low-Stock Products', value: kpis?.low_stock || 0, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
    { label: 'Pending Procurement', value: kpis?.pending_procurement || 0, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    { label: 'Active Purchase Orders', value: kpis?.active_purchase_orders || 0, icon: FileCheck, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { label: 'Incoming Products', value: kpis?.incoming_warehouse || 0, icon: Truck, color: 'text-cyan-600', bg: 'bg-cyan-50', border: 'border-cyan-200' },
    { label: 'Pending Sales Orders', value: kpis?.pending_sales_orders || 0, icon: ShoppingBag, color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-200' },
    { label: 'Allocated Products', value: kpis?.allocated_products || 0, icon: Layers, color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200' },
    { label: 'Completed Orders', value: kpis?.completed_orders || 0, icon: CheckCheck, color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Main Executive Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time multi-warehouse availability, procurement tracker, and automatic stock allocation stream.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/availability"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition"
          >
            Check Product Stock <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/vendor-comparison"
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-lg transition"
          >
            Vendor Comparison
          </Link>
        </div>
      </div>

      {/* 10 KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${kpi.border} bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500 leading-tight">{kpi.label}</span>
                <div className={`p-2 rounded-lg ${kpi.bg} ${kpi.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">{kpi.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Visualizations Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Inventory Overview Bar Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Inventory Distribution by Category</h2>
              <p className="text-xs text-slate-500">Available vs Reserved vs Incoming Units</p>
            </div>
            <Link to="/inventory" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold">
              Manage Stock <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={inventoryOverview} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="category" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Bar dataKey="available" name="Available" fill="#16A34A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="reserved" name="Reserved" fill="#2563EB" radius={[4, 4, 0, 0]} />
                <Bar dataKey="incoming" name="Incoming" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stock Breakdown Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Total Stock State Ratio</h2>
            <p className="text-xs text-slate-500">Overall warehouse health breakdown</p>
          </div>
          <div className="h-60 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stockChart}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                >
                  {stockChart.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value} units`, 'Quantity']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-100">
            {stockChart.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                <span className="text-slate-600">{item.name}:</span>
                <span className="font-bold text-slate-900 ml-auto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visualizations Row 2: Monthly Procurement & Sales Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Procurement Expenses Line Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Procurement Expenditure Trend (₹)</h2>
              <p className="text-xs text-slate-500">Trailing spend across all external vendor POs</p>
            </div>
            <Link to="/procurement" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold">
              Procurement Hub <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={procurementExpenses} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']} />
                <Line type="monotone" dataKey="amount" name="Spend" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sales Order Statistics */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900">Sales Order Volume Trend</h2>
              <p className="text-xs text-slate-500">Customer orders processed per month</p>
            </div>
            <Link to="/sales-orders" className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-semibold">
              Orders List <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={salesStats} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: any) => [`${val} orders`, 'Orders']} />
                <Line type="monotone" dataKey="orders" name="Sales Orders" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Low Stock Alerts & Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Low-Stock & Shortage Alerts */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <div>
                <h2 className="text-base font-bold text-slate-900">Immediate Stock Replenishment Alerts</h2>
                <p className="text-xs text-slate-500">Products currently below threshold or at zero units</p>
              </div>
            </div>
            <Link to="/procurement" className="text-xs font-semibold text-blue-600 hover:underline">
              Auto-Restock View →
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3">Warehouse</th>
                  <th className="py-2.5 px-3">Available</th>
                  <th className="py-2.5 px-3">Reorder Point</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lowStockAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-slate-500">
                      All inventory levels are currently above reorder thresholds!
                    </td>
                  </tr>
                ) : (
                  lowStockAlerts.map((alert, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-3 font-semibold text-slate-900">{alert.product_name}</td>
                      <td className="py-3 px-3 font-mono text-slate-600">{alert.sku}</td>
                      <td className="py-3 px-3 text-slate-600">{alert.warehouse}</td>
                      <td className="py-3 px-3 font-bold text-slate-900">{alert.available}</td>
                      <td className="py-3 px-3 text-slate-500">{alert.reorder_level}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            alert.status === 'OUT_OF_STOCK'
                              ? 'bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-amber-100 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {alert.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          to={`/vendor-comparison?product_id=${alert.product_id}`}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-semibold text-[11px] transition inline-block"
                        >
                          Compare Vendors
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions & Audit Stream */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-slate-900">Inventory Activity Audit</h2>
              <span className="text-[11px] text-slate-400">Live movements</span>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {recentActivities.map((act) => (
                <div key={act.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          act.type === 'RECEIPT'
                            ? 'bg-emerald-500'
                            : act.type === 'ALLOCATION'
                            ? 'bg-blue-500'
                            : act.type === 'DAMAGE'
                            ? 'bg-rose-500'
                            : 'bg-amber-500'
                        }`}
                      ></span>
                      {act.type} ({act.reference_type || 'MOVEMENT'})
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      {new Date(act.created_at).toLocaleString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <div className={`font-bold font-mono text-sm ${act.quantity_change > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {act.quantity_change > 0 ? `+${act.quantity_change}` : act.quantity_change}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-center">
            <Link to="/inventory" className="text-xs text-blue-600 hover:text-blue-800 font-semibold">
              View Complete Audit Logs →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
