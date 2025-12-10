import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { canCreateGroup } from '../../utils/acl';
import { createGroup } from '../../api/groups';
import logger from '../../utils/logger';

const CreateGroup = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const { user, userRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !canCreateGroup(userRole)) {
      toast.error('You are not allowed to create a group.');
      navigate('/groups');
    }
  }, [user, userRole, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Group name is required.');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Creating your group...');

    try {
      const nameToCheck = name.trim();
      const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const id = await createGroup({ name: nameToCheck, description: description.trim(), isPrivate, tags });

      // Optional avatar upload after group creation
      if (avatarFile && id) {
        try {
          // Validate image type and size (max 2MB)
          const ACCEPT = ['image/jpeg', 'image/png'];
          if (!ACCEPT.includes(avatarFile.type)) {
            toast.error('Only JPG or PNG images are allowed.', { id: toastId });
            setLoading(false);
            return;
          }
          const MAX = 2 * 1024 * 1024; // 2MB
          if (avatarFile.size > MAX) {
            toast.error('Image must be 2 MB or smaller.', { id: toastId });
            setLoading(false);
            return;
          }
          const filePath = `${id}/avatar.jpg`;
          const { error: uploadError } = await supabase.storage
            .from('group_avatars')
            .upload(filePath, avatarFile, {
              cacheControl: '3600',
              upsert: true,
              contentType: avatarFile.type || 'image/jpeg',
            });

          if (uploadError) {
            logger.warn('Avatar upload failed:', uploadError);
            // Don't fail the whole operation for avatar upload failure
          } else {
            // Persist to existing field: group_avatar_url (minimal change)
            const { data: pub } = supabase.storage
              .from('group_avatars')
              .getPublicUrl(filePath);
            const { error: updErr } = await supabase
              .from('groups')
              .update({
                group_avatar_url: pub?.publicUrl || null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', id);
            if (updErr) {
              logger.warn('Failed to persist group avatar URL:', updErr);
            }
          }
        } catch (uploadErr) {
          logger.warn('Avatar upload error:', uploadErr);
        }
      }

      toast.success('Group created successfully!', { id: toastId });
      navigate(`/groups/${id}/manage`);
    } catch (err) {
      logger.error("Error creating group:", err);
      const msg = String(err?.message || '');
      if (/JSON object requested, multiple \(or no\) rows returned/i.test(msg)) {
        toast.error('Group created but is not visible yet. It may be pending review.', { id: toastId });
      } else if (/permission denied|42501/i.test(msg)) {
        toast.error("You don't have permission to create a group.", { id: toastId });
      } else {
        toast.error('Unable to create group. Please try again.', { id: toastId });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Groups/Chapters
        </button>

        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Create a New Group/Chapter</h1>
            <p className="text-gray-500 mb-2">Start a new community for alumni to connect and collaborate.</p>
            <p className="text-xs text-gray-500 mb-8">Note: New groups/chapters may require admin approval before appearing publicly.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Group Name
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="e.g., Marine Engineering Alumni"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition h-32"
                  placeholder="What is this group about?"
                />
              </div>

              <div>
                <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  id="tags"
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
                  placeholder="Comma-separated tags, e.g., alumni,engineering,marine"
                />
                <p className="text-xs text-gray-500 mt-1">Use commas to separate tags. Example: alumni, engineering, marine</p>
              </div>

              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
                <div>
                  <h3 className="font-medium text-gray-800">Group Privacy</h3>
                  <p className="text-sm text-gray-500">
                    Default is <span className="font-semibold">public</span>. Turn this on to make the group
                    <span className="font-semibold"> private</span> and invite-only.
                  </p>
                </div>
                <label htmlFor="isPrivate" className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="isPrivate"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {isPrivate ? 'Private' : 'Public'}
                  </span>
                </label>
              </div>

              <div>
                <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-1">
                  Group Avatar (optional)
                </label>
                <input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
                />
                <p className="text-xs text-gray-500 mt-1">PNG or JPG up to 5 MB.</p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                  {loading ? 'Creating Group/Chapter...' : 'Create Group/Chapter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup;
