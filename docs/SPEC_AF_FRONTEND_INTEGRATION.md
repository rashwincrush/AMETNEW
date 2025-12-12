# Spec A–F Frontend Integration Guide

**Team: OPIB-∞ + UUX-∞ + Supreme DB Architect**  
**Date: 2025-12-12**

This document maps the new DB schema and RPCs to frontend components. Use this as a checklist when implementing each feature.

---

## A1. Security Question / Answer

### Files to modify
- `frontend/src/components/Profile/Profile.js` (or ProfileSettings)

### New section: "Account Security"
```jsx
// Add to Profile.js or create SecuritySettings.js

import { supabase } from '../../utils/supabase';

// State
const [securityQuestion, setSecurityQuestion] = useState('');
const [securityAnswer, setSecurityAnswer] = useState('');
const [hasQuestion, setHasQuestion] = useState(false);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [success, setSuccess] = useState(false);

// Load on mount
useEffect(() => {
  const loadSecurityQuestion = async () => {
    const { data, error } = await supabase.rpc('get_my_security_question');
    if (data) {
      setHasQuestion(data.has_question);
      setSecurityQuestion(data.question || '');
    }
  };
  loadSecurityQuestion();
}, []);

// Save handler
const handleSaveSecuritySettings = async () => {
  setLoading(true);
  setError(null);
  setSuccess(false);
  
  const { data, error } = await supabase.rpc('set_my_security_question', {
    p_question: securityQuestion,
    p_answer_plaintext: securityAnswer
  });
  
  setLoading(false);
  if (error) {
    setError(error.message);
  } else {
    setSuccess(true);
    setSecurityAnswer(''); // Clear answer field
    setHasQuestion(true);
  }
};
```

### UX requirements
- **Card title**: "Account Security"
- **Question field**: Label "Security question", helper "Used to verify your identity when changing sensitive settings."
- **Answer field**: Type `password` with show/hide toggle, label "Security answer", helper "We store only a secure hash."
- **Button**: "Save security settings"
- **States**: Loading spinner on button, success toast, inline error under answer field

### Accessibility
- `htmlFor`/`id` associations
- `aria-live="polite"` for success/error messages
- Show/hide toggle: `aria-pressed` state

---

## A2. Additional Degrees

### Files to modify
- `frontend/src/components/Profile/Profile.js` (Education section)

### New hooks/services
```jsx
// services/degrees.js
import { supabase } from '../utils/supabase';

export const getMyDegrees = async () => {
  const { data, error } = await supabase.rpc('get_my_degrees');
  return { data, error };
};

export const upsertMyDegree = async (params) => {
  const { data, error } = await supabase.rpc('upsert_my_degree', params);
  return { data, error };
};

export const deleteMyDegree = async (id) => {
  const { data, error } = await supabase.rpc('delete_my_degree', { p_id: id });
  return { data, error };
};
```

### Component structure
```jsx
// In Profile.js Education section

const [degrees, setDegrees] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const load = async () => {
    const { data } = await getMyDegrees();
    if (data) setDegrees(JSON.parse(data) || []);
    setLoading(false);
  };
  load();
}, []);

// Render
<Card>
  <CardHeader>
    <CardTitle>Education</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Primary degree */}
    <div className="mb-4">
      <Label>Primary degree</Label>
      <DegreeSelect 
        value={degrees.find(d => d.is_primary)?.degree_code}
        onChange={(code) => handlePrimaryDegreeChange(code)}
      />
    </div>
    
    {/* Additional degrees */}
    <div className="mt-6">
      <h4 className="text-sm font-medium mb-2">Additional degrees</h4>
      {degrees.filter(d => !d.is_primary).length === 0 ? (
        <p className="text-muted-foreground text-sm">No additional degrees added yet.</p>
      ) : (
        <ul className="space-y-3">
          {degrees.filter(d => !d.is_primary).map(degree => (
            <li key={degree.id} className="flex items-center gap-2">
              <DegreeSelect value={degree.degree_code} onChange={...} />
              <Input placeholder="Institution" value={degree.institution_name} />
              <Input type="number" placeholder="Year" value={degree.graduation_year} />
              <Button variant="ghost" onClick={() => handleDeleteDegree(degree.id)}>
                Remove
              </Button>
            </li>
          ))}
        </ul>
      )}
      <Button variant="outline" onClick={handleAddDegree} className="mt-3">
        Add another degree
      </Button>
    </div>
  </CardContent>
</Card>
```

### Directory card display
```jsx
// In directory card component
const primaryDegree = profile.degree_code;
const extraCount = profile.extra_degrees_count || 0;

<span>
  {getDegreeLabel(primaryDegree)}
  {extraCount > 0 && <span className="text-muted-foreground"> +{extraCount} more</span>}
</span>
```

---

## A3. Professional Achievements

### Files to modify
- `frontend/src/components/Profile/Profile.js`

### New hooks/services
```jsx
// services/achievements.js
import { supabase } from '../utils/supabase';

export const getMyAchievements = async () => {
  const { data, error } = await supabase.rpc('get_my_achievements');
  return { data: data ? JSON.parse(data) : [], error };
};

export const upsertMyAchievement = async (params) => {
  const { data, error } = await supabase.rpc('upsert_my_achievement', params);
  return { data, error };
};

export const deleteMyAchievement = async (id) => {
  const { data, error } = await supabase.rpc('delete_my_achievement', { p_id: id });
  return { data, error };
};
```

### Component structure
```jsx
// Achievement categories
const ACHIEVEMENT_CATEGORIES = [
  { value: 'award', label: 'Awards & Recognitions' },
  { value: 'publication', label: 'Publications' },
  { value: 'patent', label: 'Patents' },
  { value: 'certification', label: 'Certifications' },
];

// Group achievements by category
const groupedAchievements = useMemo(() => {
  return ACHIEVEMENT_CATEGORIES.map(cat => ({
    ...cat,
    items: achievements.filter(a => a.category === cat.value)
  }));
}, [achievements]);

// Render
<Card>
  <CardHeader>
    <CardTitle>Professional Achievements</CardTitle>
  </CardHeader>
  <CardContent>
    {groupedAchievements.map(group => (
      <div key={group.value} className="mb-6">
        <h4 className="text-sm font-semibold mb-2">{group.label}</h4>
        {group.items.length === 0 ? (
          <p className="text-muted-foreground text-sm">None added yet.</p>
        ) : (
          <ul className="space-y-2">
            {group.items.map(item => (
              <AchievementRow 
                key={item.id} 
                item={item} 
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        )}
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => handleAddAchievement(group.value)}
          className="mt-2"
        >
          Add {group.label.toLowerCase().replace(/s$/, '')}
        </Button>
      </div>
    ))}
  </CardContent>
</Card>
```

### AchievementRow component
```jsx
const AchievementRow = ({ item, onEdit, onDelete }) => {
  const [editing, setEditing] = useState(false);
  
  if (editing) {
    return (
      <li className="border rounded p-3">
        <Input placeholder="Title *" value={item.title} />
        <Input placeholder="Organization / Venue" value={item.organization} />
        <Input type="number" placeholder="Year" value={item.year} />
        <Input placeholder="URL (optional)" value={item.url} />
        <div className="flex gap-2 mt-2">
          <Button size="sm" onClick={() => handleSave()}>Save</Button>
          <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </li>
    );
  }
  
  return (
    <li className="flex items-center justify-between py-2 border-b">
      <div>
        <span className="font-medium">{item.title}</span>
        {item.organization && <span className="text-muted-foreground"> • {item.organization}</span>}
        {item.year && <span className="text-muted-foreground"> ({item.year})</span>}
        {item.url && (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="ml-2 text-primary">
            View
          </a>
        )}
      </div>
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
        <Button size="sm" variant="ghost" onClick={() => onDelete(item.id)}>Remove</Button>
      </div>
    </li>
  );
};
```

---

## B1. Jobs – Education Requirements

### Files to modify
- `frontend/src/components/Jobs/JobPostingForm.js`
- `frontend/src/components/Jobs/JobsList.js` (filters)
- `frontend/src/components/Jobs/JobDetails.js`

### JobPostingForm.js additions
```jsx
const EDUCATION_LEVELS = [
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelors', label: "Bachelor's" },
  { value: 'masters', label: "Master's" },
  { value: 'phd', label: 'PhD' },
  { value: 'other', label: 'Other' },
];

// In form state
const [educationRequirements, setEducationRequirements] = useState([]);

// In form render (under Requirements section)
<div className="space-y-2">
  <Label>Education requirements</Label>
  <div className="flex flex-wrap gap-2">
    {EDUCATION_LEVELS.map(level => (
      <label key={level.value} className="flex items-center gap-1">
        <Checkbox
          checked={educationRequirements.includes(level.value)}
          onCheckedChange={(checked) => {
            if (checked) {
              setEducationRequirements([...educationRequirements, level.value]);
            } else {
              setEducationRequirements(educationRequirements.filter(e => e !== level.value));
            }
          }}
        />
        <span className="text-sm">{level.label}</span>
      </label>
    ))}
  </div>
  <p className="text-xs text-muted-foreground">
    Select one or more levels suitable for this role.
  </p>
</div>
```

### JobsList.js filter
```jsx
// Add to filters
const [matchMyEducation, setMatchMyEducation] = useState(false);

// In filter bar
<label className="flex items-center gap-2">
  <Checkbox
    checked={matchMyEducation}
    onCheckedChange={setMatchMyEducation}
  />
  <span className="text-sm">Match my education</span>
</label>

// In fetch
const { data } = await supabase.rpc('search_jobs_with_education', {
  p_filters: { match_my_education: matchMyEducation }
});
```

### JobDetails.js display
```jsx
// Show education requirements as chips
{job.education_requirements?.length > 0 && (
  <div className="flex flex-wrap gap-1 mt-2">
    {job.education_requirements.map(level => (
      <Badge key={level} variant="secondary">
        {EDUCATION_LEVELS.find(l => l.value === level)?.label || level}
      </Badge>
    ))}
  </div>
)}
```

---

## B2. Jobs – Contact Info

### JobPostingForm.js additions
```jsx
// In form state
const [contactName, setContactName] = useState('');
const [contactEmail, setContactEmail] = useState('');
const [contactPhone, setContactPhone] = useState('');

// In form render
<Card className="mt-4">
  <CardHeader>
    <CardTitle className="text-base">Contact person (for questions)</CardTitle>
  </CardHeader>
  <CardContent className="space-y-3">
    <div>
      <Label>Name</Label>
      <Input value={contactName} onChange={e => setContactName(e.target.value)} />
    </div>
    <div>
      <Label>Email</Label>
      <Input type="email" value={contactEmail} onChange={e => setContactEmail(e.target.value)} />
    </div>
    <div>
      <Label>Phone</Label>
      <Input value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="+91 98765 43210" />
    </div>
    <p className="text-xs text-muted-foreground">
      Displayed to approved candidates on the job page.
    </p>
  </CardContent>
</Card>
```

### JobDetails.js display
```jsx
// Show contact info (only for approved jobs)
{job.approval_status === 'approved' && (job.contact_name || job.contact_email || job.contact_phone) && (
  <div className="mt-4 p-3 bg-muted rounded">
    <h4 className="text-sm font-medium mb-1">Contact for questions</h4>
    <p className="text-sm">
      {job.contact_name && <span>{job.contact_name}</span>}
      {job.contact_email && (
        <a href={`mailto:${job.contact_email}?subject=Question about: ${job.title}`} className="ml-2 text-primary">
          {job.contact_email}
        </a>
      )}
      {job.contact_phone && (
        <a href={`tel:${job.contact_phone}`} className="ml-2 text-primary">
          {job.contact_phone}
        </a>
      )}
    </p>
  </div>
)}
```

---

## C1. Events – Registration Deadline

### Files to modify
- `frontend/src/components/Events/CreateEvent.js`
- `frontend/src/components/Events/EventDetails.js`

### CreateEvent.js
```jsx
// In form state
const [registrationDeadline, setRegistrationDeadline] = useState(null);

// In form render (after date/time fields)
<div className="space-y-2">
  <Label>Registration closes on</Label>
  <div className="flex gap-2">
    <DatePicker
      selected={registrationDeadline}
      onChange={setRegistrationDeadline}
      showTimeSelect
      dateFormat="MMMM d, yyyy h:mm aa"
    />
  </div>
  <p className="text-xs text-muted-foreground">
    Attendees can register until this time.
  </p>
</div>
```

### EventDetails.js
```jsx
const isRegistrationClosed = event.registration_deadline && new Date(event.registration_deadline) < new Date();

// In info section
{event.registration_deadline && (
  <p className="text-sm">
    <span className="font-medium">Registration closes:</span>{' '}
    {format(new Date(event.registration_deadline), 'PPp')}
  </p>
)}

// RSVP button
{isRegistrationClosed ? (
  <div className="p-3 bg-muted rounded text-center">
    <p className="text-muted-foreground">Registrations closed</p>
  </div>
) : (
  <Button onClick={handleRSVP} disabled={rsvpLoading}>
    {rsvpLoading ? 'Registering...' : 'Register for this event'}
  </Button>
)}
```

---

## C2. Event Sponsor

### CreateEvent.js
```jsx
// In form state (use existing 'sponsors' field)
const [sponsorName, setSponsorName] = useState('');

// In form render
<div className="space-y-2">
  <Label>Sponsor (optional)</Label>
  <Input
    value={sponsorName}
    onChange={e => setSponsorName(e.target.value)}
    placeholder="Organization / Company / Individual"
  />
</div>
```

### EventDetails.js
```jsx
{event.sponsors && (
  <p className="text-sm text-muted-foreground">
    Sponsored by {event.sponsors}
  </p>
)}
```

---

## C3. Event Cost Flag

### CreateEvent.js
```jsx
// In form state
const [hasCost, setHasCost] = useState(false);

// In form render
<div className="flex items-center gap-2">
  <Switch checked={hasCost} onCheckedChange={setHasCost} />
  <Label>Is there a cost to attend?</Label>
</div>
<p className="text-xs text-muted-foreground ml-10">
  {hasCost 
    ? "Displayed as 'Contact organizer for pricing details.'" 
    : "Displayed as 'Free to attend'."}
</p>
```

### EventDetails.js
```jsx
<Badge variant={event.has_cost ? 'secondary' : 'success'}>
  {event.has_cost ? 'Contact organizer for pricing details' : 'Free to attend'}
</Badge>
```

---

## C4. Volunteering Interest

### RSVP component
```jsx
// In RSVP form/modal
const [wantsToVolunteer, setWantsToVolunteer] = useState(false);

// In render
<div className="mt-4">
  <label className="flex items-start gap-2">
    <Checkbox
      checked={wantsToVolunteer}
      onCheckedChange={setWantsToVolunteer}
    />
    <div>
      <span className="text-sm">I'm interested in volunteering for this event</span>
      <p className="text-xs text-muted-foreground">
        Your name and contact details will be shared with the organizers.
      </p>
    </div>
  </label>
</div>

// In submit
await supabase.from('event_rsvps').insert({
  event_id: eventId,
  user_id: userId,
  wants_to_volunteer: wantsToVolunteer
});
```

### Admin event page – Download volunteers
```jsx
const handleDownloadVolunteers = async () => {
  setDownloading(true);
  const { data, error } = await supabase.rpc('admin_get_event_volunteers', {
    p_event_id: eventId
  });
  
  if (error) {
    toast.error('Failed to export volunteers');
    setDownloading(false);
    return;
  }
  
  const volunteers = JSON.parse(data);
  
  // Generate CSV
  const csv = [
    ['Full Name', 'Email', 'Phone', 'RSVP Status', 'RSVP Date'],
    ...volunteers.map(v => [
      v.full_name,
      v.email,
      v.phone,
      v.rsvp_status,
      v.rsvp_created_at
    ])
  ].map(row => row.join(',')).join('\n');
  
  // Download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `volunteers-${eventId}.csv`;
  a.click();
  
  setDownloading(false);
  toast.success('Download started');
};

// Button
<Button onClick={handleDownloadVolunteers} disabled={downloading}>
  {downloading ? 'Exporting...' : 'Download volunteer list (CSV)'}
</Button>
```

---

## D. Event Feedback

### New file: `frontend/src/components/Events/EventFeedbackForm.js`

```jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

const INTEREST_LEVELS = [
  { value: 'very_interested', label: 'Very interested' },
  { value: 'somewhat_interested', label: 'Somewhat interested' },
  { value: 'not_interested', label: 'Not interested' },
];

const EventFeedbackForm = ({ eventId, onSuccess }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState(null);
  
  const [overallRating, setOverallRating] = useState(0);
  const [contentRating, setContentRating] = useState(0);
  const [speakersRating, setSpeakersRating] = useState(0);
  const [logisticsRating, setLogisticsRating] = useState(0);
  const [venueRating, setVenueRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [workedWell, setWorkedWell] = useState('');
  const [couldImprove, setCouldImprove] = useState('');
  const [interestLevel, setInterestLevel] = useState('');
  const [futureSuggestions, setFutureSuggestions] = useState('');
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const loadExisting = async () => {
      const { data } = await supabase.rpc('get_my_event_feedback', { p_event_id: eventId });
      if (data) {
        const feedback = JSON.parse(data);
        if (feedback) {
          setExistingFeedback(feedback);
          setOverallRating(feedback.overall_rating || 0);
          setContentRating(feedback.content_rating || 0);
          setSpeakersRating(feedback.speakers_rating || 0);
          setLogisticsRating(feedback.logistics_rating || 0);
          setVenueRating(feedback.venue_rating || 0);
          setCommunicationRating(feedback.communication_rating || 0);
          setWorkedWell(feedback.worked_well || '');
          setCouldImprove(feedback.could_improve || '');
          setInterestLevel(feedback.interest_level || '');
          setFutureSuggestions(feedback.future_suggestions || '');
        }
      }
      setLoading(false);
    };
    loadExisting();
  }, [eventId]);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    if (overallRating < 1 || overallRating > 5) {
      setError('Please select an overall rating');
      return;
    }
    
    setSubmitting(true);
    
    const { data, error: submitError } = await supabase.rpc('submit_event_feedback', {
      p_event_id: eventId,
      p_overall_rating: overallRating,
      p_content_rating: contentRating || null,
      p_speakers_rating: speakersRating || null,
      p_logistics_rating: logisticsRating || null,
      p_venue_rating: venueRating || null,
      p_communication_rating: communicationRating || null,
      p_worked_well: workedWell || null,
      p_could_improve: couldImprove || null,
      p_interest_level: interestLevel || null,
      p_future_suggestions: futureSuggestions || null,
    });
    
    setSubmitting(false);
    
    if (submitError) {
      setError(submitError.message);
    } else {
      onSuccess?.();
    }
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <p className="text-muted-foreground">
        Tell us how this event went. Your feedback helps improve future events.
      </p>
      
      {error && (
        <div className="p-3 bg-destructive/10 text-destructive rounded" role="alert">
          {error}
        </div>
      )}
      
      {/* Overall rating - required */}
      <fieldset>
        <legend className="font-medium mb-2">Overall rating *</legend>
        <StarRating value={overallRating} onChange={setOverallRating} />
      </fieldset>
      
      {/* Aspect ratings */}
      <div className="grid grid-cols-2 gap-4">
        <fieldset>
          <legend className="text-sm mb-1">Content</legend>
          <StarRating value={contentRating} onChange={setContentRating} size="sm" />
        </fieldset>
        <fieldset>
          <legend className="text-sm mb-1">Speakers</legend>
          <StarRating value={speakersRating} onChange={setSpeakersRating} size="sm" />
        </fieldset>
        <fieldset>
          <legend className="text-sm mb-1">Logistics</legend>
          <StarRating value={logisticsRating} onChange={setLogisticsRating} size="sm" />
        </fieldset>
        <fieldset>
          <legend className="text-sm mb-1">Venue</legend>
          <StarRating value={venueRating} onChange={setVenueRating} size="sm" />
        </fieldset>
        <fieldset>
          <legend className="text-sm mb-1">Communication</legend>
          <StarRating value={communicationRating} onChange={setCommunicationRating} size="sm" />
        </fieldset>
      </div>
      
      {/* Text feedback */}
      <div>
        <Label htmlFor="worked-well">What worked well</Label>
        <Textarea
          id="worked-well"
          value={workedWell}
          onChange={e => setWorkedWell(e.target.value)}
          placeholder="e.g. topic selection, networking, timing..."
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground text-right">{workedWell.length}/1000</p>
      </div>
      
      <div>
        <Label htmlFor="could-improve">What could be improved</Label>
        <Textarea
          id="could-improve"
          value={couldImprove}
          onChange={e => setCouldImprove(e.target.value)}
          maxLength={1000}
        />
        <p className="text-xs text-muted-foreground text-right">{couldImprove.length}/1000</p>
      </div>
      
      {/* Interest level */}
      <fieldset>
        <legend className="font-medium mb-2">Interest in similar future events</legend>
        <div className="space-y-2">
          {INTEREST_LEVELS.map(level => (
            <label key={level.value} className="flex items-center gap-2">
              <input
                type="radio"
                name="interest"
                value={level.value}
                checked={interestLevel === level.value}
                onChange={e => setInterestLevel(e.target.value)}
              />
              <span>{level.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      
      <div>
        <Label htmlFor="suggestions">Suggestions for future events</Label>
        <Textarea
          id="suggestions"
          value={futureSuggestions}
          onChange={e => setFutureSuggestions(e.target.value)}
          maxLength={1000}
        />
      </div>
      
      <Button type="submit" disabled={submitting}>
        {submitting ? 'Submitting...' : existingFeedback ? 'Update feedback' : 'Submit feedback'}
      </Button>
    </form>
  );
};

export default EventFeedbackForm;
```

### Entry points
- **EventDetails.js**: Show "Give feedback" button after event starts and user has RSVP
- **MyRegistrations.js**: Show feedback status per past event

---

## F1. CSV Import – Validation & Duplicate Options

### Files to modify
- `frontend/src/components/Admin/CSVImportExport.js`

### Add validation options step
```jsx
// After column mapping, before final import

const [validationMode, setValidationMode] = useState('strict');
const [duplicateStrategy, setDuplicateStrategy] = useState('skip');

// In render
<Card className="mt-4">
  <CardHeader>
    <CardTitle>Validation & duplicates</CardTitle>
  </CardHeader>
  <CardContent className="space-y-4">
    <fieldset>
      <legend className="font-medium mb-2">Validation mode</legend>
      <div className="space-y-2">
        <label className="flex items-start gap-2">
          <input
            type="radio"
            name="validation"
            value="strict"
            checked={validationMode === 'strict'}
            onChange={e => setValidationMode(e.target.value)}
          />
          <div>
            <span className="font-medium">Strict – stop on first error</span>
            <p className="text-xs text-muted-foreground">
              Best for small imports where you want all rows perfect.
            </p>
          </div>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="radio"
            name="validation"
            value="skip_invalid"
            checked={validationMode === 'skip_invalid'}
            onChange={e => setValidationMode(e.target.value)}
          />
          <div>
            <span className="font-medium">Skip invalid rows – import what passes</span>
            <p className="text-xs text-muted-foreground">
              Best for large imports. Invalid rows are logged for review.
            </p>
          </div>
        </label>
      </div>
    </fieldset>
    
    <fieldset>
      <legend className="font-medium mb-2">On duplicates</legend>
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="duplicates"
            value="skip"
            checked={duplicateStrategy === 'skip'}
            onChange={e => setDuplicateStrategy(e.target.value)}
          />
          <span>Skip existing rows</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="duplicates"
            value="update"
            checked={duplicateStrategy === 'update'}
            onChange={e => setDuplicateStrategy(e.target.value)}
          />
          <span>Update existing rows</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="duplicates"
            value="insert_anyway"
            checked={duplicateStrategy === 'insert_anyway'}
            onChange={e => setDuplicateStrategy(e.target.value)}
          />
          <span>Insert anyway (allow duplicates)</span>
        </label>
      </div>
    </fieldset>
  </CardContent>
</Card>

// Include in import payload
const importPayload = {
  ...mappingConfig,
  validation_mode: validationMode,
  duplicate_strategy: duplicateStrategy,
};
```

---

## F2. Admin Data Validation

### New file: `frontend/src/components/Admin/DataTools.js`

```jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

const DataTools = () => {
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadHistory();
  }, []);
  
  const loadHistory = async () => {
    const { data } = await supabase.rpc('admin_get_validation_runs', { p_limit: 10 });
    if (data) setHistory(JSON.parse(data));
  };
  
  const handleRunValidation = async () => {
    setRunning(true);
    setError(null);
    
    const { data, error: runError } = await supabase.rpc('admin_run_validation', {
      p_scope: 'all'
    });
    
    setRunning(false);
    
    if (runError) {
      setError(runError.message);
    } else {
      const result = JSON.parse(data);
      setLastResult(result.summary);
      loadHistory();
    }
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Data health & validation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Scans for orphan records, missing links, and common data issues.
          </p>
          
          <Button onClick={handleRunValidation} disabled={running}>
            {running ? 'Running...' : 'Run validation checks'}
          </Button>
          
          {error && (
            <div className="mt-4 p-3 bg-destructive/10 text-destructive rounded">
              Validation run failed. Please try again or contact support if this persists.
            </div>
          )}
          
          {lastResult && (
            <div className="mt-4 p-4 bg-muted rounded">
              <h4 className="font-medium mb-2">Results</h4>
              <ul className="space-y-1 text-sm">
                <li>Orphan event RSVPs: {lastResult.orphan_event_rsvps}</li>
                <li>Orphan job applications: {lastResult.orphan_job_applications}</li>
                <li>Orphan group members: {lastResult.orphan_group_members}</li>
                <li>Profiles missing email: {lastResult.profiles_missing_email}</li>
                <li>Jobs missing title: {lastResult.jobs_missing_title}</li>
                <li>Events missing title: {lastResult.events_missing_title}</li>
                <li className="font-medium pt-2 border-t">
                  Total issues: {lastResult.total_issues}
                </li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Validation history</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Run by</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issues found</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map(run => (
                <TableRow key={run.id}>
                  <TableCell>{format(new Date(run.started_at), 'PPp')}</TableCell>
                  <TableCell>{run.run_by_name}</TableCell>
                  <TableCell>
                    <Badge variant={run.status === 'completed' ? 'success' : 'destructive'}>
                      {run.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{run.summary?.total_issues ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataTools;
```

### Add route in Admin
```jsx
// In Admin routes
<Route path="/admin/data-tools" element={<DataTools />} />

// In Admin sidebar
<NavLink to="/admin/data-tools">Data Tools</NavLink>
```

---

## Summary Checklist

| Spec | DB | RPC | Frontend | Status |
|------|-----|-----|----------|--------|
| A1. Security Questions | ✅ | ✅ | Profile.js | Pending |
| A2. Additional Degrees | ✅ | ✅ | Profile.js | Pending |
| A3. Achievements | ✅ | ✅ | Profile.js | Pending |
| B1. Job Education Req | ✅ | ✅ | JobPostingForm, JobsList, JobDetails | Pending |
| B2. Job Contact Info | ✅ | ✅ | JobPostingForm, JobDetails | Pending |
| C1. Registration Deadline | ✅ | ✅ | CreateEvent, EventDetails | Pending |
| C2. Sponsor | ✅ | - | CreateEvent, EventDetails | Pending |
| C3. Cost Flag | ✅ | - | CreateEvent, EventDetails | Pending |
| C4. Volunteering | ✅ | ✅ | RSVP, Admin Event | Pending |
| D. Event Feedback | ✅ | ✅ | EventFeedbackForm (new) | Pending |
| F1. CSV Import Options | ✅ | - | CSVImportExport | Pending |
| F2. Data Validation | ✅ | ✅ | DataTools (new) | Pending |

---

## Rollout Order

1. **Apply migration** to staging first
2. **Test RPCs** via Supabase SQL Editor
3. **Implement frontend** in order:
   - Profile (A1, A2, A3) – isolated, no public dependency
   - Jobs (B1, B2) – backward compatible
   - Events (C1–C4) – backward compatible
   - Event Feedback (D) – new component
   - Admin Data Tools (F1, F2) – admin-only
4. **QA each module** before moving to next
5. **Deploy to production**
