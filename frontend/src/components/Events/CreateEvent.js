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

  // Compress image before upload with better quality and size control
  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read the image file'));
      reader.onload = (event) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Failed to load the image'));
        img.onload = () => {
          const canvas = document.createElement('canvas');
          
          // Set maximum dimensions (reduced from 1200x800 to 800x600)
          const maxWidth = 800;
          const maxHeight = 600;
          
          // Calculate new dimensions while maintaining aspect ratio
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;
          
          // Draw image on canvas with new dimensions
          const ctx = canvas.getContext('2d', { alpha: false });
          ctx.fillStyle = '#FFFFFF'; // White background for transparent PNGs
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with adaptive quality
          let quality = 0.8;
          const MAX_ATTEMPTS = 5;
          const TARGET_SIZE = 500 * 1024; // 500KB target size
          
          const attemptCompression = (attempt = 1) => {
            return new Promise((resolveBlob) => {
              canvas.toBlob(
                (blob) => {
                  if (!blob) {
                    reject(new Error('Failed to compress image'));
                    return;
                  }
                  
                  // If file is still too large and we can reduce quality more
                  if (blob.size > TARGET_SIZE && quality > 0.4 && attempt < MAX_ATTEMPTS) {
                    quality -= 0.1; // Reduce quality by 10%
                    attempt++;
                    attemptCompression(attempt).then(resolveBlob);
                  } else {
                    resolveBlob(blob);
                  }
                },
                'image/jpeg',
                quality
              );
            });
          };

          attemptCompression().then((blob) => {
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            
            if (compressedFile.size > 1 * 1024 * 1024) { // 1MB
              reject(new Error('Image is too large after compression. Please choose a smaller image.'));
            } else {
              resolve(compressedFile);
            }
          }).catch(reject);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, or WebP)');
      e.target.value = ''; // Clear the file input
      return;
    }

    // Initial size check (10MB hard limit)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image is too large. Maximum size is 10MB.');
      e.target.value = '';
      return;
    }

    // Show loading state
    const toastId = toast.loading('Processing image...');
    
    try {
      // Always compress images larger than 500KB
      const shouldCompress = file.size > 500 * 1024;
      const processedFile = shouldCompress 
        ? await compressImage(file)
        : file;
      
      // Final size check (1MB limit after compression)
      if (processedFile.size > 1 * 1024 * 1024) {
        throw new Error('Image is too large after compression. Please choose a smaller image.');
      }

      // Update form data with processed image
      setFormData(prev => ({
        ...prev,
        image: processedFile,
        imageError: ''
      }));
      
      // Create and set preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
        toast.success('Image processed successfully!', { id: toastId });
      };
      reader.onerror = () => {
        throw new Error('Error reading the image file');
      };
      reader.readAsDataURL(processedFile);
      
    } catch (error) {
      console.error('Image processing error:', error);
      toast.error(error.message || 'Error processing image. Please try another image.', { id: toastId });
      e.target.value = ''; // Clear the file input
      setFormData(prev => ({ ...prev, image: null, imageError: error.message }));
      setPreviewImage(null);
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

    try {
      const newErrors = {};

      if (!formData.title.trim()) newErrors.title = 'Event title is required';
      if (!formData.description.trim()) newErrors.description = 'Description is required';
      if (!formData.date) newErrors.date = 'Date is required';
      if (!formData.startTime) newErrors.startTime = 'Start time is required';
      if (!formData.endTime) newErrors.endTime = 'End time is required';
      if (!formData.location.trim()) newErrors.location = 'Location is required';
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


      return isValid;
    } catch (error) {
      console.error('Error caught inside validateForm:', error);
      setErrors(prevErrors => ({ ...prevErrors, form: 'An unexpected error occurred during validation.' }));

      return false; // Ensure it returns false if an error happens
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to create an event.");
      return;
    }
    
    // Validate form
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let imageUrl = null;
      
      // Upload image if present
      if (formData.image) {
        try {
          // Generate a unique filename with .jpg extension (we convert all to jpg)
          const fileName = `${user.id}_${Date.now()}.jpg`;
          const filePath = `events/${user.id}/${fileName}`;
          
          // Show upload progress
          const toastId = toast.loading('Uploading image...');
          
          // Upload with error handling and retry logic
          let uploadError = null;
          let uploadAttempts = 0;
          const MAX_UPLOAD_ATTEMPTS = 3;
          
          while (uploadAttempts < MAX_UPLOAD_ATTEMPTS) {
            try {
              const { error } = await supabase.storage
                .from('event-images')
                .upload(filePath, formData.image, {
                  cacheControl: '3600',
                  upsert: false,
                  contentType: 'image/jpeg'
                });
                
              if (error) throw error;
              uploadError = null;
              break; // Success, exit retry loop
              
            } catch (error) {
              uploadError = error;
              uploadAttempts++;
              
              if (uploadAttempts < MAX_UPLOAD_ATTEMPTS) {
                // Wait before retrying (exponential backoff)
                await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, uploadAttempts)));
                toast.update(toastId, { 
                  render: `Upload attempt ${uploadAttempts + 1} of ${MAX_UPLOAD_ATTEMPTS}...` 
                });
              }
            }
          }
          
          // If we still have an error after retries
          if (uploadError) {
            console.error('Image upload error after retries:', uploadError);
            
            // More specific error messages based on error code
            if (uploadError.statusCode === 413) {
              throw new Error('Image is too large. Please use an image smaller than 1MB.');
            } else if (uploadError.message?.includes('already exists')) {
              throw new Error('A file with this name already exists. Please try again.');
            } else if (uploadError.message?.includes('not found')) {
              throw new Error('Storage bucket not found. Please contact support.');
            } else {
              throw new Error(`Upload failed: ${uploadError.message || 'Unknown error'}`);
            }
          }

          // Get public URL with cache busting
          const { data: urlData } = supabase.storage
            .from('event-images')
            .getPublicUrl(filePath, { 
              download: false,
              transform: {
                width: 1200,
                height: 630,
                quality: 80,
                resize: 'cover'
              }
            });
            
          if (!urlData?.publicUrl) {
            console.error('Failed to generate public URL');
            // Attempt to clean up the uploaded file
            try {
              await supabase.storage
                .from('event-images')
                .remove([filePath]);
            } catch (cleanupError) {
              console.error('Error cleaning up failed upload:', cleanupError);
            }
            throw new Error('Could not generate a public URL for your image. Please try again.');
          }

          imageUrl = `${urlData.publicUrl}?t=${Date.now()}`; // Cache busting
          toast.success('Image uploaded successfully!', { id: toastId });
          
        } catch (error) {
          console.error('Image upload failed:', error);
          toast.dismiss();
          toast.error(`Image upload failed: ${error.message}`);
          setIsSubmitting(false);
          return; // Stop form submission on image upload failure
        }
      }



      // Prepare event data
      const startDate = new Date(`${formData.date}T${formData.startTime}`);
      const endDate = new Date(`${formData.date}T${formData.endTime}`);

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        throw new Error('Invalid date or time format. Please check your input.');
      }

      if (endDate <= startDate) {
        throw new Error('End time must be after start time.');
      }

      // Prepare event data with proper validation
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        event_type: formData.type,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        location: formData.location.trim(),
        virtual_link: formData.virtualLink?.trim() || null,
        max_attendees: formData.maxAttendees && !isNaN(parseInt(formData.maxAttendees, 10)) 
          ? parseInt(formData.maxAttendees, 10) 
          : null,
        cost: formData.priceType === 'free' 
          ? '0' 
          : (!isNaN(parseFloat(formData.price)) ? formData.price.toString() : '0'),
        tags: formData.tags 
          ? formData.tags.split(',').map(tag => tag.trim()).filter(t => t)
          : [],
        featured_image_url: imageUrl,
        agenda: JSON.stringify(formData.agenda.filter(item => item.time && item.activity)),
        is_published: true,
        user_id: user.id,
        organizer_id: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Show loading state for event creation
      const toastId = toast.loading('Creating your event...');
      
      try {
        // Insert event into database
        const { data: insertedData, error: insertError } = await supabase
          .from('events')
          .insert([eventData])
          .select();

        if (insertError) {
          console.error('Error inserting event:', insertError);
          
          // Attempt to clean up uploaded image if event creation fails
          if (imageUrl) {
            try {
              const fileName = imageUrl.split('/').pop().split('?')[0];
              await supabase.storage
                .from('event-images')
                .remove([`events/${user.id}/${fileName}`]);
            } catch (cleanupError) {
              console.error('Error cleaning up image after failed event creation:', cleanupError);
            }
          }
          
          throw new Error(insertError.message || 'Failed to create event. Please try again.');
        }

        // Verify the event was created
        if (!insertedData || insertedData.length === 0) {
          throw new Error('Failed to verify event creation. Please check your events list.');
        }

        const newEventId = insertedData[0].id;
        
        // Log successful event creation
        console.log('Event created successfully with ID:', newEventId);
        
        // Show success message
        toast.success('Event created successfully!', { id: toastId });
        
        // Navigate to the new event's page or events list
        navigate(`/events/${newEventId}`);
        
      } catch (error) {
        console.error('Error in event creation process:', error);
        toast.error(error.message || 'An error occurred while creating the event.', { id: toastId });
        throw error; // Re-throw to be caught by outer try-catch
      } 
    } catch (error) {
      console.error('Top level error caught in handleSubmit:', error);
      console.error('Error creating event:', error);
      toast.error(`Error creating event: ${error.message}`);
    } finally {

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
                {formData.type === 'virtual' ? 'Platform/Meeting Name' : 'Venue Name'} *
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className={`form-input w-full px-3 py-2 rounded-lg ${errors.location ? 'border-red-500' : ''}`}
                placeholder={formData.type === 'virtual' ? 'e.g., Zoom, Google Meet' : 'e.g., AMET Campus Auditorium'}
              />
              {errors.location && <p className="text-red-500 text-sm mt-1">{errors.location}</p>}
            </div>

            {formData.type === 'in-person' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Address *
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  rows={2}
                  className={`form-input w-full px-3 py-2 rounded-lg ${errors.address ? 'border-red-500' : ''}`}
                  placeholder="Complete address with landmark"
                />
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Link *
                </label>
                <input
                  type="url"
                  name="virtualLink"
                  value={formData.virtualLink}
                  onChange={handleInputChange}
                  className={`form-input w-full px-3 py-2 rounded-lg ${errors.virtualLink ? 'border-red-500' : ''}`}
                  placeholder="https://zoom.us/j/..."
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
                <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
                  <PhotoIcon className="w-8 h-8 mb-2 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> event cover image
                  </p>
                  <p className="text-xs text-gray-500">
                    <span className="block">Accepted formats: JPG, PNG, WebP</span>
                    <span className="block font-medium text-amber-600">Max size: 5MB</span>
                  </p>
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