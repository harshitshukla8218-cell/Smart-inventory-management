import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { InventoryItem, InventoryTransaction, Warehouse } from '../types';
import {
  Warehouse as WarehouseIcon,
  Search,
  Filter,
  Plus,
  SlidersHorizontal,
  History,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Building2,
  Boxes,
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const [inventoryList, setInventoryList] = useState<InventoryItem[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [loading, setLoading] = useState(true);

  // Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustItem, setAdjustItem] = useState<InventoryItem | null>(null);
  const [adjustQtyChange, setAdjustQtyChange] = useState<number>(0);
  const [adjustType, setAdjustType] = useState('ADJUSTMENT');
  const [adjustNotes, setAdjustNotes] = useState('');

  // Transactions History Modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyItems, setHistoryItems] = useState<InventoryTransaction[]>([]);
  const [historyProduct, setHistoryProduct] = useState<string>('');

  const fetchInventory = async () => {
    try {
      const [invRes, whRes] = await Promise.all([
        api.get('/inventory'),
        api.get('/warehouses'),
      ]);
      setInventoryList(invRes.data);
      setWarehouses(whRes.data);
    } catch (err) {
      console.error('Failed to load inventory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const openAdjustModal = (item: InventoryItem) => {
    setAdjustItem(item);
    setAdjustQtyChange(0);
    setAdjustType('ADJUSTMENT');
    setAdjustNotes('');
    setShowAdjustModal(true);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem || adjustQtyChange === 0) return;

    try {
      await api.post(`/inventory/${adjustItem.id}/adjust`, {
        quantity_change: adjustQtyChange,
        transaction_type: adjustType,
        notes: adjustNotes || 'Manual stock adjustment by inventory manager',
      });
      setShowAdjustModal(false);
      fetchInventory();
    } catch (err) {
      console.error('Failed to adjust stock', err);
    }
  };

  const openHistoryModal = async (item: InventoryItem) => {
    setHistoryProduct(item.product?.name || 'Item History');
    try {
      const res = await api.get(`/inventory/${item.id}/transactions`);
      setHistoryItems(res.data);
      setShowHistoryModal(true);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    }
  };

  const filteredInventory = inventoryList.filter((item) => {
    const matchesSearch =
      item.product?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product?.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.product?.brand?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWarehouse = !selectedWarehouse || item.warehouse_id === selectedWarehouse;
    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'OUT' && item.available_quantity === 0) ||
      (statusFilter === 'LOW' && item.available_quantity > 0 && item.available_quantity <= item.reorder_level);
    return matchesSearch && matchesWarehouse && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <WarehouseIcon className="w-6 h-6 text-blue-600" /> Multi-Warehouse Inventory Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track available, reserved, incoming, and damaged quantities across all distribution hubs with verified transaction history.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search product, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Warehouse Dropdown */}
          <select
            value={selectedWarehouse}
            onChange={(e) => setSelectedWarehouse(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="">All Warehouses</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>

          {/* Status Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded transition ${
                statusFilter === 'ALL' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Stock
            </button>
            <button
              onClick={() => setStatusFilter('LOW')}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                statusFilter === 'LOW' ? 'bg-amber-500 text-white shadow' : 'text-amber-700 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3" /> Low Stock
            </button>
            <button
              onClick={() => setStatusFilter('OUT')}
              className={`px-2.5 py-1 rounded transition flex items-center gap-1 ${
                statusFilter === 'OUT' ? 'bg-rose-600 text-white shadow' : 'text-rose-700 hover:bg-rose-100'
              }`}
            >
              <XCircle className="w-3 h-3" /> Out of Stock
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-semibold">
          Showing {filteredInventory.length} matching warehouse records
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Product Name & SKU</th>
                <th className="py-3.5 px-4">Warehouse</th>
                <th className="py-3.5 px-4 text-center">Total Stock</th>
                <th className="py-3.5 px-4 text-center">Available Stock</th>
                <th className="py-3.5 px-4 text-center">Reserved Stock</th>
                <th className="py-3.5 px-4 text-center">Incoming POs</th>
                <th className="py-3.5 px-4 text-center">Damaged</th>
                <th className="py-3.5 px-4 text-center">Reorder Point</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredInventory.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500">
                    No inventory records match the current filter criteria.
                  </td>
                </tr>
              ) : (
                filteredInventory.map((item) => {
                  const isOutOfStock = item.available_quantity === 0;
                  const isLowStock = !isOutOfStock && item.available_quantity <= item.reorder_level;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm">{item.product?.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          SKU: {item.product?.sku} | {item.product?.brand}
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-700">
                        {item.warehouse?.name}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-slate-900">{item.total_quantity}</td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`font-black text-sm px-2.5 py-0.5 rounded-full ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-700'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          {item.available_quantity}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-blue-600">{item.reserved_quantity}</td>
                      <td className="py-4 px-4 text-center font-bold text-amber-600">
                        {item.incoming_quantity > 0 ? `+${item.incoming_quantity}` : '0'}
                      </td>
                      <td className="py-4 px-4 text-center text-rose-600 font-bold">{item.damaged_quantity}</td>
                      <td className="py-4 px-4 text-center text-slate-500 font-medium">{item.reorder_level}</td>
                      <td className="py-4 px-4 text-center">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 uppercase">
                            Out of Stock
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700 uppercase">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-700 uppercase">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right space-x-1.5">
                        <button
                          onClick={() => openAdjustModal(item)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold text-[11px] transition inline-flex items-center gap-1"
                          title="Adjust stock"
                        >
                          <SlidersHorizontal className="w-3 h-3" /> Adjust
                        </button>
                        <button
                          onClick={() => openHistoryModal(item)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded font-bold text-[11px] transition inline-flex items-center gap-1"
                          title="Movement History"
                        >
                          <History className="w-3 h-3" /> Audit
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Stock Adjustment Modal */}
      {showAdjustModal && adjustItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Manual Stock Adjustment</h2>
            <div className="p-3 bg-slate-50 rounded-xl text-xs">
              <span className="font-bold text-slate-900 block">{adjustItem.product?.name}</span>
              <span className="text-slate-500">
                Warehouse: {adjustItem.warehouse?.name} | Current Available: {adjustItem.available_quantity} units
              </span>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Adjustment Type</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                >
                  <option value="ADJUSTMENT">Physical Count Variance (Adjustment)</option>
                  <option value="DAMAGE">Damaged Units Quarantine</option>
                  <option value="RETURN">Customer Return Inward</option>
                  <option value="ISSUE">Internal Consumption / R&D</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Quantity Change (+ for inward, - for write-off)
                </label>
                <input
                  type="number"
                  value={adjustQtyChange}
                  onChange={(e) => setAdjustQtyChange(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Audit Justification / Reason</label>
                <textarea
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="e.g. Monthly physical audit count adjustment..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition"
                >
                  Save & Log Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Movement Audit History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Inventory Movement Audit Trail</h2>
                <span className="text-xs text-slate-500 font-semibold">{historyProduct}</span>
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100 text-xs">
              {historyItems.length === 0 ? (
                <p className="p-6 text-center text-slate-500">No transaction records logged yet.</p>
              ) : (
                historyItems.map((h) => (
                  <div key={h.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            h.transaction_type === 'RECEIPT'
                              ? 'bg-emerald-500'
                              : h.transaction_type === 'ALLOCATION'
                              ? 'bg-blue-500'
                              : h.transaction_type === 'DAMAGE'
                              ? 'bg-rose-500'
                              : 'bg-amber-500'
                          }`}
                        ></span>
                        {h.transaction_type} ({h.reference_type || 'STOCK_EVENT'})
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">{h.notes || 'Automated stock operation'}</p>
                      <span className="text-[10px] text-slate-400">{new Date(h.created_at).toLocaleString()}</span>
                    </div>

                    <div className="text-right">
                      <div className={`font-black text-sm ${h.quantity_change > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {h.quantity_change > 0 ? `+${h.quantity_change}` : h.quantity_change}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {h.quantity_before} → {h.quantity_after}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
