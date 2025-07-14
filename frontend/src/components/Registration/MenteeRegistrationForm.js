import React, { useState } from 'react';
import { supabase } from '../../utils/supabase';

export default function MenteeRegistrationForm() {
  const [formData, setFormData] = useState({
    career_goals: '',
    areas_seeking_mentorship: '',
    specific_skills_to_develop: '',
    preferred_mentor_characteristics: '',
    time_commitment_available: '',
    preferred_communication_method: '',
    statement_of_expectations: ''
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
        .from('mentee_profiles')
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
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Mentee Registration</h2>
      {success ? (
        <div className="bg-green-100 text-green-700 p-4 rounded mb-4">
          Registration successful!
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="career_goals">
              Career Goals
            </label>
            <textarea
              id="career_goals"
              name="career_goals"
              value={formData.career_goals}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              required
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="areas_seeking_mentorship">
              Areas Seeking Mentorship
            </label>
            <textarea
              id="areas_seeking_mentorship"
              name="areas_seeking_mentorship"
              value={formData.areas_seeking_mentorship}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              required
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="specific_skills_to_develop">
              Specific Skills to Develop
            </label>
            <textarea
              id="specific_skills_to_develop"
              name="specific_skills_to_develop"
              value={formData.specific_skills_to_develop}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              required
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="preferred_mentor_characteristics">
              Preferred Mentor Characteristics
            </label>
            <textarea
              id="preferred_mentor_characteristics"
              name="preferred_mentor_characteristics"
              value={formData.preferred_mentor_characteristics}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              required
            ></textarea>
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="time_commitment_available">
              Time Commitment Available (hours per week)
            </label>
            <input
              type="number"
              id="time_commitment_available"
              name="time_commitment_available"
              value={formData.time_commitment_available}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="preferred_communication_method">
              Preferred Communication Method
            </label>
            <input
              type="text"
              id="preferred_communication_method"
              name="preferred_communication_method"
              value={formData.preferred_communication_method}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-gray-700 mb-2" htmlFor="statement_of_expectations">
              Brief Statement of Expectations
            </label>
            <textarea
              id="statement_of_expectations"
              name="statement_of_expectations"
              value={formData.statement_of_expectations}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="3"
              required
            ></textarea>
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
            {loading ? 'Processing...' : 'Register as Mentee'}
          </button>
        </form>
      )}
    </div>
  );
}
