import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { PlatformProvider } from "./contexts/PlatformContext";
import { PortalLayout } from "./layouts/PortalLayout";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { ApplicationDetailPage } from "./pages/ApplicationDetailPage";
import { CitizenDashboardPage } from "./pages/CitizenDashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { MonitoringPage } from "./pages/MonitoringPage";
import { OfficerDashboardPage } from "./pages/OfficerDashboardPage";
import { SchemaMapperPage } from "./pages/SchemaMapperPage";
import { ServiceGraphPage } from "./pages/ServiceGraphPage";
import { ServicesPage } from "./pages/ServicesPage";

export default function App() {
  return (
    <PlatformProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<PortalLayout />}>
            <Route path="/citizen" element={<CitizenDashboardPage />} />
            <Route path="/citizen/services" element={<ServicesPage />} />
            <Route path="/citizen/applications" element={<ApplicationsPage />} />
            <Route path="/citizen/applications/:id" element={<ApplicationDetailPage />} />
            <Route path="/officer" element={<OfficerDashboardPage />} />
            <Route path="/officer/monitoring" element={<MonitoringPage />} />
            <Route path="/officer/service-graph" element={<ServiceGraphPage />} />
            <Route path="/admin/schema-mapper" element={<SchemaMapperPage />} />
          </Route>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </PlatformProvider>
  );
}
