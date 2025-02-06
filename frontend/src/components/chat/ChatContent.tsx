import React, { useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  IconButton,
  Stack,
  Avatar,
  useTheme,
} from '@mui/material';
import { IconSend } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { addMessage, processThread, createThread } from '@/store/chat/ChatSlice';
import { RootState } from '@/store/Store';
import { Message, Thread } from '@/types/chat';
import Scrollbar from '@/components/custom-scroll/Scrollbar';
import { useAppDispatch } from '@/hooks/useAppDispatch';

const ChatContent: React.FC = () => {
  const theme = useTheme();
  const dispatch = useAppDispatch();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = React.useState('');
  
  const { threads, currentThread } = useSelector((state: RootState) => state.chat);
  const activeThread = threads.find((t: Thread) => t.id === currentThread);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeThread?.messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    let threadId = currentThread;
    
    // If no active thread, create one first
    if (!threadId) {
      const newThread = await dispatch(createThread({ title: 'New Chat' })).unwrap();
      threadId = newThread.id;
    }

    await dispatch(addMessage({
      threadId,
      message: {
        role: 'user',
        content: newMessage
      }
    }));

    setNewMessage('');
    
    // Process the thread to get AI response
    await dispatch(processThread(threadId));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message: Message) => {
    const isAI = message.role === 'assistant';
    
    return (
      <Box
        key={message.id}
        sx={{
          display: 'flex',
          gap: 2,
          mb: 2,
          flexDirection: isAI ? 'row' : 'row-reverse'
        }}
      >
        <Avatar
          sx={{
            bgcolor: isAI ? 'primary.main' : 'secondary.main',
            width: 32,
            height: 32
          }}
        >
          {isAI ? 'AI' : 'U'}
        </Avatar>
        <Paper
          sx={{
            p: 2,
            maxWidth: '70%',
            bgcolor: isAI ? 'grey.100' : 'primary.light',
            color: isAI ? 'text.primary' : 'primary.dark',
            borderRadius: 2
          }}
        >
          <Typography variant="body1">{message.content}</Typography>
        </Paper>
      </Box>
    );
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {activeThread && (
        <Box sx={{ p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="h6">
            {activeThread.title || 'Untitled Chat'}
          </Typography>
        </Box>
      )}

      <Box sx={{ flexGrow: 1, p: 3, overflow: 'hidden' }}>
        <Scrollbar>
          <Stack spacing={2}>
            {activeThread?.messages.map(renderMessage)}
            {!activeThread && (
              <Box textAlign="center" py={8}>
                <Typography variant="h5" gutterBottom>
                  Welcome to Tyler Chat
                </Typography>
                <Typography color="textSecondary">
                  Start a new conversation by typing a message below
                </Typography>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Stack>
        </Scrollbar>
      </Box>

      <Box sx={{ p: 3, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Stack direction="row" spacing={2}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            variant="outlined"
            size="small"
          />
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            sx={{
              bgcolor: 'primary.light',
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'white',
              },
            }}
          >
            <IconSend size={18} />
          </IconButton>
        </Stack>
      </Box>
    </Box>
  );
};

export default ChatContent; 