// src/services/userService.ts
import { supabase } from '../lib/supabaseClient';
import { User } from '../types';
import { prepareSupabaseData, toCamelCase } from '../utils/helpers';
import { USER_ROLES } from '../utils/constants';
import authService from './supabaseAuthService';

export const userService = {
  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return toCamelCase(data);
    } catch (error: any) {
      console.error('Get user by ID error:', error);
      return null;
    }
  },

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return toCamelCase(data);
    } catch (error: any) {
      console.error('Get user by email error:', error);
      return null;
    }
  },

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: Partial<User>) {
    try {
      // Prepare updates for Supabase
      const supabaseUpdates: any = {
        updated_at: new Date().toISOString(),
      };
  
      // Map camelCase to snake_case - Use only fields that exist in your schema
      if (updates.name !== undefined) supabaseUpdates.name = updates.name;
      if (updates.phone !== undefined) supabaseUpdates.phone = updates.phone;
      if (updates.student_id !== undefined) supabaseUpdates.student_id = updates.student_id;
      if (updates.department !== undefined) supabaseUpdates.department = updates.department;
      if (updates.role !== undefined) supabaseUpdates.role = updates.role;
      if (updates.avatar_url !== undefined) supabaseUpdates.avatar_url = updates.avatar_url;
      if (updates.is_deleted !== undefined) supabaseUpdates.is_deleted = updates.is_deleted;
  
      const { data, error } = await supabase
        .from('users')
        .update(supabaseUpdates)
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
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, role: User['role'], adminId: string) {
    try {
      // Verify admin permission
      const isAdmin = await authService.isAdmin(adminId);
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;

      return toCamelCase(data);
    } catch (error: any) {
      console.error('Update user role error:', error);
      throw new Error('Failed to update user role');
    }
  },

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string, deactivatedById: string, reason?: string) {
    try {
      // Verify permission (user can deactivate self, admin can deactivate anyone)
      const isSelf = userId === deactivatedById;
      const isAdmin = await authService.isAdmin(deactivatedById);
      
      if (!isSelf && !isAdmin) {
        throw new Error('Unauthorized');
      }
  
      const { data, error } = await supabase
        .from('users')
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
          deleted_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();
  
      if (error) throw error;
  
      // Sign out the user if they deactivated themselves
      if (isSelf) {
        await authService.signOut();
      }
  
      return toCamelCase(data);
    } catch (error: any) {
      console.error('Deactivate user error:', error);
      throw new Error('Failed to deactivate user');
    }
  },

  /**
   * Reactivate user account (admin only)
   */
  async reactivateUser(userId: string, adminId: string) {
    try {
      // Verify admin permission
      const isAdmin = await authService.isAdmin(adminId);
      if (!isAdmin) {
        throw new Error('Unauthorized: Admin access required');
      }
  
      const { data, error } = await supabase
        .from('users')
        .update({
          is_deleted: false,
          updated_at: new Date().toISOString(),
          deleted_at: null,
        })
        .eq('id', userId)
        .select()
        .single();
  
      if (error) throw error;
  
      return toCamelCase(data);
    } catch (error: any) {
      console.error('Reactivate user error:', error);
      throw new Error('Failed to reactivate user');
    }
  },
  /**
   * Get all users (admin only)
   */
  async getAllUsers(filters?: {
    role?: User['role'];
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }, adminId?: string) {
    try {
      // Verify admin permission if adminId provided
      if (adminId) {
        const isAdmin = await authService.isAdmin(adminId);
        if (!isAdmin) {
          throw new Error('Unauthorized: Admin access required');
        }
      }

      const {
        role,
        isActive,
        search,
        page = 1,
        limit = 50,
      } = filters || {};

      // Build query
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (role) query = query.eq('role', role);
      if (isActive !== undefined) query = query.eq('is_deleted', !isActive);
      
      // Search by name, email, or student ID
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,student_id.ilike.%${search}%`);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        users: data.map(user => toCamelCase(user)),
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error: any) {
      console.error('Get all users error:', error);
      throw new Error('Failed to fetch users');
    }
  },

  /**
   * Get user statistics
   */
  async getUserStatistics(adminId?: string) {
    try {
      // Verify admin permission if adminId provided
      if (adminId) {
        const isAdmin = await authService.isAdmin(adminId);
        if (!isAdmin) {
          throw new Error('Unauthorized: Admin access required');
        }
      }

      // Get total user count
      const { count: total, error: totalError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      if (totalError) throw totalError;

      // Get counts by role
      const { data: roleCounts, error: roleError } = await supabase
        .from('users')
        .select('role', { count: 'exact', head: false });

      if (roleError) throw roleError;

      // Get active/inactive counts
      const { data: activeCounts, error: activeError } = await supabase
  .from('users')
  .select('is_deleted', { count: 'exact', head: false });;

      if (activeError) throw activeError;

      // Calculate statistics
      const students = roleCounts?.filter(u => u.role === USER_ROLES.STUDENT).length || 0;
      const faculty = roleCounts?.filter(u => u.role === USER_ROLES.FACULTY).length || 0;
      const staff = roleCounts?.filter(u => u.role === USER_ROLES.STAFF).length || 0;
      const admins = roleCounts?.filter(u => u.role === USER_ROLES.ADMIN).length || 0;
      const active = activeCounts?.filter(u => !u.is_deleted).length || 0; // Changed u.is_active to !u.is_deleted
const inactive = activeCounts?.filter(u => u.is_deleted).length || 0; // Changed !u.is_active to u.is_deleted
      return {
        total: total || 0,
        byRole: {
          students,
          faculty,
          staff,
          admins,
        },
        byStatus: {
          active,
          inactive,
        },
      };
    } catch (error: any) {
      console.error('Get user statistics error:', error);
      throw new Error('Failed to fetch user statistics');
    }
  },

  /**
   * Get users by role
   */
  async getUsersByRole(role: User['role'], adminId?: string) {
    try {
      if (adminId) {
        const isAdmin = await authService.isAdmin(adminId);
        if (!isAdmin) {
          throw new Error('Unauthorized: Admin access required');
        }
      }
  
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('role', role)
        .eq('is_deleted', false) // Corrected line
        .order('name');
  
      if (error) throw error;
  
      return data.map(user => toCamelCase(user));
    } catch (error: any) {
      console.error('Get users by role error:', error);
      throw new Error('Failed to fetch users by role');
    }
  },

  /**
   * Search users
   */
  async searchUsers(query: string, adminId?: string) {
    try {
      if (adminId) {
        const isAdmin = await authService.isAdmin(adminId);
        if (!isAdmin) {
          throw new Error('Unauthorized: Admin access required');
        }
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%,student_id.ilike.%${query}%`)
        .limit(20);

      if (error) throw error;

      return data.map(user => toCamelCase(user));
    } catch (error: any) {
      console.error('Search users error:', error);
      throw new Error('Failed to search users');
    }
  },

  /**
   * Check if user exists by email
   */
  async userExists(email: string) {
    try {
      const user = await this.getUserByEmail(email);
      return !!user;
    } catch (error) {
      console.error('Check user exists error:', error);
      return false;
    }
  },

  /**
   * Get user's activity (recent cases, messages, etc.)
   */
  async getUserActivity(userId: string, limit: number = 10) {
    try {
      // Get user's recent cases
      const caseService = (await import('./caseService')).default;
      const { cases } = await caseService.getUserCases(userId, 1, limit);

      // Get user's recent messages (you'll need to implement this in chat service)
      // const chatService = (await import('./chatService')).default;
      // const messages = await chatService.getUserMessages(userId, limit);

      return {
        recentCases: cases,
        // recentMessages: messages,
        lastActive: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Get user activity error:', error);
      return {
        recentCases: [],
        recentMessages: [],
        lastActive: null,
      };
    }
  },

  /**
   * Update user's last active timestamp
   */
  async updateLastActive(userId: string) {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
  
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Update last active error:', error);
      return false;
    }
  },

  /**
   * Get user's profile completeness
   */
  async getProfileCompleteness(userId: string) {
    try {
      const user = await this.getUserById(userId);
      if (!user) return 0;

      let score = 0;
      const totalFields = 6; // Adjust based on what you consider important

      if (user.name) score++;
      if (user.phone) score++;
      if (user.studentId) score++;
      if (user.department) score++;
      if (user.photoUrl) score++;
      if (user.role) score++;

      return Math.round((score / totalFields) * 100);
    } catch (error) {
      console.error('Get profile completeness error:', error);
      return 0;
    }
  },

  /**
   * Subscribe to user updates (real-time)
   */
  subscribeToUser(userId: string, callback: (userData: User) => void) {
    return supabase
      .channel(`user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          callback(toCamelCase(payload.new as any));
        }
      )
      .subscribe();
  },

  /**
   * Validate student ID format
   */
  validateStudentId(studentId: string): boolean {
    // COMSATS student ID pattern: CIIT followed by numbers
    const pattern = /^(CIIT|FA|SE|EE|CE|BA|MA|PH)\d{6,10}$/i;
    return pattern.test(studentId.trim());
  },

  /**
   * Get user suggestions for autocomplete
   */
  async getUserSuggestions(query: string, excludeIds: string[] = []) {
    try {
      let searchQuery = supabase
  .from('users')
  .select('id, name, email, role, avatar_url')
  .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
  .eq('is_deleted', false) // Changed from .eq('is_active', true)
  .limit(10);

      // Exclude specific users if needed
      if (excludeIds.length > 0) {
        searchQuery = searchQuery.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data, error } = await searchQuery;

      if (error) throw error;

      return data.map(user => ({
        id: user.id,
        name: user.name || user.email?.split('@')[0] || 'Unknown',
        email: user.email,
        role: user.role,
        photoUrl: user.avatar_url, // Changed from photo_url to avatar_url
      }));
    } catch (error) {
      console.error('Get user suggestions error:', error);
      return [];
    }
  },
};

export default userService;
