import React, { useEffect } from 'react';
import SupportPageHeader from '../components/common/SupportPageHeader';

const ContactUs = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-ocean-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <SupportPageHeader />

        <div className="bg-white shadow-xl rounded-2xl p-6 md:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Contact Us</h1>
          <p className="text-gray-700 mb-6">
            Have questions or feedback? Reach out and we'll get back to you shortly.
          </p>

          <div className="space-y-4 bg-white rounded-lg border border-gray-200 p-6">
            <div>
              <h2 className="font-semibold text-gray-900">Email</h2>
              <p className="text-gray-700">alumni@ametuniv.ac.in</p>
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Office Hours</h2>
              <p className="text-gray-700">Mon–Fri, 8:30 AM – 3:30 PM IST</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
