import React from 'react';
import { Box, styled } from '@mui/material';

const ScrollbarRoot = styled(Box)({
  height: '100%',
  overflow: 'auto',
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '&::-webkit-scrollbar-thumb': {
    backgroundColor: '#E5EAEF',
    borderRadius: '8px',
    '&:hover': {
      backgroundColor: '#D5DEE6',
    },
  },
  '&::-webkit-scrollbar-track': {
    backgroundColor: 'transparent',
  },
});

interface Props {
  children?: React.ReactNode;
  sx?: any;
}

const Scrollbar: React.FC<Props> = ({ children, sx = {} }) => {
  return (
    <ScrollbarRoot sx={sx}>
      {children}
    </ScrollbarRoot>
  );
};

export default Scrollbar; 