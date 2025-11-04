import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
// App.js already wraps the tree with <Router> and <AuthProvider>

// Production hardening: silence console in production
if (process.env.NODE_ENV === 'production') {
  try {
    const noop = () => {};
    const c = window.console || {};
    c.log = noop; c.debug = noop; c.info = noop; c.warn = noop; c.error = noop; c.group = noop; c.groupCollapsed = noop; c.groupEnd = noop; c.table = noop; c.trace = noop;
    window.console = c;
  } catch (_) {
    // no-op
  }
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
