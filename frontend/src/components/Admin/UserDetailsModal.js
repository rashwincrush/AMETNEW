import React, { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EnvelopeIcon, MapPinIcon, BriefcaseIcon, AcademicCapIcon, ShieldCheckIcon, ClockIcon, EyeIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import Avatar from '../common/Avatar';
import { getAccountStatus } from '../../utils/accountStatus';
import { adminGetProfileApprovalAudit } from '../../api/admin';
import { useProfileById } from '../../hooks/useProfileById';
import { getDisplayName } from '../../utils/displayName';
import { useAvatar } from '../../hooks/useAvatar';
import { useAuth } from '../../contexts/AuthContext';
import logger from '../../utils/logger';
import { toast } from 'react-hot-toast';

const UserDetailsModal = ({ user, isOpen, onClose }) => {
  const { userRole } = useAuth();
  const [audit, setAudit] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditError, setAuditError] = useState(null);
  const { avatarUrl } = useAvatar(user?.id, { useSignedUrl: true, autoFetch: !!user?.id });

  useEffect(() => {
    if (!isOpen || !user?.id) return;
    let cancelled = false;
    setLoadingAudit(true);
    setAuditError(null);

    adminGetProfileApprovalAudit({ profileId: user.id, limit: 20, offset: 0 })
      .then((rows) => {
        if (cancelled) return;
        setAudit(Array.isArray(rows) ? rows : []);
      })
      .catch((err) => {
        if (cancelled) return;
        logger.error('Failed to load approval history', err);
        setAuditError('Failed to load approval history');
      })
      .finally(() => {
        if (cancelled) return;
        setLoadingAudit(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, user?.id]);

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
                    <div className="h-20 w-20 flex-shrink-0 flex items-center justify-center">
                      <Avatar
                        src={avatarUrl || user.avatar_url || null}
                        alt={user.full_name || 'User'}
                        size={64}
                        rounded="full"
                      />
                    </div>
                    <div>
                      <p className="text-xl font-semibold text-gray-800">{user.full_name}</p>
                      <p className="text-sm text-gray-500">{getRoleName(user)}</p>
                    </div>
                  </div>
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <dl className="space-y-4">
                      {/* ADMIN-ONLY: Email is intentionally displayed here for moderation / user management. */}
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
                        {(() => {
                          const status = getAccountStatus(user);
                          return (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${status.badgeClass}`}>
                              {status.label}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-700">Last seen: {user.last_seen ? new Date(user.last_seen).toLocaleString() : 'N/A'}</span>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-gray-600 mb-1">Approval history</p>
                        {loadingAudit && (
                          <p className="text-xs text-gray-500">Loading history...</p>
                        )}
                        {auditError && !loadingAudit && (
                          <p className="text-xs text-red-500">{auditError}</p>
                        )}
                        {!loadingAudit && !auditError && audit && audit.length === 0 && (
                          <p className="text-xs text-gray-500">No approval changes recorded.</p>
                        )}
                        {!loadingAudit && !auditError && audit && audit.length > 0 && (
                          <ul className="mt-1 space-y-1 max-h-32 overflow-y-auto text-xs text-gray-700">
                            {audit.map((entry) => (
                              <li
                                key={entry.id ?? `${entry.changed_at}-${entry.new_approval_status ?? ''}-${entry.new_is_active ?? ''}`}
                              >
                                {(() => {
                                  const decision = entry.decision || entry.new_approval_status || 'Updated';
                                  const ts = entry.created_at || entry.changed_at;
                                  const when = ts ? new Date(ts).toLocaleString() : 'Unknown time';
                                  return (
                                    <>
                                      <span className="font-medium">{decision}</span>
                                      {' · '}
                                      <span>{when}</span>
                                      {entry.admin_id && (
                                        <>
                                          {' · '}
                                          <span>
                                            by <AuditAdminName adminId={entry.admin_id} />
                                          </span>
                                        </>
                                      )}
                                      {entry.notes && (
                                        <>
                                          {' · '}
                                          <span className="italic">{entry.notes}</span>
                                        </>
                                      )}
                                    </>
                                  );
                                })()}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 justify-between items-center">
                  <div className="flex gap-2">
                    <Link to={`/profile/${user.id}`} className="inline-flex justify-center rounded-md border border-transparent bg-green-100 px-4 py-2 text-sm font-medium text-green-900 hover:bg-green-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2">
                      View Full Profile
                    </Link>
                    
                    {/* GAP 5 FIX: Impersonate Button (Admin Only) */}
                    {(userRole === 'admin' || userRole === 'super_admin') && (
                      <ImpersonateButton 
                        targetUserId={user.id} 
                        targetUserName={user.full_name || user.email}
                        onClose={onClose}
                      />
                    )}
                  </div>
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

const AuditAdminName = ({ adminId }) => {
  const { profile } = useProfileById(adminId);

  if (!adminId) {
    return <span className="text-gray-500">System</span>;
  }

  if (!profile) {
    return <span className="text-gray-400">Loading...</span>;
  }

  return <span className="text-gray-700">{getDisplayName(profile)}</span>;
};

// GAP 5 FIX: ImpersonateButton component
const ImpersonateButton = ({ targetUserId, targetUserName, onClose }) => {
  const [loading, setLoading] = useState(false);

  const handleImpersonate = async () => {
    if (!window.confirm(`Start impersonating ${targetUserName}? You will see the app exactly as they see it.\n\nThis action will be logged for security purposes.`)) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('start_impersonation', {
        p_target_user_id: targetUserId,
        p_ip_address: null, // Server will capture if needed
        p_user_agent: navigator.userAgent
      });

      if (error) throw error;

      if (data?.success && data?.session_token) {
        // Store impersonation data
        localStorage.setItem('impersonation_data', JSON.stringify({
          sessionToken: data.session_token,
          sessionId: data.session_id,
          targetUserId: targetUserId,
          targetName: targetUserName,
          expiresAt: data.expires_at,
          adminSession: {
            access_token: (await supabase.auth.getSession()).data.session?.access_token,
            refresh_token: (await supabase.auth.getSession()).data.session?.refresh_token
          }
        }));

        toast.success(`Now impersonating ${targetUserName}. A banner will appear at the top of the page.`);
        onClose();
        
        // Reload to trigger impersonation mode
        window.location.href = '/dashboard';
      } else {
        toast.error(data?.error || 'Failed to start impersonation');
      }
    } catch (err) {
      logger.error('Impersonation failed:', err);
      toast.error('Failed to impersonate: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleImpersonate}
      disabled={loading}
      className="inline-flex items-center justify-center rounded-md border border-transparent bg-yellow-100 px-4 py-2 text-sm font-medium text-yellow-900 hover:bg-yellow-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500 focus-visible:ring-offset-2 disabled:opacity-50"
      title="View the app as this user sees it"
    >
      <EyeIcon className="h-4 w-4 mr-1.5" />
      {loading ? 'Starting...' : 'Impersonate'}
    </button>
  );
};

export default UserDetailsModal;
