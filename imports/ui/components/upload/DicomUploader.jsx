import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Alert,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

import { useDicom } from '/imports/ui/contexts/DicomContext';

/**
 * DICOM file uploader component with drag-and-drop support
 */
export function DicomUploader({ open, onClose, onUploadComplete }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  const { uploadFiles, uploadProgress } = useDicom();
  
  /**
   * Handle file drop
   */
  const onDrop = useCallback(function(acceptedFiles) {
    // Filter for DICOM files and directories
    const dicomFiles = acceptedFiles.filter(function(file) {
      // Accept .dcm files or files without extension (common for DICOM)
      return file.name.toLowerCase().endsWith('.dcm') || 
             !file.name.includes('.') ||
             file.type === 'application/dicom';
    });
    
    setSelectedFiles(prevFiles => [...prevFiles, ...dicomFiles]);
    setUploadError(null);
  }, []);
  
  /**
   * Handle directory selection (for .sphr folders)
   */
  async function handleDirectorySelect() {
    try {
      // Use modern File System Access API if available
      if ('showDirectoryPicker' in window) {
        const dirHandle = await window.showDirectoryPicker();
        const files = [];
        
        // Recursively collect .dcm files
        async function collectFiles(dirHandle, path = '') {
          for await (const [name, handle] of dirHandle) {
            const fullPath = path ? `${path}/${name}` : name;
            
            if (handle.kind === 'file' && (name.toLowerCase().endsWith('.dcm') || !name.includes('.'))) {
              const file = await handle.getFile();
              // Add directory path info
              Object.defineProperty(file, 'webkitRelativePath', {
                value: fullPath,
                writable: false,
              });
              files.push(file);
            } else if (handle.kind === 'directory') {
              await collectFiles(handle, fullPath);
            }
          }
        }
        
        await collectFiles(dirHandle);
        setSelectedFiles(prevFiles => [...prevFiles, ...files]);
        
      } else {
        // Fallback for browsers without File System Access API
        const input = document.createElement('input');
        input.type = 'file';
        input.webkitdirectory = true;
        input.multiple = true;
        
        input.onchange = function(event) {
          const files = Array.from(event.target.files).filter(function(file) {
            return file.name.toLowerCase().endsWith('.dcm') || !file.name.includes('.');
          });
          setSelectedFiles(prevFiles => [...prevFiles, ...files]);
        };
        
        input.click();
      }
    } catch (error) {
      console.error('Error selecting directory:', error);
      setUploadError('Failed to select directory: ' + error.message);
    }
  }
  
  /**
   * Remove file from selection
   */
  function removeFile(index) {
    setSelectedFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
  }
  
  /**
   * Handle upload
   */
  async function handleUpload() {
    if (selectedFiles.length === 0) {
      setUploadError('Please select files to upload');
      return;
    }
    
    try {
      setIsUploading(true);
      setUploadError(null);
      
      const result = await uploadFiles(selectedFiles, {
        batchSize: 5, // Upload 5 files at a time
      });
      
      if (onUploadComplete) {
        onUploadComplete(result);
      }
      
      // Clear files on success
      if (result.success) {
        setSelectedFiles([]);
      }
      
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Upload failed: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  }
  
  /**
   * Handle dialog close
   */
  function handleClose() {
    if (!isUploading) {
      setSelectedFiles([]);
      setUploadError(null);
      onClose();
    }
  }
  
  /**
   * Format file size
   */
  function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  /**
   * Get file type icon
   */
  function getFileIcon(file) {
    if (file.webkitRelativePath && file.webkitRelativePath.includes('/')) {
      return <FolderIcon color="action" />;
    }
    return <FileIcon color="action" />;
  }
  
  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/dicom': ['.dcm'],
      'application/octet-stream': [], // DICOM files often have no extension
    },
    multiple: true,
  });
  
  const totalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
  
  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={isUploading}
    >
      <DialogTitle>
        Upload DICOM Files
        {selectedFiles.length > 0 && (
          <Chip
            label={`${selectedFiles.length} files (${formatFileSize(totalSize)})`}
            size="small"
            sx={{ ml: 2 }}
          />
        )}
      </DialogTitle>
      
      <DialogContent dividers>
        {uploadError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {uploadError}
          </Alert>
        )}
        
        {/* Upload Progress */}
        {uploadProgress && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" gutterBottom>
              Uploading: {uploadProgress.currentFile}
            </Typography>
            <LinearProgress 
              variant="determinate" 
              value={uploadProgress.percentage} 
              sx={{ mb: 1 }}
            />
            <Typography variant="caption" color="text.secondary">
              {uploadProgress.current} of {uploadProgress.total} files ({uploadProgress.percentage}%)
            </Typography>
          </Box>
        )}
        
        {/* Dropzone */}
        <Box
          {...getRootProps()}
          sx={{
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            borderRadius: 1,
            p: 3,
            textAlign: 'center',
            cursor: 'pointer',
            bgcolor: isDragActive ? 'action.hover' : 'background.default',
            mb: 2,
          }}
        >
          <input {...getInputProps()} />
          <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Drop files here' : 'Drag & drop DICOM files here'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            or click to browse files (.dcm format)
          </Typography>
        </Box>
        
        {/* Directory Selection */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Button
            variant="outlined"
            startIcon={<FolderIcon />}
            onClick={handleDirectorySelect}
            disabled={isUploading}
          >
            Select Folder (.sphr directory)
          </Button>
        </Box>
        
        {/* File List */}
        {selectedFiles.length > 0 && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Selected Files ({selectedFiles.length})
            </Typography>
            <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
              {selectedFiles.map(function(file, index) {
                return (
                  <ListItem
                    key={index}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={function() { removeFile(index); }}
                        disabled={isUploading}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
                      {getFileIcon(file)}
                    </Box>
                    <ListItemText
                      primary={file.webkitRelativePath || file.name}
                      secondary={formatFileSize(file.size)}
                    />
                  </ListItem>
                );
              })}
            </List>
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button 
          onClick={handleClose} 
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={selectedFiles.length === 0 || isUploading}
          startIcon={<UploadIcon />}
        >
          {isUploading ? 'Uploading...' : `Upload ${selectedFiles.length} Files`}
        </Button>
      </DialogActions>
    </Dialog>
  );
}