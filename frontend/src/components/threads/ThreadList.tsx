import React, { useEffect, useState } from 'react';
import { List, Box, TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ThreadListItem from './ThreadListItem';
import { Thread } from '../../types';

interface Props {
  selectedThreadId: string | null;
  onThreadSelect: (threadId: string) => void;
}

const ThreadList = ({ selectedThreadId, onThreadSelect }: Props) => {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetch('/api/threads')
      .then((response) => response.json())
      .then((data) => setThreads(data));
  }, []);

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Search Box */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search threads..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Thread List */}
      <List sx={{ flex: 1, overflow: 'auto', px: 2 }}>
        {threads.map((thread) => (
          <ThreadListItem
            key={thread.id}
            thread={thread}
            isSelected={thread.id === selectedThreadId}
            onClick={() => onThreadSelect(thread.id)}
          />
        ))}
      </List>
    </Box>
  );
};

export default ThreadList; 