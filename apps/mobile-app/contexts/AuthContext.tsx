/**
 * AuthContext — Centralized authentication state for the entire app.
 *
 * This is the Swiggy/Flipkart pattern:
 * - Login state is loaded ONCE from AsyncStorage on startup
 * - All screens consume `useAuth()` — no more inline AsyncStorage calls
 * - `login(token, userData)` persists the session and updates global state
 * - `logout()` clears the session and updates global state
 * - The root layout (_layout.tsx) uses `isLoggedIn` to decide which
 *   screen group to render, making back-navigation into auth impossible
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserData {
  id: string;
  name: string;
  phone: string;
  role: 'subscriber' | 'beneficiary' | 'care_companion' | 'volunteer' | string;
  [key: string]: any;
}

interface AuthState {
  isLoading: boolean;
  isLoggedIn: boolean;
  token: string | null;
  user: UserData | null;
  role: string | null;
}

interface AuthContextValue extends AuthState {
  login: (token: string, userData: UserData) => Promise<void>;
  logout: () => Promise<void>;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isLoggedIn: false,
    token: null,
    user: null,
    role: null,
  });

  // Load persisted session on startup — runs exactly ONCE
  useEffect(() => {
    const loadSession = async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem('userToken'),
          AsyncStorage.getItem('userData'),
        ]);

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser) as UserData;
          setState({
            isLoading: false,
            isLoggedIn: true,
            token: storedToken,
            user: parsedUser,
            role: parsedUser.role,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (err) {
        console.error('[AuthContext] Failed to load session:', err);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadSession();
  }, []);

  // Called after successful OTP verify or password login
  const login = useCallback(async (token: string, userData: UserData) => {
    await Promise.all([
      AsyncStorage.setItem('userToken', token),
      AsyncStorage.setItem('userData', JSON.stringify(userData)),
    ]);
    setState({
      isLoading: false,
      isLoggedIn: true,
      token,
      user: userData,
      role: userData.role,
    });
  }, []);

  // Called from logout button — clears everything
  const logout = useCallback(async () => {
    await AsyncStorage.multiRemove(['userToken', 'userData']);
    setState({
      isLoading: false,
      isLoggedIn: false,
      token: null,
      user: null,
      role: null,
    });
  }, []);

  const value: AuthContextValue = {
    ...state,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Use this hook in any screen to access auth state:
 *
 * const { isLoggedIn, user, role, login, logout } = useAuth();
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth() must be used inside <AuthProvider>. Check that _layout.tsx wraps screens with <AuthProvider>.');
  }
  return context;
}
