# MASTER WINDsurf PROMPT — UI-ONLY PROGRAM (v2)

Product: AMET Alumni App
Date: 2025-10-02

## SCOPE & OBJECTIVE
- Execute a UI-only improvement program (Tailwind/CSS/ARIA/semantic markup only) across remaining areas.
- No edits to copy/strings, logic, routes, handlers, fetches, props, APIs, RLS, validation, or DB.
- No new dependencies. Respect prefers-reduced-motion. Maintain visible focus rings and ≥44×44px hit targets.

## NON-NEGOTIABLES (apply to everything)
- UI-only: classes, tokens, spacing, radii, focus rings, responsive utilities, transitions, ARIA/landmarks, static markup (breadcrumbs).
- Do NOT modify component props/exports, handlers, or data flow.
- Do NOT add new packages or JS behavior.
- If a requested change would touch behavior → SKIP and log in “Deferred (would change behavior).”

## THEMING / TOKEN GUARDRAILS
- Use existing ocean tokens only (bg/text/border/ring-ocean-*).
- Replace any remaining blue-* with ocean-* **only inside JSX className strings**. Do not edit variables, data, comments, or logic.
- Buttons primary gradient: `bg-gradient-to-b from-ocean-500 to-ocean-600` with hover `from-ocean-600 to-ocean-700` (AA).
- Focus rings on glass: include `focus-visible:ring-offset-2 focus-visible:ring-offset-white/80`.

## UI CONTROL PATTERNS (cheat-sheet)
- Buttons (primary): gradient above + `min-h-[44px] px-4` + `transition-[colors,opacity,transform,shadow] duration-200 ease-out` + `focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2` + `disabled:opacity-50 disabled:cursor-not-allowed`.
- Buttons (outline): `border-2 border-ocean-600 text-ocean-600 hover:bg-ocean-600 hover:text-white`.
- Icon-only buttons: `inline-flex items-center justify-center w-[44px] h-[44px] p-0 rounded-lg`.
- Inputs/Textareas: `rounded-lg border-2 border-ocean-200 min-h-[44px] placeholder:text-gray-500 focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:border-ocean-500`.
- Links acting as buttons: `text-ocean-600 hover:text-ocean-700 focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2 rounded`.

## ATOMIC DIFF POLICY
- ≤5 files per PR, ≤150 changed lines total.
- Group by module/feature.
- If behavior risk detected → exclude from PR and list in “Deferred”.

## HEADLESS/THIRD-PARTY REMINDER
- Do NOT override built-in component behavior/ARIA (e.g., Headless UI). Adjust classes and only add missing ARIA where required.

## ACCEPTANCE CRITERIA (every batch/PR)
- Zero changes to logic, routes, handlers, fetches, props, APIs, validation, copy.
- Visible focus rings everywhere; touch targets ≥44×44.
- WCAG AA contrast on text/controls across states.
- Responsive at 360/768/1024/1280 with no unintended overflow.
- PR includes screenshots + Lighthouse/Axe notes and “UI-only” declaration.

---

## PHASE 0 — READ-ONLY OUTPUTS (DO NOT EDIT CODE YET)
1) MODULE INVENTORY (use the template below for each feature area)
2) GLOBAL BUTTON AUDIT (full-app button consistency report)
3) PROPOSED BATCH PLAN (UI-only), then WAIT for approval

### [Template] UI Audit — Module Inventory (read-only)
```
# UI Audit — Module Inventory
Feature: <e.g., Job Portal>
Files scanned (paths):
UI issues & opportunities (purely visual):
- Spacing/rhythm:
- Colors/contrast:
- Focus/keyboard:
- Responsiveness:
- Components drift (buttons/inputs/cards/tables):
- Discoverability (hover/disabled/loading affordances):
Risk flags (would change behavior): <list or “none”>
```

### GLOBAL BUTTON AUDIT — Requirements (read-only)
Audit scope:
- Find all button-like controls: <Button>, raw <button>, <a>/<Link> acting as buttons, icon-only, FABs, pagination, chip/toggle buttons.
- Cover ALL features: Dashboard, Directory, Events, Job Portal, Mentorship, Groups, Messages, Notifications, Admin (all), Profile/Settings, Landing, Auth.

Per instance capture:
- File path + line
- Type (Button variant if present; raw button; link-as-button)
- className (resolved, including conditional branches if evident)
- Hit target (≥44×44?) and whether icon-only utility used
- Color tokens present (`bg/text/border/ring`), gradients
- State styles present (`hover/active/disabled/focus-visible`)
- Issues detected (see rules)

Validation rules:
- Colors = ocean tokens only (flag blue-* or hex).
- States must include visible `focus-visible:ring-2 ring-ocean-500 ring-offset-2` (and ring-offset on glass).
- Hit targets: text buttons `min-h-[44px]`; icon-only `w-[44px] h-[44px]`.
- Transitions standardized (`transition-[colors,opacity,transform,shadow] duration-200 ease-out`).
- Map to variants (default/outline/secondary/ghost/link/destructive).

Deliverables (Markdown only, no code changes):
A) Global Button Audit — Findings
- Per module/page summary: counts by variant, list of issues.
- Table:

| File | Line | Type | Variant/Guess | Classes (trim) | Hit≥44? | Focus OK? | Ocean tokens? | Issues |
|------|------|------|---------------|----------------|---------|-----------|---------------|--------|

- Summary tallies: total buttons, % compliant, common violations.

B) Patch Plan — UI-only diffs
- For each file with violations, list exact class edits to become compliant (no prop/handler changes). Group by module. If behavioral change would be required → place under Deferred.

C) Token Drift Map
- All occurrences of `blue-*` on buttons with file:line.
- Safe replacements to `ocean-*` limited to JSX className strings.

>>> STOP after producing:
- Module Inventory (all features)
- Global Button Audit (Findings + Patch Plan + Token Drift Map)
- Proposed Batch Plan (below)
Await approval message: “APPROVED: PROCEED BATCH 1” (or similar).

---

## BATCH PLAN GATE — PROPOSE FIRST, THEN WAIT
```
# Proposed Batch Plan (UI-only)
Limits: ≤5 files per batch, ≤150 changed lines, no logic/routes/APIs, no copy.

Batch N (example):
- Files:
  - path/to/FileA.jsx — button/focus ring/spacing tweaks
  - path/to/FileB.jsx — table wrapper/overflow/contrast
- Visual diffs expected: 1–2 screenshots per file
- Risk: none (UI-only)
Awaiting approval: “APPROVED: PROCEED BATCH N”
```

---

## EXECUTION (AFTER APPROVAL)
When you receive “APPROVED: PROCEED BATCH N”, implement only the approved files with UI-only changes and open a PR using the template below. Repeat per batch.

### PR TEMPLATE (UI-only)
```
# Title
Accessibility/Visual Polish — <Module> (UI-only)

## Scope
UI-only. No copy/logic/routes/handlers/fetches/props/APIs/RLS changed.

## Files Changed
- path/to/FileA.jsx
- path/to/FileB.css

## Changes (visual only)
- Buttons: ocean tokens, ≥44×44, visible :focus-visible ring
- Inputs: border-2, placeholder contrast, label/ARIA binding intact
- Layout/spacing/radii/shadows standardized
- (If applicable) Pagination/tabs/nav: presentational states + ARIA only

## Screenshots
- 360 / 768 / 1024 / 1280 — before/after

## Accessibility & QA
- Keyboard tab order verified
- Focus rings visible
- Screen reader labels/announcements unchanged + correct
- No horizontal scroll at any breakpoint
- Lighthouse Accessibility ≥ 90 (reference)
- Axe: 0 serious issues

## Deferred (Would Change Behavior)
- File: <path> — <short note why deferred and any UI-only alternative>

## Declaration
UI-only; behavior preserved. No logic/routes/handlers/fetches/props/APIs/copy changed.
```

---

## SCREENSHOT + TEST CHECKLIST (attach per PR)
- Viewports: 360, 768, 1024, 1280
- Keyboard: tab through all interactive elements; focus ring visible
- SR: labels/groupings announced as before (no new/changed text)
- No layout jumps; no horizontal scroll
- Buttons: ≥44×44; icon-only = 44×44 utility
- Contrast: AA across states; placeholders ≥ `text-gray-500`
- Reduced motion: transitions/animations off under media query

---

## RISK/SKIP LOG (maintain alongside PRs)
```
# Deferred (Would Change Behavior)
- File: <path/to/FileX.jsx>
- Proposed change: <describe>
- Reason: would alter handler/props/conditional logic or require new deps
- UI-only alternative: <if any>
```

---

## FINAL WRAP-UP (after last batch merges)
```
# Final Summary — UI-Only Program
Modules improved (UI-only): <list>
Screenshots bundle: <link/folder>
Accessibility: AA contrast met; focus & keyboard flows verified (Lighthouse/Axe summaries)
Deferred items (would change behavior): <list + reasons>
Optional follow-ups (non-UI): <list>
```

---

## PROCESS — WHAT TO DO NOW
1) Produce:
   - Module Inventory (all features) using the template,
   - Global Button Audit (Findings + Patch Plan + Token Drift Map),
   - Proposed Batch Plan (UI-only), respecting atomic diff policy.
2) STOP and wait for: “APPROVED: PROCEED BATCH 1”.
3) After approval, implement only Batch 1; open PR using the PR template; include the Screenshot + Test Checklist.
4) Repeat for subsequent batches until all approved work is merged.


# Windsurf Prompt: Batch 5 – Accessibility AA (UI-only)

Paste this entire prompt into Windsurf. Follow strictly. UI-only: Tailwind/CSS/ARIA/semantic markup. No edits to copy/strings, logic, routes, handlers, fetches, props, APIs, RLS, or validation. No new dependencies.

## Objective
Bring the AMET Alumni app to WCAG AA with UI-only changes.

## Global Constraints
- Tailwind/CSS/ARIA/semantic markup only.
- No behavior changes. No new dependencies.
- Respect prefers-reduced-motion. Keep visible focus rings. Maintain ≥44×44px hit targets.

## Tiny lockdown tweaks (optional but recommended)
- Ensure focus rings remain visible on glass surfaces: add `focus-visible:ring-offset-2 focus-visible:ring-offset-white/80` where elements sit on `.glass-card` or similar translucent backgrounds.
- `aria-describedby` supports multiple IDs: prefer a space-separated list to include both help and error when both exist.
- Avoid screen reader spam: apply `role="status" aria-live="polite"` only where content actually changes (counts/status), not on static wrappers.
- Icon-only buttons: enforce `min-h-[44px] min-w-[44px] p-0` for true icon buttons; keep text buttons at `min-h-[44px]` without stretching toolbars.
- Blue→Ocean sweep guard: restrict replacements to JSX `className` strings only. Do not change data values, comments, or variable names.

## Landmarks & Skip
- Add semantic landmarks where applicable:
  - `<header role="banner">`, `<nav aria-label="Main navigation">`, `<main id="main-content">`, `<aside>` (for filter sidebars), `<footer>`.
- Add a skip link in the layout root (visible on focus only) that jumps to `#main-content`.

Skip link (verbatim):
```jsx
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-ocean-600 focus:text-white focus:rounded-lg focus:shadow-lg"
>
  Skip to main content
</a>
```

Main landmark wrapper on pages (verbatim):
```jsx
<main id="main-content" className="p-4 md:p-6 lg:p-8">
  <div className="max-w-7xl mx-auto">{/* page content */}</div>
</main>
```

## Forms (labels & errors)
- Ensure every input/textarea/select has a `<label htmlFor="…">` bound to the input `id`.
- When an error prop/class already exists, add `aria-invalid="true"` and tie error text via `aria-describedby="<id>-error"`.
- Mark required fields visually (`*`) and add a screen-reader hint.

Pattern (verbatim; adapt to existing APIs/ids only):
```jsx
<label htmlFor={id} className="block text-sm font-medium text-gray-900">
  {label}{required && <span className="text-red-600" aria-hidden="true">*</span>}
  {required && <span className="sr-only"> (required)</span>}
</label>
<input
  id={id}
  aria-invalid={Boolean(error) || undefined}
  aria-describedby={error ? `${id}-error`  : helpId}
  className="block w-full rounded-lg border-2 border-ocean-200 min-h-[44px] px-3 py-2
             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:border-ocean-500
             placeholder:text-gray-500"
  {...props}
/>
{error && <p id={`${id}-error` } className="mt-1 text-sm text-red-600">{error}</p>}
```

### Multiple aria-describedby (drop-in)
```js
// If help + error both exist:
const describedBy = [helpId, error ? `${id}-error`  : null].filter(Boolean).join(' ') || undefined;
```

## Live regions (existing status only)
- Where counts/status messages already render, add `role="status" aria-live="polite"`.
- Examples: search result counts, submission status, list loading containers (use existing Skeleton + visually hidden live region).

Pattern (verbatim):
```jsx
<div role="status" aria-live="polite" className="sr-only">
  {count} results
</div>
```

## Focus & Hit Targets
- Ensure visible focus rings across interactive elements:
  - `focus-visible:ring-2 focus-visible:ring-ocean-500 focus-visible:ring-offset-2`.
- Ensure ≥44×44 px targets for buttons, links, toggles, and pagination. Add padding/min-h/min-w if needed (UI only).

Icon-only button utility (drop-in):
```js
// Add a utility class for icon-only controls
const iconButton = "inline-flex items-center justify-center w-[44px] h-[44px] p-0 rounded-lg";
```

## Contrast & Color Normalization
- Replace any remaining `text-blue-* / bg-blue-* / border-blue-* / ring-blue-*` with `ocean-*` tokens.
- Elevate low-contrast grays (placeholders ≥ `text-gray-500`).
- Ensure white-on-ocean buttons pass AA in hover/active:
  - Use darker ocean on hover: `from-ocean-600 to-ocean-700` (retain UI-only behavior).

Safer find/replace (class-only):
```js
// Ask Windsurf: limit replacements to JSX className strings
// Replace `text-blue-*|bg-blue-*|border-blue-*|ring-blue-*` ONLY inside className strings with ocean equivalents.
```

## Reduced Motion
- Confirm global `@media (prefers-reduced-motion: reduce)` is present; disable non-essential transitions/animations inside it.

## File Targets (keep commits atomic)
- Layout: `frontend/src/components/Layout/Navigation.js`, `frontend/src/components/Layout/Header.js`, and other layout wrappers.
- Pages (main landmarks): page roots under `frontend/src/components/**/` including `Dashboard`, `Directory`, `Events`, `Jobs`, `Mentorship`, `Groups`, `Messages`, `Admin/*`, `Notifications`, `Profile/Settings`, `Landing`.
- Forms: `frontend/src/components/**/Form*.{js,jsx,tsx}`, and inputs in `Auth/Jobs/Events/Profile/Mentorship`.
- Status/Counts: lists under `Directory`, `Events`, `Jobs`, `Mentorship`; `Notifications`; `Admin` tabs.
- Color sweep: all files flagged in the audit with `blue-*`.

## Stop/Skip Rules
If any requested change would alter behavior, add dependencies, or touch props/handlers/routes—do not implement. Log under “Deferred (would change behavior)” and continue with the rest.

## PR Policy (must include)
- Title: `Accessibility AA – <area/module> (UI-only)`
- Body must contain:
  - Scope declaration
  - Bullet changes
  - 360/768/1024/1280 screenshots
  - Lighthouse/Axe results (≥90 Accessibility, 0 serious issues)
  - Manual tab & screen reader notes (VoiceOver/NVDA)
  - “UI-only; no logic/copy/routes/handlers/APIs changed.”

Paste-ready PR checklist:
- Scope: UI-only; no copy/logic/routes/handlers/fetches/props/APIs/RLS.
- Landmarks/skip link applied where relevant.
- Labels & ARIA: label[for] ↔ input[id], aria-invalid, aria-describedby (space-separated if help+error).
- Live regions: only on changing status/counts; not on static containers.
- Focus & targets: visible :focus-visible rings; ≥44×44 on all controls (icon buttons use 44×44).
- Contrast: ocean tokens; placeholders ≥ text-gray-500; AA verified on buttons (hover/active darker ocean).
- Reduced motion: animations/transitions off under prefers-reduced-motion.
- Screens: 360 / 768 / 1024 / 1280 screenshots + Lighthouse/Axe (≥90; zero serious).
- Declaration: “UI-only; no logic/copy/routes/handlers/APIs changed.”

Optional pre-commit guard: Reuse the hook from Batch 1 to block accidental logic edits for Batches 5–6.

## Quick Runlist (apply in order)
1) Layout & landmarks first: `Navigation/Header` + add `<main>` to all root pages; insert skip link once.
2) Forms pass: sweep all forms for `label/id`, `aria-invalid`, `aria-describedby`, required markers.
3) Status/live regions: add polite live regions to existing counts/status blocks.
4) Contrast sweep: replace remaining `blue-*` with `ocean-*`; raise low-contrast grays.
5) Focus & 44×44 audit: ensure visible focus and targets in nav, tabs, chips, pagination, buttons.
6) Reduced motion confirmation.

---

## After Batch 5 lands — Batch 6 (final polish, UI-only)
One-liner to start next sprint:
```
Proceed: Batch 6 – Polish & Micro-interactions (UI-only). Standardize transitions to transition-[colors,opacity,transform] duration-200 ease-out (respect reduced motion). Cards: hover:shadow-md + optional hover:-translate-y-1 (no layout shift). Images/avatars: object-cover, consistent rounded-*, simple loading placeholders. Badges/labels: harmonize to ocean variants via existing Badge. Tooltips: presentational style only; add role="tooltip". Buttons: migrate any stragglers to unified Button styles without changing props/handlers. No timers/auto-dismiss, no new behavior, no deps. Separate atomic PRs with screenshots + Axe/Lighthouse checks.
```
