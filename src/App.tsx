/**
 * @license
 * SPDX-License-Identifier: MIT
 */

import { useState, useEffect } from "react";
import { AppShell, PageId } from "./components/marea/AppShell";
import { Overview } from "./pages/Overview";
import { Monitoring } from "./pages/Monitoring";
import { Alerts } from "./pages/Alerts";
import { Sensors } from "./pages/Sensors";
import { Analytics } from "./pages/Analytics";
import { Research } from "./pages/Research";
import { ImportData } from "./pages/ImportData";
import { Settings } from "./pages/Settings";
import { getAlerts, DATA_UPDATE_EVENT } from "./lib/db";

export default function App() {
  const [currentPage, setCurrentPage] = useState<PageId>("overview");
  const [unreadAlertCount, setUnreadAlertCount] = useState(0);

  useEffect(() => {
    const updateAlertCount = () => {
      const alerts = getAlerts();
      setUnreadAlertCount(alerts.filter((a) => !a.acknowledged).length);
    };

    updateAlertCount();
    window.addEventListener(DATA_UPDATE_EVENT, updateAlertCount);
    return () => window.removeEventListener(DATA_UPDATE_EVENT, updateAlertCount);
  }, []);

  return (
    <AppShell
      currentPage={currentPage}
      onNavigate={setCurrentPage}
      unreadAlertCount={unreadAlertCount}
    >
      {currentPage === "overview" && <Overview onNavigate={setCurrentPage} />}
      {currentPage === "monitoring" && <Monitoring onNavigate={setCurrentPage} />}
      {currentPage === "alerts" && <Alerts onNavigate={setCurrentPage} />}
      {currentPage === "sensors" && <Sensors onNavigate={setCurrentPage} />}
      {currentPage === "import" && <ImportData onNavigate={setCurrentPage} />}
      {currentPage === "analytics" && <Analytics onNavigate={setCurrentPage} />}
      {currentPage === "research" && <Research onNavigate={setCurrentPage} />}
      {currentPage === "settings" && <Settings onNavigate={setCurrentPage} />}
    </AppShell>
  );
}
