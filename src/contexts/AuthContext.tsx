// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types';
import authService from '../services/supabaseAuthService';
import { supabase } from '../lib/supabaseClient';
import { toCamelCase } from '../utils/helpers';

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

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Initialize auth state
  useEffect(() => {
    let mounted = true;
  
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
  
        if (session && mounted) {
          setCurrentUser(session.user);
          // Fetch your profile data here
          // const { data } = await supabase.from('profiles')...
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (mounted) setLoading(false); // <--- This MUST run no matter what
      }
    };
  
    initializeAuth();
  
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setCurrentUser(session?.user ?? null);
        setLoading(false); // <--- Ensures UI updates when auth state changes
      }
    });
  
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const result = await authService.signIn(email, password);
      
      setCurrentUser(result.user);
      if (result.userData) {
        setUserData(result.userData);
        setIsAdmin(result.userData.role === 'admin');
      }
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, additionalData?: Partial<User>) => {
    try {
      setLoading(true);
      const result = await authService.signUp(email, password, name, additionalData);
      
      setCurrentUser(result.user);
      if (result.userData) {
        setUserData(result.userData);
        setIsAdmin(result.userData.role === 'admin');
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      
      setCurrentUser(null);
      setUserData(null);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      await authService.signInWithGoogle();
      // Note: The redirect will be handled by Supabase OAuth
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!currentUser) {
      throw new Error('No user logged in');
    }

    try {
      setLoading(true);
      const updatedProfile = await authService.updateProfile(currentUser.id, updates);
      
      if (updatedProfile) {
        setUserData(updatedProfile);
        setIsAdmin(updatedProfile.role === 'admin');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      await authService.resetPassword(email);
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      setLoading(true);
      await authService.updatePassword(newPassword);
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    isAdmin,
    login,
    register,
    logout,
    signInWithGoogle,
    updateProfile,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Optional: Higher Order Component for protected routes
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  const WithAuth: React.FC<P> = (props) => {
    const { currentUser, loading } = useAuth();

    if (loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}>
          <div>Loading...</div>
        </div>
      );
    }

    if (!currentUser) {
      // Redirect to login or show access denied
      window.location.href = '/login';
      return null;
    }

    return <Component {...props} />;
  };

  return WithAuth;
};

// Optional: Higher Order Component for admin routes
export const withAdmin = <P extends object>(
  Component: React.ComponentType<P>
): React.FC<P> => {
  const WithAdmin: React.FC<P> = (props) => {
    const { currentUser, loading, isAdmin } = useAuth();

    if (loading) {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh'
        }}>
          <div>Loading...</div>
        </div>
      );
    }

    if (!currentUser) {
      window.location.href = '/admin-login';
      return null;
    }

    if (!isAdmin) {
      // Show access denied for non-admins
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '80vh',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#dc3545', marginBottom: '20px' }}>
            Access Denied
          </h1>
          <p style={{ marginBottom: '20px' }}>
            You do not have administrator privileges to access this page.
          </p>
          <button
            onClick={() => window.location.href = '/dashboard'}
            style={{
              backgroundColor: '#003366',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Go to Dashboard
          </button>
        </div>
      );
    }

    return <Component {...props} />;
  };

  return WithAdmin;
};

export default AuthContext;
