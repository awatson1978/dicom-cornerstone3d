import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Import cache utilities
import { getCacheStats, cleanupCache, getImageData, storeImageData } from '/imports/startup/client/indexeddb-setup';

// Create context
const CacheContext = createContext();

// Action types
const CACHE_ACTIONS = {
  UPDATE_STATS: 'UPDATE_STATS',
  SET_SETTINGS: 'SET_SETTINGS',
  ADD_CACHE_ENTRY: 'ADD_CACHE_ENTRY',
  REMOVE_CACHE_ENTRY: 'REMOVE_CACHE_ENTRY',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
};

// Initial state
const initialState = {
  stats: {
    totalSize: 0,
    count: 0,
    averageSize: 0,
  },
  settings: {
    maxSizeMB: 2048,
    ttlHours: 168,
    cleanupIntervalHours: 24,
  },
  entries: [],
  loading: false,
  error: null,
  lastUpdate: null,
};

// Reducer
function cacheReducer(state, action) {
  switch (action.type) {
    case CACHE_ACTIONS.UPDATE_STATS:
      return {
        ...state,
        stats: action.payload,
        lastUpdate: new Date(),
      };
      
    case CACHE_ACTIONS.SET_SETTINGS:
      return {
        ...state,
        settings: { ...state.settings, ...action.payload },
      };
      
    case CACHE_ACTIONS.ADD_CACHE_ENTRY:
      return {
        ...state,
        entries: [...state.entries, action.payload],
      };
      
    case CACHE_ACTIONS.REMOVE_CACHE_ENTRY:
      return {
        ...state,
        entries: state.entries.filter(function(entry) {
          return entry.id !== action.payload;
        }),
      };
      
    case CACHE_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
      
    case CACHE_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
      
    default:
      return state;
  }
}

/**
 * Cache Context Provider
 */
export function CacheProvider({ children }) {
  const [state, dispatch] = useReducer(cacheReducer, initialState);
  
  // Initialize cache settings from Meteor settings
  useEffect(function() {
    const settings = Meteor.settings.public;
    const cacheSettings = {
      maxSizeMB: get(settings, 'cache.maxSizeMB', 2048),
      ttlHours: get(settings, 'cache.ttlHours', 168),
      cleanupIntervalHours: get(settings, 'cache.cleanupIntervalHours', 24),
    };
    
    dispatch({ type: CACHE_ACTIONS.SET_SETTINGS, payload: cacheSettings });
  }, []);
  
  // Update cache stats periodically
  useEffect(function() {
    async function updateStats() {
      try {
        const stats = await getCacheStats();
        if (stats) {
          dispatch({ type: CACHE_ACTIONS.UPDATE_STATS, payload: stats });
        }
      } catch (error) {
        console.error('Error updating cache stats:', error);
        dispatch({ type: CACHE_ACTIONS.SET_ERROR, payload: error.message });
      }
    }
    
    // Update immediately
    updateStats();
    
    // Update every 30 seconds
    const interval = setInterval(updateStats, 30000);
    
    return function() {
      clearInterval(interval);
    };
  }, []);
  
  /**
   * Clear cache
   */
  async function clearCache() {
    try {
      dispatch({ type: CACHE_ACTIONS.SET_LOADING, payload: true });
      
      const success = await cleanupCache(0, 0); // Clear everything
      
      if (success) {
        // Update stats after clearing
        const stats = await getCacheStats();
        if (stats) {
          dispatch({ type: CACHE_ACTIONS.UPDATE_STATS, payload: stats });
        }
        
        return true;
      } else {
        throw new Error('Cache clear failed');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
      dispatch({ type: CACHE_ACTIONS.SET_ERROR, payload: error.message });
      return false;
    } finally {
      dispatch({ type: CACHE_ACTIONS.SET_LOADING, payload: false });
    }
  }
  
  /**
   * Get cached image
   */
  async function getCachedImage(imageId) {
    try {
      return await getImageData(imageId);
    } catch (error) {
      console.error('Error getting cached image:', error);
      return null;
    }
  }
  
  /**
   * Store image in cache
   */
  async function setCachedImage(imageId, data, metadata = {}) {
    try {
      const success = await storeImageData(imageId, data, metadata);
      
      if (success) {
        // Update stats
        const stats = await getCacheStats();
        if (stats) {
          dispatch({ type: CACHE_ACTIONS.UPDATE_STATS, payload: stats });
        }
      }
      
      return success;
    } catch (error) {
      console.error('Error storing cached image:', error);
      return false;
    }
  }
  
  /**
   * Cleanup old cache entries
   */
  async function performCleanup() {
    try {
      dispatch({ type: CACHE_ACTIONS.SET_LOADING, payload: true });
      
      const maxSizeBytes = state.settings.maxSizeMB * 1024 * 1024;
      const maxAgeMs = state.settings.ttlHours * 60 * 60 * 1000;
      
      const success = await cleanupCache(maxSizeBytes, maxAgeMs);
      
      if (success) {
        // Update stats after cleanup
        const stats = await getCacheStats();
        if (stats) {
          dispatch({ type: CACHE_ACTIONS.UPDATE_STATS, payload: stats });
        }
      }
      
      return success;
    } catch (error) {
      console.error('Error during cache cleanup:', error);
      dispatch({ type: CACHE_ACTIONS.SET_ERROR, payload: error.message });
      return false;
    } finally {
      dispatch({ type: CACHE_ACTIONS.SET_LOADING, payload: false });
    }
  }
  
  /**
   * Update cache settings
   */
  function updateCacheSettings(newSettings) {
    dispatch({ type: CACHE_ACTIONS.SET_SETTINGS, payload: newSettings });
  }
  
  /**
   * Get cache size formatted string
   */
  function getCacheSizeFormatted() {
    const sizeMB = Math.round(state.stats.totalSize / 1024 / 1024);
    return `${sizeMB}MB`;
  }
  
  /**
   * Get cache usage percentage
   */
  function getCacheUsagePercentage() {
    const maxSizeBytes = state.settings.maxSizeMB * 1024 * 1024;
    if (maxSizeBytes === 0) return 0;
    return Math.round((state.stats.totalSize / maxSizeBytes) * 100);
  }
  
  /**
   * Check if cache is near capacity
   */
  function isCacheNearCapacity() {
    return getCacheUsagePercentage() > 80;
  }
  
  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Actions
    clearCache,
    getCachedImage,
    setCachedImage,
    performCleanup,
    updateCacheSettings,
    
    // Computed values
    cacheStats: state.stats,
    cacheSettings: state.settings,
    cacheSizeFormatted: getCacheSizeFormatted(),
    cacheUsagePercentage: getCacheUsagePercentage(),
    isNearCapacity: isCacheNearCapacity(),
    isHealthy: !isCacheNearCapacity() && !state.error,
  };
  
  return (
    <CacheContext.Provider value={contextValue}>
      {children}
    </CacheContext.Provider>
  );
}

/**
 * Hook to use cache context
 */
export function useCache() {
  const context = useContext(CacheContext);
  
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  
  return context;
}