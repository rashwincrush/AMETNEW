Title: Accessibility/Visual Polish — Batch 2 (UI-only)

Scope
UI-only. No copy/logic/routes/handlers/fetches/props/APIs/RLS changed.

Files Changed
frontend/src/components/Admin/UserManagement.js
frontend/src/components/Admin/ContentApproval.js
frontend/src/components/Admin/ActivityLogs.js
frontend/src/components/Networking/GroupDetails.js
frontend/src/components/Notifications/NotificationsPage.js

Changes (visual only)
Buttons & variants: Normalized to Primary/Outline/Secondary/Ghost/Destructive per matrix; ocean tokens only (className strings).
Focus & hit targets: Added focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2; text buttons min-h-[44px]; icon-only w-[44px] h-[44px] p-0.
Tables & pagination: Outline variant for pagination controls; visible focus rings.
Destructive actions (Admin/Groups): Red gradient with visible focus ring.
Notifications: Unread highlight bg-ocean-50; Accept=Primary, Decline=Destructive, Cancel=Secondary, Mark-all=Outline; rings + ≥44px.

Screenshots (attach before/after at 360/768/1024/1280)
Admin/UserManagement: row action buttons (focus), pagination (Outline)
Admin/ContentApproval: view toggle (ocean), icon actions (44×44), spinner (ocean)
Admin/ActivityLogs: Apply/Reset (≥44px + rings)
Networking/GroupDetails: Join/Leave (focus), Create Post (Primary)
Notifications: unread ocean highlight + all action buttons (focus)

Accessibility & QA
Keyboard focus rings visible; all controls ≥44×44
Contrast AA via ocean tokens
Responsive: no unintended overflow
Lighthouse (Accessibility) ≥ 90; Axe: 0 serious issues

Deferred (Would Change Behavior)
None (console errors on /jobs/applications are non-UI and out of scope).

Declaration
UI-only; behavior preserved. No logic/routes/handlers/fetches/props/APIs/copy changed.

Commit message suggestion
UI: Batch 2 (UI-only) — normalize button variants, ocean tokens, 44×44 targets, focus-visible rings across Admin, Groups, Notifications

Reviewer quick note (first PR comment)
UI-only diff verified. No prop/handler/logic changes. Focus rings + ≥44×44 targets confirmed.
Please review with attached 4-breakpoint screenshots and Lighthouse/Axe results.
