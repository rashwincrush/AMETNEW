import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  PhotoIcon,
  CalendarIcon,
  MapPinIcon,
  VideoCameraIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CurrencyRupeeIcon,
  ClockIcon,
  DocumentTextIcon,
  TagIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    longDescription: '',
    category: 'networking',
    type: 'in-person',
    date: '',
    startTime: '',
    endTime: '',
    location: '',
    address: '',
    virtualLink: '',
    maxAttendees: '',
    price: '',
    priceType: 'free',
    requiresApproval: false,
    allowWaitingList: true,
    tags: '',
    organizerName: '',
    organizerEmail: '',
    organizerPhone: '',
    image: null,
    agenda: [{ time: '', activity: '' }],
    requirements: [''],
    amenities: ['']
  });

  const [errors, setErrors] = useState({});
  const [previewImage, setPreviewImage] = useState(null);

  const categories = [
    { value: 'networking', label: 'Networking' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'seminar', label: 'Seminar' },
    { value: 'reunion', label: 'Reunion' },
    { value: 'sports', label: 'Sports' },
    { value: 'cultural', label: 'Cultural' },
    { value: 'career', label: 'Career Development' },
    { value: 'technical', label: 'Technical' },
    { value: 'social', label: 'Social' }
  ];

  // Fetch event data when component mounts
  useEffect(() => {
    if (!isAdmin) {
      navigate('/events', { 
        replace: true, 
        state: { error: 'You do not have permission to edit events' } 
      });
      return;
    }
    
    fetchEvent();
  }, [id, isAdmin, navigate]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) throw new Error('Event not found');

      // Format the data to match our form structure
      const eventData = {
        title: data.title || '',
        description: data.description || '',
        longDescription: data.long_description || '',
        category: data.category || 'networking',
        type: data.event_type || 'in-person',
        date: data.start_date ? data.start_date.split('T')[0] : '',
        startTime: data.start_date ? data.start_date.split('T')[1].substring(0, 5) : '',
        endTime: data.end_date ? data.end_date.split('T')[1].substring(0, 5) : '',
        location: data.location || '',
        address: data.address || '',
        virtualLink: data.virtual_link || '',
        maxAttendees: data.max_attendees || '',
        price: data.price || '',
        priceType: data.price > 0 ? 'paid' : 'free',
        requiresApproval: data.requires_approval || false,
        allowWaitingList: data.allow_waiting_list !== false,
        tags: data.tags || '',
        organizerName: data.organizer_name || '',
        organizerEmail: data.organizer_email || '',
        organizerPhone: data.organizer_phone || '',
        agenda: data.agenda && data.agenda.length > 0 ? data.agenda : [{ time: '', activity: '' }],
        requirements: data.requirements && data.requirements.length > 0 ? data.requirements : [''],
        amenities: data.amenities && data.amenities.length > 0 ? data.amenities : ['']
      };

      setFormData(eventData);
      
      // If there's an image, set the preview
      if (data.image_url) {
        setPreviewImage(data.image_url);
      }
    } catch (err) {
      console.error('Error fetching event:', err);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onload = (e) => setPreviewImage(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAgendaChange = (index, field, value) => {
    const newAgenda = [...formData.agenda];
    newAgenda[index][field] = value;
    setFormData(prev => ({ ...prev, agenda: newAgenda }));
  };

  const addAgendaItem = () => {
    setFormData(prev => ({
      ...prev,
      agenda: [...prev.agenda, { time: '', activity: '' }]
    }));
  };

  const removeAgendaItem = (index) => {
    if (formData.agenda.length > 1) {
      const newAgenda = formData.agenda.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, agenda: newAgenda }));
    }
  };

  const handleListChange = (field, index, value) => {
    const newList = [...formData[field]];
    newList[index] = value;
    setFormData(prev => ({ ...prev, [field]: newList }));
  };

  const addListItem = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], '']
    }));
  };

  const removeListItem = (field, index) => {
    if (formData[field].length > 1) {
      const newList = formData[field].filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, [field]: newList }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) newErrors.title = 'Event title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    
    if (formData.type === 'in-person' && !formData.address.trim()) {
      newErrors.address = 'Address is required for in-person events';
    }
    
    if (formData.type === 'virtual' && !formData.virtualLink.trim()) {
      newErrors.virtualLink = 'Virtual link is required for virtual events';
    }
    
    if (formData.priceType === 'paid' && (!formData.price || parseFloat(formData.price) <= 0)) {
      newErrors.price = 'Please enter a valid price amount';
    }
    
    if (!formData.organizerName.trim()) newErrors.organizerName = 'Organizer name is required';
    if (!formData.organizerEmail.trim()) newErrors.organizerEmail = 'Organizer email is required';
    
    // Validate email format
    if (formData.organizerEmail && !/^\S+@\S+\.\S+$/.test(formData.organizerEmail)) {
      newErrors.organizerEmail = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare event data for update
      const eventData = {
        title: formData.title,
        description: formData.description,
        long_description: formData.longDescription,
        category: formData.category,
        event_type: formData.type,
        start_date: `${formData.date}T${formData.startTime}:00`,
        end_date: `${formData.date}T${formData.endTime}:00`,
        location: formData.location,
        address: formData.address,
        virtual_link: formData.virtualLink,
        max_attendees: formData.maxAttendees ? parseInt(formData.maxAttendees) : null,
        price: formData.priceType === 'paid' ? parseFloat(formData.price) : 0,
        requires_approval: formData.requiresApproval,
        allow_waiting_list: formData.allowWaitingList,
        tags: formData.tags,
        organizer_name: formData.organizerName,
        organizer_email: formData.organizerEmail,
        organizer_phone: formData.organizerPhone,
        agenda: formData.agenda.filter(item => item.time || item.activity),
        requirements: formData.requirements.filter(item => item),
        amenities: formData.amenities.filter(item => item),
        updated_at: new Date().toISOString(),
        updated_by: user?.id
      };
      
      // Update event in database
      const { error: updateError } = await supabase
        .from('events')
        .update(eventData)
        .eq('id', id);
      
      if (updateError) throw updateError;
      
      // Handle image upload if a new image was selected
      if (formData.image && formData.image instanceof File) {
        const fileExt = formData.image.name.split('.').pop();
        const fileName = `${id}-${Date.now()}.${fileExt}`;
        const filePath = `event-images/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('events')
          .upload(filePath, formData.image);
        
        if (uploadError) throw uploadError;
        
        // Get the public URL for the uploaded image
        const { data: { publicUrl } } = supabase.storage
          .from('events')
          .getPublicUrl(filePath);
        
        // Update the event with the new image URL
        const { error: imageUpdateError } = await supabase
          .from('events')
          .update({ image_url: publicUrl })
          .eq('id', id);
        
        if (imageUpdateError) throw imageUpdateError;
      }
      
      toast.success('Event updated successfully!');
      navigate(`/events/${id}`);
    } catch (err) {
      console.error('Error updating event:', err);
      toast.error('Failed to update event');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Event</h1>
        <p className="text-gray-600">Update your event details below</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Information */}
        <div className="glass-card rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className={`form-input w-full px-3 py-2 rounded-lg ${errors.title ? 'border-red-500' : ''}`}
                placeholder="Enter event title"
              />
              {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="2"
                className={`form-textarea w-full px-3 py-2 rounded-lg ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Brief description of your event (max 200 characters)"
                maxLength="200"
              ></textarea>
              {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description
              </label>
              <textarea
                name="longDescription"
                value={formData.longDescription}
                onChange={handleInputChange}
                rows="5"
                className="form-textarea w-full px-3 py-2 rounded-lg"
                placeholder="Provide more details about your event"
              ></textarea>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-select w-full px-3 py-2 rounded-lg"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="form-select w-full px-3 py-2 rounded-lg"
              >
                <option value="in-person">In-Person</option>
                <option value="virtual">Virtual</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>
        </div>

        {/* Date & Location */}
        <div className="glass-card rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Date & Location</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={`form-input w-full px-3 py-2 rounded-lg ${errors.date ? 'border-red-500' : ''}`}
              />
              {errors.date && <p className="text-red-500 text-sm mt-1">{errors.date}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleInputChange}
                className={`form-input w-full px-3 py-2 rounded-lg ${errors.startTime ? 'border-red-500' : ''}`}
              />
              {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleInputChange}
                className={`form-input w-full px-3 py-2 rounded-lg ${errors.endTime ? 'border-red-500' : ''}`}
              />
              {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>}
            </div>
            
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location Name *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={`form-input w-full px-3 py-2 rounded-lg ${errors.location ? 'border-red-500' : ''}`}
                placeholder="e.g., Conference Center, Zoom"
              />
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>
            
            {(formData.type === 'in-person' || formData.type === 'hybrid') && (
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className={`form-input w-full px-3 py-2 rounded-lg ${errors.address ? 'border-red-500' : ''}`}
                  placeholder="Full address of the venue"
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>
            )}
            
            {(formData.type === 'virtual' || formData.type === 'hybrid') && (
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Virtual Link
                </label>
                <input
                  type="text"
                  name="virtualLink"
                  value={formData.virtualLink}
                  onChange={handleInputChange}
                  className={`form-input w-full px-3 py-2 rounded-lg ${errors.virtualLink ? 'border-red-500' : ''}`}
                  placeholder="URL for virtual attendance"
                />
                {errors.virtualLink && <p className="text-red-500 text-sm mt-1">{errors.virtualLink}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Event Image */}
        <div className="glass-card rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Image</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cover Image
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              <div className="space-y-1 text-center">
                {previewImage ? (
                  <div className="relative">
                    <img 
                      src={previewImage} 
                      alt="Event cover" 
                      className="mx-auto h-64 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setPreviewImage(null);
                        setFormData(prev => ({ ...prev, image: null }));
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"
                      aria-label="Remove image"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <PhotoIcon className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> event cover image
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleImageChange}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Organizer Information */}
        <div className="glass-card rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Organizer Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organizer Name *
              </label>
              <input
                type="text"
                name="organizerName"
                value={formData.organizerName}
                onChange={handleInputChange}
                className={`form-input w-full px-3 py-2 rounded-lg ${errors.organizerName ? 'border-red-500' : ''}`}
                placeholder="Your name"
              />
              {errors.organizerName && <p className="text-red-500 text-sm mt-1">{errors.organizerName}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="organizerEmail"
                value={formData.organizerEmail}
                onChange={handleInputChange}
                className={`form-input w-full px-3 py-2 rounded-lg ${errors.organizerEmail ? 'border-red-500' : ''}`}
                placeholder="organizer@email.com"
              />
              {errors.organizerEmail && <p className="text-red-500 text-sm mt-1">{errors.organizerEmail}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="organizerPhone"
                value={formData.organizerPhone}
                onChange={handleInputChange}
                className="form-input w-full px-3 py-2 rounded-lg"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate(`/events/${id}`)}
            className="btn-ocean-outline px-6 py-2 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-ocean px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <div className="loading-wave"></div>
                <div className="loading-wave"></div>
                <div className="loading-wave"></div>
                <span className="ml-2">Updating Event...</span>
              </div>
            ) : (
              'Update Event'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditEvent;
