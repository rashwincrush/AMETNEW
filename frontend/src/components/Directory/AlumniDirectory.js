import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  MapPinIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';

import { Collapse, Button, Box, TextField, Chip, Grid, Select, MenuItem, FormControl, InputLabel } from '@mui/material';

const AlumniDirectory = () => {
  const { isAuthenticated } = useAuth();
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalAlumni, setTotalAlumni] = useState(0);
  
  const initialFilters = {
    graduationYear: '',
    batchYear: '',
    degree: '',
    location: '',
    industry: '',
    skills: '',
    department: '',
    company: ''
  };
  const [filters, setFilters] = useState(initialFilters);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sortBy, setSortBy] = useState('created_at,desc');

  // --- Event Handlers ---
  const handleSearch = (e) => {
    if (e) e.preventDefault(); // Prevent form submission if called from a form
    setCurrentPage(1);
    fetchAlumniData();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    setSearchTerm('');
    setCurrentPage(1);
    // The useEffect will trigger a refetch
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // --- Pagination Logic ---
  const totalPages = Math.ceil(totalAlumni / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  useEffect(() => {
    fetchAlumniData();
  }, [currentPage, itemsPerPage, filters, sortBy]);

  const fetchAlumniData = async () => {
    setLoading(true);
    setError(null);
    
    // For performance monitoring
    const startTime = performance.now();
    
    try {
      // Using the imported supabase client (singleton pattern)
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      console.log(`Fetching alumni data: page ${currentPage}, items ${from}-${to}`);
      if (Object.values(filters).some(v => v)) {
        console.log('Active filters:', filters);
      }

      const columnMap = {
        graduationYear: 'graduation_year',
        batchYear: 'batch_year',
        degree: 'degree',
        location: 'location',
        industry: 'industry',
        skills: 'skills',
        department: 'department',
        company: 'current_company',
        achievements: 'achievements'
      };

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      if (searchTerm) {
        const textColumns = [
          'full_name', 'email', 'degree', 'location', 'department',
          'current_company', 'company_name', 'current_position', 'phone', 'phone_number'
        ];

        const numericColumns = ['graduation_year', 'batch_year', 'student_id'];

        const orConditions = textColumns.map(col => `${col}.ilike.%${searchTerm}%`);

        if (!isNaN(searchTerm) && searchTerm.trim() !== '') {
          numericColumns.forEach(col => {
            orConditions.push(`${col}.eq.${searchTerm}`);
          });
        }

        query = query.or(orConditions.join(','));
      }

      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          const columnName = columnMap[key] || key;
          // Special handling for specific filter types
          if (key === 'skills') {
            const skillsArray = filters[key].split(',').map(s => s.trim()).filter(Boolean);
            if (skillsArray.length > 0) {
              query = query.cs(columnName, skillsArray);
            }
          } 
          // Handle batch_year as an exact match if it's a number
          else if (key === 'batchYear' && !isNaN(filters[key])) {
            console.log(`Applying batch_year filter: ${filters[key]}`);
            query = query.eq(columnName, parseInt(filters[key]));
          }
          // Handle company with special case for both current_company and company_name fields
          else if (key === 'company') {
            console.log(`Applying company filter: ${filters[key]}`);
            query = query.or(`current_company.ilike.%${filters[key]}%,company_name.ilike.%${filters[key]}%`);
          }
          else {
            query = query.ilike(columnName, `%${filters[key]}%`);
          }
        }
      });

      const [sortField, sortOrder] = sortBy.split(',');
      query = query.order(sortField, { ascending: sortOrder === 'asc' });

      query = query.range(from, to);

      const { data, error: supabaseError, count } = await query;

      if (supabaseError) {
        console.error('Error fetching alumni:', supabaseError);
        
        // Handle specific error types
        if (supabaseError.code === 'PGRST301') {
          setError('Database timeout. Please try a more specific search.');
        } else if (supabaseError.code === '23505') {
          setError('Database constraint error. Please try again.');
        } else if (supabaseError.code?.startsWith('23')) {
          setError('Database integrity error. Please try again.');
        } else if (supabaseError.code === '42P01') {
          setError('Table not found. Please contact support.');
        } else if (supabaseError.message?.includes('network')) {
          setError('Network error. Please check your connection and try again.');
        } else if (supabaseError.message?.includes('rate limit')) {
          setError('Rate limit exceeded. Please try again in a few minutes.');
        } else {
          setError(`Failed to load alumni data: ${supabaseError.message || 'Unknown error'}`);
        }
        return;
      }

      const transformedAlumni = data.map(profile => ({
        id: profile.id,
        name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
        email: profile.email || '',
        graduationYear: profile.graduation_year,
        batchYear: profile.batch_year,
        achievements: profile.achievements || [],
        department: profile.department,
        degree: profile.degree || 'Not specified',
        currentPosition: profile.current_position || 'Not specified',
        company: profile.current_company || profile.company_name || 'Not specified',
        location: profile.location || 'Not specified',
        avatar: profile.avatar_url || '/static/Logo.png',
        skills: profile.skills || [],
        bio: profile.bio || '',
        verified: profile.is_verified || false,
        role: 'alumni',
        phone: profile.phone || profile.phone_number || '',
        linkedin: profile.linkedin_url || '',
        studentId: profile.student_id || '',
        isMentor: profile.is_mentor || false,
        isEmployer: profile.is_employer || false
      })).filter(alumni => alumni.name !== 'Unknown' || alumni.email);

      setAlumni(transformedAlumni);
      setTotalAlumni(count || 0);
      
      // Log performance metrics
      const endTime = performance.now();
      const queryTime = endTime - startTime;
      console.log(`Alumni query completed in ${queryTime.toFixed(2)}ms, found ${count || 0} results`);
      
    } catch (err) {
      console.error('An unexpected error occurred:', err);
      
      // Handle network errors and other common issues
      if (err.message?.includes('network') || err.message?.includes('fetch')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.message?.includes('timeout')) {
        setError('Request timed out. Please try again later.');
      } else {
        setError('An unexpected error occurred while fetching data.');
      }
    } finally {
      setLoading(false);
    }  
  };

  const AlumniCard = ({ alumnus }) => (
    <div className="bg-white rounded-lg p-6 shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col h-full border border-gray-200">
      <div className="flex items-start space-x-4">
        <div className="relative flex-shrink-0">
          <img 
            src={alumnus.avatar} 
            alt={alumnus.name}
            className="w-20 h-20 rounded-full object-cover"
          />
          {alumnus.verified && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 truncate">{alumnus.name}</h3>
            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{alumnus.graduationYear}</span>
          </div>
          <div className="mt-2">
            <p className="text-ocean-600 font-medium text-sm truncate">
              {alumnus.currentPosition} {alumnus.currentPosition && alumnus.company ? 'at' : ''} {alumnus.company}
            </p>
            <div className="text-sm text-gray-500 mt-1 truncate">
              <span>{alumnus.degree || 'N/A'}</span>
              {alumnus.department && (
                <>
                  <span className="mx-1">&bull;</span>
                  <span>{alumnus.department}</span>
                </>
              )}
            </div>
            <div className="text-xs text-gray-400">
              Batch of {alumnus.batchYear || 'N/A'}
              {alumnus.location && ` • ${alumnus.location}`}
            </div>
          </div>
        </div>
      </div>
      
      {/* Achievements Section */}
      {alumnus.achievements && alumnus.achievements.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Achievements</h4>
          <div className="space-y-2">
            {alumnus.achievements.slice(0, 3).map((achievement, index) => (
              <div key={index} className="flex items-start">
                <span className="text-blue-500 mr-2 mt-0.5">•</span>
                <span className="text-sm text-gray-600">{achievement}</span>
              </div>
            ))}
            {alumnus.achievements.length > 3 && (
              <div className="text-xs text-blue-600 mt-1">+{alumnus.achievements.length - 3} more</div>
            )}
          </div>
        </div>
      )}

      <div className="flex-grow mt-4 space-y-3">
        {alumnus.achievements && alumnus.achievements.length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-500">Key Achievements</h4>
            <ul className="list-disc list-inside mt-1 space-y-1">
              {alumnus.achievements.slice(0, 2).map((achievement, index) => (
                <li key={index} className="text-sm text-gray-600 truncate">{achievement}</li>
              ))}
            </ul>
          </div>
        )}
        {alumnus.skills && alumnus.skills.length > 0 && (
          <div className="pt-3 border-t border-gray-200">
            <h4 className="text-xs font-semibold text-gray-500">Skills</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {alumnus.skills.slice(0, 4).map((skill, index) => (
                <span key={index} className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">{skill}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-200">
        <Link to={`/directory/${alumnus.id}`} className="btn-ocean-outline w-full text-center px-3 py-2 rounded text-sm font-medium">View Profile</Link>
        <button className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700 transition-colors">Connect</button>
      </div>
    </div>
  );

  const AlumniListItem = ({ alumnus }) => (
    <div className="bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="relative flex-shrink-0">
            <img src={alumnus.avatar} alt={alumnus.name} className="w-16 h-16 rounded-full object-cover shadow-sm" />
            {alumnus.verified && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{alumnus.name}</h3>
            <p className="text-ocean-600 text-sm truncate">{alumnus.currentPosition} at {alumnus.company}</p>
            <p className="text-gray-500 text-sm truncate">{alumnus.degree || <span className="text-gray-400 italic">Not specified</span>} &bull; {alumnus.department || <span className="text-gray-400 italic">Not specified</span>}</p>
            {alumnus.achievements && alumnus.achievements.length > 0 && (
              <>
                <p className="text-xs text-gray-500 mt-1 truncate">
                  <span className="font-semibold">Achievements:</span> {alumnus.achievements.join(', ')}
                </p>
              </>
            )}
            <p className="text-xs text-gray-500 mt-1 truncate">
              <span className="font-semibold">Batch:</span> {alumnus.batchYear || <span className="text-gray-400 italic">Not specified</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-4 flex-shrink-0 ml-4">
          <span className="text-sm text-gray-500 hidden md:block">{alumnus.location}</span>
          <Link to={`/directory/${alumnus.id}`} className="btn-ocean-outline px-3 py-1 rounded text-sm font-medium">View Profile</Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Alumni Directory</h1>
        <p className="text-gray-600">Connect with fellow AMET alumni worldwide</p>
      </div>

      {/* Search and Filters */}
      <Box sx={{ background: '#fff', borderRadius: 3, boxShadow: 2, p: { xs: 2, md: 3 }, mb: 4 }}>
        <div className="flex flex-row items-center gap-3 w-full">
          <Box component="form" onSubmit={handleSearch} sx={{ flexGrow: 1, minWidth: 0 }}>
            <TextField
              fullWidth
              size="medium"
              variant="outlined"
              placeholder="Search by name, email, degree, company, location..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              InputProps={{
                startAdornment: <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-2" />,
                style: { 
                  borderRadius: 8,
                  height: 42
                },
              }}
            />
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, flexShrink: 0 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSearch}
              sx={{ 
                minWidth: 120, 
                height: 42,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.93rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                '&:hover': {
                  transform: 'translateY(-1px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                }
              }}
            >
              Search
            </Button>
            
            {/* Clear Filters Button - Only show when filters are active */}
            {(searchTerm || Object.values(filters).some(val => val)) && (
              <Button
                variant="outlined"
                color="secondary"
                onClick={handleClearFilters}
                sx={{ 
                  height: 42,
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '0.93rem',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}
              >
                Clear
              </Button>
            )}
            
            <Button
              variant="outlined"
              onClick={() => setShowAdvanced(val => !val)}
              sx={{
                height: 42,
                px: 2,
                borderRadius: 2,
                textTransform: 'none',
                fontSize: '0.93rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                color: '#1976d2',
                borderColor: 'rgba(25, 118, 210, 0.3)',
                backgroundColor: 'rgba(25, 118, 210, 0.03)',
                '&:hover': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  borderColor: 'rgba(25, 118, 210, 0.5)',
                  transform: 'translateY(-1px)',
                  boxShadow: '0 2px 8px rgba(25, 118, 210, 0.1)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                  boxShadow: 'none',
                },
              }}
              startIcon={
                <div className="relative">
                  <FunnelIcon className="w-5 h-5" />
                  {Object.keys(filters).some(key => 
                    key !== 'page' && key !== 'perPage' && key !== 'sortBy' && filters[key]
                  ) && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                  )}
                </div>
              }
            >
              {showAdvanced ? 'Hide Filters' : 'Filters'}
            </Button>
          </Box>
        </div>
        <Collapse in={showAdvanced}>
          <Box sx={{ mt: 3, p: 3, bgcolor: '#f9fafb', borderRadius: 2, boxShadow: 1, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
            <Grid container spacing={2} mb={2}>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Year of Completion"
                  name="graduationYear"
                  value={filters.graduationYear}
                  onChange={handleFilterChange}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputProps={{
                    startAdornment: <AcademicCapIcon className="w-5 h-5 text-gray-400 mr-2" />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Batch"
                  name="batchYear"
                  value={filters.batchYear}
                  onChange={handleFilterChange}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputProps={{
                    startAdornment: <AcademicCapIcon className="w-5 h-5 text-gray-400 mr-2" />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Degree"
                  name="degree"
                  value={filters.degree}
                  onChange={handleFilterChange}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputProps={{
                    startAdornment: <AcademicCapIcon className="w-5 h-5 text-gray-400 mr-2" />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Department"
                  name="department"
                  value={filters.department}
                  onChange={handleFilterChange}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputProps={{
                    startAdornment: <AcademicCapIcon className="w-5 h-5 text-gray-400 mr-2" />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Company"
                  name="company"
                  value={filters.company}
                  onChange={handleFilterChange}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputProps={{
                    startAdornment: <BriefcaseIcon className="w-5 h-5 text-gray-400 mr-2" />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Location"
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputProps={{
                    startAdornment: <MapPinIcon className="w-5 h-5 text-gray-400 mr-2" />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Industry"
                  name="industry"
                  value={filters.industry}
                  onChange={handleFilterChange}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputProps={{
                    startAdornment: <BriefcaseIcon className="w-5 h-5 text-gray-400 mr-2" />
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  label="Skills (comma-separated)"
                  name="skills"
                  value={filters.skills}
                  onChange={handleFilterChange}
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputProps={{
                    startAdornment: <ExclamationTriangleIcon className="w-5 h-5 text-gray-400 mr-2" />
                  }}
                />
              </Grid>
            </Grid>
            <div className="flex justify-end mt-2">
              <Button
                variant="contained"
                color="primary"
                onClick={handleClearFilters}
                sx={{ fontWeight: 500 }}
              >
                Clear All Filters
              </Button>
            </div>
          </Box>
        </Collapse>
      </Box>

      {/* Filter Chips: Show active filters as chips */}
      {Object.entries(filters).some(([k, v]) => v) && (
        <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {Object.entries(filters).map(([key, value]) => (
            value ? (
              <Chip
                key={key}
                label={`${key.replace(/([A-Z])/g, ' $1')}: ${value}`}
                onDelete={() => setFilters(f => ({ ...f, [key]: '' }))}
                color="primary"
                sx={{ textTransform: 'capitalize' }}
              />
            ) : null
          ))}
        </Box>
      )}

      {/* Results Count and Controls */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, mt: 2, flexWrap: 'wrap', gap: 2 }}>
        <p className="text-gray-700 font-medium">
          Showing <span className="font-semibold">{totalAlumni > 0 ? indexOfFirstItem + 1 : 0}-{indexOfLastItem}</span> of <span className="font-semibold">{totalAlumni}</span> alumni
        </p>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Per Page</InputLabel>
            <Select
              value={itemsPerPage}
              label="Per Page"
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={30}>30</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              label="Sort By"
              onChange={(e) => setSortBy(e.target.value)}
            >
              <MenuItem value="full_name,asc">Name (A-Z)</MenuItem>
              <MenuItem value="full_name,desc">Name (Z-A)</MenuItem>
              <MenuItem value="graduation_year,desc">Graduation (Newest)</MenuItem>
              <MenuItem value="graduation_year,asc">Graduation (Oldest)</MenuItem>
              <MenuItem value="created_at,desc">Recently Added</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Alumni Grid/List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading alumni directory...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchAlumniData}
            className="btn-ocean px-4 py-2 rounded-lg"
          >
            Try Again
          </button>
        </div>
      ) : alumni.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AcademicCapIcon className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-600 mb-4">No alumni found</p>
          <p className="text-gray-500 text-sm">Be the first to join the AMET Alumni network!</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
        }>
          {alumni.map((alumnus) => 
            viewMode === 'grid' 
              ? <AlumniCard key={alumnus.id} alumnus={alumnus} />
              : <AlumniListItem key={alumnus.id} alumnus={alumnus} />
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2">
          <button 
            onClick={prevPage}
            disabled={currentPage === 1}
            className={`px-3 py-2 border border-gray-300 rounded-lg text-sm ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
          >
            Previous
          </button>
          
          {/* Display page numbers */}
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            // Logic to show pages around current page
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (currentPage <= 3) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => paginate(pageNum)}
                className={`px-3 py-2 ${currentPage === pageNum 
                  ? 'bg-ocean-500 text-white' 
                  : 'border border-gray-300 hover:bg-gray-50'} rounded-lg text-sm`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button 
            onClick={nextPage}
            disabled={currentPage === totalPages}
            className={`px-3 py-2 border border-gray-300 rounded-lg text-sm ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default AlumniDirectory;