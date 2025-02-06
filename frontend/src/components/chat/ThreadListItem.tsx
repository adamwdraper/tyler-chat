import React, { useState, useEffect } from 'react';
import {
  ListItemButton,
  Typography,
  Stack,
  Box,
  keyframes,
} from '@mui/material';
import { Thread } from '@/types/chat';
import { formatTimeAgo } from '@/utils/dateUtils';

const titleTypingAnimation = keyframes`
  0% {
    clip-path: inset(0 100% 0 0);
  }
  100% {
    clip-path: inset(0 0 0 0);
  }
`;

interface Props {
  thread: Thread;
  isSelected: boolean;
  onClick: () => void;
}

const ThreadListItem: React.FC<Props> = ({ thread, isSelected, onClick }) => {
  const lastMessage = thread.messages[thread.messages.length - 1];
  const [isNewTitle, setIsNewTitle] = useState(false);
  const [displayTitle, setDisplayTitle] = useState(thread.title);
  const [prevTitle, setPrevTitle] = useState(thread.title);

  useEffect(() => {
    if (thread.title !== prevTitle && thread.title !== 'New Chat') {
      setIsNewTitle(true);
      setPrevTitle(thread.title);
      // Keep the old title visible until animation starts
      setTimeout(() => {
        setDisplayTitle(thread.title);
        // Reset animation after it completes
        setTimeout(() => setIsNewTitle(false), 2500);
      }, 50);
    }
  }, [thread.title, prevTitle]);
  
  return (
    <ListItemButton 
      sx={{ 
        mb: 1, 
        py: 2,
        borderRadius: (theme) => `${theme.shape.borderRadius}px`,
      }} 
      selected={isSelected}
      onClick={onClick}
    >
      <Box sx={{ width: '100%' }}>
        <Stack direction="row" gap="10px" alignItems="center" mb={0.5}>
          <Box sx={{ 
            flex: 1,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            position: 'relative'
          }}>
            <Typography 
              variant="subtitle2" 
              fontWeight={600} 
              sx={{
                visibility: isNewTitle ? 'hidden' : 'visible'
              }}
            >
              {thread.title || 'New Chat'}
            </Typography>
            {isNewTitle && (
              <Typography
                variant="subtitle2"
                fontWeight={600}
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  animation: `${titleTypingAnimation} 2s steps(${displayTitle?.length || 8}, end)`,
                }}
              >
                {displayTitle}
              </Typography>
            )}
          </Box>
          <Typography variant="caption" color="textSecondary">
            {thread.updated_at ? formatTimeAgo(thread.updated_at) : ''}
          </Typography>
        </Stack>
        {lastMessage && (
          <Typography 
            variant="body2" 
            color="textSecondary" 
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {lastMessage.content}
          </Typography>
        )}
      </Box>
    </ListItemButton>
  );
};

export default ThreadListItem; 