import React from 'react';
import { createRoot } from 'react-dom/client';
import { Meteor } from 'meteor/meteor';

// Startup imports
import '/imports/startup/client';

// Main App component
import App from '/imports/ui/App';

Meteor.startup(function() {
  console.log('🏥 DICOM Viewer v3 Client Starting...');
  
  // Log client configuration
  const settings = Meteor.settings.public || {};
  console.log('📊 Client Configuration:');
  console.log(`   - App: ${settings.appName || 'DICOM Viewer v3'} v${settings.version || '1.0.0'}`);
  console.log(`   - Memory Limit: ${settings.dicom?.memoryLimit || '512MB'}`);
  console.log(`   - GPU Acceleration: ${settings.dicom?.enableGPU ? 'enabled' : 'disabled'}`);
  console.log(`   - Performance Monitoring: ${settings.performance?.enableMonitoring ? 'enabled' : 'disabled'}`);
  
  // Mount React app
  const container = document.getElementById('react-target');
  if (container) {
    const root = createRoot(container);
    root.render(<App />);
    console.log('✅ DICOM Viewer v3 Client Ready');
  } else {
    console.error('❌ React mount point not found');
  }
});