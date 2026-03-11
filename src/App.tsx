import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './features/auth/contexts/AuthContext';
import { ProtectedRoute } from './features/auth/components/ProtectedRoute';
import { useAuth } from './features/auth/hooks/useAuth';
import { RepairRequestProvider } from './features/repair-requests/contexts/RepairRequestContext';
import { JobsProvider } from './features/jobs/contexts/JobsContext';
import { AttendanceProvider } from './features/attendance/contexts/AttendanceContext';

// Static imports for layouts and auth (always needed)
import { MainLayout } from './layouts/MainLayout';
import { EmployeeLayout } from './layouts/EmployeeLayout';
import { LoginPage } from './features/auth/pages/LoginPage';

// Lazy-loaded pages — each becomes its own chunk
const LandingPage = lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const RequestsPage = lazy(() => import('./pages/RequestsPage').then(m => ({ default: m.RequestsPage })));
const TechniciansPage = lazy(() => import('./pages/TechniciansPage').then(m => ({ default: m.TechniciansPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(m => ({ default: m.NotFoundPage })));
const JobsPage = lazy(() => import('./features/jobs/components/JobsPage'));
const DocumentPage = lazy(() => import('./features/jobs/pages/DocumentPage'));

// Attendance admin pages
const AdminAttendanceDashboard = lazy(() => import('./features/attendance/pages/admin/AdminAttendanceDashboard').then(m => ({ default: m.AdminAttendanceDashboard })));
const AdminAttendanceLogs = lazy(() => import('./features/attendance/pages/admin/AdminAttendanceLogs').then(m => ({ default: m.AdminAttendanceLogs })));
const AdminEmployees = lazy(() => import('./features/attendance/pages/admin/AdminEmployees').then(m => ({ default: m.AdminEmployees })));
const AdminLocations = lazy(() => import('./features/attendance/pages/admin/AdminLocations').then(m => ({ default: m.AdminLocations })));
const AdminOTApprovals = lazy(() => import('./features/attendance/pages/admin/AdminOTApprovals').then(m => ({ default: m.AdminOTApprovals })));
const AdminOTCalculator = lazy(() => import('./features/attendance/pages/admin/AdminOTCalculator').then(m => ({ default: m.AdminOTCalculator })));
const AdminReports = lazy(() => import('./features/attendance/pages/admin/AdminReports').then(m => ({ default: m.AdminReports })));

// Employee pages
const EmployeeLoginPage = lazy(() => import('./features/auth/pages/EmployeeLoginPage').then(m => ({ default: m.EmployeeLoginPage })));
const EmployeeToday = lazy(() => import('./features/attendance/pages/employee/EmployeeToday').then(m => ({ default: m.EmployeeToday })));
const EmployeeMap = lazy(() => import('./features/attendance/pages/employee/EmployeeMap').then(m => ({ default: m.EmployeeMap })));
const EmployeeHistory = lazy(() => import('./features/attendance/pages/employee/EmployeeHistory').then(m => ({ default: m.EmployeeHistory })));
const EmployeeOTRequest = lazy(() => import('./features/attendance/pages/employee/EmployeeOTRequest').then(m => ({ default: m.EmployeeOTRequest })));
const QRCheckInPage = lazy(() => import('./features/attendance/pages/public/QRCheckInPage').then(m => ({ default: m.QRCheckInPage })));
const QRLoginPage = lazy(() => import('./features/auth/pages/QRLoginPage').then(m => ({ default: m.QRLoginPage })));

function SmartAdminRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/admin/dashboard" replace />;
  if (user.role === 'super_admin') return <Navigate to="/admin/dashboard" replace />;
  const first = user.accessibleMenus?.[0];
  return <Navigate to={first ? `/admin/${first}` : '/admin/dashboard'} replace />;
}

function App() {
  return (
    <AuthProvider>
      <RepairRequestProvider>
        <JobsProvider>
          <AttendanceProvider>
            <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />

                <Route path="/admin" element={<ProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    <Route index element={<SmartAdminRedirect />} />
                    <Route path="dashboard" element={<DashboardPage />} />
                    <Route path="requests" element={<RequestsPage />} />
                    <Route path="jobs" element={<JobsPage />} />
                    <Route path="jobs/:jobId/document" element={<DocumentPage />} />
                    <Route path="technicians" element={<TechniciansPage />} />
                    <Route path="settings" element={<SettingsPage />} />

                    <Route path="attendance/dashboard" element={<AdminAttendanceDashboard />} />
                    <Route path="attendance/logs" element={<AdminAttendanceLogs />} />
                    <Route path="attendance/employees" element={<AdminEmployees />} />
                    <Route path="attendance/locations" element={<AdminLocations />} />
                    <Route path="attendance/ot-approvals" element={<AdminOTApprovals />} />
                    <Route path="attendance/ot-calculator" element={<AdminOTCalculator />} />
                    <Route path="attendance/reports" element={<AdminReports />} />
                  </Route>
                </Route>

                <Route path="/employee/login" element={<EmployeeLoginPage />} />

                <Route path="/employee" element={<ProtectedRoute />}>
                  <Route element={<EmployeeLayout />}>
                    <Route index element={<Navigate to="/employee/attendance/today" replace />} />
                    <Route path="attendance/today" element={<EmployeeToday />} />
                    <Route path="attendance/map" element={<EmployeeMap />} />
                    <Route path="attendance/history" element={<EmployeeHistory />} />
                    <Route path="attendance/ot-request" element={<EmployeeOTRequest />} />
                  </Route>
                </Route>

                <Route path="/employee/qr-login/:token" element={<QRLoginPage />} />
                <Route path="/qr-checkin/:employeeId" element={<QRCheckInPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Suspense>
          </AttendanceProvider>
        </JobsProvider>
      </RepairRequestProvider>
    </AuthProvider>
  );
}

export default App;
