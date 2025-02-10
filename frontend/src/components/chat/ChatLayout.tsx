import React, { useState } from 'react';
import { Box, useMediaQuery, useTheme, IconButton, Paper } from '@mui/material';
import { IconMenu2 } from '@tabler/icons-react';
import { Routes, Route } from 'react-router-dom';
import ThreadList from './ThreadList';
import ChatContent from './ChatContent';

const ChatLayout: React.FC = () => {
  const theme = useTheme();
  const lgUp = useMediaQuery(theme.breakpoints.up('lg'));
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        bgcolor: 'background.default',
      }}
    >
      {/* Sidebar for thread list */}
      {lgUp ? (
        <Paper
          elevation={0}
          sx={{
            width: 320,
            flexShrink: 0,
            borderRight: `1px solid ${theme.palette.divider}`,
          }}
        >
          <ThreadList />
        </Paper>
      ) : (
        <Paper
          elevation={0}
          sx={{
            width: 320,
            flexShrink: 0,
            borderRight: `1px solid ${theme.palette.divider}`,
            position: 'fixed',
            left: mobileSidebarOpen ? 0 : -320,
            top: 0,
            height: '100%',
            zIndex: theme.zIndex.drawer,
            transition: theme.transitions.create('left', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.shorter,
            }),
          }}
        >
          <ThreadList showMobileSidebar={toggleMobileSidebar} />
        </Paper>
      )}

      {/* Main chat content */}
      <Box
        sx={{
          flexGrow: 1,
          width: { lg: `calc(100% - 320px)`, xs: '100%' },
          height: '100%',
        }}
      >
        {!lgUp && (
          <Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
            <IconButton onClick={toggleMobileSidebar} size="small">
              <IconMenu2 />
            </IconButton>
          </Box>
        )}
        <Routes>
          <Route path="/" element={<ChatContent />} />
          <Route path="/thread/:threadId" element={<ChatContent />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default ChatLayout; 