import React, { useEffect } from 'react';
import { List, Box, Typography, IconButton, Stack } from '@mui/material';
import { IconPlus } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import ThreadListItem from './ThreadListItem';
import { fetchThreads, setCurrentThread } from '@/store/chat/ChatSlice';
import { Thread } from '@/types/chat';
import { RootState } from '@/store/Store';
import { useAppDispatch } from '@/hooks/useAppDispatch';

interface Props {
  showMobileSidebar?: () => void;
}

const ThreadList: React.FC<Props> = ({ showMobileSidebar }) => {
  const dispatch = useAppDispatch();
  const { threads, currentThread, loading } = useSelector((state: RootState) => state.chat);

  useEffect(() => {
    dispatch(fetchThreads());
  }, [dispatch]);

  const handleThreadClick = (threadId: string) => {
    dispatch(setCurrentThread(threadId));
    if (showMobileSidebar) {
      showMobileSidebar();
    }
  };

  const handleNewChat = () => {
    // Just set current thread to null to indicate a new chat
    dispatch(setCurrentThread(null));
    if (showMobileSidebar) {
      showMobileSidebar();
    }
  };

  // Sort threads by updated_at timestamp
  const sortedThreads = [...threads].sort((a, b) => {
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  if (loading) {
    return <Box p={3}>Loading threads...</Box>;
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Chats</Typography>
          <IconButton 
            onClick={handleNewChat}
            color="primary"
            sx={{
              bgcolor: 'primary.light',
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'white',
              },
            }}
          >
            <IconPlus size={18} />
          </IconButton>
        </Stack>
      </Box>

      {/* Thread List */}
      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto',
        '&::-webkit-scrollbar': { display: 'none' },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}>
        <List sx={{ px: 2, height: '100%' }}>
          {sortedThreads.map((thread: Thread) => (
            <ThreadListItem
              key={thread.id}
              thread={thread}
              isSelected={thread.id === currentThread}
              onClick={() => handleThreadClick(thread.id)}
            />
          ))}
          {threads.length === 0 && (
            <Box p={3} textAlign="center">
              <Typography color="textSecondary">
                No conversations yet. Start a new chat!
              </Typography>
            </Box>
          )}
        </List>
      </Box>
    </Box>
  );
};

export default ThreadList; 