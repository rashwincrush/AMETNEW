// frontend/src/components/Mentorship/MentorRegistrationForm.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import toast from 'react-hot-toast';

const MentorRegistrationForm = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showExistingMentorModal, setShowExistingMentorModal] = useState(false);
  const [existingMentorStatus, setExistingMentorStatus] = useState(null);
  const modalRef = useRef(null);

  const initialFormData = {
    mentoring_capacity_hours_per_month: '',
    expertise_tags: '',
    mentoring_preferences: { communication: '', format: '', duration: '' },
    mentoring_experience_years: '',
    mentoring_statement: '',
    max_mentees: '',
    mentoring_experience_description: '',
  };

  const [formData, setFormData] = useState(initialFormData);

  // Close modal when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowExistingMentorModal(false);
      }
    };
    if (showExistingMentorModal) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExistingMentorModal]);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      setLoading(true);
      try {
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!authUser) {
          toast.error('You must be logged in to register as a mentor.');
          navigate('/login');
          return;
        }
        setUser(authUser);

        const { data: mentorProfile, error: profileError } = await supabase
          .from('mentors')
          .select('*')
          .eq('user_id', authUser.id)
          .maybeSingle();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching mentor profile:', profileError);
          toast.error(`Error fetching profile: ${profileError.message}`);
        }

        if (mentorProfile) {
          setExistingMentorStatus(mentorProfile.status);
          if (mentorProfile.status === 'approved') {
            setShowExistingMentorModal(true);
          }
          setFormData({
            mentoring_capacity_hours_per_month: mentorProfile.mentoring_capacity_hours_per_month || '',
            expertise_tags: Array.isArray(mentorProfile.expertise) ? mentorProfile.expertise.join(', ') : '',
            mentoring_preferences: mentorProfile.mentoring_preferences || { communication: '', format: '', duration: '' },
            mentoring_experience_years: mentorProfile.mentoring_experience_years || '',
            mentoring_statement: mentorProfile.mentoring_statement || '',
            max_mentees: mentorProfile.max_mentees || '',
            mentoring_experience_description: mentorProfile.mentoring_experience_description || '',
          });
          toast.success('Existing mentor profile loaded for editing.');
        }
      } catch (error) {
        toast.error(`Failed to initialize form: ${error.message}`);
        console.error('Error in fetchUserAndProfile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePreferenceChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      mentoring_preferences: { ...prev.mentoring_preferences, [name]: value },
    }));
  };

  const clearForm = () => {
    setFormData(initialFormData);
    toast.success('Form cleared. You can now enter new information.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('User not found. Please log in again.');
      return;
    }
    setSaving(true);

    const expertiseArray = formData.expertise_tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    const parseNumeric = (val) => (val === '' || val === null ? null : parseInt(val, 10));

    const profileData = {
      user_id: user.id,
      mentoring_capacity_hours_per_month: parseNumeric(formData.mentoring_capacity_hours_per_month),
      expertise: expertiseArray,
      mentoring_preferences: formData.mentoring_preferences,
      mentoring_experience_years: parseNumeric(formData.mentoring_experience_years),
      mentoring_statement: formData.mentoring_statement,
      max_mentees: parseNumeric(formData.max_mentees),
      mentoring_experience_description: formData.mentoring_experience_description || null,
      status: 'pending', // Always set to pending for admin review
    };

    try {
      const { error } = await supabase.from('mentors').upsert(profileData, { onConflict: 'user_id' });
      if (error) throw error;
      toast.success('Mentor profile saved! It is now pending admin approval.');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving mentor profile:', error);
      toast.error(`Failed to save profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-700"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      {showExistingMentorModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-50 flex items-center justify-center">
          <div ref={modalRef} className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h3 className="text-lg font-medium text-center text-gray-900 mb-2">You're Already a Mentor!</h3>
            <p className="text-sm text-gray-500 mb-5 text-center">Your mentor profile is approved. You can edit it below, but any changes will require re-approval.</p>
            <div className="flex flex-col sm:flex-row justify-center space-y-2 sm:space-y-0 sm:space-x-3">
              <Link to="/mentorship" className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Go to Mentorship</Link>
              <button type="button" onClick={() => setShowExistingMentorModal(false)} className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Continue Editing</button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white shadow sm:rounded-lg p-6 sm:p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">Mentor Registration</h1>
        
        {existingMentorStatus && (
          <div className={`mb-6 p-4 rounded-md ${existingMentorStatus === 'approved' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-yellow-50 text-yellow-800 border border-yellow-200'}`}>
            <p className="font-medium">Current Status: <span className="font-bold">{existingMentorStatus.charAt(0).toUpperCase() + existingMentorStatus.slice(1)}</span></p>
            <p className="text-sm">{existingMentorStatus === 'approved' ? 'Any changes submitted will require re-approval.' : 'Your application is pending review.'}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label htmlFor="expertise_tags" className="block text-sm font-medium text-gray-700 mb-1">Areas of Expertise (comma-separated) <span className="text-red-500">*</span></label>
            <input type="text" name="expertise_tags" id="expertise_tags" value={formData.expertise_tags} onChange={handleChange} required className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., Software Engineering, Product Management"/>
          </div>

          <div>
            <label htmlFor="mentoring_capacity_hours_per_month" className="block text-sm font-medium text-gray-700 mb-1">Mentoring Capacity (Hours per Month) <span className="text-red-500">*</span></label>
            <input type="number" name="mentoring_capacity_hours_per_month" id="mentoring_capacity_hours_per_month" value={formData.mentoring_capacity_hours_per_month} onChange={handleChange} required className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., 5"/>
          </div>

          <fieldset className="border border-gray-300 p-4 rounded-md">
            <legend className="text-base font-medium text-gray-900 px-2">Mentoring Preferences</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div>
                <label htmlFor="communication" className="block text-sm font-medium text-gray-700 mb-1">Communication <span className="text-red-500">*</span></label>
                <input type="text" name="communication" id="communication" value={formData.mentoring_preferences.communication} onChange={handlePreferenceChange} required className="mt-1 block w-full px-4 py-2.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Slack, Email"/>
              </div>
              <div>
                <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">Format <span className="text-red-500">*</span></label>
                <input type="text" name="format" id="format" value={formData.mentoring_preferences.format} onChange={handlePreferenceChange} required className="mt-1 block w-full px-4 py-2.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., 1-on-1, Group"/>
              </div>
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">Duration <span className="text-red-500">*</span></label>
                <input type="text" name="duration" id="duration" value={formData.mentoring_preferences.duration} onChange={handlePreferenceChange} required className="mt-1 block w-full px-4 py-2.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., 3 months"/>
              </div>
            </div>
          </fieldset>

          <div>
            <label htmlFor="mentoring_experience_years" className="block text-sm font-medium text-gray-700 mb-1">Years of Mentoring Experience <span className="text-red-500">*</span></label>
            <input type="number" name="mentoring_experience_years" id="mentoring_experience_years" value={formData.mentoring_experience_years} onChange={handleChange} required className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., 3"/>
          </div>

          <div>
            <label htmlFor="mentoring_experience_description" className="block text-sm font-medium text-gray-700 mb-1">Describe Your Mentoring Experience (Optional)</label>
            <textarea name="mentoring_experience_description" id="mentoring_experience_description" rows="4" value={formData.mentoring_experience_description} onChange={handleChange} className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="Briefly describe your past mentoring roles..."></textarea>
          </div>

          <div>
            <label htmlFor="mentoring_statement" className="block text-sm font-medium text-gray-700 mb-1">Brief Mentoring Statement <span className="text-red-500">*</span></label>
            <textarea name="mentoring_statement" id="mentoring_statement" rows="4" value={formData.mentoring_statement} onChange={handleChange} required className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="What can mentees expect from you?"></textarea>
          </div>

          <div>
            <label htmlFor="max_mentees" className="block text-sm font-medium text-gray-700 mb-1">Maximum Number of Mentees <span className="text-red-500">*</span></label>
            <input type="number" name="max_mentees" id="max_mentees" value={formData.max_mentees} onChange={handleChange} required className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder="e.g., 2"/>
          </div>

          <div className="pt-6 border-t border-gray-200 flex flex-col md:flex-row md:justify-between gap-3">
            <button type="button" onClick={clearForm} disabled={saving || loading} className="flex justify-center py-3 px-4 border border-gray-300 rounded-md shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 md:w-1/3">Clear Form</button>
            <button type="submit" disabled={saving || loading} className="flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60 md:w-2/3">{saving ? 'Saving...' : 'Save Mentor Profile'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MentorRegistrationForm;
