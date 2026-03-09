export interface User {
    id: string;
    username: string;
    name: string;
    role: 'super_admin' | 'admin' | 'technician';
    accessibleMenus?: string[];
    employeeId?: string;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string) => Promise<void>;
    loginWithCredentials: (email: string, password: string) => Promise<void>;
    logout: () => void;
    updateUserPermissions?: (userId: string, menus: string[]) => void;
    getAllAdmins?: () => User[];
}
