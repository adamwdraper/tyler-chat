import React, { useState, useEffect, useCallback } from 'react';
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
import ThreadList from './chat/ThreadList';
import MessageList from './chat/MessageList';
import MessageInput from './chat/MessageInput';
import ThreadHeader from './chat/ThreadHeader';

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
  const [pendingResponse, setPendingResponse] = useState(false);

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

    const optimisticMessage: ThreadMessage = {
      id: `temp-${Date.now()}`,
      content: message.trim(),
      timestamp: new Date().toISOString(),
      senderId: 'user',
    };

    // Add a pending assistant message
    const pendingAssistantMessage: ThreadMessage = {
      id: `pending-${Date.now()}`,
      content: '...',
      timestamp: new Date().toISOString(),
      senderId: 'assistant',
      status: 'sending'
    };

    // Optimistically update the UI with both messages
    const updatedThread = {
      ...currentThread,
      messages: [...currentThread.messages, optimisticMessage, pendingAssistantMessage],
      lastActivity: optimisticMessage.timestamp
    };
    
    setCurrentThread(updatedThread);
    setThreads(prevThreads => 
      prevThreads.map(t => 
        t.id === currentThread.id ? updatedThread : t
      )
    );
    setMessage('');
    setPendingResponse(true);
    
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
          content: optimisticMessage.content,
          thread_id: threadId,
          type: 'text'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // After successful response, the pending message will be replaced by fetchThreads()
      await fetchThreads();
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Revert both the user message and pending assistant message on error
      if (currentThread) {
        const revertedThread = {
          ...currentThread,
          messages: currentThread.messages.filter(m => 
            m.id !== optimisticMessage.id && m.id !== pendingAssistantMessage.id
          )
        };
        setCurrentThread(revertedThread);
        setThreads(prevThreads => 
          prevThreads.map(t => 
            t.id === currentThread.id ? revertedThread : t
          )
        );
      }
    } finally {
      setPendingResponse(false);
    }
  };

  const handleWebSocketMessage = useCallback((data: any) => {
    if (data.type === 'new_message') {
      fetchThreads(); // Refresh threads when new message arrives
    }
  }, []);

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
      <ThreadList
        threads={threads}
        currentThread={currentThread}
        onThreadSelect={setCurrentThread}
        onNewChat={startNewChat}
        onDeleteThread={deleteThread}
      />

      <Box sx={{ 
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: (theme) => alpha(theme.palette.background.default, 0.98),
      }}>
        <ThreadHeader thread={currentThread} />
        <MessageList messages={currentThread?.messages || []} />
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: 'background.paper',
          }}
        >
          <MessageInput
            message={message}
            loading={loading}
            onMessageChange={setMessage}
            onSendMessage={sendMessage}
          />
        </Paper>
      </Box>
    </Box>
  );
};

export default TylerChat; 