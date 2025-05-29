import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

// Create context
const ViewerContext = createContext();

// Action types
const VIEWER_ACTIONS = {
  SET_LAYOUT: 'SET_LAYOUT',
  SET_ACTIVE_TOOL: 'SET_ACTIVE_TOOL',
  SET_VIEWPORT_SETTINGS: 'SET_VIEWPORT_SETTINGS',
  SET_TOOL_SETTINGS: 'SET_TOOL_SETTINGS',
  UPDATE_VIEWPORT: 'UPDATE_VIEWPORT',
  ADD_MEASUREMENT: 'ADD_MEASUREMENT',
  REMOVE_MEASUREMENT: 'REMOVE_MEASUREMENT',
  ADD_ANNOTATION: 'ADD_ANNOTATION',
  REMOVE_ANNOTATION: 'REMOVE_ANNOTATION',
};

// Initial state
const initialState = {
  layout: 'single', // single, quad, stack
  activeTool: 'pan',
  viewportSettings: {
    windowCenter: null,
    windowWidth: null,
    zoom: 1.0,
    pan: { x: 0, y: 0 },
    rotation: 0,
    flipH: false,
    flipV: false,
  },
  toolSettings: {
    measurements: [],
    annotations: [],
    presets: {
      lung: { windowCenter: -600, windowWidth: 1500 },
      bone: { windowCenter: 400, windowWidth: 1000 },
      brain: { windowCenter: 40, windowWidth: 80 },
      abdomen: { windowCenter: 60, windowWidth: 400 },
    },
  },
  viewports: [], // For multi-viewport layouts
};

// Reducer
function viewerReducer(state, action) {
  switch (action.type) {
    case VIEWER_ACTIONS.SET_LAYOUT:
      return { ...state, layout: action.payload };
      
    case VIEWER_ACTIONS.SET_ACTIVE_TOOL:
      return { ...state, activeTool: action.payload };
      
    case VIEWER_ACTIONS.SET_VIEWPORT_SETTINGS:
      return {
        ...state,
        viewportSettings: { ...state.viewportSettings, ...action.payload },
      };
      
    case VIEWER_ACTIONS.SET_TOOL_SETTINGS:
      return {
        ...state,
        toolSettings: { ...state.toolSettings, ...action.payload },
      };
      
    case VIEWER_ACTIONS.UPDATE_VIEWPORT:
      return {
        ...state,
        viewports: state.viewports.map(function(viewport, index) {
          return index === action.payload.index
            ? { ...viewport, ...action.payload.settings }
            : viewport;
        }),
      };
      
    case VIEWER_ACTIONS.ADD_MEASUREMENT:
      return {
        ...state,
        toolSettings: {
          ...state.toolSettings,
          measurements: [...state.toolSettings.measurements, action.payload],
        },
      };
      
    case VIEWER_ACTIONS.REMOVE_MEASUREMENT:
      return {
        ...state,
        toolSettings: {
          ...state.toolSettings,
          measurements: state.toolSettings.measurements.filter(
            function(m) { return m.id !== action.payload; }
          ),
        },
      };
      
    case VIEWER_ACTIONS.ADD_ANNOTATION:
      return {
        ...state,
        toolSettings: {
          ...state.toolSettings,
          annotations: [...state.toolSettings.annotations, action.payload],
        },
      };
      
    case VIEWER_ACTIONS.REMOVE_ANNOTATION:
      return {
        ...state,
        toolSettings: {
          ...state.toolSettings,
          annotations: state.toolSettings.annotations.filter(
            function(a) { return a.id !== action.payload; }
          ),
        },
      };
      
    default:
      return state;
  }
}

/**
 * Viewer Context Provider
 */
export function ViewerProvider({ children }) {
  const [state, dispatch] = useReducer(viewerReducer, initialState);
  
  /**
   * Set viewer layout
   */
  function setLayout(layout) {
    dispatch({ type: VIEWER_ACTIONS.SET_LAYOUT, payload: layout });
  }
  
  /**
   * Set active tool
   */
  function setActiveTool(tool) {
    dispatch({ type: VIEWER_ACTIONS.SET_ACTIVE_TOOL, payload: tool });
  }
  
  /**
   * Update viewport settings
   */
  function updateViewportSettings(settings) {
    dispatch({ type: VIEWER_ACTIONS.SET_VIEWPORT_SETTINGS, payload: settings });
  }
  
  /**
   * Update tool settings
   */
  function updateToolSettings(settings) {
    dispatch({ type: VIEWER_ACTIONS.SET_TOOL_SETTINGS, payload: settings });
  }
  
  /**
   * Add measurement
   */
  function addMeasurement(measurement) {
    const measurementWithId = {
      ...measurement,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    dispatch({ type: VIEWER_ACTIONS.ADD_MEASUREMENT, payload: measurementWithId });
  }
  
  /**
   * Remove measurement
   */
  function removeMeasurement(measurementId) {
    dispatch({ type: VIEWER_ACTIONS.REMOVE_MEASUREMENT, payload: measurementId });
  }
  
  /**
   * Add annotation
   */
  function addAnnotation(annotation) {
    const annotationWithId = {
      ...annotation,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    dispatch({ type: VIEWER_ACTIONS.ADD_ANNOTATION, payload: annotationWithId });
  }
  
  /**
   * Remove annotation
   */
  function removeAnnotation(annotationId) {
    dispatch({ type: VIEWER_ACTIONS.REMOVE_ANNOTATION, payload: annotationId });
  }
  
  /**
   * Apply window/level preset
   */
  function applyPreset(presetName) {
    const preset = get(state.toolSettings.presets, presetName);
    if (preset) {
      updateViewportSettings({
        windowCenter: preset.windowCenter,
        windowWidth: preset.windowWidth,
      });
    }
  }
  
  /**
   * Reset viewport to default
   */
  function resetViewport() {
    updateViewportSettings({
      zoom: 1.0,
      pan: { x: 0, y: 0 },
      rotation: 0,
      flipH: false,
      flipV: false,
    });
  }
  
  // Context value
  const contextValue = {
    // State
    ...state,
    
    // Actions
    setLayout,
    setActiveTool,
    updateViewportSettings,
    updateToolSettings,
    addMeasurement,
    removeMeasurement,
    addAnnotation,
    removeAnnotation,
    applyPreset,
    resetViewport,
    
    // Computed values
    hasMultipleViewports: state.layout !== 'single',
    measurementCount: state.toolSettings.measurements.length,
    annotationCount: state.toolSettings.annotations.length,
  };
  
  return (
    <ViewerContext.Provider value={contextValue}>
      {children}
    </ViewerContext.Provider>
  );
}

/**
 * Hook to use viewer context
 */
export function useViewer() {
  const context = useContext(ViewerContext);
  
  if (!context) {
    throw new Error('useViewer must be used within a ViewerProvider');
  }
  
  return context;
}