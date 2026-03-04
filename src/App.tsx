import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './features/auth/contexts/AuthContext';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { LoginPage } from './features/auth/pages/LoginPage';
import { RepairRequestProvider } from './features/repair-requests/contexts/RepairRequestContext';
import { JobsProvider } from './features/jobs/contexts/JobsContext';
import { MainLayout } from './layouts/MainLayout';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { RequestsPage } from './pages/RequestsPage';
import { TechniciansPage } from './pages/TechniciansPage';
import { SettingsPage } from './pages/SettingsPage';
import JobsPage from './features/jobs/components/JobsPage';
import DocumentPage from './features/jobs/pages/DocumentPage';

function App() {
  return (
    <AuthProvider>
      <RepairRequestProvider>
        <JobsProvider>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            <Route path="/admin" element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="requests" element={<RequestsPage />} />
                <Route path="jobs" element={<JobsPage />} />
                <Route path="jobs/:jobId/document" element={<DocumentPage />} />
                <Route path="technicians" element={<TechniciansPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </JobsProvider>
      </RepairRequestProvider>
    </AuthProvider>
  );
}

export default App;
