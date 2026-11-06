import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Product, VendorProduct } from '../types';
import {
  Scale,
  Award,
  Zap,
  Star,
  ExternalLink,
  Filter,
  CheckCircle,
  Truck,
  IndianRupee,
  ShoppingBag,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const VendorComparison: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialProductId = searchParams.get('product_id') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId);
  const [comparisonItems, setComparisonItems] = useState<VendorProduct[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'cheapest' | 'fastest' | 'rating'>('all');
  const [loading, setLoading] = useState(false);
  const [selectedVendorSuccess, setSelectedVendorSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products');
        setProducts(res.data);
        if (!selectedProductId && res.data.length > 0) {
          setSelectedProductId(res.data[0].id);
        }
      } catch (err) {
        console.error('Failed to load products', err);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (!selectedProductId) return;

    const fetchComparison = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/vendors/products/compare?product_id=${selectedProductId}`);
        setComparisonItems(res.data);
      } catch (err) {
        console.error('Failed to load vendor comparisons', err);
      } finally {
        setLoading(false);
      }
    };

    fetchComparison();
  }, [selectedProductId]);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  // Identify Best Options
  const sortedByPrice = [...comparisonItems].sort(
    (a, b) => Number(a.unit_price) + Number(a.delivery_charges) - (Number(b.unit_price) + Number(b.delivery_charges))
  );
  const cheapestId = sortedByPrice[0]?.id;

  const sortedByDelivery = [...comparisonItems].sort((a, b) => a.delivery_days_estimate - b.delivery_days_estimate);
  const fastestId = sortedByDelivery[0]?.id;

  const sortedByRating = [...comparisonItems].sort((a, b) => b.rating - a.rating);
  const highestRatingId = sortedByRating[0]?.id;

  // Best overall: balanced composite score
  const bestOverallId = sortedByPrice[0]?.id || sortedByDelivery[0]?.id;

  const filteredItems = [...comparisonItems].sort((a, b) => {
    if (filterMode === 'cheapest') {
      return Number(a.unit_price) + Number(a.delivery_charges) - (Number(b.unit_price) + Number(b.delivery_charges));
    }
    if (filterMode === 'fastest') {
      return a.delivery_days_estimate - b.delivery_days_estimate;
    }
    if (filterMode === 'rating') {
      return b.rating - a.rating;
    }
    return 0;
  });

  const handleSelectVendor = (vp: VendorProduct) => {
    setSelectedVendorSuccess(
      `Vendor "${vp.vendor?.name}" selected for procurement evaluation! You can now create a formal Purchase Order.`
    );
    setTimeout(() => {
      navigate('/procurement');
    }, 2000);
  };

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'AMAZON':
        return <span className="bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">Amazon Business</span>;
      case 'FLIPKART':
        return <span className="bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5 rounded text-[10px] font-bold">Flipkart Direct</span>;
      case 'MEESHO':
        return <span className="bg-pink-100 text-pink-900 border border-pink-300 px-2 py-0.5 rounded text-[10px] font-bold">Meesho Wholesale</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 border border-slate-300 px-2 py-0.5 rounded text-[10px] font-bold">Authorized Distributor</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Scale className="w-6 h-6 text-blue-600" /> Automated Vendor Price & Availability Comparison
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time live multi-platform data from Amazon, Flipkart, Meesho, and certified wholesale suppliers.
          </p>
        </div>

        {/* Product Dropdown Selector */}
        <div className="w-full md:w-80">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Select Product to Compare:
          </label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.brand})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Product Spotlight Card */}
      {selectedProduct && (
        <div className="bg-gradient-to-r from-blue-900 to-slate-900 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row items-center gap-6">
          <img
            src={selectedProduct.image_url || 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=400'}
            alt={selectedProduct.name}
            className="w-24 h-24 object-cover rounded-xl border border-white/20 bg-white"
          />
          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span className="text-xs bg-blue-500/30 text-blue-300 border border-blue-400/30 font-bold px-2 py-0.5 rounded">
                SKU: {selectedProduct.sku}
              </span>
              <span className="text-xs bg-white/10 text-slate-300 px-2 py-0.5 rounded font-medium">
                {selectedProduct.brand} | Model: {selectedProduct.model_number || 'N/A'}
              </span>
            </div>
            <h2 className="text-xl font-bold mt-1.5">{selectedProduct.name}</h2>
            <p className="text-xs text-slate-300 mt-1 line-clamp-1">{selectedProduct.description}</p>
          </div>
          <div className="text-center sm:text-right border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-6">
            <span className="text-xs text-slate-300 block">Baseline ERP Unit Price</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">
              ₹{Number(selectedProduct.unit_price).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Quick Filters:</span>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              filterMode === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Vendors ({comparisonItems.length})
          </button>
          <button
            onClick={() => setFilterMode('cheapest')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              filterMode === 'cheapest' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            <Award className="w-3.5 h-3.5" /> Lowest Price
          </button>
          <button
            onClick={() => setFilterMode('fastest')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              filterMode === 'fastest' ? 'bg-amber-600 text-white shadow-sm' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5" /> Fastest Delivery
          </button>
          <button
            onClick={() => setFilterMode('rating')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              filterMode === 'rating' ? 'bg-violet-600 text-white shadow-sm' : 'bg-violet-50 text-violet-700 hover:bg-violet-100'
            }`}
          >
            <Star className="w-3.5 h-3.5" /> Highest Rating
          </button>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Showing verified supplier channels for procurement approval
        </div>
      </div>

      {selectedVendorSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-3 animate-in fade-in">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-semibold">{selectedVendorSuccess}</span>
        </div>
      )}

      {/* Comparison Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Vendor & Channel</th>
                <th className="py-3.5 px-4">Matching Listing</th>
                <th className="py-3.5 px-4">Unit Price</th>
                <th className="py-3.5 px-4">Delivery Fees</th>
                <th className="py-3.5 px-4">Total Landed Cost</th>
                <th className="py-3.5 px-4">Lead Time</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Smart Recommendation</th>
                <th className="py-3.5 px-4 text-right">Procurement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    No vendor listings found for this product. Check other items in the dropdown.
                  </td>
                </tr>
              ) : (
                filteredItems.map((vp) => {
                  const isCheapest = vp.id === cheapestId;
                  const isFastest = vp.id === fastestId;
                  const isBestOverall = vp.id === bestOverallId;
                  const totalLanded = Number(vp.unit_price) + Number(vp.delivery_charges);

                  return (
                    <tr
                      key={vp.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isBestOverall ? 'bg-blue-50/20' : ''
                      }`}
                    >
                      {/* Vendor & Platform */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-900 text-sm">{vp.vendor?.name || 'Authorized Supplier'}</div>
                        <div className="mt-1">{getPlatformBadge(vp.platform)}</div>
                        <span className="text-[10px] text-slate-400 block mt-1">
                          {vp.vendor?.address || 'Direct Enterprise Fulfillment'}
                        </span>
                      </td>

                      {/* Matching Product Name & External Link */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-medium text-slate-800 line-clamp-2">{vp.external_product_name}</div>
                        <a
                          href={vp.product_url || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 mt-1 font-semibold"
                        >
                          View External Store <ExternalLink className="w-3 h-3" />
                        </a>
                      </td>

                      {/* Unit Price */}
                      <td className="py-4 px-4 font-bold text-slate-900 text-sm">
                        ₹{Number(vp.unit_price).toLocaleString('en-IN')}
                      </td>

                      {/* Delivery Charges */}
                      <td className="py-4 px-4">
                        {Number(vp.delivery_charges) === 0 ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">FREE</span>
                        ) : (
                          <span className="text-slate-600 font-medium">₹{Number(vp.delivery_charges)}</span>
                        )}
                      </td>

                      {/* Total Landed Cost */}
                      <td className="py-4 px-4">
                        <span className="text-sm font-extrabold text-slate-900">
                          ₹{totalLanded.toLocaleString('en-IN')}
                        </span>
                      </td>

                      {/* Delivery Days Estimate */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <Truck className="w-3.5 h-3.5 text-blue-600" />
                          {vp.delivery_days_estimate} Days
                        </div>
                        <span className="text-[10px] text-slate-400">Est: {new Date(Date.now() + vp.delivery_days_estimate * 86400000).toLocaleDateString()}</span>
                      </td>

                      {/* Rating */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{vp.rating}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">Verified Seller</span>
                      </td>

                      {/* Smart Recommendation Badges */}
                      <td className="py-4 px-4 space-y-1">
                        {isCheapest && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <Award className="w-3 h-3" /> Cheapest Option 🏆
                          </span>
                        )}
                        {isFastest && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Zap className="w-3 h-3" /> Fastest Delivery ⚡
                          </span>
                        )}
                        {isBestOverall && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                            <Sparkles className="w-3 h-3" /> Best Overall ⭐
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleSelectVendor(vp)}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm transition inline-flex items-center gap-1"
                        >
                          Select Vendor <ArrowRight className="w-3 h-3" />
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
    </div>
  );
};
