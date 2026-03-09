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
import { AttendanceProvider } from './features/attendance/contexts/AttendanceContext';
import { AdminAttendanceDashboard } from './features/attendance/pages/admin/AdminAttendanceDashboard';
import { AdminAttendanceLogs } from './features/attendance/pages/admin/AdminAttendanceLogs';
import { AdminEmployees } from './features/attendance/pages/admin/AdminEmployees';
import { AdminLocations } from './features/attendance/pages/admin/AdminLocations';
import { AdminOTApprovals } from './features/attendance/pages/admin/AdminOTApprovals';
import { AdminOTCalculator } from './features/attendance/pages/admin/AdminOTCalculator';
import { AdminReports } from './features/attendance/pages/admin/AdminReports';
import { EmployeeLayout } from './layouts/EmployeeLayout';
import { EmployeeToday } from './features/attendance/pages/employee/EmployeeToday';
import { EmployeeMap } from './features/attendance/pages/employee/EmployeeMap';
import { EmployeeHistory } from './features/attendance/pages/employee/EmployeeHistory';
import { EmployeeOTRequest } from './features/attendance/pages/employee/EmployeeOTRequest';
import { QRCheckInPage } from './features/attendance/pages/public/QRCheckInPage';
import { EmployeeLoginPage } from './features/auth/pages/EmployeeLoginPage';
import { QRLoginPage } from './features/auth/pages/QRLoginPage';

function App() {
  return (
    <AuthProvider>
      <RepairRequestProvider>
        <JobsProvider>
          <AttendanceProvider>
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

                  {/* Attendance Admin Routes */}
                  <Route path="attendance/dashboard" element={<AdminAttendanceDashboard />} />
                  <Route path="attendance/logs" element={<AdminAttendanceLogs />} />
                  <Route path="attendance/employees" element={<AdminEmployees />} />
                  <Route path="attendance/locations" element={<AdminLocations />} />
                  <Route path="attendance/ot-approvals" element={<AdminOTApprovals />} />
                  <Route path="attendance/ot-calculator" element={<AdminOTCalculator />} />
                  <Route path="attendance/reports" element={<AdminReports />} />
                </Route>
              </Route>

              {/* Employee Login */}
              <Route path="/employee/login" element={<EmployeeLoginPage />} />

              {/* Employee App Routes */}
              <Route path="/employee" element={<ProtectedRoute />}>
                <Route element={<EmployeeLayout />}>
                  <Route index element={<Navigate to="/employee/attendance/today" replace />} />
                  <Route path="attendance/today" element={<EmployeeToday />} />
                  <Route path="attendance/map" element={<EmployeeMap />} />
                  <Route path="attendance/history" element={<EmployeeHistory />} />
                  <Route path="attendance/ot-request" element={<EmployeeOTRequest />} />
                </Route>
              </Route>

              {/* QR Login - Public */}
              <Route path="/employee/qr-login/:token" element={<QRLoginPage />} />

              {/* Public QR Check-in Route */}
              <Route path="/qr-checkin/:employeeId" element={<QRCheckInPage />} />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </AttendanceProvider>
        </JobsProvider>
      </RepairRequestProvider>
    </AuthProvider>
  );
}

export default App;
