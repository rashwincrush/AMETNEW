# MENTORSHIP MODULE - COMPLETE END-TO-END AUDIT
**Generated:** 2025-12-01  
**Scope:** Database → Backend RPCs → Frontend Components → Security → UX

---

## EXECUTIVE SUMMARY (10 LINES)

**Problem:** Mentorship module spans 8+ DB tables, 3 frontend tabs, complex approval flows, and realtime chat—requires full-stack audit to prevent orphaned requests, RLS bypasses, and UX dead-ends.  
**Users:** Alumni (mentees), approved mentors, admins moderating mentor applications, super_admins managing capacity.  
**Need:** Validate that mentor approval, capacity limits, request lifecycle, chat creation, and directory visibility are consistent across DB triggers, RLS, backend RPCs, and React UI.  
**Why Now:** User confusion around "At capacity" vs "Accepting mentees" states; need to confirm backend enforces max_mentees and frontend reflects realtime availability changes.  
**Solution:** Map all 5 layers (Product/UX/FE/BE/DB/RLS) for mentorship, document every table/trigger/RPC/component, identify gaps in approval guards, capacity enforcement, orphan cleanup, and UI state handling.  
**Architecture:** Postgres tables (profiles, mentorship_requests, mentorship_relationships, conversations, messages) + RLS policies + triggers + React hooks (useMentorDirectory, useMentorshipRequests) + realtime subscriptions.  
**Value:** Single source of truth for mentorship flow, eliminates approval bypass risk, prevents capacity overflow, ensures chat creation atomicity, and provides regression test matrix.  
**Risks:** Missing capacity checks in RPC, stale realtime subscriptions, orphaned conversations if relationship deleted, admin can't override "at capacity" for exceptions.  
**Metrics:** Zero orphaned requests after 30 days, <2s directory load, 100% chat creation success rate, zero RLS policy violations in logs.  
**Next Steps:** Implement 12 critical fixes (DB constraints, RPCs, RLS policies, FE hooks), add E2E Cypress test, deploy to staging, run load test with 100 concurrent requests.

---

## DATABASE LAYER

### Tables Involved

#### 1. `profiles`
```sql
-- Core columns for mentorship
id UUID PRIMARY KEY
role app_role_enum ('alumni', 'mentor', 'admin', 'super_admin')
approval_status approval_status ('pending', 'approved', 'rejected')
is_available_for_mentorship BOOLEAN DEFAULT FALSE
max_mentees INT DEFAULT 5
first_name TEXT
last_name TEXT
avatar_url TEXT
```

**Issues Found:**
- ❌ No CHECK constraint `max_mentees > 0 AND max_mentees <= 50`
- ❌ No partial index on `(role, approval_status, is_available_for_mentorship)` for directory queries
- ❌ `is_available_for_mentorship` defaults to FALSE even for approved mentors (should require explicit opt-in)

**Fixes Required:**
```sql
ALTER TABLE profiles
ADD CONSTRAINT check_max_mentees CHECK (max_mentees > 0 AND max_mentees <= 50);

CREATE INDEX idx_mentor_directory
ON profiles (role, approval_status, is_available_for_mentorship)
WHERE role = 'mentor' AND approval_status = 'approved';
```

---

#### 2. `mentorship_requests`
```sql
CREATE TABLE mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- ISSUE: Should be ENUM
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  CONSTRAINT check_not_self CHECK (mentee_id != mentor_id)
);
```

**Issues Found:**
- 🔴 **CRITICAL:** No UNIQUE constraint on `(mentee_id, mentor_id)` WHERE status IN ('pending','accepted') → duplicate requests possible
- 🔴 **CRITICAL:** `status` is TEXT, should be ENUM
- ❌ No index on `(mentor_id, status)` for mentor dashboard queries
- ❌ No index on `(mentee_id, created_at DESC)` for rate limit checks

**Fixes Required:**
```sql
-- Create enum
CREATE TYPE mentorship_request_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');

ALTER TABLE mentorship_requests
ALTER COLUMN status TYPE mentorship_request_status USING status::mentorship_request_status;

-- Prevent duplicate active requests
CREATE UNIQUE INDEX idx_unique_active_request
ON mentorship_requests (mentee_id, mentor_id)
WHERE status IN ('pending', 'accepted');

-- Performance indexes
CREATE INDEX idx_mentor_requests ON mentorship_requests (mentor_id, status);
CREATE INDEX idx_mentee_requests_recent ON mentorship_requests (mentee_id, created_at DESC);
```

---

#### 3. `mentorship_relationships`
```sql
CREATE TABLE mentorship_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active', -- ISSUE: Should be ENUM
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  CONSTRAINT check_not_self CHECK (mentee_id != mentor_id)
);
```

**Issues Found:**
- 🔴 **CRITICAL:** No UNIQUE constraint on `(mentee_id, mentor_id)` WHERE status='active' → duplicate relationships possible
- ❌ `status` is TEXT, should be ENUM ('active', 'completed', 'terminated')
- ❌ No index on `(mentor_id, status)` for capacity count queries
- ❌ No CHECK constraint `ended_at > started_at`

**Fixes Required:**
```sql
-- Create enum
CREATE TYPE mentorship_relationship_status AS ENUM ('active', 'completed', 'terminated');

ALTER TABLE mentorship_relationships
ALTER COLUMN status TYPE mentorship_relationship_status USING status::mentorship_relationship_status;

-- Prevent duplicate active relationships
CREATE UNIQUE INDEX idx_unique_active_relationship
ON mentorship_relationships (mentee_id, mentor_id)
WHERE status = 'active';

-- Performance index for capacity checks
CREATE INDEX idx_mentor_active_relationships
ON mentorship_relationships (mentor_id, status)
WHERE status = 'active';

-- Data integrity
ALTER TABLE mentorship_relationships
ADD CONSTRAINT check_ended_after_started CHECK (ended_at IS NULL OR ended_at > started_at);
```

---

#### 4. `conversations` & `conversation_participants`
```sql
-- Conversations created when request accepted
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES profiles(id),
  metadata JSONB, -- Stores {type: 'mentorship', request_id: UUID, relationship_id: UUID}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE conversation_participants (
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (conversation_id, profile_id)
);
```

**Issues Found:**
- ❌ No index on `conversations.metadata->>'relationship_id'` for lookups
- ❌ If `mentorship_relationships` deleted, orphaned conversation remains (no CASCADE)

**Fixes Required:**
```sql
-- Index for metadata queries
CREATE INDEX idx_conversations_mentorship
ON conversations USING gin(metadata)
WHERE metadata->>'type' = 'mentorship';

-- Add relationship_id FK (requires schema change)
ALTER TABLE conversations
ADD COLUMN mentorship_relationship_id UUID REFERENCES mentorship_relationships(id) ON DELETE SET NULL;
```

---

## RLS POLICIES

### `mentorship_requests` Policies

#### Current (Assumed)
```sql
-- SELECT: Own requests only
CREATE POLICY select_own_requests ON mentorship_requests
FOR SELECT USING (
  auth.uid() = mentee_id OR auth.uid() = mentor_id OR _is_admin(auth.uid())
);

-- INSERT: Mentee can create
CREATE POLICY insert_own_request ON mentorship_requests
FOR INSERT WITH CHECK (auth.uid() = mentee_id);

-- UPDATE: Mentor can respond
CREATE POLICY update_mentor_response ON mentorship_requests
FOR UPDATE USING (auth.uid() = mentor_id OR _is_admin(auth.uid()));

-- DELETE: Mentee can cancel pending
CREATE POLICY delete_own_pending ON mentorship_requests
FOR DELETE USING (auth.uid() = mentee_id AND status = 'pending');
```

#### Issues Found
- 🔴 **CRITICAL:** INSERT policy doesn't validate mentor is approved
- 🔴 **CRITICAL:** UPDATE policy allows changing `mentor_id`, `mentee_id` (should only allow status changes)
- ❌ No validation that mentee is approved before INSERT

#### Fixed Policies
```sql
-- Fix INSERT: Validate both parties approved
DROP POLICY IF EXISTS insert_own_request ON mentorship_requests;
CREATE POLICY insert_own_request ON mentorship_requests
FOR INSERT WITH CHECK (
  auth.uid() = mentee_id
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = mentee_id AND approval_status = 'approved'
  )
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE id = mentor_id AND role = 'mentor' AND approval_status = 'approved'
  )
);

-- Fix UPDATE: Restrict to pending requests only
DROP POLICY IF EXISTS update_mentor_response ON mentorship_requests;
CREATE POLICY update_mentor_response ON mentorship_requests
FOR UPDATE USING (
  (auth.uid() = mentor_id OR _is_admin(auth.uid()))
  AND status = 'pending'
);
-- Note: Column-level restrictions enforced in RPC, not RLS
```

---

### `mentorship_relationships` Policies

#### Current (Assumed)
```sql
-- SELECT: Own relationships
CREATE POLICY select_own_relationships ON mentorship_relationships
FOR SELECT USING (
  auth.uid() = mentee_id OR auth.uid() = mentor_id OR _is_admin(auth.uid())
);

-- No INSERT policy (created via trigger/RPC only)

-- UPDATE: End relationship
CREATE POLICY update_end_relationship ON mentorship_relationships
FOR UPDATE USING (
  (auth.uid() = mentor_id OR _is_admin(auth.uid()))
  AND status = 'active'
);
```

#### Issues Found
- ✅ No INSERT policy = correct (relationships created only via RPC)
- ❌ UPDATE policy should allow mentee to request termination (mutual consent model)

#### Enhanced Policy
```sql
-- Allow mentee to request termination
CREATE POLICY mentee_request_termination ON mentorship_relationships
FOR UPDATE USING (
  auth.uid() = mentee_id AND status = 'active'
)
WITH CHECK (
  status = 'terminated' AND ended_at IS NOT NULL
);
```

---

## BACKEND RPCs

### RPC 1: `request_mentorship`

```sql
CREATE OR REPLACE FUNCTION request_mentorship(
  p_mentor_id UUID,
  p_message TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_mentee_id UUID := auth.uid();
  v_mentor_approved BOOLEAN;
  v_mentee_approved BOOLEAN;
  v_current_mentees INT;
  v_max_mentees INT;
  v_recent_requests INT;
  v_request_id UUID;
BEGIN
  -- Validate mentee approved
  SELECT approval_status = 'approved' INTO v_mentee_approved
  FROM profiles WHERE id = v_mentee_id;
  
  IF NOT v_mentee_approved THEN
    RAISE EXCEPTION 'You must be approved before requesting mentorship';
  END IF;
  
  -- Validate mentor exists and approved
  SELECT 
    approval_status = 'approved',
    max_mentees
  INTO v_mentor_approved, v_max_mentees
  FROM profiles WHERE id = p_mentor_id AND role = 'mentor';
  
  IF NOT v_mentor_approved THEN
    RAISE EXCEPTION 'This mentor is not available';
  END IF;
  
  -- Check capacity
  SELECT COUNT(*) INTO v_current_mentees
  FROM mentorship_relationships
  WHERE mentor_id = p_mentor_id AND status = 'active';
  
  IF v_current_mentees >= v_max_mentees THEN
    RAISE EXCEPTION 'This mentor is currently at capacity';
  END IF;
  
  -- Check duplicate (DB constraint will also catch this)
  IF EXISTS (
    SELECT 1 FROM mentorship_requests
    WHERE mentee_id = v_mentee_id
      AND mentor_id = p_mentor_id
      AND status IN ('pending', 'accepted')
  ) THEN
    RAISE EXCEPTION 'You already have a pending or accepted request with this mentor';
  END IF;
  
  -- Rate limit: max 5 requests in 24h
  SELECT COUNT(*) INTO v_recent_requests
  FROM mentorship_requests
  WHERE mentee_id = v_mentee_id
    AND created_at > NOW() - INTERVAL '24 hours';
  
  IF v_recent_requests >= 5 THEN
    RAISE EXCEPTION 'Rate limit exceeded. Please wait 24 hours.';
  END IF;
  
  -- Validate not requesting self
  IF v_mentee_id = p_mentor_id THEN
    RAISE EXCEPTION 'You cannot request mentorship from yourself';
  END IF;
  
  -- Insert request
  INSERT INTO mentorship_requests (mentee_id, mentor_id, message, status)
  VALUES (v_mentee_id, p_mentor_id, p_message, 'pending')
  RETURNING id INTO v_request_id;
  
  -- Trigger notification
  INSERT INTO notifications (recipient_id, type, title, message, link)
  VALUES (
    p_mentor_id,
    'mentorship',
    'New Mentorship Request',
    'You have a new mentorship request',
    '/mentorship/dashboard'
  );
  
  RETURN json_build_object('request_id', v_request_id, 'status', 'success');
END;
$$;

GRANT EXECUTE ON FUNCTION request_mentorship TO authenticated;
```

---

### RPC 2: `accept_mentorship_request`

```sql
CREATE OR REPLACE FUNCTION accept_mentorship_request(
  p_request_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_mentor_id UUID := auth.uid();
  v_mentee_id UUID;
  v_request_mentor_id UUID;
  v_current_mentees INT;
  v_max_mentees INT;
  v_conversation_id UUID;
  v_relationship_id UUID;
BEGIN
  -- Validate request exists and is pending (with row lock)
  SELECT mentee_id, mentor_id INTO v_mentee_id, v_request_mentor_id
  FROM mentorship_requests
  WHERE id = p_request_id AND status = 'pending'
  FOR UPDATE; -- Prevents race conditions
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;
  
  -- Validate ownership
  IF v_request_mentor_id != v_mentor_id AND NOT _is_admin(v_mentor_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  -- Double-check capacity (race condition guard)
  SELECT max_mentees INTO v_max_mentees
  FROM profiles WHERE id = v_mentor_id;
  
  SELECT COUNT(*) INTO v_current_mentees
  FROM mentorship_relationships
  WHERE mentor_id = v_mentor_id AND status = 'active';
  
  IF v_current_mentees >= v_max_mentees THEN
    RAISE EXCEPTION 'You have reached your mentee capacity';
  END IF;
  
  -- ATOMIC TRANSACTION (all or nothing)
  
  -- 1. Update request status
  UPDATE mentorship_requests
  SET status = 'accepted', responded_at = NOW()
  WHERE id = p_request_id;
  
  -- 2. Create relationship
  INSERT INTO mentorship_relationships (mentee_id, mentor_id, status, started_at)
  VALUES (v_mentee_id, v_mentor_id, 'active', NOW())
  RETURNING id INTO v_relationship_id;
  
  -- 3. Create conversation
  INSERT INTO conversations (created_by, metadata)
  VALUES (v_mentor_id, jsonb_build_object(
    'type', 'mentorship',
    'request_id', p_request_id,
    'relationship_id', v_relationship_id
  ))
  RETURNING id INTO v_conversation_id;
  
  -- 4. Add participants
  INSERT INTO conversation_participants (conversation_id, profile_id)
  VALUES 
    (v_conversation_id, v_mentee_id),
    (v_conversation_id, v_mentor_id);
  
  -- 5. Notify mentee
  INSERT INTO notifications (recipient_id, type, title, message, link)
  VALUES (
    v_mentee_id,
    'mentorship',
    'Mentorship Request Accepted',
    'Your mentorship request was accepted!',
    '/mentorship/chat/' || v_conversation_id
  );
  
  RETURN json_build_object(
    'conversation_id', v_conversation_id,
    'relationship_id', v_relationship_id,
    'status', 'success'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION accept_mentorship_request TO authenticated;
```

---

### RPC 3: `reject_mentorship_request`

```sql
CREATE OR REPLACE FUNCTION reject_mentorship_request(
  p_request_id UUID,
  p_reason TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_mentor_id UUID := auth.uid();
  v_mentee_id UUID;
  v_request_mentor_id UUID;
BEGIN
  SELECT mentee_id, mentor_id INTO v_mentee_id, v_request_mentor_id
  FROM mentorship_requests
  WHERE id = p_request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;
  
  IF v_request_mentor_id != v_mentor_id AND NOT _is_admin(v_mentor_id) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  UPDATE mentorship_requests
  SET 
    status = 'rejected',
    responded_at = NOW(),
    rejection_reason = p_reason
  WHERE id = p_request_id;
  
  INSERT INTO notifications (recipient_id, type, title, message, link)
  VALUES (
    v_mentee_id,
    'mentorship',
    'Mentorship Request Declined',
    COALESCE(p_reason, 'Your mentorship request was declined'),
    '/mentorship/requests'
  );
  
  RETURN json_build_object('status', 'success');
END;
$$;

GRANT EXECUTE ON FUNCTION reject_mentorship_request TO authenticated;
```

---

### RPC 4: `cancel_mentorship_request`

```sql
CREATE OR REPLACE FUNCTION cancel_mentorship_request(
  p_request_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_mentee_id UUID := auth.uid();
  v_request_mentee_id UUID;
BEGIN
  SELECT mentee_id INTO v_request_mentee_id
  FROM mentorship_requests
  WHERE id = p_request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;
  
  IF v_request_mentee_id != v_mentee_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  
  DELETE FROM mentorship_requests WHERE id = p_request_id;
  
  RETURN json_build_object('status', 'success');
END;
$$;

GRANT EXECUTE ON FUNCTION cancel_mentorship_request TO authenticated;
```

---

## FRONTEND LAYER

### Component Structure

```
frontend/src/components/Mentorship/
├── Mentorship.js              # Main router with 3 tabs
├── MentorDirectory.js         # "Find Mentors" tab
├── MyRequests.js              # "My Requests" tab (outgoing)
├── MentorDashboard.js         # "Mentor Dashboard" tab (incoming)
├── MentorshipMe.js            # "/mentorship/me" page
├── MentorshipChat.js          # Chat interface
├── MentorCard.js              # Reusable mentor card component
├── RequestRow.js              # Reusable request row component
└── StatusBanner.js            # Yellow/purple approval banners
```

### Hooks Required

#### `useMentorDirectory.js`
```javascript
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';

export function useMentorDirectory(filters = {}) {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMentors = async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          mentorship_relationships!mentor_id(id, status)
        `)
        .eq('role', 'mentor')
        .eq('approval_status', 'approved');

      // Filter by availability if requested
      if (filters.showAcceptingOnly) {
        query = query.eq('is_available_for_mentorship', true);
      }

      // Filter by expertise (if you have expertise table)
      if (filters.expertise) {
        query = query.contains('expertise_areas', [filters.expertise]);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      // Calculate capacity client-side (or use view)
      const enriched = data.map(mentor => ({
        ...mentor,
        current_mentees: mentor.mentorship_relationships?.filter(r => r.status === 'active').length || 0,
        at_capacity: (mentor.mentorship_relationships?.filter(r => r.status === 'active').length || 0) >= mentor.max_mentees
      }));

      setMentors(enriched);
    } catch (err) {
      console.error('Error fetching mentors:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMentors();

    // Subscribe to availability changes
    const channel = supabase
      .channel('mentor_availability_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `role=eq.mentor`
      }, () => {
        fetchMentors();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filters.showAcceptingOnly, filters.expertise]);

  return { mentors, loading, error, refetch: fetchMentors };
}
```

#### `useMentorshipRequests.js`
```javascript
import { useState, useEffect } from 'react';
import { supabase } from '../../utils/supabase';
import { useAuth } from '../../contexts/AuthContext';

export function useMentorshipRequests(type = 'sent') {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const filterField = type === 'sent' ? 'mentee_id' : 'mentor_id';
      const otherField = type === 'sent' ? 'mentor_id' : 'mentee_id';

      const { data, error: fetchError } = await supabase
        .from('mentorship_requests')
        .select(`
          *,
          ${otherField}:profiles!${otherField}(id, first_name, last_name, avatar_url, current_job_title, company_name)
        `)
        .eq(filterField, user.id)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setRequests(data);
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();

    // Subscribe to request status changes
    const channel = supabase
      .channel('mentorship_requests_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'mentorship_requests',
        filter: type === 'sent' ? `mentee_id=eq.${user?.id}` : `mentor_id=eq.${user?.id}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setRequests(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setRequests(prev => prev.map(r => r.id === payload.new.id ? { ...r, ...payload.new } : r));
        } else if (payload.eventType === 'DELETE') {
          setRequests(prev => prev.filter(r => r.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, type]);

  return { requests, loading, error, refetch: fetchRequests };
}
```

### Critical Frontend Fixes

#### Fix 1: Replace Direct INSERT with RPC
```javascript
// ❌ BAD: MentorDirectory.js
const handleRequestMentorship = async (mentorId, message) => {
  const { error } = await supabase
    .from('mentorship_requests')
    .insert({ mentee_id: user.id, mentor_id: mentorId, message });
};

// ✅ GOOD: Use RPC
const handleRequestMentorship = async (mentorId, message) => {
  const { data, error } = await supabase.rpc('request_mentorship', {
    p_mentor_id: mentorId,
    p_message: message
  });

  if (error) {
    if (error.message.includes('capacity')) {
      toast.error('This mentor is currently at capacity.');
    } else if (error.message.includes('duplicate')) {
      toast.error('You already have a pending request with this mentor.');
    } else if (error.message.includes('rate limit')) {
      toast.error('Too many requests. Please wait 24 hours.');
    } else if (error.message.includes('approved')) {
      toast.error('Complete your profile and wait for approval.');
    } else {
      toast.error('Failed to send request. Please try again.');
    }
    return;
  }

  toast.success('Request sent successfully!');
  refetchRequests();
};
```

#### Fix 2: Add Loading Skeletons
```javascript
// MentorDirectory.js
if (loading) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse bg-white rounded-lg p-6 shadow">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
            <div className="flex-1 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

#### Fix 3: Add Error Boundary
```javascript
// MentorshipErrorBoundary.js
import React from 'react';

export class MentorshipErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Mentorship module error:', error, errorInfo);
    // TODO: Send to error tracking service (Sentry, etc.)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">
            We're sorry, but the mentorship module encountered an error.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## UI/UX FLOW DOCUMENTATION

### Flow 1: Mentee Requests Mentorship

**Entry Point:** Mentee clicks "Request Mentorship" button on mentor card

**Steps:**
1. **Validation (Frontend)**
   - Check if user is logged in
   - Check if user's `approval_status === 'approved'`
   - If not approved, show disabled button with tooltip: "Complete your profile and wait for approval"

2. **Modal Opens**
   - Title: "Request Mentorship from [Mentor Name]"
   - Text area: "Introduce yourself and explain why you'd like this mentor" (max 500 chars)
   - Cancel button (secondary)
   - Send Request button (primary)

3. **Submit Request**
   - Call `supabase.rpc('request_mentorship', { p_mentor_id, p_message })`
   - Show loading spinner on button

4. **Success Response**
   - Close modal
   - Show success toast: "Request sent! [Mentor Name] will respond soon."
   - Refetch "My Requests" list
   - Update mentor card to show "Request Pending" (disabled state)

5. **Error Handling**
   - Capacity error → Toast: "This mentor is currently at capacity. Try another mentor."
   - Duplicate error → Toast: "You already have a pending request with this mentor."
   - Rate limit error → Toast: "You've sent too many requests today. Please wait 24 hours."
   - Generic error → Toast: "Failed to send request. Please try again."

**Exit:** Request appears in "My Requests" tab with status "Pending"

---

### Flow 2: Mentor Accepts Request

**Entry Point:** Mentor clicks "Accept" button on request row in "Mentor Dashboard"

**Steps:**
1. **Confirmation Modal**
   - Title: "Accept Mentorship Request?"
   - Body: "You'll be able to chat with [Mentee Name] and guide their career development."
   - Warning (if near capacity): "You have 1 mentee slot remaining."
   - Cancel button
   - Confirm button

2. **Submit Acceptance**
   - Call `supabase.rpc('accept_mentorship_request', { p_request_id })`
   - Show loading spinner

3. **Success Response**
   - Close modal
   - Show success toast: "Request accepted! Chat is now open."
   - Update request row: status changes to "Accepted", button changes to "Open Chat"
   - Increment mentor's current_mentees count
   - If at capacity, update all mentor cards to show "At Capacity"

4. **Error Handling**
   - Capacity error (race condition) → Toast: "You've reached your mentee limit."
   - Already processed → Toast: "This request was already processed."
   - Generic error → Toast: "Failed to accept request. Please try again."

5. **Navigate to Chat**
   - Automatically open chat interface with conversation_id from response
   - Show welcome message template (optional)

**Exit:** Mentorship relationship active, chat conversation created, both parties can message

---

### Flow 3: Mentor Toggles Availability

**Entry Point:** Mentor toggles "Accepting mentees" switch on `/mentorship/me` page

**Steps:**
1. **Toggle Switch**
   - Current state shown (ON = green, OFF = gray)
   - Label: "Accepting mentees"
   - Helper text: "When ON, you'll appear in the mentor directory"

2. **Update Profile**
   - Call `supabase.from('profiles').update({ is_available_for_mentorship: newValue }).eq('id', user.id)`
   - Show loading state on toggle (disabled during update)

3. **Success Response**
   - Toggle updates to new state
   - Show toast: "Availability updated"
   - Realtime subscription triggers directory refetch on all clients

4. **Directory Impact**
   - If toggled OFF: Mentor disappears from directory within 2 seconds
   - If toggled ON: Mentor reappears in directory
   - Existing pending requests remain visible (not affected by toggle)

**Exit:** Mentor's visibility in directory reflects new availability state

---

## SECURITY ANALYSIS

### Threat Model

#### Threat 1: Capacity Overflow (Race Condition)
**Attack:** Two mentees simultaneously request same mentor when 1 slot remaining → both accepted

**Mitigation:**
- `FOR UPDATE` row lock in `accept_mentorship_request` RPC
- Double-check capacity inside transaction
- UNIQUE constraint on active relationships prevents duplicate inserts

**Test:**
```bash
# Simulate race condition
for i in {1..10}; do
  curl -X POST https://your-project.supabase.co/rest/v1/rpc/accept_mentorship_request \
    -H "Authorization: Bearer $MENTOR_TOKEN" \
    -d '{"p_request_id": "same-request-id"}' &
done
wait
# Expected: Only 1 success, 9 failures with "already processed" error
```

---

#### Threat 2: Request Spam
**Attack:** Malicious mentee sends 100 requests in 1 minute

**Mitigation:**
- Rate limit in RPC: max 5 requests per 24 hours
- UNIQUE constraint prevents duplicate pending requests
- Consider adding CAPTCHA for request submission

**Monitoring:**
```sql
-- Alert if any user exceeds 10 requests in 1 hour
SELECT mentee_id, COUNT(*) as request_count
FROM mentorship_requests
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY mentee_id
HAVING COUNT(*) > 10;
```

---

#### Threat 3: Unauthorized Chat Access
**Attack:** User guesses conversation_id and accesses mentorship chat

**Mitigation:**
- RLS on `conversations` requires participant membership
- RLS on `messages` requires participant membership via join
- Frontend validates conversation belongs to mentorship relationship

**Test:**
```javascript
// Try to access conversation you're not part of
const { data, error } = await supabase
  .from('conversations')
  .select('*')
  .eq('id', 'someone-elses-conversation-id')
  .single();
// Expected: error or empty result (RLS blocks)
```

---

## PERFORMANCE OPTIMIZATION

### Bottleneck 1: Mentor Directory Query

**Problem:** Fetching 1000 mentors with relationship counts = slow query

**Solution:** Create materialized view

```sql
CREATE MATERIALIZED VIEW mv_mentor_directory AS
SELECT 
  p.*,
  COUNT(mr.id) FILTER (WHERE mr.status='active') AS current_mentees,
  (COUNT(mr.id) FILTER (WHERE mr.status='active') >= p.max_mentees) AS at_capacity
FROM profiles p
LEFT JOIN mentorship_relationships mr ON mr.mentor_id = p.id
WHERE p.role = 'mentor' AND p.approval_status = 'approved'
GROUP BY p.id;

CREATE UNIQUE INDEX ON mv_mentor_directory (id);

-- Refresh every 5 minutes via pg_cron
SELECT cron.schedule(
  'refresh_mentor_directory',
  '*/5 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_mentor_directory'
);
```

**Frontend Update:**
```javascript
// Query materialized view instead of profiles
const { data } = await supabase
  .from('mv_mentor_directory')
  .select('*')
  .eq('is_available_for_mentorship', true);
```

---

### Bottleneck 2: Realtime Subscription Overhead

**Problem:** 500 mentees each subscribing to `mentorship_requests` changes = 500 connections

**Solution:** Use row-level filters and unsubscribe on unmount

```javascript
// Only subscribe to own requests
const channel = supabase
  .channel(`mentorship_requests:${user.id}`)
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'mentorship_requests',
    filter: `mentee_id=eq.${user.id}` // Server-side filter
  }, handleChange)
  .subscribe();

// Always cleanup
return () => {
  supabase.removeChannel(channel);
};
```

---

## QA TEST MATRIX

| Test Case | Expected Result | Status |
|-----------|----------------|--------|
| Unapproved mentee clicks "Request Mentorship" | Button disabled, tooltip shown | ❌ TODO |
| Approved mentee requests approved mentor (capacity available) | Request created, status='pending' | ✅ Should work |
| Mentee requests mentor at capacity | Error: "Mentor at capacity" | ❌ Needs RPC |
| Mentee requests same mentor twice | Error: "Already have pending request" | ❌ Needs constraint |
| Mentee sends 6 requests in 1 hour | 6th fails: "Rate limit exceeded" | ❌ Needs RPC |
| Mentor accepts request | Relationship + conversation created | ❌ Needs RPC |
| Mentor rejects request | Status='rejected', no relationship | ❌ Needs RPC |
| Mentor accepts when at capacity (race) | Transaction rolled back | ❌ Needs FOR UPDATE |
| Mentee cancels pending request | Request deleted | ❌ Needs RPC |
| Mentor toggles availability OFF | Disappears from directory <2s | ✅ Implemented |
| Mobile user (iPhone SE) opens chat | Scrollable, no overflow | ❌ Needs test |
| Slow network loads directory | Skeleton loaders shown | ❌ Needs implementation |
| Expired token during request | 401 → redirect to login | ❌ Needs error handler |

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Database (Critical)
- [ ] Add CHECK constraint on `profiles.max_mentees`
- [ ] Create `mentorship_request_status` enum
- [ ] Create `mentorship_relationship_status` enum
- [ ] Add UNIQUE constraint on `mentorship_requests(mentee_id, mentor_id)` WHERE status IN ('pending','accepted')
- [ ] Add UNIQUE constraint on `mentorship_relationships(mentee_id, mentor_id)` WHERE status='active'
- [ ] Add indexes: `idx_mentor_directory`, `idx_mentor_requests`, `idx_mentee_requests_recent`, `idx_mentor_active_relationships`
- [ ] Create materialized view `mv_mentor_directory`
- [ ] Set up pg_cron job to refresh materialized view

### Phase 2: Backend RPCs (Critical)
- [ ] Create `request_mentorship` RPC
- [ ] Create `accept_mentorship_request` RPC
- [ ] Create `reject_mentorship_request` RPC
- [ ] Create `cancel_mentorship_request` RPC
- [ ] Grant EXECUTE permissions to authenticated role
- [ ] Test all RPCs with Postman/curl

### Phase 3: RLS Policies (Critical)
- [ ] Fix `mentorship_requests` INSERT policy (validate mentor approved)
- [ ] Fix `mentorship_requests` UPDATE policy (restrict to status changes)
- [ ] Add `mentorship_relationships` UPDATE policy for mentee termination
- [ ] Test policies with different user roles

### Phase 4: Frontend Hooks (High Priority)
- [ ] Create `useMentorDirectory` hook with realtime subscription
- [ ] Create `useMentorshipRequests` hook with realtime subscription
- [ ] Create `useMentorshipChat` hook
- [ ] Replace all direct DB calls with RPC calls
- [ ] Add loading skeletons to all components
- [ ] Add error boundaries

### Phase 5: UI/UX Polish (Medium Priority)
- [ ] Consolidate "My Mentorship" page and "Mentor Dashboard" tab
- [ ] Make status banners dismissible
- [ ] Add empty state guidance ("Complete profile to request mentorship")
- [ ] Standardize button labels ("Open Chat" everywhere)
- [ ] Add confirmation modals for accept/reject
- [ ] Test mobile responsiveness (iPhone SE, iPad)

### Phase 6: Testing (High Priority)
- [ ] Write Cypress E2E test for full flow (request → accept → chat)
- [ ] Test race condition (concurrent accepts)
- [ ] Test rate limiting (6 requests in 1 hour)
- [ ] Test capacity overflow
- [ ] Load test directory query (1000 mentors)
- [ ] Test realtime subscriptions (multiple tabs)

### Phase 7: Monitoring (Medium Priority)
- [ ] Add logging to all RPCs (execution time, errors)
- [ ] Set up alerts for spam detection (>10 requests/hour)
- [ ] Set up alerts for capacity violations
- [ ] Add analytics: request→acceptance rate, avg response time
- [ ] Create admin dashboard for mentorship metrics

---

## FOLLOW-UP TASKS

1. **Implement Mentor Reviews**
   - Add `mentorship_reviews` table
   - Allow mentees to rate mentors after relationship ends
   - Display average rating on mentor cards

2. **Add Compatibility Algorithm**
   - Define matching criteria (expertise, industry, location)
   - Calculate compatibility score in backend
   - Sort directory by compatibility

3. **Email Notifications**
   - Send email when request received (mentor)
   - Send email when request accepted/rejected (mentee)
   - Weekly digest of pending requests (mentor)

4. **Admin Moderation Tools**
   - Admin panel to view all requests/relationships
   - Ability to force-end relationships (abuse cases)
   - Bulk approve mentors
   - Override capacity limits for VIP mentors

5. **Analytics Dashboard**
   - Total active mentorships
   - Request→acceptance rate by expertise area
   - Average response time by mentor
   - Mentee satisfaction scores

---

## MIGRATION SCRIPT

```sql
-- File: supabase/migrations/YYYYMMDD_mentorship_module_fixes.sql

-- 1. Add constraints to profiles
ALTER TABLE profiles
ADD CONSTRAINT check_max_mentees CHECK (max_mentees > 0 AND max_mentees <= 50);

-- 2. Create enums
CREATE TYPE mentorship_request_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');
CREATE TYPE mentorship_relationship_status AS ENUM ('active', 'completed', 'terminated');

-- 3. Update mentorship_requests
ALTER TABLE mentorship_requests
ALTER COLUMN status TYPE mentorship_request_status USING status::mentorship_request_status;

CREATE UNIQUE INDEX idx_unique_active_request
ON mentorship_requests (mentee_id, mentor_id)
WHERE status IN ('pending', 'accepted');

CREATE INDEX idx_mentor_requests ON mentorship_requests (mentor_id, status);
CREATE INDEX idx_mentee_requests_recent ON mentorship_requests (mentee_id, created_at DESC);

-- 4. Update mentorship_relationships
ALTER TABLE mentorship_relationships
ALTER COLUMN status TYPE mentorship_relationship_status USING status::mentorship_relationship_status;

CREATE UNIQUE INDEX idx_unique_active_relationship
ON mentorship_relationships (mentee_id, mentor_id)
WHERE status = 'active';

CREATE INDEX idx_mentor_active_relationships
ON mentorship_relationships (mentor_id, status)
WHERE status = 'active';

ALTER TABLE mentorship_relationships
ADD CONSTRAINT check_ended_after_started CHECK (ended_at IS NULL OR ended_at > started_at);

-- 5. Create indexes on profiles
CREATE INDEX idx_mentor_directory
ON profiles (role, approval_status, is_available_for_mentorship)
WHERE role = 'mentor' AND approval_status = 'approved';

-- 6. Create materialized view
CREATE MATERIALIZED VIEW mv_mentor_directory AS
SELECT 
  p.*,
  COUNT(mr.id) FILTER (WHERE mr.status='active') AS current_mentees,
  (COUNT(mr.id) FILTER (WHERE mr.status='active') >= p.max_mentees) AS at_capacity
FROM profiles p
LEFT JOIN mentorship_relationships mr ON mr.mentor_id = p.id
WHERE p.role = 'mentor' AND p.approval_status = 'approved'
GROUP BY p.id;

CREATE UNIQUE INDEX ON mv_mentor_directory (id);

-- 7. Schedule refresh (requires pg_cron extension)
SELECT cron.schedule(
  'refresh_mentor_directory',
  '*/5 * * * *',
  'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_mentor_directory'
);

-- 8. Update RLS policies
DROP POLICY IF EXISTS insert_own_request ON mentorship_requests;
CREATE POLICY insert_own_request ON mentorship_requests
FOR INSERT WITH CHECK (
  auth.uid() = mentee_id
  AND EXISTS (SELECT 1 FROM profiles WHERE id = mentee_id AND approval_status = 'approved')
  AND EXISTS (SELECT 1 FROM profiles WHERE id = mentor_id AND role = 'mentor' AND approval_status = 'approved')
);

DROP POLICY IF EXISTS update_mentor_response ON mentorship_requests;
CREATE POLICY update_mentor_response ON mentorship_requests
FOR UPDATE USING (
  (auth.uid() = mentor_id OR _is_admin(auth.uid()))
  AND status = 'pending'
);

-- 9. Create RPCs (see RPC section above for full implementations)
-- Copy RPC code here...

-- 10. Grant permissions
GRANT EXECUTE ON FUNCTION request_mentorship TO authenticated;
GRANT EXECUTE ON FUNCTION accept_mentorship_request TO authenticated;
GRANT EXECUTE ON FUNCTION reject_mentorship_request TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_mentorship_request TO authenticated;
```

---

## CONCLUSION

This audit identified **12 critical gaps** across database, backend, and frontend layers of the mentorship module:

**Critical Issues (Must Fix Before Launch):**
1. Missing UNIQUE constraints → duplicate requests/relationships possible
2. No capacity enforcement in backend → mentor overload
3. No atomic transaction for accept flow → orphaned chats
4. RLS policies allow column manipulation → security bypass
5. No realtime subscriptions on request status → stale UI
6. Direct DB inserts from frontend → validation bypass

**High Priority Issues:**
7. No rate limiting → request spam
8. No loading skeletons → poor UX
9. Missing error boundaries → app crashes
10. No E2E tests → regression risk

**Medium Priority Issues:**
11. Materialized view for performance
12. Admin override capabilities

**Estimated Implementation Time:**
- Phase 1-3 (DB + Backend + RLS): 8 hours
- Phase 4 (Frontend): 12 hours
- Phase 5 (UX Polish): 6 hours
- Phase 6 (Testing): 8 hours
- **Total: 34 hours (4-5 days)**

**Next Immediate Actions:**
1. Run migration script to add constraints and indexes
2. Create all 4 RPCs
3. Update frontend to use RPCs instead of direct DB calls
4. Add realtime subscriptions to hooks
5. Write Cypress E2E test
6. Deploy to staging and test with 10 concurrent users
