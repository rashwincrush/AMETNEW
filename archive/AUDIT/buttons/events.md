# Events Module — Button Audit (Read-Only)

Generated: 2025-10-03 14:27:40+05:30

| File | Line | JSX Kind | Type | Variant (guess) | On Glass? | Classes (bg/text/border/ring) | Size ≥44? | Focus OK? | Ocean tokens? | Issues |
|------|------|----------|------|-----------------|-----------|--------------------------------|-----------|-----------|---------------|--------|
| frontend/src/components/Events/EventDetail.js | 308 | button | text (Attend Event) | Primary | N | w-full bg-blue-600 text-white ... hover:bg-blue-700 | N | N | N | blue tokens; add Primary ocean gradient + min-h[44] + focus-visible |
| frontend/src/components/Events/EventDetail.js | 305 | button | text (Cancel RSVP) | Link | N | text-sm text-red-500 hover:underline | N | N | Y | treat as Secondary/Link with focus-visible |
| frontend/src/components/Events/EventDetail.js | 358 | Link | link-button (View Feedback) | Primary | N | bg-indigo-500 text-white ... hover:bg-indigo-600 | N | N | N | indigo tokens; add Primary ocean + min-h[44] + focus-visible |
| frontend/src/components/Events/EventDetail.js | 279 | Link | tag chip | Chip | N | bg-gray-200 text-gray-800 ... hover:bg-blue-100 hover:text-blue-800 | N | N | N | blue hover tokens; consider ocean neutral or keep as chip (not button) |
| frontend/src/components/Events/EditEvent.js | 582 | label | upload trigger | Link | N | ... text-blue-600 hover:text-blue-500 ... focus-within:ring-blue-500 | N | N | N | blue tokens; needs ocean focus-visible on actual trigger |
