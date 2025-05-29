import React, { useState, useEffect } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box, Snackbar, Alert } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';

// Context providers
import { DicomProvider } from '/imports/ui/contexts/DicomContext';
import { ViewerProvider } from '/imports/ui/contexts/ViewerContext';
import { CacheProvider } from '/imports/ui/contexts/CacheContext';
import { PerformanceProvider } from '/imports/ui/contexts/PerformanceContext';

// Components
import AppLayout from './AppLayout';
import { Loading } from '/imports/ui/components/common/Loading';

// Hooks
import { useCornerstone } from '/imports/ui/hooks/useCornerstone';

/**
 * Error fallback component for React Error Boundary
 */
function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="#1e1e1e"
      color="white"
      p={3}
      textAlign="center"
    >
      <Box fontSize={48} mb={2}>⚠️</Box>
      <Box fontSize={24} mb={2}>Something went wrong</Box>
      <Box fontSize={16} mb={3} maxWidth={600}>
        {error.message}
      </Box>
      <Box>
        <button 
          onClick={resetErrorBoundary}
          style={{
            padding: '12px 24px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          Try Again
        </button>
      </Box>
    </Box>
  );
}

/**
 * Main application theme for medical imaging
 */
const createAppTheme = function(mode = 'dark') {
  return createTheme({
    palette: {
      mode,
      primary: {
        main: '#1976d2',
      },
      secondary: {
        main: '#dc004e',
      },
      background: {
        default: mode === 'dark' ? '#121212' : '#fafafa',
        paper: mode === 'dark' ? '#1e1e1e' : '#ffffff',
      },
      // Medical imaging specific colors
      medical: {
        bone: '#F4F4F4',
        soft: '#808080',
        lung: '#000000',
        blood: '#FF0000',
        contrast: '#00FF00',
      },
    },
    typography: {
      fontFamily: '"Roboto", "Arial", sans-serif',
      // Medical text needs to be highly readable
      body1: {
        fontSize: '0.95rem',
        lineHeight: 1.5,
      },
      caption: {
        fontSize: '0.8rem',
        lineHeight: 1.2,
      },
    },
    components: {
      // Optimize components for medical imaging interface
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none', // Medical terms shouldn't be uppercase
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            fontSize: '0.85rem',
            maxWidth: 300,
          },
        },
      },
    },
  });
};

/**
 * App initialization wrapper
 */
function AppInitializer({ children }) {
  const [cornerstone3DReady, setCornerstone3DReady] = useState(false);
  const [initError, setInitError] = useState(null);
  
  const { isInitialized, error, initialize } = useCornerstone();
  
  useEffect(function() {
    async function init() {
      try {
        await initialize();
        setCornerstone3DReady(true);
      } catch (err) {
        console.error('Failed to initialize Cornerstone3D:', err);
        setInitError(err.message);
      }
    }
    
    init();
  }, [initialize]);
  
  if (initError) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        bgcolor="#1e1e1e"
        color="white"
        p={3}
        textAlign="center"
      >
        <Box fontSize={48} mb={2}>🏥</Box>
        <Box fontSize={24} mb={2}>DICOM Viewer Initialization Failed</Box>
        <Box fontSize={16} mb={3} maxWidth={600}>
          {initError}
        </Box>
        <Box fontSize={14} opacity={0.7}>
          This may be due to browser compatibility issues or missing WebAssembly support.
        </Box>
      </Box>
    );
  }
  
  if (!cornerstone3DReady) {
    return <Loading message="Initializing medical imaging engine..." />;
  }
  
  return children;
}

/**
 * Main App component
 */
export default function App() {
  const [theme, setTheme] = useState(createAppTheme('dark'));
  const [notification, setNotification] = useState(null);
  
  // Handle theme switching
  const toggleTheme = function() {
    setTheme(prevTheme => 
      createAppTheme(prevTheme.palette.mode === 'dark' ? 'light' : 'dark')
    );
  };
  
  // Handle global notifications
  const showNotification = function(message, severity = 'info') {
    setNotification({ message, severity });
  };
  
  const closeNotification = function() {
    setNotification(null);
  };
  
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={function(error, errorInfo) {
        console.error('React Error Boundary caught an error:', error, errorInfo);
      }}
    >
      <ThemeProvider theme={theme}>
        <CssBaseline />
        
        <PerformanceProvider>
          <CacheProvider>
            <DicomProvider>
              <ViewerProvider>
                <AppInitializer>
                  <AppLayout 
                    onToggleTheme={toggleTheme}
                    onShowNotification={showNotification}
                    isDarkMode={theme.palette.mode === 'dark'}
                  />
                </AppInitializer>
              </ViewerProvider>
            </DicomProvider>
          </CacheProvider>
        </PerformanceProvider>
        
        {/* Global notification snackbar */}
        <Snackbar
          open={!!notification}
          autoHideDuration={6000}
          onClose={closeNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          {notification && (
            <Alert 
              onClose={closeNotification} 
              severity={notification.severity}
              variant="filled"
            >
              {notification.message}
            </Alert>
          )}
        </Snackbar>
      </ThemeProvider>
    </ErrorBoundary>
  );
}