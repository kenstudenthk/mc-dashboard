/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import OrderRegistry from './pages/OrderRegistry';
import OrderDetails from './pages/OrderDetails';
import NewOrder from './pages/NewOrder';
import Customers from './pages/Customers';
import CustomerProfile from './pages/CustomerProfile';
import ServiceCatalog from './pages/ServiceCatalog';
import ServiceDetails from './pages/ServiceDetails';
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
            <Route path="/" element={<ProtectedRoute resourceKey="Dashboard" resourceName="Dashboard"><Dashboard /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute resourceKey="Orders" resourceName="Orders"><OrderRegistry /></ProtectedRoute>} />
            <Route path="/orders/new" element={<ProtectedRoute resourceKey="NewOrder" resourceName="New Order"><NewOrder /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute resourceKey="OrderDetails" resourceName="Order Details"><OrderDetails /></ProtectedRoute>} />
            <Route path="/customers" element={<ProtectedRoute resourceKey="Customers" resourceName="Customers"><Customers /></ProtectedRoute>} />
            <Route path="/customers/:id" element={<ProtectedRoute resourceKey="CustomerProfile" resourceName="Customer Profile"><CustomerProfile /></ProtectedRoute>} />
            <Route path="/services" element={<ProtectedRoute resourceKey="ServiceCatalog" resourceName="Service Catalog"><ServiceCatalog /></ProtectedRoute>} />
            <Route path="/services/:id" element={<ProtectedRoute resourceKey="ServiceDetails" resourceName="Service Details"><ServiceDetails /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute resourceKey="Reports" resourceName="Reports"><Reports /></ProtectedRoute>} />
            <Route path="/quick-links" element={<ProtectedRoute resourceKey="QuickLinks" resourceName="Quick Links"><QuickLinks /></ProtectedRoute>} />
            <Route path="/audit-log" element={<ProtectedRoute resourceKey="AuditLog" resourceName="Audit Log"><AuditLog /></ProtectedRoute>} />
            <Route path="/email-templates" element={<ProtectedRoute resourceKey="EmailTemplates" resourceName="Email Templates"><EmailTemplates /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute resourceKey="Settings" resourceName="Settings"><Settings /></ProtectedRoute>} />
            <Route path="/settings/permissions" element={<ProtectedRoute resourceType="Function" resourceKey="Settings.Permissions" action="Manage" resourceName="Permission Settings"><Settings /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute resourceKey="Help" resourceName="Help"><Help /></ProtectedRoute>} />
            <Route path="/feedback" element={<ProtectedRoute resourceKey="Feedback" resourceName="Feedback"><Feedback /></ProtectedRoute>} />
            <Route path="/feedback/new" element={<ProtectedRoute resourceKey="FeedbackNew" resourceName="New Feedback"><FeedbackNew /></ProtectedRoute>} />
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
