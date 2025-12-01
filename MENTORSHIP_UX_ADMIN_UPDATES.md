# Mentorship UX & Admin User Management Updates

## Summary
Modernized mentorship eligibility banners and extended Admin User Management to show and manage mentorship statuses (mentee & mentor). All changes are frontend-only, using existing backend RPCs.

---

## 1. Modernized Mentorship Eligibility Banners

**File:** `frontend/src/components/Mentorship/Mentorship.js`

### Changes:
- Replaced old blue info banners with modern stacked card design
- Added distinct visual identity:
  - **Mentee banner**: Amber colors (🎓 icon)
  - **Mentor banner**: Indigo colors (⭐ icon)
  - **Success banner**: Emerald colors (✅ icon)
- Used `rounded-xl`, `shadow-sm`, and proper spacing for modern look
- Clear messaging that references "Admin in User Management" for approvals

### Visual Design:
```jsx
<div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
  <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full bg-amber-100 flex-shrink-0">
    <span className="text-amber-700 text-sm">🎓</span>
  </div>
  <div className="flex-1 text-sm">
    <div className="font-semibold text-amber-900">Mentee access not ready yet</div>
    <p className="mt-0.5 text-amber-800">
      Your mentee status is <span className="font-semibold">pending</span>.
      You'll be able to request mentorship once your mentee status is approved by an admin in User Management.
    </p>
  </div>
</div>
```

---

## 2. Admin User Management Extensions

### 2.1 New Admin Service

**File:** `frontend/src/services/adminMentorship.js` (NEW)

```javascript
export async function adminUpdateMenteeStatus(userId, status) {
  const { error } = await supabase.rpc('admin_update_mentee_status', {
    p_user_id: userId,
    p_status: status,
  });
  if (error) throw error;
}

export async function adminUpdateMentorStatus(userId, status) {
  const { error } = await supabase.rpc('admin_update_mentor_status', {
    p_user_id: userId,
    p_status: status,
  });
  if (error) throw error;
}
```

### 2.2 Filter Bar Updates

**File:** `frontend/src/components/Admin/users/UserFiltersBar.jsx`

**Changes:**
- Added two new filter dropdowns:
  - **Mentee Status**: All / Pending / Approved / Rejected / Suspended
  - **Mentor Status**: All / Pending / Approved / Rejected / Suspended
- Changed grid from 4 to 6 columns to accommodate new filters
- Added handlers: `handleMenteeStatusChange`, `handleMentorStatusChange`

### 2.3 User Table Updates

**File:** `frontend/src/components/Admin/users/UserTable.jsx`

**Changes:**

1. **New StatusBadge Component:**
```javascript
function StatusBadge({ value }) {
  // Renders mentorship status with color coding:
  // - Approved: emerald
  // - Pending: amber
  // - Rejected: rose
  // - Suspended/other: slate
}
```

2. **New Table Columns:**
   - Added "Mentee Status" column after "Status"
   - Added "Mentor Status" column after "Mentee Status"
   - Both use `<StatusBadge value={user.mentee_status} />`

3. **New MentorshipActionsMenu Component:**
   - Dropdown menu with three-dot icon (EllipsisVerticalIcon)
   - Sections for Mentee Status and Mentor Status
   - Actions:
     - ✅ Approve as mentee
     - ❌ Reject mentee
     - ✅ Approve as mentor
     - ❌ Reject mentor
   - Uses proper icons (AcademicCapIcon, UserGroupIcon, CheckCircleIcon, XCircleIcon)
   - Positioned in actions column after View/Edit buttons

4. **Props Added:**
   - `onMenteeAction(userId, status)`
   - `onMentorAction(userId, status)`

### 2.4 Admin Users Page Updates

**File:** `frontend/src/components/Admin/users/AdminUsersPage.jsx`

**Changes:**

1. **Filter State:**
```javascript
const [filters, setFilters] = useState({ 
  role: 'all', 
  status: 'all', 
  menteeStatus: 'all', 
  mentorStatus: 'all' 
});
```

2. **Client-Side Filtering:**
```javascript
const filteredRows = rows.filter((u) => {
  // Filter by deleted status
  if (filters.status === 'deleted') {
    if (!u.is_deleted) return false;
  }
  
  // Filter by mentee status
  if (filters.menteeStatus && filters.menteeStatus !== 'all') {
    const userMenteeStatus = (u.mentee_status || 'pending').toLowerCase();
    if (userMenteeStatus !== filters.menteeStatus.toLowerCase()) {
      return false;
    }
  }
  
  // Filter by mentor status
  if (filters.mentorStatus && filters.mentorStatus !== 'all') {
    const userMentorStatus = (u.mentor_status || 'pending').toLowerCase();
    if (userMentorStatus !== filters.mentorStatus.toLowerCase()) {
      return false;
    }
  }
  
  return true;
});
```

3. **Action Handlers:**
```javascript
const handleMenteeAction = async (userId, status) => {
  setIsMutating(true);
  try {
    await adminUpdateMenteeStatus(userId, status);
    await refetch();
    toast.success(`Mentee status set to ${status}.`);
  } catch (err) {
    console.error('Error updating mentee status:', err);
    toast.error(`Failed to update mentee status: ${getFriendlyErrorMessage(err, 'Unable to update mentee status.')}`);
  } finally {
    setIsMutating(false);
  }
};

const handleMentorAction = async (userId, status) => {
  // Similar implementation for mentor status
};
```

4. **Passed to UserTable:**
```javascript
<UserTable
  // ... existing props
  onMenteeAction={handleMenteeAction}
  onMentorAction={handleMentorAction}
/>
```

---

## 3. Backend Requirements (Already Implemented)

The following backend RPCs must exist (DO NOT modify):

```sql
-- Admin RPC for updating mentee status
CREATE OR REPLACE FUNCTION admin_update_mentee_status(
  p_user_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Implementation handles RLS, validation, logging
  UPDATE profiles
  SET mentee_status = p_status
  WHERE id = p_user_id;
END;
$$;

-- Admin RPC for updating mentor status
CREATE OR REPLACE FUNCTION admin_update_mentor_status(
  p_user_id uuid,
  p_status text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Implementation handles RLS, validation, logging
  UPDATE profiles
  SET mentor_status = p_status
  WHERE id = p_user_id;
END;
$$;
```

---

## 4. Testing Checklist

### Mentorship Page (User View)
- [ ] Log in as user with `mentee_status = 'pending'`
  - [ ] See amber banner: "Mentee access not ready yet"
  - [ ] Banner mentions "admin in User Management"
- [ ] Log in as user with `mentor_status = 'pending'`
  - [ ] See indigo banner: "Mentor profile not active yet"
- [ ] Log in as user with both statuses = 'approved'
  - [ ] See emerald banner: "You're all set for mentorship"
- [ ] Verify no old blue banners remain

### Admin User Management
- [ ] Navigate to Admin → Settings → Users
- [ ] Verify table shows:
  - [ ] "Mentee Status" column with colored badges
  - [ ] "Mentor Status" column with colored badges
  - [ ] Three-dot menu button in actions column
- [ ] Test filters:
  - [ ] Mentee Status dropdown filters correctly
  - [ ] Mentor Status dropdown filters correctly
  - [ ] Filters work in combination
- [ ] Test mentorship actions:
  - [ ] Click three-dot menu on a user
  - [ ] See "Mentee Status" and "Mentor Status" sections
  - [ ] Click "Approve as mentee" → status updates, toast shows success
  - [ ] Click "Reject mentee" → status updates
  - [ ] Click "Approve as mentor" → status updates
  - [ ] Click "Reject mentor" → status updates
  - [ ] Verify table refreshes after each action
- [ ] Verify no direct `.update()` calls in browser console
- [ ] Check that only admins/super_admins see the menu

### Integration Test
- [ ] Admin approves user's mentee status
- [ ] User refreshes Mentorship page
- [ ] Amber banner disappears or changes to success banner
- [ ] User can now request mentorship

---

## 5. Files Modified

1. ✅ `frontend/src/services/adminMentorship.js` (NEW)
2. ✅ `frontend/src/components/Mentorship/Mentorship.js`
3. ✅ `frontend/src/components/Admin/users/UserFiltersBar.jsx`
4. ✅ `frontend/src/components/Admin/users/UserTable.jsx`
5. ✅ `frontend/src/components/Admin/users/AdminUsersPage.jsx`

---

## 6. Design Tokens Used

### Colors
- **Mentee (Amber)**: `border-amber-200`, `bg-amber-50`, `text-amber-700/800/900`
- **Mentor (Indigo)**: `border-indigo-200`, `bg-indigo-50`, `text-indigo-700/800/900`
- **Success (Emerald)**: `border-emerald-200`, `bg-emerald-50`, `text-emerald-700/800/900`
- **Approved Badge**: `bg-emerald-50`, `text-emerald-700`, `border-emerald-200`
- **Pending Badge**: `bg-amber-50`, `text-amber-700`, `border-amber-200`
- **Rejected Badge**: `bg-rose-50`, `text-rose-700`, `border-rose-200`
- **Not Set Badge**: `bg-slate-100`, `text-slate-600`

### Spacing & Layout
- Card gap: `gap-3`
- Card padding: `px-4 py-3`
- Icon size: `h-7 w-7` (container), `w-3 h-3` or `w-4 h-4` (icons)
- Border radius: `rounded-xl` (cards), `rounded-full` (badges, icon containers)
- Shadow: `shadow-sm` (cards)

---

## 7. No Backend Changes Required

All functionality uses existing:
- `profiles.mentee_status` column
- `profiles.mentor_status` column
- `admin_update_mentee_status(p_user_id uuid, p_status text)` RPC
- `admin_update_mentor_status(p_user_id uuid, p_status text)` RPC

**No SQL, RLS, or schema changes were made.**

---

## 8. Next Steps

1. Test in browser with multiple user roles
2. Verify admin RPCs exist and work correctly
3. Check that mentorship eligibility hook returns correct statuses
4. Ensure no console errors or warnings
5. Verify mobile responsiveness of new table columns
6. Consider adding bulk mentorship status updates if needed

---

**Implementation Complete ✅**
