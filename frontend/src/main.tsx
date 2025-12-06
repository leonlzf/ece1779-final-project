import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import "./index.css";
import "./App.css";

import "./styles/theme.css";
import "./styles/ui.css";
import "./styles/shell.css";
import "./styles/auth.css";

import { AuthProvider } from "./auth/AuthContext";
import { ThemeProvider } from "./theme/ThemeProvider";
import { ToastProvider } from "./components/ui/ToastProvider";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <ThemeProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </ThemeProvider>
    </AuthProvider>
  </React.StrictMode>
);
