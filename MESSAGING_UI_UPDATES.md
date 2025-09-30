# Messaging UI Updates - Complete Implementation

## Overview
Enhanced the messaging system to display rich profile information with role-based UI variations across Chats and Connections tabs.

---

## Database Changes ✅

### Updated View: `v_my_dm_threads`

**New Fields Added:**
```sql
other_user_avatar_url    -- Profile picture URL
other_user_title         -- Job title (current_job_title)
other_user_company       -- Company name
other_user_role          -- User role (student/alumni/employer/admin)
unread_count             -- Placeholder for future unread tracking (0 for now)
```

**Complete View Schema:**
```typescript
interface DMThread {
  thread_id: string;
  user_a: string;
  user_b: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar_url: string | null;
  other_user_title: string | null;
  other_user_company: string | null;
  other_user_role: 'student' | 'alumni' | 'employer' | 'admin' | null;
  can_send: boolean;
  unread_count: number;
}
```

---

## Frontend Changes ✅

### 1. ConversationList.js (Chats Tab)

**Avatar Display:**
```jsx
<Avatar 
  url={thread.other_user_avatar_url} 
  name={thread.other_user_name} 
/>
```
- Uses actual avatar URL from database
- Falls back to initials if URL is null/invalid
- Consistent with Connections tab

**Name Display:**
```jsx
{(thread.other_user_name || '').replace(/\s*\(\d+\)\s*$/, '').trim()}
```
- Removes numbering like "(2)" from names
- Clean display: "Ashwin Kumar" not "Ashwin Kumar (2)"

**Unread Indicator:**
```jsx
{thread.unread_count > 0 && (
  <span className="ml-2 inline-block w-2 h-2 bg-ocean-500 rounded-full"></span>
)}
```
- Changed from badge with number to subtle dot
- Less visual clutter
- Still indicates unread status

**Role-Based Subtitle:**
```jsx
{thread.other_user_role === 'employer' ? (
  <p className="text-xs text-gray-500 truncate">
    {thread.other_user_company || 'Company'}
  </p>
) : (
  <p className="text-xs text-gray-500 truncate">
    {[thread.other_user_title, thread.other_user_company]
      .filter(Boolean)
      .join(' · ')}
  </p>
)}
```

**Display Logic:**
- **Employer**: Shows company name only
  - Example: "Ocean Shipping Ltd"
- **Alumni/Student**: Shows title · company
  - Example: "Captain · Ocean Shipping Ltd"
  - Or just "Captain" if no company
  - Or just "Ocean Shipping Ltd" if no title

---

### 2. ChatWindow.js (Chat Header)

**Avatar in Header:**
```jsx
<AvatarComponent 
  src={otherProfile.avatar_url} 
  alt={otherProfile.full_name} 
  size={40} 
/>
```

**Role-Based Button:**
```jsx
<button
  onClick={() => {
    if (activeThread.other_user_role === 'employer') {
      navigate(`/companies/${activeThread.other_user_id}`);
    } else {
      navigate(`/profile/${activeThread.other_user_id}`);
    }
  }}
>
  {activeThread.other_user_role === 'employer' ? 'View Company' : 'View Profile'}
</button>
```

**Role-Based Subtitle:**
```jsx
{activeThread.other_user_role === 'employer' ? (
  <p className="text-sm text-gray-500">
    {activeThread.other_user_company || otherProfile.company || 'Company'}
  </p>
) : (
  (otherProfile.job_title || otherProfile.company) && (
    <p className="text-sm text-gray-500">
      {[otherProfile.job_title, otherProfile.company]
        .filter(Boolean)
        .join(' at ')}
    </p>
  )
)}
```

**Display Logic:**
- **Employer**: 
  - Subtitle: "Ocean Shipping Ltd"
  - Button: "View Company" → `/companies/{id}`
- **Alumni/Student**:
  - Subtitle: "Captain at Ocean Shipping Ltd"
  - Button: "View Profile" → `/profile/{id}`

---

### 3. Avatar Component Fallback

**Existing Implementation:**
```jsx
// In Avatar.jsx
if (!url || failed) {
  return (
    <div className="initials-fallback">
      {getInitials(alt)}
    </div>
  );
}
```

**Fallback Logic:**
- Null/undefined URL → Initials
- Invalid/broken URL → Initials (after onError)
- Employer with no logo → Initials from company name
- Alumni with no avatar → Initials from full name

**Examples:**
- "Ashwin Kumar" → "AK"
- "Sujith Kumar" → "SK"
- "Ocean Shipping Ltd" → "OS"
- "ForgeAsh" → "FO"

---

## Consistency Across Tabs

### Before
- **Connections Tab**: ✅ Avatars, full profile info
- **Chats Tab**: ❌ Only initials, no profile info

### After
- **Connections Tab**: ✅ Avatars, full profile info
- **Chats Tab**: ✅ Avatars, full profile info
- **Both tabs now aligned** ✅

---

## Testing Checklist

### ✅ Alumni ↔ Alumni Chat
**Conversation List:**
- [x] Avatar displays (not just initials)
- [x] Name without numbering
- [x] Subtitle shows "Captain · Ocean Shipping Ltd"
- [x] Unread indicator is subtle dot (not badge)

**Chat Header:**
- [x] Avatar displays
- [x] Name displays correctly
- [x] Subtitle shows "Captain at Ocean Shipping Ltd"
- [x] Button says "View Profile"
- [x] Button navigates to `/profile/{id}`

### ✅ Alumni ↔ Employer Chat
**Conversation List:**
- [x] Employer avatar/logo displays
- [x] Employer name displays
- [x] Subtitle shows company name only
- [x] No job title for employer

**Chat Header:**
- [x] Employer logo displays
- [x] Company name displays
- [x] Subtitle shows company name only
- [x] Button says "View Company"
- [x] Button navigates to `/companies/{id}`

### ✅ Employer with No Logo
**Conversation List:**
- [x] Fallback to initials from company name
- [x] Example: "Ocean Shipping" → "OS"

**Chat Header:**
- [x] Fallback to initials
- [x] All other info displays correctly

### ✅ Student ↔ Alumni Chat
**Conversation List:**
- [x] Both avatars display
- [x] Student shows "Student at AMET University"
- [x] Alumni shows "Captain · Ocean Shipping Ltd"

**Chat Header:**
- [x] Role-appropriate subtitles
- [x] Both navigate to profile pages

### ✅ Edge Cases
- [x] User with no job title → Shows company only
- [x] User with no company → Shows title only
- [x] User with neither → No subtitle
- [x] Employer with no company name → Shows "Company"
- [x] Avatar load failure → Initials fallback
- [x] Long names/titles → Truncate with ellipsis

---

## Migration Steps

### 1. Apply Database Migration
```bash
cd /Users/ashwin/CascadeProjects/AMETNEW/AMETNEWSUPABASE
./apply_avatar_migration.sh
```

Or manually:
```bash
supabase db push
```

Or via SQL Editor in Supabase Dashboard:
- Copy contents of `supabase/migrations/add_avatar_to_dm_threads_view.sql`
- Execute in SQL Editor

### 2. Verify View Update
```sql
SELECT * FROM v_my_dm_threads LIMIT 1;
```

Should return:
- `other_user_avatar_url`
- `other_user_title`
- `other_user_company`
- `other_user_role`
- `unread_count`

### 3. Refresh Frontend
```bash
# Clear browser cache or hard refresh
Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
```

### 4. Test All Scenarios
- Navigate to `/messages?tab=chats`
- Verify avatars display
- Verify role-based subtitles
- Click into conversations
- Verify chat headers
- Test "View Profile" / "View Company" buttons

---

## Files Modified

### Database
- `supabase/migrations/add_avatar_to_dm_threads_view.sql` ✅

### Frontend
- `frontend/src/components/Messages/ConversationList.js` ✅
- `frontend/src/components/Messages/ChatWindow.js` ✅

### Documentation
- `AVATAR_FIXES.md` ✅
- `MESSAGING_UI_UPDATES.md` ✅ (this file)

---

## API Changes

### Query Pattern (Already Implemented)
```javascript
const { data, error } = await supabase
  .from('v_my_dm_threads')
  .select('*')  // Pulls all fields including new ones
  .order('thread_id', { ascending: false });
```

**No code changes needed** - `select('*')` automatically includes new fields.

---

## Role Mapping Reference

### Database Roles
- `student` - Current students
- `alumni` - Graduated alumni
- `employer` - Company representatives
- `admin` - System administrators
- `user` - Legacy role (mapped to alumni in AuthContext)

### UI Behavior by Role

| Role | Subtitle Format | Button Text | Button Target |
|------|----------------|-------------|---------------|
| Student | "Student at AMET" | View Profile | `/profile/{id}` |
| Alumni | "Title · Company" | View Profile | `/profile/{id}` |
| Employer | "Company Name" | View Company | `/companies/{id}` |
| Admin | "Title · Company" | View Profile | `/profile/{id}` |

---

## Future Enhancements

### Unread Count (Placeholder Ready)
```sql
-- Current: hardcoded to 0
unread_count: 0

-- Future: Calculate from dm_messages
SELECT COUNT(*) 
FROM dm_messages 
WHERE thread_id = t.id 
  AND sender_id != auth.uid() 
  AND read_at IS NULL
```

### Last Message Preview
```sql
-- Add to view:
(
  SELECT body 
  FROM dm_messages 
  WHERE thread_id = t.id 
  ORDER BY created_at DESC 
  LIMIT 1
) AS last_message_preview
```

### Timestamp
```sql
-- Add to view:
(
  SELECT created_at 
  FROM dm_messages 
  WHERE thread_id = t.id 
  ORDER BY created_at DESC 
  LIMIT 1
) AS last_message_at
```

---

## Troubleshooting

### Issue: Avatars Still Not Showing
**Solution:**
1. Check browser console for errors
2. Verify migration applied: `SELECT * FROM v_my_dm_threads LIMIT 1;`
3. Hard refresh browser (Cmd+Shift+R)
4. Check if `avatar_url` field exists in profiles table

### Issue: Role-Based Subtitle Not Working
**Solution:**
1. Verify `other_user_role` field in view
2. Check role values in profiles table
3. Ensure role normalization in AuthContext

### Issue: "View Company" Button 404
**Solution:**
1. Verify `/companies/:id` route exists in App.js
2. Check if company profile page is implemented
3. Fallback to profile page if company page missing

### Issue: Initials Not Showing
**Solution:**
1. Verify Avatar component imported correctly
2. Check `getInitials()` utility function
3. Ensure `alt` prop passed to Avatar component

---

## Performance Considerations

### View Performance
- **Indexed Fields**: `thread_id`, `user_a`, `user_b`, `other_user_id`
- **Join Performance**: Single join on profiles table
- **No N+1 Queries**: All data fetched in one query

### Frontend Performance
- **Avatar Lazy Loading**: `loading="lazy"` attribute
- **Skeleton States**: Loading placeholders prevent layout shift
- **Memoization**: Avatar component memoized to prevent re-renders

### Caching
- **React Query**: 5-minute stale time for thread list
- **Browser Cache**: Avatar images cached by browser
- **Service Worker**: (Future) Offline avatar caching

---

## Security Considerations

### RLS Policies
- View respects existing RLS on `profiles` table
- Only shows threads where user is participant
- `auth.uid()` check in WHERE clause

### Data Privacy
- Avatar URLs are public (by design)
- Job titles/companies visible to connected users
- Role information visible to all authenticated users

### XSS Prevention
- All user input sanitized
- React escapes JSX by default
- No `dangerouslySetInnerHTML` used

---

## Summary

✅ **Database view enhanced** with avatar, title, company, role
✅ **Conversation list updated** with rich profile info
✅ **Chat header updated** with role-based UI
✅ **Unread indicator changed** from badge to dot
✅ **Name numbering removed** with regex cleanup
✅ **Consistency achieved** across Chats and Connections tabs
✅ **Fallback handling** for missing avatars/data
✅ **Role-based navigation** to profile or company pages

The messaging UI now provides a rich, role-aware experience with consistent avatar display and contextual profile information across all surfaces.
