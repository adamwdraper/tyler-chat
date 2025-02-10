import { createTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useMemo } from 'react';

// Theme options for light and dark mode
const getDesignTokens = (mode: 'light' | 'dark') => ({
  palette: {
    mode,
    primary: {
      main: '#5D87FF',
      light: mode === 'light' ? '#ECF2FF' : '#4570EA',
      dark: '#4570EA',
    },
    secondary: {
      main: '#49BEFF',
      light: mode === 'light' ? '#E8F7FF' : '#23afdb',
      dark: '#23afdb',
    },
    background: {
      default: mode === 'light' ? '#FFFFFF' : '#0A0A0A',
      paper: mode === 'light' ? '#FFFFFF' : '#1A1A1A',
    },
    text: {
      primary: mode === 'light' ? '#000000' : '#FFFFFF',
      secondary: mode === 'light' ? '#424242' : '#B0B0B0',
    },
  },
  shape: {
    borderRadius: 7,
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    h1: {
      fontWeight: 600,
      fontSize: '2.25rem',
      lineHeight: '2.75rem',
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.875rem',
      lineHeight: '2.25rem',
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: '1.75rem',
    },
    h4: {
      fontWeight: 600,
      fontSize: '1.3125rem',
      lineHeight: '1.6rem',
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.125rem',
      lineHeight: '1.6rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1rem',
      lineHeight: '1.2rem',
    },
    button: {
      textTransform: 'none' as const,
      fontWeight: 400,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 400,
          borderRadius: '7px',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '7px',
          padding: '0',
          background: mode === 'dark' ? '#1A1A1A' : '#FFFFFF',
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          boxShadow: mode === 'dark' 
            ? '0px 0px 15px rgba(0,0,0,0.3)' 
            : '0px 0px 15px rgba(0,0,0,0.1)',
          borderRadius: '7px',
        }
      }
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          boxShadow: mode === 'dark' 
            ? '0px 0px 15px rgba(0,0,0,0.3)' 
            : '0px 0px 15px rgba(0,0,0,0.1)',
          borderRadius: '7px',
        },
        list: {
          padding: '8px',
        }
      }
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderRadius: '7px',
          padding: '10px 12px',
          '&:hover': {
            backgroundColor: mode === 'dark' 
              ? 'rgba(93, 135, 255, 0.15)' 
              : 'rgba(93, 135, 255, 0.05)'
          }
        }
      }
    }
  },
});

export function useTheme() {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  
  return useMemo(
    () => createTheme(getDesignTokens(prefersDarkMode ? 'dark' : 'light')),
    [prefersDarkMode]
  );
}

// For static theme usage (fallback)
export default createTheme(getDesignTokens('light')); 