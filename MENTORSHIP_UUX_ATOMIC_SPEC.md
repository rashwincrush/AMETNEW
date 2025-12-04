# 🏆 MENTORSHIP MODULE — UUX-∞ ATOMIC EDITION SPEC

**Status:** Ready for Implementation  
**Target:** Frontend-only improvements (no database changes)  
**Framework:** React + Tailwind CSS  
**Accessibility:** WCAG 2.2 AA minimum

---

## 0. ATOMIC EXECUTIVE SUMMARY

1. **Atomic Problem**  
   Alumni + students can't instantly see *what to do next* in mentorship: become a mentor, fix profile, manage capacity, or follow up on relationships.

2. **Primary Persona Cluster**  
   - Mentee Novice (desktop, 4G)  
   - Alumni Mobile‑Thumb (becoming mentor)  
   - ADHD / Distracted user jumping between tabs

3. **Cognitive Load Score (1–10)**  
   ~6/10 on My Mentorship (multiple sections, statuses, roles), ~5/10 on Find Mentors; within safe but not "effortless".

4. **Success Atomic Definition**  
   - Mentee: sends a request to a suitable mentor and sees it reflected in *My Requests / My Mentorship*.  
   - Mentor: completes mentor profile, sets capacity/availability, and sees mentees listed in My Mentorship.

5. **Design Atomic Principles (3)**  
   - One clear **primary CTA per screen** (request, become mentor, edit details).  
   - **Role clarity first** (am I mentee/mentor/both and what's my status?).  
   - **Status‑driven UI** (views+RPCs decide all labels/buttons).

6. **Interaction Atomic Model**  
   - Primary: mouse/keyboard desktop, tap on mobile.  
   - Secondary: keyboard‑only (tab orders, focus rings) for forms and tabs.

7. **Visual Atomic Language**  
   - Brand: blue/indigo "trust/academic" palette, rounded cards, soft shadows.  
   - Tone: supportive + structured (program dashboard, not chatty app).

8. **Accessibility Atomic Target**  
   - Aim for **WCAG 2.2 AA** immediately (contrast, focus, keyboard), with a path to AAA for key flows (forms, status banner).

9. **Performance Atomic Metrics (Targets)**  
   - Mentorship pages: FCP < 1.5s on 4G; list renders without jank at 60fps; skeletons for mentors/relationships when load > 300ms.

10. **Risk Atomic Mitigation (Top 3)**  
   - Confusion about **where to become a mentor / edit mentor profile** → consolidate CTAs & copy.  
   - Cognitive overload in **My Mentorship** (two roles, many sections) → stronger grouping & headings.  
   - Status mismatch between UI and DB views → keep all buttons strictly tied to view+RPC fields.

---

## 1. HIGH-IMPACT GAPS & FRONTEND FIXES

### G1. Role & Mode Confusion (Mentee vs Mentor)

**What's happening now**

Same layout handles mentee approvals, mentor statuses, and profile completion, largely through one `MentorshipStatusBanner`.

CTA like "Edit mentorship details" → `/mentorship/become-mentor` is shown in a mentee gating path (based on `is_mentee_approved`), which can feel conceptually weird.

**Fix it like this**

Explicitly separate tracks in the UI:

**Track A: As a Mentee**
- Surfaces:
  - `FindMentorsPage.jsx`
  - `MyRequestsPage.jsx`
  - "People mentoring you" in `MyMentorshipPage.jsx`
- Status source: `profile.is_mentee_approved`.

**Track B: As a Mentor**
- Surfaces:
  - `RequestsToMePage.jsx`
  - "People you mentor" in `MyMentorshipPage.jsx`
  - `MentorRegistrationForm.js`
- Status source: `mentorRow.status`, capacity, availability.

**In `MentorshipStatusBanner` / `getMentorshipStatusMessage`:**

Return two messages:

```js
// rough shape
{
  mentee: { type, title, body, ctaLabel, ctaHref } | null,
  mentor: { type, title, body, ctaLabel, ctaHref } | null,
}
```

**Rendering rule:**
- On Find Mentors / My Requests → show mentee message first; show mentor message only if relevant and short.
- On Requests to Me / My Mentorship → show mentor message first.

**Fix the CTA confusion:**

For mentee gating (`profile && !profile.is_mentee_approved`):
- CTA:
  - Label: `Complete student profile`
  - URL: `/profile`

For mentor application editing (`mentorRow` exists, status pending or rejected):
- CTA:
  - Label: `Review mentor application` or `Edit mentor profile`
  - URL: `/mentorship/become-mentor`

---

### G2. Banner Is Doing Too Much (Cognitive Atomics)

**Problem**

One banner is trying to talk about: profile completion, mentee approval, mentor approval, mentor capacity, availability and why requests are blocked.

That's like 5–6 concepts in a single chunk = heavy cognitive load.

**Frontend changes**

Restrict each banner to one mental job:

1. **Setup banner (Mentee)**
   - Title: "Before you can request mentors"
   - Explains profile completion + mentee approval.

2. **Mentor status banner**
   - Title: "Your mentor profile status"
   - Explains pending/approved/rejected only.

Move capacity messaging out of the generic banner and into:
- `MyMentorshipPage` header (for the logged-in mentor).
- `MentorCapacityPill` on mentor cards (see next gap).

---

### G3. Capacity & Availability Inconsistent Across Surfaces

**Problem**

Capacity logic is correct, but fragmented:
- Progress bar + toggle on `MyMentorship`.
- "At capacity" logic on `FindMentors` cards.
- Capacity checks on `RequestsToMe` Accept flow.

Users don't visually recognize this as the same concept.

**Frontend pattern**

Create a single reusable component, e.g.:

```jsx
<MentorCapacityPill
  current={current_mentees_count}
  max={max_mentees}
  isAvailable={is_available_for_mentorship}
/>
```

**Behavior:**

States:
- "Accepting mentees (2/5)"
- "At capacity (5/5)"
- "Not accepting new mentees"

**Visual style:**
- Same shape, font size, and optional icon everywhere.
- Color is just reinforcement; text is the primary meaning.

**Use it in:**
- `FindMentorsPage.jsx` mentor cards.
- `MyMentorshipPage.jsx` mentor header section.
- `RequestsToMePage.jsx` (a small note near the Accept button).

---

### G4. Tab Labels & Mental Model

**Problem**

"My Requests" vs "Requests to Me" is mentally heavier than needed, especially on mobile.

"My Mentorships" doesn't immediately scream "Active + Past mentors and mentees."

**Fix the tab IA**

In `MentorshipTabs.jsx`, rename tabs to reduce parsing time:

- Find Mentors → keep.
- My Requests → **"Requests I Sent"**.
- Requests to Me → **"Requests I Received"**.
- My Mentorships → **"My Mentors & Mentees"** or **"Active Mentorships"**.

**Add micro-descriptions at top of each page:**

- `MyRequestsPage`: "Requests you've sent to mentors, grouped by status."
- `RequestsToMePage`: "Requests from mentees asking you to be their mentor."

**Make sure tabs are fully accessible:**
- `role="tablist"`, `role="tab"`, `aria-selected`, `tabIndex`, and arrow-key navigation.

---

### G5. My Mentorship Page – Structure & Empty States

**What's good**

It's now a proper "hub": role state + relationships in both directions. Great.

**What's missing**

Clear empty-state UX and small explanation text.

**Frontend improvements**

In `MyMentorshipPage.jsx`:

**For "People mentoring you":**

Add a small caption under the heading:
- "These are mentors currently supporting you."

If `activeMentors.length === 0`:
- Show an empty-card:
  - Title: "No active mentors yet."
  - Body: "Once a mentor accepts your request, they will appear here."
  - CTA: "Find a mentor" → `/mentorship/find`.

**For "People you mentor":**

Caption: "These are mentees you've accepted to mentor."

If `activeMentees.length === 0` and `mentorData?.status === 'approved'`:
- Empty card:
  - Title: "You're not mentoring anyone yet."
  - Body: "Once you accept a mentorship request, your mentees will show up here."
  - CTA: "View requests" → `/mentorship/requests-to-me`.

**Standardize relationship cards:**
- Avatar, name, since date ("Since Aug 2025"), status pill (using `getRelationshipStatusUI`).
- Primary CTA: "Go to chat" (always same label).
- Secondary: "View mentor" / "View mentee profile".

---

### G6. MentorRegistrationForm – Chunking & Status Context

**Problem**

All the right fields exist, but it feels like one long undifferentiated form.

**UI restructuring**

In `MentorRegistrationForm.js`:

**Add top status strip if `mentorRow` exists:**
- "Mentor status: Pending review / Approved / Application rejected."
- Optional link: "View how this appears to mentees".

**Break form into 3 sections with headings:**

**Section 1 – Your Capacity**
- `mentoring_capacity_hours_per_month`
- `max_mentees`
- Helper: "You can change this anytime from your Mentorship hub."

**Section 2 – Your Expertise & Experience**
- `expertise_tags`
- `mentoring_experience_years`
- `mentoring_statement`
- Optional `experience_description`

**Section 3 – How You Prefer to Mentor**
- `mentoring_preferences` (communication, format, duration)

**UX details:**
- Keep "Back to Mentorship Hub" but route it to `/mentorship/me` (since that's the real hub now).
- Change hero title based on mode:
  - No `mentorRow`: "Become a Mentor"
  - Existing `mentorRow`: "Edit Mentor Profile"

---

### G7. Disabled Buttons Without Clear Explanation

**Problem**

Button logic is smart (capacity/availability/existing requests) but a disabled button with just "At capacity" can still feel like a dead end.

**Frontend UX tweaks**

**On `FindMentorsPage.jsx`:**

For disabled states, add explicit helper text below the button, e.g.:
- "This mentor is currently at capacity."
- "You already have a pending request with this mentor."
- "You must complete your student profile before requesting mentors."

Desktop: optional tooltip on hover for extra context.

**Make sure button labels are always verbs:**
- "Request mentorship", "At capacity", "Already requested".

**On `MyRequestsPage.jsx` & `RequestsToMePage.jsx`:**

Add loading states on actions:
- Accept → "Accepting…" while RPC in-flight.
- Decline → "Declining…"
- Cancel request → "Cancelling…"

---

### G8. Accessibility & Motion Quick Wins

**Frontend changes**

**Tabs:**
- Implement proper ARIA + keyboard navigation.

**Banners:**
- Use `role="status"` for informational, `role="alert"` for blocking issues.
- Ensure banner text includes the reason and the action.

**Cards:**
- Use `<ul>` / `<li>` for lists of relationships/mentors; or `<section>` / `<article>` semantics.
- Buttons: "Go to chat" → `aria-label="Open chat with [Name]"`.

**Motion:**
- If you later add transitions (tab change, card in/out), wrap them with a `prefers-reduced-motion` check.

---

## 2. FILE-BY-FILE TODO CHECKLIST

Copy-paste this into your IDE or task tracker:

### `frontend/src/components/Mentorship/MentorshipLayout.jsx`

- [ ] Add one-line description under "Mentorship Program" header
- [ ] Render mentee + mentor banners separately, with order based on current route
- [ ] Ensure proper semantic HTML structure

### `frontend/src/components/Mentorship/MentorshipTabs.jsx`

- [ ] Rename tabs to: "Find Mentors / Requests I Sent / Requests I Received / My Mentors & Mentees"
- [ ] Add ARIA roles: `role="tablist"`, `role="tab"`, `aria-selected`
- [ ] Implement keyboard navigation (arrow keys, Home, End)
- [ ] Ensure visible focus indicators on all tabs

### `frontend/src/utils/mentorshipStatus.js` + `MentorshipStatusBanner.jsx`

- [ ] Refactor `getMentorshipStatusMessage` to return separate `mentee` and `mentor` message objects
- [ ] Restrict `/mentorship/become-mentor` CTAs to mentor-related states only
- [ ] Use `/profile` for student profile completion CTA with label "Complete student profile"
- [ ] Add `role="status"` or `role="alert"` to banner component
- [ ] Ensure banner messages are announced to screen readers

### `frontend/src/pages/mentorship/MyMentorshipPage.jsx`

- [ ] Add captions under section headings:
  - "People mentoring you": "These are mentors currently supporting you."
  - "People you mentor": "These are mentees you've accepted to mentor."
- [ ] Add empty states for both sections with clear CTAs
- [ ] Create and use `<MentorCapacityPill />` component in mentor header
- [ ] Ensure "Become a mentor" button is prominent when `!mentorData`
- [ ] Standardize relationship card layout (avatar, name, date, status, actions)

### `frontend/src/pages/mentorship/FindMentorsPage.jsx`

- [ ] Create and use `<MentorCapacityPill />` on each mentor card
- [ ] Add clear helper text below disabled buttons explaining why
- [ ] Add skeleton loading cards for initial RPC call
- [ ] Ensure touch targets are ≥44px on mobile
- [ ] Add `aria-label` to action buttons with mentor names

### `frontend/src/pages/mentorship/MyRequestsPage.jsx`

- [ ] Add short description at top: "Requests you've sent to mentors, grouped by status."
- [ ] Add loading states for cancel actions ("Cancelling…")
- [ ] Ensure proper semantic structure for request lists
- [ ] Add empty state when no requests exist

### `frontend/src/pages/mentorship/RequestsToMePage.jsx`

- [ ] Add short description at top: "Requests from mentees asking you to be their mentor."
- [ ] Add loading states for accept/decline actions ("Accepting…", "Declining…")
- [ ] Show capacity warning near Accept button when at/near capacity
- [ ] Add empty state when no requests exist

### `frontend/src/components/Mentorship/MentorRegistrationForm.js`

- [ ] Group fields into 3 clear sections with headings:
  - Section 1: Your Capacity
  - Section 2: Your Expertise & Experience
  - Section 3: How You Prefer to Mentor
- [ ] Add top status badge when editing existing mentor profile
- [ ] Change hero title dynamically: "Become a Mentor" vs "Edit Mentor Profile"
- [ ] Ensure "Back to Mentorship Hub" links to `/mentorship/me`
- [ ] Add helper text under each section explaining purpose
- [ ] Ensure all form fields have proper labels with `htmlFor`

### NEW: `frontend/src/components/Mentorship/MentorCapacityPill.jsx`

- [ ] Create new reusable component
- [ ] Props: `current`, `max`, `isAvailable`
- [ ] States to handle:
  - "Accepting mentees (X/Y)"
  - "At capacity (X/X)"
  - "Not accepting new mentees"
- [ ] Use text + optional icon (not color-only)
- [ ] Ensure contrast ratio ≥4.5:1 for text
- [ ] Make it responsive (full-width on mobile, inline on desktop)

---

## 3. COMPONENT SPECIFICATIONS

### MentorCapacityPill Component

**File:** `frontend/src/components/Mentorship/MentorCapacityPill.jsx`

**Props:**
```jsx
{
  current: number,        // current_mentees_count
  max: number,           // max_mentees
  isAvailable: boolean,  // is_available_for_mentorship
  size?: 'sm' | 'md' | 'lg'  // optional size variant
}
```

**States & Display:**

```jsx
// Not accepting
if (!isAvailable) {
  return "Not accepting new mentees" // gray/neutral color
}

// At capacity
if (current >= max) {
  return "At capacity (5/5)" // amber/warning color
}

// Accepting with space
return "Accepting mentees (2/5)" // green/success color
```

**Styling Guidelines:**
- Use Tailwind utility classes
- Base: `px-3 py-1 rounded-full text-sm font-medium`
- Colors: ensure text contrast ≥4.5:1
- Include optional icon (e.g., checkmark, warning, info)

**Example Usage:**

```jsx
<MentorCapacityPill
  current={mentor.current_mentees_count}
  max={mentor.max_mentees}
  isAvailable={mentor.is_available_for_mentorship}
/>
```

---

## 4. VISUAL ATOMIC SPECS

### Spacing System (4px base)

Use these values consistently:
- `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128`

**Mentorship-specific:**
- Card padding: `24px` (p-6)
- Section gaps: `24-32px` (gap-6 to gap-8)
- Between stacked buttons: `8-12px` (gap-2 to gap-3)
- Between form sections: `32px` (space-y-8)

### Color Palette

**Primary Actions:**
- Blue-600: `#2563EB` (main CTAs)
- Indigo-600: `#4F46E5` (accents)

**Status Colors:**
- Success/Green-600: `#16A34A`
- Warning/Amber-500: `#F59E0B`
- Error/Red-600: `#DC2626`
- Info/Blue-500: `#3B82F6`

**Backgrounds:**
- Page: `#F9FAFB` (gray-50)
- Cards: `#FFFFFF` (white)
- Hover: `#F3F4F6` (gray-100)

**Text:**
- Primary: `#111827` (gray-900)
- Secondary: `#6B7280` (gray-500)
- Ensure all text meets 4.5:1 contrast ratio

### Typography Scale

- H1 (page header): `text-2xl sm:text-3xl` (24-28px)
- H2 (section): `text-xl` (20px)
- H3 (subsection): `text-lg` (18px)
- Body: `text-sm sm:text-base` (14-16px)
- Small/meta: `text-xs sm:text-sm` (12-14px)

### Component Measurements

**Buttons:**
- Primary: `min-h-[44px] px-4 py-2` (mobile)
- Primary: `min-h-[40px] px-5 py-2.5` (desktop)
- Secondary: same heights, border style

**Tabs:**
- Mobile: `min-h-[44px]`
- Desktop: `min-h-[40px]`

**Cards:**
- Padding: `p-6` (24px)
- Border radius: `rounded-lg` (8px)
- Shadow: `shadow-sm` or `shadow`

---

## 5. INTERACTION ATOMIC TIMELINE

### 0-100ms (Immediate Feedback)
- Button press: color change + slight scale
- Tab click: underline appears
- Toggle switch: thumb starts moving

### 100-300ms (Micro-interactions)
- Hover states: shadow/color transitions
- Focus indicators: ring appears
- Toggle complete: thumb reaches end

### 300-500ms (Transitions)
- Tab content fade in/out
- Card entrance animations
- Modal open/close

### 500ms-2s (Action Feedback)
- RPC calls: button shows "Saving…" / "Accepting…"
- Optimistic UI updates
- Toast notifications appear

### 2s+ (Loading States)
- Show skeleton loaders for lists
- Progress indicators for long operations
- Timeout warnings if needed

---

## 6. ACCESSIBILITY CHECKLIST

### Critical (Must Fix)

- [ ] All images have descriptive `alt` text or `aria-hidden`
- [ ] Color contrast ≥4.5:1 for normal text, ≥3:1 for large text/UI
- [ ] All functionality keyboard accessible
- [ ] Visible focus indicators on all interactive elements
- [ ] No keyboard traps
- [ ] Form labels properly associated with inputs (`htmlFor`)
- [ ] Error messages specific, contextual, and actionable
- [ ] Touch targets ≥44×44px on mobile

### High Priority (Should Fix)

- [ ] Headings properly nested (H1 → H2 → H3)
- [ ] Status messages announced to assistive tech (`role="status"`)
- [ ] Inline form validation with clear descriptions
- [ ] Consistent navigation patterns across pages
- [ ] Language of page declared (`lang` attribute)

### Polish (Nice to Have)

- [ ] Skip links for keyboard users
- [ ] ARIA landmarks for major sections
- [ ] Live regions for dynamic content updates
- [ ] Reduced motion support (`prefers-reduced-motion`)

---

## 7. PERFORMANCE TARGETS

### Core Web Vitals

- **First Contentful Paint:** < 1.5s on 4G
- **Largest Contentful Paint:** < 2.5s
- **Time to Interactive:** < 3s
- **Cumulative Layout Shift:** < 0.1

### Mentorship-Specific

- **List rendering:** 60fps, no jank
- **Skeleton loaders:** Show after 300ms if data not ready
- **Button actions:** Perceived < 800ms (optimistic UI + loading states)
- **Tab switching:** < 200ms transition

### Implementation

- [ ] Add skeleton loaders to all list views
- [ ] Implement optimistic UI for mutations
- [ ] Use React.memo for expensive components
- [ ] Lazy load mentor profile images
- [ ] Code-split mentorship routes

---

## 8. TESTING CHECKLIST

### Manual Testing

**Keyboard Navigation:**
- [ ] Tab through all interactive elements in order
- [ ] Arrow keys work on tab navigation
- [ ] Enter/Space activate buttons
- [ ] Escape closes modals/dropdowns
- [ ] No focus traps

**Screen Reader:**
- [ ] All headings announced correctly
- [ ] Status messages announced
- [ ] Form labels read properly
- [ ] Button purposes clear
- [ ] List structures recognized

**Mobile:**
- [ ] All touch targets ≥44px
- [ ] No horizontal scroll
- [ ] Text readable without zoom
- [ ] Actions work with thumb
- [ ] Sticky elements don't block content

**Visual:**
- [ ] Test with color blindness simulators
- [ ] Check contrast in different lighting
- [ ] Verify at 200% zoom
- [ ] Test on small screens (320px)

### Automated Testing

- [ ] Run axe DevTools on all pages
- [ ] Lighthouse accessibility score ≥90
- [ ] Check WAVE for errors
- [ ] Validate HTML structure

---

## 9. IMPLEMENTATION PRIORITY

### Phase 1: Critical (Week 1)

1. Fix mentee vs mentor banner confusion (G1, G2)
2. Add "Become a mentor" CTA on My Mentorship page
3. Rename tabs for clarity (G4)
4. Add loading states to all action buttons (G7)
5. Fix keyboard navigation on tabs (G8)

### Phase 2: High Priority (Week 2)

1. Create and implement MentorCapacityPill component (G3)
2. Add empty states to My Mentorship page (G5)
3. Restructure MentorRegistrationForm into sections (G6)
4. Add helper text to disabled buttons (G7)
5. Implement skeleton loaders

### Phase 3: Polish (Week 3)

1. Add micro-descriptions to all pages
2. Refine spacing and typography
3. Add subtle animations (with reduced-motion support)
4. Implement advanced accessibility features
5. Performance optimization

---

## 10. SUCCESS METRICS

### Quantitative

- Task completion rate: >90% for primary flows
- Error rate: <5%
- Time on task: 20% reduction from baseline
- Abandonment rate: <10% on key funnels

### Qualitative

- SUS score: >68 (target: >75)
- Accessibility satisfaction: Positive feedback from AT users
- User confidence: "I know what to do next" >80%
- Trust perception: "I feel safe using this" >85%

---

## 11. HANDOFF NOTES FOR IMPLEMENTATION

### For AI Code Assistants

When implementing these changes:

1. **Always preserve existing backend contracts** (views, RPCs, data structures)
2. **Use existing Tailwind classes** where possible
3. **Follow the project's component patterns** (check existing components first)
4. **Test each change in isolation** before moving to the next
5. **Maintain backward compatibility** with existing routes and URLs

### For Human Developers

- This spec is frontend-only; no database migrations needed
- All data contracts (views, RPCs) are already in place
- Focus on UX improvements, not data model changes
- Test with real user data, not just happy paths
- Get feedback from actual mentees and mentors

### For Designers

- Visual specs are guidelines, not rigid rules
- Adapt to your existing design system
- Maintain brand consistency
- Prioritize clarity over aesthetics
- Test with diverse users (age, ability, context)

---

## 12. QUESTIONS & EDGE CASES

### Common Questions

**Q: What if a user is both mentee and mentor?**  
A: Show both role indicators in My Mentorship overview. Banner shows mentee message on Find/Requests pages, mentor message on Requests to Me.

**Q: What happens when mentor reaches capacity mid-session?**  
A: Availability toggle becomes the primary control. Capacity is informational. User can increase max_mentees or toggle availability off.

**Q: How do we handle rejected mentor applications?**  
A: Show clear banner with "Application rejected" + CTA to "Review and resubmit" → /mentorship/become-mentor.

**Q: What if profile is incomplete but user tries to become mentor?**  
A: Allow it. Mentor application is separate from student profile. But mentee requests require complete student profile.

### Edge Cases to Test

- [ ] User with 0 max_mentees set
- [ ] User toggles availability while at capacity
- [ ] Mentor with pending status tries to accept requests
- [ ] User cancels request while mentor is viewing it
- [ ] Network error during accept/decline action
- [ ] Very long names/titles in cards
- [ ] Many (50+) active relationships
- [ ] User with no avatar set

---

## APPENDIX: QUICK REFERENCE

### Key Routes

- `/mentorship` → redirects to `/mentorship/find`
- `/mentorship/find` → FindMentorsPage
- `/mentorship/requests` → MyRequestsPage (mentee view)
- `/mentorship/requests-to-me` → RequestsToMePage (mentor view)
- `/mentorship/me` → MyMentorshipPage (hub)
- `/mentorship/become-mentor` → MentorRegistrationForm
- `/profile` → general profile settings

### Key Components

- `MentorshipLayout` → shell with header, banner, tabs
- `MentorshipStatusBanner` → unified status messaging
- `MentorshipTabs` → role-aware navigation
- `MentorCapacityPill` → (new) reusable capacity indicator
- `MentorRegistrationForm` → mentor profile edit

### Key Data Sources

- `v_mentors_public` → via `get_mentors_for_current_mentee` RPC
- `v_my_mentorship_requests` → mentee's outgoing requests
- `v_my_mentorship_dashboard` → mentor's incoming requests
- `v_my_mentorship_relationships` → active/past mentorships

### Key Status Fields

- `profile.is_mentee_approved` → can send requests
- `profile.is_profile_complete` → student profile done
- `mentorRow.status` → pending/approved/rejected
- `mentor.is_available_for_mentorship` → accepting toggle
- `mentor.current_mentees_count` / `max_mentees` → capacity

---

**END OF SPEC**

*Last updated: Dec 2, 2025*  
*Version: 1.0 - UUX-∞ Atomic Edition*
