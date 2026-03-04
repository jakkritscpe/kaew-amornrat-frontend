import { Outlet, NavLink } from 'react-router-dom';
import { Clock, Map, History, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmployeeLayout() {
    const navItems = [
        { to: '/employee/attendance/today', icon: Clock, label: 'วันนี้' },
        { to: '/employee/attendance/map', icon: Map, label: 'แผนที่' },
        { to: '/employee/attendance/history', icon: History, label: 'ประวัติ' },
        { to: '/employee/attendance/ot-request', icon: FileText, label: 'ขอ OT' },
    ];

    return (
        <div className="flex flex-col h-screen bg-gray-50 text-gray-900 pb-[env(safe-area-inset-bottom)]">
            {/* Header */}
            <header className="bg-blue-600 text-white px-4 py-4 shadow-md sticky top-0 z-20">
                <h1 className="text-xl font-bold">ระบบลงเวลาทำงาน</h1>
                <p className="text-blue-100 text-sm">ยินดีต้อนรับ, สมชาย พนักงาน</p>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto w-full max-w-lg mx-auto bg-white shadow-sm relative z-0">
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="bg-white border-t border-gray-200 sticky bottom-0 z-20 w-full max-w-lg mx-auto px-2 py-2 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            cn(
                                'flex flex-col items-center justify-center w-full py-2 px-1 rounded-xl transition-colors',
                                isActive ? 'text-blue-600' : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50'
                            )
                        }
                    >
                        <item.icon className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-medium">{item.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
    );
}
