#!/bin/bash

# Development startup script for DICOM Viewer v3

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Default values
PORT=${PORT:-3000}
MONGO_URL=${MONGO_URL:-"mongodb://localhost:27017/dicomviewer"}

echo "🏥 Starting DICOM Viewer v3 Development Server..."
echo "📍 Port: $PORT"
echo "🗄️  Database: $MONGO_URL"
echo "🎯 Performance Mode: ${DICOM_PREFETCH_STRATEGY:-balanced}"
echo ""

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB doesn't appear to be running."
    echo "   Please start MongoDB first."
    echo ""
    echo "   macOS (Homebrew): brew services start mongodb-community"
    echo "   Ubuntu/Debian: sudo systemctl start mongod"
    echo "   Docker: docker run -d -p 27017:27017 mongo:latest"
    echo ""
fi

# Start Meteor with development settings
METEOR_SETTINGS='{
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
      "benchmarkMode": '${BENCHMARK_MODE:-false}'
    }
  },
  "private": {
    "cors": {
      "enable": '${ENABLE_CORS:-true}',
      "origin": "'${CORS_ORIGIN:-http://localhost:3000,http://localhost:4000}'"
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
    "debug": {
      "dicomParsing": '${DEBUG_DICOM_PARSING:-false}',
      "cacheOperations": '${DEBUG_CACHE_OPERATIONS:-false}',
      "performance": '${DEBUG_PERFORMANCE:-false}',
      "streaming": '${DEBUG_STREAMING:-false}'
    }
  }
}' meteor run --port $PORT

echo ""
echo "🚀 Development server started!"
echo "🌐 Open http://localhost:$PORT in your browser"