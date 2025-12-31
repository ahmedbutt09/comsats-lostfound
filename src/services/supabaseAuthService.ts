// src/services/supabaseAuthService.ts
import { supabase } from '../lib/supabaseClient';
import { User, RegisterFormData } from '../types';
import { prepareSupabaseData, toCamelCase } from '../utils/helpers';
import toast from 'react-hot-toast';

export const authService = {
  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) throw error;

      // Get user profile data
      const userProfile = await this.getUserProfile(data.user.id);
      
      return {
        user: data.user,
        session: data.session,
        userData: userProfile,
      };
    } catch (error: any) {
      console.error('Sign in error:', error);
      
      // User-friendly error messages
      let message = 'Login failed';
      if (error.message.includes('Invalid login credentials')) {
        message = 'Invalid email or password';
      } else if (error.message.includes('Email not confirmed')) {
        message = 'Please verify your email address';
      } else if (error.message.includes('Email rate limit exceeded')) {
        message = 'Too many attempts. Please try again later';
      }
      
      throw new Error(message);
    }
  },

 /**
   * Sign up new user
   */
 async signUp(
  email: string, 
  password: string, 
  name: string,
  additionalData?: Partial<User>
) {
  try {
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          name,
          email_verified: false,
        },
      },
    });

    if (authError) throw authError;

    if (!authData.user) {
      throw new Error('User creation failed');
    }

    // FIX: Create user profile matching your EXACT database columns
    // Removed 'display_name' and 'photo_url' as they don't exist in your table
    const studentIdValue = additionalData?.studentId || (additionalData as any)?.student_id || null;

const userProfile = {
  id: authData.user.id,
  email: authData.user.email!,
  name,
  role: additionalData?.role || 'student',
  phone: additionalData?.phone || null,
  department: additionalData?.department || null,
  student_id: studentIdValue, // Map the value here
  is_active: true,
};
const { error: profileError } = await supabase
  .from('users')
  .insert([prepareSupabaseData(userProfile)]);

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // We log it but don't crash, because the Auth account was already created
    }

    return {
      user: authData.user,
      session: authData.session,
      userData: toCamelCase(userProfile),
    };
  } catch (error: any) {
    // ... (rest of your error handling)
    throw new Error(error.message || 'Registration failed');
  }
},
  /**
   * Sign in with Google OAuth
   */
  async signInWithGoogle() {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Google sign in error:', error);
      throw new Error('Google sign in failed. Please try again');
    }
  },

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  },

  /**
   * Get current session
   */
  async getSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (error) {
      console.error('Get session error:', error);
      return null;
    }
  },

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      return user;
    } catch (error) {
      console.error('Get user error:', error);
      return null;
    }
  },

  /**
   * Get user profile from database
   */
  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // Changed from .single()
  
      if (error) {
        console.error("Database fetch error:", error);
        return null;
      }
  
      // If data is null, the user exists in Auth but not in our Users table
      if (!data) return null;
  
      return toCamelCase(data);
    } catch (err) {
      console.error("Unexpected profile fetch error:", err);
      return null;
    }
  },
  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<User>) {
    try {
      const snakeCaseUpdates = prepareSupabaseData(updates);
      
      const { data, error } = await supabase
        .from('users')
        .update(snakeCaseUpdates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      
      // Also update auth metadata if name changed
      if (updates.name) {
        await supabase.auth.updateUser({
          data: { name: updates.name }
        });
      }

      return toCamelCase(data);
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error('Failed to update profile');
    }
  },

  /**
   * Reset password - send reset email
   */
  async resetPassword(email: string) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Reset password error:', error);
      throw new Error('Failed to send reset email');
    }
  },

  /**
   * Update password (after reset)
   */
  async updatePassword(newPassword: string) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Update password error:', error);
      throw new Error('Failed to update password');
    }
  },

  /**
   * Check if user is admin
   */
  async isAdmin(userId: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      return profile?.role === 'admin';
    } catch (error) {
      console.error('Check admin error:', error);
      return false;
    }
  },

  /**
   * Setup first admin user (for initial setup)
   */
  async setupFirstAdmin(email: string, password: string, name: string) {
    try {
      // Call the signUp method
      const result = await this.signUp(email, password, name, { role: 'admin' });
      
      // If we got here, auth was created. 
      // result.user will exist even if session is null (email confirmation pending)
      if (!result || !result.user) {
        throw new Error('Failed to create admin user account');
      }

      toast.success('Admin created! Please check your email if confirmation is required.');
      return result.user;
    } catch (error: any) {
      console.error('Setup admin error:', error);
      throw new Error(error.message || 'Failed to setup admin');
    }
  },

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },

  /**
   * Check if email exists
   */
  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (error) throw error;
      return !!data;
    } catch (error) {
      console.error('Check email exists error:', error);
      return false;
    }
  },

  /**
   * Verify email
   */
  async verifyEmail(token: string) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        token_hash: token,
        type: 'email',
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Verify email error:', error);
      throw new Error('Email verification failed');
    }
  },

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string) {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Resend verification error:', error);
      throw new Error('Failed to resend verification email');
    }
  },
};

export default authService;
