import { Meteor } from 'meteor/meteor';

/**
 * Client-side memory management for DICOM viewer
 * Monitors memory usage and triggers cleanup when necessary
 */

let memoryMonitorInterval = null;
let memoryWarningThreshold = 0.8; // 80% of available memory
let memoryCleanupCallbacks = [];

/**
 * Parse memory limit string to bytes
 */
function parseMemoryLimit(limitStr) {
  const limit = limitStr.toLowerCase();
  const value = parseFloat(limit);
  
  if (limit.includes('gb')) {
    return value * 1024 * 1024 * 1024;
  } else if (limit.includes('mb')) {
    return value * 1024 * 1024;
  } else if (limit.includes('kb')) {
    return value * 1024;
  }
  
  return value; // assume bytes
}

/**
 * Get current memory usage information
 */
function getMemoryInfo() {
  // Use performance.memory if available (Chromium-based browsers)
  if (performance.memory) {
    return {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
      supported: true,
    };
  }
  
  return {
    used: 0,
    total: 0,
    limit: 0,
    supported: false,
  };
}

/**
 * Check if memory usage is approaching limits
 */
function checkMemoryUsage() {
  const memoryInfo = getMemoryInfo();
  
  if (!memoryInfo.supported) {
    return { warning: false, critical: false };
  }
  
  const usageRatio = memoryInfo.used / memoryInfo.limit;
  const warning = usageRatio > memoryWarningThreshold;
  const critical = usageRatio > 0.9; // 90% = critical
  
  if (critical) {
    console.warn('🚨 Critical memory usage detected:', {
      used: `${Math.round(memoryInfo.used / 1024 / 1024)}MB`,
      limit: `${Math.round(memoryInfo.limit / 1024 / 1024)}MB`,
      usage: `${Math.round(usageRatio * 100)}%`,
    });
    
    // Trigger aggressive cleanup
    triggerMemoryCleanup('critical');
    
  } else if (warning) {
    console.warn('⚠️ High memory usage detected:', {
      used: `${Math.round(memoryInfo.used / 1024 / 1024)}MB`,
      limit: `${Math.round(memoryInfo.limit / 1024 / 1024)}MB`,
      usage: `${Math.round(usageRatio * 100)}%`,
    });
    
    // Trigger moderate cleanup
    triggerMemoryCleanup('warning');
  }
  
  return { warning, critical, info: memoryInfo };
}

/**
 * Trigger memory cleanup with specified urgency
 */
function triggerMemoryCleanup(urgency = 'normal') {
  console.log(`🧹 Triggering memory cleanup (${urgency} mode)...`);
  
  // Call all registered cleanup callbacks
  memoryCleanupCallbacks.forEach(function(callback) {
    try {
      callback(urgency);
    } catch (error) {
      console.error('Error in memory cleanup callback:', error);
    }
  });
  
  // Force garbage collection if available (development mode)
  if (window.gc && typeof window.gc === 'function') {
    window.gc();
  }
}

/**
 * Register a cleanup callback
 */
export function registerMemoryCleanupCallback(callback) {
  memoryCleanupCallbacks.push(callback);
}

/**
 * Unregister a cleanup callback
 */
export function unregisterMemoryCleanupCallback(callback) {
  const index = memoryCleanupCallbacks.indexOf(callback);
  if (index > -1) {
    memoryCleanupCallbacks.splice(index, 1);
  }
}

/**
 * Start memory monitoring
 */
function startMemoryMonitoring() {
  const settings = Meteor.settings.public;
  const memoryLimit = settings?.dicom?.memoryLimit || '512MB';
  const monitoringEnabled = settings?.performance?.enableMonitoring !== false;
  
  if (!monitoringEnabled) {
    console.log('📊 Memory monitoring disabled');
    return;
  }
  
  // Set up memory monitoring
  const limitBytes = parseMemoryLimit(memoryLimit);
  
  console.log('📊 Starting memory monitoring:', {
    limit: memoryLimit,
    limitBytes: limitBytes,
    threshold: `${memoryWarningThreshold * 100}%`,
  });
  
  // Check memory every 10 seconds
  memoryMonitorInterval = setInterval(function() {
    checkMemoryUsage();
  }, 10000);
  
  // Also check on visibility change (when user returns to tab)
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      checkMemoryUsage();
    }
  });
}

/**
 * Stop memory monitoring
 */
function stopMemoryMonitoring() {
  if (memoryMonitorInterval) {
    clearInterval(memoryMonitorInterval);
    memoryMonitorInterval = null;
  }
}

/**
 * Get current memory status
 */
export function getMemoryStatus() {
  return checkMemoryUsage();
}

/**
 * Manually trigger memory cleanup
 */
export function cleanupMemory(urgency = 'normal') {
  triggerMemoryCleanup(urgency);
}

// Initialize memory monitoring when module loads
Meteor.startup(function() {
  startMemoryMonitoring();
});

// Cleanup on window unload
window.addEventListener('beforeunload', function() {
  stopMemoryMonitoring();
});