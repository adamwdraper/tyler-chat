import React from 'react';
import { Stack, TextField, IconButton } from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';

interface MessageInputProps {
  message: string;
  loading: boolean;
  onMessageChange: (message: string) => void;
  onSendMessage: () => void;
}

const MessageInput: React.FC<MessageInputProps> = ({
  message,
  loading,
  onMessageChange,
  onSendMessage,
}) => {
  return (
    <Stack direction="row" spacing={2}>
      <TextField
        fullWidth
        multiline
        maxRows={4}
        variant="outlined"
        placeholder="Type your message..."
        value={message}
        onChange={(e) => onMessageChange(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSendMessage();
          }
        }}
      />
      <IconButton
        color="primary"
        onClick={onSendMessage}
        disabled={loading || !message.trim()}
        sx={{ 
          p: '8px',
          alignSelf: 'flex-end',
          backgroundColor: 'primary.main',
          color: 'white',
          '&:hover': {
            backgroundColor: 'primary.dark',
          },
        }}
      >
        <SendIcon />
      </IconButton>
    </Stack>
  );
};

export default MessageInput; 