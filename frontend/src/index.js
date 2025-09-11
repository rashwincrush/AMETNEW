import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
// App.js already wraps the tree with <Router> and <AuthProvider>

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
