import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { AuthContext } from './AuthContextObject';
import { loginApi } from '../../../lib/api/auth-api';
import { setToken, clearToken, TOKEN_KEY } from '../../../lib/api-client';
import { decodeJwt } from '../../../lib/utils';

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Path 1: normal admin login → repairhub_user exists
        const storedUser = localStorage.getItem('repairhub_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem('repairhub_user');
            }
            setIsLoading(false);
            return;
        }

        // Path 2: admin/manager JWT token → decode and restore session
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            const payload = decodeJwt(token);
            const isValid = payload
                && typeof payload.exp === 'number'
                && Date.now() / 1000 < payload.exp;

            if (isValid) {
                const backendRole = payload!.role as string;
                if (backendRole === 'admin' || backendRole === 'manager') {
                    const adminUser: User = {
                        id: payload!.sub as string,
                        username: payload!.email as string,
                        name: payload!.name as string,
                        role: backendRole === 'admin' ? 'super_admin' : 'admin',
                        employeeId: payload!.sub as string,
                    };
                    setUser(adminUser);
                }
            }
        }

        setIsLoading(false);
    }, []);

    const loginWithCredentials = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const result = await loginApi(email, password);
            setToken(result.token);
            const loggedInUser: User = {
                id: result.user.id,
                username: result.user.email,
                name: result.user.name,
                role: result.user.role === 'admin' ? 'super_admin' : result.user.role === 'manager' ? 'admin' : 'technician',
                employeeId: result.user.id,
                accessibleMenus: result.user.accessibleMenus || [],
            };
            setUser(loggedInUser);
            localStorage.setItem('repairhub_user', JSON.stringify(loggedInUser));
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        clearToken();
        localStorage.removeItem('repairhub_user');
        localStorage.removeItem('attendance_employee');
    };

    // Update permissions for the currently logged-in user (local state only)
    const updateUserPermissions = (userId: string, targetMenus: string[]) => {
        if (user?.id !== userId) return;
        const updated = { ...user, accessibleMenus: targetMenus };
        setUser(updated);
        localStorage.setItem('repairhub_user', JSON.stringify(updated));
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
