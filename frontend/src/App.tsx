import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { InventoryPage } from './pages/Inventory';
import { AvailabilityCheck } from './pages/AvailabilityCheck';
import { VendorComparison } from './pages/VendorComparison';
import { Procurement } from './pages/Procurement';
import { PurchaseOrders } from './pages/PurchaseOrders';
import { WarehousePage } from './pages/Warehouse';
import { SalesOrders } from './pages/SalesOrders';
import { Allocations } from './pages/Allocations';
import { NotificationsPage } from './pages/Notifications';
import { Reports } from './pages/Reports';
import { UsersPage } from './pages/Users';
import { SettingsPage } from './pages/Settings';
import { Login } from './pages/Login';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedLayout>
                <Products />
              </ProtectedLayout>
            }
          />
          <Route
            path="/inventory"
            element={
              <ProtectedLayout>
                <InventoryPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/availability"
            element={
              <ProtectedLayout>
                <AvailabilityCheck />
              </ProtectedLayout>
            }
          />
          <Route
            path="/vendor-comparison"
            element={
              <ProtectedLayout>
                <VendorComparison />
              </ProtectedLayout>
            }
          />
          <Route
            path="/procurement"
            element={
              <ProtectedLayout>
                <Procurement />
              </ProtectedLayout>
            }
          />
          <Route
            path="/purchase-orders"
            element={
              <ProtectedLayout>
                <PurchaseOrders />
              </ProtectedLayout>
            }
          />
          <Route
            path="/warehouse"
            element={
              <ProtectedLayout>
                <WarehousePage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/sales-orders"
            element={
              <ProtectedLayout>
                <SalesOrders />
              </ProtectedLayout>
            }
          />
          <Route
            path="/allocations"
            element={
              <ProtectedLayout>
                <Allocations />
              </ProtectedLayout>
            }
          />
          <Route
            path="/notifications"
            element={
              <ProtectedLayout>
                <NotificationsPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedLayout>
                <Reports />
              </ProtectedLayout>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedLayout>
                <UsersPage />
              </ProtectedLayout>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedLayout>
                <SettingsPage />
              </ProtectedLayout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
