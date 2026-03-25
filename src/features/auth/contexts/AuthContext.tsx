import { useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { AuthContext } from './AuthContextObject';
import { loginApi, logoutApi, getMeApi } from '../../../lib/api/auth-api';
import { USER_KEY, EMPLOYEE_KEY } from '../../../lib/api-client';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    // Ref tracks whether user was authenticated — prevents redirect loop on initial load
    // (initial getMeApi() 401 = "not logged in", not "session expired")
    const userRef = useRef<User | null>(null);

    useEffect(() => {
        // Only redirect on 401 if user WAS authenticated (mid-session cookie expiry).
        // Without this guard, the initial getMeApi() call (which returns 401 when not
        // logged in) would trigger a redirect → reload → 401 → infinite loop.
        const handleUnauthorized = () => {
            if (!userRef.current) return;
            setUser(null);
            userRef.current = null;
            localStorage.removeItem(USER_KEY);
            localStorage.removeItem(EMPLOYEE_KEY);
            window.location.href = '/';
        };
        window.addEventListener('auth:unauthorized', handleUnauthorized);
        return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
    }, []);

    // Keep ref in sync with state so the event handler always sees the latest value
    useEffect(() => { userRef.current = user; }, [user]);

    useEffect(() => {
        // Restore session by calling /api/auth/me — uses HttpOnly cookie automatically.
        // No localStorage token needed.
        getMeApi()
            .then((u) => {
                const restored: User = {
                    id: u.id,
                    username: u.email,
                    name: u.name,
                    role: u.role === 'admin' ? 'super_admin' : u.role === 'manager' ? 'admin' : 'technician',
                    employeeId: u.id,
                    accessibleMenus: u.accessibleMenus || [],
                };
                // Only keep admin/manager sessions in this context (employees use EmployeeLayout)
                if (u.role === 'admin' || u.role === 'manager') {
                    setUser(restored);
                    localStorage.setItem(USER_KEY, JSON.stringify(restored));
                }
            })
            .catch(() => {
                // No valid session — clear any stale profile data
                localStorage.removeItem(USER_KEY);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const loginWithCredentials = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const result = await loginApi(email, password);
            const loggedInUser: User = {
                id: result.user.id,
                username: result.user.email,
                name: result.user.name,
                role: result.user.role === 'admin' ? 'super_admin' : result.user.role === 'manager' ? 'admin' : 'technician',
                employeeId: result.user.id,
                accessibleMenus: result.user.accessibleMenus || [],
            };
            setUser(loggedInUser);
            localStorage.setItem(USER_KEY, JSON.stringify(loggedInUser));
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try { await logoutApi(); } catch { /* ignore */ }
        setUser(null);
        localStorage.removeItem(USER_KEY);
        localStorage.removeItem('attendance_employee');
        window.location.href = '/';
    };

    // Update permissions for the currently logged-in user (local state only)
    const updateUserPermissions = (userId: string, targetMenus: string[]) => {
        if (user?.id !== userId) return;
        const updated = { ...user, accessibleMenus: targetMenus };
        setUser(updated);
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login: loginWithCredentials,
        loginWithCredentials,
        logout,
        updateUserPermissions,
        getAllAdmins: () => [] as User[],
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
