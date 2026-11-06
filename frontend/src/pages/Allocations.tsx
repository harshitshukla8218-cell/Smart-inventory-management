import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ProductAllocation } from '../types';
import { Layers, Undo2, CheckCircle, Clock, ShoppingCart, User } from 'lucide-react';

export const Allocations: React.FC = () => {
  const [allocations, setAllocations] = useState<ProductAllocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const fetchAllocations = async () => {
    try {
      const res = await api.get('/sales-orders/allocations/list');
      setAllocations(res.data);
    } catch (err) {
      console.error('Failed to load allocations', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, []);

  const handleReleaseAllocation = async (allocationId: string) => {
    try {
      await api.post(`/sales-orders/allocations/${allocationId}/release`);
      setNotice('✅ Allocation released successfully! Stock returned to warehouse available quantity.');
      fetchAllocations();
    } catch (err) {
      console.error('Failed to release allocation', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Layers className="w-6 h-6 text-blue-600" /> Automated Product Allocation Registry
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Lock-in reservations preventing duplicate order fulfillment and stock collisions across simultaneous orders.
        </p>
      </div>

      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
          <span className="text-sm font-semibold">{notice}</span>
          <button onClick={() => setNotice(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}

      {/* Allocations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900 flex items-center justify-between">
          <span>Active Warehouse Product Reservations</span>
          <span className="text-xs text-slate-400">Total Allocations: {allocations.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Sales Order #</th>
                <th className="py-3.5 px-4">Client</th>
                <th className="py-3.5 px-4">Allocated Product</th>
                <th className="py-3.5 px-4 text-center">Reserved Units</th>
                <th className="py-3.5 px-4">Allocation Status</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {allocations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No active stock allocations. Create sales orders to view automatic inventory locks.
                  </td>
                </tr>
              ) : (
                allocations.map((alloc) => (
                  <tr key={alloc.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-4 font-mono font-bold text-blue-600">
                      {alloc.sales_order?.order_number || 'SO-RECORD'}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-900">
                      {alloc.sales_order?.customer_name || 'Enterprise Customer'}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold text-slate-900">{alloc.product?.name}</div>
                      <span className="text-[10px] text-slate-400 font-mono">SKU: {alloc.product?.sku}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-black text-sm px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                        {alloc.quantity_allocated} units
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          alloc.status === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : alloc.status === 'FULFILLED'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {alloc.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-500">{new Date(alloc.allocated_at).toLocaleString()}</td>
                    <td className="py-4 px-4 text-right">
                      {alloc.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleReleaseAllocation(alloc.id)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded font-bold text-[11px] transition inline-flex items-center gap-1"
                          title="Release reserved stock back to warehouse availability"
                        >
                          <Undo2 className="w-3 h-3" /> Release Stock
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
    </div>
  );
};
