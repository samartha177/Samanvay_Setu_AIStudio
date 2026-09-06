import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { PlatformProvider } from "./contexts/PlatformContext";
import { PortalLayout } from "./layouts/PortalLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ApplicationsPage } from "./pages/ApplicationsPage";
import { ApplicationDetailPage } from "./pages/ApplicationDetailPage";
import { CitizenDashboardPage } from "./pages/CitizenDashboardPage";
import { ConsentHistoryPage } from "./pages/ConsentHistoryPage";
import { LoginPage } from "./pages/LoginPage";
import { MonitoringPage } from "./pages/MonitoringPage";
import { OfficerApplicationsPage } from "./pages/OfficerApplicationsPage";
import { OfficerDashboardPage } from "./pages/OfficerDashboardPage";
import { SchemaMapperPage } from "./pages/SchemaMapperPage";
import { ServiceGraphPage } from "./pages/ServiceGraphPage";
import { ServicesPage } from "./pages/ServicesPage";

function RootRedirect() {
  const { isAuthenticated, role } = useAuth();
  if (!isAuthenticated || !role) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={role === "OFFICER" ? "/officer" : "/citizen"} replace />;
}

export default function App() {
  return (
    <PlatformProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Login Route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated Layout */}
            <Route element={<PortalLayout />}>
              {/* Citizen Routes */}
              <Route
                path="/citizen"
                element={
                  <ProtectedRoute allowedRoles={["CITIZEN"]}>
                    <CitizenDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/services"
                element={
                  <ProtectedRoute allowedRoles={["CITIZEN"]}>
                    <ServicesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/applications"
                element={
                  <ProtectedRoute allowedRoles={["CITIZEN"]}>
                    <ApplicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/citizen/consent-history"
                element={
                  <ProtectedRoute allowedRoles={["CITIZEN"]}>
                    <ConsentHistoryPage />
                  </ProtectedRoute>
                }
              />

              {/* Shared Application Detail Inspection */}
              <Route
                path="/citizen/applications/:id"
                element={
                  <ProtectedRoute allowedRoles={["CITIZEN", "OFFICER"]}>
                    <ApplicationDetailPage />
                  </ProtectedRoute>
                }
              />

              {/* Officer Routes */}
              <Route
                path="/officer"
                element={
                  <ProtectedRoute allowedRoles={["OFFICER"]}>
                    <OfficerDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/officer/applications"
                element={
                  <ProtectedRoute allowedRoles={["OFFICER"]}>
                    <OfficerApplicationsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/officer/monitoring"
                element={
                  <ProtectedRoute allowedRoles={["OFFICER"]}>
                    <MonitoringPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/monitoring"
                element={
                  <ProtectedRoute allowedRoles={["OFFICER"]}>
                    <MonitoringPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/officer/service-graph"
                element={
                  <ProtectedRoute allowedRoles={["OFFICER"]}>
                    <ServiceGraphPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/service-graph"
                element={
                  <ProtectedRoute allowedRoles={["OFFICER"]}>
                    <ServiceGraphPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/schema-mapper"
                element={
                  <ProtectedRoute allowedRoles={["OFFICER"]}>
                    <SchemaMapperPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/schemas"
                element={<Navigate to="/admin/schema-mapper" replace />}
              />
              <Route
                path="/citizen/officer"
                element={<Navigate to="/officer" replace />}
              />
            </Route>

            {/* Fallbacks */}
            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </PlatformProvider>
  );
}
