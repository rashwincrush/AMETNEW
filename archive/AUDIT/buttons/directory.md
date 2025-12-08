# Directory Module — Button Audit (Read-Only)

Generated: 2025-10-03 14:25:00+05:30

| File | Line | JSX Kind | Type | Variant (guess) | On Glass? | Classes (bg/text/border/ring) | Size ≥44? | Focus OK? | Ocean tokens? | Issues |
|------|------|----------|------|-----------------|-----------|--------------------------------|-----------|-----------|---------------|--------|
| frontend/src/components/Directory/DirectoryPage.jsx | 271 | input | text | N/A | N | ... focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 | Y | N | N | indigo focus; expect ocean + focus-visible |
| frontend/src/components/Directory/DirectoryPage.jsx | 311 | button | chip-remove | Secondary? | N | ... rounded-full bg-indigo-100 p-0.5 hover:bg-indigo-200 (XMarkIcon text-indigo-600) | N | N | N | indigo tokens; no 44×44; missing focus-visible |
| frontend/src/components/Directory/DirectoryPage.jsx | 322 | button | chip-remove | Secondary? | N | ... rounded-full bg-indigo-100 p-0.5 hover:bg-indigo-200 (XMarkIcon text-indigo-600) | N | N | N | indigo tokens; no 44×44; missing focus-visible |
| frontend/src/components/Directory/DirectoryPage.jsx | 334 | Link | text | Link | N | text-slate-500 hover:text-indigo-600 | Y | N | N | use Link variant ocean + focus-visible |
| frontend/src/components/Directory/DirectoryPage.jsx | 354 | div | strip | N/A | N | bg-gradient-to-r from-sky-50 to-indigo-50 ... bg-sky-500 | Y | Y | N | color tokens non-ocean (content; not a button) |
| frontend/src/components/Directory/DirectoryPage.jsx | 396 | span | text | N/A | N | text-indigo-600 | Y | Y | N | display color non-ocean (content) |
| frontend/src/components/Directory/DirectoryPage.jsx | 436 | input | text | N/A | N | ... focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 | Y | N | N | indigo focus; expect ocean + focus-visible |
| frontend/src/components/Directory/DirectoryPage.jsx | 447 | input | text | N/A | N | ... focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 | Y | N | N | indigo focus; expect ocean + focus-visible |
| frontend/src/components/Directory/DirectoryPage.jsx | 464 | button | text | Primary | N | rounded-lg bg-indigo-600 ... focus:ring-indigo-500 | N | N | N | use Primary ocean gradient; add min-h[44] + focus-visible |
| frontend/src/components/Directory/DirectoryCardSplit.jsx | 162 | button | text | Primary | N | ... bg-indigo-600 hover:bg-indigo-700 ... focus:ring-indigo-500 | N | N | N | use Primary ocean gradient; add min-h[44] + focus-visible |
| frontend/src/components/Directory/AlumniDirectory.js | 285 | input | text | N/A | N | ... focus:ring-indigo-500 focus:border-indigo-500 | Y | N | N | indigo focus; expect ocean + focus-visible |
| frontend/src/components/Directory/AlumniDirectory.js | 296 | input | checkbox | N/A | N | ... text-indigo-600 ... focus:ring-indigo-500 | Y | N | N | indigo tokens; ring should be ocean |
| frontend/src/components/Directory/AlumniDirectory.js | 330 | input | text | N/A | N | ... focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 | Y | N | N | indigo focus; expect ocean + focus-visible |
| frontend/src/components/Directory/AlumniDirectory.js | 372 | button | text | Link | N | text-sm text-gray-600 hover:text-indigo-600 hover:underline | Y | N | N | make Link variant ocean + focus-visible |
| frontend/src/components/Directory/AlumniDirectory.js | 468 | button | text | Secondary | N | px-4 py-2 bg-white border border-gray-300 rounded-lg ... | N | N | Y | add min-h[44] + focus-visible |
| frontend/src/components/Directory/AlumniDirectory.js | 469 | button | text | Primary | N | px-4 py-2 bg-indigo-600 text-white ... | N | N | N | use Primary ocean gradient + min-h[44] + focus-visible |
| frontend/src/components/Directory/AlumniCard.js | 137 | Link | text | Primary | N | w-full ... bg-gradient-to-r from-blue-600 to-indigo-600 ... | N | N | N | blue/indigo gradient → Primary ocean gradient + min-h[44] + focus-visible |
| frontend/src/components/Directory/AlumniCard.js | 43 | div | avatar-fallback | N/A | N | bg-gradient-to-r from-blue-500 to-indigo-600 | Y | Y | N | non-button visuals (color drift) |
| frontend/src/components/Directory/AlumniListItem.js | 33 | img | avatar | N/A | N | ring-indigo-100 | Y | Y | N | non-button visuals (color drift) |
| frontend/src/components/Directory/AlumniListItem.js | 68 | p | text | N/A | N | text-indigo-600 | Y | Y | N | non-button text color |
