import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useRouter } from 'expo-router';

export type RouteState = { pathname: string; params?: any };

interface NavigationStackContextType {
  stack: RouteState[];
  push: (pathname: string | { pathname: string, params?: any }, params?: any) => void;
  pop: (fallback?: string) => boolean;
  replace: (pathname: string | { pathname: string, params?: any }, params?: any) => void;
  resetStack: () => void;
  canGoBack: () => boolean;
}

const NavigationStackContext = createContext<NavigationStackContextType | undefined>(undefined);

export function NavigationStackProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<RouteState[]>([]);
  const router = useRouter();

  const push = useCallback((pathname: string | { pathname: string, params?: any }, params?: any) => {
    const path = typeof pathname === 'string' ? pathname : pathname.pathname;
    const p = typeof pathname === 'string' ? params : pathname.params;
    setStack(prev => [...prev, { pathname: path, params: p }]);
    if (typeof pathname === 'string') {
      router.push({ pathname: path, params: p } as any);
    } else {
      router.push(pathname as any);
    }
  }, [router]);

  const replace = useCallback((pathname: string | { pathname: string, params?: any }, params?: any) => {
    const path = typeof pathname === 'string' ? pathname : pathname.pathname;
    const p = typeof pathname === 'string' ? params : pathname.params;
    setStack(prev => {
      const newStack = [...prev];
      if (newStack.length > 0) {
        newStack[newStack.length - 1] = { pathname: path, params: p };
      } else {
        newStack.push({ pathname: path, params: p });
      }
      return newStack;
    });
    if (typeof pathname === 'string') {
      router.replace({ pathname: path, params: p } as any);
    } else {
      router.replace(pathname as any);
    }
  }, [router]);

  const pop = useCallback((fallback?: string) => {
    let hasStackItem = false;
    setStack(prev => {
      if (prev.length > 0) {
        hasStackItem = true;
        const newStack = [...prev];
        newStack.pop();
        return newStack;
      }
      return prev;
    });

    if (router.canGoBack()) {
      router.back();
      return true;
    } else if (fallback) {
      router.replace(fallback as any);
      return true;
    }
    
    return false;
  }, [router]);

  const resetStack = useCallback(() => {
    setStack([]);
  }, []);

  const canGoBack = useCallback(() => {
    return stack.length > 0;
  }, [stack]);

  return (
    <NavigationStackContext.Provider value={{ stack, push, pop, replace, resetStack, canGoBack }}>
      {children}
    </NavigationStackContext.Provider>
  );
}

export function useNavigationStack() {
  const context = useContext(NavigationStackContext);
  if (!context) {
    throw new Error('useNavigationStack must be used within a NavigationStackProvider');
  }
  return context;
}
