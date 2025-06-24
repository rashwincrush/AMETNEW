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

const AlumniDirectory = () => {
  const { isAuthenticated } = useAuth();
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [searchQuery, setSearchQuery] = useState('');
  const [alumni, setAlumni] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20); // Display exactly 20 items per page
  const [filters, setFilters] = useState({
    graduationYear: '',
    degree: '',
    location: '',
    industry: '',
    skills: ''
  });

  useEffect(() => {
    fetchAlumniData();
  }, []);

  const fetchAlumniData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { supabase } = await import('../../utils/supabase');
      
      const { data, error: supabaseError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (supabaseError) {
        console.error('Error fetching alumni:', supabaseError);
        setError('Failed to load alumni data');
        return;
      }

      console.log('Fetched alumni from Supabase:', data);
      
      // Transform data to match component structure  
      const transformedAlumni = data.map(profile => ({
        id: profile.id,
        name: profile.full_name || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Unknown',
        email: profile.email || '',
        graduationYear: profile.graduation_year,
        degree: profile.degree || 'Not specified',
        currentPosition: profile.current_position || 'Not specified',
        company: profile.current_company || profile.company_name || 'Not specified',
        location: profile.location || 'Not specified',
        avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || profile.email || 'User')}&background=3B82F6&color=fff`,
        skills: profile.skills || [],
        bio: profile.bio || '',
        verified: profile.is_verified || false,
        role: 'alumni',
        phone: profile.phone || profile.phone_number || '',
        linkedin: profile.linkedin_url || '',
        studentId: profile.student_id || '',
        department: profile.department || '',
        isMentor: profile.is_mentor || false,
        isEmployer: profile.is_employer || false
      })).filter(alumni => alumni.name !== 'Unknown' || alumni.email);

      setAlumni(transformedAlumni);
    } catch (err) {
      console.error('An unexpected error occurred:', err);
      setError('An unexpected error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const AlumniCard = ({ alumnus }) => (
    <div className="glass-card rounded-lg p-6 card-hover">
      <div className="flex items-start space-x-4">
        <div className="relative">
          <img 
            src={alumnus.avatar} 
            alt={alumnus.name}
            className="w-16 h-16 rounded-full object-cover"
          />
          {alumnus.verified && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">{alumnus.name}</h3>
            <span className="text-xs text-gray-500">Class of {alumnus.graduationYear}</span>
          </div>
          <p className="text-ocean-600 font-medium text-sm">{alumnus.currentPosition}</p>
          <p className="text-gray-600 text-sm">{alumnus.company}</p>
          
          <div className="flex items-center text-sm text-gray-500 mt-2">
            <MapPinIcon className="w-4 h-4 mr-1" />
            <span>{alumnus.location}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 mt-1">
            <AcademicCapIcon className="w-4 h-4 mr-1" />
            <span>{alumnus.degree}</span>
          </div>
          
          <div className="flex flex-wrap gap-1 mt-3">
            {alumnus.skills.slice(0, 3).map((skill, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-ocean-100 text-ocean-800 rounded text-xs"
              >
                {skill}
              </span>
            ))}
            {alumnus.skills.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                +{alumnus.skills.length - 3}
              </span>
            )}
          </div>
          
          <div className="flex space-x-2 mt-4">
            <Link 
              to={`/directory/${alumnus.id}`}
              className="btn-ocean-outline px-3 py-1 rounded text-xs"
            >
              View Profile
            </Link>
            <button className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200">
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const AlumniListItem = ({ alumnus }) => (
    <div className="glass-card rounded-lg p-4 card-hover">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <img 
              src={alumnus.avatar} 
              alt={alumnus.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            {alumnus.verified && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900">{alumnus.name}</h3>
            <p className="text-ocean-600 text-sm">{alumnus.currentPosition} at {alumnus.company}</p>
            <p className="text-gray-500 text-sm">{alumnus.degree} • Class of {alumnus.graduationYear}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{alumnus.location}</span>
          <Link 
            to={`/directory/${alumnus.id}`}
            className="btn-ocean-outline px-3 py-1 rounded text-sm"
          >
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );

  // Filter alumni based on search query
  const filteredAlumni = alumni.filter(alumnus => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    return (
      alumnus.name?.toLowerCase().includes(searchLower) ||
      alumnus.company?.toLowerCase().includes(searchLower) ||
      alumnus.location?.toLowerCase().includes(searchLower) ||
      alumnus.currentPosition?.toLowerCase().includes(searchLower) ||
      (alumnus.skills?.some(skill => typeof skill === 'string' && skill.toLowerCase().includes(searchLower)) || false)
    );
  });
  
  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAlumni.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredAlumni.length / itemsPerPage);
  
  // Handle page changes
  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const prevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Alumni Directory</h1>
        <p className="text-gray-600">Connect with fellow AMET alumni worldwide</p>
      </div>

      {/* Search and Filters */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input w-full pl-10 pr-4 py-2 rounded-lg"
                placeholder="Search by name, company, skills, or location..."
              />
            </div>
          </div>
          
          {/* Filter Button */}
          <button className="btn-ocean-outline px-4 py-2 rounded-lg flex items-center">
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filters
          </button>
          
          {/* View Toggle */}
          <div className="flex border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${viewMode === 'grid' ? 'bg-ocean-500 text-white' : 'text-gray-600'}`}
            >
              <Squares2X2Icon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${viewMode === 'list' ? 'bg-ocean-500 text-white' : 'text-gray-600'}`}
            >
              <ListBulletIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="px-3 py-1 bg-ocean-100 text-ocean-800 rounded-full text-sm cursor-pointer hover:bg-ocean-200">
            All Alumni
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm cursor-pointer hover:bg-gray-200">
            Naval Architecture
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm cursor-pointer hover:bg-gray-200">
            Marine Engineering
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm cursor-pointer hover:bg-gray-200">
            MBA
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm cursor-pointer hover:bg-gray-200">
            Recent Graduates
          </span>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-gray-600">
          Showing <span className="font-medium">{indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredAlumni.length)}</span> of <span className="font-medium">{filteredAlumni.length}</span> alumni
        </p>
        <div className="flex items-center space-x-4">
          <select 
            className="form-input px-3 py-1 rounded text-sm"
            value={itemsPerPage}
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1); // Reset to first page when changing items per page
            }}
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="30">30 per page</option>
            <option value="50">50 per page</option>
          </select>
          <select className="form-input px-3 py-1 rounded text-sm">
            <option>Sort by Name</option>
            <option>Sort by Graduation Year</option>
            <option>Sort by Location</option>
            <option>Sort by Company</option>
          </select>
        </div>
      </div>

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
          {currentItems.map((alumnus) => 
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