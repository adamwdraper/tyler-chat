import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  TextField,
  IconButton,
  Paper,
  Divider,
  CircularProgress
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { Message, Thread } from '../../types';

interface Props {
  threadId: string | null;
}

const ThreadContent = ({ threadId }: Props) => {
  const [newMessage, setNewMessage] = useState('');
  const [thread, setThread] = useState<Thread | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!threadId) return;

    setLoading(true);
    fetch(`/api/threads/${threadId}`)
      .then((response) => response.json())
      .then((data) => {
        setThread(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching thread:', error);
        setLoading(false);
      });
  }, [threadId]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !threadId) return;

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
          type: 'text',
          thread_id: threadId
        }),
      });

      const data = await response.json();
      if (thread) {
        setThread({
          ...thread,
          messages: [...thread.messages, ...data.messages]
        });
      }
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  if (!threadId) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        color: 'text.secondary'
      }}>
        <Typography>Select a thread to view messages</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ 
        height: '100%', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="h6">{thread?.name || 'Thread'}</Typography>
      </Box>

      {/* Messages Area */}
      <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
        <Stack spacing={2}>
          {thread?.messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              <Box
                sx={{
                  maxWidth: '70%',
                  alignSelf: message.senderId === 'user' ? 'flex-end' : 'flex-start',
                  bgcolor: message.senderId === 'user' ? 'primary.light' : 'grey.100',
                  borderRadius: 2,
                  p: 2,
                }}
              >
                <Typography>{message.content}</Typography>
              </Box>
              <Typography 
                variant="caption" 
                color="textSecondary"
                sx={{ 
                  alignSelf: message.senderId === 'user' ? 'flex-end' : 'flex-start',
                  px: 1 
                }}
              >
                {new Date(message.timestamp).toLocaleTimeString()}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Box>

      {/* Message Input */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderTop: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.default'
        }}
      >
        <Stack direction="row" spacing={2}>
          <TextField
            fullWidth
            placeholder="Type your message..."
            variant="outlined"
            size="small"
            value={newMessage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMessage(e.target.value)}
            onKeyPress={(e: React.KeyboardEvent) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <IconButton color="primary" onClick={handleSendMessage}>
            <SendIcon />
          </IconButton>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ThreadContent; 