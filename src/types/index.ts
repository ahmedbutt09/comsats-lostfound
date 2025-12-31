// src/types/index.ts (RECOMMENDED)
import type { Database } from '../lib/supabase'

// Export database types directly
export type { Database }

export type DbUser = Database['public']['Tables']['users']['Row']
export type Case = Database['public']['Tables']['cases']['Row']
export type Message = Database['public']['Tables']['messages']['Row']
export type Chat = Database['public']['Tables']['chats']['Row']
export type Category = Database['public']['Tables']['categories']['Row']

// Create utility types for your app
export type CaseStatus = 'active' | 'claimed' | 'resolved' | 'closed'
export type ContactPreference = 'chat' | 'email' | 'phone'
export type UserRole = 'student' | 'faculty' | 'staff' | 'admin'

// Form types (keep these)
export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}
export interface User extends Omit<DbUser, 'student_id'> {
  student_id?: string | null;
  studentId?: string | null; // Add this to support frontend forms
}
export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  studentId?: string;
  department?: string;
  role: 'student' | 'faculty' | 'staff';
}

export interface CaseFormData {
  type: 'lost' | 'found';
  title: string;
  description: string;
  category: string;
  location: string;
  date: string;
  reward?: number;
  contact_info: ContactPreference;
}

// Helper to convert form data to database insert
export type CaseInsert = Omit<Database['public']['Tables']['cases']['Insert'], 'user_id'> & {
  user_id: string;
}
