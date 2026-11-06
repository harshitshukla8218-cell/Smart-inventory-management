import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { SalesOrder, SalesOrderStatus, Product, Warehouse } from '../types';
import {
  ClipboardList,
  Plus,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
  TrendingDown,
  User,
  ShoppingBag,
  ExternalLink,
  Truck,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const SalesOrders: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [quantity, setQuantity] = useState(5);
  const [priority, setPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [orderNotes, setOrderNotes] = useState('');
  const [allocationNotice, setAllocationNotice] = useState<any | null>(null);
  const [dailySummary, setDailySummary] = useState<{
    date: string;
    completed_orders: number;
    units_sold: number;
    revenue: number;
  } | null>(null);

  const fetchOrders = async () => {
    try {
      const [ordRes, prodRes, whRes, dailyRes] = await Promise.all([
        api.get('/sales-orders'),
        api.get('/products'),
        api.get('/warehouses'),
        api.get('/reports/sales/daily'),
      ]);
      setOrders(ordRes.data);
      setProducts(prodRes.data);
      setWarehouses(whRes.data);
      setDailySummary(dailyRes.data);
      if (prodRes.data.length > 0 && !selectedProductId) {
        setSelectedProductId(prodRes.data[0].id);
      }
      if (whRes.data.length > 0 && !selectedWarehouseId) {
        setSelectedWarehouseId(whRes.data[0].id);
      }
      if (ordRes.data.length > 0 && !selectedOrder) {
        setSelectedOrder(ordRes.data[0]);
      } else if (selectedOrder) {
        setSelectedOrder(ordRes.data.find((order: SalesOrder) => order.id === selectedOrder.id) || null);
      }
    } catch (err) {
      console.error('Failed to load orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !selectedProductId || quantity <= 0) return;

    try {
      const res = await api.post('/sales-orders', {
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        warehouse_id: selectedWarehouseId || null,
        priority: priority,
        notes: orderNotes,
        items: [
          {
            product_id: selectedProductId,
            quantity_requested: quantity,
            unit_price: products.find((product) => product.id === selectedProductId)?.unit_price || 0,
          },
        ],
      });

      setShowCreateModal(false);
      setAllocationNotice(res.data);
      // Reset
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setOrderNotes('');
      fetchOrders();
    } catch (err) {
      console.error('Failed to create sales order:', err);
    }
  };

  const handleManualAllocate = async (orderId: string) => {
    try {
      const res = await api.post(`/sales-orders/${orderId}/allocate`);
      setAllocationNotice(res.data);
      fetchOrders();
    } catch (err) {
      console.error('Allocation error', err);
    }
  };

  const handleDispatch = async (orderId: string) => {
    try {
      const response = await api.post(`/sales-orders/${orderId}/dispatch`);
      setAllocationNotice({
        message: `${response.data.order_number} dispatched. Inventory and the daily sales report have been updated.`,
      });
      await fetchOrders();
    } catch (error) {
      const detail = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setAllocationNotice({ message: detail || 'Could not dispatch this order.' });
    }
  };

  const getStatusBadge = (status: SalesOrderStatus) => {
    switch (status) {
      case 'FULLY_ALLOCATED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Fully Allocated (100%)</span>;
      case 'PARTIALLY_ALLOCATED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Partially Allocated</span>;
      case 'AWAITING_STOCK':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">Awaiting Inward Stock</span>;
      case 'PROCESSING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">Processing</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">Dispatched & Completed</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'URGENT':
        return <span className="text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">URGENT</span>;
      case 'HIGH':
        return <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">HIGH</span>;
      default:
        return <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">NORMAL</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-blue-600" /> Sales Orders & Real-time Auto-Allocation
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated stock reservation on order creation, partial fulfillment calculation, and automated shortage procurement linking.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Create Sales Order
        </button>
      </div>

      {allocationNotice && (
        <div className="p-4 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0" />
            <span className="text-sm font-semibold">
              {allocationNotice.message || 'Auto-allocation engine evaluated inventory and updated reserved quantities.'}
            </span>
          </div>
          <button
            onClick={() => setAllocationNotice(null)}
            className="text-blue-700 hover:text-blue-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {dailySummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-500">Completed orders today</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{dailySummary.completed_orders}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-500">Units sold today</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">{dailySummary.units_sold}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-semibold text-slate-500">Sales value today (catalog price)</p>
            <p className="mt-1 text-2xl font-extrabold text-slate-900">
              {dailySummary.revenue.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
            </p>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900 flex items-center justify-between">
          <span>Sales Orders List</span>
          <span className="text-xs text-slate-400">Total Orders: {orders.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Order #</th>
                <th className="py-3.5 px-4">Client / Enterprise</th>
                <th className="py-3.5 px-4">Priority</th>
                <th className="py-3.5 px-4">Warehouse</th>
                <th className="py-3.5 px-4">Allocation State</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No sales orders logged yet. Click "Create Sales Order" above.
                  </td>
                </tr>
              ) : (
                orders.map((so) => (
                  <tr
                    key={so.id}
                    onClick={() => setSelectedOrder(so)}
                    className="hover:bg-slate-50/80 cursor-pointer transition"
                  >
                    <td className="py-4 px-4 font-mono font-bold text-blue-600 text-sm">{so.order_number}</td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{so.customer_name}</div>
                      <span className="text-[10px] text-slate-400">{so.customer_email || 'B2B Client'}</span>
                    </td>
                    <td className="py-4 px-4">{getPriorityBadge(so.priority)}</td>
                    <td className="py-4 px-4 text-slate-600 font-medium">
                      {so.warehouse?.name || 'All Regional Hubs'}
                    </td>
                    <td className="py-4 px-4">{getStatusBadge(so.status)}</td>
                    <td className="py-4 px-4 text-slate-500">{new Date(so.created_at).toLocaleDateString()}</td>
                    <td className="py-4 px-4 text-right">
                      {!['FULLY_ALLOCATED', 'COMPLETED', 'CANCELLED'].includes(so.status) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleManualAllocate(so.id);
                          }}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-bold text-[11px] transition inline-flex items-center gap-1"
                        >
                          <Layers className="w-3 h-3" /> Re-Allocate Stock
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Order Allocation Breakdown Drawer/Card */}
      {selectedOrder && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">Active Order Details</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {selectedOrder.order_number} — {selectedOrder.customer_name}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(selectedOrder.status)}
              {selectedOrder.status === 'FULLY_ALLOCATED' && (
                <button
                  onClick={() => handleDispatch(selectedOrder.id)}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-2"
                >
                  <Truck className="w-4 h-4" /> Dispatch Order
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3">SKU</th>
                  <th className="py-2.5 px-3 text-right">Requested</th>
                  <th className="py-2.5 px-3 text-right">Allocated (Reserved)</th>
                  <th className="py-2.5 px-3 text-right">Pending Shortage</th>
                  <th className="py-2.5 px-3 text-right">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {selectedOrder.items && selectedOrder.items.length > 0 ? (
                  selectedOrder.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-3 px-3 font-semibold text-slate-900">{item.product?.name || 'Hardware Unit'}</td>
                      <td className="py-3 px-3 font-mono text-slate-500">{item.product?.sku}</td>
                      <td className="py-3 px-3 text-right font-bold text-slate-900">{item.quantity_requested}</td>
                      <td className="py-3 px-3 text-right font-black text-emerald-600">{item.quantity_allocated}</td>
                      <td className="py-3 px-3 text-right font-black text-rose-600">{item.quantity_pending}</td>
                      <td className="py-3 px-3 text-right">
                        {item.quantity_pending === 0 ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                            100% Reserved
                          </span>
                        ) : item.quantity_allocated > 0 ? (
                          <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">
                            Partially Filled ({item.quantity_allocated}/{item.quantity_requested})
                          </span>
                        ) : (
                          <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded">
                            Awaiting Procurement
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-3 px-3 text-center text-slate-400">
                      Standard allocation items recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Create New Enterprise Sales Order</h2>
            <p className="text-xs text-slate-500">
              The automated allocation engine will check warehouse stock immediately upon submission.
            </p>

            <form onSubmit={handleCreateOrder} className="space-y-4 text-xs pt-1">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Customer / Organization Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Wipro Digital Enterprise"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Email</label>
                  <input
                    type="email"
                    placeholder="orders@client.com"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Customer Phone</label>
                  <input
                    type="text"
                    placeholder="+91-98..."
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Select Product</label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Order Qty</label>
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preferred Hub</label>
                  <select
                    value={selectedWarehouseId}
                    onChange={(e) => setSelectedWarehouseId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                  >
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Order Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                  >
                    <option value="NORMAL">Normal Priority</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent (First in Queue)</option>
                    <option value="LOW">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition"
                >
                  Submit & Auto-Allocate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
