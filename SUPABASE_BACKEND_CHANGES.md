# Supabase Backend Changes

This document outlines the necessary backend changes in Supabase to ensure proper role management, permissions, and data handling for the AMET platform.

## Role Management

### Current Issues
- Inconsistent role naming between frontend and backend
  - Frontend uses both 'user' and 'alumni' roles for the same purpose
  - Some backend triggers/policies may not recognize both values
- Reliance on manual role insertion in some frontend components
- Missing or incomplete RLS (Row Level Security) policies
- Misalignment between profile flags and assigned roles

### Recommended Changes

1. **Role Normalization**:
   - Standardize on 'alumni' as the default user role
   - Update all database triggers and RLS policies to recognize 'alumni' role
   - Maintain 'user' role temporarily for backward compatibility
   - Add migration to convert any 'user' roles to 'alumni' roles in the database

2. **Automatic Role Assignment**:
   - Implement database trigger for automatic role assignment on user signup
   ```sql
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.profiles (id, full_name, email, role)
     VALUES (
       new.id,
       new.raw_user_meta_data->>'full_name',
       new.email,
       'alumni'  -- Default role
     );
     RETURN new;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
   CREATE TRIGGER on_auth_user_created
     AFTER INSERT ON auth.users
     FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
   ```

3. **Admin Role Management**:
   - Update policy to check both `profiles.role='admin'` and `profiles.is_admin=true`
   ```sql
   CREATE OR REPLACE FUNCTION is_admin()
   RETURNS BOOLEAN AS $$
   BEGIN
     RETURN (
       auth.uid() IN (
         SELECT id FROM profiles WHERE (role = 'admin' OR is_admin = true)
       )
     );
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

## Group Membership

### Current Issues
- Frontend directly inserts membership records, bypassing backend validation
- Missing cascading deletes for group membership when users are deleted
- No automatic role assignment for group creators

### Recommended Changes

1. **Group Creation Trigger**:
   - Automatically add creator as member and admin:
   ```sql
   CREATE OR REPLACE FUNCTION public.handle_new_group()
   RETURNS TRIGGER AS $$
   BEGIN
     -- Add creator as member and admin
     INSERT INTO public.group_members (group_id, user_id, role)
     VALUES (new.id, auth.uid(), 'admin');
     RETURN new;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;

   CREATE TRIGGER on_group_created
     AFTER INSERT ON public.groups
     FOR EACH ROW EXECUTE FUNCTION public.handle_new_group();
   ```

2. **Group Joining RPC**:
   - Create RPC function for joining groups that handles duplicates gracefully:
   ```sql
   CREATE OR REPLACE FUNCTION public.join_group(group_id UUID)
   RETURNS JSON AS $$
   DECLARE
     result JSON;
   BEGIN
     -- Check if already a member
     IF EXISTS (
       SELECT 1 FROM public.group_members 
       WHERE user_id = auth.uid() AND group_id = $1
     ) THEN
       SELECT json_build_object(
         'success', false,
         'message', 'Already a member of this group'
       ) INTO result;
       RETURN result;
     END IF;

     -- Add as member
     INSERT INTO public.group_members (group_id, user_id, role)
     VALUES ($1, auth.uid(), 'member')
     RETURNING json_build_object(
       'success', true,
       'message', 'Successfully joined group',
       'group_id', group_id
     ) INTO result;
     
     RETURN result;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

3. **User Deletion Cascade**:
   - Ensure membership records are deleted when users are deleted:
   ```sql
   ALTER TABLE public.group_members
   DROP CONSTRAINT IF EXISTS fk_user_id,
   ADD CONSTRAINT fk_user_id
     FOREIGN KEY (user_id)
     REFERENCES public.profiles(id)
     ON DELETE CASCADE;
   ```

## Row Level Security (RLS) Policies

### Events Table

```sql
-- Allow anyone to read public events
CREATE POLICY "Public events are viewable by everyone"
ON public.events
FOR SELECT USING (is_public = true);

-- Allow users to view events for groups they're members of
CREATE POLICY "Users can view events for their groups"
ON public.events
FOR SELECT USING (
  auth.uid() IN (
    SELECT user_id FROM group_members WHERE group_id = events.group_id
  )
);

-- Allow admins to view all events
CREATE POLICY "Admins can view all events"
ON public.events
FOR SELECT USING (is_admin());

-- Allow event creators to update/delete their events
CREATE POLICY "Users can update their own events"
ON public.events
FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own events"
ON public.events
FOR DELETE USING (created_by = auth.uid());

-- Allow admins to update/delete all events
CREATE POLICY "Admins can update any event"
ON public.events
FOR ALL USING (is_admin());
```

### Profiles Table

```sql
-- Everyone can read profiles
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles
FOR SELECT USING (true);

-- Users can update their own profiles
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE USING (id = auth.uid());

-- Only admins can update role or is_admin flag
CREATE POLICY "Only admins can update role fields"
ON public.profiles
FOR UPDATE USING (
  (is_admin() AND (OLD.role <> NEW.role OR OLD.is_admin <> NEW.is_admin))
  OR
  (id = auth.uid() AND OLD.role = NEW.role AND OLD.is_admin = NEW.is_admin)
);
```

## Additional Improvements

### Real-time Notifications
Configure WebSocket channels for real-time notifications:

```sql
-- Allow users to subscribe to their own notification channel
CREATE POLICY "Users can subscribe to their notifications"
ON realtime.subscription
FOR SELECT USING (
  (channel = 'notifications:' || auth.uid()::text)
);

-- Trigger to broadcast event changes
CREATE OR REPLACE FUNCTION notify_event_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify group members about event changes
  PERFORM pg_notify(
    'event_updates',
    json_build_object(
      'type', TG_OP,
      'event_id', NEW.id,
      'group_id', NEW.group_id
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_update_notify
AFTER INSERT OR UPDATE ON public.events
FOR EACH ROW EXECUTE FUNCTION notify_event_changes();
```

## Migration Steps

1. Create backup of current database state
2. Apply role normalization changes
3. Implement new triggers and functions
4. Update RLS policies
5. Test with frontend changes
6. Monitor for any permission-related errors

When implementing these changes, coordinate with frontend updates to ensure compatibility with the updated backend structure.
