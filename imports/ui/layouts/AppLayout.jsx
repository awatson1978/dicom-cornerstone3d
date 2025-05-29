import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  Home as HomeIcon,
  CloudUpload as UploadIcon,
  ViewList as StudiesIcon,
  Settings as SettingsIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

// Pages
import StudyList from '/imports/ui/pages/StudyList';
import Viewer from '/imports/ui/pages/Viewer';
import Settings from '/imports/ui/pages/Settings';

// Components
import { DicomUploader } from '/imports/ui/components/upload/DicomUploader';

// Hooks
import { useDicom } from '/imports/ui/contexts/DicomContext';
import { usePerformance } from '/imports/ui/hooks/usePerformance';

/**
 * Main application layout with navigation
 */
export default function AppLayout({ onToggleTheme, onShowNotification, isDarkMode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('studies');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  
  const { hasStudies, currentStudy, uploadProgress } = useDicom();
  const { metrics } = usePerformance();
  
  /**
   * Handle drawer toggle
   */
  function handleDrawerToggle() {
    setDrawerOpen(!drawerOpen);
  }
  
  /**
   * Handle navigation
   */
  function handleNavigation(page) {
    setCurrentPage(page);
    setDrawerOpen(false);
  }
  
  /**
   * Handle upload dialog
   */
  function handleUploadOpen() {
    setUploadDialogOpen(true);
  }
  
  function handleUploadClose() {
    setUploadDialogOpen(false);
  }
  
  /**
   * Navigation items
   */
  const navigationItems = [
    {
      id: 'studies',
      label: 'Study List',
      icon: <StudiesIcon />,
      badge: hasStudies ? null : 0,
    },
    {
      id: 'upload',
      label: 'Upload Files',
      icon: <UploadIcon />,
      action: handleUploadOpen,
      badge: uploadProgress ? uploadProgress.percentage : null,
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: <SettingsIcon />,
    },
  ];
  
  /**
   * Render current page
   */
  function renderCurrentPage() {
    switch (currentPage) {
      case 'studies':
        return <StudyList onStudySelect={function(study) { setCurrentPage('viewer'); }} />;
        
      case 'viewer':
        return currentStudy ? <Viewer /> : <StudyList onStudySelect={function(study) { setCurrentPage('viewer'); }} />;
        
      case 'settings':
        return <Settings />;
        
      default:
        return <StudyList onStudySelect={function(study) { setCurrentPage('viewer'); }} />;
    }
  }
  
  /**
   * Get page title
   */
  function getPageTitle() {
    switch (currentPage) {
      case 'studies':
        return 'Study List';
      case 'viewer':
        return currentStudy ? `${currentStudy.patientName} - ${currentStudy.studyDescription}` : 'Viewer';
      case 'settings':
        return 'Settings';
      default:
        return 'DICOM Viewer';
    }
  }
  
  /**
   * Drawer content
   */
  const drawerContent = (
    <Box sx={{ width: 280 }}>
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="h6" component="div">
          🏥 DICOM Viewer v3
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Medical Imaging Platform
        </Typography>
      </Box>
      
      <Divider />
      
      <List>
        {navigationItems.map(function(item) {
          const handleClick = item.action || function() { handleNavigation(item.id); };
          
          return (
            <ListItem
              key={item.id}
              button
              onClick={handleClick}
              selected={currentPage === item.id && !item.action}
            >
              <ListItemIcon>
                {item.badge !== null ? (
                  <Badge badgeContent={item.badge} color="primary">
                    {item.icon}
                  </Badge>
                ) : (
                  item.icon
                )}
              </ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItem>
          );
        })}
      </List>
      
      <Divider />
      
      {/* Performance Info */}
      {metrics && (
        <Box sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary" display="block">
            Performance
          </Typography>
          <Typography variant="body2">
            Memory: {Math.round(metrics.memoryUsage?.used / 1024 / 1024 || 0)}MB
          </Typography>
          <Typography variant="body2">
            Cache: {Math.round(metrics.cacheSize / 1024 / 1024 || 0)}MB
          </Typography>
        </Box>
      )}
    </Box>
  );
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {getPageTitle()}
          </Typography>
          
          {/* Upload Progress */}
          {uploadProgress && (
            <Box sx={{ mr: 2 }}>
              <Typography variant="body2">
                Uploading... {uploadProgress.percentage}%
              </Typography>
            </Box>
          )}
          
          {/* Theme Toggle */}
          <Tooltip title={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}>
            <IconButton color="inherit" onClick={onToggleTheme}>
              {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>
        </Toolbar>
      </AppBar>
      
      {/* Navigation Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
      >
        {drawerContent}
      </Drawer>
      
      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: 8, // Account for AppBar height
          overflow: 'hidden',
        }}
      >
        {renderCurrentPage()}
      </Box>
      
      {/* Upload Dialog */}
      <DicomUploader
        open={uploadDialogOpen}
        onClose={handleUploadClose}
        onUploadComplete={function(result) {
          handleUploadClose();
          if (result.success) {
            onShowNotification(`Successfully uploaded ${result.uploadedCount} files`, 'success');
            if (currentPage !== 'studies') {
              setCurrentPage('studies');
            }
          } else {
            onShowNotification(`Upload failed: ${result.error}`, 'error');
          }
        }}
      />
    </Box>
  );
}