import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

/**
 * Studies collection for DICOM study metadata
 */
export const StudiesCollection = new Mongo.Collection('studies');

/**
 * Study schema validation
 */
export const StudySchema = {
  studyUID: String,
  studyInstanceUID: String,
  patientId: String,
  patientName: String,
  patientBirthDate: Match.Maybe(Date),
  patientSex: Match.Maybe(String),
  studyDate: Match.Maybe(Date),
  studyTime: Match.Maybe(String),
  studyDescription: Match.Maybe(String),
  accessionNumber: Match.Maybe(String),
  referringPhysician: Match.Maybe(String),
  institutionName: Match.Maybe(String),
  seriesCount: Match.Maybe(Number),
  instanceCount: Match.Maybe(Number),
  modalities: Match.Maybe([String]),
  metadata: Match.Maybe(Object),
  createdAt: Date,
  updatedAt: Date,
};

/**
 * Validate study document
 */
export function validateStudy(study) {
  check(study, StudySchema);
}

/**
 * Create study document from DICOM metadata
 */
export function createStudyFromDicom(dicomMetadata) {
  const now = new Date();
  
  return {
    studyUID: dicomMetadata.studyInstanceUID,
    studyInstanceUID: dicomMetadata.studyInstanceUID,
    patientId: dicomMetadata.patientID || 'Unknown',
    patientName: dicomMetadata.patientName || 'Unknown Patient',
    patientBirthDate: dicomMetadata.patientBirthDate ? new Date(dicomMetadata.patientBirthDate) : null,
    patientSex: dicomMetadata.patientSex || null,
    studyDate: dicomMetadata.studyDate ? new Date(dicomMetadata.studyDate) : null,
    studyTime: dicomMetadata.studyTime || null,
    studyDescription: dicomMetadata.studyDescription || null,
    accessionNumber: dicomMetadata.accessionNumber || null,
    referringPhysician: dicomMetadata.referringPhysiciansName || null,
    institutionName: dicomMetadata.institutionName || null,
    seriesCount: 0,
    instanceCount: 0,
    modalities: [],
    metadata: dicomMetadata,
    createdAt: now,
    updatedAt: now,
  };
}

// Global reference for imports
if (Meteor.isServer) {
  global.Studies = StudiesCollection;
}
if (Meteor.isClient) {
  window.Studies = StudiesCollection;
}