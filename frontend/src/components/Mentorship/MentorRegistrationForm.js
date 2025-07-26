// frontend/src/components/Mentorship/MentorRegistrationForm.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useNotification } from '../common/NotificationCenter';
import { XMarkIcon, CheckCircleIcon, InformationCircleIcon, PlusIcon, ClockIcon, SparklesIcon, BriefcaseIcon, Cog6ToothIcon, UserPlusIcon } from '@heroicons/react/24/outline';

const MentorRegistrationForm = () => {
  const navigate = useNavigate();
  const notification = useNotification();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showExistingMentorModal, setShowExistingMentorModal] = useState(false);
  const [existingMentorStatus, setExistingMentorStatus] = useState(null);
  const modalRef = useRef(null);
  const [currentTag, setCurrentTag] = useState('');

  const initialFormData = {
    mentoring_capacity_hours_per_month: '',
    expertise: [],
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

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      try {
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        if (!authUser) {
          notification.showError('You must be logged in to register as a mentor.');
          navigate('/login');
          return;
        }
        setUser(authUser);

        // Proceed with fetching mentor profile only if we have a user and haven't fetched before
        if (authUser.id && !hasFetchedRef.current) {
          setLoading(true);
          hasFetchedRef.current = true; // Mark as fetched to prevent re-runs

          console.log('Fetching mentor profile for user:', authUser.id);
          const { data: mentorProfile, error: profileError } = await supabase
            .from('mentors')
            .select('*')
            .eq('user_id', authUser.id)
            .maybeSingle();

          if (profileError && profileError.code !== 'PGRST116') {
            console.error('Error fetching mentor profile:', profileError);
            notification.showError(`Error fetching profile: ${profileError.message}`);
          }

          if (mentorProfile) {
            console.log('Found existing mentor profile:', mentorProfile);
            setExistingMentorStatus(mentorProfile.status);
            if (mentorProfile.status === 'approved') {
              setShowExistingMentorModal(true);
            }

            setFormData({
              mentoring_capacity_hours_per_month: mentorProfile.mentoring_capacity_hours_per_month || '',
              expertise: Array.isArray(mentorProfile.expertise) ? mentorProfile.expertise : [],
              mentoring_preferences: mentorProfile.mentoring_preferences || { communication: '', format: '', duration: '' },
              mentoring_experience_years: mentorProfile.mentoring_experience_years || '',
              mentoring_statement: mentorProfile.mentoring_statement || '',
              max_mentees: mentorProfile.max_mentees || '',
              mentoring_experience_description: mentorProfile.mentoring_experience_description || '',
            });

            notification.showSuccess('Existing mentor profile loaded for editing.');
          }
        }
      } catch (error) {
        console.error('Error in fetchUserAndProfile:', error);
        notification.showError(`Failed to initialize form: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndProfile();

  }, [navigate, notification]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTagChange = (e) => {
    setCurrentTag(e.target.value);
  };

  const addTag = () => {
    if (currentTag && !formData.expertise.includes(currentTag.trim())) {
      setFormData(prev => ({ ...prev, expertise: [...prev.expertise, currentTag.trim()] }));
    }
    setCurrentTag('');
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.filter(tag => tag !== tagToRemove),
    }));
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
    notification.showSuccess('Form cleared. You can now enter new information.');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      notification.showError('User session not found. Please log in again.');
      return;
    }

    // Validation
    if (
      !formData.mentoring_capacity_hours_per_month ||
      !formData.mentoring_experience_years ||
      !formData.mentoring_statement ||
      !formData.max_mentees ||
      formData.expertise.length === 0
    ) {
      notification.showError('Please fill out all required fields, including at least one area of expertise.');
      return;
    }

    setSaving(true);

    const parseNumeric = (val) => (val === '' || val === null ? null : parseInt(val, 10));

    const mentorData = {
      user_id: user.id,
      mentoring_capacity_hours_per_month: parseNumeric(formData.mentoring_capacity_hours_per_month),
      expertise: formData.expertise,
      mentoring_preferences: formData.mentoring_preferences,
      mentoring_experience_years: parseNumeric(formData.mentoring_experience_years),
      mentoring_statement: formData.mentoring_statement,
      max_mentees: parseNumeric(formData.max_mentees),
      mentoring_experience_description: formData.mentoring_experience_description || null,
      status: existingMentorStatus === 'approved' ? 'approved' : 'pending_approval',
    };

    try {
      const { data, error } = await supabase
        .from('mentors')
        .upsert(mentorData, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) throw error;

      notification.showSuccess('Your mentor profile has been saved successfully!');
      // No longer navigating away, user stays on the page to review or continue editing.
    } catch (error) {
      console.error('Error saving mentor profile:', error);
      notification.showError(`Failed to save profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-600"></div>
        <p className="mt-6 text-lg font-semibold text-gray-700">Loading Your Profile...</p>
        <p className="text-sm text-gray-500">Please wait a moment.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl w-full mx-auto">
        {/* Welcome Header */}
        <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl overflow-hidden p-8 mb-12">
            <div className="absolute inset-0 bg-black opacity-20"></div>
            <div className="relative flex flex-col md:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                    <UserPlusIcon className="h-24 w-24 text-white opacity-80" />
                </div>
                <div>
                    <h2 className="text-4xl font-extrabold text-white tracking-tight sm:text-5xl">Become a Mentor</h2>
                    <p className="mt-3 text-xl text-indigo-100 max-w-3xl">
                        Your knowledge and experience are invaluable. Join our community of mentors and make a lasting impact on the next generation of professionals.
                    </p>
                </div>
            </div>
        </div>

        {showExistingMentorModal && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 transition-opacity duration-300" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl transform transition-all sm:max-w-lg sm:w-full p-8">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                    <CheckCircleIcon className="h-6 w-6 text-green-600" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-xl leading-6 font-bold text-gray-900" id="modal-title">
                      Welcome Back, Mentor!
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Your profile status is: <span className={`font-semibold ${existingMentorStatus === 'approved' ? 'text-green-600' : 'text-yellow-600'}`}>{existingMentorStatus}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setShowExistingMentorModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div className="mt-4 text-sm text-gray-600">
                <p>You can edit and update your mentoring profile at any time using the form below.</p>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Link to="/dashboard" className="btn-secondary-outline">Go to Dashboard</Link>
                <button onClick={() => setShowExistingMentorModal(false)} className="btn-primary">Continue Editing</button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Column 1 */}
            <div className="space-y-8">
              {/* Section 1: Availability */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-indigo-500">
                <div className="flex items-center gap-4 mb-6">
                  <ClockIcon className="w-8 h-8 text-indigo-500" />
                  <h3 className="text-2xl font-bold text-gray-800">Your Availability</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="mentoring_capacity_hours_per_month" className="form-label">Capacity (Hours/Month) <span className="text-red-500">*</span></label>
                    <input type="number" name="mentoring_capacity_hours_per_month" id="mentoring_capacity_hours_per_month" value={formData.mentoring_capacity_hours_per_month} onChange={handleChange} required className="form-input" placeholder="e.g., 5"/>
                  </div>
                  <div>
                    <label htmlFor="max_mentees" className="form-label">Max. Mentees <span className="text-red-500">*</span></label>
                    <input type="number" name="max_mentees" id="max_mentees" value={formData.max_mentees} onChange={handleChange} required className="form-input" placeholder="e.g., 2"/>
                  </div>
                </div>
              </div>

              {/* Section 2: Expertise */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-purple-500">
                <div className="flex items-center gap-4 mb-6">
                  <SparklesIcon className="w-8 h-8 text-purple-500" />
                  <h3 className="text-2xl font-bold text-gray-800">Your Expertise</h3>
                </div>
                <div>
                  <label htmlFor="expertise_tags" className="form-label">Areas of Expertise <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-2 mt-1">
                    <input type="text" id="expertise_tags" value={currentTag} onChange={handleTagChange} onKeyDown={handleTagKeyDown} className="form-input flex-grow" placeholder="Type a skill and press Enter"/>
                    <button type="button" onClick={addTag} className="btn-secondary p-2.5"><PlusIcon className="h-5 w-5" /></button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {formData.expertise.map((tag, index) => (
                      <span key={index} className="flex items-center gap-2 bg-purple-100 text-purple-800 text-sm font-medium px-3 py-1.5 rounded-full shadow-sm">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="text-purple-500 hover:text-purple-700 transition-colors"><XMarkIcon className="h-4 w-4" /></button>
                      </span>
                    ))}
                  </div>
                  {formData.expertise.length === 0 && <p className="text-xs text-gray-500 mt-2">Please add at least one area of expertise.</p>}
                </div>
              </div>
            </div>

            {/* Column 2 */}
            <div className="space-y-8">
              {/* Section 3: Experience */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-sky-500">
                <div className="flex items-center gap-4 mb-6">
                  <BriefcaseIcon className="w-8 h-8 text-sky-500" />
                  <h3 className="text-2xl font-bold text-gray-800">Your Experience</h3>
                </div>
                <div className="space-y-6">
                  <div>
                    <label htmlFor="mentoring_experience_years" className="form-label">Years of Mentoring Experience <span className="text-red-500">*</span></label>
                    <input type="number" name="mentoring_experience_years" id="mentoring_experience_years" value={formData.mentoring_experience_years} onChange={handleChange} required className="form-input" placeholder="e.g., 3"/>
                  </div>
                  <div>
                    <label htmlFor="mentoring_statement" className="form-label">Brief Mentoring Statement <span className="text-red-500">*</span></label>
                    <textarea name="mentoring_statement" id="mentoring_statement" rows="4" value={formData.mentoring_statement} onChange={handleChange} required className="form-input" placeholder="What can mentees expect from you?"></textarea>
                  </div>
                  <div>
                    <label htmlFor="mentoring_experience_description" className="form-label">Describe Your Mentoring Experience (Optional)</label>
                    <textarea name="mentoring_experience_description" id="mentoring_experience_description" rows="4" value={formData.mentoring_experience_description} onChange={handleChange} className="form-input" placeholder="Briefly describe your past mentoring roles..."></textarea>
                  </div>
                </div>
              </div>

              {/* Section 4: Preferences */}
              <div className="bg-white p-8 rounded-2xl shadow-lg border-t-4 border-teal-500">
                <div className="flex items-center gap-4 mb-6">
                  <Cog6ToothIcon className="w-8 h-8 text-teal-500" />
                  <h3 className="text-2xl font-bold text-gray-800">Mentoring Preferences</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="communication" className="form-label">Communication <span className="text-red-500">*</span></label>
                    <select name="communication" id="communication" value={formData.mentoring_preferences.communication} onChange={handlePreferenceChange} required className="form-input">
                      <option value="">Select a method</option>
                      <option value="Email">Email</option>
                      <option value="Slack/Teams">Slack/Teams</option>
                      <option value="Video Call">Video Call</option>
                      <option value="Phone Call">Phone Call</option>
                      <option value="In-person">In-person</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="format" className="form-label">Format <span className="text-red-500">*</span></label>
                    <select name="format" id="format" value={formData.mentoring_preferences.format} onChange={handlePreferenceChange} required className="form-input">
                      <option value="">Select a format</option>
                      <option value="1-on-1 Sessions">1-on-1 Sessions</option>
                      <option value="Group Mentoring">Group Mentoring</option>
                      <option value="Project Collaboration">Project Collaboration</option>
                      <option value="Informal Check-ins">Informal Check-ins</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="duration" className="form-label">Duration <span className="text-red-500">*</span></label>
                    <select name="duration" id="duration" value={formData.mentoring_preferences.duration} onChange={handlePreferenceChange} required className="form-input">
                      <option value="">Select a duration</option>
                      <option value="1-3 Months">1-3 Months</option>
                      <option value="3-6 Months">3-6 Months</option>
                      <option value="6-12 Months">6-12 Months</option>
                      <option value="Ongoing">Ongoing</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-8 flex flex-col sm:flex-row justify-end gap-4">
            <button type="button" onClick={clearForm} disabled={saving || loading} className="btn-secondary-outline text-lg px-8 py-3">Clear Form</button>
            <button type="submit" disabled={saving || loading} className="btn-primary text-lg px-8 py-3 w-full sm:w-auto">{saving ? 'Saving...' : 'Save Mentor Profile'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MentorRegistrationForm;
