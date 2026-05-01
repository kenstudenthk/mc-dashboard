/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import OrderRegistry from "./pages/OrderRegistry";
import OrderDetails from "./pages/OrderDetails";
import NewOrder from "./pages/NewOrder";
import Customers from "./pages/Customers";
import CustomerProfile from "./pages/CustomerProfile";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Help from "./pages/Help";
import AuditLog from "./pages/AuditLog";
import QuickLinks from "./pages/QuickLinks";
import EmailTemplates from "./pages/EmailTemplates";
import Feedback from "./pages/Feedback";
import FeedbackNew from "./pages/FeedbackNew";
import Login from "./pages/Login";
import { PermissionProvider, usePermission } from "./contexts/PermissionContext";
import { TutorProvider } from "./contexts/TutorContext";

/** Wraps nested routes in the shared Layout shell. */
function LayoutWrapper() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function AppContent() {
  const { isAuthorized } = usePermission();

  // Still resolving session from storage — show a neutral loading state.
  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f4f6f8]">
        <div className="text-sm text-[#1d1d1f]/40">Loading…</div>
      </div>
    );
  }

  // Not signed in — only /login is accessible; everything else redirects there.
  if (isAuthorized === false) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Signed in — /login redirects to dashboard; all app routes are available.
  return (
    <TutorProvider>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route element={<LayoutWrapper />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/orders" element={<OrderRegistry />} />
          <Route path="/orders/new" element={<NewOrder />} />
          <Route path="/orders/:id" element={<OrderDetails />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:id" element={<CustomerProfile />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/quick-links" element={<QuickLinks />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/email-templates" element={<EmailTemplates />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
          <Route path="/feedback" element={<Feedback />} />
          <Route path="/feedback/new" element={<FeedbackNew />} />
        </Route>
      </Routes>
    </TutorProvider>
  );
}

export default function App() {
  return (
    <Router>
      <PermissionProvider>
        <AppContent />
      </PermissionProvider>
    </Router>
  );
}
