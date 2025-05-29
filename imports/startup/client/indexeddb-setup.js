import { openDB } from 'idb';
import { Meteor } from 'meteor/meteor';

let db = null;
const DB_NAME = 'DicomViewerDB';
const DB_VERSION = 1;

/**
 * Initialize IndexedDB for DICOM data caching
 */
export async function initializeIndexedDB() {
  try {
    console.log('🗄️ Initializing IndexedDB...');
    
    db = await openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`📦 Upgrading IndexedDB from v${oldVersion} to v${newVersion}`);
        
        // Studies store
        if (!db.objectStoreNames.contains('studies')) {
          const studiesStore = db.createObjectStore('studies', {
            keyPath: 'studyUID',
          });
          studiesStore.createIndex('patientId', 'patientId', { unique: false });
          studiesStore.createIndex('studyDate', 'studyDate', { unique: false });
          studiesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        // Series store
        if (!db.objectStoreNames.contains('series')) {
          const seriesStore = db.createObjectStore('series', {
            keyPath: 'seriesUID',
          });
          seriesStore.createIndex('studyUID', 'studyUID', { unique: false });
          seriesStore.createIndex('modality', 'modality', { unique: false });
          seriesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        // Instances store
        if (!db.objectStoreNames.contains('instances')) {
          const instancesStore = db.createObjectStore('instances', {
            keyPath: 'sopUID',
          });
          instancesStore.createIndex('seriesUID', 'seriesUID', { unique: false });
          instancesStore.createIndex('instanceNumber', 'instanceNumber', { unique: false });
          instancesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }
        
        // Image cache store for pixel data
        if (!db.objectStoreNames.contains('imageCache')) {
          const imageCacheStore = db.createObjectStore('imageCache', {
            keyPath: 'imageId',
          });
          imageCacheStore.createIndex('sopUID', 'sopUID', { unique: false });
          imageCacheStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
          imageCacheStore.createIndex('size', 'size', { unique: false });
        }
        
        // User preferences store
        if (!db.objectStoreNames.contains('userPreferences')) {
          const preferencesStore = db.createObjectStore('userPreferences', {
            keyPath: 'key',
          });
        }
        
        // Performance metrics store
        if (!db.objectStoreNames.contains('performanceMetrics')) {
          const metricsStore = db.createObjectStore('performanceMetrics', {
            keyPath: 'id',
            autoIncrement: true,
          });
          metricsStore.createIndex('timestamp', 'timestamp', { unique: false });
          metricsStore.createIndex('operation', 'operation', { unique: false });
        }
      },
      blocked() {
        console.warn('⚠️ IndexedDB upgrade blocked by another tab');
      },
      blocking() {
        console.warn('⚠️ This tab is blocking IndexedDB upgrade');
        // Consider closing the database
        db?.close();
      },
    });
    
    console.log('✅ IndexedDB initialized successfully');
    
    // Schedule periodic cleanup
    scheduleCleanup();
    
    return db;
    
  } catch (error) {
    console.error('❌ Failed to initialize IndexedDB:', error);
    return null;
  }
}

/**
 * Get the IndexedDB instance
 */
export function getDB() {
  return db;
}

/**
 * Store study metadata
 */
export async function storeStudy(studyData) {
  if (!db) return false;
  
  try {
    const study = {
      ...studyData,
      createdAt: new Date(),
      lastAccessed: new Date(),
    };
    
    await db.put('studies', study);
    return true;
  } catch (error) {
    console.error('Error storing study:', error);
    return false;
  }
}

/**
 * Store series metadata
 */
export async function storeSeries(seriesData) {
  if (!db) return false;
  
  try {
    const series = {
      ...seriesData,
      createdAt: new Date(),
      lastAccessed: new Date(),
    };
    
    await db.put('series', series);
    return true;
  } catch (error) {
    console.error('Error storing series:', error);
    return false;
  }
}

/**
 * Store image data in cache
 */
export async function storeImageData(imageId, data, metadata = {}) {
  if (!db) return false;
  
  try {
    const cacheEntry = {
      imageId,
      data,
      metadata,
      size: data.byteLength || data.length || 0,
      createdAt: new Date(),
      lastAccessed: new Date(),
    };
    
    await db.put('imageCache', cacheEntry);
    return true;
  } catch (error) {
    console.error('Error storing image data:', error);
    return false;
  }
}

/**
 * Retrieve image data from cache
 */
export async function getImageData(imageId) {
  if (!db) return null;
  
  try {
    const entry = await db.get('imageCache', imageId);
    
    if (entry) {
      // Update last accessed time
      entry.lastAccessed = new Date();
      await db.put('imageCache', entry);
      
      return entry.data;
    }
    
    return null;
  } catch (error) {
    console.error('Error retrieving image data:', error);
    return null;
  }
}

/**
 * Get cache size and statistics
 */
export async function getCacheStats() {
  if (!db) return null;
  
  try {
    const transaction = db.transaction(['imageCache'], 'readonly');
    const store = transaction.objectStore('imageCache');
    
    let totalSize = 0;
    let count = 0;
    
    const cursor = await store.openCursor();
    
    while (cursor) {
      totalSize += cursor.value.size || 0;
      count++;
      await cursor.continue();
    }
    
    return {
      totalSize,
      count,
      averageSize: count > 0 ? totalSize / count : 0,
    };
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return null;
  }
}

/**
 * Clean up old cache entries
 */
export async function cleanupCache(maxSizeBytes = null, maxAgeHours = null) {
  if (!db) return false;
  
  try {
    const settings = Meteor.settings.public;
    const defaultMaxSize = (settings?.cache?.maxSizeMB || 2048) * 1024 * 1024;
    const defaultMaxAge = (settings?.cache?.ttlHours || 168) * 60 * 60 * 1000; // hours to ms
    
    maxSizeBytes = maxSizeBytes || defaultMaxSize;
    maxAgeHours = maxAgeHours || defaultMaxAge;
    
    const cutoffDate = new Date(Date.now() - maxAgeHours);
    
    const transaction = db.transaction(['imageCache'], 'readwrite');
    const store = transaction.objectStore('imageCache');
    const index = store.index('lastAccessed');
    
    // Get all entries sorted by last accessed (oldest first)
    const entries = await index.getAll();
    entries.sort((a, b) => a.lastAccessed - b.lastAccessed);
    
    let totalSize = entries.reduce((sum, entry) => sum + (entry.size || 0), 0);
    let deletedCount = 0;
    
    // Delete old entries first
    for (const entry of entries) {
      if (entry.lastAccessed < cutoffDate) {
        await store.delete(entry.imageId);
        totalSize -= entry.size || 0;
        deletedCount++;
      }
    }
    
    // If still over size limit, delete oldest entries
    let i = 0;
    while (totalSize > maxSizeBytes && i < entries.length) {
      const entry = entries[i];
      if (entry.lastAccessed >= cutoffDate) { // Skip already deleted
        await store.delete(entry.imageId);
        totalSize -= entry.size || 0;
        deletedCount++;
      }
      i++;
    }
    
    console.log(`🧹 Cache cleanup: deleted ${deletedCount} entries, ${Math.round(totalSize / 1024 / 1024)}MB remaining`);
    
    return true;
  } catch (error) {
    console.error('Error during cache cleanup:', error);
    return false;
  }
}

/**
 * Schedule periodic cleanup
 */
function scheduleCleanup() {
  const settings = Meteor.settings.public;
  const cleanupInterval = (settings?.cache?.cleanupIntervalHours || 24) * 60 * 60 * 1000;
  
  setInterval(function() {
    console.log('🧹 Running scheduled cache cleanup...');
    cleanupCache();
  }, cleanupInterval);
}

// Initialize when this module loads
Meteor.startup(async function() {
  await initializeIndexedDB();
});