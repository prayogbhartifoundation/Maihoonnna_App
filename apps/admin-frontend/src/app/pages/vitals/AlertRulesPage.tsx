/**
 * Alert Rules Page
 * Configure system-wide thresholds and notification rules
 */

import React from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card, CardContent } from '../../components/ui/card';
import { Bell, ShieldAlert, Settings } from 'lucide-react';

export default function AlertRulesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Alert rules"
        description="System > Vitals > Alert rules"
      />

      <Card className="border-none shadow-sm bg-white overflow-hidden">
        <CardContent className="p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
            <Settings className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Alert Rules Management</h3>
          <p className="text-muted-foreground mt-2 max-w-md">
            This module is being developed to allow system-wide configuration of vital thresholds, 
            emergency triggers, and automated notification workflows.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
