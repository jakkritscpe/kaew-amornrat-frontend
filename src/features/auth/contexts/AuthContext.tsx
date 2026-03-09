import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { AuthContext } from './AuthContextObject';
import { loginApi } from '../../../lib/api/auth-api';
import { setToken, clearToken } from '../../../lib/api-client';

// Mock database of users
const INITIAL_USERS: User[] = [
    {
        id: '1',
        username: 'superadmin',
        name: 'Super Admin',
        role: 'super_admin',
        accessibleMenus: [], // super_admin has access to everything by default
    },
    {
        id: '2',
        username: 'admin',
        name: 'แอดมิน ระบบ',
        role: 'admin',
        accessibleMenus: [
            'attendance/employees',
            'attendance/logs',
            'attendance/locations',
            'attendance/ot-approvals',
            'attendance/ot-calculator'
        ],
    }
];

// const fullAccessibleMenus = [
//     // 📊 หมวดหมู่หลัก
//     'dashboard',             // แดชบอร์ดหลัก
//     'requests',              // รายการแจ้งซ่อม
//     'jobs',                  // ระบบใบงาน
//     'technicians',           // ทีมช่าง
//     'settings',              // ตั้งค่าระบบ

//     // ⏱️ หมวดหมู่ระบบลงเวลาทำงาน (Attendance)
//     'attendance/dashboard',  // แดชบอร์ดลงเวลา
//     'attendance/logs',       // ประวัติลงเวลา
//     'attendance/employees',  // จัดการพนักงาน (ลงเวลา)
//     'attendance/locations',  // สถานที่ (GPS)
//     'attendance/ot-approvals', // อนุมัติ OT
//     'attendance/reports'     // รายงานเวลาทำงาน
// ];

export function AuthProvider({ children }: { children: ReactNode }) {
    const [mockUsers, setMockUsers] = useState<User[]>(INITIAL_USERS);
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check local storage on mount
        const storedUser = localStorage.getItem('repairhub_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                console.error('Failed to parse stored user', e);
                localStorage.removeItem('repairhub_user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (username: string) => {
        setIsLoading(true);
        try {
            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 800));

            const foundUser = mockUsers.find(u => u.username === username);

            if (foundUser) {
                setUser(foundUser);
                localStorage.setItem('repairhub_user', JSON.stringify(foundUser));
            } else {
                throw new Error('Invalid credentials');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const loginWithCredentials = async (email: string, password: string) => {
        setIsLoading(true);
        try {
            const result = await loginApi(email, password);
            setToken(result.token);
            const user: User = {
                id: result.user.id,
                username: result.user.email,
                name: result.user.name,
                role: result.user.role === 'admin' ? 'admin' : 'technician',
                employeeId: result.user.id,
            };
            setUser(user);
            localStorage.setItem('repairhub_user', JSON.stringify(user));
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

    const updateUserPermissions = (userId: string, targetMenus: string[]) => {
        setMockUsers(prev => {
            const updatedUsers = prev.map(u =>
                u.id === userId ? { ...u, accessibleMenus: targetMenus } : u
            );

            // If the updated user is the currently logged-in user, refresh their session
            if (user?.id === userId) {
                const refreshedUser = updatedUsers.find(u => u.id === userId);
                if (refreshedUser) {
                    setUser(refreshedUser);
                    localStorage.setItem('repairhub_user', JSON.stringify(refreshedUser));
                }
            }
            return updatedUsers;
        });
    };

    const getAllAdmins = () => {
        return mockUsers.filter(u => u.role === 'admin' || u.role === 'super_admin');
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithCredentials,
        logout,
        updateUserPermissions,
        getAllAdmins
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


