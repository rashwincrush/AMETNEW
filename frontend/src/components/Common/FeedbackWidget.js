import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import feedbackIcon from '../../assets/icons/feedback-icon.png';
import { supabase } from '../../utils/supabase';
import './FeedbackWidget.css';

const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState('UI');
  const [message, setMessage] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackStatus, setFeedbackStatus] = useState(''); // 'success', 'error', ''
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  const toggleWidget = () => {
    setIsOpen(!isOpen);
    // Reset form when closing
    if (isOpen) {
      setMessage('');
      setScreenshot(null);
      setFeedbackStatus('');
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setScreenshot(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      alert('Please provide a message.');
      return;
    }

    setIsSubmitting(true);
    setFeedbackStatus('');
    let screenshotURL = '';

    try {
      // 1. Handle screenshot upload if present
      if (screenshot && user) {
        const filePath = `${user.id}/${Date.now()}_${screenshot.name}`;
        const { error: uploadError } = await supabase.storage
          .from('feedback_screenshots')
          .upload(filePath, screenshot);

        if (uploadError) {
          throw new Error(`Screenshot upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('feedback_screenshots')
          .getPublicUrl(filePath);
        
        if (!urlData || !urlData.publicUrl) {
            throw new Error('Could not retrieve public URL for screenshot.');
        }
        screenshotURL = urlData.publicUrl;
      }

      // 2. Prepare data for Google Sheet
      const formData = {
        pageURL: window.location.href,
        feedbackType,
        message,
        screenshotURL,
      };

      // 3. Send data to Google Apps Script
      await fetch(process.env.REACT_APP_GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Important for Google Apps Script web apps
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      setFeedbackStatus('success');
      setTimeout(() => {
        toggleWidget();
      }, 2000); // Close widget after 2 seconds on success

    } catch (error) {
      console.error('Feedback submission error:', error);
      setFeedbackStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="feedback-widget-container">
      {isOpen && (
        <div className="feedback-form-card">
          <div className="feedback-header">
            <h3>Report a Bug / Send Feedback</h3>
            <button onClick={toggleWidget} className="close-btn">&times;</button>
          </div>
          {feedbackStatus === 'success' ? (
            <div className="feedback-success">
              <p>Thank you! Your feedback has been sent.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Page</label>
                <input type="text" value={window.location.href} readOnly />
              </div>
              <div className="form-group">
                <label>What's the issue related to?</label>
                <div className="radio-group">
                  <label>
                    <input type="radio" value="UI" checked={feedbackType === 'UI'} onChange={(e) => setFeedbackType(e.target.value)} />
                    UI / Design
                  </label>
                  <label>
                    <input type="radio" value="Backend" checked={feedbackType === 'Backend'} onChange={(e) => setFeedbackType(e.target.value)} />
                    Functionality / Data
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="feedback-message">What's happening?</label>
                <textarea
                  id="feedback-message"
                  rows="4"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Please describe the issue in detail..."
                  required
                ></textarea>
              </div>
              <div className="form-group">
                <label htmlFor="feedback-screenshot">Attach a screenshot (optional)</label>
                <input
                  type="file"
                  id="feedback-screenshot"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                />
              </div>
              {feedbackStatus === 'error' && <p className="feedback-error">Sorry, something went wrong. Please try again.</p>}
              <button type="submit" className="submit-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Send Feedback'}
              </button>
            </form>
          )}
        </div>
      )}
      <button onClick={toggleWidget} className="feedback-fab">
        {isOpen ? '✕' : <img src={feedbackIcon} alt="Feedback" />}
      </button>
    </div>
  );
};

export default FeedbackWidget;
