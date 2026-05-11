/**
 * Field Management Portal — Unified Entry Point
 *
 * Role views (will be locked later):
 *   - Admin / Master Admin → AdminFieldView (global drill-down)
 *   - Operations Manager  → OpsManagerFieldView (FM select + CC appointment)
 *   - Field Manager       → FieldManagerView (their team + beneficiaries)
 *
 * For now roles are NOT restricted — OpsManagerFieldView is shown to everyone
 * so the appointment workflow can be tested freely.
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import OpsManagerFieldView from '../components/field-management/OpsManagerFieldView';
import AdminFieldView from '../components/field-management/AdminFieldView';
import FieldManagerView from '../components/field-management/FieldManagerView';

export default function FieldManagementPage() {
  const { user } = useAuth();

  const renderView = () => {
    // TODO: lock roles once tested
    // For now, show OpsManagerFieldView for everyone except FM
    switch (user?.role) {
      case 'field_manager':
        return <FieldManagerView />;
      case 'master_admin':
      case 'admin':
      case 'operations_manager':
      default:
        return <OpsManagerFieldView />;
    }
  };

  const subtitle =
    user?.role === 'field_manager'
      ? 'Manage your assigned team and beneficiaries.'
      : 'Select a Field Manager to manage their team and appoint Care Companions.';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold text-foreground">Field Management Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
      </div>

      {/* Content */}
      {renderView()}
    </div>
  );
}
