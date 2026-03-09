import { createContext } from 'react';
import type { AuthContextType } from '../types';

export const defaultContext: AuthContextType = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => { },
    loginWithCredentials: async () => { },
    logout: () => { },
};

export const AuthContext = createContext<AuthContextType>(defaultContext);
