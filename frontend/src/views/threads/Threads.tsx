import React, { useState } from 'react';
import { Box, Drawer, useMediaQuery, Theme } from '@mui/material';
import ThreadList from '../../components/threads/ThreadList';
import ThreadContent from '../../components/threads/ThreadContent';
import PageContainer from '../../components/shared/PageContainer';

const drawerWidth = 340;

const Threads = () => {
  const [isRightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const mdUp = useMediaQuery((theme: Theme) => theme.breakpoints.up('md'));

  const handleThreadSelect = (threadId: string) => {
    setSelectedThreadId(threadId);
    setRightSidebarOpen(true);
  };

  return (
    <PageContainer>
      <Box
        sx={{
          display: 'flex',
          height: '100%',
          bgcolor: 'background.default'
        }}
      >
        {/* Thread List */}
        <Box
          sx={{
            minWidth: drawerWidth,
            width: { xs: '100%', md: drawerWidth, lg: drawerWidth },
            flexShrink: 0,
            borderRight: '1px solid',
            borderColor: 'divider',
          }}
        >
          <ThreadList 
            selectedThreadId={selectedThreadId}
            onThreadSelect={handleThreadSelect}
          />
        </Box>

        {/* Thread Content */}
        {mdUp ? (
          <Box sx={{ flex: 1 }}>
            <ThreadContent threadId={selectedThreadId} />
          </Box>
        ) : (
          <Drawer
            anchor="right"
            open={isRightSidebarOpen}
            onClose={() => setRightSidebarOpen(false)}
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: { width: '85%' },
            }}
            variant="temporary"
          >
            <ThreadContent threadId={selectedThreadId} />
          </Drawer>
        )}
      </Box>
    </PageContainer>
  );
};

export default Threads; 