import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import Sidebar from './Sidebar';
import Header from './Header';

export function MainLayout() {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const location = useLocation();

    const getPageTitle = () => {
        const path = location.pathname;
        if (path.includes('/settings')) return 'ตั้งค่า';
        if (path.includes('/attendance/dashboard')) return 'แดชบอร์ดลงเวลา';
        if (path.includes('/attendance/logs')) return 'ประวัติลงเวลา';
        if (path.includes('/attendance/employees')) return 'จัดการพนักงาน';
        if (path.includes('/attendance/locations')) return 'สถานที่ตั้ง (GPS)';
        if (path.includes('/attendance/ot-approvals')) return 'อนุมัติ OT';
        if (path.includes('/attendance/ot-calculator')) return 'คำนวณค่าล่วงเวลา';
        if (path.includes('/attendance/reports')) return 'รายงานการทำงาน';
        return 'แดชบอร์ด';
    };

    return (
        <div className="min-h-screen bg-[#f8fafc]">
            {/* Sidebar — CSS transform drawer, no hidden/block toggling */}
            <Sidebar
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                isMobileOpen={isMobileSidebarOpen}
                onMobileClose={() => setIsMobileSidebarOpen(false)}
            />

            {/* Main content — no margin on mobile, sidebar offset on desktop.
                ⚠️ IMPORTANT: must use static cn() strings, NOT template literals.
                Tailwind JIT cannot compile `lg:${variable}` at build time. */}
            <div className={cn(
                'transition-all duration-300 min-h-screen flex flex-col',
                isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-[260px]'
            )}>
                <Header
                    title={getPageTitle()}
                    onMenuClick={() => setIsMobileSidebarOpen(true)}
                />

                <main className="flex-1 p-4 lg:p-6">
                    <Outlet />
                </main>
            </div>

        </div>
    );
}
