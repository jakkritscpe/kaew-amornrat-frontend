import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { EmployeeNoSessionPage } from '../pages/EmployeeNoSessionPage';
import { TOKEN_KEY } from '../../../lib/api-client';

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
        const employeeToken = localStorage.getItem(TOKEN_KEY);
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
            const pathParts = location.pathname.split('/').filter(Boolean);
            if (pathParts[0] === 'admin' && pathParts.length > 1) {
                const featurePath = pathParts.slice(1).join('/');
                const allowed = user.accessibleMenus || [];
                const fallback = allowed.length > 0 ? `/admin/${allowed[0]}` : '/';

                // settings is super_admin only — always block admin
                if (featurePath === 'settings' || featurePath.startsWith('settings/')) {
                    return <Navigate to={fallback} replace />;
                }

                const hasAccess = allowed.some(menu => featurePath === menu || featurePath.startsWith(menu + '/'));
                if (!hasAccess) {
                    return <Navigate to={fallback} replace />;
                }
            }
        } else if (user.role !== 'super_admin') {
            return <Navigate to="/" replace />;
        }
    }

    return <Outlet />;
}
