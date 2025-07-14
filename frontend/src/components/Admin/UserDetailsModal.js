import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EnvelopeIcon, MapPinIcon, BriefcaseIcon, AcademicCapIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

const UserDetailsModal = ({ user, isOpen, onClose }) => {
  if (!user) return null;

  const getRoleName = (user) => {
    if (user.is_admin) return 'Admin';
    if (user.is_mentor) return 'Mentor';
    if (user.is_employer) return 'Employer';
    return 'Alumni';
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                  <span>User Profile</span>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </Dialog.Title>
                <div className="mt-4">
                  <div className="flex items-center space-x-4">
                    <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}&background=random`} alt="" className="h-20 w-20 rounded-full" />
                    <div>
                      <p className="text-xl font-semibold text-gray-800">{user.full_name}</p>
                      <p className="text-sm text-gray-500">{getRoleName(user)}</p>
                    </div>
                  </div>
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <dl className="space-y-4">
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-700">{user.email}</span>
                      </div>
                      <div className="flex items-center">
                        <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-700">{user.location || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center">
                        <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-700">{user.current_position || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center">
                        <ShieldCheckIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.alumni_verification_status === 'verified' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {user.alumni_verification_status}
                        </span>
                      </div>
                       <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-700">Last seen: {user.last_seen ? new Date(user.last_seen).toLocaleString() : 'N/A'}</span>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <Link to={`/profile/${user.id}`} className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2">
                    View Full Profile
                  </Link>
                  <button
                    type="button"
                    className="inline-flex justify-center rounded-md border border-transparent bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default UserDetailsModal;
