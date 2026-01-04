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
      // 1. First, try a direct fetch
      let { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
  
      // 2. If no profile found, UPSERT using metadata-aware role
      if (!profile && email) {
        console.log("Syncing or creating profile for:", email);
        
        // RECTIFIED: Check if metadata explicitly says they are an admin
        const metadataRole = metadata?.role === 'admin' ? 'admin' : 'student';

        const { data: upsertedProfile, error: upsertError } = await supabase
          .from('users')
          .upsert(
            {
              id: userId,
              email: email,
              name: metadata?.full_name || metadata?.name || 'User',
              avatar_url: metadata?.avatar_url || '',
              role: metadataRole, // USE THE METADATA ROLE INSTEAD OF HARDCODED 'student'
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'email' }
          )
          .select()
          .single();
  
        if (upsertError) {
          console.error("Upsert failed:", upsertError.message);
          throw upsertError;
        }
        
        profile = upsertedProfile;
      }
  
      if (profile) {
        setUserData(profile);
        setIsAdmin(profile.role === 'admin'); // Ensure this state is synced
        return profile;
      }
    } catch (error) {
      console.error("Critical Profile Error:", error);
    }
    return null;
  }, []);

  useEffect(() => {
    let mounted = true;
  
    const handleUserSession = async (session: any) => {
      // Add this at the very top of the function
      if (mounted) setLoading(true); 
    
      if (!session?.user) {
        if (mounted) {
          setCurrentUser(null);
          setUserData(null);
          setLoading(false);
        }
        return;
      }
  
      const user = session.user;
      if (mounted) setCurrentUser(user);
  
      try {
        // 1. Attempt to get profile (ID or Email sync)
        const profile = await fetchProfile(user.id, user.email, user.user_metadata);
        
        if (mounted && profile) {
          setUserData(profile);
        } else if (mounted) {
          // 2. FALLBACK: If DB is empty/fails, use Google Metadata
          // This stops the "User" name issue and the Dashboard hang
          setUserData({
            id: user.id,
            email: user.email || '',
            name: user.user_metadata?.full_name || user.user_metadata?.name || 'Google User',
            role: 'student',
            avatar_url: user.user_metadata?.avatar_url || '',
            created_at: new Date().toISOString()
          } as User);
        }
      } catch (error) {
        console.error("Session handling error:", error);
      } finally {
        // 3. ALWAYS stop the spinner
        if (mounted) setLoading(false);
      }
    };
  
    // Initial Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      handleUserSession(session);
    });
  
    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      handleUserSession(session);
    });
  
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await authService.signIn(email, password);
      setCurrentUser(result.user);
      setUserData(result.userData);
      setIsAdmin(result.userData?.role === 'admin');
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, data?: Partial<User>) => {
    setLoading(true);
    try {
      const result = await authService.signUp(email, password, name, data);
      setCurrentUser(result.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      setCurrentUser(null);
      setUserData(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await authService.signInWithGoogle();
    } catch (e) {
      setLoading(false);
      throw e;
    }
  };

  const value = {
    currentUser,
    userData,
    loading,
    isAdmin,
    login,
    register,
    logout,
    signInWithGoogle,
    updateProfile: async (u: Partial<User>) => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const res = await authService.updateProfile(currentUser.id, u);
        if (res) setUserData(res);
      } finally {
        setLoading(false);
      }
    },
    resetPassword: async (e: string) => {
      setLoading(true);
      try { await authService.resetPassword(e); } finally { setLoading(false); }
    },
    updatePassword: async (p: string) => {
      setLoading(true);
      try { await authService.updatePassword(p); } finally { setLoading(false); }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
