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
import { PermissionProvider, usePermission } from './contexts/PermissionContext';
import { TutorProvider } from './contexts/TutorContext';

function AppContent() {
  const { isAuthorized, loggedOut, userEmail, logout } = usePermission();

  if (loggedOut) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f4f6f8]">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-[#e6f0ff] flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#094cb2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#1d1d1f] mb-2">You've been signed out</h1>
          <p className="text-sm text-[#1d1d1f]/50 mb-6">Sign in again to continue.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white bg-[#094cb2] rounded-lg hover:bg-[#0741a3] transition-colors"
          >
            Sign in
          </button>
        </div>
      </div>
    );
  }

  if (isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f4f6f8]">
        <div className="text-sm text-[#1d1d1f]/40">Loading…</div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f4f6f8]">
        <div className="text-center max-w-sm">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3a9 9 0 100 18A9 9 0 0012 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-[#1d1d1f] mb-2">Access Not Granted</h1>
          <p className="text-sm text-[#1d1d1f]/50 mb-1">
            Your account <span className="font-medium text-[#1d1d1f]/70">{userEmail}</span> has not been added to this system.
          </p>
          <p className="text-sm text-[#1d1d1f]/40 mb-6">Please contact your administrator to request access.</p>
          <button
            onClick={logout}
            className="px-4 py-2 text-sm font-medium text-white bg-[#1d1d1f] rounded-lg hover:bg-black transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    );
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
