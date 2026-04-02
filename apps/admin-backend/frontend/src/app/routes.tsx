/**
 * MaiHoonNa Senior Care Operations Portal - Route Configuration
 * Defines all application routes using React Router Data mode
 */

import { createBrowserRouter } from 'react-router';
import LoginPage from './pages/LoginPage';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardPage from './pages/DashboardPage';
import ZonesPage from './pages/ZonesPage';
import OperationsManagersPage from './pages/OperationsManagersPage';
import FieldManagementPage from './pages/FieldManagementPage';
import FieldManagerPage from './pages/FieldManagerPage';
import CareCompanionsPage from './pages/CareCompanionsPage';
import SubscribersPage from './pages/SubscribersPage';
import BeneficiariesPage from './pages/BeneficiariesPage';
import SupportPage from './pages/SupportPage';
import ActivityLogsPage from './pages/ActivityLogsPage';
import PartnersPage from './pages/PartnersPage';
import VolunteersPage from './pages/VolunteersPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import AdminUsersPage from './pages/AdminUsersPage';
import CallbacksPage from './pages/CallbacksPage';
import TeamsPage from './pages/TeamsPage';
import CreateTeamPage from './pages/CreateTeamPage';
import StaffOnboardingPage from './pages/StaffOnboardingPage';
import BenefitTypesPage from './pages/BenefitTypesPage';
import BenefitsPage from './pages/BenefitsPage';
import VitalsPage from './pages/VitalsPage';
import CouponsPage from './pages/CouponsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LoginPage,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        Component: DashboardPage,
      },
      {
        path: 'zones',
        Component: ZonesPage,
      },
      {
        path: 'callback-requests',
        Component: CallbacksPage,
      },
      {
        path: 'operations-managers',
        Component: OperationsManagersPage,
      },
      {
        path: 'field-management',
        Component: FieldManagementPage,
      },
      {
        path: 'field-managers',
        Component: FieldManagerPage,
      },
      {
        path: 'care-companions',
        Component: CareCompanionsPage,
      },
      {
        path: 'subscribers',
        Component: SubscribersPage,
      },
      {
        path: 'beneficiaries',
        Component: BeneficiariesPage,
      },
      {
        path: 'support',
        Component: SupportPage,
      },
      {
        path: 'activity-logs',
        Component: ActivityLogsPage,
      },
      {
        path: 'partners',
        Component: PartnersPage,
      },
      {
        path: 'volunteers',
        Component: VolunteersPage,
      },
      {
        path: 'subscriptions',
        Component: SubscriptionsPage,
      },
      {
        path: 'admin-users',
        Component: AdminUsersPage,
      },
      {
        path: 'teams',
        Component: TeamsPage,
      },
      {
        path: 'create-team',
        Component: CreateTeamPage,
      },
      {
        path: 'staff-onboarding',
        Component: StaffOnboardingPage,
      },
      {
        path: 'benefit-types',
        Component: BenefitTypesPage,
      },
      {
        path: 'benefits',
        Component: BenefitsPage,
      },
      {
        path: 'vitals',
        Component: VitalsPage,
      },
      {
        path: 'coupons',
        Component: CouponsPage,
      },
    ],
  },
]);
