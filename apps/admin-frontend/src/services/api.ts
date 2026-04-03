/**
 * MaiHoonNa Senior Care Operations Portal - API Service Layer
 * This file contains all API interaction functions
 * Currently returns mock data - replace with actual API calls when backend is ready
 */

import {
  mockUsers,
  mockZones,
  mockOperationsManagers,
  mockCareCompanions,
  mockSubscribers,
  mockBeneficiaries,
  mockSupportTickets,
  mockActivityLogs,
  mockPartners,
  mockVolunteers,
  mockBenefits,
  mockSubscriptionPackages,
  mockTodayVisits,
  mockStaffOnboardingMetadata,
} from './mockData';

import type {
  User,
  Zone,
  OperationsManager,
  CareCompanion,
  Subscriber,
  Beneficiary,
  SupportTicket,
  ActivityLog,
  Partner,
  Volunteer,
  Benefit,
  SubscriptionPackage,
  VisitBlock,
  StaffOnboardingMetadata,
  StaffOnboardingPayload,
} from '../types';

// Simulate network delay for realistic behavior
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3001/api';

const apiFetch = async (url: string, options: RequestInit = {}) => {
  const savedUser = localStorage.getItem('maihonna_user');
  let token = '';
  if (savedUser) {
    try {
      token = JSON.parse(savedUser).token;
    } catch (e) {}
  }
  
  const headers = {
    ...options.headers,
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
  
  return window.fetch(url, { ...options, headers });
};

const apiJson = async <T>(path: string, options: RequestInit = {}): Promise<T> => {
  const headers =
    options.body instanceof FormData
      ? options.headers
      : { 'Content-Type': 'application/json', ...options.headers };

  const response = await apiFetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  const result = text ? JSON.parse(text) : {};

  if (!response.ok || result.success === false) {
    throw new Error(result.message || `Request failed with status ${response.status}`);
  }

  return result.data as T;
};

// ============================================================================
// AUTHENTICATION API
// ============================================================================

export const authApi = {
  /**
   * Login with phone and OTP
   * @param phone - User's phone number
   * @param otp - One-time password
   * @returns User object if credentials are valid
   */
  async login(phone: string, password: string): Promise<User> {
    const response = await window.fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message || 'Invalid credentials');
    return result.data;
  },

  /**
   * Login with biometric authentication
   * @param userId - User ID
   * @returns User object if biometric is valid
   */
  async biometricLogin(userId: string): Promise<User> {
    await delay();
    const user = mockUsers.find(u => u.id === userId && u.biometricEnabled);
    if (user) {
      return user;
    }
    throw new Error('Biometric authentication failed');
  },

  /**
   * Send OTP to phone number
   * @param phone - User's phone number
   */
  async sendOTP(phone: string): Promise<void> {
    await delay();
    // In production, trigger SMS/WhatsApp OTP
    console.log(`OTP sent to ${phone}: 123456`);
  },
};

// ============================================================================
// USER MANAGEMENT API
// ============================================================================

export const userApi = {
  /**
   * Get all users
   */
  async getAll(): Promise<User[]> {
    await delay();
    return [...mockUsers];
  },

  /**
   * Get user by ID
   */
  async getById(id: string): Promise<User | undefined> {
    await delay();
    return mockUsers.find(u => u.id === id);
  },

  /**
   * Create new user
   */
  async create(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    await delay();
    const newUser: User = {
      ...user,
      id: `U${String(mockUsers.length + 1).padStart(3, '0')}`,
      createdAt: new Date().toISOString(),
    };
    mockUsers.push(newUser);
    return newUser;
  },

  /**
   * Update user
   */
  async update(id: string, updates: Partial<User>): Promise<User> {
    await delay();
    const index = mockUsers.findIndex(u => u.id === id);
    if (index === -1) throw new Error('User not found');
    mockUsers[index] = { ...mockUsers[index], ...updates };
    return mockUsers[index];
  },

  /**
   * Create staff member (User + Profile)
   */
  async createStaff(data: { name: string; phone: string; role: string; zoneId: string }): Promise<any> {
    return apiJson('/users/staff', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// ============================================================================
// ZONES API
// ============================================================================

export const zoneApi = {
  async getAll(): Promise<Zone[]> {
    return apiJson('/zones');
  },

  async getById(id: string): Promise<Zone | undefined> {
    return apiJson(`/zones/${id}`);
  },

  async create(zone: Omit<Zone, 'id' | 'createdAt'>): Promise<Zone> {
    return apiJson('/zones', {
      method: 'POST',
      body: JSON.stringify(zone),
    });
  },

  async update(id: string, updates: Partial<Zone>): Promise<Zone> {
    return apiJson(`/zones/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async assignOM(id: string, omId: string | null): Promise<any> {
    return apiJson(`/zones/${id}/assign-om`, {
      method: 'PUT',
      body: JSON.stringify({ operationsManagerId: omId }),
    });
  },
};

// ============================================================================
// OPERATIONS MANAGER API
// ============================================================================

export const operationsManagerApi = {
  async getAll(): Promise<any[]> {
    return apiJson('/users/operations-managers');
  },
  async getAllPaginated(params: { search: string; searchBy?: string; page: number; limit: number }): Promise<any> {
    const query = new URLSearchParams({
      search: params.search,
      searchBy: params.searchBy || '',
      page: params.page.toString(),
      limit: params.limit.toString()
    }).toString();
    return apiJson(`/users/operations-managers?${query}`);
  },

  async getById(id: string): Promise<any | undefined> {
    const managers = await this.getAll();
    return managers.find((manager: any) => manager.id === id);
  },
};

export const fieldManagerApi = {
  async getAll(): Promise<any[]> {
    return apiJson('/users/field-managers');
  },
  async getAllPaginated(params: { search: string; searchBy?: string; page: number; limit: number }): Promise<any> {
    const query = new URLSearchParams({
      search: params.search,
      searchBy: params.searchBy || '',
      page: params.page.toString(),
      limit: params.limit.toString()
    }).toString();
    return apiJson(`/users/field-managers?${query}`);
  },
};

// ============================================================================
// CARE COMPANION API
// ============================================================================

export const careCompanionApi = {
  async getAll(): Promise<any[]> {
    return apiJson('/users/care-companions');
  },
  async getAllPaginated(params: { search: string; searchBy?: string; page: number; limit: number }): Promise<any> {
    const query = new URLSearchParams({
      search: params.search,
      searchBy: params.searchBy || '',
      page: params.page.toString(),
      limit: params.limit.toString()
    }).toString();
    return apiJson(`/users/care-companions?${query}`);
  },

  async getById(id: string): Promise<CareCompanion | undefined> {
    await delay();
    return mockCareCompanions.find(cc => cc.id === id);
  },

  async getByZone(zoneId: string): Promise<CareCompanion[]> {
    await delay();
    return mockCareCompanions.filter(cc => cc.zoneId === zoneId);
  },
};

// ============================================================================
// SUBSCRIBER API
// ============================================================================

export const subscriberApi = {
  async getAll(): Promise<any[]> {
    try {
      return await apiJson('/subscribers');
    } catch (err) {
      console.error('subscriberApi.getAll failed, falling back to mock:', err);
      return [...mockSubscribers];
    }
  },
  async getAllPaginated(params: { search: string; searchBy?: string; page: number; limit: number }): Promise<any> {
    const query = new URLSearchParams({
      search: params.search,
      searchBy: params.searchBy || '',
      page: params.page.toString(),
      limit: params.limit.toString()
    }).toString();
    return apiJson(`/subscribers?${query}`);
  },

  async getById(id: string): Promise<any | undefined> {
    try {
      return await apiJson(`/subscribers/${id}`);
    } catch {
      return mockSubscribers.find(s => s.id === id);
    }
  },
};

// ============================================================================
// BENEFICIARY API
// ============================================================================

export const beneficiaryApi = {
  async getAll(): Promise<any[]> {
    try {
      const data = await apiJson<any[]>('/beneficiaries');
      // Normalize to match expected shape
      return (data || []).map((b: any) => {
        const emContacts = Array.isArray(b.emergencyContacts) ? b.emergencyContacts : [];
        const firstEmContact = emContacts[0] || {};
        return {
          ...b,
          medicalHistory: b.medicalConditions
            ? (typeof b.medicalConditions === 'string'
                ? b.medicalConditions.split(',').map((s: string) => s.trim()).filter(Boolean)
                : b.medicalConditions)
            : [],
          medications: b.medications || [],
          emergencyContact: { 
            name: firstEmContact.name || b.subscriberName || 'N/A', 
            relation: firstEmContact.relation || 'Subscriber', 
            phone: firstEmContact.phone || b.subscriberPhone || '' 
          },
          careCompanion: b.careCompanion,
          secondaryCareCompanion: b.secondaryCareCompanion,
          fieldManager: b.fieldManager,
          emotionalScore: b.emotionalScore,
          clinicalConfiguration: {
            bloodPressure: { enabled: true, frequency: 'daily', alertThresholds: { min: 80, max: 140 } },
            spO2: { enabled: true, frequency: 'daily', alertThresholds: { min: 94, max: null } },
            temperature: { enabled: false, frequency: 'weekly', alertThresholds: null },
            heartRate: { enabled: true, frequency: 'daily', alertThresholds: { min: 55, max: 100 } },
            bloodSugar: { enabled: false, frequency: 'weekly', alertThresholds: null },
            weight: { enabled: false, frequency: 'monthly', alertThresholds: null },
          }
        };
      });
    } catch (err) {
      console.error('beneficiaryApi.getAll failed, falling back to mock:', err);
      return [...mockBeneficiaries];
    }
  },
  async getAllPaginated(params: { search: string; searchBy?: string; page: number; limit: number }): Promise<any> {
    const query = new URLSearchParams({
      search: params.search,
      searchBy: params.searchBy || '',
      page: params.page.toString(),
      limit: params.limit.toString()
    }).toString();
    return apiJson(`/beneficiaries?${query}`);
  },

  async getById(id: string): Promise<any | undefined> {
    try {
      return await apiJson(`/beneficiaries/${id}`);
    } catch {
      return mockBeneficiaries.find(b => b.id === id);
    }
  },

  async getBySubscriber(subscriberId: string): Promise<any[]> {
    await delay();
    return mockBeneficiaries.filter(b => b.subscriberId === subscriberId);
  },

  async updateClinicalConfig(id: string, config: Partial<Beneficiary['clinicalConfiguration']>): Promise<Beneficiary> {
    await delay();
    const index = mockBeneficiaries.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Beneficiary not found');
    mockBeneficiaries[index].clinicalConfiguration = {
      ...mockBeneficiaries[index].clinicalConfiguration,
      ...config,
    };
    return mockBeneficiaries[index];
  },

  async getAvailableStaff(pincode: string): Promise<{ careCompanions: any[]; fieldManagers: any[]; zones: any[] }> {
    try {
      return await apiJson(`/beneficiaries/available-staff?pincode=${encodeURIComponent(pincode)}`);
    } catch (err) {
      console.error('beneficiaryApi.getAvailableStaff failed:', err);
      return { careCompanions: [], fieldManagers: [], zones: [] };
    }
  },

  async assignStaff(beneficiaryId: string, payload: { primaryCcId?: string | null; secondaryCcId?: string | null; fieldManagerId?: string | null }): Promise<any> {
    return apiJson(`/beneficiaries/${beneficiaryId}/assign-staff`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};


// ============================================================================
// SCHEDULE / VISITS API
// ============================================================================

export const scheduleApi = {
  async getTodayVisits(): Promise<VisitBlock[]> {
    await delay();
    return [...mockTodayVisits];
  },

  async assignCareCompanion(visitId: string, careCompanionId: string): Promise<VisitBlock> {
    await delay();
    const index = mockTodayVisits.findIndex(v => v.id === visitId);
    if (index === -1) throw new Error('Visit not found');
    mockTodayVisits[index].careCompanionId = careCompanionId;
    return mockTodayVisits[index];
  },

  async updateVisitStatus(visitId: string, status: VisitBlock['status']): Promise<VisitBlock> {
    await delay();
    const index = mockTodayVisits.findIndex(v => v.id === visitId);
    if (index === -1) throw new Error('Visit not found');
    mockTodayVisits[index].status = status;
    return mockTodayVisits[index];
  },
};

// ============================================================================
// SUPPORT TICKETS API
// ============================================================================

export const supportApi = {
  async getAll(): Promise<SupportTicket[]> {
    await delay();
    return [...mockSupportTickets];
  },

  async getById(id: string): Promise<SupportTicket | undefined> {
    await delay();
    return mockSupportTickets.find(t => t.id === id);
  },

  async updateStatus(id: string, status: SupportTicket['status']): Promise<SupportTicket> {
    await delay();
    const index = mockSupportTickets.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Ticket not found');
    mockSupportTickets[index].status = status;
    mockSupportTickets[index].updatedAt = new Date().toISOString();
    if (status === 'resolved' || status === 'closed') {
      mockSupportTickets[index].resolvedAt = new Date().toISOString();
    }
    return mockSupportTickets[index];
  },
};

// ============================================================================
// ACTIVITY LOG API
// ============================================================================

export const activityLogApi = {
  async getAll(limit?: number): Promise<ActivityLog[]> {
    await delay();
    const logs = [...mockActivityLogs].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return limit ? logs.slice(0, limit) : logs;
  },

  async logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>): Promise<ActivityLog> {
    await delay();
    const newLog: ActivityLog = {
      ...activity,
      id: `LOG${String(mockActivityLogs.length + 1).padStart(3, '0')}`,
      timestamp: new Date().toISOString(),
    };
    mockActivityLogs.unshift(newLog);
    return newLog;
  },
};

// ============================================================================
// PARTNER API
// ============================================================================

export const partnerApi = {
  async getAll(): Promise<Partner[]> {
    await delay();
    return [...mockPartners];
  },

  async getById(id: string): Promise<Partner | undefined> {
    await delay();
    return mockPartners.find(p => p.id === id);
  },
};

// ============================================================================
// VOLUNTEER API
// ============================================================================

export const volunteerApi = {
  async getAll(): Promise<Volunteer[]> {
    await delay();
    return [...mockVolunteers];
  },

  async getById(id: string): Promise<Volunteer | undefined> {
    await delay();
    return mockVolunteers.find(v => v.id === id);
  },
};

// ============================================================================
// PRODUCT FACTORY API (Benefits & Packages & Vitals) — real backend
// ============================================================================

export const vitalApi = {
  async getAll(options?: { activeOnly?: boolean }): Promise<any[]> {
    const query = options?.activeOnly ? '?activeOnly=true' : '';
    return apiJson(`/vitals${query}`);
  },
  async create(data: any): Promise<any> {
    return apiJson('/vitals', { method: 'POST', body: JSON.stringify(data) });
  },
  async update(id: string, data: any): Promise<any> {
    return apiJson(`/vitals/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  async remove(id: string): Promise<void> {
    return apiJson(`/vitals/${id}`, { method: 'DELETE' });
  },
};

export const benefitTypeApi = {
  async getAll(): Promise<any[]> { return apiJson('/benefit-types'); },
  async create(data: { name: string; description?: string; iconCode?: string; displayOrder?: number }): Promise<any> {
    return apiJson('/benefit-types', { method: 'POST', body: JSON.stringify(data) });
  },
  async update(id: string, data: any): Promise<any> {
    return apiJson(`/benefit-types/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  async remove(id: string): Promise<void> { return apiJson(`/benefit-types/${id}`, { method: 'DELETE' }); },
};

export const benefitApi = {
  async getAll(options?: { activeOnly?: boolean }): Promise<any[]> { 
    const query = options?.activeOnly ? '?activeOnly=true' : '';
    return apiJson(`/benefits${query}`); 
  },
  async create(data: { benefitTypeId: string; name: string; description?: string; isChargeable?: boolean; unitCost?: number; unitLabel?: string; defaultUnits?: number; displayOrder?: number }): Promise<any> {
    return apiJson('/benefits', { method: 'POST', body: JSON.stringify(data) });
  },
  async update(id: string, data: any): Promise<any> {
    return apiJson(`/benefits/${id}`, { method: 'PATCH', body: JSON.stringify(data) });
  },
  async remove(id: string): Promise<void> { return apiJson(`/benefits/${id}`, { method: 'DELETE' }); },
};

export const packageApi = {
  async getAll(): Promise<any[]> { return apiJson('/packages'); },
  async getOne(id: string): Promise<any> { return apiJson(`/packages/${id}`); },
  async create(data: { name: string; totalCost: number; activeFrom: string; benefits?: any[]; [key: string]: any }): Promise<any> {
    return apiJson('/packages', { method: 'POST', body: JSON.stringify(data) });
  },
  async update(id: string, data: { name?: string; totalCost?: number; activeFrom?: string; benefits?: any[]; [key: string]: any }): Promise<any> {
    return apiJson(`/packages/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async delete(id: string): Promise<void> { return apiJson(`/packages/${id}`, { method: 'DELETE' }); },
  async updateBenefits(id: string, benefits: { benefitId: string; unitsIncluded: number; unitsPeriod?: string; isUnlimited?: boolean }[]): Promise<any> {
    return apiJson(`/packages/${id}/benefits`, { method: 'POST', body: JSON.stringify({ benefits }) });
  },
};
// ============================================================================
// TEAM MANAGEMENT & ONBOARDING API
// ============================================================================

export const couponApi = {
  async getAll(): Promise<any[]> {
    return apiJson('/coupons');
  },
  async getOne(id: string): Promise<any> {
    return apiJson(`/coupons/${id}`);
  },
  async create(data: any): Promise<any> {
    return apiJson('/coupons', { method: 'POST', body: JSON.stringify(data) });
  },
  async update(id: string, data: any): Promise<any> {
    return apiJson(`/coupons/${id}`, { method: 'PUT', body: JSON.stringify(data) });
  },
  async delete(id: string): Promise<void> {
    return apiJson(`/coupons/${id}`, { method: 'DELETE' });
  },
  async getStats(): Promise<any> {
    return apiJson('/coupons/analytics/stats');
  }
};

export const teamApi = {
  async getTeams(): Promise<any[]> {
    return apiJson('/teams');
  },

  async createTeam(data: { name: string; fieldManagerId: string; zone: string; careCompanionIds: string[] }): Promise<any> {
    return apiJson('/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getAvailableCompanions(includeTeamId?: string): Promise<CareCompanion[]> {
    const query = includeTeamId ? `?includeTeamId=${includeTeamId}` : '';
    return apiJson(`/teams/available-companions${query}`);
  },

  async getTeamById(id: string): Promise<any> {
    return apiJson(`/teams/${id}`);
  },

  async updateTeam(id: string, data: { name?: string; fieldManagerId?: string; zone?: string; careCompanionIds?: string[] }): Promise<any> {
    return apiJson(`/teams/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async getAvailableManagers(): Promise<any[]> {
    return apiJson('/teams/available-managers');
  },

  async onboardCC(data: { userId: string; bio: string; specialization: string[]; zone: string }): Promise<any> {
    return apiJson('/teams/onboard-cc', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async onboardFM(data: { userId: string; zone: string }): Promise<any> {
    return apiJson('/teams/onboard-fm', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getZones(): Promise<any[]> {
    return apiJson('/zones');
  }
};

export const staffOnboardingApi = {
  async getMetadata(): Promise<StaffOnboardingMetadata> {
    try {
      return await apiJson('/users/staff/onboarding-metadata');
    } catch (err: any) {
      // Only fall back to mock if the backend is genuinely unreachable (network error)
      // 403/500 from a live server should NOT silently fallback – it means backend is there but failing
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.warn('Network unavailable, falling back to mock metadata');
        await delay(500);
        return mockStaffOnboardingMetadata;
      }
      // Re-throw real HTTP errors (e.g. 403 unauthorized, 500 server error)
      throw err;
    }
  },

  async onboard(payload: StaffOnboardingPayload): Promise<any> {
    try {
      return await apiJson('/users/staff/onboard', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    } catch (err: any) {
      // Only fall back to mock if it's a genuine network failure (no connection)
      // Real HTTP errors (400, 500 etc.) from a live backend must be re-thrown
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.warn('Network unavailable, simulating successful onboarding');
        await delay(1000);
        return { success: true, message: 'Mock onboarding successful' };
      }
      // Re-throw real backend errors so UI can display them
      throw err;
    }
  },

  /**
   * Upload a single document file to backend storage (Supabase).
   * Must be called after the staff profile is created, so we have a staffProfileId.
   */
  async uploadDocument(staffProfileId: string, documentType: string, file: File): Promise<{ fileUrl: string; fileKey: string }> {
    const formData = new FormData();
    formData.append('staffProfileId', staffProfileId);
    formData.append('documentType', documentType);
    formData.append('file', file);

    // Use apiFetch directly since apiJson would set Content-Type: application/json
    const response = await apiFetch(`${API_BASE}/upload-document`, {
      method: 'POST',
      body: formData,
    });

    const text = await response.text();
    const result = text ? JSON.parse(text) : {};

    if (!response.ok || result.success === false) {
      throw new Error(result.message || `File upload failed with status ${response.status}`);
    }

    return result.data;
  },

  async getStaffDetails(userId: string): Promise<any> {
    return apiJson(`/users/staff/${userId}`);
  },

  async updateStaff(userId: string, data: any): Promise<any> {
    return apiJson(`/users/staff/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  
  async deactivateStaff(userId: string): Promise<any> {
    return apiJson(`/users/staff/${userId}/deactivate`, {
      method: 'PUT',
    });
  },
};


