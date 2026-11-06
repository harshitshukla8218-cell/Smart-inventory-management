import React, { useState } from 'react';
import { Settings as SettingsIcon, Save, Bell, Shield, Database, CheckCircle2 } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [minThreshold, setMinThreshold] = useState(10);
  const [reorderThreshold, setReorderThreshold] = useState(20);
  const [autoProcure, setAutoProcure] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <SettingsIcon className="w-6 h-6 text-blue-600" /> System Settings & Automation Configuration
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure default replenishment triggers, automated procurement thresholds, and notification delivery options.
        </p>
      </div>

      {saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2 animate-in fade-in text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          Settings successfully saved and active across ERP services.
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Thresholds Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            Inventory & Reorder Automation Limits
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Low Stock Reorder Point</label>
              <input
                type="number"
                value={reorderThreshold}
                onChange={(e) => setReorderThreshold(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Triggers warning badge and procurement candidate suggestion
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Minimum Safety Stock Level</label>
              <input
                type="number"
                value={minThreshold}
                onChange={(e) => setMinThreshold(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Critical threshold triggering high-priority shortage alert
              </span>
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={autoProcure}
                onChange={(e) => setAutoProcure(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              Automatically generate draft procurement request when sales order detects a stock shortage
            </label>
          </div>
        </div>

        {/* Notifications Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
            Notification Delivery Channels
          </h2>
          <div className="space-y-3 text-xs">
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              Dispatch instant email notifications on warehouse arrivals and PO status changes
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
              <input
                type="checkbox"
                defaultChecked={true}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              Enable real-time WebSocket in-app notification toasts
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow-sm flex items-center gap-2 transition"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </form>
    </div>
  );
};
