#!/usr/bin/env node

/**
 * Create placeholder icons for the DICOM viewer
 * This prevents the 404 errors during development
 */

const fs = require('fs');
const path = require('path');

// Create public/icons directory if it doesn't exist
const iconsDir = path.join(process.cwd(), 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

/**
 * Create a simple PNG placeholder
 * This is a minimal 1x1 transparent PNG in base64
 */
const create1x1PNG = function() {
  // Minimal 1x1 transparent PNG
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64'
  );
};

/**
 * Create a simple colored PNG for a given size
 * This creates a basic medical cross icon
 */
function createMedicalIcon(size) {
  // For now, just create the same 1x1 transparent PNG
  // In a real app, you'd generate proper icons
  return create1x1PNG();
}

// Create all the required icon sizes
const iconSizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
];

iconSizes.forEach(function(icon) {
  const iconPath = path.join(iconsDir, icon.name);
  const iconData = createMedicalIcon(icon.size);
  
  fs.writeFileSync(iconPath, iconData);
  console.log(`✅ Created ${icon.name} (${icon.size}x${icon.size})`);
});

console.log('🎨 All placeholder icons created successfully!');
console.log('📁 Icons location:', iconsDir);