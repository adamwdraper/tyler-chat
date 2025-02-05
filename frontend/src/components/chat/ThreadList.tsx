import React from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  InputAdornment,
  ListItemButton,
  Paper,
} from '@mui/material';
import { IconSearch, IconPlus, IconTrash } from '@tabler/icons-react';
import { Thread } from '../../types/chat';
import { formatTimestamp } from '../../utils/dateUtils';

interface ThreadListProps {
  threads: Thread[];
  currentThread: Thread | null;
  onThreadSelect: (thread: Thread) => void;
  onNewChat: () => void;
  onDeleteThread: (threadId: string, e: React.MouseEvent) => void;
}

const ThreadList: React.FC<ThreadListProps> = ({
  threads,
  currentThread,
  onThreadSelect,
  onNewChat,
  onDeleteThread,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  return (
    <Paper
      sx={{
        width: 280,
        flexShrink: 0,
        borderRight: (theme) => `1px solid ${theme.palette.divider}`,
        backgroundColor: 'background.default',
      }}
      elevation={0}
    >
      <Box p={3} pb={2}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h5">
            Conversations
          </Typography>
          <IconButton
            color="primary"
            onClick={onNewChat}
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

      <Box sx={{ height: 'calc(100vh - 140px)', overflow: 'auto', px: 3 }}>
        {threads.map((thread) => (
          <ListItemButton
            key={thread.id}
            selected={currentThread?.id === thread.id}
            onClick={() => onThreadSelect(thread)}
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
                    onClick={(e) => onDeleteThread(thread.id, e)}
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
  );
};

export default ThreadList; 