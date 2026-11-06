import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AppNotification } from '../types';
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  Truck,
  Layers,
  FileText,
  Clock,
  Filter,
} from 'lucide-react';

export const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [filterType, setFilterType] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications?unread_only=false');
      setNotifications(res.data);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'STOCK_OUT':
      case 'LOW_STOCK':
        return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      case 'PROCUREMENT_REQUEST':
      case 'VENDOR_COMPARISON':
        return <ShoppingCart className="w-5 h-5 text-amber-500" />;
      case 'PO_GENERATED':
        return <FileText className="w-5 h-5 text-blue-500" />;
      case 'ARRIVED':
      case 'SHIPPED':
        return <Truck className="w-5 h-5 text-cyan-500" />;
      case 'ALLOCATED':
        return <Layers className="w-5 h-5 text-emerald-500" />;
      default:
        return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'UNREAD') return !n.is_read;
    return n.type.includes(filterType);
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-blue-600" /> System Notification & Alert Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated alerts for inventory shortages, supplier arrivals, purchase order approvals, and sales reservations.
          </p>
        </div>
        <button
          onClick={handleMarkAllRead}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1.5"
        >
          <CheckCheck className="w-4 h-4" /> Mark All as Read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-xs font-bold">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1.5 rounded-lg transition ${
            filterType === 'ALL' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          All Alerts ({notifications.length})
        </button>
        <button
          onClick={() => setFilterType('UNREAD')}
          className={`px-3 py-1.5 rounded-lg transition ${
            filterType === 'UNREAD' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Unread Only
        </button>
        <button
          onClick={() => setFilterType('STOCK')}
          className={`px-3 py-1.5 rounded-lg transition ${
            filterType === 'STOCK' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          Stock & Shortages
        </button>
        <button
          onClick={() => setFilterType('PROCUREMENT')}
          className={`px-3 py-1.5 rounded-lg transition ${
            filterType === 'PROCUREMENT' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-700 hover:bg-amber-50'
          }`}
        >
          Procurement & POs
        </button>
        <button
          onClick={() => setFilterType('ARRIVED')}
          className={`px-3 py-1.5 rounded-lg transition ${
            filterType === 'ARRIVED' ? 'bg-cyan-600 text-white shadow-sm' : 'text-cyan-700 hover:bg-cyan-50'
          }`}
        >
          Warehouse Arrivals
        </button>
      </div>

      {/* Notifications List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm divide-y divide-slate-100 overflow-hidden">
        {filteredNotifs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No notifications match your current filter selection.
          </div>
        ) : (
          filteredNotifs.map((n) => (
            <div
              key={n.id}
              onClick={() => handleMarkAsRead(n.id)}
              className={`p-5 flex items-start gap-4 hover:bg-slate-50 transition cursor-pointer ${
                !n.is_read ? 'bg-blue-50/40' : ''
              }`}
            >
              <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-200 flex-shrink-0">
                {getIconForType(n.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-600"></span>}
                    {n.title}
                  </h3>
                  <span className="text-xs text-slate-400">
                    {new Date(n.created_at).toLocaleString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{n.message}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
                    {n.type.replace('_', ' ')}
                  </span>
                  {n.reference_type && (
                    <span className="text-[10px] text-blue-600 font-semibold">Ref: {n.reference_type}</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
