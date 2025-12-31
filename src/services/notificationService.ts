// src/services/notificationService.ts
import { supabase } from '../lib/supabaseClient';
import { Database } from '../types' // Use the recommended path
import { prepareSupabaseData, toCamelCase } from '../utils/helpers';
import { NOTIFICATION_TYPES } from '../utils/constants';
import { v4 as uuidv4 } from 'uuid';

// Define the notification type from your database
type Notification = Database['public']['Tables']['notifications']['Row'];

// Define the notification type for create/update operations
type NotificationType = Notification['type'];

export const notificationService = {
  /**
   * Create a new notification
   */
  async createNotification(
    userId: string,
    notification: {
      title: string;
      message: string;
      type: NotificationType; // Changed from Notification['type']
      data?: any;
      actionUrl?: string;
    }
  ) {
    try {
      const notificationId = uuidv4();
      
      const notificationRecord = {
        id: notificationId,
        user_id: userId,
        title: notification.title.trim(),
        message: notification.message.trim(),
        type: notification.type,
        is_read: false,
        action_url: notification.actionUrl || null,
        data: notification.data || null,
        created_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert([prepareSupabaseData(notificationRecord)])
        .select()
        .single();

      if (error) throw error;

      // Send real-time notification via Supabase channel
      this.sendRealTimeNotification(userId, toCamelCase(data));

      return toCamelCase(data);
    } catch (error: any) {
      console.error('Create notification error:', error);
      throw new Error('Failed to create notification');
    }
  },

  /**
   * Get notifications for a user
   */
  async getNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      limit?: number;
      offset?: number;
      type?: NotificationType; // Changed from Notification['type']
    }
  ) {
    try {
      const {
        unreadOnly = false,
        limit = 50,
        offset = 0,
        type,
      } = options || {};

      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      if (type) {
        query = query.eq('type', type);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        notifications: data.map(notification => toCamelCase(notification)),
        total: count || 0,
        unreadCount: unreadOnly ? count || 0 : await this.getUnreadCount(userId),
      };
    } catch (error: any) {
      console.error('Get notifications error:', error);
      return {
        notifications: [],
        total: 0,
        unreadCount: 0,
      };
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return toCamelCase(data);
    } catch (error: any) {
      console.error('Mark as read error:', error);
      throw new Error('Failed to mark notification as read');
    }
  },

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Mark all as read error:', error);
      throw new Error('Failed to mark all notifications as read');
    }
  },

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string, userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Delete notification error:', error);
      throw new Error('Failed to delete notification');
    }
  },

  /**
   * Delete all notifications for user
   */
  async deleteAllNotifications(userId: string, options?: { readOnly?: boolean }) {
    try {
      let query = supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (options?.readOnly) {
        query = query.eq('is_read', true);
      }

      const { error } = await query;

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Delete all notifications error:', error);
      throw new Error('Failed to delete notifications');
    }
  },

  /**
   * Send real-time notification via Supabase channel
   */
  sendRealTimeNotification(userId: string, notification: any) { // Changed type from Notification to any
    const channel = supabase.channel(`notifications:${userId}`);
    
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'new_notification',
          payload: notification,
        });
      }
    });

    // Unsubscribe after sending
    setTimeout(() => {
      supabase.removeChannel(channel);
    }, 1000);
  },

  /**
   * Subscribe to real-time notifications
   */
  subscribeToNotifications(userId: string, callback: (notification: any) => void) { // Changed type from Notification to any
    const channel = supabase.channel(`notifications:${userId}`);

    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        callback(toCamelCase(payload.new as any));
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Create match notification
   */
  async createMatchNotification(
    userId: string,
    lostCaseId: string,
    foundCaseId: string,
    matchScore: number
  ) {
    try {
      const caseService = (await import('./caseService')).default;
      const lostCase = await caseService.getCaseById(lostCaseId);
      const foundCase = await caseService.getCaseById(foundCaseId);

      if (!lostCase || !foundCase) {
        throw new Error('Cases not found');
      }

      return this.createNotification(userId, {
        title: 'Potential Match Found!',
        message: `We found a potential match for your lost "${lostCase.title}". A similar "${foundCase.title}" was found. Match score: ${matchScore}%`,
        type: NOTIFICATION_TYPES.MATCH as NotificationType,
        data: {
          lostCaseId,
          foundCaseId,
          matchScore,
          lostCaseTitle: lostCase.title,
          foundCaseTitle: foundCase.title,
        },
        actionUrl: `/matches?lost=${lostCaseId}&found=${foundCaseId}`,
      });
    } catch (error: any) {
      console.error('Create match notification error:', error);
      throw error;
    }
  },

  /**
   * Create message notification
   */
  async createMessageNotification(
    userId: string,
    senderId: string,
    caseId: string,
    messagePreview: string
  ) {
    try {
      const userService = (await import('./userService')).default;
      const caseService = (await import('./caseService')).default;
      
      const [sender, caseItem] = await Promise.all([
        userService.getUserById(senderId),
        caseService.getCaseById(caseId),
      ]);

      if (!sender || !caseItem) {
        throw new Error('Sender or case not found');
      }

      return this.createNotification(userId, {
        title: 'New Message',
        message: `${sender.name || 'Someone'} sent you a message about "${caseItem.title}": ${messagePreview}`,
        type: NOTIFICATION_TYPES.MESSAGE as NotificationType,
        data: {
          senderId,
          senderName: sender.name,
          caseId,
          caseTitle: caseItem.title,
          messagePreview,
        },
        actionUrl: `/chat/${caseId}?userId=${senderId}`,
      });
    } catch (error: any) {
      console.error('Create message notification error:', error);
      throw error;
    }
  },

  /**
   * Create status update notification
   */
  async createStatusUpdateNotification(
    userId: string,
    caseId: string,
    oldStatus: string,
    newStatus: string
  ) {
    try {
      const caseService = (await import('./caseService')).default;
      const caseItem = await caseService.getCaseById(caseId);

      if (!caseItem) {
        throw new Error('Case not found');
      }

      const statusMap: Record<string, string> = {
        'active': 'Active',
        'claimed': 'Claimed',
        'resolved': 'Resolved',
        'closed': 'Closed',
      };

      return this.createNotification(userId, {
        title: 'Case Status Updated',
        message: `Your case "${caseItem.title}" status changed from "${statusMap[oldStatus] || oldStatus}" to "${statusMap[newStatus] || newStatus}"`,
        type: NOTIFICATION_TYPES.STATUS_UPDATE as NotificationType,
        data: {
          caseId,
          caseTitle: caseItem.title,
          oldStatus,
          newStatus,
        },
        actionUrl: `/case/${caseId}`,
      });
    } catch (error: any) {
      console.error('Create status update notification error:', error);
      throw error;
    }
  },

  /**
   * Create system notification
   */
  async createSystemNotification(
    userId: string,
    title: string,
    message: string,
    data?: any,
    actionUrl?: string
  ) {
    return this.createNotification(userId, {
      title,
      message,
      type: NOTIFICATION_TYPES.SYSTEM as NotificationType,
      data,
      actionUrl,
    });
  },

  /**
   * Batch create notifications for multiple users
   */
  async batchCreateNotifications(
    userIds: string[],
    notification: {
      title: string;
      message: string;
      type: NotificationType; // Changed from Notification['type']
      data?: any;
      actionUrl?: string;
    }
  ) {
    try {
      const notifications = userIds.map(userId => ({
        id: uuidv4(),
        user_id: userId,
        title: notification.title.trim(),
        message: notification.message.trim(),
        type: notification.type,
        is_read: false,
        action_url: notification.actionUrl || null,
        data: notification.data || null,
        created_at: new Date().toISOString(),
      }));

      const { data, error } = await supabase
        .from('notifications')
        .insert(prepareSupabaseData(notifications))
        .select();

      if (error) throw error;

      // Send real-time notifications
      data.forEach(notification => {
        this.sendRealTimeNotification(notification.user_id, toCamelCase(notification));
      });

      return data.map(notification => toCamelCase(notification));
    } catch (error: any) {
      console.error('Batch create notifications error:', error);
      throw new Error('Failed to create batch notifications');
    }
  },

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('type, is_read')
        .eq('user_id', userId);

      if (error) throw error;

      const total = data.length;
      const unread = data.filter(n => !n.is_read).length;
      
      const byType = data.reduce((acc, notification) => {
        acc[notification.type] = (acc[notification.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total,
        unread,
        read: total - unread,
        byType,
      };
    } catch (error) {
      console.error('Get notification stats error:', error);
      return {
        total: 0,
        unread: 0,
        read: 0,
        byType: {},
      };
    }
  },

  /**
   * Clear old notifications (older than 30 days)
   */
  async clearOldNotifications(userId: string, daysOld: number = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true)
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error('Clear old notifications error:', error);
      return false;
    }
  },

  /**
   * Get latest notifications (for notification dropdown)
   */
  async getLatestNotifications(userId: string, limit: number = 5) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data.map(notification => toCamelCase(notification));
    } catch (error) {
      console.error('Get latest notifications error:', error);
      return [];
    }
  },

  /**
   * Check if user has permission to access notification
   */
  async checkNotificationPermission(notificationId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('user_id')
        .eq('id', notificationId)
        .single();

      if (error) return false;
      return data.user_id === userId;
    } catch (error) {
      console.error('Check notification permission error:', error);
      return false;
    }
  },
};

export default notificationService;
