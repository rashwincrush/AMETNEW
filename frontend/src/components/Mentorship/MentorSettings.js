import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import toast from 'react-hot-toast';

const MentorSettings = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    if (!title.trim()) {
      toast.error('Title is required');
      return false;
    }
    if (startDate && endDate) {
      const s = new Date(startDate);
      const e = new Date(endDate);
      if (s > e) {
        toast.error('End date must be after start date');
        return false;
      }
    }
    return true;
  };

  const handleCreateProgram = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const toastId = toast.loading('Creating mentorship program...');
    try {
      const payload = {
        title: title.trim(),
        description: description?.trim() || null,
        start_date: startDate ? new Date(startDate).toISOString() : null,
        end_date: endDate ? new Date(endDate).toISOString() : null,
        is_active: !!isActive,
      };

      const { data, error } = await supabase
        .from('mentorship_programs')
        .insert([payload])
        .select()
        .single();
      if (error) throw error;

      toast.success('Mentorship program created!', { id: toastId });
      // Navigate to dashboard after creation
      navigate('/mentorship/dashboard');
    } catch (err) {
      console.error('Failed to create mentorship program:', err);
      toast.error(err.message || 'Failed to create mentorship program', { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="glass-card p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mentor Settings</h1>

        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Create Mentorship Program</h2>
          <p className="text-sm text-gray-600 mb-4">As a mentor, you can create a structured program for mentees to join. Title is required. Dates are optional.</p>

          <form onSubmit={handleCreateProgram} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title<span className="text-red-500">*</span></label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500"
                placeholder="e.g., Maritime Career Mentorship (Fall 2025)"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 h-24"
                placeholder="Brief overview of the program, goals, expectations, etc."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="isActive"
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 text-ocean-600 border-gray-300 rounded"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">Active</label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className={`btn-ocean px-4 py-2 rounded-lg ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {submitting ? 'Creating...' : 'Create Program'}
              </button>
            </div>
          </form>
        </div>

        <p className="text-gray-700">Additional mentor preferences and availability settings can be configured here later.</p>
      </div>
    </div>
  );
};

export default MentorSettings;
