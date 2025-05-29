import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

/**
 * User publications for DICOM viewer
 * Note: This app currently works without user accounts
 * These are placeholder publications for future user system
 */

Meteor.publish('users.preferences', function() {
  // For now, return empty cursor since we don't have user accounts yet
  // When user accounts are implemented, this would return user preferences
  
  if (!this.userId) {
    return this.ready();
  }
  
  // TODO: When user accounts are added, return user preferences
  // return Users.find({ _id: this.userId }, { fields: { preferences: 1 } });
  
  return this.ready();
});

Meteor.publish('users.sessionState', function() {
  // Publish current user's session state
  try {
    const { UserSessionsCollection } = require('/imports/api/dicom/collections/user-sessions');
    
    const sessionId = this.connection?.id;
    if (!sessionId) {
      return this.ready();
    }
    
    return UserSessionsCollection.find({ sessionId });
    
  } catch (error) {
    console.error('Error in session state publication:', error);
    return this.ready();
  }
});

Meteor.publish('users.activeSessions', function() {
  // Publish active user sessions for collaboration features
  try {
    const { UserSessionsCollection } = require('/imports/api/dicom/collections/user-sessions');
    
    // Only show sessions from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    return UserSessionsCollection.find(
      { 
        lastActivity: { $gte: oneHourAgo } 
      },
      { 
        fields: {
          sessionId: 1,
          userId: 1,
          currentStudyUID: 1,
          currentSeriesUID: 1,
          lastActivity: 1,
          // Exclude sensitive information
        },
        sort: { lastActivity: -1 },
        limit: 50,
      }
    );
    
  } catch (error) {
    console.error('Error in active sessions publication:', error);
    return this.ready();
  }
});

console.log('📡 User publications registered');