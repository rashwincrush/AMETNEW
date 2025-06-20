// frontend/src/components/Mentorship/MentorRegistrationForm.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import toast from 'react-hot-toast';

const MentorRegistrationForm = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    mentoring_capacity_hours_per_month: '',
    expertise_tags: '',
    mentoring_preferences: { communication: '', format: '', duration: '' },
    mentoring_experience_years: '',
    mentoring_statement: '',
    max_mentees: '',
    mentoring_experience_description: '', 
  });

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
          .maybeSingle(); // Use maybeSingle() to gracefully handle 0 or 1 row

        if (profileError && profileError.code !== 'PGRST116') { // PGRST116 is 'single row not found', which maybeSingle handles
            // Log other types of profile errors
            console.error('Error fetching mentor profile:', profileError);
            toast.error(`Error fetching profile: ${profileError.message}`);
            // Potentially throw profileError if it's critical and not just 'not found'
        }
        
        if (mentorProfile) {
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
        // This will catch errors from supabase.auth.getUser() or critical profileError if re-thrown
        toast.error(`Failed to initialize form: ${error.message}`);
        console.error('Error in fetchUserAndProfile:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchUserAndProfile();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    // For number inputs, store empty as empty string for controlled input,
    // conversion to null will happen at submission if needed.
    setFormData(prev => ({ 
      ...prev, 
      [name]: value 
    }));
  };

  const handlePreferenceChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      mentoring_preferences: {
        ...prev.mentoring_preferences,
        [name]: value,
      },
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error('User not found. Please log in again.');
      return;
    }
    setSaving(true);

    const expertiseArray = formData.expertise_tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');
    
    // Helper to convert empty strings to null for numeric fields, otherwise parse to int
    const parseNumeric = (val) => (val === '' || val === null ? null : parseInt(val, 10));

    const profileData = {
      user_id: user.id,
      mentoring_capacity_hours_per_month: parseNumeric(formData.mentoring_capacity_hours_per_month),
      expertise: expertiseArray,
      mentoring_preferences: formData.mentoring_preferences,
      mentoring_experience_years: parseNumeric(formData.mentoring_experience_years),
      mentoring_statement: formData.mentoring_statement,
      max_mentees: parseNumeric(formData.max_mentees),
      mentoring_experience_description: formData.mentoring_experience_description,
    };

    console.log('Submitting profileData:', profileData); // Log data before sending

    try {
      console.log('Sending upsert request to Supabase...');
      const response = await supabase
        .from('mentors')
        .upsert(profileData, { 
          onConflict: 'user_id',
        })
        .select()
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors if nothing is returned
      
      console.log('Full Supabase response:', response);
      const { data, error } = response;
      
      if (error) {
        console.error('Error from Supabase:', error);
        console.error('Status:', error.status);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        toast.error(`Failed to save mentor profile: ${error.message}`);
        return; // Stop execution if there's an error
      }

      console.log('Success! Mentor profile data:', data);
      toast.success('Mentor profile saved successfully!');
      
      // Wait a bit before redirecting to ensure the toast is visible
      setTimeout(() => {
        // Only navigate if the component is still mounted
        navigate('/mentorship');
      }, 1500);
      
    } catch (error) {
      console.error('Exception in save operation:', error);
      console.error('Error type:', typeof error);
      console.error('Error stringified:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
      toast.error(`Failed to save mentor profile: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto p-4 text-center">Loading form...</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl bg-white shadow-xl rounded-lg my-10">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 border-b pb-4">Mentor Profile</h1>
      <form onSubmit={handleSubmit} className="space-y-8">
        
        <div>
          <label htmlFor="mentoring_capacity_hours_per_month" className="block text-sm font-medium text-gray-700 mb-1">
            Mentoring Capacity (Hours per Month) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="mentoring_capacity_hours_per_month"
            id="mentoring_capacity_hours_per_month"
            value={formData.mentoring_capacity_hours_per_month}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., 5"
          />
        </div>

        <div>
          <label htmlFor="expertise_tags" className="block text-sm font-medium text-gray-700 mb-1">
            Areas of Expertise (comma-separated) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="expertise_tags"
            id="expertise_tags"
            value={formData.expertise_tags}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., Software Development, Product Management, Career Coaching"
          />
          <p className="mt-1 text-xs text-gray-500">Enter multiple areas separated by commas.</p>
        </div>

        <fieldset className="border border-gray-300 p-6 rounded-md">
            <legend className="text-lg font-medium text-gray-800 px-2">Mentoring Preferences</legend>
            <div className="space-y-4 mt-2">
                 <div>
                    <label htmlFor="communication" className="block text-sm font-medium text-gray-700 mb-1">Preferred Communication <span className="text-red-500">*</span></label>
                    <input type="text" name="communication" id="communication" value={formData.mentoring_preferences.communication} onChange={handlePreferenceChange} required className="mt-1 block w-full px-4 py-2.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., Email, Zoom, Slack"/>
                </div>
                <div>
                    <label htmlFor="format" className="block text-sm font-medium text-gray-700 mb-1">Preferred Format <span className="text-red-500">*</span></label>
                    <input type="text" name="format" id="format" value={formData.mentoring_preferences.format} onChange={handlePreferenceChange} required className="mt-1 block w-full px-4 py-2.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., 1-on-1, Group Sessions"/>
                </div>
                <div>
                    <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">Preferred Duration <span className="text-red-500">*</span></label>
                    <input type="text" name="duration" id="duration" value={formData.mentoring_preferences.duration} onChange={handlePreferenceChange} required className="mt-1 block w-full px-4 py-2.5 text-sm border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" placeholder="e.g., 3 months, Ongoing, Project-based"/>
                </div>
            </div>
        </fieldset>

        <div>
          <label htmlFor="mentoring_experience_years" className="block text-sm font-medium text-gray-700 mb-1">
            Years of Mentoring Experience <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="mentoring_experience_years"
            id="mentoring_experience_years"
            value={formData.mentoring_experience_years}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., 3"
          />
        </div>
        
        <div>
          <label htmlFor="mentoring_experience_description" className="block text-sm font-medium text-gray-700 mb-1">
            Describe Your Mentoring Experience (Optional)
          </label>
          <textarea
            name="mentoring_experience_description"
            id="mentoring_experience_description"
            rows="4"
            value={formData.mentoring_experience_description}
            onChange={handleChange}
            className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="Briefly describe your past mentoring roles, approaches, or successes."
          ></textarea>
        </div>

        <div>
          <label htmlFor="mentoring_statement" className="block text-sm font-medium text-gray-700 mb-1">
            Brief Mentoring Statement <span className="text-red-500">*</span>
          </label>
          <textarea
            name="mentoring_statement"
            id="mentoring_statement"
            rows="4"
            value={formData.mentoring_statement}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="What can mentees expect from you? What are your strengths as a mentor?"
          ></textarea>
        </div>

        <div>
          <label htmlFor="max_mentees" className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Number of Mentees at a Time <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="max_mentees"
            id="max_mentees"
            value={formData.max_mentees}
            onChange={handleChange}
            required
            className="mt-1 block w-full px-4 py-2.5 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., 2"
          />
        </div>

        <div className="pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={saving || loading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-60"
          >
            {saving ? 'Saving Profile...' : (loading ? 'Loading...' : 'Save Mentor Profile')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MentorRegistrationForm;
