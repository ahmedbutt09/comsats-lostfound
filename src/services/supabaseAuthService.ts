import { supabase } from '../lib/supabaseClient';
import { User } from '../types';
import { prepareSupabaseData, toCamelCase } from '../utils/helpers';
import toast from 'react-hot-toast';
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';

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
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            name: name,
            role: additionalData?.role || 'student',
            department: additionalData?.department || null,
            student_id: (additionalData as any)?.studentId || (additionalData as any)?.student_id || null,
            phone: additionalData?.phone || null,
          },
        },
      });

      if (authError) throw authError;

      return {
        user: authData.user,
        session: authData.session,
        userData: authData.user ? toCamelCase(authData.user.user_metadata) : null,
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      throw new Error(error.message || 'Registration failed');
    }
  },

  /**
   * Verify Sign Up OTP (8-digit code)
   */
  async verifySignUpOTP(email: string, token: string) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: token,
        type: 'signup',
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Email verification error:', error);
      throw new Error(error.message || 'Invalid or expired verification code');
    }
  },

  /**
   * Sign in with Google OAuth (Fixed for Web & APK)
   */
  async signInWithGoogle() {
    const isNative = Capacitor.isNativePlatform();
    
    // APK uses custom scheme, Web uses the production Vercel URL
    const redirectTo = isNative 
      ? 'comsatsapp://login' 
      : 'https://comsats-lostfound.vercel.app/';
  
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
        skipBrowserRedirect: isNative, // true for APK prevents 403 error
      },
    });
  
    if (error) throw error;
  
    // For APK: Manually open the secure System Browser
    if (isNative && data?.url) {
      await Browser.open({ url: data.url });
    }
  },

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

  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      return data ? toCamelCase(data) : null;
    } catch (err) {
      console.warn("Profile not found in database for user:", userId);
      return null;
    }
  },

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

  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
    return true;
  },

  async verifyResetOTP(email: string, token: string) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.trim().toLowerCase(),
        token: token,
        type: 'recovery',
      });

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('OTP Verification error:', error);
      throw new Error(error.message || 'Invalid or expired code');
    }
  },

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

  async isAdmin(userId: string): Promise<boolean> {
    try {
      const profile = await this.getUserProfile(userId);
      return profile?.role === 'admin';
    } catch (error) {
      console.error('Check admin error:', error);
      return false;
    }
  },

  async setupFirstAdmin(email: string, password: string, name: string) {
    try {
      const result = await this.signUp(email, password, name, { role: 'admin' });
      if (!result || !result.user) {
        throw new Error('Failed to create admin user account');
      }
      toast.success('Admin created! Please check your email.');
      return result.user;
    } catch (error: any) {
      console.error('Setup admin error:', error);
      throw new Error(error.message || 'Failed to setup admin');
    }
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
  },

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

  async resendVerificationEmail(email: string) {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim().toLowerCase(),
      });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Resend verification error:', error);
      throw new Error(error.message || 'Failed to resend verification code');
    }
  },
};

export default authService;
