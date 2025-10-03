# WINDSURF TASK — GLOBAL BUTTON AUDIT (UI-only)

## Objective
Audit ALL buttons across the AMET Alumni app and report inconsistencies in color tokens, states, sizing, and focus behavior. Produce a per-page report and a per-file patch plan with ONLY styling/markup changes (no logic).

## Non-negotiables
- **UI-only**: Tailwind/CSS/ARIA/semantic markup. No copy/logic/routes/handlers/fetches/props/APIs/RLS. No new deps.
- **Respect 44×44px minimum** hit targets and visible `:focus-visible` rings.
- **Use ocean tokens** (no `blue-*`). Do NOT modify behavior or props.

## Scope
Find all button-like controls:
- `<Button …>` component instances
- Raw `<button>` elements
- `<a>` / `<Link>` acting as buttons (`role="button"` or button-like classes)
- Icon-only buttons, fab-like buttons, pagination buttons, chip/toggle buttons

Cover ALL feature areas:
- Dashboard, Directory, Events, Job Portal, Mentorship, Groups, Messages, Notifications
- Admin (all tabs), Profile/Settings, Landing, Auth

## What to extract (per instance)
- **File path + line**
- **Component type** (`Button` variant prop if present; raw `<button>` / `<a>`)
- **className string** (resolved; include conditional branches if obvious)
- **Size/hit target** (min-h/min-w or padding evidence; flag if <44px)
- **Color tokens used**: `bg-*`, `text-*`, `border-*`, `ring-*`, gradients
- **State styles present**: `hover:*`, `active:*`, `disabled:*`, `focus-visible:*`
- **Icon-only?** (yes/no) and whether it uses the 44×44 icon utility
- **Issues detected** (from rules below)

## Validation rules

### Colors
Must use ocean tokens (`bg-ocean-*`, `text-ocean-*`, `border-ocean-*`, `ring-ocean-*`). Flag any `blue-*` or ad-hoc hex.

### States
Must include visible `focus-visible:ring-2` + `ring-ocean-500` + `ring-offset-2` (and `ring-offset-white/80` on glass).

### Size
Ensure ≥44×44 via `min-h-[44px]` (text buttons) and `w-[44px] h-[44px] p-0` for icon-only.

### Transitions
Standardized `transition-[colors,opacity,transform,shadow] duration-200 ease-out`.

### Variants
Map to the unified set (from Batch 1):
- **default**: `bg-gradient-to-b from-ocean-500 to-ocean-600` with hover `from-ocean-600 to-ocean-700`
- **outline**: `border-2 border-ocean-600 bg-transparent text-ocean-600 hover:bg-ocean-600 hover:text-white`
- **secondary**: `bg-ocean-100 text-ocean-700 hover:bg-ocean-200`
- **ghost**: `hover:bg-ocean-50 hover:text-ocean-700`
- **link**: `text-ocean-600 underline hover:text-ocean-700`
- **destructive**: `bg-gradient-to-b from-red-500 to-red-600 hover:from-red-600 hover:to-red-700`

### Gradients
Default primary uses `bg-gradient-to-b from-ocean-500 to-ocean-600` with hover `from-ocean-600 to-ocean-700` (AA).

### Disabled
Must include `disabled:opacity-50 disabled:cursor-not-allowed`.

## Deliverables

### 1) Button Inventory Report (Markdown)
- Per module/page: counts by variant, list of issues.
- A flat table with columns:

| File | Line | Type | Variant/Guess | Classes (trimmed) | Hit≥44? | Focus OK? | Ocean tokens? | Issues |
|------|------|------|---------------|-------------------|---------|-----------|---------------|--------|

- Summary tallies: total buttons, % compliant, common violations.

### 2) Patch Plan (UI-only)
- For each file with violations, list exact class edits to become compliant (keep behavior unchanged).
- Group by module so we can commit atomically.
- Do NOT modify props/handlers. If a change would alter behavior, list under "Deferred".

### 3) Token Drift Map
- List all occurrences of `blue-*` used on buttons with file:line.
- Provide safe replaces to `ocean-*` (className strings only).

## Rules of engagement
- Do not add or remove components; do not change text.
- Do not alter onClick/handlers or introduce new state.
- If a button uses Headless UI/third-party markup, only adjust classes/ARIA; don't override built-in roles/behavior.
- If a case needs behavior changes to fix, mark "Deferred (would change behavior)" with a note.

## Output format
1. **"Global Button Audit — Findings"** (Markdown)
2. **"Patch Plan — UI-only diffs"** (Markdown)
3. **"Deferred (would change behavior)"** (if any)

## Begin now
Do not commit code. Produce the report and patch plan only.
