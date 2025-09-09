import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, createGroup, uploadGroupAvatar } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft } from 'lucide-react';

const CreateGroup = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isAdminOnlyPosts, setIsAdminOnlyPosts] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [avatarFile, setAvatarFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Group name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    const groupData = {
      name,
      description,
      is_private: isPrivate,
      is_admin_only_posts: isAdminOnlyPosts,
      tags: tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean),
    };

    try {
      const { data, error: createError } = await createGroup(groupData);
      if (createError) {
        // Duplicate name unique index
        if (createError.code === '23505') {
          setError('Name already in use. Please choose a different name.');
          return;
        }
        throw createError;
      }

      // Optional avatar upload
      if (avatarFile) {
        await uploadGroupAvatar(avatarFile, data.id);
      }

      navigate(`/groups/${data.id}`);
    } catch (err) {
      setError(err.message);
      console.error("Error creating group:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Groups
        </button>

        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Create a New Group</h1>
            <p className="text-gray-500 mb-2">Start a new community for alumni to connect and collaborate.</p>
            <p className="text-xs text-gray-500 mb-8">Note: New groups may require admin approval before appearing publicly.</p>

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
                  <p className="text-sm text-gray-500">Private groups require an invitation to join.</p>
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

              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
                <div>
                  <h3 className="font-medium text-gray-800">Admin-only Posts</h3>
                  <p className="text-sm text-gray-500">When enabled, only group admins can create posts.</p>
                </div>
                <label htmlFor="isAdminOnlyPosts" className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    id="isAdminOnlyPosts"
                    checked={isAdminOnlyPosts}
                    onChange={(e) => setIsAdminOnlyPosts(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-4 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {isAdminOnlyPosts ? 'Enabled' : 'Disabled'}
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

              {error && <p className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">Error: {error}</p>}

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                >
                  {loading ? 'Creating Group...' : 'Create Group'}
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
