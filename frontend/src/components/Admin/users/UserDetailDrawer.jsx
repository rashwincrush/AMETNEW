import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import Avatar from '../../common/Avatar';
import { getAccountStatus, ACCOUNT_STATUS_META } from '../../../utils/accountStatus';

export default function UserDetailDrawer({ user, open, onClose }) {
  if (!user) return null;

  const status = getAccountStatus(user);
  const statusMeta = ACCOUNT_STATUS_META[status.code] || ACCOUNT_STATUS_META.unknown;

  return (
    <Transition.Root show={open} as={React.Fragment}>
      <Dialog as="div" className="relative z-30" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-40 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <Transition.Child
                as={React.Fragment}
                enter="transform transition ease-out duration-300"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-200"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                  <div className="flex h-full flex-col bg-white shadow-xl">
                    <div className="px-4 sm:px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                      <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                        User Details
                      </Dialog.Title>
                      <button
                        type="button"
                        className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:ring-offset-2"
                        onClick={onClose}
                      >
                        <span className="sr-only">Close panel</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
                      <div className="flex items-center space-x-4">
                        <Avatar
                          src={user.avatar_url ?? null}
                          alt={user.full_name || 'User'}
                          size={56}
                          rounded="full"
                        />
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">
                            {user.full_name || 'N/A'}
                          </h2>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {user.role || 'Unknown role'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm text-gray-700">
                        <div>
                          <span className="font-medium">Status:</span>{' '}
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMeta.badgeClass}`}>
                            {statusMeta.label}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Location:</span>{' '}
                          {user.location || 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Last login:</span>{' '}
                          {user.last_sign_in_at
                            ? new Date(user.last_sign_in_at).toLocaleString()
                            : 'N/A'}
                        </div>
                        <div>
                          <span className="font-medium">Active:</span>{' '}
                          {user.is_active === false ? 'No' : 'Yes'}
                        </div>
                        <div>
                          <span className="font-medium">Deleted:</span>{' '}
                          {user.is_deleted ? 'Yes' : 'No'}
                        </div>
                        {user.approval_status && (
                          <div>
                            <span className="font-medium">Approval status:</span>{' '}
                            {user.approval_status}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
