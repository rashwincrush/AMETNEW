import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    longDescription: '',
    category: 'networking',
    type: 'in-person',
    date: '',
    startTime: '',
    endTime: '',
    venue: '',
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
    console.log('Entering validateForm...');
    try {
      const newErrors = {};

      if (!formData.title.trim()) newErrors.title = 'Event title is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (!formData.date) newErrors.date = 'Date is required';
      if (!formData.startTime) newErrors.startTime = 'Start time is required';
      if (!formData.endTime) newErrors.endTime = 'End time is required';
      if (formData.type === 'in-person') {
        if (!formData.venue.trim()) newErrors.venue = 'Venue name is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
      }
      if (formData.type === 'virtual' && !formData.virtualLink.trim()) {
        newErrors.virtualLink = 'Virtual meeting link is required';
      }
      // Ensure maxAttendees is treated as a number for comparison
      const maxAttendeesNum = parseInt(formData.maxAttendees, 10);
      if (isNaN(maxAttendeesNum) || maxAttendeesNum < 1) {
        newErrors.maxAttendees = 'Maximum attendees must be a number and at least 1';
      }
      // Ensure price is treated as a number for comparison
      const priceNum = parseFloat(formData.price);
      if (formData.priceType === 'paid' && (isNaN(priceNum) || priceNum < 0)) {
        newErrors.price = 'Price must be a valid number for paid events';
      }
      if (!formData.organizerName.trim()) newErrors.organizerName = 'Organizer name is required';
      if (!formData.organizerEmail.trim()) newErrors.organizerEmail = 'Organizer email is required';

      // Validate date is not in the past
      if (formData.date) {
        const eventDate = new Date(formData.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Compare date part only
        // Check if eventDate is a valid date before comparison
        if (!isNaN(eventDate.getTime()) && eventDate < today) {
          newErrors.date = 'Event date cannot be in the past';
        }
      } else {
        // If date is not set, it's already caught by '!formData.date' check
      }

      // Validate end time is after start time
      if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
        newErrors.endTime = 'End time must be after start time';
      }

      setErrors(newErrors);
      const isValid = Object.keys(newErrors).length === 0;
      console.log('validateForm - newErrors (inside try):', JSON.stringify(newErrors));
      console.log('validateForm - isValid (inside try):', isValid);
      return isValid;
    } catch (error) {
      console.error('Error caught inside validateForm:', error);
      setErrors(prevErrors => ({ ...prevErrors, form: 'An unexpected error occurred during validation.' }));
      console.log('validateForm - returning false due to internal error');
      return false; // Ensure it returns false if an error happens
    }
  };

  const handleSubmit = async (e) => {
    try {
      console.log('Submit button clicked - starting event creation');
      e.preventDefault();
      if (!user) {
        toast.error("You must be logged in to create an event.");
        return;
      }
      console.log('Form validation starting...');
      const isFormValid = validateForm();
      if (!isFormValid) {
        console.log('handleSubmit: Form validation failed. Errors:', JSON.stringify(errors)); // Log current errors state
        toast.error('Please fix the errors before submitting.');
        return;
      }
      console.log('Form validation passed');
      setIsSubmitting(true);
      console.log('Starting image processing');
      let imageUrl = null;
      if (formData.image) {
        console.log('Image found, processing upload...');
        const fileExt = formData.image.name.split('.').pop();
        const fileName = `${user.id}_${Date.now()}.${fileExt}`;
        // Corrected filePath to be just the fileName, as Supabase storage policies might be set at the bucket level
        // and prepending 'event-images/' here might conflict if the bucket policy already implies this path.
        // The .from('event-images') already specifies the bucket.
        const filePath = `${fileName}`;
        console.log('Uploading image to Supabase storage bucket: event-images, filePath:', filePath);
        const { error: uploadError } = await supabase.storage
          .from('event-images') // Corrected bucket name
          .upload(filePath, formData.image);
        if (uploadError) {
          console.error('Image upload error:', uploadError);
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }
        console.log('Image uploaded successfully, getting URL');
        const { data: urlData } = supabase.storage
          .from('event-images') // Corrected bucket name
          .getPublicUrl(filePath);
        if (!urlData || !urlData.publicUrl) { // Check for publicUrl specifically
          console.error('Failed to get URL data or publicUrl is missing', urlData);
          throw new Error('Could not get public URL for the image.');
        }
        console.log('Got image URL:', urlData.publicUrl);
        imageUrl = urlData.publicUrl;
      }

      console.log('Image processing complete');
      console.log('Creating event data object');
      const eventData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        event_type: formData.type,
        // Persist timestamps in UTC to avoid client timezone shifts
        // Build from local date+time, then convert to ISO (UTC)
        start_date: new Date(`${formData.date}T${formData.startTime}:00`).toISOString(),
        end_date: new Date(`${formData.date}T${formData.endTime}:00`).toISOString(),
        venue: formData.venue,
        address: formData.address,
        virtual_link: formData.virtualLink,
        max_attendees: !isNaN(parseInt(formData.maxAttendees, 10)) ? parseInt(formData.maxAttendees, 10) : null,
        cost: formData.priceType === 'free' ? '0' : (!isNaN(parseFloat(formData.price)) ? formData.price.toString() : '0'),
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(t => t),
        featured_image_url: imageUrl, // Changed from image_url to featured_image_url to match DB schema
        agenda: JSON.stringify(formData.agenda.filter(item => item.time && item.activity)),
        is_published: true,
        user_id: user.id,
        organizer_id: user.id // Required field according to schema
      };
      
      console.log('Submitting event data to Supabase:', eventData);
      const { data: insertedData, error: insertError } = await supabase
        .from('events')
        .insert([eventData])
        .select();
      console.log('Response from insert:', { data: insertedData, error: insertError });
      
      // Debug: Immediately query for events to see what's in the DB
      const { data: allEvents } = await supabase
        .from('events')
        .select('*');
      console.log('All events in database after insertion:', allEvents);

      // Debug: Specifically check our newly created event
      if (insertedData && insertedData.length > 0) {
        const newEventId = insertedData[0].id;
        const { data: verifyEvent } = await supabase
          .from('events')
          .select('*')
          .eq('id', newEventId)
          .single();
        console.log('Verification of newly created event:', verifyEvent);
      }

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        throw new Error(`Database insert failed: ${insertError.message}`);
      }

      if (!insertedData || insertedData.length === 0) {
        console.error('Event created but no data returned. Check RLS policies.');
        throw new Error('Event was not created successfully. You may not have permission to view it.');
      }
      
      toast.success('Event created successfully!');
      navigate('/events');
    } catch (error) {
      console.error('Top level error caught in handleSubmit:', error);
      console.error('Error creating event:', error);
      toast.error(`Error creating event: ${error.message}`);
    } finally {
      console.log('Finishing event submission process');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="glass-card rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Create New Event</h1>
        <p className="text-gray-600">Organize and manage events for the AMET alumni community</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className="form-input w-full px-3 py-2 rounded-lg"
              >
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Type *
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="in-person"
                    checked={formData.type === 'in-person'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <BuildingOfficeIcon className="w-4 h-4 mr-1" />
                  In-Person
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="type"
                    value="virtual"
                    checked={formData.type === 'virtual'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  <VideoCameraIcon className="w-4 h-4 mr-1" />
                  Virtual
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={`form-input w-full px-3 py-2 rounded-lg ${errors.description ? 'border-red-500' : ''}`}
                placeholder="Brief description of the event"
              />
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
                rows={6}
                className="form-input w-full px-3 py-2 rounded-lg"
                placeholder="Detailed description, agenda, what attendees can expect..."
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="form-input w-full px-3 py-2 rounded-lg"
                placeholder="e.g., networking, career, technology"
              />
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="glass-card rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Date & Time</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Date *
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
          </div>
        </div>

        {/* Location */}
        <div className="glass-card rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Location</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue Name *
              </label>
              <input
                type="text"
                name="venue"
                value={formData.venue}
                onChange={handleInputChange}
                className={`form-input w-full px-3 py-2 rounded-lg ${errors.venue ? 'border-red-500' : ''}`}
                placeholder="e.g., AMET Campus Auditorium"
              />
              {errors.venue && <p className="text-red-500 text-sm mt-1">{errors.venue}</p>}
            </div>

            {formData.type === 'in-person' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Address *
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
            {formData.type === 'virtual' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Virtual Meeting Link *
                </label>
                <input
                  type="url"
                  name="virtualLink"
                  value={formData.virtualLink}
                  onChange={handleInputChange}
                  className={`form-input w-full px-3 py-2 rounded-lg ${errors.virtualLink ? 'border-red-500' : ''}`}
                  placeholder="https://zoom.us/j/123456789"
                />
                {errors.virtualLink && <p className="text-red-500 text-sm mt-1">{errors.virtualLink}</p>}
              </div>
            )}
          </div>
        </div>

        {/* Attendance & Pricing */}
        <div className="glass-card rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance & Pricing</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Maximum Attendees *
              </label>
              <input
                type="number"
                name="maxAttendees"
                value={formData.maxAttendees}
                onChange={handleInputChange}
                min="1"
                className={`form-input w-full px-3 py-2 rounded-lg ${errors.maxAttendees ? 'border-red-500' : ''}`}
                placeholder="50"
              />
              {errors.maxAttendees && <p className="text-red-500 text-sm mt-1">{errors.maxAttendees}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pricing
              </label>
              <select
                name="priceType"
                value={formData.priceType}
                onChange={handleInputChange}
                className="form-input w-full px-3 py-2 rounded-lg"
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>

            {formData.priceType === 'paid' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (₹) *
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  min="0"
                  className={`form-input w-full px-3 py-2 rounded-lg ${errors.price ? 'border-red-500' : ''}`}
                  placeholder="500"
                />
                {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
              </div>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="requiresApproval"
                checked={formData.requiresApproval}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Require admin approval for registrations</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                name="allowWaitingList"
                checked={formData.allowWaitingList}
                onChange={handleInputChange}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Allow waiting list when event is full</span>
            </label>
          </div>
        </div>

        {/* Event Image */}
        <div className="glass-card rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Event Image</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-center w-full">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <PhotoIcon className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> event cover image
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG or JPEG (MAX. 5MB)</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
            </div>
            
            {previewImage && (
              <div className="mt-4">
                <img 
                  src={previewImage} 
                  alt="Preview" 
                  className="w-full h-40 object-cover rounded-lg"
                />
              </div>
            )}
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
            onClick={() => navigate('/events')}
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
                <span className="ml-2">Creating Event...</span>
              </div>
            ) : (
              'Create Event'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateEvent;