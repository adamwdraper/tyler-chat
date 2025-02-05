import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import baselightTheme from './theme/theme';
import TylerChat from './components/TylerChat';
import PageContainer from './components/layout/PageContainer';

function App() {
  return (
    <ThemeProvider theme={baselightTheme}>
      <CssBaseline />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <PageContainer>
          <Routes>
            <Route path="/" element={<TylerChat />} />
          </Routes>
        </PageContainer>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App; 