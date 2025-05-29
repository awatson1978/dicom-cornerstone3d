import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

// Startup imports
import '/imports/startup/server';

// API imports
import '/imports/api/dicom/server';
import '/imports/api/users/methods';
import '/imports/api/users/publications';

Meteor.startup(async function() {
  console.log('🏥 DICOM Viewer v3 Server Starting...');
  
  // Log configuration
  const settings = Meteor.settings;
  console.log('📊 Configuration:');
  console.log(`   - Memory Limit: ${settings.public?.dicom?.memoryLimit || '512MB'}`);
  console.log(`   - Prefetch Strategy: ${settings.public?.dicom?.prefetchStrategy || 'balanced'}`);
  console.log(`   - GPU Acceleration: ${settings.public?.dicom?.enableGPU ? 'enabled' : 'disabled'}`);
  console.log(`   - Worker Count: ${settings.public?.dicom?.workerCount || 4}`);
  console.log(`   - Cache Size: ${settings.public?.cache?.maxSizeMB || 2048}MB`);
  
  // Setup CORS for binary data endpoints
  if (settings.private?.cors?.enable) {
    WebApp.rawConnectHandlers.use('/api/dicom', function(req, res, next) {
      const allowedOrigins = settings.private.cors.origin.split(',');
      const origin = req.headers.origin;
      
      if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
      }
      
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }
      
      next();
    });
  }
  
  console.log('✅ DICOM Viewer v3 Server Ready');
});