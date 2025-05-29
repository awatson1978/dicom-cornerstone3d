#!/bin/bash

# Production build script for DICOM Viewer v3

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

echo "🏗️ Building DICOM Viewer v3 for production..."

# Create output directory
OUTPUT_DIR="../output"
mkdir -p $OUTPUT_DIR

# Set production environment
export NODE_ENV="production"

# Production Meteor settings
PRODUCTION_SETTINGS='{
  "public": {
    "appName": "'${APP_NAME:-DICOM Viewer v3}'",
    "version": "'${APP_VERSION:-1.0.0}'",
    "dicom": {
      "memoryLimit": "'${DICOM_MEMORY_LIMIT:-512MB}'",
      "prefetchStrategy": "'${DICOM_PREFETCH_STRATEGY:-balanced}'",
      "enableGPU": '${DICOM_ENABLE_GPU:-true}',
      "workerCount": '${DICOM_WORKER_COUNT:-4}',
      "concurrentRequests": '${DICOM_CONCURRENT_REQUESTS:-6}'
    },
    "cache": {
      "maxSizeMB": '${CACHE_MAX_SIZE_MB:-2048}',
      "ttlHours": '${CACHE_TTL_HOURS:-168}'
    },
    "performance": {
      "enableMonitoring": '${ENABLE_PERFORMANCE_MONITORING:-true}',
      "benchmarkMode": false
    }
  },
  "private": {
    "cors": {
      "enable": '${ENABLE_CORS:-true}',
      "origin": "'${CORS_ORIGIN:-*}'"
    },
    "upload": {
      "maxSizeMB": '${MAX_UPLOAD_SIZE_MB:-100}'
    },
    "security": {
      "rateLimitPerMinute": '${RATE_LIMIT_REQUESTS_PER_MINUTE:-60}'
    },
    "database": {
      "cleanupIntervalHours": '${DB_CLEANUP_INTERVAL_HOURS:-6}',
      "maxStudiesPerUser": '${DB_MAX_STUDIES_PER_USER:-50}'
    },
    "ssl": {
      "certPath": "'${SSL_CERT_PATH:-}'",
      "keyPath": "'${SSL_KEY_PATH:-}'"
    },
    "cdn": {
      "url": "'${CDN_URL:-}'"
    }
  }
}'

echo "📦 Building with production settings..."

# Build for Linux (common deployment target)
METEOR_SETTINGS="$PRODUCTION_SETTINGS" meteor build $OUTPUT_DIR \
  --server-only \
  --architecture os.linux.x86_64

echo "🎯 Build completed!"
echo ""
echo "📋 Build artifacts:"
echo "   - Location: $OUTPUT_DIR"
echo "   - Bundle: dicom-viewer-v3.tar.gz"
echo ""
echo "🚀 Deployment commands:"
echo "   cd $OUTPUT_DIR"
echo "   tar -zxf dicom-viewer-v3.tar.gz"
echo "   cd bundle/programs/server"
echo "   npm install --production"
echo ""
echo "🔧 Environment variables needed in production:"
echo "   export ROOT_URL='https://your-domain.com'"
echo "   export MONGO_URL='mongodb://localhost:27017/dicomviewer'"
echo "   export PORT=3000"
echo "   export NODE_ENV=production"
echo ""
echo "▶️ Start production server:"
echo "   node main.js"