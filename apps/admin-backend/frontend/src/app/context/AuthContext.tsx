/**
 * MaiHoonNa Senior Care Operations Portal - Authentication Context
 * Manages user authentication state and role-based access control (RBAC)
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { User, UserRole } from '../../types';
import { authApi } from '../../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<void>;
  biometricLogin: (userId: string) => Promise<void>;
  logout: () => void;
  hasAccess: (requiredRole?: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check for saved session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('maihonna_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('maihonna_user');
      }
    }
  }, []);

  const login = async (phone: string, password: string) => {
    try {
      const authenticatedUser = await authApi.login(phone, password);
      setUser(authenticatedUser);
      setIsAuthenticated(true);
      localStorage.setItem('maihonna_user', JSON.stringify(authenticatedUser));
    } catch (error) {
      throw error;
    }
  };

  const biometricLogin = async (userId: string) => {
    try {
      const authenticatedUser = await authApi.biometricLogin(userId);
      setUser(authenticatedUser);
      setIsAuthenticated(true);
      localStorage.setItem('maihonna_user', JSON.stringify(authenticatedUser));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('maihonna_user');
  };

  /**
   * Check if current user has access based on role
   * Master Admin has access to everything
   */
  const hasAccess = (requiredRoles?: UserRole[]): boolean => {
    if (!user) return false;
    if (user.role === 'master_admin') return true;
    if (!requiredRoles || requiredRoles.length === 0) return true;
    return requiredRoles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, biometricLogin, logout, hasAccess }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
