import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Loading component for application initialization and data loading
 */
export function Loading({ message = 'Loading...', size = 'large' }) {
  const circularSize = size === 'large' ? 60 : size === 'medium' ? 40 : 24;
  
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
      bgcolor="background.default"
      color="text.primary"
      p={3}
      textAlign="center"
    >
      <Box mb={3}>
        <Box fontSize={48} mb={2}>🏥</Box>
        <Typography variant="h5" component="div" gutterBottom>
          DICOM Viewer v3
        </Typography>
      </Box>
      
      <CircularProgress size={circularSize} sx={{ mb: 2 }} />
      
      <Typography variant="body1" color="text.secondary">
        {message}
      </Typography>
    </Box>
  );
}