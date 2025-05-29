import { Meteor } from 'meteor/meteor';

// Collections
import '/imports/api/dicom/collections';

// Methods  
import '/imports/api/dicom/methods';

// Publications
import '/imports/api/dicom/publications';

// HTTP routes for binary data
import './http-routes';

// Stream handler for file serving
import './stream-handler';

// File processor for DICOM parsing
import './file-processor';

console.log('🏥 DICOM server modules loaded');