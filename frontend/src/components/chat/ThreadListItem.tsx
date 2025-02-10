import React, { useState, useEffect, useCallback } from 'react';
import {
  ListItemButton,
  Typography,
  Stack,
  Box,
  keyframes,
} from '@mui/material';
import { Thread, TextContent, ImageContent } from '@/types/chat';
import { formatTimeAgo } from '@/utils/dateUtils';
import { useTimeAgoUpdater } from '@/hooks/useTimeAgoUpdater';

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
  const [timeAgo, setTimeAgo] = useState(thread.updated_at ? formatTimeAgo(thread.updated_at) : '');

  // Callback to update the time ago display
  const updateTimeAgo = useCallback(() => {
    setTimeAgo(thread.updated_at ? formatTimeAgo(thread.updated_at) : '');
  }, [thread.updated_at]);

  // Use the custom hook for periodic updates
  useTimeAgoUpdater(updateTimeAgo);

  useEffect(() => {
    // Update time ago when thread.updated_at changes
    updateTimeAgo();
  }, [thread.updated_at, updateTimeAgo]);

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

  const getMessageContent = (content: string | (TextContent | ImageContent)[]) => {
    if (typeof content === 'string') {
      return content;
    }
    return content
      .filter(item => item.type === 'text')
      .map(item => (item as TextContent).text)
      .join(' ');
  };
  
  return (
    <ListItemButton 
      sx={{ 
        mb: 1, 
        py: 2,
        px: 2,
        borderRadius: (theme) => `${theme.shape.borderRadius}px`,
        transition: (theme) => theme.transitions.create(['background-color', 'box-shadow'], {
          duration: theme.transitions.duration.shorter,
        }),
        '&:hover': {
          backgroundColor: theme => theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.05)' 
            : 'rgba(0, 0, 0, 0.04)',
        },
        '&.Mui-selected': {
          backgroundColor: theme => theme.palette.mode === 'dark' 
            ? 'rgba(93, 135, 255, 0.1)' 
            : 'rgba(93, 135, 255, 0.08)',
          '&:hover': {
            backgroundColor: theme => theme.palette.mode === 'dark' 
              ? 'rgba(93, 135, 255, 0.15)' 
              : 'rgba(93, 135, 255, 0.12)',
          },
        },
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
                visibility: isNewTitle ? 'hidden' : 'visible',
                color: theme => isSelected 
                  ? theme.palette.primary.main 
                  : theme.palette.text.primary,
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
                  color: theme => isSelected 
                    ? theme.palette.primary.main 
                    : theme.palette.text.primary,
                }}
              >
                {displayTitle}
              </Typography>
            )}
          </Box>
          <Typography 
            variant="caption" 
            color="textSecondary"
            sx={{
              minWidth: 'fit-content',
            }}
          >
            {timeAgo}
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
              lineHeight: '1.4',
              fontSize: '0.875rem',
            }}
          >
            {getMessageContent(lastMessage.content)}
          </Typography>
        )}
      </Box>
    </ListItemButton>
  );
};

export default ThreadListItem; 