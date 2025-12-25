# Tracker Cleanliness Report

Scope: posthog, i.posthog.com, eu.i.posthog.com, us.i.posthog.com, phc_, gtag, googletagmanager, google-analytics, ga(, gtag(, segment, mixpanel, amplitude, hotjar, logrocket, clarity, sentry, datadog, newrelic, fullstory, rudderstack, matomo, pixel, facebook, meta pixel.

## Matches (path + line)
- `frontend/public/index.html`: no tracker tags present. @frontend/public/index.html#1-44
- `frontend/src/components/Auth/EnhancedRegister.js`: “facebookId/facebook_id” fields only (profile data, not a pixel). @frontend/src/components/Auth/EnhancedRegister.js#53-231,#794-874,#1273-1283
- `frontend/src/components/common/ShareButtons.js`: Facebook/Twitter/LinkedIn share URLs; no pixels/scripts. @frontend/src/components/common/ShareButtons.js#2-12,#31-33
- `frontend/src/components/common/SocialShareButtons.js`: Facebook/Twitter/LinkedIn share URLs; no pixels/scripts. @frontend/src/components/common/SocialShareButtons.js#2-10,#26-27
- `frontend/src/utils/logger.js`: Comment mentions potential Sentry/LogRocket integration; not implemented. @frontend/src/utils/logger.js#13-17
- `frontend/package-lock.json`: contains `workbox-google-analytics` dependency only (no runtime usage). @frontend/package-lock.json#19978-19984,#20116-20121
- `package-lock.json` (root): same dependency trail only. @package-lock.json#20117-20121
- Docs/annex references to analytics or pixels are textual only (no runtime code). Example: @legal/annexes/ANNEX_SECURITY_MEASURES.md#1-63

## Frontend production HTML / runtime JS
- `frontend/public/index.html` contains no tracker scripts/snippets. @frontend/public/index.html#1-44
- Runtime JS: no tracker SDK initialization (no posthog/ga/gtag/segment/mixpanel/etc. functions). Matches are limited to social-share links and profile fields.

## Service worker / workbox-google-analytics
- `workbox-google-analytics` appears only as a dependency; no service worker registration found in source. @frontend/package-lock.json#19978-19984 · search `navigator.serviceWorker` returned none.
- No `serviceWorker.register`/`registerServiceWorker` usage in `frontend/src`. (repo search)
- `frontend/public/mockServiceWorker.js` is MSW dev artifact; not registered in prod.

## PASS/FAIL
- **PASS**: No third-party tracker loaded in production HTML or runtime JS. Dependency-only `workbox-google-analytics` is inert without a registered service worker.

## Recommendations
- Optionally remove `workbox-google-analytics` from dependencies to reduce noise and avoid accidental inclusion.
- Keep periodic scans in CI to prevent future tracker regressions.
