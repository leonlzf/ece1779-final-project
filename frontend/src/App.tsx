import React from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import type { JSX } from "react";

import { useAuth } from "./auth/AuthContext";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import ViewerPage from "./pages/ViewerPage";

import { AppShell } from "./components/layout/AppShell";

function Private({ children }: { children: JSX.Element }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

const router = createBrowserRouter([
  { path: "/", element: <Navigate to="/dashboard" replace /> },

  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },

  {
    path: "/dashboard",
    element: (
      <Private>
        <DashboardPage />
      </Private>
    ),
  },

  // Keep your viewer route as-is; wrap in shell for consistent topbar.
  {
    path: "/files/:id",
    element: (
      <AppShell showSidebar={false}>
        <ViewerPage />
      </AppShell>
    ),
  },

  { path: "*", element: <Navigate to="/login" replace /> },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
