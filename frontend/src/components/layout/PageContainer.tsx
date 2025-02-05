import React from 'react';
import { Box } from '@mui/material';

interface PageContainerProps {
  children: React.ReactNode;
}

const PageContainer: React.FC<PageContainerProps> = ({ children }) => {
  return (
    <Box
      sx={{
        height: '100vh',
        backgroundColor: 'background.default',
      }}
    >
      {children}
    </Box>
  );
};

export default PageContainer; 