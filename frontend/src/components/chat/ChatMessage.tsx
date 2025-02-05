import React from 'react';
import { Box, Avatar, Paper, Typography, CircularProgress } from '@mui/material';
import { IconRobot, IconUser } from '@tabler/icons-react';
import { ThreadMessage } from '../../types/chat';
import { formatTimestamp } from '../../utils/dateUtils';

interface ChatMessageProps {
  message: ThreadMessage;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAssistantTyping = message.senderId === 'assistant' && message.status === 'sending';

  return (
    <Box
      sx={{
        mb: 2,
        display: 'flex',
        flexDirection: message.senderId === 'user' ? 'row-reverse' : 'row',
        gap: 2,
      }}
    >
      <Avatar
        sx={{
          bgcolor: message.senderId === 'assistant' ? 'primary.light' : 'grey.200',
          color: message.senderId === 'assistant' ? 'primary.main' : 'text.secondary',
        }}
      >
        {message.senderId === 'assistant' ? (
          <IconRobot size={20} />
        ) : (
          <IconUser size={20} />
        )}
      </Avatar>
      <Paper
        elevation={0}
        sx={{
          p: 2,
          maxWidth: '70%',
          backgroundColor: message.senderId === 'user' ? 'primary.light' : 'background.paper',
          borderRadius: 2,
          opacity: isAssistantTyping ? 0.7 : 1,
        }}
      >
        {isAssistantTyping ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={16} color="inherit" />
            <Typography variant="body1" color="text.secondary">
              Tyler is typing...
            </Typography>
          </Box>
        ) : (
          <>
            <Typography
              variant="body1"
              color={message.senderId === 'user' ? 'primary.main' : 'text.primary'}
            >
              {message.content}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1 }}
            >
              {formatTimestamp(message.timestamp, false)}
            </Typography>
          </>
        )}
      </Paper>
    </Box>
  );
};

export default ChatMessage; 