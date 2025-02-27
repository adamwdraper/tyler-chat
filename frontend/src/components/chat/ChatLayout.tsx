import React, { useState, useEffect } from 'react';
import { Box, useMediaQuery, useTheme, IconButton, Paper, Typography, Tooltip } from '@mui/material';
import { IconMenu2, IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { Routes, Route } from 'react-router-dom';
import ThreadList from './ThreadList';
import ChatContent from './ChatContent';
import { TYLER_COMPATIBLE_VERSION, TYLER_CHAT_VERSION, fetchVersionInfo, VersionInfo } from '@/utils/version';

const ChatLayout: React.FC = () => {
  const theme = useTheme();
  const lgUp = useMediaQuery(theme.breakpoints.up('lg'));
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getVersionInfo = async () => {
      try {
        const info = await fetchVersionInfo();
        setVersionInfo(info);
      } catch (error) {
        console.error('Error fetching version info:', error);
      } finally {
        setLoading(false);
      }
    };

    getVersionInfo();
  }, []);

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  // Component for the version display
  const VersionInfoDisplay = () => {
    // Use backend version info if available, otherwise use local constants
    const chatVersion = versionInfo?.tyler_chat_version || TYLER_CHAT_VERSION;
    const tylerVersion = versionInfo?.expected_tyler_version || TYLER_COMPATIBLE_VERSION;
    const installedVersion = versionInfo?.installed_tyler_version;
    const isCompatible = versionInfo?.is_compatible;

    // For debugging
    console.log('Version info:', {
      versionInfo,
      chatVersion,
      tylerVersion,
      TYLER_CHAT_VERSION,
      TYLER_COMPATIBLE_VERSION
    });

    return (
      <Box 
        sx={{ 
          p: 1, 
          borderTop: `1px solid ${theme.palette.divider}`,
          textAlign: 'center',
          fontSize: '0.75rem',
          color: 'text.secondary',
          backgroundColor: theme.palette.background.paper,
          width: '100%',
          position: 'absolute',
          bottom: 0,
          left: 0,
          zIndex: 1
        }}
      >
        <Typography variant="caption" display="block">
          Tyler Chat v{chatVersion}
        </Typography>
        <Tooltip title={
          installedVersion 
            ? `Installed Tyler version: ${installedVersion}` 
            : "Could not detect installed Tyler version"
        }>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="caption" sx={{ mr: 0.5 }}>
              Compatible with Tyler v{tylerVersion}
            </Typography>
            {loading ? null : (
              isCompatible 
                ? <IconCheck size={14} color={theme.palette.success.main} /> 
                : <IconAlertCircle size={14} color={theme.palette.warning.main} />
            )}
          </Box>
        </Tooltip>
      </Box>
    );
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
            height: '100%',
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 0
          }}
        >
          <Box sx={{ 
            height: 'calc(100% - 60px)', // Reserve space for version info
            overflow: 'auto'
          }}>
            <ThreadList />
          </Box>
          <VersionInfoDisplay />
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
            overflow: 'hidden',
            borderRadius: 0
          }}
        >
          <Box sx={{ 
            height: 'calc(100% - 60px)', // Reserve space for version info
            overflow: 'auto'
          }}>
            <ThreadList showMobileSidebar={toggleMobileSidebar} />
          </Box>
          <VersionInfoDisplay />
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