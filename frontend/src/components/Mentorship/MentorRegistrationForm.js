// frontend/src/components/Mentorship/MentorRegistrationForm.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useNotification } from '../common/NotificationCenter';
import { XMarkIcon, CheckCircleIcon, InformationCircleIcon, PlusIcon } from '@heroicons/react/24/outline';

const MentorRegistrationForm = () => {
  const navigate = useNavigate();
  const notification = useNotification();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      setLoading(true);
      try {
        const { data: { user: authUser }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!authUser) {
          notification.showError('You must be logged in to register as a mentor.');
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
          notification.showError(`Error fetching profile: ${profileError.message}`);
        }

        if (mentorProfile) {
          setExistingMentorStatus(mentorProfile.status);
          if (mentorProfile.status === 'approved') {
            notification.showInfo('You are already a mentor. You can edit your profile below.');
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
        }
      } catch (error) {
        notification.showError(`Failed to initialize form: ${error.message}`);
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

      notification.showSuccess('Mentor profile saved successfully! Your profile is pending review.');
      navigate('/dashboard'); // Redirect to a relevant page after submission
    } catch (error) {
      console.error('Error saving mentor profile:', error);
      notification.showError(`Failed to save profile: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading Your Profile...</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight sm:text-5xl">Mentor Registration</h1>
          <p className="mt-4 text-xl text-gray-600">Become a mentor and help shape the next generation of professionals.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Your Commitment Section */}
            <fieldset>
              <legend className="text-xl font-semibold text-gray-900">Your Commitment</legend>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="mentoring_capacity_hours_per_month" className="form-label">Mentoring Capacity (Hours/Month) <span className="text-red-500">*</span></label>
                  <input type="number" name="mentoring_capacity_hours_per_month" id="mentoring_capacity_hours_per_month" value={formData.mentoring_capacity_hours_per_month} onChange={handleChange} required className="form-input" min="1" placeholder="e.g., 5" />
                </div>
                <div>
                  <label htmlFor="max_mentees" className="form-label">Maximum Number of Mentees <span className="text-red-500">*</span></label>
                  <input type="number" name="max_mentees" id="max_mentees" value={formData.max_mentees} onChange={handleChange} required className="form-input" min="1" placeholder="e.g., 3" />
                </div>
              </div>
            </fieldset>

            <div className="border-t border-gray-200"></div>

            {/* Your Expertise Section */}
            <fieldset>
              <legend className="text-xl font-semibold text-gray-900">Your Expertise</legend>
              <div className="mt-6">
                <label htmlFor="expertise" className="form-label">Areas of Expertise <span className="text-red-500">*</span></label>
                <div className="flex items-center">
                  <input
                    type="text"
                    id="expertise"
                    value={currentTag}
                    onChange={handleTagChange}
                    onKeyDown={handleTagKeyDown}
                    className="form-input flex-grow"
                    placeholder="Type an expertise and press Enter..."
                  />
                  <button type="button" onClick={addTag} className="ml-3 btn-primary p-3">
                    <PlusIcon className="h-6 w-6" />
                  </button>
                </div>
                {formData.expertise.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {formData.expertise.map((tag, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                        {tag}
                        <button type="button" onClick={() => removeTag(tag)} className="ml-2 -mr-1 flex-shrink-0 h-4 w-4 rounded-full inline-flex items-center justify-center text-blue-500 hover:bg-blue-200 hover:text-blue-600 focus:outline-none focus:bg-blue-500 focus:text-white">
                          <span className="sr-only">Remove {tag}</span>
                          <XMarkIcon className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </fieldset>

            <div className="border-t border-gray-200"></div>

            {/* Your Story Section */}
            <fieldset>
              <legend className="text-xl font-semibold text-gray-900">Your Story</legend>
              <div className="mt-6 space-y-6">
                <div>
                  <label htmlFor="mentoring_experience_years" className="form-label">Years of Mentoring Experience <span className="text-red-500">*</span></label>
                  <input type="number" name="mentoring_experience_years" id="mentoring_experience_years" value={formData.mentoring_experience_years} onChange={handleChange} required className="form-input" min="0" placeholder="e.g., 10" />
                </div>
                <div>
                  <label htmlFor="mentoring_statement" className="form-label">Brief Mentoring Statement <span className="text-red-500">*</span></label>
                  <textarea name="mentoring_statement" id="mentoring_statement" rows="4" value={formData.mentoring_statement} onChange={handleChange} required className="form-input" placeholder="What can mentees expect from you? What's your mentoring philosophy?"></textarea>
                </div>
                <div>
                  <label htmlFor="mentoring_experience_description" className="form-label">Describe Your Mentoring Experience (Optional)</label>
                  <textarea name="mentoring_experience_description" id="mentoring_experience_description" rows="4" value={formData.mentoring_experience_description} onChange={handleChange} className="form-input" placeholder="Briefly describe your past mentoring roles, successes, or what you've learned."></textarea>
                </div>
              </div>
            </fieldset>

            <div className="border-t border-gray-200"></div>

            {/* Mentoring Preferences Section */}
            <fieldset>
              <legend className="text-xl font-semibold text-gray-900">Mentoring Preferences</legend>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="communication" className="form-label">Preferred Communication <span className="text-red-500">*</span></label>
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
                  <label htmlFor="format" className="form-label">Preferred Format <span className="text-red-500">*</span></label>
                  <select name="format" id="format" value={formData.mentoring_preferences.format} onChange={handlePreferenceChange} required className="form-input">
                    <option value="">Select a format</option>
                    <option value="1-on-1 Sessions">1-on-1 Sessions</option>
                    <option value="Group Mentoring">Group Mentoring</option>
                    <option value="Project Collaboration">Project Collaboration</option>
                    <option value="Informal Check-ins">Informal Check-ins</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="duration" className="form-label">Preferred Duration <span className="text-red-500">*</span></label>
                  <select name="duration" id="duration" value={formData.mentoring_preferences.duration} onChange={handlePreferenceChange} required className="form-input">
                    <option value="">Select a duration</option>
                    <option value="1-3 Months">1-3 Months</option>
                    <option value="3-6 Months">3-6 Months</option>
                    <option value="6-12 Months">6-12 Months</option>
                    <option value="Ongoing">Ongoing</option>
                  </select>
                </div>
              </div>
            </fieldset>

            <div className="pt-8 flex justify-end gap-4">
              <button type="button" onClick={clearForm} disabled={saving || loading} className="btn-secondary-outline">Clear Form</button>
              <button type="submit" disabled={saving || loading} className="btn-primary">{saving ? 'Saving...' : 'Save Mentor Profile'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default MentorRegistrationForm;
