import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { PurchaseOrder, POStatus } from '../types';
import {
  FileText,
  Download,
  Printer,
  Truck,
  CheckCircle,
  Clock,
  ExternalLink,
  CreditCard,
  Building2,
  Calendar,
} from 'lucide-react';

export const PurchaseOrders: React.FC = () => {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  const fetchPOs = async () => {
    try {
      const res = await api.get('/purchase-orders');
      setPurchaseOrders(res.data);
      if (res.data.length > 0 && !selectedPO) {
        setSelectedPO(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load purchase orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPOs();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: POStatus) => {
    try {
      await api.put(`/purchase-orders/${id}/status`, { status: newStatus });
      fetchPOs();
      if (selectedPO?.id === id) {
        setSelectedPO((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } catch (err) {
      console.error('Failed to update PO status', err);
    }
  };

  const getStatusBadge = (status: POStatus) => {
    switch (status) {
      case 'DRAFT':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">Draft</span>;
      case 'PENDING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">Pending Approval</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">Approved</span>;
      case 'ORDERED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-300">Ordered</span>;
      case 'SHIPPED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 text-cyan-800 border border-cyan-300">In Transit</span>;
      case 'PARTIALLY_RECEIVED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-100 text-orange-800 border border-orange-300">Partially Received</span>;
      case 'RECEIVED':
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">Received at Warehouse</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" /> Purchase Order (PO) Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate, track vendor delivery milestones, authorization states, and download official PDF order documents.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Orders List */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-200 font-bold text-sm text-slate-900 flex items-center justify-between">
            <span>Purchase Orders ({purchaseOrders.length})</span>
            <span className="text-xs text-slate-400">Click to preview document</span>
          </div>
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-[700px]">
            {purchaseOrders.length === 0 ? (
              <p className="p-6 text-xs text-slate-500 text-center">No purchase orders created yet.</p>
            ) : (
              purchaseOrders.map((po) => {
                const isSelected = selectedPO?.id === po.id;
                return (
                  <div
                    key={po.id}
                    onClick={() => setSelectedPO(po)}
                    className={`p-4 cursor-pointer transition ${
                      isSelected ? 'bg-blue-50/60 border-l-4 border-blue-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-600 text-xs">{po.po_number}</span>
                      {getStatusBadge(po.status)}
                    </div>
                    <div className="font-bold text-slate-900 text-sm mt-1">{po.vendor?.name}</div>
                    <div className="flex items-center justify-between text-xs text-slate-500 mt-2">
                      <span className="font-black text-slate-900">
                        ₹{Number(po.total_amount).toLocaleString('en-IN')}
                      </span>
                      <span>{new Date(po.order_date).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Detailed PO Document View */}
        <div className="lg:col-span-2">
          {selectedPO ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              {/* Document Header Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Status Action:</span>
                  <select
                    value={selectedPO.status}
                    onChange={(e) => handleUpdateStatus(selectedPO.id, e.target.value as POStatus)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-800"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="PENDING">PENDING</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="ORDERED">ORDERED</option>
                    <option value="SHIPPED">SHIPPED</option>
                    <option value="PARTIALLY_RECEIVED">PARTIALLY_RECEIVED</option>
                    <option value="RECEIVED">RECEIVED</option>
                    <option value="COMPLETED">COMPLETED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Printer className="w-4 h-4" /> Print Document
                  </button>
                  <button
                    onClick={() => window.print()}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <Download className="w-4 h-4" /> Download PO PDF
                  </button>
                </div>
              </div>

              {/* Printable Formal Purchase Order Container */}
              <div className="p-8 border border-slate-200 rounded-xl bg-slate-50/30 space-y-6 font-sans">
                {/* Official Letterhead */}
                <div className="flex justify-between items-start border-b border-slate-300 pb-6">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">SMART INVENTORY CORP.</h2>
                    <p className="text-xs text-slate-500 mt-1">Enterprise Procurement & Logistics Division</p>
                    <p className="text-xs text-slate-500">GSTIN: 27AAACS1234F1Z8 | corporate@smartinventory.com</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest block">Official Purchase Order</span>
                    <span className="text-xl font-mono font-black text-slate-900 mt-1 block">{selectedPO.po_number}</span>
                    <span className="text-xs text-slate-500 block mt-1">Date: {new Date(selectedPO.order_date).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Vendor & Shipping Address Grid */}
                <div className="grid grid-cols-2 gap-8 text-xs">
                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Vendor / Supplier:</span>
                    <div className="font-bold text-slate-900 text-sm">{selectedPO.vendor?.name}</div>
                    <p className="text-slate-600 mt-0.5">{selectedPO.vendor?.address || 'Authorized Vendor Facility'}</p>
                    <p className="text-slate-600">Email: {selectedPO.vendor?.email || 'vendor@portal.com'}</p>
                    <p className="text-slate-600">Phone: {selectedPO.vendor?.phone || '+91-1800-SUPPLIER'}</p>
                  </div>

                  <div>
                    <span className="font-bold text-slate-500 uppercase tracking-wider block mb-1">Ship-To Facility:</span>
                    <div className="font-bold text-slate-900 text-sm">Central Warehouse Inward Bay</div>
                    <p className="text-slate-600 mt-0.5">Plot 42, Logistics Park, Sector 3, Mumbai</p>
                    <p className="text-slate-600">
                      Expected Delivery: <span className="font-bold text-slate-900">{selectedPO.expected_delivery_date || 'Within 5 Business Days'}</span>
                    </p>
                    <p className="text-slate-600">Payment Terms: Net 30 ({selectedPO.payment_status})</p>
                  </div>
                </div>

                {/* PO Items Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">Item Description</th>
                        <th className="py-2.5 px-3 text-right">Ordered Qty</th>
                        <th className="py-2.5 px-3 text-right">Unit Price (₹)</th>
                        <th className="py-2.5 px-3 text-right">Total Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedPO.items && selectedPO.items.length > 0 ? (
                        selectedPO.items.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-3 px-3">
                              <div className="font-bold text-slate-900">{item.product?.name || 'Enterprise Hardware'}</div>
                              <span className="text-[10px] text-slate-400 font-mono">SKU: {item.product?.sku}</span>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-slate-800">{item.quantity_ordered}</td>
                            <td className="py-3 px-3 text-right text-slate-800">
                              ₹{Number(item.unit_price).toLocaleString('en-IN')}
                            </td>
                            <td className="py-3 px-3 text-right font-black text-slate-900">
                              ₹{Number(item.total_price).toLocaleString('en-IN')}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-slate-400">
                            Line items recorded in requisition master.
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
                      <tr>
                        <td colSpan={3} className="py-3 px-3 text-right text-slate-600 uppercase">
                          Grand Total (Inclusive of Taxes):
                        </td>
                        <td className="py-3 px-3 text-right text-base text-blue-600 font-black">
                          ₹{Number(selectedPO.total_amount).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Terms and Sign-off */}
                <div className="pt-4 border-t border-slate-200 flex justify-between items-end text-[11px] text-slate-500">
                  <div>
                    <span className="font-bold text-slate-700 block mb-1">Standard PO Instructions:</span>
                    <p>1. Inward gate check requires original physical tax invoice and DC.</p>
                    <p>2. Damaged or opened packaging will be rejected at inward dock inspection.</p>
                  </div>
                  <div className="text-right">
                    <div className="w-36 border-b border-slate-400 mb-1"></div>
                    <span className="font-bold text-slate-700">Authorized Procurement Officer</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
              Select a purchase order to view details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
