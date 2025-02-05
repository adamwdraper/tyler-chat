import React from 'react';
import { Paper, Stack, Avatar, Box, Typography } from '@mui/material';
import { IconMessage } from '@tabler/icons-react';
import { Thread } from '../../types/chat';

interface ThreadHeaderProps {
  thread: Thread | null;
}

const ThreadHeader: React.FC<ThreadHeaderProps> = ({ thread }) => {
  if (!thread) return null;

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderBottom: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
      }}
    >
      <Stack direction="row" alignItems="center" spacing={2}>
        <Avatar sx={{ width: 40, height: 40 }}>
          <IconMessage size={20} />
        </Avatar>
        <Box>
          <Typography variant="h6">{thread.name}</Typography>
          <Typography variant="body2" color="textSecondary">
            {thread.messages.length} messages
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
};

export default ThreadHeader; 