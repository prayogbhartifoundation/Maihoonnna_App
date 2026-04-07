/**
 * Dashboard Layout - Main layout with sidebar navigation
 */

import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import {
  MapPin,
  Users,
  Calendar,
  UserCheck,
  UserCircle,
  HeadphonesIcon,
  PhoneCall,
  FileText,
  Handshake,
  Heart,
  Package,
  LogOut,
  Menu,
  Settings,
  Home,
  UserPlus,
  Activity,
  Tag,
} from 'lucide-react';
import { cn } from '../ui/utils';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';

const navigationItems = [
  { path: '/zones', label: 'Zones', icon: MapPin, roles: [] },
  { path: '/teams', label: 'Teams', icon: Users, roles: [] },
  { path: '/create-team', label: 'Create Team', icon: Users, roles: [] },
  { path: '/field-managers', label: 'Field Managers', icon: Calendar, roles: [] },
  { path: '/care-companions', label: 'Care Companions', icon: UserCheck, roles: [] },
  { path: '/staff-onboarding', label: 'Staff Onboarding', icon: UserPlus, roles: [] },
  { path: '/callback-requests', label: 'Callback Requests', icon: PhoneCall, roles: [] },
  { path: '/field-management', label: 'Field Management', icon: Calendar, roles: ['master_admin', 'operations_manager', 'field_manager'] },
  { path: '/operations-managers', label: 'Operations Managers', icon: Users, roles: ['master_admin', 'operations_manager'] },
  { path: '/subscribers', label: 'Subscribers', icon: UserCircle, roles: [] },
  { path: '/enroll', label: 'Enroll Subscriber', icon: UserPlus, roles: [] },
  { path: '/beneficiaries', label: 'Beneficiaries', icon: Heart, roles: [] },
  { path: '/support', label: 'Support Team', icon: HeadphonesIcon, roles: ['master_admin', 'support_team'] },
  { path: '/activity-logs', label: 'Activity Logs', icon: FileText, roles: ['master_admin'] },
  { path: '/partners', label: 'Partners', icon: Handshake, roles: [] },
  { path: '/volunteers', label: 'Volunteers', icon: Heart, roles: [] },
  { path: '/subscriptions', label: 'Subscription Packages', icon: Package, roles: ['master_admin'] },
  { path: '/benefit-types', label: 'Benefit Types', icon: Settings, roles: ['master_admin'] },
  { path: '/benefits', label: 'Benefits Library', icon: FileText, roles: ['master_admin'] },
  { path: '/vitals', label: 'Vitals Library', icon: Activity, roles: ['master_admin'] },
  { path: '/coupons', label: 'Coupons & Promos', icon: Tag, roles: ['master_admin'] },
  { path: '/admin-users', label: 'Admin Users', icon: Settings, roles: ['master_admin'] },
];

export default function DashboardLayout() {
  const { user, logout, hasAccess } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const filteredNavItems = navigationItems.filter((item) =>
    item.roles.length === 0 || hasAccess(item.roles as any)
  );

  const NavContent = () => (
    <>
      <div className="p-6 border-b border-border">
        <h2 className="text-xl font-semibold text-primary">MaiHoonNa</h2>
        <p className="text-xs text-muted-foreground mt-1">Senior Care Operations</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-secondary'
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-border space-y-3">
        <div className="px-3 py-2 rounded-lg bg-secondary">
          <p className="text-xs text-muted-foreground">Logged in as</p>
          <p className="text-sm font-medium truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground capitalize">{user?.role.replace('_', ' ')}</p>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col w-64 bg-card border-r border-border">
        <NavContent />
      </aside>

      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-10 flex items-center justify-between px-4">
        <h2 className="text-lg font-semibold text-primary">MaiHoonNa</h2>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <NavContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="pt-16 lg:pt-0 p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
