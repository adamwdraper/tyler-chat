import React from 'react';
import { Paper } from '@mui/material';

interface Props {
  children: React.ReactNode;
}

const AppCard = ({ children }: Props) => {
  return (
    <Paper
      elevation={1}
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {children}
    </Paper>
  );
};

export default AppCard; 