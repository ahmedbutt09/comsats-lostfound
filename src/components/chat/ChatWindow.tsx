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
  caseTitle?: string;
  receiverId: string;
  receiverName: string;
  open: boolean;
  onClose: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ caseId, caseTitle = 'Case Chat', receiverId, receiverName, open, onClose }) => {
  const { currentUser, userData } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // NEW: For attachments

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // --- NEW: REAL ATTACHMENT FUNCTION ---
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !chatId || !currentUser) return;

    setIsSending(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `chat_attachments/${chatId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
      .from('chat-attachments') 
      .upload(filePath, file);
    
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage
      .from('chat-attachments') // Matches the upload bucket
      .getPublicUrl(filePath);

      await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: currentUser.id,
        receiver_id: receiverId,
        content: publicUrl, // Sends the image URL
        is_read: false,
        // message_type: 'image' // Uncomment if your DB has this column
      });
    } catch (err: any) {
      setError('Upload failed: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  const getOrCreateChat = async () => {
    if (!currentUser?.id) return null;
    try {
      const { data: existingChat } = await supabase
        .from('chats')
        .select('id')
        .eq('case_id', caseId)
        .contains('participants', [currentUser.id])
        .contains('participants', [receiverId])
        .maybeSingle();

      if (existingChat) return existingChat.id;

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
        }, { onConflict: 'case_id, participants' })
        .select().single();

      if (createError) throw createError;
      return newChat?.id;
    } catch (err) {
      console.error('Chat Init Error:', err);
      return null;
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_id', id)
        .order('created_at', { ascending: true });
      if (error) throw error;
      setMessages(data as Message[]);
    } finally {
      setLoading(false);
    }
  };

  // --- FIXED: REALTIME SUBSCRIPTION ---
  useEffect(() => {
    if (!open || !currentUser?.id) return;

    let channel: any;

    const initialize = async () => {
      setLoading(true);
      try {
        const id = await getOrCreateChat();
        if (!id) {
          setError('Could not start chat');
          return;
        }

        setChatId(id);
        await fetchMessages(id);
        await markMessagesAsRead(id);

        // Unique channel name prevents "Channel already exists" errors
        channel = supabase
          .channel(`room_${id}_${Date.now()}`)
          .on('postgres_changes', 
            { 
              event: 'INSERT', 
              schema: 'public', 
              table: 'messages', 
              filter: `chat_id=eq.${id}` 
            }, 
            (payload) => {
              const msg = payload.new as Message;
              setMessages((prev) => {
                if (prev.find(m => m.id === msg.id)) return prev;
                return [...prev, msg];
              });
              setTimeout(scrollToBottom, 100);
            }
          )
          .subscribe((status) => {
            console.log("Subscription status:", status);
          });
      } catch (err) {
        console.error("Chat Error:", err);
        setError("Failed to connect to chat.");
      } finally {
        setLoading(false);
      }
    };

    initialize();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [open, caseId, receiverId, currentUser?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const markMessagesAsRead = async (id: string) => {
    if (!currentUser?.id) return;
    await supabase.from('messages')
      .update({ is_read: true })
      .eq('chat_id', id)
      .eq('receiver_id', currentUser.id)
      .eq('is_read', false);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser?.id || isSending || !chatId) return;
    setIsSending(true);
    try {
      const { error: sendError } = await supabase.from('messages').insert({
        chat_id: chatId,
        sender_id: currentUser.id,
        receiver_id: receiverId,
        content: newMessage.trim(),
        is_read: false,
      });
      if (sendError) throw sendError;
      setNewMessage('');
      await supabase.from('chats').update({
        last_message: newMessage.trim(),
        last_message_time: new Date().toISOString(),
      }).eq('id', chatId);
    } catch (err) {
      setError('Message failed to send');
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
        bottom: { xs: 0, sm: 20 },
        right: { xs: 0, sm: 20 },
        width: { xs: '100%', sm: 400 },
        height: { xs: '100dvh', sm: 500 },
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 24,
        borderRadius: { xs: 0, sm: 2 },
        zIndex: 1300,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32, bgcolor: 'white', color: 'primary.main' }}>
            {receiverName?.[0]}
          </Avatar>
          <Box>
            <Typography variant="subtitle1" fontWeight={600}>{receiverName}</Typography>
            <Typography variant="caption">{caseTitle}</Typography>
          </Box>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}><Close /></IconButton>
      </Box>

      {/* Messages */}
      <Box ref={chatContainerRef} sx={{ flex: 1, overflowY: 'auto', p: 2, bgcolor: 'grey.50', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {loading ? (
          <Box sx={{ display: 'center', p: 3 }}><CircularProgress size={24} /></Box>
        ) : messages.length === 0 ? (
          <Typography textAlign="center" color="text.secondary" sx={{ p: 3 }}>No messages yet.</Typography>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} isOwnMessage={msg.sender_id === currentUser.id} />
          ))
        )}
        <div ref={messagesEndRef} />
      </Box>

      {error && <Alert severity="error" sx={{ mx: 2, mt: 1 }}>{error}</Alert>}

      {/* Input Section */}
      <Box component="form" onSubmit={handleSendMessage} sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'white' }}>
        <input 
          type="file" 
          hidden 
          ref={fileInputRef} 
          onChange={handleFileUpload} 
          accept="image/*,application/pdf" 
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton size="small" onClick={() => fileInputRef.current?.click()}>
            <AttachFile />
          </IconButton>
          <IconButton size="small" onClick={() => fileInputRef.current?.click()}>
            <ImageIcon />
          </IconButton>
          <TextField
            fullWidth multiline maxRows={3} size="small"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isSending}
          />
          <IconButton type="submit" color="primary" disabled={!newMessage.trim() || isSending}>
            {isSending ? <CircularProgress size={20} /> : <Send />}
          </IconButton>
        </Box>
      </Box>
    </Paper>
  );
};

export default ChatWindow;
