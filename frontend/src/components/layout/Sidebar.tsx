import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Warehouse as WarehouseIcon,
  Search,
  Scale,
  ShoppingCart,
  FileText,
  Truck,
  ClipboardList,
  Layers,
  Bell,
  BarChart3,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Boxes,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { role } = useAuth();

  const navItems = [
    { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { label: 'Products', icon: Package, path: '/products' },
    { label: 'Inventory', icon: WarehouseIcon, path: '/inventory' },
    { label: 'Availability Check', icon: Search, path: '/availability' },
    { label: 'Vendor Comparison', icon: Scale, path: '/vendor-comparison' },
    { label: 'Procurement', icon: ShoppingCart, path: '/procurement' },
    { label: 'Purchase Orders', icon: FileText, path: '/purchase-orders' },
    { label: 'Warehouse Arrival', icon: Truck, path: '/warehouse' },
    { label: 'Sales Orders', icon: ClipboardList, path: '/sales-orders' },
    { label: 'Product Allocation', icon: Layers, path: '/allocations' },
    { label: 'Notifications', icon: Bell, path: '/notifications' },
    { label: 'Reports & Analytics', icon: BarChart3, path: '/reports' },
    { label: 'User Management', icon: Users, path: '/users', adminOnly: true },
    { label: 'Settings', icon: Settings, path: '/settings' },
  ];

  return (
    <aside
      className={`relative bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 select-none ${
        collapsed ? 'w-20' : 'w-64'
      } min-h-screen border-r border-slate-800`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-4 border-b border-slate-800 justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 flex-shrink-0">
            <Boxes className="w-6 h-6" />
          </div>
          {!collapsed && (
            <div className="truncate">
              <h1 className="font-bold text-white text-base tracking-tight leading-tight">Smart Inventory</h1>
              <span className="text-[11px] text-blue-400 font-medium tracking-wide">Enterprise ERP</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav List */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {navItems.map((item) => {
          if (item.adminOnly && role !== 'admin') return null;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition group ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20 font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                }`
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Status */}
      {!collapsed && (
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>v1.0.0 Enterprise</span>
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> System Online
          </span>
        </div>
      )}
    </aside>
  );
};
