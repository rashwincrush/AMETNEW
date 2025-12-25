# Service Worker Status

## Findings
- Entry point `frontend/src/index.js` has no service worker registration; it only renders `<App />`. @frontend/src/index.js#1-22
- Repo search shows no `serviceWorkerRegistration`, `registerServiceWorker`, `serviceWorker.register`, or `navigator.serviceWorker` usage in `frontend/src`. (repo scan)
- `frontend/public/mockServiceWorker.js` (MSW) exists for dev testing but is not registered in production.
- `workbox-google-analytics` appears only as a dependency (package-lock) and is inert without a registered service worker. @frontend/package-lock.json#19978-20121

## Conclusion
- **Service worker DISABLED** (no registration in runtime).

## Runtime impact
- No offline caching or background sync; app requires network for Supabase calls on each load.
- No risk of stale cached assets from a service worker.

## Compliance impact
- Reduced surface for cached personal data on device; data not persisted via service worker caches.
- If offline capabilities are required in future, enabling a service worker will need a privacy/retention review (cached PII, logouts, revocation handling).
