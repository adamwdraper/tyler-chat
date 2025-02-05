import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Stack,
  useTheme,
  alpha,
  InputAdornment,
  ListItemButton,
  ListItemText,
  Divider,
  Avatar,
  Paper,
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { IconRobot, IconUser, IconSearch, IconMessage, IconPlus, IconTrash } from '@tabler/icons-react';
import { Thread, ThreadMessage } from '../types/chat';
import { formatDistanceToNowStrict, isToday, format } from 'date-fns';

const drawerWidth = 280;

const formatTimestamp = (timestamp: string, shortFormat: boolean = true): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // For very recent messages (less than a minute)
  if (diffInSeconds < 60) {
    return 'now';
  }

  // For messages within the last hour, show minutes
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m`;
  }

  // For today's messages, show hours
  if (isToday(date)) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h`;
  }

  // For older messages, show the date
  return shortFormat ? format(date, 'MMM d') : format(date, 'MMM d, yyyy');
};

const TylerChat = () => {
  const theme = useTheme();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [currentThread, setCurrentThread] = useState<Thread | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchThreads();
  }, []);

  const fetchThreads = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/threads');
      const data = await response.json();
      setThreads(data);
      if (data.length > 0) {
        setCurrentThread(data[0]);
      }
    } catch (error) {
      console.error('Error fetching threads:', error);
    }
  };

  const startNewChat = () => {
    const tempThread: Thread = {
      id: `temp-${Date.now()}`, // Temporary ID
      name: 'New Chat',
      messages: [],
      lastActivity: new Date().toISOString(),
      status: 'active',
      avatar: ''
    };
    
    setThreads(prevThreads => [tempThread, ...prevThreads]);
    setCurrentThread(tempThread);
  };

  const sendMessage = async () => {
    if (!message.trim() || !currentThread) return;

    setLoading(true);
    try {
      // If this is a temporary thread, create it first
      let threadId = currentThread.id;
      if (threadId.startsWith('temp-')) {
        const threadResponse = await fetch('http://localhost:8000/api/threads', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'New Chat',
          }),
        });
        const newThread = await threadResponse.json();
        threadId = newThread.id;
      }

      // Send the message
      const response = await fetch('http://localhost:8000/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: message,
          thread_id: threadId,
          type: 'text'
        }),
      });

      const data = await response.json();
      setMessage('');
      await fetchThreads();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleWebSocketMessage = (data: any) => {
    if (data.type === 'new_message') {
      fetchThreads(); // Refresh threads when new message arrives
    }
  };

  useWebSocket(handleWebSocketMessage);

  const deleteThread = async (threadId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent thread selection when clicking delete
    try {
      await fetch(`http://localhost:8000/api/threads/${threadId}`, {
        method: 'DELETE',
      });
      await fetchThreads();
      if (currentThread?.id === threadId) {
        setCurrentThread(null);
      }
    } catch (error) {
      console.error('Error deleting thread:', error);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: 'background.default' }}>
      <Paper
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          borderRight: (theme) => `1px solid ${theme.palette.divider}`,
          backgroundColor: 'background.default',
        }}
        elevation={0}
      >
        {/* Search Header */}
        <Box p={3} pb={2}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h5">
              Conversations
            </Typography>
            <IconButton
              color="primary"
              onClick={startNewChat}
              size="small"
              sx={{
                backgroundColor: 'primary.light',
                '&:hover': {
                  backgroundColor: 'primary.main',
                  color: 'white',
                },
              }}
            >
              <IconPlus size={18} />
            </IconButton>
          </Box>
          <TextField
            fullWidth
            size="small"
            placeholder="Search chats..."
            variant="outlined"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconSearch size={18} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {/* Thread List */}
        <Box sx={{ height: 'calc(100vh - 140px)', overflow: 'auto', px: 3 }}>
          {threads.map((thread) => (
            <ListItemButton
              key={thread.id}
              selected={currentThread?.id === thread.id}
              onClick={() => setCurrentThread(thread)}
              sx={{
                mb: 1,
                borderRadius: '8px',
                position: 'relative',
                '&.Mui-selected': {
                  backgroundColor: 'primary.light',
                  '&:hover': {
                    backgroundColor: 'primary.light',
                  },
                },
                '&:hover': {
                  backgroundColor: 'grey.100',
                  '& .delete-button': {
                    opacity: 1,
                  },
                },
              }}
            >
              <Box sx={{ width: '100%', py: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {thread.name}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="textSecondary">
                      {formatTimestamp(thread.lastActivity)}
                    </Typography>
                    <IconButton
                      className="delete-button"
                      size="small"
                      onClick={(e) => deleteThread(thread.id, e)}
                      sx={{
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        color: 'text.secondary',
                        '&:hover': {
                          color: 'error.main',
                          backgroundColor: 'error.lighter',
                        },
                      }}
                    >
                      <IconTrash size={16} />
                    </IconButton>
                  </Box>
                </Box>
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{
                    mt: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {thread.messages[thread.messages.length - 1]?.content}
                </Typography>
              </Box>
            </ListItemButton>
          ))}
        </Box>
      </Paper>

      {/* Main Chat Area - Similar to EmailContent.tsx */}
      <Box sx={{ 
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: (theme) => alpha(theme.palette.background.default, 0.98),
      }}>
        {/* Chat Header */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderBottom: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          {currentThread && (
            <Stack direction="row" alignItems="center" spacing={2}>
              <Avatar sx={{ width: 40, height: 40 }}>
                <IconMessage size={20} />
              </Avatar>
              <Box>
                <Typography variant="h6">{currentThread.name}</Typography>
                <Typography variant="body2" color="textSecondary">
                  {currentThread.messages.length} messages
                </Typography>
              </Box>
            </Stack>
          )}
        </Paper>

        {/* Messages */}
        <Box sx={{ 
          flex: 1,
          overflow: 'auto',
          p: 3,
        }}>
          {currentThread?.messages.map((message) => (
            <Box
              key={message.id}
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
                }}
              >
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
              </Paper>
            </Box>
          ))}
        </Box>

        {/* Message Input */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <Stack direction="row" spacing={2}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              variant="outlined"
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
            />
            <IconButton
              color="primary"
              onClick={sendMessage}
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
        </Paper>
      </Box>
    </Box>
  );
};

export default TylerChat; 