import React from 'react';
import { Box, Typography, Avatar, Paper } from '@mui/material';
import { Done, DoneAll } from '@mui/icons-material';
import { formatRelativeTime } from '../../utils/helpers';
import { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  senderName?: string; // Add senderName as optional prop
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isOwnMessage,
  senderName // Receive senderName from parent
}) => {
  const messageTime = formatRelativeTime(message.created_at);
  
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
        mb: 1,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          maxWidth: '70%',
          flexDirection: isOwnMessage ? 'row-reverse' : 'row',
        }}
      >
        {!isOwnMessage && (
          <Avatar
            sx={{
              width: 28,
              height: 28,
              bgcolor: 'primary.main',
              fontSize: '0.75rem',
              flexShrink: 0,
            }}
          >
            {(senderName?.[0] || '?').toUpperCase()}
          </Avatar>
        )}
        
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 2,
            backgroundColor: isOwnMessage ? 'primary.main' : 'grey.100',
            color: isOwnMessage ? 'white' : 'text.primary',
            position: 'relative',
            wordBreak: 'break-word',
            overflowWrap: 'break-word',
            maxWidth: '100%',
          }}
        >
          <Typography variant="body2">{message.content}</Typography>
          
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: 0.5,
              mt: 0.5,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: isOwnMessage ? 'rgba(255, 255, 255, 0.7)' : 'text.secondary',
                fontSize: '0.7rem',
              }}
            >
              {messageTime}
            </Typography>
            
            {isOwnMessage && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                {message.is_read ? (
                  <DoneAll fontSize="small" sx={{ fontSize: '0.875rem', opacity: 0.7 }} />
                ) : (
                  <Done fontSize="small" sx={{ fontSize: '0.875rem', opacity: 0.7 }} />
                )}
              </Box>
            )}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
};

export default MessageBubble;
