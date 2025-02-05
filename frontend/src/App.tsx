import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme';
import Threads from './views/threads/Threads';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Threads />
    </ThemeProvider>
  );
}

export default App; 