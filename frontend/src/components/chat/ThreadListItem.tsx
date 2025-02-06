import React from 'react';
import {
  ListItemButton,
  Typography,
  Stack,
  Box,
} from '@mui/material';
import { Thread } from '@/types/chat';
import { formatTimeAgo } from '@/utils/dateUtils';

interface Props {
  thread: Thread;
  isSelected: boolean;
  onClick: () => void;
}

const ThreadListItem: React.FC<Props> = ({ thread, isSelected, onClick }) => {
  const lastMessage = thread.messages[thread.messages.length - 1];
  
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
          <Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>
            {thread.title || 'New Chat'}
          </Typography>
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