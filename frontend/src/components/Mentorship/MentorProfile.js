import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { toast } from 'react-hot-toast';

const MentorProfile = () => {
  const { id } = useParams();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMentor = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('mentors')
          .select(`
            *,
            profile:user_id (full_name, avatar_url)
          `)
          .eq('user_id', id)
          .single();

        if (error) {
          throw error;
        }

        if (data) {
          setMentor(data);
        } else {
          toast.error('Mentor not found.');
        }
      } catch (error) {
        toast.error('Failed to fetch mentor details: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMentor();
  }, [id]);

  if (loading) {
    return <div className="text-center p-8">Loading mentor profile...</div>;
  }

  if (!mentor) {
    return <div className="text-center p-8">Mentor not found.</div>;
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-4 mb-6">
          <img 
            src={mentor.profile?.avatar_url || '/default-avatar.png'} 
            alt={mentor.profile?.full_name}
            className="w-24 h-24 rounded-full object-cover"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{mentor.profile?.full_name}</h1>
            <p className="text-xl text-gray-600">Maritime Professional</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">About Me</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{mentor.mentoring_statement}</p>

            <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-3">Expertise</h3>
            <div className="flex flex-wrap gap-2">
              {mentor.expertise?.map((skill, index) => (
                <span key={index} className="bg-ocean-100 text-ocean-800 px-3 py-1 rounded-full text-sm font-medium">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Mentorship Details</h3>
            <ul className="space-y-3 text-gray-700">
              <li><strong>Experience:</strong> {mentor.mentoring_experience_years} years</li>
              <li><strong>Max Mentees:</strong> {mentor.max_mentees}</li>
              <li><strong>Capacity:</strong> {mentor.mentoring_capacity_hours_per_month} hours/month</li>
                            <li>
                <strong>Preferences:</strong>
                {typeof mentor.mentoring_preferences === 'object' && mentor.mentoring_preferences ? (
                  <ul className="list-disc list-inside pl-4 mt-1 text-sm">
                    {Object.entries(mentor.mentoring_preferences).map(([key, value]) => (
                      <li key={key}><span className="capitalize font-medium">{key}:</span> {String(value)}</li>
                    ))}
                  </ul>
                ) : (
                  <span> {String(mentor.mentoring_preferences || 'Not specified')}</span>
                )}
              </li>
            </ul>
            <button className="btn-ocean w-full mt-6 py-2">Request Mentorship</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorProfile;
