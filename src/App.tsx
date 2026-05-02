/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import OrderRegistry from './pages/OrderRegistry';
import OrderDetails from './pages/OrderDetails';
import NewOrder from './pages/NewOrder';
import Customers from './pages/Customers';
import CustomerProfile from './pages/CustomerProfile';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Help from './pages/Help';
import AuditLog from './pages/AuditLog';
import QuickLinks from './pages/QuickLinks';
import EmailTemplates from './pages/EmailTemplates';
import Feedback from './pages/Feedback';
import FeedbackNew from './pages/FeedbackNew';
import Login from './pages/Login';
import { PermissionProvider, usePermission } from './contexts/PermissionContext';
import { TutorProvider } from './contexts/TutorContext';

function AppContent() {
  const { isAuthorized, loggedOut, forcePasswordChange, isPasswordRecovery, userEmail, clearPasswordRecovery } = usePermission();

  // User needs to (re-)authenticate
  if (loggedOut) {
    return <Login initialScreen="login" />;
  }

  // User clicked a password reset link
  if (isPasswordRecovery) {
    return <Login initialScreen="reset-password" onSuccess={clearPasswordRecovery} />;
  }

  // User is signed in but must set a new password before accessing the app
  if (forcePasswordChange) {
    return <Login initialScreen="change-password" initialEmail={userEmail} />;
  }

  // Session is being verified / permissions are loading
  if (isAuthorized === null) {
    return <Login initialScreen="loading" />;
  }

  // Session exists but email is not in the SharePoint permissions list
  if (isAuthorized === false) {
    return <Login initialScreen="access-denied" />;
  }

  return (
    <TutorProvider>
      <Router>
        <Layout>
          <Routes>
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
          </Routes>
        </Layout>
      </Router>
    </TutorProvider>
  );
}

export default function App() {
  return (
    <PermissionProvider>
      <AppContent />
    </PermissionProvider>
  );
}
