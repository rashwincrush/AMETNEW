# Supabase Auth Rejection Flow & WebSocket Error Fixes

## Table of Contents
1. [Error Analysis](#error-analysis)
2. [Implementation Details](#implementation-details)
3. [Code Changes](#code-changes)
4. [Best Practices](#best-practices)
5. [Testing](#testing)

## Error Analysis

### 1. "User account is rejected" / Redirection
- **Root Cause**: Backend checks `alumni_verification_status` field
- **Behavior**: When status is 'rejected', frontend logs out user and redirects to `/rejection`

### 2. "Error fetching profile/notifications: TypeError: Failed to fetch"
- **Root Cause**: Frontend network errors occurring after token invalidation
- **Typical Reasons**:
  - Fetch requests made after logout
  - Invalid/missing authentication token
  - Race conditions during auth state changes

### 3. "Error setting up realtime channel: tried to subscribe multiple times"
- **Root Cause**: Multiple WebSocket subscription initializations
- **Common Causes**:
  - Missing cleanup on component unmount
  - Multiple components subscribing to same channel
  - Re-renders causing duplicate subscriptions

### 4. Supabase Auth/Realtime Init/Reload Loop
- **Behavior**: Endless cycle of:
  1. Attempt to fetch profile
  2. Get rejected
  3. Logout
  4. Retry fetch

## Implementation Details

### Global Rejection Handling
- Added in [AuthContext.js](cci:7://file:///Users/ashwin/CascadeProjects/AMETNEW/AMETNEWSUPABASE/frontend/src/contexts/AuthContext.js:0:0-0:0):
  - Rejection detection
  - Clean signout flow
  - Global flag to disable notification channels
  - Prevention of redirect loops

### Notification Components
1. **Early Return Pattern**:
   - Check for rejection status before any operations
   - Return early if user is rejected or auth is loading

2. **Lifecycle Management**:
   - Added `mountedRef` to track component mount state
   - Prevent state updates on unmounted components
   - Clean up all subscriptions on unmount

3. **WebSocket Management**:
   - Unique channel names with timestamps
   - Proper cleanup on unmount
   - Prevention of duplicate subscriptions

## Code Changes

### 1. AuthContext.js
```javascript
// Global flag to disable notification channels
window.__DISABLE_NOTIFICATION_CHANNELS = false;

// In your useEffect for auth state changes:
const handleAuthStateChange = async (event, session) => {
  if (user && user.alumni_verification_status === 'rejected') {
    window.__DISABLE_NOTIFICATION_CHANNELS = true;
    // Clean up and sign out
    await signOut();
    navigate('/rejection', { 
      state: { 
        rejectionReason: 'Your account has been rejected' 
      } 
    });
  }
};
2. NotificationBell.js
javascript
// Early return if conditions aren't met
if (!currentUser || rejectionStatus?.isRejected || authLoading || window.__DISABLE_NOTIFICATION_CHANNELS) {
  return <div className="relative"><BellIcon className="h-6 w-6 text-gray-400" /></div>;
}

// In useEffect:
useEffect(() => {
  mountedRef.current = true;
  
  // Skip if conditions aren't met
  if (!currentUser || rejectionStatus?.isRejected || authLoading || window.__DISABLE_NOTIFICATION_CHANNELS) {
    return;
  }

  // ... rest of your effect

  return () => {
    mountedRef.current = false;
    // Clean up channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
  };
}, [currentUser, rejectionStatus, authLoading]);
Best Practices
1. Authentication Flow
Always check auth state before making API calls
Handle token expiration gracefully
Clear sensitive data on signout
2. Realtime Subscriptions
Use unique channel names
Always clean up subscriptions
Handle connection drops
Limit subscription scope
3. Error Handling
Catch and handle all async errors
Provide user feedback
Log errors appropriately
Implement retry logic where needed
4. Performance
Debounce rapid state changes
Memoize expensive calculations
Lazy load non-critical components
Optimize re-renders
Testing
1. Rejection Flow
Set user status to 'rejected' in database
Log in as that user
Verify:
User is immediately signed out
Redirected to rejection page
No WebSocket connections attempted
No console errors
2. Notification System
Log in as approved user
Verify:
Notifications load correctly
Real-time updates work
No duplicate subscriptions
Cleanup on signout
3. Error Cases
Test with:
Network failures
Invalid tokens
Server errors
Race conditions
Summary Table
Error/Log	Cause	Solution
User account rejected	Profile status = 'rejected'	Update status in DB
Failed to fetch (profile)	Fetch after logout	Stop fetches after logout
Failed to fetch (notifications)	Fetch after logout	Stop notification fetches
Duplicate subscribe	Multiple WebSocket inits	Single subscription per channel
Connection loops	Race conditions	Add proper cleanup