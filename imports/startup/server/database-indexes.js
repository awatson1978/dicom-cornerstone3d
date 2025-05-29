import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

/**
 * Create MongoDB indexes for optimal DICOM data performance
 */
Meteor.startup(async function() {
  console.log('📊 Setting up database indexes...');
  
  try {
    // Get MongoDB collection handles
    const db = MongoInternals.defaultRemoteCollectionDriver().mongo.db;
    
    // Studies collection indexes
    const studiesCollection = db.collection('studies');
    await studiesCollection.createIndex({ studyUID: 1 }, { unique: true });
    await studiesCollection.createIndex({ patientId: 1 });
    await studiesCollection.createIndex({ studyDate: -1 });
    await studiesCollection.createIndex({ createdAt: -1 });
    await studiesCollection.createIndex({ 'metadata.modalities': 1 });
    
    // Series collection indexes
    const seriesCollection = db.collection('series');
    await seriesCollection.createIndex({ seriesUID: 1 }, { unique: true });
    await seriesCollection.createIndex({ studyUID: 1 });
    await seriesCollection.createIndex({ modality: 1 });
    await seriesCollection.createIndex({ seriesNumber: 1 });
    await seriesCollection.createIndex({ createdAt: -1 });
    
    // Instances collection indexes
    const instancesCollection = db.collection('instances');
    await instancesCollection.createIndex({ sopUID: 1 }, { unique: true });
    await instancesCollection.createIndex({ seriesUID: 1 });
    await instancesCollection.createIndex({ instanceNumber: 1 });
    await instancesCollection.createIndex({ createdAt: -1 });
    await instancesCollection.createIndex({ 'metadata.imageType': 1 });
    
    // User sessions collection indexes
    const userSessionsCollection = db.collection('userSessions');
    await userSessionsCollection.createIndex({ userId: 1 });
    await userSessionsCollection.createIndex({ sessionId: 1 }, { unique: true });
    await userSessionsCollection.createIndex({ lastActivity: 1 });
    await userSessionsCollection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours TTL
    
    console.log('✅ Database indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error creating database indexes:', error);
  }
});