import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { get, set } from 'lodash';

// Create context
const DicomContext = createContext();

// Action types
const DICOM_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_STUDIES: 'SET_STUDIES',
  ADD_STUDY: 'ADD_STUDY',
  UPDATE_STUDY: 'UPDATE_STUDY',
  SET_CURRENT_STUDY: 'SET_CURRENT_STUDY',
  SET_CURRENT_SERIES: 'SET_CURRENT_SERIES',
  SET_CURRENT_INSTANCE: 'SET_CURRENT_INSTANCE',
  SET_UPLOAD_PROGRESS: 'SET_UPLOAD_PROGRESS',
  CLEAR_ERROR: 'CLEAR_ERROR',
};

// Initial state
const initialState = {
  loading: false,
  error: null,
  studies: [],
  currentStudy: null,
  currentSeries: null,
  currentInstance: null,
  uploadProgress: null,
};

// Reducer
function dicomReducer(state, action) {
  switch (action.type) {
    case DICOM_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
      
    case DICOM_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
      
    case DICOM_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
      
    case DICOM_ACTIONS.SET_STUDIES:
      return { ...state, studies: action.payload };
      
    case DICOM_ACTIONS.ADD_STUDY:
      return { 
        ...state, 
        studies: [...state.studies, action.payload] 
      };
      
    case DICOM_ACTIONS.UPDATE_STUDY:
      return {
        ...state,
        studies: state.studies.map(function(study) {
          return study.studyUID === action.payload.studyUID 
            ? { ...study, ...action.payload }
            : study;
        }),
      };
      
    case DICOM_ACTIONS.SET_CURRENT_STUDY:
      return { 
        ...state, 
        currentStudy: action.payload,
        currentSeries: null, // Reset series when study changes
        currentInstance: null, // Reset instance when study changes
      };
      
    case DICOM_ACTIONS.SET_CURRENT_SERIES:
      return { 
        ...state, 
        currentSeries: action.payload,
        currentInstance: null, // Reset instance when series changes
      };
      
    case DICOM_ACTIONS.SET_CURRENT_INSTANCE:
      return { ...state, currentInstance: action.payload };
      
    case DICOM_ACTIONS.SET_UPLOAD_PROGRESS:
      return { ...state, uploadProgress: action.payload };
      
    default:
      return state;
  }
}

/**
 * DICOM Context Provider
 */
export function DicomProvider({ children }) {
  const [state, dispatch] = useReducer(dicomReducer, initialState);
  
  // Load studies on initialization
  useEffect(function() {
    loadStudies();
  }, []);
  
  /**
   * Load all studies from the server
   */
  async function loadStudies() {
    try {
      dispatch({ type: DICOM_ACTIONS.SET_LOADING, payload: true });
      
      // Subscribe to studies collection
      const handle = Meteor.subscribe('studies');
      
      // Wait for subscription to be ready
      await new Promise(function(resolve) {
        Tracker.autorun(function(computation) {
          if (handle.ready()) {
            computation.stop();
            resolve();
          }
        });
      });
      
      // Get studies from collection (placeholder - will need actual collection)
      // For now, return empty array until collections are properly set up
      const studies = [];
      
      dispatch({ type: DICOM_ACTIONS.SET_STUDIES, payload: studies });
      
    } catch (error) {
      console.error('Error loading studies:', error);
      dispatch({ 
        type: DICOM_ACTIONS.SET_ERROR, 
        payload: 'Failed to load studies: ' + error.message 
      });
    } finally {
      dispatch({ type: DICOM_ACTIONS.SET_LOADING, payload: false });
    }
  }
  
  /**
   * Upload DICOM files
   */
  async function uploadFiles(files, options = {}) {
    try {
      dispatch({ type: DICOM_ACTIONS.SET_LOADING, payload: true });
      dispatch({ type: DICOM_ACTIONS.CLEAR_ERROR });
      
      const totalFiles = files.length;
      let uploadedFiles = 0;
      
      // Process files in batches
      const batchSize = get(options, 'batchSize', 5);
      
      for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        
        // Process batch
        const batchPromises = batch.map(async function(file) {
          try {
            // Create FormData for file upload
            const formData = new FormData();
            formData.append('dicomFile', file);
            formData.append('fileName', file.name);
            
            // Upload via HTTP (not DDP for large files)
            const response = await fetch('/api/dicom/upload', {
              method: 'POST',
              body: formData,
            });
            
            if (!response.ok) {
              throw new Error(`Upload failed: ${response.statusText}`);
            }
            
            const result = await response.json();
            uploadedFiles++;
            
            // Update progress
            dispatch({
              type: DICOM_ACTIONS.SET_UPLOAD_PROGRESS,
              payload: {
                current: uploadedFiles,
                total: totalFiles,
                percentage: Math.round((uploadedFiles / totalFiles) * 100),
                currentFile: file.name,
              },
            });
            
            return result;
            
          } catch (error) {
            console.error(`Error uploading ${file.name}:`, error);
            throw error;
          }
        });
        
        await Promise.all(batchPromises);
      }
      
      // Reload studies after upload
      await loadStudies();
      
      dispatch({ type: DICOM_ACTIONS.SET_UPLOAD_PROGRESS, payload: null });
      
      return { success: true, uploadedCount: uploadedFiles };
      
    } catch (error) {
      console.error('Error during file upload:', error);
      dispatch({ 
        type: DICOM_ACTIONS.SET_ERROR, 
        payload: 'Upload failed: ' + error.message 
      });
      dispatch({ type: DICOM_ACTIONS.SET_UPLOAD_PROGRESS, payload: null });
      
      return { success: false, error: error.message };
    } finally {
      dispatch({ type: DICOM_ACTIONS.SET_LOADING, payload: false });
    }
  }
  
  /**
   * Select a study for viewing
   */
  function selectStudy(study) {
    dispatch({ type: DICOM_ACTIONS.SET_CURRENT_STUDY, payload: study });
  }
  
  /**
   * Select a series within the current study
   */
  function selectSeries(series) {
    dispatch({ type: DICOM_ACTIONS.SET_CURRENT_SERIES, payload: series });
  }
  
  /**
   * Select an instance within the current series
   */
  function selectInstance(instance) {
    dispatch({ type: DICOM_ACTIONS.SET_CURRENT_INSTANCE, payload: instance });
  }
  
  /**
   * Clear current selections
   */
  function clearSelection() {
    dispatch({ type: DICOM_ACTIONS.SET_CURRENT_STUDY, payload: null });
    dispatch({ type: DICOM_ACTIONS.SET_CURRENT_SERIES, payload: null });
    dispatch({ type: DICOM_ACTIONS.SET_CURRENT_INSTANCE, payload: null });
  }
  
  /**
   * Clear error state
   */
  function clearError() {
    dispatch({ type: DICOM_ACTIONS.CLEAR_ERROR });
  }
  
  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Actions
    loadStudies,
    uploadFiles,
    selectStudy,
    selectSeries,
    selectInstance,
    clearSelection,
    clearError,
    
    // Computed values
    hasStudies: state.studies.length > 0,
    currentStudySeries: state.currentStudy ? get(state.currentStudy, 'series', []) : [],
    currentSeriesInstances: state.currentSeries ? get(state.currentSeries, 'instances', []) : [],
  };
  
  return (
    <DicomContext.Provider value={contextValue}>
      {children}
    </DicomContext.Provider>
  );
}

/**
 * Hook to use DICOM context
 */
export function useDicom() {
  const context = useContext(DicomContext);
  
  if (!context) {
    throw new Error('useDicom must be used within a DicomProvider');
  }
  
  return context;
}