// src/services/chatService.ts
import { supabase } from '../lib/supabaseClient';
import { Message, Chat } from '../types';
import { prepareSupabaseData, toCamelCase } from '../utils/helpers';
import { v4 as uuidv4 } from 'uuid';

export const chatService = {
  /**
   * Get or create chat room between users for a specific case
   */
  async getOrCreateChat(caseId: string, userId: string, otherUserId: string, userNames: Record<string, string>) {
    try {
      // Check if chat already exists
      const { data: existingChats, error: findError } = await supabase
        .from('chats')
        .select('*')
        .eq('case_id', caseId)
        .contains('participants', [userId, otherUserId]);

      if (findError) throw findError;

      if (existingChats && existingChats.length > 0) {
        return toCamelCase(existingChats[0]);
      }

      // Get case title for chat
      const { data: caseData } = await supabase
        .from('cases')
        .select('title')
        .eq('id', caseId)
        .single();

      // Create new chat
      const chatId = uuidv4();
      const chatRecord = {
        id: chatId,
        case_id: caseId,
        case_title: caseData?.title || 'Case Chat',
        participants: [userId, otherUserId],
        participant_names: userNames,
        last_message: null,
        last_message_time: null,
        unread_count: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .insert([prepareSupabaseData(chatRecord)])
        .select()
        .single();

      if (createError) throw createError;

      return toCamelCase(newChat);
    } catch (error: any) {
      console.error('Get or create chat error:', error);
      throw new Error('Failed to create chat room');
    }
  },

  /**
   * Get chat by ID
   */
  async getChatById(chatId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('id', chatId)
        .contains('participants', [userId])
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('Chat not found or access denied');
        }
        throw error;
      }

      return toCamelCase(data);
    } catch (error: any) {
      console.error('Get chat by ID error:', error);
      throw new Error(error.message || 'Failed to fetch chat');
    }
  },

  /**
   * Get user's chats
   */
  async getUserChats(userId: string, options?: {
    unreadOnly?: boolean;
    limit?: number;
    offset?: number;
  }) {
    try {
      const { unreadOnly = false, limit = 50, offset = 0 } = options || {};

      let query = supabase
        .from('chats')
        .select('*')
        .contains('participants', [userId])
        .order('last_message_time', { ascending: false });

      if (unreadOnly) {
        query = query.not('unread_count', 'is', null);
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;

      return data.map(chat => toCamelCase(chat));
    } catch (error: any) {
      console.error('Get user chats error:', error);
      return [];
    }
  },

  /**
   * Send message
   */
  async sendMessage(chatId: string, senderId: string, receiverId: string, content: string) {
    try {
      // Prepare record WITHOUT manually generating an 'id'
      const messageRecord = {
        chat_id: chatId,
        sender_id: senderId,
        receiver_id: receiverId,
        content: content.trim(),
        is_read: false,
        // No 'id' here
        // No 'created_at' here
      };

      // We use prepareSupabaseData to handle camelCase to snake_case mapping
      const { data: message, error: messageError } = await supabase
        .from('messages')
        .insert([prepareSupabaseData(messageRecord)]) 
        .select()
        .single();

      if (messageError) throw messageError;

      // Update the parent chat record
      await supabase
        .from('chats')
        .update({
          last_message: content.trim(),
          last_message_time: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', chatId);

      return toCamelCase(message);
    } catch (error: any) {
      console.error('Send message error details:', error);
      throw error;
    }
  },

  /**
   * Get messages for a chat
   */
  async getMessages(chatId: string, options?: {
    limit?: number;
    offset?: number;
    before?: string; // Message ID to get messages before this
  }) {
    try {
      const { limit = 50, offset = 0, before } = options || {};

      let query = supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: false });

      if (before) {
        // Get messages before a specific message
        const { data: beforeMessage } = await supabase
          .from('messages')
          .select('created_at')
          .eq('id', before)
          .single();

        if (beforeMessage) {
          query = query.lt('created_at', beforeMessage.created_at);
        }
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) throw error;

      // Return in chronological order
      return data.reverse().map(message => toCamelCase(message));
    } catch (error: any) {
      console.error('Get messages error:', error);
      return [];
    }
  },

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(chatId: string, userId: string) {
    try {
      // Mark messages as read
      const { error: messageError } = await supabase
        .from('messages')
        .update({
          is_read: true,
        })
        .eq('chat_id', chatId)
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (messageError) throw messageError;

      // Reset unread count for this user in chat
      const { data: chat } = await supabase
        .from('chats')
        .select('unread_count')
        .eq('id', chatId)
        .single();

      if (chat && chat.unread_count) {
        const unreadCount = chat.unread_count as Record<string, number>;
        const updatedCount = {
          ...unreadCount,
          [userId]: 0
        };

        const { error: chatError } = await supabase
          .from('chats')
          .update({
            unread_count: updatedCount,
            updated_at: new Date().toISOString(),
          })
          .eq('id', chatId);

        if (chatError) throw chatError;
      }

      return true;
    } catch (error: any) {
      console.error('Mark messages as read error:', error);
      throw new Error('Failed to mark messages as read');
    }
  },

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: string) {
    try {
      // Get total unread messages across all chats
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Get unread count error:', error);
      return 0;
    }
  },

  /**
   * Get unread count for a specific chat
   */
  async getChatUnreadCount(chatId: string, userId: string) {
    try {
      const { data: chat } = await supabase
        .from('chats')
        .select('unread_count')
        .eq('id', chatId)
        .single();

      if (!chat || !chat.unread_count) return 0;
      
      const unreadCount = chat.unread_count as Record<string, number>;
      return unreadCount[userId] || 0;
    } catch (error) {
      console.error('Get chat unread count error:', error);
      return 0;
    }
  },

  /**
   * Increment unread count for a chat
   */
  async incrementUnreadCount(chatId: string, userId: string) {
    try {
      // Get current chat
      const { data: chat } = await supabase
        .from('chats')
        .select('unread_count, participants')
        .eq('id', chatId)
        .single();

      if (!chat) return;

      // Find receiver's index in participants
      const receiverIndex = chat.participants.indexOf(userId);
      if (receiverIndex === -1) return;

      // Increment unread count - Handle JSON type
      const currentCount = chat.unread_count as Record<string, number> || {};
      const userUnreadCount = currentCount[userId] || 0;
      
      const updatedCount = {
        ...currentCount,
        [userId]: userUnreadCount + 1
      };

      const { error } = await supabase
        .from('chats')
        .update({
          unread_count: updatedCount,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chatId);

      if (error) throw error;
    } catch (error) {
      console.error('Increment unread count error:', error);
    }
  },

  /**
   * Delete message
   */
  async deleteMessage(messageId: string, userId: string) {
    try {
      // Check if user owns the message
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      if (message.sender_id !== userId) {
        throw new Error('You can only delete your own messages');
      }

      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

      if (error) throw error;

      return true;
    } catch (error: any) {
      console.error('Delete message error:', error);
      throw new Error('Failed to delete message');
    }
  },

  /**
   * Delete chat
   */
  async deleteChat(chatId: string, userId: string) {
    try {
      // Check if user is in the chat
      const { data: chat, error: fetchError } = await supabase
        .from('chats')
        .select('participants')
        .eq('id', chatId)
        .single();

      if (fetchError) throw fetchError;

      if (!chat.participants.includes(userId)) {
        throw new Error('You are not a participant of this chat');
      }

      // Delete all messages in the chat
      const { error: messagesError } = await supabase
        .from('messages')
        .delete()
        .eq('chat_id', chatId);

      if (messagesError) throw messagesError;

      // Delete the chat
      const { error: chatError } = await supabase
        .from('chats')
        .delete()
        .eq('id', chatId);

      if (chatError) throw chatError;

      return true;
    } catch (error: any) {
      console.error('Delete chat error:', error);
      throw new Error('Failed to delete chat');
    }
  },

  /**
   * Search messages
   */
  async searchMessages(chatId: string, query: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .ilike('content', `%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      return data.map(message => toCamelCase(message));
    } catch (error) {
      console.error('Search messages error:', error);
      return [];
    }
  },

  /**
   * Subscribe to new messages in a chat (real-time)
   */
  subscribeToChatMessages(chatId: string, callback: (message: Message) => void) {
    const channel = supabase
      .channel(`messages:chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          callback(toCamelCase(payload.new as any));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Subscribe to chat updates (real-time)
   */
  subscribeToChatUpdates(userId: string, callback: (chat: Chat) => void) {
    const channel = supabase
      .channel(`chats:user:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
          filter: `participants=cs.{${userId}}`,
        },
        (payload) => {
          callback(toCamelCase(payload.new as any));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  /**
   * Get chat participants info
   */
  async getChatParticipants(chatId: string, userId: string) {
    try {
      const { data: chat, error } = await supabase
        .from('chats')
        .select('participants, participant_names')
        .eq('id', chatId)
        .contains('participants', [userId])
        .single();

      if (error) throw error;

      // Get user info for participants
      const userService = (await import('./userService')).default;
      const participants = await Promise.all(
        chat.participants
          .filter((id: string) => id !== userId)
          .map(async (participantId: string) => {
            const user = await userService.getUserById(participantId);
            return {
              id: participantId,
              name: user?.name || (chat.participant_names as Record<string, string>)?.[participantId] || 'Unknown',
              email: user?.email,
              photoUrl: user?.photoUrl,
            };
          })
      );

      return participants;
    } catch (error) {
      console.error('Get chat participants error:', error);
      return [];
    }
  },

  /**
   * Get chat for a specific case between two users
   */
  async getCaseChat(caseId: string, userId1: string, userId2: string) {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .eq('case_id', caseId)
        .contains('participants', [userId1, userId2])
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return toCamelCase(data);
    } catch (error) {
      console.error('Get case chat error:', error);
      return null;
    }
  },

  /**
   * Get recent chats with unread counts
   */
  async getRecentChatsWithUnread(userId: string, limit: number = 10) {
    try {
      const chats = await this.getUserChats(userId, { limit });
      
      const chatsWithUnread = await Promise.all(
        chats.map(async (chat) => {
          const unreadCount = await this.getChatUnreadCount(chat.id, userId);
          return {
            ...chat,
            unreadCount,
          };
        })
      );

      return chatsWithUnread.sort((a, b) => b.unreadCount - a.unreadCount);
    } catch (error) {
      console.error('Get recent chats with unread error:', error);
      return [];
    }
  },

  /**
   * Update participant names in chat
   */
  async updateParticipantNames(chatId: string, userId: string, participantNames: Record<string, string>) {
    try {
      const { data, error } = await supabase
        .from('chats')
        .update({
          participant_names: participantNames,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chatId)
        .contains('participants', [userId])
        .select()
        .single();

      if (error) throw error;

      return toCamelCase(data);
    } catch (error: any) {
      console.error('Update participant names error:', error);
      throw new Error('Failed to update participant names');
    }
  },

  /**
   * Check if users can chat (both must be active)
   */
  async canUsersChat(userId1: string, userId2: string) {
    try {
      const userService = (await import('./userService')).default;
      const [user1, user2] = await Promise.all([
        userService.getUserById(userId1),
        userService.getUserById(userId2),
      ]);

      return !!(user1?.isActive && user2?.isActive);
    } catch (error) {
      console.error('Check if users can chat error:', error);
      return false;
    }
  },
};

export default chatService;
