import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Boxes, Shield, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { UserRole } from '../types';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('admin@inventory.com');
  const [password, setPassword] = useState('Demo@1234');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { login, switchDemoRole } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const success = await login(email, password);
    if (success) {
      navigate('/');
    } else {
      setError('Invalid email or password. Please use Demo@1234.');
    }
    setLoading(false);
  };

  const handleQuickDemoLogin = async (role: UserRole) => {
    setLoading(true);
    await switchDemoRole(role);
    navigate('/');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-blue-500/30 mb-3">
            <Boxes className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Smart Inventory & Procurement</h1>
          <p className="text-xs text-slate-400 mt-1">Enterprise Automated ERP & Supply Chain System</p>
        </div>

        {/* Login Box */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Corporate Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Account Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick 1-Click Demo Login Personas */}
          <div className="pt-4 border-t border-slate-800">
            <span className="text-[11px] text-slate-400 font-semibold block text-center mb-3">
              ⚡ Instant 1-Click Demo Sign-in (Pre-configured Pass: Demo@1234)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('admin')}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 rounded-lg font-bold text-left transition"
              >
                👑 Admin
                <span className="text-[10px] text-slate-400 block font-normal">Full Superuser</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('inventory')}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 rounded-lg font-bold text-left transition"
              >
                📦 Warehouse
                <span className="text-[10px] text-slate-400 block font-normal">Inward & Stock</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('procurement')}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-lg font-bold text-left transition"
              >
                🛒 Procurement
                <span className="text-[10px] text-slate-400 block font-normal">Vendors & POs</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('sales')}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-300 border border-blue-500/30 rounded-lg font-bold text-left transition"
              >
                💼 Sales Team
                <span className="text-[10px] text-slate-400 block font-normal">Orders & Alloc</span>
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('management')}
                className="col-span-2 p-2 bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30 rounded-lg font-bold text-left transition flex items-center justify-between"
              >
                <span>📊 Executive Management</span>
                <span className="text-[10px] text-slate-400 font-normal">Spend & Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
