import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingSpinnerProps {
  message?: string;
  size?: number;
  fullScreen?: boolean;
  color?: 'primary' | 'secondary' | 'inherit';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  message = 'Loading...',
  size = 40,
  fullScreen = false,
  color = 'primary',
}) => {
  const spinner = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      <CircularProgress size={size} color={color} />
      {message && (
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 9999,
        }}
      >
        {spinner}
      </Box>
    );
  }

  return spinner;
};

// Also create a PageLoader component for full page loads
export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading page...' }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      gap: 3,
    }}
  >
    <CircularProgress size={60} color="primary" />
    <Typography variant="h6" color="text.secondary">
      {message}
    </Typography>
  </Box>
);

// Skeleton loader for content placeholders
export const ContentSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => (
  <Box sx={{ width: '100%' }}>
    {Array.from({ length: count }).map((_, index) => (
      <Box
        key={index}
        sx={{
          animation: 'pulse 1.5s ease-in-out infinite',
          backgroundColor: 'grey.200',
          borderRadius: 1,
          height: 100,
          mb: 2,
          '@keyframes pulse': {
            '0%': { opacity: 0.6 },
            '50%': { opacity: 0.8 },
            '100%': { opacity: 0.6 },
          },
        }}
      />
    ))}
  </Box>
);

export default LoadingSpinner;
