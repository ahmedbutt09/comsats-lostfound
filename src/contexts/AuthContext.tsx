import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User } from '../types';
import authService from '../services/supabaseAuthService';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  currentUser: any | null;
  userData: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, additionalData?: Partial<User>) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refreshSession: () => Promise<void>; // Added to interface
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // FETCH PROFILE LOGIC
  const fetchProfile = useCallback(async (userId: string, email?: string, metadata?: any) => {
    try {
      let { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (!profile && email) {
        const metadataRole = metadata?.role === 'admin' ? 'admin' : 'student';
        const { data: upsertedProfile, error: upsertError } = await supabase
          .from('users')
          .upsert(
            {
              id: userId,
              email: email,
              name: metadata?.full_name || metadata?.name || 'User',
              avatar_url: metadata?.avatar_url || '',
              role: metadataRole,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'email' }
          )
          .select()
          .single();

        if (upsertError) throw upsertError;
        profile = upsertedProfile;
      }

      return profile;
    } catch (error) {
      console.error("Critical Profile Error:", error);
      return null;
    }
  }, []);

  // HANDLE SESSION (Moved to top level to avoid Scope/Hoisting errors)
  const handleUserSession = useCallback(async (session: any) => {
    setLoading(true);
    if (!session?.user) {
      setCurrentUser(null);
      setUserData(null);
      setIsAdmin(false);
      setLoading(false);
      return;
    }

    const user = session.user;
    setCurrentUser(user);

    const profile = await fetchProfile(user.id, user.email, user.user_metadata);
    if (profile) {
      setUserData(profile);
      setIsAdmin(profile.role === 'admin');
    } else {
      setUserData({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.full_name || user.user_metadata?.name || 'Google User',
        role: 'student',
        avatar_url: user.user_metadata?.avatar_url || '',
        created_at: new Date().toISOString()
      } as User);
      setIsAdmin(false);
    }
    setLoading(false);
  }, [fetchProfile]);

  // REFRESH SESSION (The fix for the APK hang)
  const refreshSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    await handleUserSession(session);
  }, [handleUserSession]);

  useEffect(() => {
    // Initial Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserSession(session);
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUserSession(session);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [handleUserSession]);

  // ... (keep login, register, logout, etc. from your previous version)
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await authService.signIn(email, password);
      setCurrentUser(result.user);
      setUserData(result.userData);
      setIsAdmin(result.userData?.role === 'admin');
    } finally { setLoading(false); }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setCurrentUser(null);
      setUserData(null);
      setIsAdmin(false);
    } finally { setLoading(false); }
  };

  const signInWithGoogle = async () => {
    try {
      await authService.signInWithGoogle();
    } catch (e) {
      throw e;
    }
  };

  const value = {
    currentUser, userData, loading, isAdmin,
    login, logout, signInWithGoogle, refreshSession,
    register: async (e: string, p: string, n: string, d?: any) => {
        setLoading(true);
        try { const res = await authService.signUp(e,p,n,d); setCurrentUser(res.user); }
        finally { setLoading(false); }
    },
    updateProfile: async (u: any) => {
        if (!currentUser) return;
        setLoading(true);
        try { const res = await authService.updateProfile(currentUser.id, u); if (res) setUserData(res); }
        finally { setLoading(false); }
    },
    resetPassword: async (e: string) => { await authService.resetPassword(e); },
    updatePassword: async (p: string) => { await authService.updatePassword(p); }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
