import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  switchDemoRole: (role: UserRole) => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  canManageUsers: () => boolean;
  canManageInventory: () => boolean;
  canManageProcurement: () => boolean;
  canCreateSalesOrder: () => boolean;
  isLoading: boolean;
}

const DEMO_EMAILS: Record<UserRole, string> = {
  admin: 'admin@inventory.com',
  inventory: 'warehouse@inventory.com',
  procurement: 'procurement@inventory.com',
  sales: 'sales@inventory.com',
  management: 'manager@inventory.com',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('access_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('access_token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } else {
        // Auto-login default admin for smooth demo experience if not logged in
        try {
          const res = await api.post('/auth/login', {
            email: 'admin@inventory.com',
            password: 'Demo@1234',
          });
          const { access_token, user: loggedUser } = res.data;
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('user', JSON.stringify(loggedUser));
          setToken(access_token);
          setUser(loggedUser);
        } catch {
          // If offline or first load, leave empty
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { access_token, user: loggedUser } = res.data;
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(loggedUser));
      setToken(access_token);
      setUser(loggedUser);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  const switchDemoRole = async (targetRole: UserRole) => {
    const email = DEMO_EMAILS[targetRole];
    if (email) {
      await login(email, 'Demo@1234');
    }
  };

  const role = user?.role || 'admin';

  const hasRole = (...allowedRoles: UserRole[]) => {
    if (!user) return false;
    if (user.role === 'admin') return true; // Admin has super-access to all modules
    return allowedRoles.includes(user.role);
  };

  const canManageUsers = () => user?.role === 'admin';
  const canManageInventory = () => hasRole('inventory', 'admin');
  const canManageProcurement = () => hasRole('procurement', 'admin');
  const canCreateSalesOrder = () => hasRole('sales', 'admin');

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        login,
        logout,
        switchDemoRole,
        hasRole,
        canManageUsers,
        canManageInventory,
        canManageProcurement,
        canCreateSalesOrder,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
