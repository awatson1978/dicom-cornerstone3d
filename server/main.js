import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';

console.log('🔍 [SERVER DEBUG] Step 1: Basic Meteor server imports successful');
console.log('🔍 [SERVER DEBUG] Meteor object:', typeof Meteor);
console.log('🔍 [SERVER DEBUG] WebApp object:', typeof WebApp);
console.log('🔍 [SERVER DEBUG] Meteor.isServer:', Meteor.isServer);

// Step 1: Comment out ALL application imports to test basic Meteor functionality
// COMMENTED OUT FOR DEBUGGING:
// import '/imports/startup/server';
// import '/imports/api/dicom/server';
// import '/imports/api/users/methods';
// import '/imports/api/users/publications';

console.log('🔍 [SERVER DEBUG] Testing Mongo import...');
try {
  const { Mongo } = require('meteor/mongo');
  console.log('🔍 [SERVER DEBUG] Mongo import successful:', typeof Mongo);
  console.log('🔍 [SERVER DEBUG] Mongo.Collection available:', typeof Mongo.Collection);
} catch (error) {
  console.error('🔍 [SERVER DEBUG] Mongo import failed:', error);
}

console.log('🔍 [SERVER DEBUG] Testing basic Node modules...');
try {
  const lodash = require('lodash');
  console.log('🔍 [SERVER DEBUG] Lodash available:', typeof lodash.get);
} catch (error) {
  console.error('🔍 [SERVER DEBUG] Lodash import failed:', error);
}

Meteor.startup(async function() {
  console.log('🔍 [SERVER DEBUG] Meteor.startup callback executing...');
  console.log('🔍 [SERVER DEBUG] Server startup successful');
  
  // Test basic Meteor.settings access
  const settings = Meteor.settings;
  console.log('🔍 [SERVER DEBUG] Settings available:', !!settings);
  console.log('🔍 [SERVER DEBUG] Settings.public:', !!settings?.public);
  console.log('🔍 [SERVER DEBUG] Settings.private:', !!settings?.private);
  
  // Test basic WebApp functionality
  console.log('🔍 [SERVER DEBUG] Setting up test HTTP route...');
  WebApp.connectHandlers.use('/debug', function(req, res, next) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'Server debug mode active',
      timestamp: new Date().toISOString(),
      meteor: 'working'
    }));
  });
  
  console.log('🔍 [SERVER DEBUG] Test route available at /debug');
  console.log('✅ [SERVER DEBUG] Basic server functionality confirmed');
});