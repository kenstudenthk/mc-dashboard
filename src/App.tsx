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
import { PermissionProvider } from './contexts/PermissionContext';
import { TutorProvider } from './contexts/TutorContext';

export default function App() {
  return (
    <PermissionProvider>
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
              <Route path="/settings" element={<Settings />} />
              <Route path="/help" element={<Help />} />
            </Routes>
          </Layout>
        </Router>
      </TutorProvider>
    </PermissionProvider>
  );
}
