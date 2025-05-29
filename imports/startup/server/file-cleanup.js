import { Meteor } from 'meteor/meteor';
import { get } from 'lodash';

/**
 * Scheduled cleanup for temporary files and old data
 */

let cleanupInterval = null;

/**
 * Cleanup temporary DICOM files and old sessions
 */
async function performCleanup() {
  console.log('🧹 Starting scheduled cleanup...');
  
  try {
    const settings = Meteor.settings.private || {};
    const maxFileAge = get(settings, 'cleanup.maxFileAgeHours', 168); // 7 days default
    const maxSessionAge = get(settings, 'cleanup.maxSessionAgeHours', 24); // 1 day default
    
    const cutoffDate = new Date(Date.now() - (maxFileAge * 60 * 60 * 1000));
    const sessionCutoffDate = new Date(Date.now() - (maxSessionAge * 60 * 60 * 1000));
    
    // Cleanup old user sessions
    const userSessionsCollection = MongoInternals.defaultRemoteCollectionDriver().mongo.db.collection('userSessions');
    const deletedSessions = await userSessionsCollection.deleteMany({
      lastActivity: { $lt: sessionCutoffDate }
    });
    
    console.log(`🗑️ Cleaned up ${deletedSessions.deletedCount} old user sessions`);
    
    // Cleanup orphaned instances (instances without parent series)
    const seriesCollection = MongoInternals.defaultRemoteCollectionDriver().mongo.db.collection('series');
    const instancesCollection = MongoInternals.defaultRemoteCollectionDriver().mongo.db.collection('instances');
    
    const allSeriesUIDs = await seriesCollection.distinct('seriesUID');
    const orphanedInstances = await instancesCollection.deleteMany({
      seriesUID: { $nin: allSeriesUIDs }
    });
    
    console.log(`🗑️ Cleaned up ${orphanedInstances.deletedCount} orphaned instances`);
    
    // Cleanup orphaned series (series without parent studies)
    const studiesCollection = MongoInternals.defaultRemoteCollectionDriver().mongo.db.collection('studies');
    const allStudyUIDs = await studiesCollection.distinct('studyUID');
    const orphanedSeries = await seriesCollection.deleteMany({
      studyUID: { $nin: allStudyUIDs }
    });
    
    console.log(`🗑️ Cleaned up ${orphanedSeries.deletedCount} orphaned series`);
    
    console.log('✅ Cleanup completed successfully');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

/**
 * Start scheduled cleanup
 */
function startCleanupScheduler() {
  const settings = Meteor.settings.private || {};
  const cleanupIntervalHours = get(settings, 'cleanup.intervalHours', 6); // 6 hours default
  const intervalMs = cleanupIntervalHours * 60 * 60 * 1000;
  
  console.log(`⏰ Starting cleanup scheduler (every ${cleanupIntervalHours} hours)`);
  
  // Run initial cleanup after 5 minutes
  Meteor.setTimeout(performCleanup, 5 * 60 * 1000);
  
  // Schedule regular cleanup
  cleanupInterval = Meteor.setInterval(performCleanup, intervalMs);
}

/**
 * Stop cleanup scheduler
 */
function stopCleanupScheduler() {
  if (cleanupInterval) {
    Meteor.clearInterval(cleanupInterval);
    cleanupInterval = null;
    console.log('⏹️ Cleanup scheduler stopped');
  }
}

// Initialize on startup
Meteor.startup(function() {
  const settings = Meteor.settings.private || {};
  const cleanupEnabled = get(settings, 'cleanup.enabled', true);
  
  if (cleanupEnabled) {
    startCleanupScheduler();
  } else {
    console.log('🚫 Cleanup scheduler disabled');
  }
});

// Cleanup on shutdown
process.on('SIGTERM', function() {
  stopCleanupScheduler();
});

process.on('SIGINT', function() {
  stopCleanupScheduler();
});