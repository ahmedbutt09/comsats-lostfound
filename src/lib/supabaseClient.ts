// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from '../types'

// Get environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env file.\n' +
    'Required: REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY'
  )
}

// Create Supabase client with the REAL Database type
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
    storageKey: 'supabase.auth.token',
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'comsats-lost-found-app',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

// Helper function to check if Supabase is initialized
export const isSupabaseInitialized = () => {
  return !!supabaseUrl && !!supabaseAnonKey
}

// Helper function to get current session
export const getCurrentSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  return session
}

// Helper function to get current user
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  return user
}

// Helper function to sign out
export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) {
    console.error('Error signing out:', error)
    throw error
  }
}

// Health check function
export const checkSupabaseHealth = async () => {
  try {
    const { data, error } = await supabase.from('cases').select('id').limit(1)
    
    if (error) {
      console.error('Supabase health check failed:', error)
      return { healthy: false, error: error.message }
    }
    
    return { healthy: true, data }
  } catch (error: any) {
    console.error('Supabase connection error:', error)
    return { healthy: false, error: error.message }
  }
}

// Storage helper functions
export const storage = {
  // Upload file to Supabase Storage
  uploadFile: async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })
    
    if (error) throw error
    return data
  },
  
  // Get public URL for a file
  getPublicUrl: (bucket: string, path: string) => {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    return data.publicUrl
  },
  
  // Delete a file
  deleteFile: async (bucket: string, path: string) => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .remove([path])
    
    if (error) throw error
    return data
  },
}

// Real-time subscription helper
export const subscribeToTable = (
  table: string,
  filter: string = '',
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel(`table-db-changes:${table}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table,
        filter,
      },
      callback
    )
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}

