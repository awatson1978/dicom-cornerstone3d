import { Meteor } from 'meteor/meteor';

console.log('🔍 [DEBUG] Step 2: Testing startup imports...');

// Step 2: Add back startup imports one at a time
try {
  console.log('🔍 [DEBUG] Importing startup/client...');
  import('/imports/startup/client').then(function() {
    console.log('🔍 [DEBUG] ✅ startup/client imported successfully');
  }).catch(function(error) {
    console.error('🔍 [DEBUG] ❌ startup/client import failed:', error);
  });
} catch (error) {
  console.error('🔍 [DEBUG] ❌ startup/client sync import failed:', error);
}

// STILL COMMENTED OUT:
// import App from '/imports/ui/App';

console.log('🔍 [DEBUG] About to test React imports...');

try {
  const React = require('react');
  console.log('🔍 [DEBUG] React import successful:', typeof React);
  
  const ReactDOM = require('react-dom/client');
  console.log('🔍 [DEBUG] ReactDOM import successful:', typeof ReactDOM);
} catch (error) {
  console.error('🔍 [DEBUG] React import failed:', error);
}

Meteor.startup(function() {
  console.log('🔍 [DEBUG] Meteor.startup callback executing...');
  
  // Simple test render
  const container = document.getElementById('react-target');
  if (container) {
    console.log('🔍 [DEBUG] React target container found');
    container.innerHTML = `
      <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #1e1e1e; color: white; text-align: center;">
        <div>
          <h2>🔍 DEBUG MODE - Step 2</h2>
          <p>Testing startup imports</p>
          <p>Check console for import results</p>
          <p style="font-size: 12px;">Looking for startup import success/failure</p>
        </div>
      </div>
    `;
    console.log('🔍 [DEBUG] Step 2 HTML rendered successfully');
  }
});