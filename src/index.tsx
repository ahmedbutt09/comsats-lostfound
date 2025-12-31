import * as React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import '@fontsource/inter/300.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';

// Create theme with COMSATS colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#003366', // COMSATS Blue
    },
    secondary: {
      main: '#FF6600', // COMSATS Orange
    },
    background: {
      default: '#F5F5F5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#F5F5F5',
        },
      },
    },
  },
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// Error Boundary for better error handling
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ color: '#003366', marginBottom: '20px' }}>
            Something went wrong
          </h1>
          <p style={{ marginBottom: '20px' }}>
            The application encountered an error. Please refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#003366',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Performance monitoring initialization
const initPerformanceMonitoring = () => {
  if (process.env.NODE_ENV === 'production') {
    // You can add Supabase Analytics or other monitoring here
    console.log('Performance monitoring initialized');
  }
};

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Initialize performance monitoring
initPerformanceMonitoring();

// Register service worker for PWA (Progressive Web App)
const registerServiceWorker = () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    window.addEventListener('load', () => {
      const swUrl = `${process.env.PUBLIC_URL}/service-worker.js`;
      
      navigator.serviceWorker
        .register(swUrl)
        .then(registration => {
          console.log('Service Worker registered successfully:', registration.scope);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.addEventListener('statechange', () => {
                if (installingWorker.state === 'installed' && 
                    navigator.serviceWorker.controller) {
                  console.log('New content is available; please refresh.');
                  // You could show a "Update available" notification here
                }
              });
            }
          });
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
};

// Unregister old service workers
const unregisterOldServiceWorkers = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        // Unregister service workers from different scopes
        if (registration.scope !== window.location.origin + '/') {
          await registration.unregister();
          console.log('Unregistered old service worker:', registration.scope);
        }
      }
    } catch (error) {
      console.error('Error unregistering old service workers:', error);
    }
  }
};

// Initialize service workers
const initializeServiceWorkers = async () => {
  await unregisterOldServiceWorkers();
  registerServiceWorker();
};

// Initialize service workers on page load
// Comment these out!
// if (document.readyState === 'loading') {
//   document.addEventListener('DOMContentLoaded', initializeServiceWorkers);
// } else {
//   initializeServiceWorkers();
// }

// Optional: Add offline detection
const setupOfflineDetection = () => {
  const updateOnlineStatus = () => {
    if (!navigator.onLine) {
      console.warn('Application is offline');
      // You could show an offline notification here
    } else {
      console.log('Application is online');
    }
  };

  window.addEventListener('online', updateOnlineStatus);
  window.addEventListener('offline', updateOnlineStatus);
  
  // Initial check
  updateOnlineStatus();
};

setupOfflineDetection();

// Report web vitals
if (process.env.NODE_ENV === 'development') {
  reportWebVitals(console.log);
} else {
  // In production, you might want to send to analytics service
  reportWebVitals();
}
