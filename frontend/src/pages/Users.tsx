import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { User, UserRole } from '../types';
import { Users as UsersIcon, Plus, Shield, Check, X, ShieldAlert } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('Demo@1234');
  const [role, setRole] = useState<UserRole>('sales');

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to load users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/users', {
        email,
        full_name: fullName,
        password,
        role,
      });
      setShowModal(false);
      setEmail('');
      setFullName('');
      fetchUsers();
    } catch (err) {
      console.error('Failed to create user', err);
    }
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Admin (Superuser)</span>;
      case 'inventory':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Warehouse Lead</span>;
      case 'procurement':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">Procurement Officer</span>;
      case 'sales':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Sales Representative</span>;
      case 'management':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Management / VP</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">{r}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UsersIcon className="w-6 h-6 text-blue-600" /> User Roles & Access Management (RBAC)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Enforce role-based permissions across Admin, Warehouse, Procurement, Sales, and Management personas.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Add Team Member
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4">Assigned Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Permission Scope</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-4 font-bold text-slate-900">{u.full_name}</td>
                  <td className="py-4 px-4 font-mono text-slate-600">{u.email}</td>
                  <td className="py-4 px-4">{getRoleBadge(u.role)}</td>
                  <td className="py-4 px-4">
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Active
                    </span>
                  </td>
                  <td className="py-4 px-4 text-slate-500">
                    {u.role === 'admin'
                      ? 'Full System Access & Settings'
                      : u.role === 'inventory'
                      ? 'Warehouse Stocks & Inward Receipts'
                      : u.role === 'procurement'
                      ? 'Vendor Comparison & Purchase Orders'
                      : u.role === 'sales'
                      ? 'Customer Sales Orders & Allocation'
                      : 'Executive Analytics & Oversight'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">Add User & Assign Role</h2>
            <form onSubmit={handleCreateUser} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Temporary Password</label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">System Role (RBAC)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-semibold text-slate-800"
                >
                  <option value="admin">Admin (Full System Access)</option>
                  <option value="inventory">Inventory / Warehouse Lead</option>
                  <option value="procurement">Procurement Officer</option>
                  <option value="sales">Sales Team</option>
                  <option value="management">Management / Executive</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm transition"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
