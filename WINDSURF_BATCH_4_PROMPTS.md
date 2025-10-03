# Windsurf Batch 4 Prompts (Paste-Ready)

## Prompt 1: Admin Lists & Reports

```
BATCH 4 – ADMIN TABLES (UI-ONLY)

Files to update:
- /frontend/src/components/Admin/UserManagement.js
- /frontend/src/components/Admin/ContentApproval.js
- /frontend/src/components/Admin/MentorsTab.jsx
- /frontend/src/components/Admin/ActivityLogs.js
- /frontend/src/components/Admin/FeedbackReport.js
- /frontend/src/components/Admin/Analytics.js (if Reports view present)

Changes (Tailwind/CSS/ARIA/markup ONLY):

1. Wrap all tables:
   <div className="overflow-x-auto border border-ocean-100 rounded-lg shadow-sm">
     <table className="min-w-full divide-y divide-gray-200">…</table>
   </div>

2. Page gutters: p-4 md:p-6 lg:p-8 + max-w-7xl mx-auto on main wrapper

3. Sticky headers (if thead exists):
   <thead className="bg-white sticky top-0 z-10">

4. Pagination: keep existing ocean outline + aria-* pattern

5. Empty states: standardized ocean icon block (presentational only)

6. Cell truncation for IDs/long text: truncate max-w-[12rem] where appropriate

CONSTRAINTS:
- UI-only: NO copy/logic/routes/handlers/fetches/props/APIs
- NO new dependencies
- ≥44×44 tap targets
- Visible focus rings (ring-2 ring-ocean-500)
- Respect prefers-reduced-motion
- Zero behavior changes

DELIVERABLE:
- Test at 360/768/1024/1280px
- No horizontal scroll except intended table scroller
- PR with 4 breakpoint screenshots + Axe/Lighthouse results
- Checklist: gutters ✓, table overflow ✓, pagination styled ✓, tap targets ✓
```

---

## Prompt 2: Mentorship Module

```
BATCH 4 – MENTORSHIP (UI-ONLY)

Files to update:
- /frontend/src/components/Mentorship/Mentorship.js
- /frontend/src/components/Mentorship/MentorCard.js
- /frontend/src/components/Mentorship/MentorProfile.js
- /frontend/src/components/Mentorship/MyMentorship.js

Changes (Tailwind/CSS/ARIA/markup ONLY):

1. Page wrapper: p-4 md:p-6 lg:p-8 + max-w-7xl mx-auto

2. Grid normalization for mentor cards:
   grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6

3. Replace "Loading..." text with Skeleton card placeholders (UI only)

4. Search form ARIA:
   <form role="search" aria-label="Mentor search">…</form>
   <div aria-live="polite" className="sr-only">{count} mentors found</div>

5. Availability chips: use Badge variants (UI only, no logic)

6. All interactive elements: ≥44×44 with visible focus rings

CONSTRAINTS:
- UI-only: NO copy/logic/routes/handlers/fetches/props/APIs
- NO new dependencies
- ≥44×44 tap targets
- Visible focus rings (ring-2 ring-ocean-500)
- Respect prefers-reduced-motion
- Zero behavior/flow changes

DELIVERABLE:
- Test at 360/768/1024/1280px
- PR with 4 breakpoint screenshots + Axe/Lighthouse results
- Checklist: gutters ✓, grids normalized ✓, skeletons ✓, ARIA search ✓, focus rings ✓
```

---

## Prompt 3: Messages Module

```
BATCH 4 – MESSAGES (UI-ONLY)

Files to update:
- /frontend/src/components/Messages/MessagingSystem.js
- /frontend/src/components/Messages/ConversationList.js
- /frontend/src/components/Messages/ChatWindow.js

Changes (Tailwind/CSS/ARIA/markup ONLY):

1. Wrapper gutters: p-4 md:p-6 lg:p-8 + max-w-7xl mx-auto

2. Responsive visibility (presentational only):
   - Conversation list: hidden md:block
   - Chat window: block md:block
   - If back button exists, add: md:hidden inline-flex … (DO NOT change click handler)

3. Scroll containment:
   <div className="h-full md:h-[calc(100vh-12rem)] overflow-y-auto">…</div>

4. Skeletons for loading list and message bubbles (UI only)

5. ARIA landmarks:
   <aside aria-label="Conversations">…</aside>
   <section aria-label="Chat messages">…</section>

6. All interactive elements: ≥44×44 with visible focus rings

CONSTRAINTS:
- UI-only: NO copy/logic/routes/handlers/fetches/props/state changes
- NO new dependencies
- ≥44×44 tap targets
- Visible focus rings (ring-2 ring-ocean-500)
- Respect prefers-reduced-motion
- Zero behavior/state changes

DELIVERABLE:
- Test at 360/768/1024/1280px (verify mobile comfort)
- PR with 4 breakpoint screenshots + Axe/Lighthouse results
- Checklist: gutters ✓, mobile CSS visibility ✓, scroll containers ✓, ARIA ✓, focus rings ✓
```

---

## Prompt 4: Groups Module

```
BATCH 4 – GROUPS (UI-ONLY)

Files to update:
- /frontend/src/components/Groups/GroupsPage.js
- /frontend/src/components/Groups/GroupDetails.js
- /frontend/src/components/Groups/GroupManage.js

Changes (Tailwind/CSS/ARIA/markup ONLY):

1. Page gutters: p-4 md:p-6 lg:p-8 + max-w-7xl mx-auto

2. Cards grid normalization:
   grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6

3. Group header image:
   aspect-video w-full object-cover rounded-lg bg-ocean-100

4. Members list wrapper: overflow-x-auto for wide names/roles

5. Empty states & pagination: standardized patterns from earlier batches

6. All interactive elements: ≥44×44 with visible focus rings

CONSTRAINTS:
- UI-only: NO copy/logic/routes/handlers/fetches/props/APIs
- NO new dependencies
- ≥44×44 tap targets
- Visible focus rings (ring-2 ring-ocean-500)
- Respect prefers-reduced-motion
- Zero behavior changes

DELIVERABLE:
- Test at 360/768/1024/1280px
- PR with 4 breakpoint screenshots + Axe/Lighthouse results
- Checklist: gutters ✓, grids normalized ✓, header aspect ✓, members overflow ✓, focus rings ✓
```

---

## One-Liner for Next Sprint

```
Proceed: Batch 4 (UI-only) — in this order: (1) Admin lists & reports (tables/overflow/gutters/pagination styling), (2) Mentorship (gutters/grids/skeletons/ARIA search), (3) Messages (mobile CSS visibility only, scroll containers, ARIA), (4) Groups (grids/header aspect/members overflow). Use only Tailwind/CSS/ARIA/markup; no logic/copy/routes/handlers/props/APIs; no new deps. Keep commits per-module with screenshots and AA checks. Stop and flag anything that would alter behavior.
```

---

## PR Template (Use for Each Module)

```markdown
## Batch 4: [Module Name] – UI-Only Polish

### Declaration
**UI-ONLY CHANGES**: This PR contains only Tailwind/CSS/ARIA/markup updates. Zero logic, copy, routes, handlers, fetches, props, or API changes. No new dependencies.

### Changes
- [ ] Page gutters applied (p-4 md:p-6 lg:p-8 + max-w-7xl mx-auto)
- [ ] Grids normalized (grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6)
- [ ] Table overflow wrapper added (if applicable)
- [ ] Tap targets ≥44×44px verified
- [ ] Focus rings visible (ring-2 ring-ocean-500)
- [ ] Skeletons added for loading states (if applicable)
- [ ] ARIA landmarks/labels added (if applicable)
- [ ] Responsive tested at 360/768/1024/1280px

### Screenshots
**Mobile (360px):**
[screenshot]

**Tablet (768px):**
[screenshot]

**Desktop (1024px):**
[screenshot]

**Wide (1280px):**
[screenshot]

### Accessibility
**Axe DevTools:** [results]
**Lighthouse Accessibility Score:** [score]

### Testing Notes
- No horizontal scroll except intended table scroller
- All interactive elements keyboard-accessible
- Focus indicators clearly visible
- Motion respects prefers-reduced-motion
```
