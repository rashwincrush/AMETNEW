import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, CalendarIcon, UserCircleIcon, BriefcaseIcon, DocumentTextIcon } from '@heroicons/react/24/outline';

const ContentDetailsModal = ({ item, isOpen, onClose }) => {
  if (!item) return null;

  const renderContent = () => {
    switch (item.content_type) {
      case 'job':
        return (
          <dl className="space-y-4">
            <div className="flex items-start">
              <BriefcaseIcon className="h-5 w-5 text-gray-400 mr-3 mt-1" />
              <div>
                <dt className="text-sm font-medium text-gray-500">Company</dt>
                <dd className="text-sm text-gray-900">{item.company_name}</dd>
              </div>
            </div>
            <div className="flex items-start">
              <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3 mt-1" />
              <div>
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="text-sm text-gray-900 whitespace-pre-wrap">{item.description}</dd>
              </div>
            </div>
          </dl>
        );
      case 'event':
        return (
          <dl className="space-y-4">
             <div className="flex items-start">
              <CalendarIcon className="h-5 w-5 text-gray-400 mr-3 mt-1" />
              <div>
                <dt className="text-sm font-medium text-gray-500">Event Date</dt>
                <dd className="text-sm text-gray-900">{new Date(item.event_date).toLocaleDateString()}</dd>
              </div>
            </div>
            <div className="flex items-start">
              <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3 mt-1" />
              <div>
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="text-sm text-gray-900 whitespace-pre-wrap">{item.description}</dd>
              </div>
            </div>
          </dl>
        );
      default:
        return <p className="text-sm text-gray-700 whitespace-pre-wrap">{JSON.stringify(item.content_data, null, 2)}</p>;
    }
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
        <Transition.Child as={React.Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child as={React.Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 flex justify-between items-center">
                  <span>{item.type} Details</span>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
                </Dialog.Title>
                
                <div className="mt-4">
                  <h4 className="text-xl font-bold text-gray-800">{item.title || item.name}</h4>
                  <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
                    <UserCircleIcon className="h-5 w-5" />
                    <span>{item.creator?.first_name || 'Unknown'} {item.creator?.last_name || ''}</span>
                    <span className="text-gray-300">|</span>
                    <CalendarIcon className="h-5 w-5" />
                    <span>{new Date(item.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6 border-t border-gray-200 pt-6">
                  {renderContent()}
                </div>

                <div className="mt-6 flex justify-end">
                  <button type="button" className="inline-flex justify-center rounded-md border border-transparent bg-indigo-100 px-4 py-2 text-sm font-medium text-indigo-900 hover:bg-indigo-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2" onClick={onClose}>
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

export default ContentDetailsModal;
