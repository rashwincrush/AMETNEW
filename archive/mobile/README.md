# AMET Mobile (Capacitor)

This folder contains the Capacitor wrapper for the existing React + Supabase web app in `frontend/`.

- Web build directory used by Capacitor: `../frontend/build`
- App ID: `com.amet.alumni`
- App Name: `AMET Alumni Network`

## Prerequisites
- Node 18+
- Xcode (for iOS)
- Android Studio + SDK (for Android)

## 1) Install dependencies
From this `mobile/` folder:

```
npm install
```

## 2) Build the web app for production
From repo root:

```
# Build the React web app (outputs to frontend/build)
npm run build --prefix frontend
```

## 3) Add platforms and sync
From `mobile/`:

```
# Add iOS and Android projects (run once)
npx cap add ios
npx cap add android

# Copy the latest web build into native projects
npx cap copy
```

Optional live dev (serve web on localhost:3000 and load in native):
```
# In another terminal, serve the web app
yarn --cwd ../frontend start  # or: npm start --prefix ../frontend

# Update server URL for dev (see notes below) and then
npx cap open ios
npx cap open android
```

## 4) OAuth deep linking (Supabase)
Allowed redirect URLs to configure in Supabase Dashboard → Authentication → URL Configuration:

- `capacitor://localhost`
- `http://localhost`
- `ametnew://auth-callback`

The web app code already chooses the redirect automatically:
- Web: `window.location.origin + '/auth/callback'`
- Native (Capacitor): `capacitor://localhost`

This is implemented in `frontend/src/utils/supabase.js` via `getOAuthRedirectTo()`.

### iOS deep link configuration
After running `npx cap add ios`, open Xcode (`npx cap open ios`) and:

1. Select the iOS app target → Info → URL Types → Add URL Type
   - Identifier: `ametnew`
   - URL Schemes: `ametnew`
2. In Signing & Capabilities, ensure Associated Domains are not required (not using Universal Links now).
3. Build and run. OAuth will bounce out to the system browser and return to the app.

### Android deep link configuration
After running `npx cap add android`, edit `android/app/src/main/AndroidManifest.xml` and add this inside the `<activity android:name="com.getcapacitor.BridgeActivity" ...>` element:

```xml
<intent-filter android:autoVerify="true">
  <action android:name="android.intent.action.VIEW" />
  <category android:name="android.intent.category.DEFAULT" />
  <category android:name="android.intent.category.BROWSABLE" />
  <data android:scheme="ametnew" android:host="auth-callback" />
</intent-filter>
```

Note: The app currently uses `capacitor://localhost` as the OAuth redirect on native. The custom scheme above is pre-configured for future use and store compliance, but not required to sign in.

## 5) App icon and splash
Placeholders live in `mobile/resources/`. Replace with real assets later and run `npx @capacitor/assets generate` from `mobile/`:

```
npm install -D @capacitor/assets
npx capacitor-assets generate --iconBackgroundColor "#0F62FE" --splashBackgroundColor "#FFFFFF"
```

Resources used:
- Icon source: `mobile/resources/icon.png` (1024x1024)
- Splash source: `mobile/resources/splash.png` (2048x2048 or 2732x2732)

## 6) Build release
iOS:
- Open Xcode: `npx cap open ios`
- Set Bundle Identifier to `com.amet.alumni`
- Set signing team
- Product → Archive → Distribute via App Store Connect (TestFlight/Test)

Android:
- Open Android Studio: `npx cap open android`
- Build → Generate Signed Bundle / APK → Android App Bundle (AAB)
- Create or use an existing keystore
- Update `android/gradle.properties` with signing configs if needed

## Notes on dev server
For live reload during development, you can temporarily set a dev server URL in `capacitor.config.ts`:

```ts
server: {
  url: 'http://localhost:3000',
  cleartext: true
}
```

Remember to remove the `url` (or revert to production `webDir`) before making release builds.
