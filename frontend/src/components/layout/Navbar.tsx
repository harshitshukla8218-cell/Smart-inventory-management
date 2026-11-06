import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Bell, Search, User as UserIcon, LogOut, CheckCircle, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';
import { AppNotification, UserRole } from '../../types';
import { Link } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const { user, role, logout, switchDemoRole } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?unread_only=false');
      setNotifications(res.data.slice(0, 5));
      const unread = res.data.filter((n: AppNotification) => !n.is_read).length;
      setUnreadCount(unread);
    } catch {
      // fallback
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch {
      // error handling
    }
  };

  const getRoleBadgeColor = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'inventory':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'procurement':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'sales':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'management':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm h-16 flex items-center justify-between px-6">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products, orders, POs, vendors (Ctrl+K)..."
            className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Quick Persona Switcher for Easy Demo Testing */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium">
          <span className="text-slate-500 px-2 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" /> Demo Persona:
          </span>
          {(['admin', 'inventory', 'procurement', 'sales', 'management'] as UserRole[]).map((r) => (
            <button
              key={r}
              onClick={() => switchDemoRole(r)}
              className={`px-2.5 py-1 rounded capitalize transition ${
                role === r
                  ? 'bg-blue-600 text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifMenu(!showNotifMenu)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg relative transition"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 bg-red-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifMenu && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 animate-in fade-in">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <span className="font-semibold text-sm text-slate-800">Notifications</span>
                <span className="text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 p-4 text-center">No recent alerts</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => markAsRead(n.id)}
                      className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition ${
                        !n.is_read ? 'bg-blue-50/50' : ''
                      }`}
                    >
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>}
                        {n.title}
                      </div>
                      <p className="text-slate-600 mt-1 line-clamp-2">{n.message}</p>
                      <span className="text-[10px] text-slate-400 mt-1.5 block">
                        {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t border-slate-100 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setShowNotifMenu(false)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  View All Notifications →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Role Info */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-semibold text-slate-800 leading-tight">{user?.full_name || 'System User'}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[10px] font-bold px-1.5 py-0.2 rounded border uppercase tracking-wider ${getRoleBadgeColor(
                  role
                )}`}
              >
                {role}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
