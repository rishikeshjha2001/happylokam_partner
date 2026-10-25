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
  ownerName?: string;
  gstNumber?: string;
  panNumber?: string;
  bankAccount?: string;
  bankIfsc?: string;
  walletBalance: number;
  referralCode?: string;
  token: string;
}

export interface PartnerServiceItem {
  id: string;
  name: string;
  description: string;
  category: string;
  subCategory?: string;
  pricing: number;
  pricingUnit: string;
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

  // ---- Services ----
  async saveServices(services: PartnerServiceItem[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.SERVICES, JSON.stringify(services));
  }

  async getServices(): Promise<PartnerServiceItem[]> {
    const raw = await AsyncStorage.getItem(KEYS.SERVICES);
    return raw ? JSON.parse(raw) : [];
  }

  // ---- Bookings ----
  async saveBookings(bookings: PartnerBooking[]): Promise<void> {
    await AsyncStorage.setItem(KEYS.BOOKINGS, JSON.stringify(bookings));
  }

  async getBookings(): Promise<PartnerBooking[]> {
    const raw = await AsyncStorage.getItem(KEYS.BOOKINGS);
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
      ]);
    } catch (e) {
      console.warn('PartnerDatabase.cleanCache error:', e);
    }
  }
}

export default new PartnerDatabase();
