import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { supabase } from '../../utils/supabase';
import { XMarkIcon } from '@heroicons/react/24/outline';

const NewConversationModal = ({ isOpen, onClose, onConversationStarted }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm.trim().length > 1) {
        performSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const performSearch = async () => {
    setLoading(true);
    setError('');
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, avatar_url')
      .textSearch('full_name', searchTerm.trim(), { type: 'websearch' })
      .limit(10);

    if (error) {
      console.error('Error searching users:', error);
      setError('Failed to search for users.');
    } else {
      setSearchResults(data);
    }
    setLoading(false);
  };

  const handleStartConversation = async (userId) => {
    try {
      const { data: conversationId, error } = await supabase.rpc('find_or_create_conversation', {
        other_user_id: userId
      });

      if (error) throw error;

      onConversationStarted(conversationId);
      onClose();
    } catch (err) {
      console.error('Error starting conversation:', err);
      setError('Could not start conversation.');
    }
  };

  return (
    <Transition appear show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-20" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-30" />
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
                  <span>New Message</span>
                  <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><XMarkIcon className="h-6 w-6" /></button>
                </Dialog.Title>
                <div className="mt-4">
                  <input
                    type="text"
                    placeholder="Search for a user..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="mt-4 h-64 overflow-y-auto">
                  {loading && <p className="text-gray-500">Searching...</p>}
                  {error && <p className="text-red-500">{error}</p>}
                  {!loading && searchResults.length === 0 && searchTerm.length > 1 && (
                    <p className="text-gray-500">No users found.</p>
                  )}
                  <ul className="space-y-2">
                    {searchResults.map(user => (
                      <li
                        key={user.id}
                        onClick={() => handleStartConversation(user.id)}
                        className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer"
                      >
                        <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name}`} alt={user.full_name} className="h-10 w-10 rounded-full object-cover mr-3" />
                        <div>
                          <p className="font-semibold">{user.full_name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default NewConversationModal;
