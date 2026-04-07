/**
 * MaiHoonNa Senior Care Operations Portal - Type Definitions
 * This file contains all TypeScript interfaces and types used across the application
 */

// ============================================================================
// USER & AUTHENTICATION TYPES
// ============================================================================

export type UserRole = 
  | 'master_admin' 
  | 'operations_manager' 
  | 'field_manager' 
  | 'care_companion' 
  | 'support_team';

export interface Permission {
  module: string;
  canView: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  biometricEnabled: boolean;
  createdAt: string;
  lastLogin?: string;
}

// ============================================================================
// ZONE & GEOGRAPHY TYPES
// ============================================================================

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface Zone {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  coordinates: GeoCoordinates;
  leaseStartDate: string;
  leaseEndDate: string;
  operationsManagerId?: string;
  isActive: boolean;
  createdAt: string;
}

// ============================================================================
// OPERATIONS MANAGER TYPES
// ============================================================================

export interface OperationsManager {
  id: string;
  name: string;
  phone: string;
  email: string;
  assignedZones: string[];
  performanceMetrics: {
    subscriberCount: number;
    beneficiaryCount: number;
    activeVisitsThisMonth: number;
    completionRate: number;
  };
  isActive: boolean;
  joinedDate: string;
}

// ============================================================================
// CARE COMPANION TYPES
// ============================================================================

export interface BackgroundVerification {
  aadhaarNumber: string;
  aadhaarVerified: boolean;
  policeVerificationStatus: 'pending' | 'verified' | 'rejected';
  medicalCheckupDate?: string;
  medicalCheckupStatus: 'pending' | 'completed';
}

export interface CareCompanion {
  id: string;
  name: string;
  phone: string;
  email?: string;
  photo?: string;
  zoneId: string;
  backgroundVerification: BackgroundVerification;
  utilization: number; // Percentage: 0-100
  skills: string[];
  isActive: boolean;
  joinedDate: string;
}

// ============================================================================
// SCHEDULE & VISIT TYPES
// ============================================================================

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface VisitBlock {
  id: string;
  beneficiaryId: string;
  beneficiaryName: string;
  careCompanionId?: string;
  timeSlot: TimeSlot;
  startTime: string;
  endTime: string;
  visitType: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface DailySchedule {
  date: string;
  visits: VisitBlock[];
}

// ============================================================================
// SUBSCRIBER & BENEFICIARY TYPES
// ============================================================================

export interface Subscriber {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  zoneId: string;
  subscriptionId?: string;
  beneficiaryIds: string[];
  isActive: boolean;
  createdAt: string;
}

export interface VitalConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  alertThresholds?: {
    min?: number;
    max?: number;
  };
}

export interface ClinicalConfiguration {
  bloodPressure: VitalConfig;
  spO2: VitalConfig;
  temperature: VitalConfig;
  heartRate: VitalConfig;
  bloodSugar: VitalConfig;
  weight: VitalConfig;
}

export interface Beneficiary {
  id: string;
  name: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  subscriberId: string;
  photo?: string;
  medicalHistory: string[];
  clinicalConfiguration: ClinicalConfiguration;
  emergencyContact: {
    name: string;
    phone: string;
    relation: string;
  };
  primaryCcId?: string;
  secondaryCcId?: string;
  isActive: boolean;
  createdAt: string;
}

// ============================================================================
// SUPPORT & TICKETS TYPES
// ============================================================================

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  reportedBy: string;
  reporterRole: UserRole;
  assignedTo?: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

// ============================================================================
// ACTIVITY LOG TYPES
// ============================================================================

export type ActivityAction = 
  | 'created' 
  | 'updated' 
  | 'deleted' 
  | 'logged_in' 
  | 'logged_out'
  | 'assigned'
  | 'completed';

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: ActivityAction;
  entity: string;
  entityId: string;
  details: string;
  status: 'success' | 'failure';
  timestamp: string;
  ipAddress?: string;
}

// ============================================================================
// PARTNER & VOLUNTEER TYPES
// ============================================================================

export interface Partner {
  id: string;
  name: string;
  type: 'pharmacy' | 'laboratory' | 'hospital' | 'other';
  phone: string;
  email: string;
  address: string;
  contactPerson: string;
  servicesOffered: string[];
  isActive: boolean;
  onboardedDate: string;
}

export interface Volunteer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  type: 'saathi'; // Community volunteers
  skills: string[];
  availableDays: string[];
  zoneId: string;
  volunteeredHours: number;
  isActive: boolean;
  joinedDate: string;
}

// ============================================================================
// SUBSCRIPTION & BENEFIT TYPES (Product Factory)
// ============================================================================

export type BenefitType = 
  | 'nurse_visit' 
  | 'physiotherapy' 
  | 'pharmacy_delivery' 
  | 'lab_test'
  | 'doctor_consultation'
  | 'emergency_support';

export interface Benefit {
  id: string;
  name: string;
  type: BenefitType;
  description: string;
  defaultUnits: number;
  unitLabel: string; // e.g., "visits", "sessions", "deliveries"
  unitCost?: number;
  isChargeable?: boolean;
  isActive: boolean;
}

export interface PackageBenefit {
  benefitId: string;
  monthlyUnits: number;
}

export interface SubscriptionPackage {
  id: string;
  name: string;
  benefits: PackageBenefit[];
  duration?: number;
  totalCost: number;
  basePrice?: number;
  mrp?: number;
  discountPercentage?: number;
  miscellaneousCost?: number;
  isActive: boolean;
  activeFrom: string;
  activeTo: string;
  isGlobal?: boolean;
  createdBy: string;
  createdAt: string;
}

// ============================================================================
// STAFF ONBOARDING TYPES
// ============================================================================

export type StaffOnboardingRole =
  | 'care_companion'
  | 'field_manager'
  | 'operations_manager';

export type StaffOnboardingGender =
  | 'male'
  | 'female'
  | 'other'
  | 'prefer_not_to_say';

export type StaffShiftPreference =
  | 'any'
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'night';

export type StaffBackgroundCheckType =
  | 'police_clearance'
  | 'address_verification'
  | 'employment_history'
  | 'education_verification'
  | 'identity_verification'
  | 'reference_check';

export type StaffDocumentType =
  | 'aadhaar_front'
  | 'aadhaar_back'
  | 'pan_card'
  | 'nursing_certificate'
  | 'first_aid_certificate'
  | 'offer_letter'
  | 'bgv_report'
  | 'other';

export interface StaffOnboardingDocumentInput {
  documentType: StaffDocumentType;
  fileName?: string;
  fileUrl?: string;
  mimeType?: string;
  fileSizeBytes?: number;
  notes?: string;
}

export interface StaffOnboardingZone {
  id: string;
  name: string;
  city: string;
  state: string;
  pincode: string;
  operationsManagerId?: string | null;
}

export interface StaffOnboardingTeam {
  id: string;
  name: string;
  zone: string;
  maxCapacity: number;
  currentCapacity: number;
  fieldManagerId: string;
  fieldManagerName: string;
}

export interface StaffOnboardingOperationsManager {
  id: string;
  userId: string;
  name: string;
  phone: string;
  email?: string | null;
  assignedZones: Array<{
    id: string;
    name: string;
    city: string;
    pincode: string;
  }>;
}

export interface StaffOnboardingMetadata {
  zones: StaffOnboardingZone[];
  teams: StaffOnboardingTeam[];
  operationsManagers: StaffOnboardingOperationsManager[];
  specializations: string[];
}

export interface StaffOnboardingPayload {
  role: StaffOnboardingRole;
  personal: {
    fullName: string;
    preferredName?: string;
    dateOfBirth?: string;
    gender: StaffOnboardingGender;
    mobileNumber: string;
    whatsappNumber?: string;
    email?: string;
    alternatePhone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    pincode?: string;
    aadhaarNumber: string;
    panNumber?: string;
  };
  professional: {
    qualification: string;
    experience?: number | string;
    nursingRegistrationNumber?: string;
    nursingCouncil?: string;
    previousEmployer?: string;
    maxTeamSize?: number | string;
    languages?: string[];
    specialization?: string[];
    preferredShift?: StaffShiftPreference;
    maxDailyVisits?: number | string;
    willingClinicVisits?: boolean;
    hasTwoWheeler?: boolean;
    canApproveRoster?: boolean;
    canOnboardCCs?: boolean;
    ccType?: string;
  };
  assignment: {
    zoneId?: string;
    zoneIds?: string[];
    teamId?: string;
    reportsToUserId?: string;
    bgvType?: StaffBackgroundCheckType;
    bgvAgency?: string;
    bgvVerified?: boolean;
    kycVerified?: boolean;
  };
  documents: StaffOnboardingDocumentInput[];
}
