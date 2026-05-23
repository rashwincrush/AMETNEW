import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { MobileNavProvider } from "./components/Layout/MobileNavContext";
import { lockdownConsoleInProduction } from "./utils/logger";

// App.js already wraps the tree with <Router> and <AuthProvider>

// SECURITY: Completely disable console output in production
// This prevents exposure of sensitive data (UUIDs, emails, tokens, user data) in DevTools
lockdownConsoleInProduction();

// ACCESSIBILITY: Run axe-core checks in development to catch regressions
// Any accessibility violation found = regression, fix before deploying
if (process.env.NODE_ENV === 'development') {
  import('@axe-core/react').then(({ default: axe }) => {
    axe(React, ReactDOM, 1000, {
      rules: [
        // Critical for Phase 1 accessibility fixes
        { id: 'color-contrast', enabled: true },
        { id: 'aria-live-region-content', enabled: true },
        { id: 'aria-required-attr', enabled: true },
        { id: 'label', enabled: true },
        { id: 'table-duplicate-name', enabled: true },
        // Additional important rules
        { id: 'aria-roles', enabled: true },
        { id: 'aria-valid-attr-value', enabled: true },
        { id: 'button-name', enabled: true },
        { id: 'image-alt', enabled: true },
        { id: 'link-name', enabled: true },
        { id: 'list', enabled: true },
        { id: 'page-has-heading-one', enabled: true },
      ]
    });
    // eslint-disable-next-line no-console
    console.log('🔍 axe-core accessibility checker active in development');
    // eslint-disable-next-line no-console
    console.log('   Any accessibility violations will be logged to console');
    // eslint-disable-next-line no-console
    console.log('   Fix violations immediately - they indicate regressions');
  }).catch(err => {
    // eslint-disable-next-line no-console
    console.warn('⚠️  Failed to load axe-core:', err);
  });
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <MobileNavProvider>
      <App />
    </MobileNavProvider>
  </React.StrictMode>,
);
