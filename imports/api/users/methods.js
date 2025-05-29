import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { get } from 'lodash';

/**
 * User management methods for DICOM viewer
 */

Meteor.methods({
  /**
   * Update user preferences
   */
  async 'users.updatePreferences'(preferences) {
    check(preferences, Object);
    
    if (!this.userId) {
      throw new Meteor.Error('not-authorized', 'Must be logged in to update preferences');
    }
    
    try {
      // TODO: When user accounts are implemented, update user document
      // For now, just return success
      
      console.log(`👤 Updated preferences for user ${this.userId}`);
      
      return { success: true };
      
    } catch (error) {
      console.error('Error updating user preferences:', error);
      throw new Meteor.Error('preferences-update-failed', error.message);
    }
  },
  
  /**
   * Get user preferences
   */
  async 'users.getPreferences'() {
    if (!this.userId) {
      // Return default preferences for anonymous users
      return getDefaultPreferences();
    }
    
    try {
      // TODO: When user accounts are implemented, fetch from user document
      // For now, return default preferences
      
      return getDefaultPreferences();
      
    } catch (error) {
      console.error('Error getting user preferences:', error);
      throw new Meteor.Error('preferences-fetch-failed', error.message);
    }
  },
  
  /**
   * Update user session state
   */
  async 'users.updateSessionState'(sessionState) {
    check(sessionState, {
      currentStudyUID: Match.Maybe(String),
      currentSeriesUID: Match.Maybe(String),
      currentInstanceUID: Match.Maybe(String),
      viewportSettings: Match.Maybe(Object),
      toolSettings: Match.Maybe(Object),
    });
    
    try {
      const { UserSessionsCollection } = await import('/imports/api/dicom/collections/user-sessions');
      
      const sessionId = get(this, 'connection.id', 'unknown');
      const clientIP = get(this, 'connection.clientAddress', null);
      const userAgent = get(this, 'connection.httpHeaders.user-agent', null);
      
      // Upsert user session
      await UserSessionsCollection.upsertAsync(
        { sessionId },
        {
          $set: {
            ...sessionState,
            userId: this.userId || null,
            clientIP,
            userAgent,
            lastActivity: new Date(),
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        }
      );
      
      return { success: true };
      
    } catch (error) {
      console.error('Error updating session state:', error);
      throw new Meteor.Error('session-update-failed', error.message);
    }
  },
  
  /**
   * Get user session state
   */
  async 'users.getSessionState'() {
    try {
      const { UserSessionsCollection } = await import('/imports/api/dicom/collections/user-sessions');
      
      const sessionId = get(this, 'connection.id', 'unknown');
      
      const session = await UserSessionsCollection.findOneAsync({ sessionId });
      
      if (!session) {
        return getDefaultSessionState();
      }
      
      return {
        currentStudyUID: session.currentStudyUID,
        currentSeriesUID: session.currentSeriesUID,
        currentInstanceUID: session.currentInstanceUID,
        viewportSettings: session.viewportSettings,
        toolSettings: session.toolSettings,
        preferences: session.preferences,
      };
      
    } catch (error) {
      console.error('Error getting session state:', error);
      return getDefaultSessionState();
    }
  },
});

/**
 * Get default user preferences
 */
function getDefaultPreferences() {
  return {
    theme: 'dark',
    layout: 'single',
    autoPlay: false,
    playbackSpeed: 100,
    enableGPU: true,
    cacheSize: 512, // MB
    language: 'en',
    timeFormat: '24h',
    measurementUnits: 'metric',
    windowLevelPresets: {
      lung: { windowCenter: -600, windowWidth: 1500 },
      bone: { windowCenter: 400, windowWidth: 1000 },
      brain: { windowCenter: 40, windowWidth: 80 },
      abdomen: { windowCenter: 60, windowWidth: 400 },
    },
  };
}

/**
 * Get default session state
 */
function getDefaultSessionState() {
  return {
    currentStudyUID: null,
    currentSeriesUID: null,
    currentInstanceUID: null,
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
      activeTool: 'pan',
      measurements: [],
      annotations: [],
    },
    preferences: getDefaultPreferences(),
  };
}

console.log('👥 User methods registered');