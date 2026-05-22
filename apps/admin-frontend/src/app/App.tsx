/**
 * MaiHoonNa Senior Care Operations Portal - Main Application Entry Point
 * A comprehensive RBAC-enabled portal for managing senior care operations
 */

import React from 'react';
import { RouterProvider } from 'react-router';
import { AuthProvider } from './context/AuthContext';
import { Toaster } from './components/ui/sonner';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
      <Toaster position="top-right" />
    </AuthProvider>
  );
}
