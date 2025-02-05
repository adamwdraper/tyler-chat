import React from 'react';
import ReactDOM from 'react-dom/client';
import { CssBaseline, GlobalStyles } from '@mui/material';
import App from './App';

const globalStyles = {
  'html, body, #root': {
    height: '100%',
    margin: 0,
    padding: 0,
    overflow: 'hidden'
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CssBaseline />
    <GlobalStyles styles={globalStyles} />
    <App />
  </React.StrictMode>
); 