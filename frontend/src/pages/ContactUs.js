import React from 'react';

const ContactUs = () => {
  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h1>
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
  );
};

export default ContactUs;
