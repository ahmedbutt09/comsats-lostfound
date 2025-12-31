import React, { useState, useEffect, useRef } from 'react';
import {
  Paper,
  Box,
  Typography,
  TextField,
  IconButton,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Send,
  Close,
  AttachFile,
  Image as ImageIcon,
} from '@mui/icons-material';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import MessageBubble from './MessageBubble';
import { Message } from '../../types';

interface ChatWindowProps {
  caseId: string;
  caseTitle?: string; // Added this to pass case title
  receiverId: string;
  receiverName: string;
  open: boolean;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  caseId,
  caseTitle = 'Case Chat', // Default value
  receiverId,
  receiverName,
  open,
  onClose,
}) => {
  const { currentUser, userData } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Get or create chat room
  const getOrCreateChat = async () => {
    if (!currentUser?.id) return null;
  
    try {
      // 1. Check for existing chat using BOTH participants in the exact array
      // We sort the array to ensure [A, B] and [B, A] match the same record
      const participantIds = [currentUser.id, receiverId].sort();
  
      const { data: existingChat, error: findError } = await supabase
        .from('chats')
        .select('id')
        .eq('case_id', caseId)
        .contains('participants', [currentUser.id])
        .contains('participants', [receiverId])
        .maybeSingle();
  
      if (existingChat) return existingChat.id;
  
      // 2. Insert with an "upsert" style logic
      // 'onConflict' tells Supabase: "If you see a 409, just give me the existing row instead"
      const { data: newChat, error: createError } = await supabase
        .from('chats')
        .upsert({
          case_id: caseId,
          case_title: caseTitle,
          participants: [currentUser.id, receiverId],
          participant_names: {
            [currentUser.id]: userData?.name || 'User',
            [receiverId]: receiverName,
          },
          unread_count: { [receiverId]: 0, [currentUser.id]: 0 },
        }, {
          onConflict: 'case_id, participants', 
          ignoreDuplicates: false
        })
        .select()
        .single();
  
      if (createError) throw createError;
      return newChat?.id;
  
    } catch (error) {
      console.error('Chat Initialization Error:', error);
      setError('Could not connect to chat.');
      return null;
    }
  };
  // Fetch messages
  const fetchMessages = async (chatId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        setMessages(data as Message[]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to load messages');
      setLoading(false);
    }
  };

  // Subscribe to new messages
  const subscribeToMessages = (chatId: string) => {
    const subscription = supabase
      .channel(`messages:chat_id=eq.${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
          setTimeout(scrollToBottom, 100);
        }
      )
      .subscribe();

    return subscription;
  };

  useEffect(() => {
    if (!open || !currentUser?.id) return;

    setLoading(true);
    setError('');

    const initializeChat = async () => {
      try {
        const chatId = await getOrCreateChat();
        if (!chatId) {
          setError('Failed to initialize chat');
          setLoading(false);
          return;
        }

        setChatId(chatId);
        await fetchMessages(chatId);
        
        // Set up real-time subscription
        const subscription = subscribeToMessages(chatId);
        
        // Mark messages as read
        await markMessagesAsRead(chatId);
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing chat:', error);
        setError('Failed to initialize chat');
        setLoading(false);
      }
    };

    const cleanup = initializeChat();

    return () => {
      if (cleanup) {
        cleanup.then(fn => fn && fn());
      }
    };
  }, [open, currentUser, receiverId, caseId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read
  const markMessagesAsRead = async (chatId: string) => {
    if (!currentUser?.id) return;

    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('chat_id', chatId)
        .eq('receiver_id', currentUser.id)
        .eq('is_read', false);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !currentUser?.id || isSending || !chatId) return;
  
    setIsSending(true);
    setError('');
  
    try {
      // We strictly send ONLY what is needed. 
      // If the 409 persists, remove 'case_id' from this insert entirely.
      const { error: sendError } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: currentUser.id,
          receiver_id: receiverId,
          content: newMessage.trim(),
          is_read: false,
          // case_id: caseId // TRY REMOVING THIS LINE if it still fails
        });
  
      if (sendError) throw sendError;
  
      setNewMessage('');
  
      // Update the parent chat record
      await supabase
        .from('chats')
        .update({
          last_message: newMessage.trim(),
          last_message_time: new Date().toISOString(),
        })
        .eq('id', chatId);
        
    } catch (err: any) {
      console.error('Send message error:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!open || !currentUser?.id) return null;

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 400,
        height: 500,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 24,
        borderRadius: 2,
        zIndex: 1300,
        overflow: 'hidden',
      }}
    >
      {/* Chat Header */}
      <Box
        sx={{
          p: 2,
          bgcolor: 'primary.main',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'white',
              color: 'primary.main',
              fontSize: '0.875rem',
            }}
          >
            {receiverName?.[0] || 'U'}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>
              Chat with {receiverName}
            </Typography>
            <Typography variant="caption">
              {caseTitle}
            </Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <Close />
        </IconButton>
      </Box>

      {/* Messages Container */}
      <Box
        ref={chatContainerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          bgcolor: 'grey.50',
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
        }}
      >
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress size={24} />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ textAlign: 'center', p: 3 }}>
            <Typography color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              isOwnMessage={message.sender_id === currentUser.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mx: 2, mt: 1 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Message Input */}
      <Box
        component="form"
        onSubmit={handleSendMessage}
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
          bgcolor: 'white',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" disabled>
            <AttachFile />
          </IconButton>
          <IconButton size="small" disabled>
            <ImageIcon />
          </IconButton>
          <TextField
            fullWidth
            multiline
            maxRows={3}
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
            size="small"
          />
          <IconButton
            type="submit"
            color="primary"
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? <CircularProgress size={20} /> : <Send />}
          </IconButton>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          Press Enter to send, Shift+Enter for new line
        </Typography>
      </Box>
    </Paper>
  );
};

export default ChatWindow;
