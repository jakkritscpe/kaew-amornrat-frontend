import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import React from 'react';

const STORAGE_KEY = 'dashboard_theme';

interface AdminThemeContextType {
  dark: boolean;
  toggle: () => void;
}

const AdminThemeContext = createContext<AdminThemeContextType>({ dark: false, toggle: () => {} });

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(() => localStorage.getItem(STORAGE_KEY) === 'dark');

  const toggle = useCallback(() => {
    setDark(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
      return next;
    });
  }, []);

  return React.createElement(AdminThemeContext.Provider, { value: { dark, toggle } }, children);
}

export function useAdminTheme() {
  return useContext(AdminThemeContext);
}
