#!/bin/bash

# DICOM Viewer v3 Setup Script
# Automated setup for Meteor v3 + Cornerstone3D DICOM viewer

set -e

echo "🏥 Setting up DICOM Viewer v3..."

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+ or later."
    exit 1
fi

echo "✅ Node.js version $NODE_VERSION detected"

# Check if Meteor is installed
if ! command -v meteor &> /dev/null; then
    echo "📦 Installing Meteor..."
    curl https://install.meteor.com/ | sh
else
    echo "✅ Meteor is already installed"
fi

# Create project if it doesn't exist
if [ ! -f ".meteor/release" ]; then
    echo "🚀 Creating new Meteor project..."
    meteor create . --release 3.0
fi

# Copy environment template
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "📝 Created .env file from template"
fi

# Install NPM dependencies
echo "📦 Installing dependencies..."
npm install

# Create required directories
echo "📁 Creating directory structure..."
mkdir -p imports/startup/client
mkdir -p imports/startup/server
mkdir -p imports/api/dicom/collections
mkdir -p imports/api/dicom/methods
mkdir -p imports/api/dicom/publications
mkdir -p imports/api/dicom/server
mkdir -p imports/api/dicom/helpers
mkdir -p imports/ui/components/viewer
mkdir -p imports/ui/components/upload
mkdir -p imports/ui/components/tools
mkdir -p imports/ui/hooks
mkdir -p imports/ui/contexts
mkdir -p imports/ui/utils
mkdir -p imports/workers
mkdir -p imports/services/dicom
mkdir -p imports/services/performance
mkdir -p imports/services/storage
mkdir -p public/wasm
mkdir -p public/icons
mkdir -p tests/unit
mkdir -p tests/integration
mkdir -p tests/performance
mkdir -p scripts
mkdir -p docs

echo "🎯 Setting up WebAssembly files..."
# Note: In production, these would be copied from node_modules
echo "// WebAssembly files will be loaded here" > public/wasm/README.md

echo "🔧 Setting up development scripts..."
chmod +x dev.sh
chmod +x build.sh

echo "✅ Setup complete! Run './dev.sh' to start development server."
echo ""
echo "📋 Next steps:"
echo "1. Configure your .env file"
echo "2. Run './dev.sh' to start the development server"
echo "3. Open http://localhost:3000 in your browser"
echo ""
echo "📖 Documentation available in docs/ directory"