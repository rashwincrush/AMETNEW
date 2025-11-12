import { useAuth } from '../contexts/AuthContext';
import { useMyProfile } from './useMyProfile';
import { getDisplayName } from '../utils/displayName';

export function useCurrentUserIdentity() {
  const { user } = useAuth();
  const uid = user?.id;
  const { data: profile, isLoading } = useMyProfile(uid);
  const name = getDisplayName(profile, user);
  const avatarUrl = profile?.avatar_url || null;
  return { uid, name, avatarUrl, profile, isLoading };
}
