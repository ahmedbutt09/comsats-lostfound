// src/utils/helpers.ts
import { 
  format, 
  formatDistance, 
  isToday, 
  isYesterday, 
  parseISO 
} from 'date-fns';
import { 
  DATE_FORMATS, 
  THEME_COLORS, 
  UNIVERSITY_DOMAINS,
  BUILDINGS,
  CASE_STATUS,
  CATEGORIES,
  LOCATIONS,
  CONTACT_INFO_OPTIONS,
  CATEGORY_COLORS,
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  STORAGE_BUCKETS
} from './constants';

// Date Helpers
export const formatDate = (date: Date | string, formatStr: string = DATE_FORMATS.DISPLAY): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

export const formatDateTime = (date: Date | string): string => {
  return formatDate(date, DATE_FORMATS.DISPLAY_WITH_TIME);
};

export const formatRelativeTime = (date: Date | string): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (isToday(dateObj)) {
      return format(dateObj, 'hh:mm a');
    } else if (isYesterday(dateObj)) {
      return 'Yesterday';
    } else {
      return formatDistance(dateObj, new Date(), { addSuffix: true });
    }
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return 'Unknown time';
  }
};

// Supabase date handling
export const toSupabaseDate = (date: Date | string): string => {
  if (typeof date === 'string') return date;
  return date.toISOString();
};

export const fromSupabaseDate = (dateString: string): Date => {
  return parseISO(dateString);
};

// Validation Helpers
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidComsatsEmail = (email: string): boolean => {
  if (!isValidEmail(email)) return false;
  
  const emailLower = email.toLowerCase();
  return UNIVERSITY_DOMAINS.some(domain => 
    emailLower.endsWith(`@${domain.toLowerCase()}`) ||
    emailLower.includes(`@${domain.toLowerCase()}`)
  );
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[0-9+\-\s()]{10,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 6;
};

// String Helpers
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export const capitalizeWords = (str: string): string => {
  if (!str) return '';
  return str.split(' ').map(word => capitalize(word)).join(' ');
};

export const truncate = (str: string, length: number): string => {
  if (!str || str.length <= length) return str || '';
  return str.substring(0, length) + '...';
};

// Case Status Helpers (updated for Supabase)
export const getStatusColor = (status: string): string => {
  switch (status) {
    case CASE_STATUS.ACTIVE:
    case 'pending':
      return THEME_COLORS.info || '#0288D1';
    case CASE_STATUS.CLAIMED:
      return THEME_COLORS.warning || '#ED6C02';
    case CASE_STATUS.RESOLVED:
      return THEME_COLORS.success || '#2E7D32';
    case CASE_STATUS.CLOSED:
      return THEME_COLORS.error || '#D32F2F';
    default:
      return THEME_COLORS.textSecondary || '#757575';
  }
};

export const getStatusText = (status: string): string => {
  switch (status) {
    case CASE_STATUS.ACTIVE:
      return 'Active';
    case CASE_STATUS.CLAIMED:
      return 'Claimed';
    case CASE_STATUS.RESOLVED:
      return 'Resolved';
    case CASE_STATUS.CLOSED:
      return 'Closed';
    case 'pending':
      return 'Pending';
    default:
      return capitalize(status);
  }
};

// Category Helpers
export const getCategoryColor = (category: string): string => {
  return CATEGORY_COLORS[category] || THEME_COLORS.primary || '#003366';
};

// File Helpers (updated for Supabase Storage)
export const validateFile = (file: File): { valid: boolean; message?: string } => {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    return {
      valid: false,
      message: 'Invalid file type. Please upload an image (JPEG, PNG, WebP)',
    };
  }

  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      message: `File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
};

export const getFilePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

// Generate Supabase Storage URL
export const getSupabaseImageUrl = (bucket: keyof typeof STORAGE_BUCKETS, filePath: string): string => {
  if (!filePath) return '';
  
  // If it's already a full URL, return it
  if (filePath.startsWith('http')) return filePath;
  
  // If it's a Supabase Storage path, construct the URL
  if (filePath.includes(STORAGE_BUCKETS[bucket])) {
    return `${process.env.REACT_APP_SUPABASE_URL}/${STORAGE_BUCKETS[bucket]}/${filePath}`;
  }
  
  return filePath;
};

// Generate file path for Supabase Storage
export const generateStoragePath = (
  bucket: keyof typeof STORAGE_BUCKETS,
  userId: string,
  fileName: string
): string => {
  const timestamp = Date.now();
  const extension = fileName.split('.').pop();
  const sanitizedName = fileName.split('.')[0].replace(/[^a-zA-Z0-9]/g, '-');
  return `${userId}/${timestamp}-${sanitizedName}.${extension}`;
};

// Case Helpers
export const generateCaseTitle = (type: 'lost' | 'found', category: string): string => {
  const prefix = type === 'lost' ? 'Lost' : 'Found';
  return `${prefix} ${capitalize(category)}`;
};

export const getBuildingName = (locationCodeOrName: string): string => {
  // Check LOCATIONS array
  const knownLocation = LOCATIONS.find(loc => 
    loc.toLowerCase() === locationCodeOrName.toLowerCase() ||
    locationCodeOrName.toLowerCase().includes(loc.toLowerCase())
  );
  
  if (knownLocation) return knownLocation;
  
  // Check BUILDINGS array if available
  if (BUILDINGS && Array.isArray(BUILDINGS)) {
    const building = BUILDINGS.find(b => 
      (typeof b === 'string' && b.toLowerCase() === locationCodeOrName.toLowerCase()) ||
      locationCodeOrName.toLowerCase().includes(b.toLowerCase())
    );
    if (building) return building;
  }
  
  // Return capitalized version
  return capitalizeWords(locationCodeOrName);
};

// URL Helpers
export const generateCaseUrl = (caseId: string): string => {
  return `/case/${caseId}`;
};

export const generateUserUrl = (userId: string): string => {
  return `/profile/${userId}`;
};

export const generateChatUrl = (caseId: string, userId: string, userName: string, caseTitle?: string): string => {
  const params = new URLSearchParams({
    userId,
    userName: encodeURIComponent(userName),
  });
  
  if (caseTitle) {
    params.append('caseTitle', encodeURIComponent(caseTitle));
  }
  
  return `/chat/${caseId}?${params.toString()}`;
};

// Supabase Data Helpers (replaces Firestore conversion)
export const prepareSupabaseData = (data: any): any => {
  if (!data) return data;

  // First, convert all keys from camelCase to snake_case
  let formattedData = toSnakeCase(data);

  // Then handle specific type conversions (like Dates)
  const processValues = (val: any): any => {
    if (val instanceof Date) {
      return val.toISOString();
    }
    
    if (Array.isArray(val)) {
      return val.map(item => processValues(item));
    }
    
    if (typeof val === 'object' && val !== null) {
      const result: any = {};
      for (const key in val) {
        if (val[key] !== undefined && val[key] !== null) {
          result[key] = processValues(val[key]);
        }
      }
      return result;
    }
    return val;
  };

  return processValues(formattedData);
};

// Convert snake_case to camelCase for frontend
export const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const result: any = {};
    for (const key in obj) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
    }
    return result;
  }
  
  return obj;
};

// Convert camelCase to snake_case for Supabase
export const toSnakeCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(item => toSnakeCase(item));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const result: any = {};
    for (const key in obj) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(obj[key]);
    }
    return result;
  }
  
  return obj;
};

// Random Helpers
export const generateId = (length: number = 8): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const generateCaseId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `CASE-${timestamp}-${random}`.toUpperCase();
};

// Debounce Helper
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: number | undefined;
  
  return (...args: Parameters<T>) => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    
    timeoutId = window.setTimeout(() => {
      func(...args);
      timeoutId = undefined;
    }, wait);
  };
};

// Local Storage Helpers
export const storage = {
  get: <T>(key: string, defaultValue: T): T => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },
  
  set: (key: string, value: any): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  },
  
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  },
  
  clear: (): void => {
    try {
      localStorage.clear();
    } catch (error) {
      console.error('Error clearing localStorage:', error);
    }
  },
};

// Contact preference helper
export const getContactPreferenceText = (preference: string): string => {
  switch (preference) {
    case CONTACT_INFO_OPTIONS.CHAT:
      return 'In-app Chat';
    case CONTACT_INFO_OPTIONS.EMAIL:
      return 'Email';
    case CONTACT_INFO_OPTIONS.PHONE:
      return 'Phone Call';
    default:
      return capitalize(preference);
  }
};

// Category validation helper
export const isValidCategory = (category: string): boolean => {
  return CATEGORIES.includes(category as any);
};

// Location validation helper
export const isValidLocation = (location: string): boolean => {
  return LOCATIONS.includes(location as any);
};
