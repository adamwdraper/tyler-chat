import React, { useEffect } from 'react';
import { List, Box, Typography, IconButton, Stack } from '@mui/material';
import { IconPlus } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import ThreadListItem from './ThreadListItem';
import { fetchThreads, setCurrentThread } from '@/store/chat/ChatSlice';
import { Thread } from '@/types/chat';
import { RootState } from '@/store/Store';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useTheme } from '@mui/material/styles';

interface Props {
  showMobileSidebar?: () => void;
}

const ThreadList: React.FC<Props> = ({ showMobileSidebar }) => {
  const dispatch = useAppDispatch();
  const { threads, currentThread, loading } = useSelector((state: RootState) => state.chat);
  const theme = useTheme();

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
    dispatch(setCurrentThread(null));
    if (showMobileSidebar) {
      showMobileSidebar();
    }
  };

  // Sort threads by updated_at timestamp in descending order (newest first)
  const sortedThreads = [...threads].sort((a, b) => {
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  if (loading) {
    return <Box p={3}>Loading threads...</Box>;
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        py: 3,
        px: 4,
        display: 'flex',
      }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%">
          <Typography variant="h6">Chats</Typography>
          <IconButton 
            onClick={handleNewChat}
            color="primary"
            size="small"
            sx={{
              bgcolor: 'primary.light',
              '&:hover': {
                bgcolor: 'primary.main',
                color: 'white',
              },
            }}
          >
            <IconPlus size={20} />
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
        </List>
      </Box>
    </Box>
  );
};

export default ThreadList; 