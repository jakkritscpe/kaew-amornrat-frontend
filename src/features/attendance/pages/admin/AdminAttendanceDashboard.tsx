import { useState, useRef, useEffect } from 'react';
import { useAttendance } from '../../contexts/useAttendance';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Users, Clock, AlertTriangle, FileCheck2, CalendarX, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, formatTime } from '@/lib/utils';
import { useTranslation } from '@/i18n';

gsap.registerPlugin(ScrollTrigger);

// STATUS_LABEL is now derived from t() inside the component

// ═══════════════════════════════════════════
// ── STAT CARD (matches Dashboard StatsGrid)
// ═══════════════════════════════════════════
interface StatCardProps {
    title: string;
    value: number;
    suffix?: string;
    icon: React.ElementType;
    color: string;
    delay: number;
    href?: string;
    inspectLabel?: string;
}

function StatCard({ title, value, suffix, icon: Icon, color, delay, href, inspectLabel }: StatCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(cardRef.current,
                { rotateX: 90, opacity: 0, transformOrigin: 'center bottom' },
                { rotateX: 0, opacity: 1, duration: 0.35, delay, ease: 'power3.out' }
            );
            const counter = { val: 0 };
            gsap.to(counter, {
                val: value,
                duration: 0.6,
                delay: delay + 0.1,
                ease: 'expo.out',
                onUpdate: () => setDisplayValue(Math.round(counter.val))
            });
            gsap.fromTo(cardRef.current?.querySelector('.stat-icon') ?? null,
                { rotate: -180, scale: 0 },
                { rotate: 0, scale: 1, duration: 0.35, delay: delay + 0.15, ease: 'back.out(1.7)' }
            );
        });
        return () => ctx.revert();
    }, [value, delay]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        gsap.to(card, {
            rotateX: (y - rect.height / 2) / 10,
            rotateY: (rect.width / 2 - x) / 10,
            transformPerspective: 1000,
            duration: 0.3,
            ease: 'power2.out'
        });
    };
    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        gsap.to(e.currentTarget, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power2.out' });
    };

    const CardContent = (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={cn(
                'relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-full',
                'hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300',
                'cursor-pointer overflow-hidden group',
                href && 'hover:border-[#044F88]'
            )}
            style={{ transformStyle: 'preserve-3d' }}
        >
            {/* Glossy sheen effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex items-start justify-between relative z-10 h-full">
                <div className="flex flex-col h-full justify-between">
                    <div>
                        <p className="text-sm text-[#6f6f6f] mb-1">{title}</p>
                        <span className="text-3xl font-bold text-[#1d1d1d] tabular-nums leading-none">
                            {displayValue.toLocaleString()}
                        </span>
                        <p className="text-sm text-gray-400 mt-2">{suffix}</p>
                    </div>
                    {href && inspectLabel && (
                        <div className="mt-4 flex items-center text-sm font-medium text-[#044F88] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                            {inspectLabel} <ArrowRight className="w-4 h-4 ml-1" />
                        </div>
                    )}
                </div>
                <div className={cn('stat-icon w-12 h-12 rounded-xl flex items-center justify-center shrink-0', color)}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );

    if (href) {
        return <Link to={href} className="block outline-none">{CardContent}</Link>;
    }
    return CardContent;
}

export function AdminAttendanceDashboard() {
    const { t } = useTranslation();
    const { employees, logs, otRequests } = useAttendance();

    const STATUS_LABEL: Record<string, string> = {
        present: t('status.present'),
        late: t('status.late'),
        absent: t('status.absent'),
    };
    const containerRef = useRef<HTMLDivElement>(null);
    const todayDate = new Date().toISOString().split('T')[0];

    const todayLogs = logs.filter(l => l.date === todayDate);
    const totalEmployees = employees.length;

    const presentCount = todayLogs.filter(l => l.status === 'present').length;
    const lateCount = todayLogs.filter(l => l.status === 'late').length;
    const absentCount = totalEmployees - presentCount - lateCount;

    const pendingOTs = otRequests.filter(req => req.status === 'pending').length;

    const [y, m, d] = todayDate.split('-');
    const displayDate = `${parseInt(d)} / ${parseInt(m)} / ${parseInt(y) + 543}`;

    // GSAP section entrance (same as Dashboard)
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.dashboard-section',
                { y: 20, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 0.3, stagger: 0.07, ease: 'power3.out',
                    scrollTrigger: { trigger: containerRef.current, start: 'top 80%', toggleActions: 'play none none none' },
                }
            );

            gsap.fromTo('.log-row',
                { x: -20, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.2, stagger: 0.03, ease: 'power2.out', delay: 0.25 }
            );
        });
        return () => ctx.revert();
    }, [todayLogs.length]);

    return (
        <div ref={containerRef} className="space-y-6">
            {/* ── Page header ── */}
            <div className="dashboard-section flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1d1d1d] tracking-tight">{t('admin.dashboard.title')}</h1>
                    <p className="text-sm text-[#6f6f6f] mt-1">{t('admin.dashboard.subtitle')}</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-2 w-max">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-semibold text-[#1d1d1d]">{displayDate}</span>
                </div>
            </div>

            {/* ── Stats grid (Match Dashboard) ── */}
            <div className="dashboard-section grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ perspective: '1000px' }}>
                <StatCard
                    title={t('admin.dashboard.statPresent')} value={presentCount} suffix={t('common.person')} icon={Users}
                    color="bg-gradient-to-br from-emerald-500 to-teal-500" delay={0.05}
                />
                <StatCard
                    title={t('admin.dashboard.statLate')} value={lateCount} suffix={t('common.person')} icon={Clock}
                    color="bg-gradient-to-br from-amber-500 to-orange-500" delay={0.1}
                />
                <StatCard
                    title={t('admin.dashboard.statAbsent')} value={absentCount} suffix={t('common.person')} icon={AlertTriangle}
                    color="bg-gradient-to-br from-red-500 to-rose-500" delay={0.15}
                />
                <StatCard
                    title={t('admin.dashboard.statPendingOT')} value={pendingOTs} suffix={t('common.items')} icon={FileCheck2}
                    color="bg-gradient-to-br from-[#044F88] to-[#00223A]" delay={0.2}
                    href="/admin/attendance/ot-approvals"
                    inspectLabel={t('admin.dashboard.inspect')}
                />
            </div>

            {/* ── Recent Check-ins Table (Matches RequestsTable) ── */}
            <div className="dashboard-section bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-lg font-semibold text-[#1d1d1d]">{t('admin.dashboard.recentCheckIns')}</h2>
                        <p className="text-sm text-[#6f6f6f] mt-0.5">{t('admin.dashboard.recentCheckInsSubtitle')}</p>
                    </div>
                    <Link to="/admin/attendance/logs" className="hidden sm:flex items-center text-sm font-medium text-[#044F88] hover:text-[#00223A] transition-colors group">
                        {t('admin.dashboard.viewAllHistory')} <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-gray-50/50 text-[#6f6f6f] text-xs uppercase tracking-wider font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">{t('admin.dashboard.employee')}</th>
                                <th className="px-6 py-4 hidden sm:table-cell">{t('admin.dashboard.department')}</th>
                                <th className="px-6 py-4">{t('admin.dashboard.checkIn')}</th>
                                <th className="px-6 py-4">{t('admin.dashboard.checkOut')}</th>
                                <th className="px-6 py-4">{t('admin.dashboard.status')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {todayLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                                                <CalendarX className="w-8 h-8 text-gray-300" />
                                            </div>
                                            <p className="text-[#1d1d1d] font-semibold text-lg mb-1">{t('admin.dashboard.noDataToday')}</p>
                                            <p className="text-[#6f6f6f] text-sm">{t('admin.dashboard.noDataTodayHint')}</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                todayLogs.map(log => {
                                    const emp = employees.find(e => e.id === log.employeeId);
                                    return (
                                        <tr key={log.id} className="log-row hover:bg-[#044F88]/30 transition-colors duration-300 group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    {emp?.avatarUrl ? (
                                                        <img
                                                            src={emp.avatarUrl}
                                                            alt={emp.name}
                                                            className="w-10 h-10 rounded-full object-cover shrink-0 bg-[#044F88]/5 ring-2 ring-white shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#044F88] to-[#00223A] flex items-center justify-center text-white text-sm font-bold shrink-0 ring-2 ring-white shadow-sm">
                                                            {emp?.name.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-[#1d1d1d] group-hover:text-[#044F88] transition-colors">{emp?.name || t('admin.dashboard.unknownName')}</p>
                                                        {emp?.nickname && <p className="text-xs text-[#6f6f6f]">({emp.nickname})</p>}
                                                        <p className="text-xs text-[#6f6f6f] sm:hidden mt-0.5">{emp?.department}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[#6f6f6f] hidden sm:table-cell">{emp?.department}</td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-[#1d1d1d] tabular-nums">{formatTime(log.checkInTime)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-[#6f6f6f] tabular-nums">{formatTime(log.checkOutTime)}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn(
                                                    'inline-flex px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase',
                                                    log.status === 'present' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' :
                                                        log.status === 'late' ? 'bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20' :
                                                            'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'
                                                )}>
                                                    {STATUS_LABEL[log.status] || log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile view history button */}
                {todayLogs.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 sm:hidden">
                        <Link to="/admin/attendance/logs" className="flex justify-center items-center w-full text-sm font-medium text-[#044F88] bg-white border border-[#044F88]/10 hover:border-[#044F88]/20 hover:bg-[#044F88]/5/50 rounded-xl py-3 shadow-sm transition-all">
                            {t('admin.dashboard.viewAllHistory')} <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
