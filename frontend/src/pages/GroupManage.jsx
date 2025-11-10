import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  fetchGroupDetails,
  updateGroupDetails,
  fetchGroupMembers,
  setMemberRole,
  removeGroupMember,
  getMyGroupMembership,
  addGroupMember
} from '../utils/supabase';
import { supabase } from '../utils/supabase';
import { ArrowLeft, Shield, UserMinus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { canManageGroup } from '../utils/acl';

export default function GroupManage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile, user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [isSiteAdmin, setIsSiteAdmin] = useState(false);
  const [isGroupAdmin, setIsGroupAdmin] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviting, setInviting] = useState(false);

  // Editable fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isAdminOnlyPosts, setIsAdminOnlyPosts] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await fetchGroupDetails(id);
      if (error) throw error;
      setGroup(data);
      setName(data?.name || '');
      setDescription(data?.description || '');
      setTags(Array.isArray(data?.tags) ? data.tags.join(', ') : '');
      setIsPrivate(!!data?.is_private);
      setIsAdminOnlyPosts(!!data?.is_admin_only_posts);
      setIsApproved(!!data?.is_approved);

      const { data: mems } = await fetchGroupMembers(id, 200, 0);
      setMembers(mems || []);
    } catch (e) {
      console.error('Failed to load group:', e);
      toast.error('Failed to load group');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // Route guard: require site admin or group admin
  useEffect(() => {
    const checkAuthz = async () => {
      try {
        const siteAdmin = profile?.is_admin === true;
        setIsSiteAdmin(siteAdmin);
        const { data: mem } = await getMyGroupMembership(id);
        const can = canManageGroup({ id: user?.id, role: userRole }, group || {}, mem || undefined);
        setIsGroupAdmin(mem?.role === 'admin');
        setAuthorized(!!can);
        if (!can) {
          toast.error('You are not authorized to manage this group.');
          navigate(`/groups/${id}`);
        }
      } catch (e) {
        console.error('Authz check failed', e);
      }
    };
    checkAuthz();
  }, [id, profile, user?.id, userRole, group, navigate]);

  const ensureAnotherAdminExists = async (excludingUserId) => {
    const { count, error } = await supabase
      .from('group_members')
      .select('role', { count: 'exact', head: true })
      .eq('group_id', id)
      .eq('role', 'admin')
      .neq('user_id', excludingUserId);
    if (error) throw error;
    return (count ?? 0) > 0;
  };

  const saveBasics = async () => {
    setSaving(true);
    try {
      const payload = {
        name,
        description,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      const { data, error } = await updateGroupDetails(id, payload);
      if (error) throw error;
      setGroup(prev => ({ ...prev, ...data }));
      toast.success('Basics updated');
    } catch (e) {
      console.error(e);
      const msg = String(e?.message || '');
      if (/JSON object requested, multiple \(or no\) rows returned/i.test(msg)) {
        toast.error('Changes saved, but this group may now be hidden due to policy changes.');
      } else {
        toast.error('Unable to save changes. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const savePrivacy = async () => {
    setSaving(true);
    try {
      const payload = {
        is_private: isPrivate,
        is_admin_only_posts: isAdminOnlyPosts,
      };
      const { data, error } = await updateGroupDetails(id, payload);
      if (error) throw error;
      setGroup(prev => ({ ...prev, ...data }));
      toast.success('Privacy updated');
    } catch (e) {
      console.error(e);
      const msg = String(e?.message || '');
      if (/JSON object requested, multiple \(or no\) rows returned/i.test(msg)) {
        toast.error('Privacy updated, but access may have changed. The group could now be hidden.');
      } else {
        toast.error('Unable to update privacy. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleApproval = async () => {
    setSaving(true);
    try {
      const payload = { is_approved: !isApproved };
      const { data, error } = await updateGroupDetails(id, payload);
      if (error) {
        const msg = String(error?.message || '');
        if (/JSON object requested, multiple \(or no\) rows returned/i.test(msg)) {
          setIsApproved(!!payload.is_approved);
          if (!payload.is_approved) {
            toast.success('Group moved to pending review and may be hidden.');
            navigate('/groups');
          } else {
            toast.success('Group approved');
          }
          return;
        }
        throw error;
      }
      setIsApproved(!!data?.is_approved);
      setGroup(prev => ({ ...prev, ...data }));
      toast.success(`Group ${data?.is_approved ? 'approved' : 'set to pending review'}`);
    } catch (e) {
      console.error(e);
      toast.error('Unable to update approval. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const promote = async (member) => {
    try {
      const { error } = await setMemberRole(id, member.user.id, 'admin');
      if (error) throw error;
      setMembers(prev => prev.map(m => m.user.id === member.user.id ? { ...m, role: 'admin' } : m));
      toast.success('Promoted to admin');
    } catch (e) {
      console.error(e);
      toast.error('Failed to promote');
    }
  };

  const demote = async (member) => {
    try {
      if (member.role === 'admin') {
        const ok = await ensureAnotherAdminExists(member.user.id);
        if (!ok) {
          toast.error('Every group needs at least one admin.');
          return;
        }
      }
      const { error } = await setMemberRole(id, member.user.id, 'member');
      if (error) throw error;
      setMembers(prev => prev.map(m => m.user.id === member.user.id ? { ...m, role: 'member' } : m));
      toast.success('Demoted to member');
    } catch (e) {
      console.error(e);
      toast.error('Failed to demote');
    }
  };

  const remove = async (member) => {
    try {
      if (member.role === 'admin') {
        const ok = await ensureAnotherAdminExists(member.user.id);
        if (!ok) {
          toast.error('Every group needs at least one admin.');
          return;
        }
      }
      const { error } = await removeGroupMember(id, member.user.id);
      if (error) throw error;
      setMembers(prev => prev.filter(m => m.user.id !== member.user.id));
      toast.success('Removed from group');
    } catch (e) {
      console.error(e);
      toast.error('Failed to remove');
    }
  };

  const archiveGroup = async () => {
    setSaving(true);
    try {
      const { data, error } = await updateGroupDetails(id, { is_archived: true, is_approved: false });
      if (error) throw error;
      toast.success('Group archived');
      navigate('/groups');
    } catch (e) {
      console.error(e);
      const msg = String(e?.message || '');
      if (/JSON object requested, multiple \(or no\) rows returned/i.test(msg)) {
        toast.success('Group archived and is now hidden.');
        navigate('/groups');
      } else {
        toast.error('Unable to archive the group. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;
  if (!authorized) {
    return (
      <div className="container mx-auto p-4">
        <div className="flex items-center mb-4">
          <Link to={`/groups/${id}`} className="text-gray-600 hover:text-gray-900 flex items-center"><ArrowLeft size={16} className="mr-2" />Back</Link>
          <h1 className="text-2xl font-bold ml-4">Manage Group</h1>
        </div>
        <div className="bg-white rounded shadow p-6">
          <p className="text-gray-700">You are not authorized to manage this group.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center mb-4">
        <Link to={`/groups/${id}`} className="text-gray-600 hover:text-gray-900 flex items-center"><ArrowLeft size={16} className="mr-2" />Back</Link>
        <h1 className="text-2xl font-bold ml-4">Manage Group</h1>
      </div>

      {/* Basics */}
      <section className="bg-white rounded shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Basics</h2>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-700">Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="text-sm text-gray-700">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label className="text-sm text-gray-700">Tags (comma-separated)</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)} className="w-full p-2 border rounded" />
          </div>
        </div>
        <div className="mt-3 text-right">
          <button onClick={saveBasics} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Save</button>
        </div>
      </section>

      {/* Privacy */}
      <section className="bg-white rounded shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Privacy</h2>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} /> Private</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isAdminOnlyPosts} onChange={(e) => setIsAdminOnlyPosts(e.target.checked)} /> Admin-only Posts</label>
        </div>
        <div className="mt-3 text-right">
          <button onClick={savePrivacy} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">Save</button>
        </div>
      </section>

      {/* Approval (site admin only) */}
      {isSiteAdmin && (
        <section className="bg-white rounded shadow p-4 mb-6">
          <h2 className="text-lg font-semibold mb-3">Approval</h2>
          <div className="flex items-center gap-3">
            {isApproved ? (
              <span className="px-2 py-1 rounded-full bg-green-100 text-green-700">Approved</span>
            ) : (
              <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">Pending</span>
            )}
            <button onClick={toggleApproval} disabled={saving} className="px-3 py-1 border rounded">{isApproved ? 'Unapprove' : 'Approve'}</button>
          </div>
        </section>
      )}

      {/* Members */}
      <section className="bg-white rounded shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-3">Members</h2>
        {(isSiteAdmin || isGroupAdmin) && (
          <div className="mb-4 flex gap-2 items-end">
            <div className="flex-1">
              <label className="block text-sm text-gray-700">Invite by email</label>
              <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="user@example.com" className="w-full p-2 border rounded" />
            </div>
            <button
              disabled={inviting || !inviteEmail}
              onClick={async () => {
                setInviting(true);
                try {
                  const { data: prof, error } = await supabase
                    .from('profiles')
                    .select('id, full_name, avatar_url, email, headline')
                    .eq('email', inviteEmail)
                    .maybeSingle();
                  if (error) throw error;
                  if (!prof?.id) {
                    toast.error('No user found with that email.');
                  } else {
                    const { data: added, error: addErr } = await addGroupMember(id, prof.id, 'member');
                    if (addErr) throw addErr;
                    setMembers(prev => [{ user: prof, role: 'member' }, ...prev.filter(m => m.user.id !== prof.id)]);
                    toast.success('Member added');
                    setInviteEmail('');
                  }
                } catch (e) {
                  console.error('Invite failed', e);
                  toast.error('Failed to add member');
                } finally {
                  setInviting(false);
                }
              }}
              className="px-3 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
            >
              {inviting ? 'Adding...' : 'Add'}
            </button>
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {members.map(m => (
            <div key={m.user.id} className="border rounded p-3 relative">
              {m.role === 'admin' && (
                <span className="absolute top-2 right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center"><Shield size={12} className="mr-1"/>Admin</span>
              )}
              <div className="flex items-center gap-3">
                <img src={m.user.avatar_url || '/default-avatar.png'} alt={m.user.full_name} className="w-10 h-10 rounded-full" />
                <div>
                  <div className="font-medium">{m.user.full_name}</div>
                  <div className="text-xs text-gray-500">{m.role === 'admin' ? 'Admin' : 'Member'}</div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {m.role !== 'admin' ? (
                  <button onClick={() => promote(m)} className="text-xs px-3 py-1 rounded bg-blue-50 text-blue-700">Promote</button>
                ) : (
                  <button onClick={() => demote(m)} className="text-xs px-3 py-1 rounded bg-gray-50 text-gray-700">Demote</button>
                )}
                {m.role !== 'admin' && (
                  <button onClick={() => remove(m)} className="text-xs px-3 py-1 rounded bg-red-50 text-red-700 flex items-center"><UserMinus size={12} className="mr-1"/>Remove</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-3 text-red-700">Danger Zone</h2>
        <p className="text-sm text-gray-600 mb-3">Archiving will disable new posts and hide the group from listings.</p>
        <button onClick={archiveGroup} disabled={saving} className="px-4 py-2 border border-red-600 text-red-600 rounded disabled:opacity-50">Archive Group</button>
      </section>
    </div>
  );
}
