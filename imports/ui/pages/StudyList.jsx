import React, { useState } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  InputAdornment,
  Button,
  Card,
  CardContent,
  Grid,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  CloudUpload as UploadIcon,
  Refresh as RefreshIcon,
  Person as PatientIcon,
  CalendarToday as CalendarIcon,
  MedicalServices as StudyIcon,
} from '@mui/icons-material';
import { get } from 'lodash';
import moment from 'moment';

import { useDicom } from '/imports/ui/contexts/DicomContext';
import { Loading } from '/imports/ui/components/common/Loading';

/**
 * Study list page component
 */
export default function StudyList({ onStudySelect }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('studyDate');
  const [sortOrder, setSortOrder] = useState('desc');
  
  const { 
    studies, 
    loading, 
    error, 
    hasStudies, 
    loadStudies, 
    selectStudy 
  } = useDicom();
  
  /**
   * Handle study selection
   */
  function handleStudySelect(study) {
    selectStudy(study);
    if (onStudySelect) {
      onStudySelect(study);
    }
  }
  
  /**
   * Filter studies based on search term
   */
  const filteredStudies = studies.filter(function(study) {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      get(study, 'patientName', '').toLowerCase().includes(searchLower) ||
      get(study, 'patientId', '').toLowerCase().includes(searchLower) ||
      get(study, 'studyDescription', '').toLowerCase().includes(searchLower) ||
      get(study, 'accessionNumber', '').toLowerCase().includes(searchLower)
    );
  });
  
  /**
   * Sort studies
   */
  const sortedStudies = [...filteredStudies].sort(function(a, b) {
    let aValue = get(a, sortBy, '');
    let bValue = get(b, sortBy, '');
    
    // Handle dates
    if (sortBy === 'studyDate') {
      aValue = moment(aValue).valueOf();
      bValue = moment(bValue).valueOf();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });
  
  /**
   * Format date for display
   */
  function formatDate(date) {
    if (!date) return 'Unknown';
    return moment(date).format('MMM DD, YYYY');
  }
  
  /**
   * Get modality color
   */
  function getModalityColor(modality) {
    const colors = {
      'CT': 'primary',
      'MR': 'secondary',
      'XR': 'success',
      'US': 'warning',
      'NM': 'info',
      'PET': 'error',
    };
    return colors[modality] || 'default';
  }
  
  if (loading) {
    return <Loading message="Loading studies..." />;
  }
  
  if (error) {
    return (
      <Box p={3} textAlign="center">
        <Typography variant="h6" color="error" gutterBottom>
          Error Loading Studies
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          {error}
        </Typography>
        <Button variant="contained" onClick={loadStudies} startIcon={<RefreshIcon />}>
          Retry
        </Button>
      </Box>
    );
  }
  
  if (!hasStudies) {
    return (
      <Box p={3} textAlign="center">
        <Box mb={3}>
          <StudyIcon sx={{ fontSize: 64, color: 'text.secondary' }} />
        </Box>
        <Typography variant="h5" gutterBottom>
          No Studies Available
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Upload DICOM files to get started with medical image viewing.
        </Typography>
        <Button 
          variant="contained" 
          size="large" 
          startIcon={<UploadIcon />}
          onClick={function() {
            // This would typically open the upload dialog
            // The parent component handles this
          }}
        >
          Upload DICOM Files
        </Button>
      </Box>
    );
  }
  
  return (
    <Box p={3}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Study List
        </Typography>
        <Box display="flex" gap={1}>
          <Tooltip title="Refresh studies">
            <IconButton onClick={loadStudies}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      {/* Search and Filters */}
      <Box mb={3}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search by patient name, ID, study description, or accession number..."
          value={searchTerm}
          onChange={function(e) { setSearchTerm(e.target.value); }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      
      {/* Study Statistics */}
      <Grid container spacing={2} mb={3}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PatientIcon sx={{ mr: 1, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6">{studies.length}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Studies
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <CalendarIcon sx={{ mr: 1, color: 'secondary.main' }} />
                <Box>
                  <Typography variant="h6">{filteredStudies.length}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Filtered Results
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <StudyIcon sx={{ mr: 1, color: 'success.main' }} />
                <Box>
                  <Typography variant="h6">
                    {studies.reduce((sum, study) => sum + get(study, 'seriesCount', 0), 0)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Series
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Studies Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Patient</TableCell>
              <TableCell>Study Date</TableCell>
              <TableCell>Study Description</TableCell>
              <TableCell>Modality</TableCell>
              <TableCell>Series</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedStudies.map(function(study, index) {
              return (
                <TableRow 
                  key={study.studyUID || index}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={function() { handleStudySelect(study); }}
                >
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="medium">
                        {get(study, 'patientName', 'Unknown Patient')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {get(study, 'patientId', 'Unknown')}
                      </Typography>
                    </Box>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(study.studyDate)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {get(study, 'studyTime', '')}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {get(study, 'studyDescription', 'No description')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Acc: {get(study, 'accessionNumber', 'N/A')}
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    {get(study, 'modalities', []).map(function(modality, idx) {
                      return (
                        <Chip
                          key={idx}
                          label={modality}
                          size="small"
                          color={getModalityColor(modality)}
                          sx={{ mr: 0.5, mb: 0.5 }}
                        />
                      );
                    })}
                  </TableCell>
                  
                  <TableCell>
                    <Typography variant="body2">
                      {get(study, 'seriesCount', 0)} series
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {get(study, 'instanceCount', 0)} images
                    </Typography>
                  </TableCell>
                  
                  <TableCell>
                    <Tooltip title="View study">
                      <IconButton 
                        size="small"
                        onClick={function(e) {
                          e.stopPropagation();
                          handleStudySelect(study);
                        }}
                      >
                        <ViewIcon />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {filteredStudies.length === 0 && searchTerm && (
        <Box textAlign="center" py={4}>
          <Typography variant="h6" color="text.secondary">
            No studies match your search
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search terms
          </Typography>
        </Box>
      )}
    </Box>
  );
}