import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { WarehouseReceipt, Warehouse, PurchaseOrder } from '../types';
import {
  Truck,
  Plus,
  CheckCircle2,
  AlertTriangle,
  PackageCheck,
  Building,
  ShieldCheck,
  Layers,
  ArrowRight,
  Boxes,
} from 'lucide-react';

export const WarehousePage: React.FC = () => {
  const [receipts, setReceipts] = useState<WarehouseReceipt[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeReceipt, setActiveReceipt] = useState<WarehouseReceipt | null>(null);

  // Inward Inspection Inputs
  const [receivedQty, setReceivedQty] = useState<number>(0);
  const [damagedQty, setDamagedQty] = useState<number>(0);
  const [itemCondition, setItemCondition] = useState<'GOOD' | 'DAMAGED' | 'PARTIAL'>('GOOD');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [confirmationAlert, setConfirmationAlert] = useState<string | null>(null);

  // New Receipt Form
  const [newPoId, setNewPoId] = useState('');
  const [newWhId, setNewWhId] = useState('');

  const fetchWarehouseData = async () => {
    try {
      const [recRes, whRes, poRes] = await Promise.all([
        api.get('/warehouse/receipts'),
        api.get('/warehouses'),
        api.get('/purchase-orders'),
      ]);
      setReceipts(recRes.data);
      setWarehouses(whRes.data);
      setPurchaseOrders(poRes.data);
      if (whRes.data.length > 0) setNewWhId(whRes.data[0].id);
      if (poRes.data.length > 0) setNewPoId(poRes.data[0].id);
    } catch (err) {
      console.error('Failed to load warehouse data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouseData();
  }, []);

  const openConfirmModal = (receipt: WarehouseReceipt) => {
    setActiveReceipt(receipt);
    const firstItem = receipt.items?.[0];
    setReceivedQty(firstItem?.expected_quantity || 10);
    setDamagedQty(0);
    setItemCondition('GOOD');
    setReceiptNotes('');
    setShowConfirmModal(true);
  };

  const handleConfirmArrival = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReceipt) return;

    try {
      const res = await api.post(`/warehouse/receipts/${activeReceipt.id}/confirm`, {
        received_quantity: receivedQty,
        damaged_quantity: damagedQty,
        condition: itemCondition,
        notes: receiptNotes || 'Inward dock verified and physical QC completed.',
      });

      setShowConfirmModal(false);
      setConfirmationAlert(
        `✅ ${res.data.message || 'Warehouse receipt verified! Stock updated, pending orders checked, and arrival notifications sent.'}`
      );
      fetchWarehouseData();
    } catch (err) {
      console.error('Failed to confirm receipt', err);
    }
  };

  const handleCreateReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhId) return;

    try {
      await api.post('/warehouse/receipts', {
        purchase_order_id: newPoId || null,
        warehouse_id: newWhId,
        notes: 'Inward shipment scheduled for gate verification',
      });
      setShowCreateModal(false);
      fetchWarehouseData();
    } catch (err) {
      console.error('Failed to create receipt', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-blue-600" /> Warehouse Inward Logistics & Arrival Verification
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Verify arriving vendor shipments, inspect item condition, automatically update live inventory, and trigger sales order allocations.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Create Inward Gate Pass
        </button>
      </div>

      {confirmationAlert && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-semibold">{confirmationAlert}</span>
          </div>
          <button
            onClick={() => setConfirmationAlert(null)}
            className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Warehouse Locations Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {warehouses.map((w) => (
          <div key={w.id} className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm flex items-start gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900 text-sm">{w.name}</div>
              <p className="text-xs text-slate-500 mt-0.5">{w.location || 'Fulfillment Center'}</p>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 mt-2 bg-emerald-50 px-2 py-0.5 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Active Receiving Dock
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Inward Receipts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900 flex items-center justify-between">
          <span>Inward Shipment Gate Receipts</span>
          <span className="text-xs text-slate-400">Step 1 to Step 5 Arrival Automation</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Receipt Number</th>
                <th className="py-3.5 px-4">Associated PO</th>
                <th className="py-3.5 px-4">Destination Hub</th>
                <th className="py-3.5 px-4">Receiver</th>
                <th className="py-3.5 px-4">Receipt Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Inward Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {receipts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No warehouse arrival receipts found. Generate a gate pass to receive incoming stock.
                  </td>
                </tr>
              ) : (
                receipts.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-4 font-mono font-bold text-blue-600 text-sm">{rec.receipt_number}</td>
                    <td className="py-4 px-4 font-mono font-medium text-slate-700">
                      {rec.purchase_order?.po_number || 'Direct Inward'}
                    </td>
                    <td className="py-4 px-4 font-semibold text-slate-900">{rec.warehouse?.name}</td>
                    <td className="py-4 px-4 text-slate-600">{rec.receiver?.full_name || 'Warehouse Staff'}</td>
                    <td className="py-4 px-4 text-slate-500">{new Date(rec.receipt_date).toLocaleDateString()}</td>
                    <td className="py-4 px-4">
                      {rec.status === 'COMPLETED' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Stock Updated
                        </span>
                      ) : rec.status === 'PARTIAL' ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          Partial Inward
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                          Awaiting Inspection
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {rec.status !== 'COMPLETED' ? (
                        <button
                          onClick={() => openConfirmModal(rec)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition inline-flex items-center gap-1.5"
                        >
                          <PackageCheck className="w-3.5 h-3.5" /> Verify & Receive Stock
                        </button>
                      ) : (
                        <span className="text-emerald-600 font-bold inline-flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Received
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Arrival Verification & QC Modal */}
      {showConfirmModal && activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Confirm Warehouse Arrival & QC</h2>
                <p className="text-xs text-slate-500">
                  Receipt #{activeReceipt.receipt_number} | PO: {activeReceipt.purchase_order?.po_number || 'Ad-hoc'}
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmArrival} className="space-y-4 text-xs pt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Good Units Received</label>
                  <input
                    type="number"
                    min={0}
                    value={receivedQty}
                    onChange={(e) => setReceivedQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-emerald-700"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Will be added to Available Stock</span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Damaged / Rejected Units</label>
                  <input
                    type="number"
                    min={0}
                    value={damagedQty}
                    onChange={(e) => setDamagedQty(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-rose-700"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Recorded under Damaged Inventory</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Package & Box Physical Condition</label>
                <select
                  value={itemCondition}
                  onChange={(e) => setItemCondition(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                >
                  <option value="GOOD">Good Condition (Factory Sealed Packaging)</option>
                  <option value="PARTIAL">Partial Quantity Arrived (Remaining pending)</option>
                  <option value="DAMAGED">Damaged in Transit / Seal Broken</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">QC Verification Notes / Gate Remarks</label>
                <textarea
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  placeholder="e.g. Serial numbers verified against delivery challan..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                />
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
                <span className="font-bold block mb-1">⚡ Automatic System Workflow:</span>
                <p>1. Adds {receivedQty} unit(s) to live available inventory.</p>
                <p>2. Automatically scans pending sales orders and allocates stock.</p>
                <p>3. Dispatches notifications to Sales & Procurement leads.</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Confirm & Update Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Gate Pass Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Create Inward Gate Receipt</h2>
            <form onSubmit={handleCreateReceipt} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Purchase Order</label>
                <select
                  value={newPoId}
                  onChange={(e) => setNewPoId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                >
                  <option value="">Direct Arrival (Without PO)</option>
                  {purchaseOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.po_number} - {po.vendor?.name} (₹{Number(po.total_amount).toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Receiving Warehouse Location</label>
                <select
                  value={newWhId}
                  onChange={(e) => setNewWhId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.location})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition"
                >
                  Create Gate Pass
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
