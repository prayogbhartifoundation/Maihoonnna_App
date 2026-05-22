# MaiHoonNa Senior Care Operations Portal

## 📋 Project Overview

**MaiHoonNa** is a comprehensive, enterprise-grade Senior Care Operations Portal designed for managing all aspects of senior care services. The system features role-based access control (RBAC), multi-module architecture, and a user-friendly interface with a warm healthcare aesthetic.

## 🎨 Design System

### Color Palette
- **Background**: `#F4EAE3` (Warm beige)
- **Cards**: `#FFFFFF` (White)
- **Primary**: `#FF7A00` (Orange)
- **Success**: `#DFF4E6` (Light green)
- **Borders**: `#E7DED6` (Light brown)

### Design Philosophy
Clean, card-based UI with clear visual hierarchy, accessibility, and a premium healthcare checkout aesthetic.

---

## 🏗️ Architecture

### Tech Stack
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v7 (Data mode)
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives
- **State Management**: React Context API
- **Icons**: Lucide React

### Project Structure

```
/src
├── /app
│   ├── /components
│   │   ├── /common          # Reusable components
│   │   │   ├── StatusChip.tsx
│   │   │   ├── DataCard.tsx
│   │   │   ├── PageHeader.tsx
│   │   │   └── UtilizationBar.tsx
│   │   ├── /layout          # Layout components
│   │   │   └── DashboardLayout.tsx
│   │   └── /ui              # Shadcn/Radix UI components
│   ├── /context             # React Context
│   │   └── AuthContext.tsx  # Authentication & RBAC
│   ├── /pages               # All page components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── ZonesPage.tsx
│   │   ├── OperationsManagersPage.tsx
│   │   ├── FieldManagementPage.tsx
│   │   ├── CareCompanionsPage.tsx
│   │   ├── SubscribersPage.tsx
│   │   ├── BeneficiariesPage.tsx
│   │   ├── SupportPage.tsx
│   │   ├── ActivityLogsPage.tsx
│   │   ├── PartnersPage.tsx
│   │   ├── VolunteersPage.tsx
│   │   ├── SubscriptionsPage.tsx (Product Factory)
│   │   └── AdminUsersPage.tsx
│   ├── routes.ts            # Route configuration
│   └── App.tsx              # Main entry point
├── /services                # API layer
│   ├── api.ts               # API service functions
│   └── mockData.ts          # Mock data
├── /types
│   └── index.ts             # TypeScript definitions
└── /styles                  # Global styles
    └── theme.css            # MaiHoonNa theme
```

---

## 🔐 Authentication & RBAC

### User Roles

1. **Master Admin**
   - Unrestricted access to all modules
   - Can create and manage internal users
   - Access to Admin User Management and Activity Logs

2. **Operations Manager**
   - Manage zones and performance metrics
   - View subscriber and beneficiary data
   - Limited administrative functions

3. **Field Manager**
   - Schedule and assign visits
   - Manage Care Companions
   - View daily schedules

4. **Care Companion**
   - View assigned visits
   - Update visit status

5. **Support Team**
   - Access support tickets
   - Resolve customer issues

### Login Methods
- **Phone/OTP**: Traditional SMS-based authentication
- **Biometric**: Fingerprint/Face ID authentication (device-dependent)

### Demo Credentials
- **Phone**: `+91-9876543210`
- **OTP**: `123456`
- **Biometric**: Auto-login as Master Admin (U001)

---

## 📱 Feature Modules

### 1. Dashboard
- Real-time metrics overview
- Today's visit progress
- Care Companion utilization
- Open support tickets
- Zone overview

### 2. Zones Management
- Nodal center directory
- Address and geo-coordinates
- Lease date tracking
- Operations Manager assignment

### 3. Operations Managers
- Directory with performance metrics
- Assigned zones
- Subscriber and beneficiary counts
- Visit completion rates

### 4. Field Management & Scheduling ⭐
**Split-screen interface:**
- **Left Panel**: Care Companion cards with utilization bars
- **Right Panel**: Timeline view of daily schedules
- Morning/Afternoon/Evening time slots
- Drag-and-assign functionality for visit blocks
- Real-time status updates

### 5. Care Companions
- Profile directory
- Background verification status (Aadhaar, Police, Medical)
- Utilization percentage tracking
- Skills and qualifications

### 6. Subscribers
- Payer directory
- Linked beneficiaries
- Subscription package details
- Zone assignment

### 7. Beneficiaries ⭐
**Clinical Configuration Tab:**
- Toggle vitals monitoring (BP, SpO2, Temperature, Heart Rate, Blood Sugar, Weight)
- Set monitoring frequency (Daily/Weekly/Monthly)
- Define alert thresholds
- Full medical history
- Emergency contact information

### 8. Support Team
- Internal help-desk interface
- Issue tickets from all user roles
- Priority levels (Low/Medium/High/Urgent)
- Status tracking (Open/In Progress/Resolved/Closed)
- Category-based filtering

### 9. Activity Logs
- Timestamped audit trail
- User actions tracking
- Entity changes (Created/Updated/Deleted)
- Success/Failure status
- IP address logging

### 10. Partners
- Third-party service providers
- Pharmacies, laboratories, hospitals
- Contact information
- Services offered

### 11. Volunteers (Saathi)
- Community volunteer directory
- Skills and availability
- Volunteered hours tracking
- Zone assignment

### 12. Product Factory (Subscriptions) ⭐
**Step-by-Step Wizard for Non-Tech Admins:**

**Step 1: Define Package**
- Package name, duration, cost
- Active date range

**Step 2: Add Benefits**
- Select from benefit library
- Nurse visits, physiotherapy, pharmacy delivery, lab tests, etc.

**Step 3: Set Units**
- Define monthly units for each benefit

**Step 4: Review & Publish**
- Final summary
- One-click publish

### 13. Admin User Management
- Create internal users
- Assign roles
- Toggle module access
- Biometric settings
- Activity tracking

---

## 🔌 Backend Integration Guide

### Current State
The application currently uses **mock data** defined in `/src/services/mockData.ts` and API functions in `/src/services/api.ts` that simulate network delays.

### Integration Steps

#### 1. Replace Mock Functions
In `/src/services/api.ts`, replace the mock functions with actual API calls:

```typescript
// Before (Mock)
export const zoneApi = {
  async getAll(): Promise<Zone[]> {
    await delay();
    return [...mockZones];
  },
};

// After (Real API)
export const zoneApi = {
  async getAll(): Promise<Zone[]> {
    const response = await fetch('https://api.maihonna.com/zones', {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
      },
    });
    return response.json();
  },
};
```

#### 2. Environment Variables
Create `.env` file for API endpoints:

```env
VITE_API_BASE_URL=https://api.maihonna.com
VITE_API_KEY=your-api-key
```

#### 3. Authentication Token Management
Update `/src/app/context/AuthContext.tsx` to store and use JWT tokens:

```typescript
const login = async (phone: string, otp: string) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ phone, otp }),
  });
  const { user, token } = await response.json();
  localStorage.setItem('auth_token', token);
  setUser(user);
};
```

#### 4. Database Schema Reference
TypeScript types in `/src/types/index.ts` directly map to your database schema. Use these as a reference for:
- MongoDB collections
- PostgreSQL tables
- Supabase tables

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in `/dist`.

### Environment Setup

**Development:**
```bash
npm install
npm run dev
```

**Production:**
- Deploy `/dist` folder to any static hosting (Vercel, Netlify, AWS S3)
- Ensure API CORS is configured for your domain

---

## 🎯 Key Features for Client Handover

### 1. Atomic UI Components
All UI components are reusable and consistently styled:
- `StatusChip`: Auto-detects status type and applies appropriate colors
- `DataCard`: Consistent card layout across all pages
- `PageHeader`: Unified page headers with optional actions
- `UtilizationBar`: Visual capacity indicators

### 2. Type Safety
Full TypeScript coverage ensures:
- Compile-time error detection
- IntelliSense support
- Easier refactoring
- Self-documenting code

### 3. Service Layer
All data fetching is centralized in `/src/services/api.ts`:
- Easy to swap mock data with real APIs
- Consistent error handling
- Network delay simulation for realistic UX

### 4. Clean Code Standards
- Descriptive variable and function names
- Comprehensive comments on every module
- Consistent file naming conventions
- Logical folder structure

### 5. Scalability
- Modular architecture allows easy addition of new pages
- Role-based access can be extended with new permissions
- Benefit library can grow without code changes

---

## 📊 Data Flow

```
User Action → Page Component → API Service → Backend
                                    ↓
                            Context/State Update
                                    ↓
                              UI Re-render
```

---

## 🔒 Security Considerations

1. **Authentication**
   - Currently stored in localStorage (suitable for demo)
   - **Production**: Use httpOnly cookies or secure token storage

2. **API Keys**
   - Never commit API keys to version control
   - Use environment variables

3. **RBAC**
   - Enforced at UI level
   - **Production**: Also enforce at backend/API level

4. **Data Validation**
   - TypeScript provides compile-time validation
   - **Production**: Add runtime validation (Zod, Yup)

---

## 📝 Future Enhancements

1. **Real-time Updates**
   - Implement WebSocket for live visit updates
   - Push notifications for support tickets

2. **Analytics Dashboard**
   - Recharts integration for detailed metrics
   - Trend analysis and reporting

3. **Mobile App**
   - React Native version for Care Companions
   - Mobile-optimized scheduling interface

4. **Advanced RBAC**
   - Granular page-level permissions
   - Custom role creation

5. **Multi-language Support**
   - i18n integration
   - Regional language support

---

## 🛠️ Troubleshooting

### Common Issues

**Issue**: Pages not loading
- **Solution**: Check that all imports in `routes.ts` match file names exactly

**Issue**: Authentication not persisting
- **Solution**: Check browser localStorage is enabled

**Issue**: TypeScript errors
- **Solution**: Run `npm install` to ensure all types are installed

---

## 📞 Support

For questions or issues during integration:
1. Review inline code comments
2. Check TypeScript type definitions
3. Examine mock data structure
4. Test with demo credentials

---

## 🎓 Code Documentation Standards

Every file includes:
- **Purpose**: What the file does
- **Exports**: What components/functions are exported
- **Dependencies**: What it imports
- **Usage**: How to use it

Example:
```typescript
/**
 * ZonesPage - Manages nodal centers
 * Displays zones with address, coordinates, and lease information
 * Accessible by: All roles
 */
```

---

## ✅ Handover Checklist

- [x] All 13 modules implemented
- [x] RBAC with 5 user roles
- [x] Phone/OTP and Biometric authentication
- [x] Product Factory wizard
- [x] Clinical configuration for beneficiaries
- [x] Field management scheduling interface
- [x] Activity logging system
- [x] TypeScript type definitions
- [x] Reusable component library
- [x] Service layer abstraction
- [x] Comprehensive documentation
- [x] Demo data and credentials
- [x] Production-ready code structure

---

**Built with ❤️ for MaiHoonNa Senior Care**

*Last Updated: March 11, 2026*
