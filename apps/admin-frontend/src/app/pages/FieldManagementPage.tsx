/**
 * Field Management Portal - Unified Entry Point
 * Renders different views based on User Role:
 * - Admin: Global Drill-Down (Zone -> OM -> FM)
 * - Operations Manager: Regional Oversight (FMs -> Allocation)
 * - Field Manager: Tactical Management (Team -> Schedule -> Beneficiaries)
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import AdminFieldView from '../components/field-management/AdminFieldView';
import OpsManagerFieldView from '../components/field-management/OpsManagerFieldView';
import FieldManagerView from '../components/field-management/FieldManagerView';

export default function FieldManagementPage() {
  const { user } = useAuth();

  // Role-based rendering
  const renderView = () => {
    switch (user?.role) {
      case 'master_admin':
      case 'admin':
        return <AdminFieldView />;
      case 'operations_manager':
        return <OpsManagerFieldView />;
      case 'field_manager':
        return <FieldManagerView />;
      default:
        return (
          <div className="flex flex-col items-center justify-center py-20">
            <h2 className="text-xl font-semibold">Access Restricted</h2>
            <p className="text-muted-foreground mt-2">You do not have the required permissions to view this portal.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header (Common) */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground">Field Management Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {user?.role === 'field_manager' 
            ? 'Tactical control for your assigned team and beneficiaries.'
            : user?.role === 'operations_manager'
            ? 'Regional oversight and resource allocation for your assigned zones.'
            : 'Global operational command and hierarchical performance tracking.'}
        </p>
      </div>

      {/* Role-Specific View */}
      {renderView()}
    </div>
  );
}
