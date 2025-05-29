import { Meteor } from 'meteor/meteor';

// Initialize Cornerstone3D
import { initializeCornerstone3D } from './cornerstone3d-setup';

// Initialize memory management
import './memory-manager';

// Initialize IndexedDB
import './indexeddb-setup';

// Initialize service worker for PWA features
import './service-worker-setup';

/**
 * Client startup initialization
 * Runs after Meteor client is ready
 */
Meteor.startup(async function() {
  console.log('🚀 Client startup sequence beginning...');
  
  try {
    // Initialize Cornerstone3D first (required for DICOM viewing)
    const cornerstone3DReady = await initializeCornerstone3D();
    
    if (!cornerstone3DReady) {
      console.error('❌ Failed to initialize Cornerstone3D - DICOM viewing will not work');
      // Could show user notification here
    }
    
    // Other initialization tasks can continue even if Cornerstone3D fails
    console.log('✅ Client startup sequence completed');
    
  } catch (error) {
    console.error('❌ Error during client startup:', error);
  }
});