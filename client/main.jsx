import { Meteor } from 'meteor/meteor';
import React from 'react';
import { createRoot } from 'react-dom/client';

console.log('🔍 [DEBUG] Step 4: Re-enabling startup imports gradually...');

// Step 4: Try adding back the startup import
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
const TestApp = function() {
  return React.createElement('div', {
    style: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: '#1e1e1e',
      color: 'white',
      textAlign: 'center',
      fontFamily: 'sans-serif'
    }
  }, [
    React.createElement('div', { key: 'content' }, [
      React.createElement('div', { 
        key: 'icon',
        style: { fontSize: '48px', marginBottom: '16px' }
      }, '🏥'),
      React.createElement('h2', { 
        key: 'title',
        style: { margin: '0 0 8px 0' }
      }, 'DICOM Viewer v3'),
      React.createElement('p', { 
        key: 'subtitle',
        style: { 
          margin: '0 0 16px 0', 
          opacity: 0.7, 
          fontSize: '14px' 
        }
      }, 'Medical Imaging Platform'),
      React.createElement('p', { 
        key: 'status',
        style: { 
          margin: '0',
          fontSize: '12px',
          opacity: 0.5
        }
      }, 'Step 4: Testing startup imports ⚡')
    ])
  ]);
};

Meteor.startup(function() {
  console.log('🔍 [DEBUG] Meteor.startup callback executing...');
  
  const container = document.getElementById('react-target');
  if (container) {
    console.log('🔍 [DEBUG] React target container found');
    
    // Clear any existing content
    container.innerHTML = '';
    
    // Create React root and render
    const root = createRoot(container);
    root.render(React.createElement(TestApp));
    
    console.log('✅ [DEBUG] Step 4: React app rendered, testing startup imports');
  } else {
    console.error('❌ [DEBUG] React target container not found');
  }
});