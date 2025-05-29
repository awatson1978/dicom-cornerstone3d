import { Meteor } from 'meteor/meteor';
import { init as cs3DInit } from '@cornerstonejs/core';
import { init as cs3DToolsInit } from '@cornerstonejs/tools';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import dicomParser from 'dicom-parser';

let isInitialized = false;

/**
 * Initialize Cornerstone3D with optimized settings for medical imaging
 */
export async function initializeCornerstone3D() {
  if (isInitialized) {
    console.log('✅ Cornerstone3D already initialized');
    return true;
  }

  try {
    console.log('🎯 Initializing Cornerstone3D...');
    
    const settings = Meteor.settings.public;
    const gpuEnabled = settings?.dicom?.enableGPU !== false;
    const workerCount = settings?.dicom?.workerCount || 4;
    const concurrentRequests = settings?.dicom?.concurrentRequests || 6;
    
    // Initialize Cornerstone3D Core
    await cs3DInit({
      gpuTier: gpuEnabled ? undefined : 0, // 0 = force CPU rendering
      detectGPUDevice: gpuEnabled,
      strictZSpacingForVolumeViewport: false,
    });
    
    console.log(`📊 GPU Acceleration: ${gpuEnabled ? 'enabled' : 'disabled'}`);
    
    // Initialize Tools
    cs3DToolsInit();
    
    // Configure DICOM Image Loader
    cornerstoneDICOMImageLoader.external.cornerstone = window.cornerstone3D || window.cornerstone;
    cornerstoneDICOMImageLoader.external.dicomParser = dicomParser;
    
    // Configure Web Workers for image loading
    const config = {
      maxWebWorkers: workerCount,
      startWebWorkersOnDemand: true,
      taskConfiguration: {
        decodeTask: {
          initializeCodecsOnStartup: true,
          usePDFJS: false,
          strict: false,
        },
      },
    };
    
    // Web Worker paths (adjust for your WASM location)
    cornerstoneDICOMImageLoader.webWorkerManager.initialize({
      ...config,
      webWorkerPath: '/wasm/cornerstoneWADOImageLoader/cornerstoneWADOImageLoaderWebWorker.min.js',
      taskConfiguration: {
        ...config.taskConfiguration,
        decodeTask: {
          ...config.taskConfiguration.decodeTask,
          codecsPath: '/wasm/cornerstoneWADOImageLoader/cornerstoneWADOImageLoaderCodecs.min.js',
        },
      },
    });
    
    // Configure image loading settings
    cornerstoneDICOMImageLoader.configure({
      useWebWorkers: true,
      decodeConfig: {
        convertFloatPixelDataToInt: false,
        use16BitDataType: true,
      },
      beforeSend: function(xhr) {
        // Configure request timeouts and headers
        xhr.timeout = 30000; // 30 second timeout
        xhr.setRequestHeader('Cache-Control', 'no-cache');
      },
    });
    
    // Set maximum number of simultaneous requests
    cornerstoneDICOMImageLoader.webWorkerManager.setMaximumNumberOfWebWorkers(workerCount);
    cornerstoneDICOMImageLoader.configure({
      maxConcurrentRequests: concurrentRequests,
    });
    
    console.log(`👥 Web Workers: ${workerCount}`);
    console.log(`🔗 Concurrent Requests: ${concurrentRequests}`);
    
    // Register image loaders
    if (window.cornerstone3D) {
      const { imageLoader } = window.cornerstone3D;
      
      // Register DICOM loader
      imageLoader.registerImageLoader('wadouri', cornerstoneDICOMImageLoader.wadouri.loadImage);
      imageLoader.registerImageLoader('dicomweb', cornerstoneDICOMImageLoader.wadors.loadImage);
      imageLoader.registerImageLoader('dicomfile', cornerstoneDICOMImageLoader.wadouri.loadImage);
    }
    
    isInitialized = true;
    console.log('✅ Cornerstone3D initialized successfully');
    
    return true;
    
  } catch (error) {
    console.error('❌ Failed to initialize Cornerstone3D:', error);
    
    // Fallback initialization without GPU
    if (error.message.includes('GPU') || error.message.includes('WebGL')) {
      console.log('🔄 Retrying without GPU acceleration...');
      try {
        await cs3DInit({ gpuTier: 0 });
        cs3DToolsInit();
        isInitialized = true;
        console.log('✅ Cornerstone3D initialized in CPU mode');
        return true;
      } catch (fallbackError) {
        console.error('❌ CPU fallback also failed:', fallbackError);
      }
    }
    
    return false;
  }
}

/**
 * Get current Cornerstone3D initialization status
 */
export function isCornerstone3DInitialized() {
  return isInitialized;
}

/**
 * Get Cornerstone3D configuration info
 */
export function getCornerstone3DInfo() {
  if (!isInitialized) {
    return null;
  }
  
  const settings = Meteor.settings.public;
  
  return {
    initialized: true,
    gpuEnabled: settings?.dicom?.enableGPU !== false,
    workerCount: settings?.dicom?.workerCount || 4,
    concurrentRequests: settings?.dicom?.concurrentRequests || 6,
    version: window.cornerstone3D?.VERSION || 'unknown',
  };
}