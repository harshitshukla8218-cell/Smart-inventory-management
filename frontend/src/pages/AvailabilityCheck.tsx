import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Product, Warehouse } from '../types';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Layers,
  ShoppingBag,
  ArrowRight,
  TrendingDown,
  Warehouse as WarehouseIcon,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const AvailabilityCheck: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [requestedQuantity, setRequestedQuantity] = useState<number>(10);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [procurementCreated, setProcurementCreated] = useState<any | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        const [prodRes, whRes] = await Promise.all([
          api.get('/products'),
          api.get('/warehouses'),
        ]);
        setProducts(prodRes.data);
        setWarehouses(whRes.data);
        if (prodRes.data.length > 0) {
          setSelectedProductId(prodRes.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load products/warehouses', err);
      }
    };
    loadMetadata();
  }, []);

  const handleCheckAvailability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || requestedQuantity <= 0) return;

    setLoading(true);
    setProcurementCreated(null);
    try {
      const res = await api.post('/inventory/availability/check', {
        product_id: selectedProductId,
        quantity_requested: requestedQuantity,
        warehouse_id: selectedWarehouseId || null,
      });
      setResult(res.data);
    } catch (err) {
      console.error('Availability check error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateProcurement = async () => {
    if (!result || !selectedProductId) return;
    setLoading(true);
    try {
      const res = await api.post('/procurement', {
        product_id: selectedProductId,
        required_quantity: requestedQuantity,
        available_quantity: result.total_available,
        shortage_quantity: result.shortage_quantity,
        notes: `Automated shortage trigger from stock availability check for ${requestedQuantity} units.`,
      });
      setProcurementCreated(res.data);
    } catch (err) {
      console.error('Failed to auto-create procurement request:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Availability & Shortage Detection</h1>
        <p className="text-sm text-slate-500 mt-1">
          Perform real-time warehouse inventory checks, calculate shortages, and initiate automated procurement and vendor comparison workflows.
        </p>
      </div>

      {/* Input Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleCheckAvailability} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Product Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Select Product
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku})
                  </option>
                ))}
              </select>
            </div>

            {/* Requested Quantity */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Required Units
              </label>
              <input
                type="number"
                min={1}
                value={requestedQuantity}
                onChange={(e) => setRequestedQuantity(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Warehouse Filter (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Warehouse Location
              </label>
              <select
                value={selectedWarehouseId}
                onChange={(e) => setSelectedWarehouseId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Warehouses (Global Stock)</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition disabled:opacity-50"
            >
              <Search className="w-4 h-4" /> {loading ? 'Checking Stock...' : 'Check Availability'}
            </button>
          </div>
        </form>
      </div>

      {/* Results View */}
      {result && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          {/* Status Header */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              result.available && result.shortage_quantity === 0
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : result.total_available > 0
                ? 'bg-amber-50 border-amber-200 text-amber-900'
                : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {result.available && result.shortage_quantity === 0 ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-7 h-7 text-amber-600 flex-shrink-0" />
              )}
              <div>
                <h3 className="font-bold text-base">
                  {result.available && result.shortage_quantity === 0
                    ? 'Full Stock Available in Warehouse!'
                    : result.total_available > 0
                    ? `Partial Stock Available (${result.total_available} of ${requestedQuantity} units)`
                    : 'Critical Stock Shortage: 0 Available Units!'}
                </h3>
                <p className="text-xs opacity-90 mt-0.5">
                  {result.shortage_quantity > 0
                    ? `Shortage of ${result.shortage_quantity} unit(s) must be procured from external authorized suppliers.`
                    : 'Requested quantity can be immediately allocated to sales orders.'}
                </p>
              </div>
            </div>

            <span className="text-2xl font-extrabold font-mono">
              {result.total_available} / {requestedQuantity}
            </span>
          </div>

          {/* Detailed Statistics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Required Quantity</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{requestedQuantity} units</div>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available in Warehouse</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">{result.total_available} units</div>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Calculated Shortage</span>
              <div
                className={`text-2xl font-black mt-1 ${
                  result.shortage_quantity > 0 ? 'text-rose-600' : 'text-slate-400'
                }`}
              >
                {result.shortage_quantity} units
              </div>
            </div>
          </div>

          {/* Warehouse Breakdown */}
          {result.breakdown && result.breakdown.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                <WarehouseIcon className="w-4 h-4 text-blue-600" /> Warehouse Inventory Breakdown
              </h4>
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Warehouse</th>
                      <th className="py-2.5 px-3">Total Quantity</th>
                      <th className="py-2.5 px-3">Available</th>
                      <th className="py-2.5 px-3">Reserved</th>
                      <th className="py-2.5 px-3">Incoming</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.breakdown.map((wh: any, i: number) => (
                      <tr key={i} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{wh.warehouse_name}</td>
                        <td className="py-2.5 px-3">{wh.total_quantity}</td>
                        <td className="py-2.5 px-3 font-bold text-emerald-600">{wh.available_quantity}</td>
                        <td className="py-2.5 px-3 text-blue-600">{wh.reserved_quantity}</td>
                        <td className="py-2.5 px-3 text-amber-600">{wh.incoming_quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Action Trigger Buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
            {result.shortage_quantity > 0 ? (
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {!procurementCreated ? (
                  <button
                    onClick={handleGenerateProcurement}
                    disabled={loading}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-lg shadow-sm transition flex items-center gap-2"
                  >
                    <TrendingDown className="w-4 h-4" /> Auto-Generate Procurement Request ({result.shortage_quantity} units)
                  </button>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 font-bold bg-emerald-50 px-4 py-2 rounded-lg border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4" /> Request Created: {procurementCreated.request_number}
                  </div>
                )}

                <Link
                  to={`/vendor-comparison?product_id=${selectedProductId}`}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg shadow-sm transition flex items-center gap-2"
                >
                  Compare Vendors (Amazon, Flipkart, Meesho) <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ) : (
              <Link
                to="/sales-orders"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-sm transition flex items-center gap-2"
              >
                <Layers className="w-4 h-4" /> Allocate Against Sales Order
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
