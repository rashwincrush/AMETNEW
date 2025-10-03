# Messages Module — Button Audit (Read-Only)

Generated: 2025-10-03 14:26:20+05:30

| File | Line | JSX Kind | Type | Variant (guess) | On Glass? | Classes (bg/text/border/ring) | Size ≥44? | Focus OK? | Ocean tokens? | Issues |
|------|------|----------|------|-----------------|-----------|--------------------------------|-----------|-----------|---------------|--------|
| frontend/src/components/Messages/ChatWindow.js | 447 | button | chip | Ghost? | N | px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 | N | N | N | blue tokens; chip under 44px; missing focus-visible |
| frontend/src/components/Messages/NewConversationModal.js | 101 | input | text | N/A | N | ... focus:ring-2 focus:ring-indigo-500 | Y | N | N | indigo focus; expect ocean + focus-visible |
| frontend/src/components/Messages/NewConversationModal.js | 93 | button | icon-only (dialog close) | Ghost | N | text-gray-400 hover:text-gray-600 | N | N | Y | missing 44×44; missing focus-visible |
| frontend/src/components/Messages/ConnectionsPanel.jsx | 40 | button | text (Accept) | Primary? | N | px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 | N | N | N | should be Primary ocean; add min-h[44] + focus-visible |
| frontend/src/components/Messages/ConnectionsPanel.jsx | 43 | button | text (Reject) | Destructive | N | px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 | N | N | Y | add min-h[44] + focus-visible |
| frontend/src/components/Messages/ConnectionsPanel.jsx | 46 | button | text (Cancel) | Secondary | N | px-2 py-1 text-xs rounded bg-gray-200 text-gray-700 hover:bg-gray-300 | N | N | Y | add min-h[44] + focus-visible |
| frontend/src/components/Messages/ConnectionsPanel.jsx | 49 | button | text (Message) | Primary | N | px-2 py-1 text-xs rounded bg-ocean-600 text-white hover:bg-ocean-700 | N | N | Y | add min-h[44] + focus-visible |
| frontend/src/components/Messages/ConnectionsPanel.jsx | 52 | button | text (Disconnect) | Destructive | N | px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 | N | N | Y | add min-h[44] + focus-visible |
| frontend/src/components/Messages/Messages-part3.js | 130 | button | icon-only (toolbar) | Ghost | N | p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg | N | N | Y | icon-only missing 44×44 + focus-visible |
| frontend/src/components/Messages/Messages-part3.js | 134 | button | icon-only (toolbar) | Ghost | N | p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg | N | N | Y | icon-only missing 44×44 + focus-visible |
| frontend/src/components/Messages/Messages-part3.js | 139 | button | icon-only (toolbar) | Ghost | N | p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg | N | N | Y | icon-only missing 44×44 + focus-visible |
| frontend/src/components/Messages/Messages-part3.js | 142 | button | icon-only (toolbar) | Ghost | N | p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg | N | N | Y | icon-only missing 44×44 + focus-visible |
| frontend/src/components/Messages/MessagingSystem.js | 249 | button | text (Retry) | Primary | N | btn-ocean | Y | Y | Y | class alias; assumed compliant |
