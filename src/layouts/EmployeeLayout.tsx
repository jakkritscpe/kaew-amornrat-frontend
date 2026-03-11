import { useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Clock, Map, History, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TOKEN_KEY, EMPLOYEE_KEY } from '@/lib/api-client';

const navItems = [
    { to: '/employee/attendance/today', icon: Clock, label: 'วันนี้' },
    { to: '/employee/attendance/map', icon: Map, label: 'แผนที่' },
    { to: '/employee/attendance/history', icon: History, label: 'ประวัติ' },
    { to: '/employee/attendance/ot-request', icon: FileText, label: 'ขอ OT' },
];

export function EmployeeLayout() {
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) navigate('/employee/login', { replace: true });
    }, [navigate]);

    const employeeRaw = localStorage.getItem(EMPLOYEE_KEY);
    const employee = employeeRaw ? JSON.parse(employeeRaw) : null;
    const initial = employee?.name?.charAt(0)?.toUpperCase() ?? '?';

    return (
        <div className="flex flex-col h-[100svh] bg-[#f1f5f9]">
            {/* ── Identity bar (inside blue hero of each page, so layout bar is minimal) ── */}
            <header className="shrink-0 bg-[#2075f8] px-4 pt-4 pb-2 max-w-lg mx-auto w-full flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-blue-200 uppercase tracking-widest">ระบบลงเวลา</p>
                    <p className="text-sm font-bold text-white leading-snug truncate mt-0.5">
                        {employee?.name ?? 'พนักงาน'}
                    </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-white/20 ring-2 ring-white/30 flex items-center justify-center text-white font-bold text-sm shrink-0 select-none">
                    {initial}
                </div>
            </header>

            {/* ── Page content ── */}
            <main className="flex-1 overflow-y-auto w-full max-w-lg mx-auto relative z-0">
                <Outlet />
            </main>

            {/* ── Bottom nav ── */}
            <div className="shrink-0 max-w-lg mx-auto w-full bg-white border-t border-gray-100 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <div className="flex justify-around px-2 py-1.5">
                    {navItems.map((item) => (
                        <NavLink key={item.to} to={item.to} className="flex-1 touch-manipulation">
                            {({ isActive }) => (
                                <div className={cn(
                                    'flex flex-col items-center gap-0.5 py-2 rounded-xl mx-0.5 transition-all duration-150',
                                    isActive ? 'bg-[#eef4ff]' : 'active:bg-gray-50'
                                )}>
                                    <item.icon className={cn(
                                        'w-5 h-5 transition-colors',
                                        isActive ? 'text-[#2075f8]' : 'text-gray-400'
                                    )} />
                                    <span className={cn(
                                        'text-[10px] font-semibold transition-colors',
                                        isActive ? 'text-[#2075f8]' : 'text-gray-400'
                                    )}>{item.label}</span>
                                </div>
                            )}
                        </NavLink>
                    ))}
                </div>
            </div>
        </div>
    );
}
