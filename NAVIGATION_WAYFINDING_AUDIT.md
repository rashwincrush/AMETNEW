# Navigation & Wayfinding Audit — AMET Alumni App

**Date:** 2025-10-02  
**Scope:** UI-only audit for Batches 3–6  
**Constraint:** No logic, routes, handlers, data fetching, props, APIs, RLS, or copy changes

---

## Executive Summary

This audit identifies **UI-only opportunities** to improve navigation clarity, wayfinding, responsive layouts, accessibility, and polish across all modules. All proposed changes are **styling/markup/ARIA only**—no behavioral modifications.

### Key Findings

1. **Navigation (Sidebar)** - Missing `aria-current="page"`, inconsistent 44px touch targets, no skip link
2. **Tabs** - Using Headless UI but missing proper ARIA attributes and ocean theme consistency
3. **Breadcrumbs** - Not implemented anywhere (opportunity for static markup)
4. **Pagination** - Inconsistent styling across 8+ components, no ARIA labels
5. **Loading States** - Mix of text "Loading..." and skeleton loaders; needs standardization
6. **Empty States** - Inconsistent icons, spacing, and CTA styling
7. **Responsive** - Inconsistent gutters (p-4 vs p-6 vs p-8), grid jumps (3→1 cols)
8. **Accessibility** - Missing landmarks, skip links, focus management, ARIA attributes
9. **Color Consistency** - 51 files still use `text-blue-*` instead of `text-ocean-*`

---

## Module-by-Module Findings

### 1. Layout Components

#### **Navigation.js** (`components/Layout/Navigation.js`)
**Current State:**
- Sidebar with logo, menu items, profile settings, admin settings, logout
- Uses `.nav-active` class for active state
- `isActive()` function checks pathname
- No `aria-current="page"` on active links
- No semantic `<nav>` wrapper with `aria-label`
- No skip link to main content

**UI-Only Opportunities:**
- Add `aria-current="page"` to active links
- Wrap menu in `<nav aria-label="Main navigation">`
- Add skip link at top: `<a href="#main-content" class="sr-only focus:not-sr-only">Skip to main content</a>`
- Ensure all links/buttons are 44×44px minimum
- Add `focus-visible:ring-ocean-500` to all interactive elements
- Normalize logout button to use ocean theme (currently red-700)

**Files to Change:**
- `components/Layout/Navigation.js`

---

#### **Header.js** (`components/Layout/Header.js`)
**Current State:**
- Top header with logo, animated tagline, notification bell, user menu
- User menu dropdown with profile/dashboard/logout
- No semantic `<header>` landmark
- Dropdown has no ARIA attributes for expanded state

**UI-Only Opportunities:**
- Wrap in `<header role="banner">`
- Add `aria-expanded` to user menu button
- Add `aria-label="User menu"` to dropdown
- Ensure notification bell is 44×44px
- Add `focus-visible:ring-ocean-500` to all buttons
- Normalize dropdown hover states to ocean theme

**Files to Change:**
- `components/Layout/Header.js`

---

### 2. Directory & Search

#### **AlumniDirectory.js** (`components/Directory/AlumniDirectory.js`)
**Current State:**
- Search bar, filters, view mode toggle (grid/list), pagination
- Uses custom pagination with prev/next buttons
- No ARIA labels on pagination controls
- Loading state: text "Loading..."
- Empty state: "No results found"

**UI-Only Opportunities:**
- Add `<nav aria-label="Pagination">` wrapper
- Add `aria-label="Go to previous page"` / `aria-label="Go to next page"`
- Add `aria-current="page"` to current page number
- Replace text loading with `<Skeleton>` components
- Standardize empty state with icon + ocean-themed CTA
- Ensure filter chips are 44×44px touch targets
- Add `role="search"` to search form
- Add `aria-live="polite"` to results count

**Files to Change:**
- `components/Directory/AlumniDirectory.js`
- `components/Directory/AlumniCard.js` (if needed for consistency)
- `components/Directory/AlumniListItem.js` (if needed)

---

### 3. Events

#### **Events.js** (`components/Events/Events.js`)
**Current State:**
- Filter tabs for status (upcoming/past/all) and event type
- Search bar, view mode toggle, pagination
- Custom filter chips for event type
- No `role="tablist"` or tab ARIA attributes
- Pagination similar to directory (no ARIA)

**UI-Only Opportunities:**
- Add tab ARIA: `role="tablist"`, `role="tab"`, `aria-selected="true/false"`
- Style active tab with ocean gradient bottom border
- Add `aria-controls` linking tabs to content panel
- Standardize pagination with ARIA labels
- Replace text loading with skeleton cards
- Normalize filter chip colors to ocean theme
- Add `aria-live="polite"` to event count

**Files to Change:**
- `components/Events/Events.js`
- `components/Events/EventCard.js` (if needed)

---

### 4. Jobs Portal

#### **JobListingsPage.js** (`components/Jobs/JobListingsPage.js`)
**Current State:**
- Extensive filters (job type, department, experience, location, industry, salary, posted within)
- Search bar, view mode toggle, pagination
- Uses `CircularProgress` from MUI (inconsistent with rest of app)
- Filter sidebar with multiple select dropdowns
- No ARIA labels on filters

**UI-Only Opportunities:**
- Replace MUI `CircularProgress` with ocean-themed skeleton loaders
- Add `role="search"` to search form
- Add `aria-label` to all filter selects
- Standardize pagination with ARIA
- Add `aria-live="polite"` to job count
- Ensure filter dropdowns are 44×44px minimum height
- Add ocean focus rings to all selects
- Normalize "Post a Job" button to ocean gradient

**Files to Change:**
- `components/Jobs/JobListingsPage.js`
- `components/Jobs/JobCard.js` (if needed)

---

### 5. Mentorship

#### **Mentorship.js** (`components/Mentorship/Mentorship.js`)
**Current State:**
- Search bar, availability toggle filter
- Grid of mentor cards
- Loading state: text "Loading..."
- Empty state: "No mentors found"

**UI-Only Opportunities:**
- Replace text loading with skeleton cards
- Standardize empty state with icon + ocean CTA
- Add `role="search"` to search form
- Add `aria-live="polite"` to mentor count
- Ensure availability toggle is 44×44px
- Add ocean focus rings to search input

**Files to Change:**
- `components/Mentorship/Mentorship.js`
- `components/Mentorship/MentorCard.js` (if needed)

---

### 6. Admin Panel

#### **AdminSettings.js** (`components/Admin/AdminSettings.js`)
**Current State:**
- Uses Headless UI `<Tab>` component
- Tabs for: User Management, Content Approval, Reports, System Administration
- No visible active tab indicator (relies on Headless UI default)
- No ocean theme styling on tabs

**UI-Only Opportunities:**
- Style active tab with ocean gradient bottom border
- Add ocean hover states to inactive tabs
- Ensure tab buttons are 44×44px minimum height
- Add `focus-visible:ring-ocean-500` to all tabs
- Normalize tab panel padding consistently

**Files to Change:**
- `components/Admin/AdminSettings.js`

---

#### **MentorsTab.jsx** (`components/Admin/MentorsTab.jsx`)
**Current State:**
- Status filter dropdown (pending/approved/rejected/all)
- Search input, CSV export button
- Pagination with prev/next/page number
- Table with mentor data
- Loading: text "Loading..."
- Empty: "No mentor applications..."

**UI-Only Opportunities:**
- Add `<nav aria-label="Pagination">` wrapper
- Add ARIA labels to prev/next buttons
- Add `aria-current="page"` to page number
- Replace text loading with skeleton table rows
- Standardize empty state with icon
- Ensure all buttons are 44×44px
- Add ocean focus rings to select/input

**Files to Change:**
- `components/Admin/MentorsTab.jsx`

---

### 7. Messages

#### **MessagingSystem.js** (`components/Messages/MessagingSystem.js`)
**Current State:**
- Two-panel layout: conversation list + chat window
- No breadcrumbs or back button for mobile
- Loading states: text "Loading..."

**UI-Only Opportunities:**
- Add responsive mobile pattern: show list OR chat, not both
- Add back button on mobile (presentational only, uses existing navigation)
- Replace text loading with skeleton conversation items
- Add `aria-label="Conversations"` to list panel
- Add `aria-label="Chat messages"` to chat panel
- Ensure all interactive elements are 44×44px

**Files to Change:**
- `components/Messages/MessagingSystem.js`
- `components/Messages/ConversationList.js` (if needed)
- `components/Messages/ChatWindow.js` (if needed)

---

### 8. Dashboard

#### **AlumniDashboard.js** (`components/Dashboard/AlumniDashboard.js`)
**Current State:**
- Stat cards, groups section, recent activity, upcoming events, job opportunities
- Skeleton loaders already use ocean theme (from Batch 1)
- "View all" links use ocean-600 (from Batch 1)
- No `<main>` landmark

**UI-Only Opportunities:**
- Wrap main content in `<main id="main-content">`
- Add `aria-label` to each section (e.g., "Recent Activity", "Upcoming Events")
- Ensure consistent padding across sections
- Add `role="status"` to activity feed container
- Add `aria-live="polite"` to activity feed

**Files to Change:**
- `components/Dashboard/AlumniDashboard.js`

---

## Cross-Cutting Concerns

### 1. **Pagination Pattern** (8+ files)
**Current State:**
- Inconsistent implementations across Directory, Events, Jobs, Admin tabs
- No ARIA labels
- No `aria-current="page"`
- Inconsistent button styling

**Standardized Pattern (UI-only):**
```jsx
<nav aria-label="Pagination" className="flex items-center justify-center gap-2 mt-6">
  <button
    onClick={handlePrev}
    disabled={currentPage === 1}
    aria-label="Go to previous page"
    className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg border-2 border-ocean-300 text-ocean-700 hover:bg-ocean-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
  >
    Previous
  </button>
  
  <span aria-current="page" className="min-h-[44px] px-4 py-2 rounded-lg bg-ocean-600 text-white font-medium">
    Page {currentPage}
  </span>
  
  <button
    onClick={handleNext}
    disabled={currentPage === totalPages}
    aria-label="Go to next page"
    className="min-h-[44px] min-w-[44px] px-4 py-2 rounded-lg border-2 border-ocean-300 text-ocean-700 hover:bg-ocean-50 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
  >
    Next
  </button>
</nav>
```

**Files to Change:**
- `components/Directory/AlumniDirectory.js`
- `components/Events/Events.js`
- `components/Jobs/JobListingsPage.js`
- `components/Admin/MentorsTab.jsx`
- `components/Admin/UserManagement.js`
- `components/Admin/ContentApproval.js`
- `components/Notifications/NotificationsPage.js`
- Any other paginated lists

---

### 2. **Loading States** (120+ files)
**Current State:**
- Mix of text "Loading...", MUI `CircularProgress`, custom spinners
- Inconsistent with Batch 1 skeleton loaders

**Standardized Pattern (UI-only):**
```jsx
// For lists/grids
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {[...Array(6)].map((_, i) => (
    <Skeleton key={i} className="h-48 w-full" />
  ))}
</div>

// For text content
<div className="space-y-3">
  <Skeleton className="h-4 w-3/4" />
  <Skeleton className="h-4 w-full" />
  <Skeleton className="h-4 w-5/6" />
</div>
```

**Files to Change:**
- Replace all `"Loading..."` text with `<Skeleton>` components
- Remove MUI `CircularProgress` imports
- Use existing `Skeleton` component from `components/ui/skeleton.jsx`

---

### 3. **Empty States** (50+ files)
**Current State:**
- Inconsistent messaging, no icons, plain text
- No CTAs or inconsistent CTA styling

**Standardized Pattern (UI-only):**
```jsx
<div className="text-center py-12">
  <div className="w-16 h-16 bg-ocean-50 rounded-full flex items-center justify-center mx-auto mb-4">
    <IconComponent className="w-8 h-8 text-ocean-600" />
  </div>
  <h3 className="text-lg font-semibold text-gray-900 mb-2">
    {title}
  </h3>
  <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
    {description}
  </p>
  {ctaLink && (
    <Link
      to={ctaLink}
      className="inline-flex items-center justify-center min-h-[44px] px-6 py-2 rounded-lg bg-gradient-to-b from-ocean-500 to-ocean-600 text-white hover:from-ocean-600 hover:to-ocean-700 focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2"
    >
      {ctaText}
    </Link>
  )}
</div>
```

**Files to Change:**
- All components with "No results", "No data", "Empty" states
- Use appropriate Heroicons for each context

---

### 4. **Tab Pattern** (Headless UI)
**Current State:**
- AdminSettings uses Headless UI `<Tab>` but lacks ocean styling
- No visible active indicator

**Standardized Pattern (UI-only):**
```jsx
<Tab.Group>
  <Tab.List className="flex space-x-1 rounded-lg bg-ocean-50 p-1">
    <Tab className={({ selected }) =>
      cn(
        "w-full rounded-lg py-2.5 text-sm font-medium leading-5 min-h-[44px]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2",
        selected
          ? "bg-white text-ocean-700 shadow border-b-2 border-ocean-600"
          : "text-gray-700 hover:bg-white/50 hover:text-ocean-700"
      )
    }>
      Tab Label
    </Tab>
  </Tab.List>
  <Tab.Panels className="mt-6">
    <Tab.Panel className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500">
      {/* Content */}
    </Tab.Panel>
  </Tab.Panels>
</Tab.Group>
```

**Files to Change:**
- `components/Admin/AdminSettings.js`
- Any other components using Headless UI tabs

---

### 5. **Responsive Gutters**
**Current State:**
- Inconsistent: some pages use `p-4`, others `p-6`, others `p-8`
- No consistent breakpoint ramp

**Standardized Pattern (UI-only):**
```jsx
// Page wrapper
<div className="p-4 md:p-6 lg:p-8 min-h-screen bg-gray-50">
  <div className="max-w-7xl mx-auto">
    {/* Content */}
  </div>
</div>

// Card/section spacing
<div className="space-y-6"> {/* Consistent 24px gap */}
  <section>...</section>
  <section>...</section>
</div>
```

**Files to Change:**
- All page-level components
- Normalize to `p-4 md:p-6 lg:p-8`

---

### 6. **Grid Responsiveness**
**Current State:**
- Some grids jump from 3 columns to 1 (no 2-column tablet breakpoint)

**Standardized Pattern (UI-only):**
```jsx
// For cards
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">

// For stat cards
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">

// For two-column layouts
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
```

**Files to Change:**
- All components with grid layouts
- Ensure smooth breakpoint transitions

---

### 7. **Table Overflow**
**Current State:**
- Tables can overflow on mobile, causing horizontal scroll
- No visual indicator of scrollable content

**Standardized Pattern (UI-only):**
```jsx
<div className="overflow-x-auto border border-ocean-100 rounded-lg shadow-sm">
  <table className="min-w-full divide-y divide-gray-200">
    {/* Table content */}
  </table>
</div>

/* Optional: Add fade edge hint */
.table-wrapper {
  position: relative;
}
.table-wrapper::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 40px;
  background: linear-gradient(to left, rgba(255,255,255,1), rgba(255,255,255,0));
  pointer-events: none;
}
```

**Files to Change:**
- All components with tables (Admin panels, Job applications, etc.)

---

### 8. **Color Normalization** (51 files)
**Current State:**
- 51 files still use `text-blue-*` instead of `text-ocean-*`

**Find/Replace (UI-only):**
```
text-blue-50 → text-ocean-50
text-blue-100 → text-ocean-100
text-blue-200 → text-ocean-200
text-blue-300 → text-ocean-300
text-blue-400 → text-ocean-400
text-blue-500 → text-ocean-500
text-blue-600 → text-ocean-600
text-blue-700 → text-ocean-700
text-blue-800 → text-ocean-800
text-blue-900 → text-ocean-900

bg-blue-* → bg-ocean-*
border-blue-* → border-ocean-*
ring-blue-* → ring-ocean-*
```

**Files to Change:**
- `components/Landing/HomePage.js` (25 matches)
- `components/Auth/EnhancedRegister.js` (6 matches)
- `components/Groups/GroupDetail.js` (6 matches)
- And 48 more (see grep results)

---

## Accessibility Gaps

### 1. **Landmarks**
**Missing:**
- `<header role="banner">` in Header.js
- `<nav aria-label="Main navigation">` in Navigation.js
- `<main id="main-content">` in all page components
- `<aside>` for sidebars/filters
- `<footer>` (if applicable)

**Action:** Add semantic HTML5 landmarks to all layout components

---

### 2. **Skip Links**
**Missing:** No skip link to main content

**Action:** Add to Navigation.js:
```jsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-ocean-600 focus:text-white focus:rounded-lg focus:shadow-lg"
>
  Skip to main content
</a>
```

---

### 3. **Form Labels**
**Current State:** Most forms have labels, but some are missing `htmlFor`/`id` connections

**Action:** Audit all forms and ensure:
- Every `<input>` has a corresponding `<label htmlFor="...">`
- Every `<input id="...">` matches label's `htmlFor`
- Error messages use `aria-describedby`
- Invalid inputs have `aria-invalid="true"`

---

### 4. **Live Regions**
**Missing:** No `aria-live` regions for dynamic content updates

**Action:** Add to:
- Search result counts: `<div aria-live="polite">{count} results</div>`
- Form submission status: `<div role="status" aria-live="polite">{message}</div>`
- Loading indicators: `<div role="status" aria-live="polite">Loading...</div>`

---

### 5. **Focus Management**
**Current State:** Focus rings added in Batch 1, but some elements still missing

**Action:** Ensure all interactive elements have:
- `focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2`
- Minimum 44×44px touch targets
- Visible focus indicator on all states

---

## Batched Implementation Plan

### **Batch 3: Navigation & Wayfinding** (UI-only)

**Goal:** Clarify "where I am / what's clickable / what's next"

**Changes:**
1. **Sidebar Navigation** (`Navigation.js`)
   - Add `<nav aria-label="Main navigation">` wrapper
   - Add `aria-current="page"` to active links
   - Add skip link to main content
   - Ensure 44×44px touch targets
   - Normalize logout button to ocean theme

2. **Header** (`Header.js`)
   - Wrap in `<header role="banner">`
   - Add `aria-expanded` to user menu button
   - Add `aria-label="User menu"` to dropdown
   - Ensure notification bell is 44×44px

3. **Tabs** (`AdminSettings.js`, others)
   - Style active tab with ocean gradient bottom border
   - Add proper ARIA: `role="tablist"`, `role="tab"`, `aria-selected`
   - Add `aria-controls` linking tabs to panels
   - Ensure 44×44px minimum height

4. **Pagination** (8+ files)
   - Add `<nav aria-label="Pagination">` wrapper
   - Add `aria-label` to prev/next buttons
   - Add `aria-current="page"` to current page
   - Style current page as filled ocean pill
   - Style prev/next as outline buttons

5. **Loading States** (120+ files)
   - Replace all text "Loading..." with `<Skeleton>` components
   - Remove MUI `CircularProgress`
   - Use ocean-themed skeletons consistently

6. **Empty States** (50+ files)
   - Add icon in ocean-50 circle
   - Standardize spacing and typography
   - Add ocean-themed CTAs where applicable

**Files to Change (Batch 3):**
- `components/Layout/Navigation.js`
- `components/Layout/Header.js`
- `components/Admin/AdminSettings.js`
- `components/Directory/AlumniDirectory.js`
- `components/Events/Events.js`
- `components/Jobs/JobListingsPage.js`
- `components/Admin/MentorsTab.jsx`
- `components/Admin/UserManagement.js`
- `components/Admin/ContentApproval.js`
- `components/Notifications/NotificationsPage.js`
- All components with loading/empty states (phased approach)

**Deliverables:**
- Screenshots at 360/768/1024/1280
- Axe/Lighthouse checks
- Manual tab navigation test
- PR with "UI-only" declaration

---

### **Batch 4: Responsive & Mobile Fit/Finish** (UI-only)

**Goal:** Consistent gutters, smooth breakpoint ramps, no clipped content

**Changes:**
1. **Page Gutters**
   - Normalize all pages to `p-4 md:p-6 lg:p-8`
   - Add `max-w-7xl mx-auto` containers

2. **Grid Responsiveness**
   - Ensure `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (no jumps)
   - Stat cards: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
   - Two-column: `grid-cols-1 lg:grid-cols-2`

3. **Table Overflow**
   - Wrap all tables in `overflow-x-auto` containers
   - Add ocean border and rounded corners
   - Optional: Add fade edge hint

4. **Mobile Patterns**
   - Messages: Show list OR chat on mobile, not both
   - Filters: Collapsible on mobile (style only, existing logic)
   - Ensure all buttons/inputs are 44×44px minimum

5. **Shadow Clipping**
   - Audit all hover shadows
   - Ensure parent containers don't clip with `overflow-hidden`

**Files to Change (Batch 4):**
- All page-level components (normalize gutters)
- All grid layouts (smooth breakpoints)
- All table components (overflow wrappers)
- `components/Messages/MessagingSystem.js` (mobile layout)
- `components/Directory/AlumniDirectory.js` (filter panel)
- `components/Jobs/JobListingsPage.js` (filter sidebar)

**Deliverables:**
- Screenshots at 360/768/1024/1280
- No horizontal scroll at any breakpoint
- All touch targets ≥44×44px
- PR with "UI-only" declaration

---

### **Batch 5: Accessibility & WCAG AA** (UI-only)

**Goal:** Contrast, focus, semantics, labels—no new behavior

**Changes:**
1. **Landmarks**
   - Add `<header role="banner">` to Header.js
   - Add `<nav aria-label="Main navigation">` to Navigation.js
   - Add `<main id="main-content">` to all pages
   - Add `<aside>` to filter sidebars
   - Add skip link to Navigation.js

2. **Form Accessibility**
   - Audit all forms for `label[for]` + `input[id]` connections
   - Add `aria-invalid="true"` to error inputs
   - Add `aria-describedby` linking errors to inputs
   - Ensure all required fields have visual indicator

3. **Live Regions**
   - Add `aria-live="polite"` to search result counts
   - Add `role="status"` to existing status containers
   - Add `aria-live="polite"` to form submission messages

4. **Focus Management**
   - Audit all interactive elements for focus rings
   - Ensure tab order is logical (no traps)
   - Add `focus-visible:ring-ocean-500` where missing

5. **Color Contrast**
   - Replace all `text-blue-*` with `text-ocean-*` (51 files)
   - Audit placeholder text (ensure `text-gray-500` minimum)
   - Verify all text passes WCAG AA (4.5:1 ratio)

6. **Reduced Motion**
   - Already added in Batch 1 (`App.css`)
   - Verify all animations respect `prefers-reduced-motion`

**Files to Change (Batch 5):**
- `components/Layout/Navigation.js` (skip link, landmarks)
- `components/Layout/Header.js` (header landmark)
- All page components (main landmark)
- All form components (labels, ARIA)
- 51 files with `text-blue-*` (color normalization)
- All components with dynamic content (live regions)

**Deliverables:**
- Lighthouse accessibility score ≥90
- Axe DevTools: 0 violations
- Manual screen reader test (VoiceOver/NVDA)
- Manual keyboard navigation test
- PR with "UI-only" declaration

---

### **Batch 6: Polish & Micro-interactions** (UI-only)

**Goal:** Tasteful motion/feedback that respects reduced-motion users

**Changes:**
1. **Transition Standardization**
   - Audit all transitions
   - Normalize to `transition-[colors,opacity,transform] duration-200 ease-out`
   - Ensure all respect `prefers-reduced-motion`

2. **Card Hover Effects**
   - Standardize to `hover:shadow-md` (already in Card component)
   - Add subtle `hover:-translate-y-1` where appropriate
   - Ensure no layout shift

3. **Image Consistency**
   - Add `object-cover` to all avatars/images
   - Ensure consistent border-radius (`rounded-full` for avatars, `rounded-lg` for images)
   - Add loading states for images

4. **Badge/Label Harmonization**
   - Audit all badges for ocean theme consistency
   - Use Badge component variants (default, success, warning, destructive)
   - Ensure consistent sizing and spacing

5. **Tooltip Wrappers**
   - Audit existing tooltips (presentational only)
   - Ensure consistent styling with ocean theme
   - Add `role="tooltip"` where applicable

6. **Button Consistency**
   - Audit all custom buttons (not using Button component)
   - Migrate to Button component where possible
   - Ensure consistent hover/active states

**Files to Change (Batch 6):**
- All components with custom transitions
- All card components (hover effects)
- All image/avatar components (object-cover, radius)
- All badge/label components (color harmonization)
- All tooltip components (styling)
- All custom button implementations

**Deliverables:**
- Smooth, consistent micro-interactions
- No jarring animations
- Respects reduced-motion preferences
- PR with "UI-only" declaration

---

## File Change Summary

### Batch 3 (Navigation & Wayfinding)
**Estimated Files:** 15-20
- Layout: 2 files
- Admin: 4 files
- Directory: 1 file
- Events: 1 file
- Jobs: 1 file
- Notifications: 1 file
- Loading/Empty states: 5-10 files (phased)

### Batch 4 (Responsive & Mobile)
**Estimated Files:** 30-40
- All page-level components (gutters)
- All grid layouts (breakpoints)
- All table components (overflow)
- Messages (mobile layout)
- Filters (mobile patterns)

### Batch 5 (Accessibility)
**Estimated Files:** 60-70
- Layout: 2 files (landmarks)
- All page components (main landmark)
- All form components (labels, ARIA)
- 51 files (color normalization)
- All dynamic content (live regions)

### Batch 6 (Polish)
**Estimated Files:** 40-50
- All components with transitions
- All card components
- All image/avatar components
- All badge/label components
- All tooltip components
- All custom buttons

**Total Estimated Files:** 145-180 (many files touched in multiple batches)

---

## Acceptance Criteria (All Batches)

### Per-Batch Criteria
- ✅ Zero content/logic/API/route diffs
- ✅ Visible focus rings on all interactive elements
- ✅ Tab order unchanged and logical
- ✅ All touch targets ≥44×44px
- ✅ WCAG AA for text/controls in all states
- ✅ Responsive at 360/768/1024/1280 with no overflow
- ✅ Screenshots at 4 breakpoints + Axe/Lighthouse checks
- ✅ PR includes "UI-only" declaration

### Batch-Specific Criteria

**Batch 3:**
- ✅ `aria-current="page"` on all active nav links
- ✅ Pagination has ARIA labels and current page indicator
- ✅ All loading states use Skeleton components
- ✅ All empty states have icons and consistent styling

**Batch 4:**
- ✅ All pages use `p-4 md:p-6 lg:p-8` gutters
- ✅ All grids have smooth breakpoint transitions (no 3→1 jumps)
- ✅ All tables wrapped in `overflow-x-auto`
- ✅ No horizontal scroll at any breakpoint

**Batch 5:**
- ✅ Skip link present and functional
- ✅ All landmarks present (header, nav, main, aside)
- ✅ All forms have proper labels and ARIA
- ✅ Lighthouse accessibility score ≥90
- ✅ Axe DevTools: 0 violations
- ✅ All `text-blue-*` replaced with `text-ocean-*`

**Batch 6:**
- ✅ All transitions respect `prefers-reduced-motion`
- ✅ Card hover effects consistent
- ✅ All images use `object-cover` and consistent radius
- ✅ All badges use ocean theme colors
- ✅ No custom buttons (all use Button component)

---

## Risk Mitigation

### Low-Risk Changes (Safe to proceed)
- Adding ARIA attributes
- Adding CSS classes
- Replacing text with Skeleton components
- Normalizing colors (text-blue → text-ocean)
- Adding landmarks
- Wrapping elements in semantic HTML

### Medium-Risk Changes (Verify carefully)
- Changing grid breakpoints (could affect layout)
- Adding overflow wrappers (could clip content)
- Changing padding/spacing (could affect alignment)

### High-Risk Changes (Flag and skip)
- Any change that might affect behavior
- Any change to component props
- Any change to event handlers
- Any change to data fetching

### Revert Strategy
- Small, atomic commits per module
- Before/after screenshots for each change
- Test immediately after each commit
- Revert individual commits if issues arise

---

## Testing Protocol (Per Batch)

### Manual Testing
1. **Visual Inspection**
   - Open all changed pages
   - Verify styling matches design intent
   - Check for layout shifts or clipping

2. **Keyboard Navigation**
   - Tab through all interactive elements
   - Verify focus rings visible
   - Ensure no focus traps

3. **Responsive Testing**
   - Test at 360px, 768px, 1024px, 1280px
   - Verify no horizontal scroll
   - Check touch target sizes

4. **Screen Reader Testing** (Batch 5 only)
   - VoiceOver (macOS) or NVDA (Windows)
   - Verify landmarks announced
   - Verify form labels read correctly

### Automated Testing
1. **Lighthouse**
   - Run accessibility audit
   - Target score ≥90
   - Fix any violations

2. **Axe DevTools**
   - Run on all changed pages
   - Target: 0 violations
   - Fix any critical/serious issues

3. **Visual Regression** (if available)
   - Compare before/after screenshots
   - Verify no unintended changes

---

## Conclusion

This audit identifies **145-180 files** requiring UI-only changes across **4 batches**. All changes are **styling/markup/ARIA only**—no behavioral modifications.

### Next Steps

1. **Review this audit** for accuracy and completeness
2. **Approve or request modifications** to the plan
3. **Upon approval**, I will proceed with:
   - Batch 3: Navigation & Wayfinding
   - Batch 4: Responsive & Mobile Fit/Finish
   - Batch 5: Accessibility & WCAG AA
   - Batch 6: Polish & Micro-interactions

### Approval Required

**To proceed, please respond with:**
```
APPROVED: PROCEED BATCHES 3–6
```

Or request modifications to the plan.

---

**End of Audit**
