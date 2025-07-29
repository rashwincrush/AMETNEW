import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../utils/supabase';
import AlumniCard from './AlumniCard';
import AlumniListItem from './AlumniListItem';

const FilterInput = ({ label, name, value, onChange, placeholder }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700">
      {label}
    </label>
    <div className="mt-1">
      <input
        type="text"
        name={name}
        id={name}
        value={value}
        onChange={onChange}
        className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        placeholder={placeholder}
      />
    </div>
  </div>
);

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
  const [selectedLetter, setSelectedLetter] = useState('');
  const [approvedMentorIds, setApprovedMentorIds] = useState(new Set());

  const initialFilters = {
    graduationYear: '',
    batchYear: '',
    degree: '',
    location: '',
    industry: '',
    skills: '',
    achievement: '',
    department: '',
    company: ''
  };
  const [filters, setFilters] = useState(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('full_name,asc');

  const handleSearch = (e) => {
    if (e) e.preventDefault();
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
    setSelectedLetter('');
    setCurrentPage(1);
  };
  
  const handleClearSingleFilter = (filterName) => {
    setFilters(prev => ({ ...prev, [filterName]: '' }));
    setCurrentPage(1);
  };

  const handleLetterClick = (letter) => {
    setSelectedLetter(letter);
    setCurrentPage(1);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const totalPages = Math.ceil(totalAlumni / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const nextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };
  const prevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  useEffect(() => {
    const fetchApprovedMentorIds = async () => {
      try {
        const { data, error } = await supabase
          .from('mentors')
          .select('user_id')
          .eq('status', 'approved');
        
        if (error) throw error;

        setApprovedMentorIds(new Set(data.map(m => m.user_id)));
      } catch (error) {
        console.error('Error fetching approved mentor IDs:', error);
      }
    };

    fetchApprovedMentorIds();
  }, []);

  useEffect(() => {
    fetchAlumniData();
  }, [currentPage, itemsPerPage, filters, sortBy, searchTerm, selectedLetter, approvedMentorIds]);

  const fetchAlumniData = async () => {
    setLoading(true);
    setError(null);
    try {
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const columnMap = {
        graduationYear: 'graduation_year',
        batchYear: 'batch_year',
        degree: 'degree',
        location: 'location',
        industry: 'industry',
        skills: 'skills',
        achievement: 'achievements',
        department: 'department',
        company: 'current_company',
        achievements: 'achievements'
      };

      let query = supabase
        .from('profiles')
        .select('*', { count: 'exact' });

      if (selectedLetter) {
        query = query.ilike('full_name', `${selectedLetter}%`);
      }

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
          if (key === 'skills') {
            const skillsArray = filters[key].split(',').map(s => s.trim()).filter(Boolean);
            if (skillsArray.length > 0) {
              query = query.contains('skills', skillsArray);
            }
          } else if (key === 'achievement') {
            query = query.ilike('achievements', `'%"title":"%${filters.achievement}%"%`);
          } else if (key === 'batchYear' && !isNaN(filters[key])) {
            query = query.eq(columnName, parseInt(filters[key]));
          } else if (key === 'company') {
            query = query.or(`current_company.ilike.%${filters[key]}%,company_name.ilike.%${filters[key]}%`);
          } else {
            query = query.ilike(columnName, `%${filters[key]}%`);
          }
        }
      });

      const [sortField, sortOrder] = sortBy.split(',');
      query = query.order(sortField, { ascending: sortOrder === 'asc' });
      query = query.range(from, to);

      const { data, error: supabaseError, count } = await query;

      if (supabaseError) throw supabaseError;

      const transformedAlumni = data.map(profile => ({
        id: profile.id,
        name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
        email: profile.email || '',
        graduationYear: profile.graduation_year,
        batchYear: profile.batch_year,
        achievements: profile.achievements || [],
        department: profile.department || '',
        degree: profile.degree || '',
        currentPosition: profile.current_position || '',
        company: profile.current_company || profile.company_name || '',
        location: profile.location || '',
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
    } catch (err) {
      console.error('Error fetching alumni:', err);
      setError(`Failed to load alumni data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  return (
    <div className="bg-gray-50 p-4 sm:p-6 lg:p-8 min-h-screen">
      <header className="bg-white shadow-md rounded-xl p-6 mb-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Alumni Directory</h1>
            <p className="mt-2 text-gray-600">Connect with fellow AMET alumni worldwide.</p>
          </div>
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-3">
            <div className="relative w-full sm:max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                type="text"
                placeholder="Search by name, company, position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-4 py-2.5 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setViewMode('grid')} 
                className={`p-2.5 border rounded-lg shadow-sm transition-all ${viewMode === 'grid' ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'}`}
                aria-label="Grid view"
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`p-2.5 border rounded-lg shadow-sm transition-all ${viewMode === 'list' ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'}`}
                aria-label="List view"
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
              <button 
                onClick={() => setShowFilters(true)} 
                className={`inline-flex items-center px-4 py-2.5 border rounded-lg shadow-sm text-sm font-medium transition-all ${Object.values(filters).some(val => val !== '') ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
              >
                <FunnelIcon className={`-ml-1 mr-2 h-5 w-5 ${Object.values(filters).some(val => val !== '') ? 'text-indigo-500' : 'text-gray-400'}`} />
                Filters
                {Object.values(filters).some(val => val !== '') && (
                  <span className="ml-1.5 inline-flex items-center justify-center w-5 h-5 text-xs font-medium rounded-full bg-indigo-500 text-white">
                    {Object.values(filters).filter(val => val !== '').length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Active filters display */}
        {(Object.values(filters).some(val => val !== '') || selectedLetter) && (
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-2">
            <span className="text-sm font-medium text-gray-500 mr-1">Active filters:</span>
            {selectedLetter && (
              <div className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-100">
                <span>Starts with: {selectedLetter}</span>
                <button 
                  onClick={() => handleLetterClick('')} 
                  className="ml-1.5 text-indigo-400 hover:text-indigo-600"
                  aria-label={`Remove letter filter`}
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
            {Object.entries(filters).map(([key, value]) => {
              if (value === '') return null;
              return (
                <div key={key} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>: {value}
                  <button 
                    onClick={() => handleClearSingleFilter(key)} 
                    className="ml-1.5 text-indigo-400 hover:text-indigo-600"
                    aria-label={`Remove ${key} filter`}
                  >
                    <XMarkIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
            <button 
              onClick={handleClearFilters}
              className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </header>

      {/* Alphabetical Filter */}
      <div className="flex justify-center flex-wrap gap-2 mb-8">
        {alphabet.map(letter => (
          <button 
            key={letter} 
            onClick={() => handleLetterClick(letter)}
            className={`w-8 h-8 rounded-full text-sm font-semibold transition-all ${selectedLetter === letter ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'}`}>
            {letter}
          </button>
        ))}
        <button 
          onClick={() => handleLetterClick('')}
          className={`h-8 px-3 rounded-full text-sm font-semibold transition-all ${selectedLetter === '' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-700 hover:bg-indigo-100 hover:text-indigo-700'}`}>
          All
        </button>
      </div>

      {/* Filter Panel (Slide-over) */}
      {showFilters && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={() => setShowFilters(false)}></div>
      )}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${showFilters ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Filter Alumni</h2>
              <button 
                onClick={() => setShowFilters(false)} 
                className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
              >
                <XMarkIcon className="h-5 w-5 text-white" />
              </button>
            </div>
            <p className="text-blue-100 text-sm mt-1">Refine your search results</p>
          </div>
          
          {/* Filter Form */}
          <div className="flex-grow overflow-y-auto p-6 space-y-6">
            {/* Active Filters Summary */}
            {Object.values(filters).some(val => val !== '') && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Active Filters:</h3>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filters).map(([key, value]) => {
                    if (value === '') return null;
                    return (
                      <div key={key} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-100">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>: {value}
                        <button 
                          onClick={() => handleClearSingleFilter(key)} 
                          className="ml-1.5 text-indigo-400 hover:text-indigo-600"
                          aria-label={`Remove ${key} filter`}
                        >
                          <XMarkIcon className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Filter Groups */}
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-3">Education</h3>
                <div className="space-y-4">
                  <FilterInput label="Graduation Year" name="graduationYear" value={filters.graduationYear} onChange={handleFilterChange} placeholder="e.g., 2020" />
                  <FilterInput label="Batch" name="batchYear" value={filters.batchYear} onChange={handleFilterChange} placeholder="e.g., 2016" />
                  <FilterInput label="Degree" name="degree" value={filters.degree} onChange={handleFilterChange} placeholder="e.g., B.E." />
                  <FilterInput label="Department" name="department" value={filters.department} onChange={handleFilterChange} placeholder="e.g., Marine Engineering" />
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Professional</h3>
                <div className="space-y-4">
                  <FilterInput label="Company" name="company" value={filters.company} onChange={handleFilterChange} placeholder="e.g., Maersk" />
                  <FilterInput label="Industry" name="industry" value={filters.industry} onChange={handleFilterChange} placeholder="e.g., Shipping" />
                  <FilterInput label="Location" name="location" value={filters.location} onChange={handleFilterChange} placeholder="e.g., Chennai" />
                  <FilterInput label="Skills (comma-separated)" name="skills" value={filters.skills} onChange={handleFilterChange} placeholder="e.g., Python, SQL" />
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="border-t p-6 bg-gray-50">
            <div className="flex gap-4">
              <button 
                onClick={handleClearFilters} 
                className="w-full text-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Clear All
              </button>
              <button 
                onClick={() => { handleSearch(); setShowFilters(false); }} 
                className="w-full text-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Toggle and Results Info */}
      <div className="flex justify-between items-center mb-6">
        <div className="text-sm text-gray-600">
          {!loading && `Showing ${alumni.length > 0 ? indexOfFirstItem + 1 : 0}-${Math.min(indexOfLastItem, totalAlumni)} of ${totalAlumni} alumni`}
        </div>
      </div>

      {/* Main Content Area */}
      <main>
        {loading && <div className="text-center py-20 text-gray-500">Loading alumni...</div>}
        {error && 
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
            <div className="flex">
              <div className="py-1"><ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-3"/></div>
              <div>
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            </div>
          </div>
        }

        {!loading && !error && (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {alumni.map((alumnus) => (
                <AlumniCard 
                  key={alumnus.id} 
                  alumnus={{ ...alumnus, isMentor: approvedMentorIds.has(alumnus.id) }} 
                />
              ))}</div>
            ) : (
              <div className="space-y-4">
                {alumni.map((alumnus) => (
                <AlumniListItem 
                  key={alumnus.id} 
                  alumnus={{ ...alumnus, isMentor: approvedMentorIds.has(alumnus.id) }} 
                />
              ))}</div>
            )}
            {alumni.length === 0 && <div className="text-center py-20 text-gray-500">No alumni found matching your criteria.</div>}
          </>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="mt-10 flex flex-col items-center">
            <div className="border-t w-full pt-6">
              <div className="flex justify-between items-center">
                <button 
                  onClick={prevPage} 
                  disabled={currentPage === 1} 
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white shadow-sm transition-colors"
                >
                  <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Previous
                </button>
                
                <div className="hidden md:flex justify-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around current page
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
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-4 py-2 text-sm font-medium rounded-md ${currentPage === pageNum
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <div className="md:hidden text-sm font-medium text-gray-700 bg-white px-4 py-2 rounded-md border border-gray-300">
                  Page {currentPage} of {totalPages}
                </div>
                
                <button 
                  onClick={nextPage} 
                  disabled={currentPage === totalPages} 
                  className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white shadow-sm transition-colors"
                >
                  Next
                  <svg className="ml-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="mt-3 text-sm text-gray-500">
              Showing <span className="font-medium">{alumni.length > 0 ? indexOfFirstItem + 1 : 0}</span> to <span className="font-medium">{Math.min(indexOfLastItem, totalAlumni)}</span> of <span className="font-medium">{totalAlumni}</span> alumni
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AlumniDirectory;