import { supabase } from './supabase';

/**
 * Helper utility for safely creating Supabase realtime subscriptions
 * that only activate when a user session is available
 * 
 * @param {string} tableName - The Supabase table to subscribe to
 * @param {string} event - The event type (INSERT, UPDATE, DELETE)
 * @param {Function} callback - Function to call when event is received
 * @param {Object} options - Additional options
 * @param {string} options.filter - Optional filter string (e.g. 'user_id=eq.123')
 * @param {Object} options.session - Current user session object
 * @returns {Object} Subscription object with unsubscribe method
 */
export const safeRealtimeSubscription = (tableName, event, callback, options = {}) => {
  const { filter, session } = options;
  let subscription = null;
  
  // Only create subscription if we have a session
  if (!session) {
    console.warn(`Realtime subscription to ${tableName} skipped - no active session`);
    return {
      unsubscribe: () => {}
    };
  }
  
  try {
    // Create the channel with a unique name
    const channel = supabase.channel(`${tableName}_changes_${Date.now()}`);
    
    // Build the subscription
    let builder = channel
      .on('postgres_changes', {
        event: event,
        schema: 'public',
        table: tableName
      }, callback);
      
    // Subscribe to the channel
    subscription = builder.subscribe((status) => {
      console.log(`Realtime subscription status for ${tableName}: ${status}`);
    });
    
    return {
      unsubscribe: () => {
        if (subscription) {
          console.log(`Unsubscribing from ${tableName} realtime changes`);
          subscription.unsubscribe();
        }
      }
    };
  } catch (error) {
    console.error(`Error setting up realtime subscription for ${tableName}:`, error);
    return {
      unsubscribe: () => {}
    };
  }
};

/**
 * Example usage:
 * 
 * // In a React component:
 * useEffect(() => {
 *   // Only subscribe when we have a session
 *   if (session) {
 *     const subscription = safeRealtimeSubscription(
 *       'profiles', 
 *       'UPDATE', 
 *       (payload) => console.log('Profile updated!', payload),
 *       { session }
 *     );
 *     
 *     return () => subscription.unsubscribe();
 *   }
 * }, [session]);
 */
