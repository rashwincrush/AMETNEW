import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchPublicGroups } from '../../utils/supabase';
import { Users } from 'lucide-react';

// Skeleton loader component for a better loading experience
const GroupCardSkeleton = () => (
  <div className="border border-gray-200 rounded-lg p-4 shadow-sm animate-pulse">
    <div className="w-full h-32 bg-gray-300 rounded-md mb-4"></div>
    <div className="h-6 bg-gray-300 rounded w-3/4 mb-2"></div>
    <div className="h-4 bg-gray-300 rounded w-full mb-4"></div>
    <div className="flex items-center text-sm text-gray-500">
      <div className="h-4 bg-gray-300 rounded w-16"></div>
    </div>
  </div>
);

const GroupsList = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getGroups = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await fetchPublicGroups();
        if (error) {
          throw error;
        }
        setGroups(data || []);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching groups:", err);
      } finally {
        setLoading(false);
      }
    };

    getGroups();
  }, []);

  if (error) return <div className="text-red-500 text-center p-4">Error: {error}</div>;

  return (
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Networking Groups</h1>
        <Link 
          to="/groups/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform hover:scale-105"
        >
          Create Group
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 8 }).map((_, index) => <GroupCardSkeleton key={index} />)
        ) : groups.length > 0 ? (
          groups.map(group => (
            <div key={group.id} className="bg-white border border-gray-200 rounded-lg shadow-md overflow-hidden transform transition-transform hover:-translate-y-1 hover:shadow-xl">
              <Link to={`/groups/${group.id}`}>
                <div className="w-full h-32 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">Group Image</span>
                </div>
              </Link>
              <div className="p-4">
                <h2 className="text-xl font-bold text-gray-800 mb-2 truncate">
                  <Link to={`/groups/${group.id}`} className="hover:text-blue-600 transition-colors">
                    {group.name}
                  </Link>
                </h2>
                <p className="text-gray-600 text-sm mb-4 h-10 overflow-hidden">
                  {group.description || 'No description provided.'}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 border-t pt-3">
                    <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        <span>{group.group_members[0]?.count ?? 0} Members</span>
                    </div>
                    <span className={`font-semibold ${group.is_private ? 'text-red-500' : 'text-green-500'}`}>
                        {group.is_private ? 'Private' : 'Public'}
                    </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <h2 className="text-xl text-gray-600">No public groups found.</h2>
            <p className="text-gray-500 mt-2">Why not be the first to create one?</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupsList;
