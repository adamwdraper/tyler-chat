import { createTheme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';

const baselightTheme = createTheme({
  direction: 'ltr',
  palette: {
    primary: {
      main: '#5D87FF',
      light: '#ECF2FF',
      dark: '#4570EA',
    },
    secondary: {
      main: '#49BEFF',
      light: '#E8F7FF',
      dark: '#23afdb',
    },
    success: {
      main: '#13DEB9',
      light: '#E6FFFA',
      dark: '#02b3a9',
    },
    info: {
      main: '#539BFF',
      light: '#EBF3FE',
      dark: '#1682d4',
    },
    warning: {
      main: '#FFAE1F',
      light: '#FEF5E5',
      dark: '#ae8e59',
    },
    error: {
      main: '#FA896B',
      light: '#FDEDE8',
      dark: '#f3704d',
    },
    grey: {
      100: '#F2F6FA',
      200: '#EAEFF4',
      300: '#DFE5EF',
      400: '#7C8FAC',
      500: '#5A6A85',
      600: '#2A3547',
    },
    text: {
      primary: '#2A3547',
      secondary: '#5A6A85',
    },
    action: {
      disabledBackground: alpha('#5D87FF', 0.3),
      disabled: '#ffffff',
    },
    background: {
      default: '#F6F9FC',
      paper: '#ffffff',
    },
    divider: '#e5eaef',
  },
  typography: {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    h1: {
      fontWeight: 600,
      fontSize: '2.25rem',
      lineHeight: '2.75rem',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.875rem',
      lineHeight: '2.25rem',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: '1.75rem',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
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
      textTransform: 'capitalize',
      fontWeight: 400,
    },
    body1: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: '1.334rem',
    },
    body2: {
      fontSize: '0.75rem',
      letterSpacing: '0rem',
      fontWeight: 400,
      lineHeight: '1rem',
    },
    subtitle1: {
      fontSize: '0.875rem',
      fontWeight: 400,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 400,
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        '*': {
          boxSizing: 'border-box',
        },
        html: {
          height: '100%',
          width: '100%',
        },
        body: {
          height: '100%',
          margin: 0,
          padding: 0,
        },
        '#root': {
          height: '100%',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '7px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '7px',
          padding: '0',
          margin: '0',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: '7px',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '7px',
          '&.Mui-selected': {
            color: '#5D87FF',
            '& .MuiListItemIcon-root': {
              color: '#5D87FF',
            },
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#e5eaef',
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          color: '#ffffff',
          background: '#5D87FF',
        },
      },
    },
  },
});

export default baselightTheme; 