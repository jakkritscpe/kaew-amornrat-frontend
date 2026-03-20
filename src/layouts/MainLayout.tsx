import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import Header from './Header';
import { useTranslation } from '@/i18n';
import { useAdminTheme } from '@/hooks/useAdminTheme';

export function MainLayout() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const location = useLocation();
    const { t } = useTranslation();
    const { dark, toggle: toggleTheme } = useAdminTheme();

    const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes('/settings')) return t('nav.settings');
        if (path.includes('/attendance/dashboard')) return t('admin.dashboard.title');
        if (path.includes('/attendance/logs')) return t('nav.attendanceLogs');
        if (path.includes('/attendance/employees')) return t('admin.employees.title');
        if (path.includes('/attendance/locations')) return t('admin.locations.title');
        if (path.includes('/attendance/ot-approvals')) return t('nav.otApprovals');
        if (path.includes('/attendance/ot-calculator')) return t('nav.otCalculator');
        if (path.includes('/attendance/reports')) return t('nav.reports');
        return t('nav.dashboard');
    };

    return (
        <div className={cn('min-h-screen transition-colors duration-300', dark ? 'dark bg-[#0f172a]' : 'bg-[#f8fafc]')}>
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                isMobileOpen={isMobileSidebarOpen}
                onMobileClose={() => setIsMobileSidebarOpen(false)}
                dark={dark}
                onToggleTheme={toggleTheme}
            />

            <div className={cn(
                'transition-all duration-300 min-h-screen flex flex-col',
                isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[260px]'
            )}>
                <Header
                    title={getPageTitle()}
                    onMenuClick={() => setIsMobileSidebarOpen(true)}
                    dark={dark}
                    onToggleTheme={toggleTheme}
                />

                <main className="flex-1 p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
