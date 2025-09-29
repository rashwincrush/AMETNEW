# iOS URL Scheme (Deep Link)

After `npx cap add ios` and `npx cap open ios`:

1. Select the App target in Xcode → Info → URL Types → +
2. Identifier: `ametnew`
3. URL Schemes: `ametnew`
4. Role: `Editor` (default), check `AMET Alumni Network` as target

This registers `ametnew://` scheme on iOS so the app can be opened by deep links such as `ametnew://auth-callback`.
