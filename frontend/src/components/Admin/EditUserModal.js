import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

const EditUserModal = ({ user, isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        location: user.location || '',
        current_position: user.current_position || '',
        is_admin: user.is_admin || false,
        is_mentor: user.is_mentor || false,
        is_employer: user.is_employer || false,
        alumni_verification_status: user.alumni_verification_status || 'pending',
      });
    }
  }, [user]);

  if (!user) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = () => {
    onSave(user.id, formData);
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
        <Transition.Child as={React.Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-30" />
        </Transition.Child>
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={React.Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                  <span>Edit User: {user.full_name}</span>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
                </Dialog.Title>
                <div className="mt-4 space-y-4">
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input type="text" name="full_name" id="full_name" value={formData.full_name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                  </div>
                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location</label>
                    <input type="text" name="location" id="location" value={formData.location} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                  </div>
                  <div>
                    <label htmlFor="current_position" className="block text-sm font-medium text-gray-700">Current Position</label>
                    <input type="text" name="current_position" id="current_position" value={formData.current_position} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
                  </div>
                  <div>
                    <label htmlFor="alumni_verification_status" className="block text-sm font-medium text-gray-700">Verification Status</label>
                    <select id="alumni_verification_status" name="alumni_verification_status" value={formData.alumni_verification_status} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
                      <option>pending</option>
                      <option>verified</option>
                      <option>rejected</option>
                    </select>
                  </div>
                  <div className="space-y-2 pt-2">
                    <p className="text-sm font-medium text-gray-700">Roles</p>
                    <div className="flex items-center"><input id="is_admin" name="is_admin" type="checkbox" checked={formData.is_admin} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label htmlFor="is_admin" className="ml-2 block text-sm text-gray-900">Admin</label></div>
                    <div className="flex items-center"><input id="is_mentor" name="is_mentor" type="checkbox" checked={formData.is_mentor} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label htmlFor="is_mentor" className="ml-2 block text-sm text-gray-900">Mentor</label></div>
                    <div className="flex items-center"><input id="is_employer" name="is_employer" type="checkbox" checked={formData.is_employer} onChange={handleChange} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" /><label htmlFor="is_employer" className="ml-2 block text-sm text-gray-900">Employer</label></div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button type="button" className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50" onClick={onClose}>Cancel</button>
                  <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700" onClick={handleSave}>Save Changes</button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default EditUserModal;
