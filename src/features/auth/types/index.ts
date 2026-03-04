export interface User {
    id: string;
    username: string;
    name: string;
    role: 'admin' | 'technician';
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (username: string) => Promise<void>;
    logout: () => void;
}
