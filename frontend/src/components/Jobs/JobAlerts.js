import React, { useState } from 'react';
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
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      title: 'Senior Marine Engineer Jobs',
      keywords: 'Senior Marine Engineer, Chief Engineer',
      location: 'Mumbai, Chennai',
      jobType: 'Full-time',
      experienceLevel: 'Senior Level',
      salaryRange: '₹12-20 LPA',
      frequency: 'weekly',
      isActive: true,
      createdDate: '2024-04-01',
      lastSent: '2024-04-08',
      matchingJobs: 3
    },
    {
      id: 2,
      title: 'Naval Architecture Opportunities',
      keywords: 'Naval Architect, Ship Design',
      location: 'Any Location',
      jobType: 'Any',
      experienceLevel: 'Mid Level',
      salaryRange: '₹8-15 LPA',
      frequency: 'daily',
      isActive: true,
      createdDate: '2024-03-25',
      lastSent: '2024-04-10',
      matchingJobs: 1
    },
    {
      id: 3,
      title: 'Port Management Roles',
      keywords: 'Port Manager, Logistics Manager',
      location: 'Kochi, Visakhapatnam',
      jobType: 'Full-time',
      experienceLevel: 'Senior Level',
      salaryRange: '₹15+ LPA',
      frequency: 'biweekly',
      isActive: false,
      createdDate: '2024-03-15',
      lastSent: '2024-03-29',
      matchingJobs: 0
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAlert, setEditingAlert] = useState(null);
  const [formData, setFormData] = useState({
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

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (editingAlert) {
      // Update existing alert
      setAlerts(prev => prev.map(alert => 
        alert.id === editingAlert.id 
          ? { ...alert, ...formData, id: editingAlert.id }
          : alert
      ));
    } else {
      // Create new alert
      const newAlert = {
        ...formData,
        id: Date.now(),
        createdDate: new Date().toISOString().split('T')[0],
        lastSent: null,
        matchingJobs: 0
      };
      setAlerts(prev => [newAlert, ...prev]);
    }

    // Reset form
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
    setShowCreateForm(false);
    setEditingAlert(null);
  };

  const handleEdit = (alert) => {
    setEditingAlert(alert);
    setFormData({
      title: alert.title,
      keywords: alert.keywords,
      location: alert.location,
      jobType: alert.jobType.toLowerCase().replace(' ', '-') || 'any',
      experienceLevel: alert.experienceLevel.toLowerCase().replace(' level', '').replace(' ', '-') || 'any',
      salaryMin: '',
      salaryMax: '',
      frequency: alert.frequency,
      isActive: alert.isActive
    });
    setShowCreateForm(true);
  };

  const handleDelete = (alertId) => {
    if (window.confirm('Are you sure you want to delete this job alert?')) {
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    }
  };

  const toggleAlert = (alertId) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, isActive: !alert.isActive }
        : alert
    ));
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
                  name="title"
                  value={formData.title}
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
                    name="jobType"
                    value={formData.jobType}
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
                  name="isActive"
                  checked={formData.isActive}
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