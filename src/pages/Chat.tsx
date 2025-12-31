import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Divider,
  Button,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Chat as ChatIcon,
  Person,
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';

interface ChatPreview {
  id: string;
  caseId: string;
  caseTitle: string;
  otherUserId: string;
  otherUserName: string;
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
}

const Chat: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadTotal, setUnreadTotal] = useState(0);

  // Helper function to get unread count
  const getUnreadCount = async (userId: string): Promise<number> => {
    try {
      const { data, error, count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  };

  // Helper function to get user chats
  const getUserChats = async (userId: string): Promise<any[]> => {
    try {
      const { data, error } = await supabase
        .from('chats')
        .select('*')
        .contains('participants', [userId])
        .order('last_message_time', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user chats:', error);
      return [];
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    loadChats();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('chats_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chats',
        },
        () => {
          loadChats(); // Refresh chats on change
        }
      )
      .subscribe();
    
    return () => {
      channel.unsubscribe();
    };
  }, [currentUser]);

  const loadChats = async () => {
    if (!currentUser?.id) return;
    
    try {
      setLoading(true);
      const userChats = await getUserChats(currentUser.id);
      
      const chatPreviews: ChatPreview[] = userChats.map((chat: any) => {
        // Find the other participant
        const otherParticipantId = chat.participants.find((id: string) => id !== currentUser.id);
        const participantNames = chat.participant_names as Record<string, string> || {};
        const otherUserName = participantNames[otherParticipantId || ''] || 'Unknown User';
        
        return {
          id: chat.id,
          caseId: chat.case_id,
          caseTitle: chat.case_title,
          otherUserId: otherParticipantId || '',
          otherUserName,
          lastMessage: chat.last_message || 'No messages yet',
          lastMessageTime: new Date(chat.last_message_time || chat.created_at || new Date()),
          unreadCount: chat.unread_count?.[currentUser.id] || 0
        };
      }).sort((a: ChatPreview, b: ChatPreview) => 
        b.lastMessageTime.getTime() - a.lastMessageTime.getTime()
      );
      
      setChats(chatPreviews);
      
      // Calculate total unread from messages table (more accurate)
      const total = await getUnreadCount(currentUser.id);
      setUnreadTotal(total);
    } catch (error) {
      console.error('Error loading chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chats.filter(chat =>
    chat.caseTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.otherUserName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" gutterBottom fontWeight={700}>
        Messages
        {unreadTotal > 0 && (
          <Badge 
            badgeContent={unreadTotal} 
            color="error"
            sx={{ ml: 2 }}
          />
        )}
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6">
            Your Conversations
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Chip
              label={`${chats.length} chat${chats.length !== 1 ? 's' : ''}`}
              color="primary"
              variant="outlined"
            />
            {unreadTotal > 0 && (
              <Chip
                label={`${unreadTotal} unread`}
                color="error"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        <TextField
          fullWidth
          placeholder="Search chats by case or person..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>Loading conversations...</Typography>
          </Box>
        ) : filteredChats.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ChatIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" gutterBottom color="text.secondary">
              No conversations yet
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              {chats.length === 0 
                ? "Start a conversation by messaging someone about their lost or found item."
                : "No chats match your search."
              }
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/lost')}
              sx={{ mt: 2 }}
            >
              Browse Items
            </Button>
          </Box>
        ) : (
          <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
            {filteredChats.map((chat, index) => (
              <React.Fragment key={chat.id}>
                <ListItem
                  button
                  component={RouterLink}
                  to={`/chat/${chat.caseId}?userId=${chat.otherUserId}&userName=${encodeURIComponent(chat.otherUserName)}&caseTitle=${encodeURIComponent(chat.caseTitle)}`}
                  sx={{
                    py: 2,
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={chat.unreadCount}
                      color="error"
                      invisible={chat.unreadCount === 0}
                      overlap="circular"
                    >
                      <Avatar 
                        sx={{ 
                          bgcolor: chat.unreadCount > 0 ? 'primary.main' : 'grey.400',
                          color: 'white'
                        }}
                      >
                        {chat.otherUserName?.[0]?.toUpperCase() || <Person />}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {chat.otherUserName}
                        </Typography>
                        {chat.unreadCount > 0 && (
                          <Box 
                            sx={{ 
                              width: 8, 
                              height: 8, 
                              borderRadius: '50%', 
                              bgcolor: 'primary.main' 
                            }} 
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.primary" noWrap>
                          {chat.lastMessage}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {chat.caseTitle} • {chat.lastMessageTime.toLocaleDateString()}
                        </Typography>
                      </>
                    }
                  />
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <Typography variant="caption" color="text.secondary">
                      {chat.lastMessageTime.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: true 
                      })}
                    </Typography>
                    {chat.unreadCount > 0 && (
                      <Typography variant="caption" color="primary" fontWeight={600} sx={{ mt: 0.5 }}>
                        {chat.unreadCount} new
                      </Typography>
                    )}
                  </Box>
                </ListItem>
                {index < filteredChats.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Paper>
    </Container>
  );
};

export default Chat;
