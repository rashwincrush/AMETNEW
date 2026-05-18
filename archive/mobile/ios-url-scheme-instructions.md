# iOS URL Scheme (Deep Link)

After `npx cap add ios` and `npx cap open ios`:

1. Select the App target in Xcode → Info → URL Types → +
2. Identifier: `forgecirclenew`
3. URL Schemes: `forgecirclenew`
4. Role: `Editor` (default), check `Forgecircle Alumni Network` as target

This registers `forgecirclenew://` scheme on iOS so the app can be opened by deep links such as `forgecirclenew://auth-callback`.
