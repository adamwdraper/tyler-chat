import React, { useEffect } from 'react';
import { List, Box, Typography, IconButton, Stack } from '@mui/material';
import { IconPlus } from '@tabler/icons-react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { threads, currentThread, loading } = useSelector((state: RootState) => state.chat);
  const theme = useTheme();

  useEffect(() => {
    dispatch(fetchThreads());
  }, [dispatch]);

  const handleThreadClick = (threadId: string) => {
    navigate(`/thread/${threadId}`);
    if (showMobileSidebar) {
      showMobileSidebar();
    }
  };

  const handleNewChat = async () => {
    // First clear the current thread in Redux
    await dispatch(setCurrentThread(null));
    
    // Then navigate to root path
    navigate('/', { replace: true });
    
    // Finally close mobile sidebar if needed
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
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box sx={{ p: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Typography variant="h5">Chats</Typography>
          <IconButton
            color="primary"
            onClick={handleNewChat}
            size="small"
            sx={{
              bgcolor: 'primary.light',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.lighter',
              },
            }}
          >
            <IconPlus size={20} />
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ 
        flexGrow: 1, 
        overflow: 'auto',
        msOverflowStyle: 'none', // Hide scrollbar for IE and Edge
        scrollbarWidth: 'none', // Hide scrollbar for Firefox
        '&::-webkit-scrollbar': { 
          display: 'none', // Hide scrollbar for Chrome, Safari, and Opera
        },
      }}>
        <List sx={{ px: 2 }}>
          {sortedThreads.map((thread) => (
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