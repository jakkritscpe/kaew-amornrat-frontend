import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../types';
import { AuthContext } from './AuthContextObject';

const MOCK_USER: User = {
    id: '1',
    username: 'admin',
    name: 'แอดมิน ระบบ',
    role: 'admin',
};

export function AuthProvider({ children }: { children: ReactNode }) {
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

            if (username === 'admin') {
                setUser(MOCK_USER);
                localStorage.setItem('repairhub_user', JSON.stringify(MOCK_USER));
            } else {
                throw new Error('Invalid credentials');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('repairhub_user');
    };

    const value = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


