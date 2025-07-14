import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { Link } from 'react-router-dom';

const NetworkingGroupsDirectory = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('networking_groups')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) {
        setError(error.message);
        setGroups([]);
      } else {
        setGroups(data);
        setError(null);
      }
      setLoading(false);
    };
    fetchGroups();
  }, []);

  if (loading) return <div>Loading networking groups...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Networking Groups Directory</h2>
      {groups.length === 0 ? (
        <div>No groups found.</div>
      ) : (
        <ul>
          {groups.map((group) => (
            <li key={group.id}>
              <Link to={`/networking-groups/${group.id}`}>{group.name}</Link>
              <div>{group.description}</div>
              <div>Type: {group.type || 'N/A'}</div>
              <div>Visibility: {group.visibility}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NetworkingGroupsDirectory;
