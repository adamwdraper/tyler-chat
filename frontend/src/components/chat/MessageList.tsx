import React from 'react';
import { Box } from '@mui/material';
import { ThreadMessage } from '../../types/chat';
import ChatMessage from './ChatMessage';

interface MessageListProps {
  messages: ThreadMessage[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <Box sx={{ 
      flex: 1,
      overflow: 'auto',
      p: 3,
    }}>
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}
    </Box>
  );
};

export default MessageList; 