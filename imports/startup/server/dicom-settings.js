import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

/**
 * DICOM-specific server configuration
 * Environment variables are processed and attached to Meteor.settings
 */

Meteor.startup(function() {
  console.log('⚙️ Configuring DICOM settings...');
  
  // Process environment variables
  const settings = Meteor.settings || {};
  const publicSettings = settings.public || {};
  const privateSettings = settings.private || {};
  
  // DICOM configuration with environment variable fallbacks
  const dicomConfig = {
    memoryLimit: process.env.DICOM_MEMORY_LIMIT || get(publicSettings, 'dicom.memoryLimit', '512MB'),
    prefetchStrategy: process.env.DICOM_PREFETCH_STRATEGY || get(publicSettings, 'dicom.prefetchStrategy', 'balanced'),
    enableGPU: process.env.DICOM_ENABLE_GPU === 'true' || get(publicSettings, 'dicom.enableGPU', true),
    workerCount: parseInt(process.env.DICOM_WORKER_COUNT || get(publicSettings, 'dicom.workerCount', 4)),
    concurrentRequests: parseInt(process.env.DICOM_CONCURRENT_REQUESTS || get(publicSettings, 'dicom.concurrentRequests', 6)),
  };
  
  // Cache configuration
  const cacheConfig = {
    maxSizeMB: parseInt(process.env.DICOM_CACHE_SIZE_MB || get(publicSettings, 'cache.maxSizeMB', 2048)),
    ttlHours: parseInt(process.env.DICOM_CACHE_TTL_HOURS || get(publicSettings, 'cache.ttlHours', 168)), // 1 week
    cleanupIntervalHours: parseInt(process.env.DICOM_CACHE_CLEANUP_HOURS || get(publicSettings, 'cache.cleanupIntervalHours', 24)),
  };
  
  // Performance monitoring
  const performanceConfig = {
    enableMonitoring: process.env.DICOM_ENABLE_MONITORING !== 'false' && get(publicSettings, 'performance.enableMonitoring', true),
    metricsInterval: parseInt(process.env.DICOM_METRICS_INTERVAL || get(publicSettings, 'performance.metricsInterval', 60)), // seconds
  };
  
  // CORS configuration
  const corsConfig = {
    enable: process.env.CORS_ENABLE === 'true' || get(privateSettings, 'cors.enable', false),
    origin: process.env.CORS_ORIGIN || get(privateSettings, 'cors.origin', '*'),
  };
  
  // File cleanup configuration  
  const cleanupConfig = {
    enabled: process.env.CLEANUP_ENABLED !== 'false' && get(privateSettings, 'cleanup.enabled', true),
    intervalHours: parseInt(process.env.CLEANUP_INTERVAL_HOURS || get(privateSettings, 'cleanup.intervalHours', 6)),
    maxFileAgeHours: parseInt(process.env.CLEANUP_MAX_FILE_AGE_HOURS || get(privateSettings, 'cleanup.maxFileAgeHours', 168)), // 1 week
    maxSessionAgeHours: parseInt(process.env.CLEANUP_MAX_SESSION_AGE_HOURS || get(privateSettings, 'cleanup.maxSessionAgeHours', 24)),
  };
  
  // Update Meteor.settings with processed configuration
  Meteor.settings = {
    ...settings,
    public: {
      ...publicSettings,
      appName: process.env.APP_NAME || 'DICOM Viewer v3',
      version: process.env.APP_VERSION || '1.0.0',
      dicom: dicomConfig,
      cache: cacheConfig,
      performance: performanceConfig,
    },
    private: {
      ...privateSettings,
      cors: corsConfig,
      cleanup: cleanupConfig,
    },
  };
  
  // Log configuration
  console.log('📊 DICOM Configuration:');
  console.log('   Memory Limit:', dicomConfig.memoryLimit);
  console.log('   Prefetch Strategy:', dicomConfig.prefetchStrategy);
  console.log('   GPU Acceleration:', dicomConfig.enableGPU ? 'enabled' : 'disabled');
  console.log('   Worker Count:', dicomConfig.workerCount);
  console.log('   Concurrent Requests:', dicomConfig.concurrentRequests);
  console.log('   Cache Size:', `${cacheConfig.maxSizeMB}MB`);
  console.log('   Performance Monitoring:', performanceConfig.enableMonitoring ? 'enabled' : 'disabled');
  console.log('   CORS:', corsConfig.enable ? 'enabled' : 'disabled');
  console.log('   Cleanup Scheduler:', cleanupConfig.enabled ? 'enabled' : 'disabled');
  
  // Validate configuration
  if (dicomConfig.workerCount < 1 || dicomConfig.workerCount > 16) {
    console.warn('⚠️ Warning: Worker count should be between 1 and 16');
  }
  
  if (cacheConfig.maxSizeMB < 256) {
    console.warn('⚠️ Warning: Cache size below 256MB may impact performance');
  }
  
  if (dicomConfig.concurrentRequests > 10) {
    console.warn('⚠️ Warning: High concurrent request count may impact server performance');
  }
  
  console.log('✅ DICOM settings configured');
});