import { useState, useEffect, useCallback } from 'react';
import { Meteor } from 'meteor/meteor';
import { initializeCornerstone3D, isCornerstone3DInitialized, getCornerstone3DInfo } from '/imports/startup/client/cornerstone3d-setup';

/**
 * React hook for managing Cornerstone3D initialization and state
 */
export function useCornerstone() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  
  /**
   * Initialize Cornerstone3D
   */
  const initialize = useCallback(async function() {
    if (isInitialized || isInitializing) {
      return;
    }
    
    try {
      setIsInitializing(true);
      setError(null);
      
      const success = await initializeCornerstone3D();
      
      if (success) {
        setIsInitialized(true);
        setInfo(getCornerstone3DInfo());
      } else {
        throw new Error('Cornerstone3D initialization failed');
      }
      
    } catch (err) {
      console.error('Cornerstone3D initialization error:', err);
      setError(err);
    } finally {
      setIsInitializing(false);
    }
  }, [isInitialized, isInitializing]);
  
  /**
   * Check initialization status on mount
   */
  useEffect(function() {
    if (isCornerstone3DInitialized()) {
      setIsInitialized(true);
      setInfo(getCornerstone3DInfo());
    }
  }, []);
  
  /**
   * Get current Cornerstone3D configuration
   */
  const getConfiguration = useCallback(function() {
    return getCornerstone3DInfo();
  }, []);
  
  /**
   * Check if GPU acceleration is available
   */
  const hasGPUAcceleration = useCallback(function() {
    const currentInfo = getCornerstone3DInfo();
    return currentInfo ? currentInfo.gpuEnabled : false;
  }, []);
  
  /**
   * Get Cornerstone3D version
   */
  const getVersion = useCallback(function() {
    const currentInfo = getCornerstone3DInfo();
    return currentInfo ? currentInfo.version : 'unknown';
  }, []);
  
  return {
    isInitialized,
    isInitializing,
    error,
    info,
    initialize,
    getConfiguration,
    hasGPUAcceleration,
    getVersion,
  };
}