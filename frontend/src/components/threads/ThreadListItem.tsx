import React from 'react';
import { ListItemText, ListItemButton, Typography, Stack, Avatar } from '@mui/material';
import { formatDistanceToNowStrict } from 'date-fns';
import { Thread } from '../../types';

interface Props {
  thread: Thread;
  isSelected: boolean;
  onClick: () => void;
}

const ThreadListItem = ({ thread, isSelected, onClick }: Props) => {
  const lastMessage = thread.messages[thread.messages.length - 1];

  return (
    <ListItemButton sx={{ mb: 1, py: 2 }} selected={isSelected} onClick={onClick}>
      <Stack direction="row" spacing={2} width="100%">
        <Avatar src={thread.avatar} alt={thread.name} />
        <ListItemText>
          <Typography variant="subtitle2" fontWeight={600}>
            {thread.name}
          </Typography>
          <Typography variant="body2" color="textSecondary" noWrap>
            {lastMessage?.content}
          </Typography>
          <Typography variant="caption" color="textSecondary">
            {lastMessage ? formatDistanceToNowStrict(new Date(lastMessage.timestamp), { addSuffix: true }) : ''}
          </Typography>
        </ListItemText>
      </Stack>
    </ListItemButton>
  );
};

export default ThreadListItem; 