import AsyncStorage from '@react-native-async-storage/async-storage';

// ==========================================
// TYPES
// ==========================================

export interface PartnerSession {
  id: string;
  hlpId: string;
  name: string;
  email: string;
  phone: string;
  businessName: string;
  categories: string[];
  location: string;
  status: string;
  isVerified: boolean;
  subscriptionStatus?: string;
  subscriptionEnd?: string;
  ownerName?: string;
  gstNumber?: string;
  panNumber?: string;
  bankAccount?: string;
  bankIfsc?: string;
  walletBalance: number;
  referralCode?: string;
  token: string;
}

export interface PartnerServicePackage {
  name: string;
  guests: number;
  price: number;
  description?: string;
}

export interface PartnerServiceItem {
  id: string;
  name: string;
  description: string;
  category: string;
  subCategory?: string;
  pricing: number;
  pricingUnit: string;
  pricingModel?: 'PER_PERSON' | 'FIXED_PACKAGE' | 'MANUAL_CUSTOM';
  pricePerPerson?: number;
  availableCities?: string[];
  minGuests?: number;
  maxGuests?: number;
  packages?: PartnerServicePackage[];
  capacity?: number;
  images: string[];
  documents: string[];
  features: string[];
  location: string;
  city: string;
  availability: string;
  status: string;
  adminRemarks?: string;
  rating: number;
  totalBookings: number;
  isActive: boolean;
  createdAt: string;
}

export interface PartnerBooking {
  id: string;
  userId: string;
  user?: { name: string; email: string; phone?: string };
  venueId?: string;
  venue?: { name: string };
  date: string;
  status: string;
  baseAmount: number;
  platformFee: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus?: string;
  ticketId?: string;
  createdAt: string;
}

export interface DashboardStats {
  totalBookings: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalServices: number;
  activeServices: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

// ==========================================
// STORAGE KEYS
// ==========================================

const KEYS = {
  SESSION: '@partner_session',
  SERVICES: '@partner_services',
  BOOKINGS: '@partner_bookings',
  DASHBOARD: '@partner_dashboard',
  NOTIFICATIONS: '@partner_notifications',
};

// ==========================================
// PARTNER DATABASE (AsyncStorage-backed)
// ==========================================

class PartnerDatabase {
  // ---- Session ----
  async saveSession(session: PartnerSession): Promise<void> {
    await AsyncStorage.setItem(KEYS.SESSION, JSON.stringify(session));
  }

  async getSession(): Promise<PartnerSession | null> {
    const raw = await AsyncStorage.getItem(KEYS.SESSION);
    return raw ? JSON.parse(raw) : null;
  }

  async clearSession(): Promise<void> {
    await AsyncStorage.multiRemove(Object.values(KEYS));
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return !!(session?.token);
  }

  async getToken(): Promise<string | null> {
    const session = await this.getSession();
    return session?.token || null;
  }

  // ---- Services CRUD Helpers ----
  async saveServices(services: PartnerServiceItem[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.SERVICES, JSON.stringify(services));
  }

  async getServices(): Promise<PartnerServiceItem[]> {
    const raw = await AsyncStorage.getItem(KEYS.SERVICES);
    return raw ? JSON.parse(raw) : [];
  }

  async updateService(service: PartnerServiceItem): Promise<void> {
    const existing = await this.getServices();
    const index = existing.findIndex((s) => s.id === service.id);
    if (index >= 0) {
      existing[index] = service;
    } else {
      existing.unshift(service);
    }
    await this.saveServices(existing);
  }

  async deleteService(id: string): Promise<void> {
    const existing = await this.getServices();
    const filtered = existing.filter((s) => s.id !== id);
    await this.saveServices(filtered);
  }

  // ---- Bookings ----
  async saveBookings(bookings: PartnerBooking[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
  }

  async getBookings(): Promise<PartnerBooking[]> {
    const raw = await AsyncStorage.getItem(KEYS.BOOKINGS);
    return raw ? JSON.parse(raw) : [];
  }

  async updateBooking(booking: PartnerBooking): Promise<void> {
    const existing = await this.getBookings();
    const index = existing.findIndex((b) => b.id === booking.id);
    if (index >= 0) {
      existing[index] = booking;
    } else {
      existing.unshift(booking);
    }
    await this.saveBookings(existing);
  }

  // ---- Notifications ----
  async saveNotifications(notifications: any[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }

  async getNotifications(): Promise<any[]> {
    const raw = await AsyncStorage.getItem(KEYS.NOTIFICATIONS);
    return raw ? JSON.parse(raw) : [];
  }

  // ---- Dashboard ----
  async saveDashboard(data: any): Promise<void> {
    await AsyncStorage.setItem(KEYS.DASHBOARD, JSON.stringify(data));
  }

  async getDashboard(): Promise<any | null> {
    const raw = await AsyncStorage.getItem(KEYS.DASHBOARD);
    return raw ? JSON.parse(raw) : null;
  }

  // ---- Clean Cache ----
  async cleanCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        KEYS.SERVICES,
        KEYS.BOOKINGS,
        KEYS.DASHBOARD,
        KEYS.NOTIFICATIONS,
      ]);
    } catch (e) {
      console.warn('PartnerDatabase.cleanCache error:', e);
    }
  }
}

export default new PartnerDatabase();
