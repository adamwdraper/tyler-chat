import React from 'react';
import { Box } from '@mui/material';

interface Props {
  children: React.ReactNode;
}

const PageContainer = ({ children }: Props) => {
  return (
    <Box sx={{ height: '100vh', width: '100vw' }}>
      {children}
    </Box>
  );
};

export default PageContainer; 