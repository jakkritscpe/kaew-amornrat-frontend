import { useState, useEffect, useRef } from 'react';
import { useAttendance } from '../../contexts/useAttendance';
import { FileText, Filter, Clock, Ban, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import { useAdminTheme } from '@/hooks/useAdminTheme';

gsap.registerPlugin(ScrollTrigger);

// FILTER_LABELS and STATUS_LABELS are derived from t() inside the component

export function AdminOTApprovals() {
    const { t } = useTranslation();
    const { dark } = useAdminTheme();
    const { otRequests, employees, updateOTStatus } = useAttendance();

    const FILTER_LABELS: Record<string, string> = {
        all: t('admin.otApprovals.all'),
        pending: t('status.pending'),
        approved: t('status.approved'),
        rejected: t('status.rejectedFull'),
    };

    const STATUS_LABELS: Record<string, string> = {
        approved: t('status.approved'),
        rejected: t('status.rejectedFull'),
        pending: t('status.pending'),
    };
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');

    const containerRef = useRef<HTMLDivElement>(null);

    const filtered = otRequests
        .filter(req => filter === 'all' || req.status === filter)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // ── GSAP Animations ──
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Header animation
            gsap.fromTo('.page-header',
                { y: -20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
            );

            // Container entrance
            gsap.fromTo('.dashboard-section',
                { y: 30, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 0.5, ease: 'power3.out',
                    scrollTrigger: { trigger: containerRef.current, start: 'top 80%', toggleActions: 'play none none none' },
                }
            );

            // List/Row stagger
            if (filtered.length > 0) {
                gsap.fromTo('.ot-row',
                    { x: -20, opacity: 0 },
                    { x: 0, opacity: 1, duration: 0.4, stagger: 0.03, ease: 'power2.out', delay: 0.2 }
                );
            }
        });
        return () => ctx.revert();
    }, [filtered.length, filter]);

    return (
        <div ref={containerRef} className="space-y-6 pb-12">
            {/* ── Page header ── */}
            <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className={cn('text-2xl font-bold tracking-tight', dark ? 'text-white' : 'text-[#1d1d1d]')}>{t('admin.otApprovals.title')}</h1>
                    <p className={cn('text-sm mt-1', dark ? 'text-white/50' : 'text-[#6f6f6f]')}>{t('admin.otApprovals.subtitle')}</p>
                </div>
            </div>

            {/* ── Main Content Container ── */}
            <div className={cn('dashboard-section rounded-2xl overflow-hidden relative min-h-[500px]', dark ? 'bg-white/[0.06] border border-white/10 shadow-none' : 'bg-white shadow-sm border border-gray-100')}>
                {/* ── Filter Tabs ── */}
                <div data-tour="ot-filter-tabs" className={cn('px-6 py-4 border-b flex items-center gap-3 overflow-x-auto hide-scrollbar relative z-10', dark ? 'border-white/10 bg-white/[0.03]' : 'border-gray-100 bg-white')}>
                    <Filter className={cn('w-4 h-4 shrink-0 mr-1', dark ? 'text-white/30' : 'text-gray-400')} />
                    {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                'px-4 py-2 text-sm font-semibold rounded-xl transition-all whitespace-nowrap',
                                filter === f
                                    ? 'bg-[#044F88] text-white shadow-md shadow-[#044F88]/20'
                                    : dark
                                        ? 'bg-white/[0.06] text-white/50 hover:bg-white/[0.1] border border-white/10 hover:text-white/70'
                                        : 'bg-gray-50 text-[#6f6f6f] hover:bg-gray-100 border border-gray-100 hover:text-[#1d1d1d]'
                            )}
                        >
                            {FILTER_LABELS[f]}
                            {f === 'pending' && filter !== 'pending' && otRequests.filter(r => r.status === 'pending').length > 0 && (
                                <span className={cn('ml-2 px-1.5 py-0.5 rounded-md text-amber-600 text-[10px] font-bold', dark ? 'bg-white/10 border border-white/10' : 'bg-white border border-gray-200')}>
                                    {otRequests.filter(r => r.status === 'pending').length}
                                </span>
                            )}
                            {f === 'pending' && filter === 'pending' && otRequests.filter(r => r.status === 'pending').length > 0 && (
                                <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white/20 text-white border border-white/20 text-[10px] font-bold">
                                    {otRequests.filter(r => r.status === 'pending').length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ── List View (Mobile) / Table View (Desktop) ── */}
                <div data-tour="ot-request-list" className={dark ? 'bg-white/[0.03]' : 'bg-gray-50/30'}>

                    {/* Mobile View: Cards */}
                    <div className={cn('md:hidden divide-y p-3 space-y-3', dark ? 'divide-white/5' : 'divide-gray-100/50')}>
                        {filtered.length === 0 ? (
                            <div className={cn('py-16 text-center text-sm flex flex-col items-center', dark ? 'text-white/50' : 'text-[#6f6f6f]')}>
                                <FileText className={cn('w-12 h-12 mb-4', dark ? 'text-white/10' : 'text-gray-200')} />
                                <p className={cn('font-semibold text-lg', dark ? 'text-white' : 'text-[#1d1d1d]')}>{t('admin.otApprovals.noRequests')}</p>
                            </div>
                        ) : (
                            filtered.map(req => {
                                const emp = employees.find(e => e.id === req.employeeId);
                                return (
                                    <div key={req.id} className={cn('ot-row rounded-2xl p-5 border relative overflow-hidden group', dark ? 'bg-white/[0.06] border-white/10' : 'bg-white border-gray-100 shadow-sm')}>
                                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent to-transparent group-hover:from-[#044F88] group-hover:to-[#00223A] transition-colors duration-300" />

                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-center gap-3">
                                                {emp?.avatarUrl ? (
                                                    <img src={emp.avatarUrl} alt={emp.name} className="w-10 h-10 rounded-full object-cover shrink-0 bg-[#044F88]/5 ring-2 ring-white shadow-sm" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#044F88] to-[#00223A] flex items-center justify-center text-white text-sm font-bold shrink-0 ring-2 ring-white shadow-sm">
                                                        {emp?.name.charAt(0) || '?'}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className={cn('font-bold leading-tight group-hover:text-[#044F88] transition-colors', dark ? 'text-white' : 'text-[#1d1d1d]')}>
                                                        {emp?.name}
                                                    </p>
                                                    <p className={cn('text-xs mt-0.5 flex items-center gap-1', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>
                                                        {emp?.department} {emp?.nickname && `(${emp.nickname})`}
                                                    </p>
                                                </div>
                                            </div>
                                            {req.status === 'pending' ? (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-500/20 shrink-0">
                                                    {t('status.pending')}
                                                </span>
                                            ) : (
                                                <span className={cn(
                                                    'px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ring-1 ring-inset shrink-0',
                                                    req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 ring-emerald-500/20' : 'bg-red-50 text-red-700 ring-red-500/20'
                                                )}>
                                                    {STATUS_LABELS[req.status] || req.status}
                                                </span>
                                            )}
                                        </div>

                                        <div className={cn('rounded-xl p-3.5 mb-4 grid grid-cols-2 gap-3 border', dark ? 'bg-white/[0.03] border-white/5' : 'bg-gray-50 border-gray-100/50')}>
                                            <div className="flex items-start gap-2">
                                                <Clock className="w-4 h-4 text-[#044F88] shrink-0 mt-0.5" />
                                                <div>
                                                    <p className={cn('text-[10px] font-bold uppercase tracking-wider mb-0.5', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>{t('admin.otApprovals.dateAndTime')}</p>
                                                    <p className={cn('font-semibold text-sm tabular-nums leading-tight', dark ? 'text-white' : 'text-[#1d1d1d]')}>{req.date}</p>
                                                    <p className={cn('text-xs font-medium mt-0.5', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>{req.startTime} - {req.endTime} น.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <AlignLeft className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                                <div className="min-w-0">
                                                    <p className={cn('text-[10px] font-bold uppercase tracking-wider mb-0.5', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>{t('admin.otApprovals.reason')}</p>
                                                    <p className={cn('text-xs leading-relaxed line-clamp-2', dark ? 'text-white/70' : 'text-[#1d1d1d]')}>{req.reason}</p>
                                                </div>
                                            </div>
                                        </div>

                                        {req.status === 'pending' && (
                                            <div className="flex items-center gap-2 pt-1">
                                                <Button
                                                    size="sm"
                                                    onClick={() => updateOTStatus(req.id, 'approved')}
                                                    className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-sm h-10 rounded-xl font-semibold"
                                                >
                                                    {/* Changed Check to FileCheck2/CheckStar equivalent */}
                                                    <span className="w-4 h-4 mr-2" >✓</span> {t('admin.otApprovals.approve')}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateOTStatus(req.id, 'rejected')}
                                                    className={cn('flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 h-10 rounded-xl font-semibold', dark ? 'bg-white/[0.06]' : 'bg-white')}
                                                >
                                                    {/* Changed X to Ban/Cancel equivalent */}
                                                    <Ban className="w-4 h-4 mr-2" /> {t('admin.otApprovals.reject')}
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Desktop View: Table (Matches RequestsTable logic) */}
                    <div className="hidden md:block overflow-x-auto min-h-[400px]">
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className={cn('text-xs uppercase tracking-wider font-semibold border-b', dark ? 'bg-white/[0.03] text-white/40 border-white/10' : 'bg-gray-50/50 text-[#6f6f6f] border-gray-200')}>
                                <tr>
                                    <th className="px-6 py-4">{t('admin.otApprovals.employee')}</th>
                                    <th className="px-6 py-4">{t('admin.otApprovals.dateAndTimeRange')}</th>
                                    <th className="px-6 py-4 w-1/3">{t('admin.otApprovals.reason')}</th>
                                    <th className="px-6 py-4 text-center">{t('admin.otApprovals.actionOrStatus')}</th>
                                </tr>
                            </thead>
                            <tbody className={cn('divide-y', dark ? 'divide-white/10 bg-transparent' : 'divide-gray-100 bg-white')}>
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className={cn('w-16 h-16 rounded-2xl flex items-center justify-center mb-4 border', dark ? 'bg-white/[0.06] border-white/10' : 'bg-gray-50 border-gray-100')}>
                                                    <FileText className={cn('w-8 h-8', dark ? 'text-white/20' : 'text-gray-300')} />
                                                </div>
                                                <p className={cn('font-semibold text-lg mb-1', dark ? 'text-white' : 'text-[#1d1d1d]')}>{t('admin.otApprovals.noRequests')}</p>
                                                <p className={cn('text-sm', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>{t('admin.otApprovals.noRequestsHint')}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map(req => {
                                        const emp = employees.find(e => e.id === req.employeeId);
                                        return (
                                            <tr key={req.id} className={cn('ot-row transition-colors duration-300 group', dark ? 'hover:bg-white/[0.04]' : 'hover:bg-[#044F88]/30')}>
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
                                                            <p className={cn('font-semibold group-hover:text-[#044F88] transition-colors', dark ? 'text-white' : 'text-[#1d1d1d]')}>{emp?.name || t('admin.otApprovals.unknownName')}</p>
                                                            {emp?.nickname && <p className={cn('text-xs', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>({emp.nickname})</p>}
                                                            <p className={cn('text-xs mt-0.5', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>{emp?.department}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className={cn('font-semibold tabular-nums mb-0.5', dark ? 'text-white' : 'text-[#1d1d1d]')}>{req.date}</p>
                                                    <p className={cn('text-xs font-medium tabular-nums flex items-center gap-1.5', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>
                                                        <ClockIcon className="w-3.5 h-3.5 text-[#044F88]" />
                                                        {req.startTime} - {req.endTime} น.
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 max-w-[300px] whitespace-normal">
                                                    <p className={cn('text-sm leading-relaxed line-clamp-2', dark ? 'text-white/70' : 'text-[#1d1d1d]')}>{req.reason}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center align-middle">
                                                    {req.status === 'pending' ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => updateOTStatus(req.id, 'approved')}
                                                                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg h-9 px-4 shadow-sm"
                                                            >
                                                                <span className="w-3.5 h-3.5 mr-1.5">✓</span> {t('admin.otApprovals.approve')}
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => updateOTStatus(req.id, 'rejected')}
                                                                className={cn('text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 rounded-lg h-9 px-4 shadow-sm', dark ? 'bg-white/[0.06]' : 'bg-white')}
                                                            >
                                                                <Ban className="w-3.5 h-3.5 mr-1.5" /> {t('admin.otApprovals.reject')}
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <span className={cn(
                                                            'inline-flex px-3 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase ring-1 ring-inset',
                                                            req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' : 'bg-red-50 text-red-700 ring-red-600/10'
                                                        )}>
                                                            {STATUS_LABELS[req.status] || req.status}
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
        </div>
    );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}
