import React from 'react';
import { Box, Typography, Avatar, Paper } from '@mui/material';
import { Done, DoneAll } from '@mui/icons-material';
import { formatRelativeTime } from '../../utils/helpers';
import { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  senderName?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwnMessage, senderName }) => {
  const messageTime = formatRelativeTime(message.created_at);

  // Improved image detection for Supabase Public URLs
  const isImage = message.content.startsWith('http') && 
    (message.content.match(/\.(jpeg|jpg|gif|png|webp)/i) || message.content.includes('storage/v1/object/public'));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: isOwnMessage ? 'flex-end' : 'flex-start', mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, maxWidth: '85%', flexDirection: isOwnMessage ? 'row-reverse' : 'row' }}>
        {!isOwnMessage && (
          <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: '0.75rem' }}>
            {(senderName?.[0] || 'U').toUpperCase()}
          </Avatar>
        )}
        
        <Paper
          elevation={1}
          sx={{
            p: isImage ? 0.5 : 1.5,
            borderRadius: 2,
            // STYLING FIX: Solid colors to prevent transparency issues
            backgroundColor: isOwnMessage ? '#1976d2' : '#ffffff', 
            color: isOwnMessage ? '#ffffff' : '#212121',
            border: isOwnMessage ? 'none' : '1px solid #e0e0e0',
            overflow: 'hidden',
          }}
        >
          {isImage ? (
            <Box
              component="img"
              src={message.content}
              alt="Attachment"
              sx={{
                display: 'block',
                width: '100%',
                maxWidth: 240,
                maxHeight: 300,
                borderRadius: 1,
                objectFit: 'cover',
                cursor: 'pointer',
              }}
              onClick={() => window.open(message.content, '_blank')}
            />
          ) : (
            <Typography variant="body2" sx={{ color: 'inherit', fontWeight: 500 }}>
              {message.content}
            </Typography>
          )}
          
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
            <Typography variant="caption" sx={{ color: isOwnMessage ? 'rgba(255,255,255,0.7)' : 'text.secondary', fontSize: '0.65rem' }}>
              {messageTime}
            </Typography>
            {isOwnMessage && (
              <Box sx={{ display: 'flex', color: 'rgba(255,255,255,0.7)' }}>
                {message.is_read ? <DoneAll sx={{ fontSize: '0.85rem' }} /> : <Done sx={{ fontSize: '0.85rem' }} />}
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default MessageBubble;
