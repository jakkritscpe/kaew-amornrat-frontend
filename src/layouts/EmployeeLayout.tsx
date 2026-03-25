import { useEffect, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Clock, Map, History, FileText, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EMPLOYEE_KEY } from '@/lib/api-client';
import { logoutApi } from '@/lib/api/auth-api';
import { useTranslation } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

export function EmployeeLayout() {
    const { t } = useTranslation();
    const [loggingOut, setLoggingOut] = useState(false);

    const navItems = [
        { to: '/employee/attendance/today', icon: Clock, label: t('nav.today') },
        { to: '/employee/attendance/map', icon: Map, label: t('nav.map') },
        { to: '/employee/attendance/history', icon: History, label: t('nav.history') },
        { to: '/employee/attendance/ot-request', icon: FileText, label: t('nav.otRequest') },
    ];
    const navigate = useNavigate();

    useEffect(() => {
        if (!localStorage.getItem(EMPLOYEE_KEY)) navigate('/employee/login', { replace: true });
    }, [navigate]);

    const employeeRaw = localStorage.getItem(EMPLOYEE_KEY);
    const employee = employeeRaw ? JSON.parse(employeeRaw) : null;
    const initial = employee?.name?.charAt(0)?.toUpperCase() ?? '?';

    const handleLogout = async () => {
        setLoggingOut(true);
        try { await logoutApi(); } catch { /* ignore */ }
        localStorage.removeItem(EMPLOYEE_KEY);
        navigate('/employee/login', { replace: true });
    };

    return (
        <div className="flex flex-col h-[100svh] bg-[#f1f5f9] overflow-hidden">
            {/* ── Identity bar ── */}
            <header className="shrink-0 bg-[#044F88] px-4 pt-4 pb-2 max-w-lg md:max-w-3xl mx-auto w-full flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[10px] font-semibold text-[#044F88]/80 uppercase tracking-widest">{t('employee.layout.attendanceSystem')}</p>
                    <p className="text-sm font-bold text-white leading-snug truncate mt-0.5">
                        {employee?.name ?? t('employee.layout.employee')}
                    </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <LanguageSwitcher />
                    <div className="w-9 h-9 rounded-xl bg-white/20 ring-2 ring-white/30 flex items-center justify-center text-white font-bold text-sm select-none">
                        {initial}
                    </div>
                    <button
                        onClick={handleLogout}
                        disabled={loggingOut}
                        className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center transition-colors touch-manipulation"
                        title={t('nav.logout')}
                        aria-label={t('nav.logout')}
                    >
                        <LogOut className="w-4 h-4 text-white/80" />
                    </button>
                </div>
            </header>

            {/* ── Page content ── */}
            <main className="flex-1 overflow-y-auto overscroll-contain w-full max-w-lg md:max-w-3xl mx-auto relative z-0">
                <Outlet />
            </main>

            {/* ── Bottom nav ── */}
            <div className="shrink-0 max-w-lg md:max-w-3xl mx-auto w-full bg-white border-t border-gray-100 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]"
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
                <div className="flex justify-around px-2 py-1.5">
                    {navItems.map((item) => (
                        <NavLink key={item.to} to={item.to} className="flex-1 touch-manipulation">
                            {({ isActive }) => (
                                <div className={cn(
                                    'flex flex-col items-center gap-0.5 py-2 rounded-xl mx-0.5 transition-all duration-150',
                                    isActive ? 'bg-[#044F88]/10' : 'active:bg-gray-50'
                                )}>
                                    <item.icon className={cn(
                                        'w-5 h-5 transition-colors',
                                        isActive ? 'text-[#044F88]' : 'text-gray-400'
                                    )} />
                                    <span className={cn(
                                        'text-[10px] font-semibold transition-colors',
                                        isActive ? 'text-[#044F88]' : 'text-gray-400'
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
