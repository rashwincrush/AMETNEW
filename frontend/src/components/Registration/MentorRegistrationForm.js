import React, { useState } from 'react';
import { supabase } from '../../utils/supabase';

export default function MentorRegistrationForm() {
  const [formData, setFormData] = useState({
    mentoring_capacity_hours_per_month: '',
    areas_of_expertise: '',
    mentoring_preferences: '',
    mentoring_experience_years: '',
    mentoring_statement: '',
    max_mentees: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const { error } = await supabase
        .from('mentors')
        .upsert([
          {
            user_id: user.id,
            ...formData
          }
        ]);
        
      if (error) throw error;
      setSuccess(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Mentor Registration</h2>
      {success ? (
        <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
          Registration successful!
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="mentoring_capacity_hours_per_month">
              Mentoring Capacity (hours per month)
            </label>
            <input
              type="number"
              id="mentoring_capacity_hours_per_month"
              name="mentoring_capacity_hours_per_month"
              value={formData.mentoring_capacity_hours_per_month}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="areas_of_expertise">
              Areas of Expertise
            </label>
            <textarea
              id="areas_of_expertise"
              name="areas_of_expertise"
              value={formData.areas_of_expertise}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              required
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="mentoring_preferences">
              Mentoring Preferences (communication, format, duration)
            </label>
            <textarea
              id="mentoring_preferences"
              name="mentoring_preferences"
              value={formData.mentoring_preferences}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              required
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="mentoring_experience_years">
              Mentoring Experience (years)
            </label>
            <input
              type="number"
              id="mentoring_experience_years"
              name="mentoring_experience_years"
              value={formData.mentoring_experience_years}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="mentoring_statement">
              Brief Mentoring Statement
            </label>
            <textarea
              id="mentoring_statement"
              name="mentoring_statement"
              value={formData.mentoring_statement}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              required
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="max_mentees">
              Maximum Number of Mentees
            </label>
            <input
              type="number"
              id="max_mentees"
              name="max_mentees"
              value={formData.max_mentees}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          {error && (
            <div className="mb-4 text-red-500">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-200"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Register as Mentor'}
          </button>
        </form>
      )}
    </div>
  );
}
