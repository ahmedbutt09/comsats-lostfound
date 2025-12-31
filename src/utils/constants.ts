// Supabase table names (no longer needed as constants since we use direct references)
// export const COLLECTIONS = {
//   USERS: 'users',
//   CASES: 'cases',
//   MESSAGES: 'messages',
//   NOTIFICATIONS: 'notifications',
//   CHATS: 'chats',
//   MATCHES: 'matches',
// } as const;

// Updated to match Supabase status values
export const CASE_STATUS = {
  ACTIVE: 'active',    // Changed from OPEN to ACTIVE
  CLAIMED: 'claimed',  // Changed from MATCHED to CLAIMED
  RESOLVED: 'resolved',
  CLOSED: 'closed',
} as const;

// Case type aliases for better readability
export const CASE_TYPE = {
  LOST: 'lost',
  FOUND: 'found',
} as const;

export const CASE_TYPES = CASE_TYPE; // For backward compatibility

export const USER_ROLES = {
  STUDENT: 'student',
  FACULTY: 'faculty',
  STAFF: 'staff',
  ADMIN: 'admin',
} as const;

export const CATEGORIES = [
  'Electronics',
  'Documents',
  'Accessories',
  'Books & Notes',
  'Clothing',
  'Wallets & Purses',
  'Keys',
  'ID Cards',
  'Other',
] as const;

export const LOCATIONS = [
  'Main Campus',
  'Library',
  'Cafeteria',
  'Auditorium',
  'Sports Complex',
  'Parking Area',
  'Admin Block',
  'Computer Labs',
  'Classroom Block A',
  'Classroom Block B',
  'Hostels',
  'Other',
] as const;

// Updated to snake_case for consistency with database
export const CONTACT_INFO_OPTIONS = {
  CHAT: 'chat',
  EMAIL: 'email',
  PHONE: 'phone',
} as const;

// Alias for backward compatibility
export const CONTACT_PREFERENCES = CONTACT_INFO_OPTIONS;

export const NOTIFICATION_TYPES = {
  MATCH: 'match',
  MESSAGE: 'message',
  STATUS_UPDATE: 'status_update',
  SYSTEM: 'system',
} as const;

export const UNIVERSITY_DOMAINS = [
  'comsats.edu.pk',
  'ciit.net.pk',
  'ciit-wah.edu.pk',
  'cuiatd.edu.pk',
  'cuilahore.edu.pk',
  'cuiwah.edu.pk',
] as const;

export const THEME_COLORS = {
  primary: '#003366',       // COMSATS Blue
  secondary: '#FF6600',     // COMSATS Orange
  success: '#2E7D32',
  warning: '#ED6C02',
  error: '#D32F2F',
  info: '#0288D1',
  background: '#F5F5F5',
  textPrimary: '#212121',
  textSecondary: '#757575'
} as const;

export const BUILDINGS = [
  'Academic Block A', 'Academic Block B', 'Academic Block C',
  'Central Library', 'Main Auditorium', 'Faculty Block',
  'Administration Block', 'Sports Complex', 'Parking Area',
  'Cafeteria', 'Hostel Block'
] as const;

// For backward compatibility
export const UNIVERSITY_DOMAIN = 'comsats.edu.pk';

// Category colors mapping
export const CATEGORY_COLORS: Record<string, string> = {
  'Electronics': '#2196F3',
  'Documents': '#4CAF50',
  'Accessories': '#9C27B0',
  'Books & Notes': '#FF9800',
  'Clothing': '#E91E63',
  'Wallets & Purses': '#FF5722',
  'Keys': '#795548',
  'ID Cards': '#FFC107',
  'Other': '#9E9E9E',
  'Wallet/Purse': '#FF5722',       // For backward compatibility
  'Phone/Mobile': '#2196F3',       // For backward compatibility
  'Laptop/Tablet': '#4CAF50',      // For backward compatibility
};

export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  DISPLAY_WITH_TIME: 'MMM dd, yyyy HH:mm',
  INPUT: 'yyyy-MM-dd',
  DATABASE: 'yyyy-MM-dd HH:mm:ss', // ISO format for Supabase
};

// File upload constants
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

// Storage bucket names for Supabase
export const STORAGE_BUCKETS = {
  CASE_IMAGES: 'images',  // For case photos
  USER_AVATARS: 'user-avatars', // For profile pictures
} as const;

// Pagination constants
export const PAGINATION = {
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Supabase specific constants
export const SUPABASE = {
  AUTH_COOKIE_NAME: 'supabase-auth-token',
  STORAGE_URL_PREFIX: 'storage/v1/object/public/',
} as const;

// Message status constants
export const MESSAGE_STATUS = {
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
} as const;

// Match status constants
export const MATCH_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
} as const;
