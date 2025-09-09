import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getMyMembership } from '../lib/membership';
import { supabase } from '../utils/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function RequireGroupAdmin({ children }) {
  const { id } = useParams();
  const { profile } = useAuth();
  const { data: membership, isLoading } = useQuery({
    queryKey: ['gm', id],
    queryFn: () => getMyMembership(supabase, id),
  });

  if (isLoading) return null;

  const isSiteAdmin = profile?.is_admin === true;
  const isGroupAdmin = !!membership && membership.role === 'admin';

  if (!isSiteAdmin && !isGroupAdmin) {
    return <Navigate to={`/groups/${id}`} replace />;
  }

  return children || null;
}
