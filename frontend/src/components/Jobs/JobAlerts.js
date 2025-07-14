import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../hooks/useNotification';
import { Link } from 'react-router-dom';
import { 
  BellIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  BriefcaseIcon,
  CurrencyRupeeIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const JobAlerts = () => {
  const { user } = useAuth();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);


  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    keywords: '',
    location: '',
    job_type: 'any',
    frequency: 'weekly',
    is_active: true
  });

  const jobTypes = [
    { value: 'any', label: 'Any Job Type' },
    { value: 'full-time', label: 'Full-time' },
    { value: 'part-time', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' }
  ];

  const experienceLevels = [
    { value: 'any', label: 'Any Experience Level' },
    { value: 'entry', label: 'Entry Level (0-2 years)' },
    { value: 'mid', label: 'Mid Level (3-7 years)' },
    { value: 'senior', label: 'Senior Level (8+ years)' }
  ];

  const frequencies = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'biweekly', label: 'Bi-weekly' },
    { value: 'monthly', label: 'Monthly' }
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const fetchAlerts = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('job_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      showError('Could not fetch your job alerts.');
      console.error('Error fetching job alerts:', error);
    } finally {
      setLoading(false);
    }
  }, [user, showError]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showError('You must be logged in to manage alerts.');
      return;
    }

    const alertData = {
      user_id: user.id,
      name: formData.name,
      keywords: formData.keywords.split(',').map(k => k.trim()).filter(Boolean),
      location: formData.location,
      job_type: formData.job_type,
      frequency: formData.frequency,
      is_active: formData.is_active,
    };

    try {
      let error;
      if (editingAlert) {
        // Update existing alert
        const { error: updateError } = await supabase
          .from('job_alerts')
          .update(alertData)
          .eq('id', editingAlert.id);
        error = updateError;
      } else {
        // Create new alert
        const { error: insertError } = await supabase
          .from('job_alerts')
          .insert(alertData);
        error = insertError;
      }

      if (error) throw error;

      showSuccess(editingAlert ? 'Job alert updated successfully!' : 'Job alert created successfully!');
      fetchAlerts(); // Refresh the list
      setShowCreateForm(false);
      setEditingAlert(null);
    } catch (error) {
      showError(`Error: ${error.message}`);
      console.error('Error submitting job alert:', error);
    }
  };

  const handleEdit = (alert) => {
    setEditingAlert(alert);
    setFormData({
      name: alert.name,
      keywords: Array.isArray(alert.keywords) ? alert.keywords.join(', ') : '',
      location: alert.location || '',
      job_type: alert.job_type || 'any',
      frequency: alert.frequency || 'weekly',
      is_active: alert.is_active
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (alertId) => {
    if (!window.confirm('Are you sure you want to delete this alert?')) return;

    try {
      const { error } = await supabase
        .from('job_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      showSuccess('Job alert deleted successfully!');
      fetchAlerts(); // Refresh the list
    } catch (error) {
      showError(`Error deleting alert: ${error.message}`);
      console.error('Error deleting job alert:', error);
    }
  };

  const toggleAlert = async (alert) => {
    try {
      const { error } = await supabase
        .from('job_alerts')
        .update({ is_active: !alert.is_active })
        .eq('id', alert.id);

      if (error) throw error;

      showSuccess(`Alert "${alert.name}" has been ${!alert.is_active ? 'activated' : 'deactivated'}.`);
      fetchAlerts(); // Refresh the list
    } catch (error) {
      showError(`Error updating alert status: ${error.message}`);
      console.error('Error toggling alert:', error);
    }
  };

  const getFrequencyBadgeColor = (frequency) => {
    switch (frequency) {
      case 'daily': return 'bg-green-100 text-green-800';
      case 'weekly': return 'bg-blue-100 text-blue-800';
      case 'biweekly': return 'bg-purple-100 text-purple-800';
      case 'monthly': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Alerts</h1>
            <p className="text-gray-600">
              Get notified when new jobs matching your criteria are posted
            </p>
          </div>
          <button
            onClick={() => {
              setEditingAlert(null);
              setFormData({
                title: '',
                keywords: '',
                location: '',
                jobType: 'any',
                experienceLevel: 'any',
                salaryMin: '',
                salaryMax: '',
                frequency: 'weekly',
                isActive: true
              });
              setShowCreateForm(true);
            }}
            className="btn-ocean px-4 py-2 rounded-lg flex items-center"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Create Alert
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-card rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-ocean-600">
            {alerts.filter(alert => alert.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Active Alerts</div>
        </div>
        <div className="glass-card rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-green-600">
            {alerts.reduce((sum, alert) => sum + alert.matchingJobs, 0)}
          </div>
          <div className="text-sm text-gray-600">Jobs Found This Week</div>
        </div>
        <div className="glass-card rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-purple-600">
            {alerts.filter(alert => alert.lastSent).length}
          </div>
          <div className="text-sm text-gray-600">Alerts Sent</div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="glass-card rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Job Alerts</h2>
        
        {alerts.length === 0 ? (
          <div className="text-center py-12">
            <BellIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No job alerts yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first job alert to get notified about relevant opportunities
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-ocean px-4 py-2 rounded-lg"
            >
              Create Your First Alert
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="border border-gray-200 rounded-lg p-6 hover:bg-ocean-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getFrequencyBadgeColor(alert.frequency)}`}>
                        {alert.frequency}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        alert.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {alert.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-3 text-sm">
                      <div className="flex items-center">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">Keywords:</span>
                        <span className="ml-1 font-medium">{alert.keywords}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <MapPinIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">Location:</span>
                        <span className="ml-1 font-medium">{alert.location}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <BriefcaseIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-1 font-medium">{alert.jobType}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <ClockIcon className="w-4 h-4 text-gray-400 mr-2" />
                        <span className="text-gray-600">Experience:</span>
                        <span className="ml-1 font-medium">{alert.experienceLevel}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-gray-500">
                      <span>Created: {new Date(alert.createdDate).toLocaleDateString()}</span>
                      {alert.lastSent && (
                        <span>Last sent: {new Date(alert.lastSent).toLocaleDateString()}</span>
                      )}
                      <span className="text-ocean-600 font-medium">
                        {alert.matchingJobs} matching jobs
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={alert.isActive}
                        onChange={() => toggleAlert(alert.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-ocean-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ocean-600"></div>
                    </label>
                    
                    <button
                      onClick={() => handleEdit(alert)}
                      className="p-2 text-gray-400 hover:text-ocean-600 rounded-lg hover:bg-ocean-100"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(alert.id)}
                      className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-100"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Alert Form */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="glass-card rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingAlert ? 'Edit Job Alert' : 'Create Job Alert'}
              </h2>
              <button 
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingAlert(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Title *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="form-input w-full px-3 py-2 rounded-lg"
                  placeholder="e.g., Senior Marine Engineer Jobs"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords *
                </label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  required
                  className="form-input w-full px-3 py-2 rounded-lg"
                  placeholder="e.g., Marine Engineer, Chief Engineer, Ship Operations"
                />
                <p className="text-xs text-gray-500 mt-1">Separate multiple keywords with commas</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="form-input w-full px-3 py-2 rounded-lg"
                    placeholder="e.g., Mumbai, Chennai or leave empty for all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Type
                  </label>
                  <select
                    name="job_type"
                    value={formData.job_type}
                    onChange={handleInputChange}
                    className="form-input w-full px-3 py-2 rounded-lg"
                  >
                    {jobTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Level
                </label>
                <select
                  name="experienceLevel"
                  value={formData.experienceLevel}
                  onChange={handleInputChange}
                  className="form-input w-full px-3 py-2 rounded-lg"
                >
                  {experienceLevels.map(level => (
                    <option key={level.value} value={level.value}>{level.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Salary Range (Optional)
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="number"
                    name="salaryMin"
                    value={formData.salaryMin}
                    onChange={handleInputChange}
                    className="form-input w-full px-3 py-2 rounded-lg"
                    placeholder="Min (₹ LPA)"
                  />
                  <input
                    type="number"
                    name="salaryMax"
                    value={formData.salaryMax}
                    onChange={handleInputChange}
                    className="form-input w-full px-3 py-2 rounded-lg"
                    placeholder="Max (₹ LPA)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Frequency
                </label>
                <select
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleInputChange}
                  className="form-input w-full px-3 py-2 rounded-lg"
                >
                  {frequencies.map(freq => (
                    <option key={freq.value} value={freq.value}>{freq.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="mr-2"
                />
                <label className="text-sm text-gray-700">
                  Activate this alert immediately
                </label>
              </div>

              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingAlert(null);
                  }}
                  className="btn-ocean-outline px-6 py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-ocean px-6 py-2 rounded-lg"
                >
                  {editingAlert ? 'Update Alert' : 'Create Alert'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="glass-card rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 Tips for Better Job Alerts</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Keywords</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Use specific job titles for precise results</li>
              <li>• Include related terms (e.g., "Marine Engineer" + "Chief Engineer")</li>
              <li>• Try both acronyms and full terms</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Frequency</h4>
            <ul className="space-y-1 text-gray-600">
              <li>• Daily: For urgent job hunting</li>
              <li>• Weekly: Balanced frequency for most users</li>
              <li>• Monthly: For passive job seekers</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobAlerts;