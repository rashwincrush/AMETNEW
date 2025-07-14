import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../utils/supabase';

const NetworkingGroupDetail = () => {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [joinLeaveLoading, setJoinLeaveLoading] = useState(false);

  // Assume user is available from context or props (replace as needed)
  const user = supabase.auth.user();

  useEffect(() => {
    const fetchGroup = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('networking_groups')
        .select('*')
        .eq('id', groupId)
        .single();
      if (error) {
        setError(error.message);
        setGroup(null);
      } else {
        setGroup(data);
        setError(null);
      }
      setLoading(false);
    };

    const fetchMembers = async () => {
      const { data, error } = await supabase
        .from('networking_group_members')
        .select('user_id, role')
        .eq('group_id', groupId);
      if (!error) {
        setMembers(data);
        if (user) {
          setIsMember(data.some((m) => m.user_id === user.id));
        }
      }
    };

    fetchGroup();
    fetchMembers();
  }, [groupId, user]);

  const handleJoinLeave = async () => {
    if (!user) return;
    setJoinLeaveLoading(true);
    if (isMember) {
      // Leave group
      const { error } = await supabase
        .from('networking_group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);
      if (!error) setIsMember(false);
    } else {
      // Join group
      const { error } = await supabase
        .from('networking_group_members')
        .insert([{ group_id: groupId, user_id: user.id, role: 'member' }]);
      if (!error) setIsMember(true);
    }
    setJoinLeaveLoading(false);
  };

  if (loading) return <div>Loading group...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!group) return <div>Group not found.</div>;

  return (
    <div>
      <h2>{group.name}</h2>
      <div>{group.description}</div>
      <div>Type: {group.type || 'N/A'}</div>
      <div>Visibility: {group.visibility}</div>
      <div>Created: {new Date(group.created_at).toLocaleString()}</div>
      <h3>Members ({members.length})</h3>
      <ul>
        {members.map((m) => (
          <li key={m.user_id}>{m.user_id} {m.role === 'admin' ? '(Admin)' : ''}</li>
        ))}
      </ul>
      {user && (
        <button onClick={handleJoinLeave} disabled={joinLeaveLoading}>
          {isMember ? 'Leave Group' : 'Join Group'}
        </button>
      )}
    </div>
  );
};

export default NetworkingGroupDetail;
