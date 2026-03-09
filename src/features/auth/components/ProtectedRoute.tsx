import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { EmployeeNoSessionPage } from '../pages/EmployeeNoSessionPage';

export function ProtectedRoute() {
    const { user, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2075f8]"></div>
            </div>
        );
    }

    // For employee routes - check attendance_token directly (QR-based login)
    if (location.pathname.startsWith('/employee')) {
        const employeeToken = localStorage.getItem('attendance_token');
        if (!employeeToken) {
            return <EmployeeNoSessionPage />;
        }
        return <Outlet />;
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" replace />;
    }

    // Role-Based Access Control (RBAC) Route Guards
    if (location.pathname.startsWith('/admin')) {
        if (user.role === 'admin') {
            const allowed = user.accessibleMenus || [];

            // Extract the base path after /admin/
            const pathParts = location.pathname.split('/').filter(Boolean);
            if (pathParts[0] === 'admin' && pathParts.length > 1) {
                const featurePath = pathParts.slice(1).join('/'); // e.g. 'requests' or 'attendance/dashboard'

                // Allow access if it's the dashboard by default, or if it matches allowed menus
                const hasAccess = featurePath === 'dashboard' || allowed.some(menu => featurePath === menu || featurePath.startsWith(menu + '/'));

                if (!hasAccess) {
                    return <Navigate to="/admin/dashboard" replace />;
                }
            }
        } else if (user.role !== 'super_admin') {
            // Block non-admins from /admin routes entirely
            return <Navigate to="/" replace />;
        }
    }

    return <Outlet />;
}
