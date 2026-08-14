/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Layout } from './components/layout/Layout';
import { Page } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { ImportData } from './pages/ImportData';
import { Alerts } from './pages/Alerts';
import { Settings } from './pages/Settings';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');

  return (
    <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'import' && <ImportData />}
      {currentPage === 'alerts' && <Alerts />}
      {currentPage === 'settings' && <Settings />}
    </Layout>
  );
}

