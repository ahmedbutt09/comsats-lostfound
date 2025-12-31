// src/services/caseService.ts
import { supabase } from '../lib/supabaseClient';
import { Case, CaseFormData } from '../types';
import { prepareSupabaseData, toCamelCase } from '../utils/helpers';
import { CASE_STATUS, CATEGORIES, LOCATIONS, PAGINATION } from '../utils/constants';
import { v4 as uuidv4 } from 'uuid';

export const caseService = {
  /**
   * Create a new case
   */
  async createCase(
    caseData: any, // Use any or your CaseFormData type
    userId: string,
    userName: string,
    userEmail: string,
    imageFile?: File
  ) {
    try {
      const caseId = caseData.id || uuidv4();
      let imageUrl = caseData.image_url || null;

      // Only upload here if an imageFile was actually passed to the service
      if (imageFile) {
        const storageService = (await import('./supabaseStorageService')).default;
        const uploadResult = await storageService.uploadCaseImage(imageFile, userId, caseId);
        imageUrl = uploadResult.url;
      }

      // Prepare the final record for Supabase
      const caseRecord = {
        id: caseId,
        type: caseData.type,
        title: caseData.title?.trim(),
        description: caseData.description?.trim(),
        category: caseData.category,
        location: caseData.location,
        image_url: imageUrl, // Uses the URL from the frontend or the upload above
        status: CASE_STATUS.ACTIVE,
        user_id: userId,
        user_name: userName,
        user_email: userEmail,
        contact_info: caseData.contact_info,
        reward: caseData.reward || null,
        created_at: caseData.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      };

      // Clean the data for Supabase (removes undefined fields)
      const sanitizedData = prepareSupabaseData(caseRecord);

      const { data, error } = await supabase
        .from('cases')
        .insert([sanitizedData])
        .select()
        .single();

      if (error) {
        console.error("Supabase Insert Error:", error);
        throw error;
      }

      return toCamelCase(data);
    } catch (error: any) {
      console.error('Create case error:', error);
      throw new Error(error.message || 'Failed to create case');
    }
  },

  /**
   * Get case by ID
   */
  async getCaseById(caseId: string) {
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('id', caseId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Case not found');
        }
        throw error;
      }

      return toCamelCase(data);
    } catch (error: any) {
      console.error('Get case by ID error:', error);
      throw new Error(error.message || 'Failed to fetch case');
    }
  },

  /**
   * Update case
   */
  async updateCase(caseId: string, updates: Partial<Case>, userId: string, imageFile?: File) {
    try {
      let imageUrl = updates.image_url;

      // Upload new image if provided
      if (imageFile) {
        const storageService = (await import('./supabaseStorageService')).default;
        const uploadResult = await storageService.uploadCaseImage(imageFile, userId, caseId);
        imageUrl = uploadResult.url;
        
        // Delete old image if exists
        if (updates.image_url && updates.image_url !== imageUrl) {
          await storageService.deleteCaseImage(updates.image_url);
        }
      }

      // Prepare updates
      const updateData = {
        ...updates,
        image_url: imageUrl,
        updated_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('cases')
        .update(prepareSupabaseData(updateData))
        .eq('id', caseId)
        .select()
        .single();

      if (error) throw error;

      return toCamelCase(data);
    } catch (error: any) {
      console.error('Update case error:', error);
      throw new Error('Failed to update case');
    }
  },

  /**
   * Delete case
   */
  async deleteCase(caseId: string, userId: string, isAdmin: boolean = false) {
    try {
      // First get the case to check ownership and get image URL
      const { data: caseData, error: fetchError } = await supabase
        .from('cases')
        .select('user_id, image_url')
        .eq('id', caseId)
        .single();

      if (fetchError) throw fetchError;

      // Check permission (owner or admin)
      if (caseData.user_id !== userId && !isAdmin) {
        throw new Error('You do not have permission to delete this case');
      }

      // Delete image if exists
      if (caseData.image_url) {
        const storageService = (await import('./supabaseStorageService')).default;
        await storageService.deleteCaseImage(caseData.image_url);
      }

      // Delete case from database
      const { error } = await supabase
        .from('cases')
        .delete()
        .eq('id', caseId);

      if (error) throw error;

      return true;
    } catch (error: any) {
      console.error('Delete case error:', error);
      throw new Error(error.message || 'Failed to delete case');
    }
  },

  /**
   * Get cases with filtering and pagination
   */
  async getCases(filters: {
    type?: 'lost' | 'found';
    status?: string;
    category?: string;
    location?: string;
    userId?: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: 'created_at' | 'updated_at' | 'last_activity_at';
    sortOrder?: 'asc' | 'desc';
  }) {
    try {
      const {
        type,
        status,
        category,
        location,
        userId,
        search,
        page = 1,
        limit = PAGINATION.DEFAULT_LIMIT,
        sortBy = 'created_at',
        sortOrder = 'desc',
      } = filters;

      // Build query
      let query = supabase.from('cases').select('*', { count: 'exact' });

      // Apply filters
      if (type) query = query.eq('type', type);
      if (status) query = query.eq('status', status);
      if (category) query = query.eq('category', category);
      if (location) query = query.eq('location', location);
      if (userId) query = query.eq('user_id', userId);
      
      // Search by title or description
      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Apply sorting
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        cases: data.map(caseItem => toCamelCase(caseItem)),
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error: any) {
      console.error('Get cases error:', error);
      return {
        cases: [],
        total: 0,
        page: 1,
        limit: PAGINATION.DEFAULT_LIMIT,
        totalPages: 0,
      };
    }
  },

  /**
   * Get user's cases
   */
  async getUserCases(userId: string, page: number = 1, limit: number = PAGINATION.DEFAULT_LIMIT) {
    return this.getCases({
      userId,
      page,
      limit,
      sortBy: 'updated_at',
      sortOrder: 'desc',
    });
  },

  /**
   * Get active cases (for homepage)
   */
  async getActiveCases(limit: number = 12) {
    return this.getCases({
      status: CASE_STATUS.ACTIVE,
      limit,
      sortBy: 'last_activity_at',
      sortOrder: 'desc',
    });
  },

  /**
   * Get lost items
   */
  async getLostItems(filters?: {
    category?: string;
    location?: string;
    page?: number;
    limit?: number;
  }) {
    return this.getCases({
      type: 'lost',
      status: CASE_STATUS.ACTIVE,
      ...filters,
    });
  },

  /**
   * Get found items
   */
  async getFoundItems(filters?: {
    category?: string;
    location?: string;
    page?: number;
    limit?: number;
  }) {
    return this.getCases({
      type: 'found',
      status: CASE_STATUS.ACTIVE,
      ...filters,
    });
  },

  /**
   * Update case status
   */
  async updateCaseStatus(caseId: string, status: string, userId: string, isAdmin: boolean = false) {
    try {
      // Get current case to check ownership
      const { data: caseData, error: fetchError } = await supabase
        .from('cases')
        .select('user_id, status')
        .eq('id', caseId)
        .single();

      if (fetchError) throw fetchError;

      // Check permission (owner or admin can update status)
      if (caseData.user_id !== userId && !isAdmin) {
        throw new Error('You do not have permission to update this case');
      }

      const { data, error } = await supabase
        .from('cases')
        .update({
          status,
          updated_at: new Date().toISOString(),
          last_activity_at: new Date().toISOString(),
        })
        .eq('id', caseId)
        .select()
        .single();

      if (error) throw error;

      return toCamelCase(data);
    } catch (error: any) {
      console.error('Update case status error:', error);
      throw new Error(error.message || 'Failed to update case status');
    }
  },

  /**
   * Mark case as resolved
   */
  async markAsResolved(caseId: string, userId: string, isAdmin: boolean = false) {
    return this.updateCaseStatus(caseId, CASE_STATUS.RESOLVED, userId, isAdmin);
  },

  /**
   * Mark case as claimed
   */
  async markAsClaimed(caseId: string, userId: string, isAdmin: boolean = false) {
    return this.updateCaseStatus(caseId, CASE_STATUS.CLAIMED, userId, isAdmin);
  },

  /**
   * Get case statistics
   */
  async getStatistics() {
    try {
      // Get counts for different statuses
      const { data: statusCounts, error: statusError } = await supabase
        .from('cases')
        .select('status', { count: 'exact', head: false });

      if (statusError) throw statusError;

      // Get type counts
      const { data: typeCounts, error: typeError } = await supabase
        .from('cases')
        .select('type', { count: 'exact', head: false });

      if (typeError) throw typeError;

      // Calculate statistics
      const total = statusCounts?.length || 0;
      const active = statusCounts?.filter(c => c.status === CASE_STATUS.ACTIVE).length || 0;
      const resolved = statusCounts?.filter(c => c.status === CASE_STATUS.RESOLVED).length || 0;
      const claimed = statusCounts?.filter(c => c.status === CASE_STATUS.CLAIMED).length || 0;
      const lost = typeCounts?.filter(c => c.type === 'lost').length || 0;
      const found = typeCounts?.filter(c => c.type === 'found').length || 0;

      return {
        total,
        active,
        resolved,
        claimed,
        lost,
        found,
        closed: statusCounts?.filter(c => c.status === CASE_STATUS.CLOSED).length || 0,
      };
    } catch (error) {
      console.error('Get statistics error:', error);
      return {
        total: 0,
        active: 0,
        resolved: 0,
        claimed: 0,
        lost: 0,
        found: 0,
        closed: 0,
      };
    }
  },

  /**
   * Search cases
   */
  async searchCases(query: string, filters?: {
    type?: 'lost' | 'found';
    category?: string;
    location?: string;
  }) {
    try {
      let searchQuery = supabase
        .from('cases')
        .select('*')
        .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%,location.ilike.%${query}%`)
        .eq('status', CASE_STATUS.ACTIVE)
        .order('last_activity_at', { ascending: false })
        .limit(50);

      // Apply additional filters
      if (filters?.type) searchQuery = searchQuery.eq('type', filters.type);
      if (filters?.category) searchQuery = searchQuery.eq('category', filters.category);
      if (filters?.location) searchQuery = searchQuery.eq('location', filters.location);

      const { data, error } = await searchQuery;

      if (error) throw error;

      return data.map(caseItem => toCamelCase(caseItem));
    } catch (error) {
      console.error('Search cases error:', error);
      return [];
    }
  },

  /**
   * Get similar cases (for matching)
   */
  async getSimilarCases(caseId: string, limit: number = 5) {
    try {
      // Get the current case
      const currentCase = await this.getCaseById(caseId);
      if (!currentCase) return [];

      // Find cases with same category but opposite type
      const oppositeType = currentCase.type === 'lost' ? 'found' : 'lost';
      
      const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('type', oppositeType)
        .eq('category', currentCase.category)
        .eq('status', CASE_STATUS.ACTIVE)
        .neq('id', caseId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(caseItem => toCamelCase(caseItem));
    } catch (error) {
      console.error('Get similar cases error:', error);
      return [];
    }
  },

  /**
   * Subscribe to case updates (real-time)
   */
  subscribeToCase(caseId: string, callback: (caseData: Case) => void) {
    return supabase
      .channel(`case:${caseId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cases',
          filter: `id=eq.${caseId}`,
        },
        (payload) => {
          callback(toCamelCase(payload.new as any));
        }
      )
      .subscribe();
  },

  /**
   * Subscribe to user's cases (real-time)
   */
  subscribeToUserCases(userId: string, callback: (caseData: Case) => void) {
    return supabase
      .channel(`user-cases:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cases',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(toCamelCase(payload.new as any));
        }
      )
      .subscribe();
  },
};

export default caseService;
