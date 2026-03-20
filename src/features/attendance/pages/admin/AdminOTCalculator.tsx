import { useState, useMemo, useEffect, useRef } from 'react';
import { useAttendance } from '../../contexts/useAttendance';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    Download, ChevronLeft, ChevronRight, CalendarRange,
    DollarSign, Clock, Users, TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import { useAdminTheme } from '@/hooks/useAdminTheme';

gsap.registerPlugin(ScrollTrigger);

type PeriodMode = 'monthly' | 'custom';

function getWorkingDays(year: number, month: number): number {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
        const day = new Date(year, month, d).getDay();
        if (day !== 0 && day !== 6) count++;
    }
    return count;
}

function fmt(v: number): string {
    return v.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// ═══════════════════════════════════════════
// ── STAT CARD (matches Dashboard StatsGrid)
// ═══════════════════════════════════════════
interface StatCardProps {
    title: string;
    value: number;
    suffix: string;
    icon: React.ElementType;
    color: string;
    delay: number;
    format?: (v: number) => string;
}

function StatCard({ title, value, suffix, icon: Icon, color, delay, format }: StatCardProps) {
    const { dark } = useAdminTheme();
    const cardRef = useRef<HTMLDivElement>(null);
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // 3D Flip entrance (same as Dashboard)
            gsap.fromTo(cardRef.current,
                { rotateX: 90, opacity: 0, transformOrigin: 'center bottom' },
                { rotateX: 0, opacity: 1, duration: 0.8, delay, ease: 'power3.out' }
            );
            // Counter animation
            const counter = { val: 0 };
            gsap.to(counter, {
                val: value,
                duration: 1.5,
                delay: delay + 0.3,
                ease: 'expo.out',
                onUpdate: () => setDisplayValue(counter.val),
            });
            // Icon spin
            if (cardRef.current) {
                gsap.fromTo(cardRef.current.querySelector('.stat-icon') as Element,
                    { rotate: -180, scale: 0 },
                    { rotate: 0, scale: 1, duration: 0.8, delay: delay + 0.4, ease: 'back.out(1.7)' }
                );
            }
        });
        return () => ctx.revert();
    }, [value, delay]);

    // 3D tilt effect on hover (same as Dashboard)
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const rotateX = (y - rect.height / 2) / 10;
        const rotateY = (rect.width / 2 - x) / 10;
        gsap.to(card, { rotateX, rotateY, transformPerspective: 1000, duration: 0.3, ease: 'power2.out' });
    };
    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        gsap.to(e.currentTarget, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power2.out' });
    };

    const formatted = format ? format(displayValue) : Math.round(displayValue).toLocaleString();

    return (
        <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={cn(
                'relative rounded-2xl p-6 border',
                dark ? 'bg-white/[0.06] border-white/10 shadow-none' : 'bg-white shadow-sm border-gray-100',
                dark ? 'hover:shadow-none' : 'hover:shadow-xl hover:shadow-gray-200/50',
                'transition-shadow duration-300 cursor-pointer overflow-hidden group'
            )}
            style={{ transformStyle: 'preserve-3d' }}
        >
            {/* Glossy sheen effect */}
            <div className={cn('absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none', dark && 'hidden')} />

            <div className="flex items-start justify-between relative z-10">
                <div>
                    <p className={cn('text-sm mb-1', dark ? 'text-white/50' : 'text-[#6f6f6f]')}>{title}</p>
                    <span className={cn('text-3xl font-bold tabular-nums', dark ? 'text-white' : 'text-[#1d1d1d]')}>
                        {formatted}
                    </span>
                    <p className={cn('text-sm mt-1', dark ? 'text-white/30' : 'text-gray-400')}>{suffix}</p>
                </div>
                <div className={cn('stat-icon w-12 h-12 rounded-xl flex items-center justify-center', color)}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════
// ── MAIN COMPONENT
// ═══════════════════════════════════════════
export function AdminOTCalculator() {
    const { t } = useTranslation();
    const { dark } = useAdminTheme();
    const { employees, logs, companySettings } = useAttendance();
    const containerRef = useRef<HTMLDivElement>(null);
    const MONTHS_FULL = Array.from({ length: 12 }, (_, i) => t(`months.full.${i}`));

    const now = new Date();
    const [periodMode, setPeriodMode] = useState<PeriodMode>('monthly');
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);

    // GSAP section entrance (same as Dashboard)
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.ot-section',
                { y: 30, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 0.6, stagger: 0.2, ease: 'power3.out',
                    scrollTrigger: { trigger: containerRef.current, start: 'top 80%', toggleActions: 'play none none none' },
                }
            );
        });
        return () => ctx.revert();
    }, []);

    // Row slide-in animation (same as RequestsTable)
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.ot-row',
                { x: -50, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power3.out' }
            );
            gsap.fromTo('.ot-table-divider',
                { width: '0%' },
                { width: '100%', duration: 0.4, stagger: 0.1, ease: 'power3.out' }
            );
        });
        return () => ctx.revert();
    }, [selectedMonth, selectedYear, periodMode, startDate, endDate]);

    const dateRange = useMemo(() => {
        if (periodMode === 'monthly') {
            const s = new Date(selectedYear, selectedMonth, 1);
            const e = new Date(selectedYear, selectedMonth + 1, 0);
            return { start: s.toISOString().split('T')[0], end: e.toISOString().split('T')[0] };
        }
        return { start: startDate, end: endDate };
    }, [periodMode, selectedMonth, selectedYear, startDate, endDate]);

    const otData = useMemo(() => {
        const wd = periodMode === 'monthly' ? getWorkingDays(selectedYear, selectedMonth) : 22;
        return employees.map(emp => {
            const el = logs.filter(l => l.employeeId === emp.id && l.date >= dateRange.start && l.date <= dateRange.end);
            const hrs = el.reduce((s, l) => s + (l.otHours || 0), 0);
            const useDef = emp.otRateConfig?.useDefault ?? true;
            const rType = useDef ? companySettings.defaultOtRateType : (emp.otRateConfig?.type || 'multiplier');
            const rVal = useDef ? companySettings.defaultOtRateValue : (emp.otRateConfig?.value || 0);
            let pay = 0;
            if (rType === 'multiplier') {
                const wage = Number(emp.baseWage || 0);
                const h = wage > 0 ? wage / (wd * 8) : 0;
                pay = hrs * h * rVal;
            } else {
                pay = hrs * rVal;
            }
            return { emp, hrs, rType, rVal, pay: Math.round(pay * 100) / 100, cnt: el.length };
        }).filter(d => d.hrs > 0 || d.cnt > 0);
    }, [employees, logs, dateRange, companySettings, periodMode, selectedMonth, selectedYear]);

    const totHrs = otData.reduce((s, d) => s + d.hrs, 0);
    const totPay = otData.reduce((s, d) => s + d.pay, 0);
    const pplWithOt = otData.filter(d => d.hrs > 0).length;
    const avgHrs = pplWithOt > 0 ? totHrs / pplWithOt : 0;
    const yearOpts = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

    const navMonth = (d: -1 | 1) => {
        let m = selectedMonth + d, y = selectedYear;
        if (m < 0) { m = 11; y--; } if (m > 11) { m = 0; y++; }
        setSelectedMonth(m); setSelectedYear(y);
    };

    const exportCSV = () => {
        const h = `${t('admin.otCalculator.employee')},${t('admin.otCalculator.department')},${t('admin.otCalculator.otHours')},${t('admin.otCalculator.rate')},${t('admin.otCalculator.otPay')}`;
        const r = otData.map(d => `"${d.emp.name}","${d.emp.department}",${d.hrs},${d.rVal},${d.rType === 'multiplier' ? t('admin.otCalculator.multiplierUnit') : t('admin.otCalculator.fixedUnit')},${d.pay}`);
        const lbl = periodMode === 'monthly' ? `${MONTHS_FULL[selectedMonth]} ${selectedYear + 543}` : `${dateRange.start} ${t('admin.otCalculator.to')} ${dateRange.end}`;
        const csv = `\uFEFF# ${t('admin.otCalculator.csvSummary')} – ${lbl}\n${h}\n${r.join('\n')}\n\n# ${t('admin.otCalculator.csvGrandTotal')},,${totHrs},,,${totPay}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `ot-${dateRange.start}-${dateRange.end}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div ref={containerRef} className="space-y-6">
            {/* ═══════════ PERIOD SELECTOR ═══════════ */}
            <div className={cn('ot-section rounded-2xl border overflow-hidden', dark ? 'bg-white/[0.06] border-white/10 shadow-none' : 'bg-white shadow-sm border-gray-100')}>
                <div className={cn('p-5 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3', dark ? 'border-white/10' : 'border-gray-100')}>
                    <div>
                        <h3 className={cn('font-semibold text-lg', dark ? 'text-white' : 'text-[#1d1d1d]')}>{t('admin.otCalculator.selectPeriod')}</h3>
                        <p className={cn('text-sm', dark ? 'text-white/50' : 'text-[#6f6f6f]')}>{t('admin.otCalculator.selectPeriodDesc')}</p>
                    </div>
                    {/* Mode Tabs */}
                    <div className={cn('flex items-center gap-0 border rounded-lg overflow-hidden self-start sm:self-auto', dark ? 'border-white/10 bg-white/[0.06]' : 'border-gray-200 bg-white')}>
                        {(['monthly', 'custom'] as PeriodMode[]).map(mode => (
                            <button key={mode} type="button"
                                onClick={() => setPeriodMode(mode)}
                                className={cn(
                                    'px-4 py-2.5 sm:py-2 text-sm font-medium transition-colors min-w-[5.5rem] sm:min-w-0',
                                    periodMode === mode
                                        ? 'bg-gradient-to-r from-[#044F88] to-[#00223A] text-white'
                                        : dark ? 'bg-transparent text-white/50 hover:bg-white/[0.04]' : 'bg-white text-[#6f6f6f] hover:bg-gray-50',
                                )}
                            >
                                {mode === 'monthly' ? t('admin.otCalculator.monthly') : t('admin.otCalculator.custom')}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-5">
                    {periodMode === 'monthly' ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button onClick={() => navMonth(-1)} className={cn('w-10 h-10 sm:w-9 sm:h-9 shrink-0 rounded-lg border flex items-center justify-center active:scale-95 transition-all', dark ? 'border-white/10 bg-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.1]' : 'border-gray-200 bg-white text-[#6f6f6f] hover:text-[#1d1d1d] hover:border-gray-400 hover:bg-gray-50')}>
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className={cn('flex items-center gap-2 border rounded-lg px-3 h-10 sm:h-9 flex-1 sm:flex-initial', dark ? 'bg-white/[0.06] border-white/10' : 'bg-white border-gray-200')}>
                                <select className={cn('appearance-none bg-transparent text-sm font-semibold pr-1 cursor-pointer focus:outline-none flex-1 sm:flex-initial', dark ? 'text-white' : 'text-[#1d1d1d]')} value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                                    {MONTHS_FULL.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                </select>
                                <span className={dark ? 'text-white/20' : 'text-gray-300'}>|</span>
                                <select className={cn('appearance-none bg-transparent text-sm font-semibold cursor-pointer focus:outline-none', dark ? 'text-white' : 'text-[#1d1d1d]')} value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                                    {yearOpts.map(y => <option key={y} value={y}>{y + 543}</option>)}
                                </select>
                            </div>
                            <button onClick={() => navMonth(1)} className={cn('w-10 h-10 sm:w-9 sm:h-9 shrink-0 rounded-lg border flex items-center justify-center active:scale-95 transition-all', dark ? 'border-white/10 bg-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.1]' : 'border-gray-200 bg-white text-[#6f6f6f] hover:text-[#1d1d1d] hover:border-gray-400 hover:bg-gray-50')}>
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                            <input type="date" className="h-10 sm:h-9 w-full sm:w-auto rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-[#1d1d1d] focus:outline-none focus:ring-2 focus:ring-[#044F88]/30 focus:border-[#044F88] transition-all" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            <span className="text-gray-300 text-sm text-center hidden sm:block">→</span>
                            <span className="text-[#6f6f6f] text-xs text-center sm:hidden">{t('admin.otCalculator.to')}</span>
                            <input type="date" className="h-10 sm:h-9 w-full sm:w-auto rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-[#1d1d1d] focus:outline-none focus:ring-2 focus:ring-[#044F88]/30 focus:border-[#044F88] transition-all" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════ STATS GRID (same as Dashboard) ═══════════ */}
            <div className="ot-section grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ perspective: '1000px' }}>
                <StatCard
                    title={t('admin.otCalculator.totalOtPay')}
                    value={totPay}
                    suffix={t('common.baht')}
                    icon={DollarSign}
                    color="bg-gradient-to-br from-emerald-500 to-teal-500"
                    delay={0.1}
                    format={v => `฿${fmt(v)}`}
                />
                <StatCard
                    title={t('admin.otCalculator.totalOtHours')}
                    value={totHrs}
                    suffix={t('common.hours')}
                    icon={Clock}
                    color="bg-gradient-to-br from-[#044F88] to-[#00223A]"
                    delay={0.2}
                    format={v => v.toFixed(1)}
                />
                <StatCard
                    title={t('admin.otCalculator.employeesWithOt')}
                    value={pplWithOt}
                    suffix={t('common.person')}
                    icon={Users}
                    color="bg-gradient-to-br from-amber-500 to-orange-500"
                    delay={0.3}
                />
                <StatCard
                    title={t('admin.otCalculator.averagePerPerson')}
                    value={avgHrs}
                    suffix={t('admin.otCalculator.hoursPerPerson')}
                    icon={TrendingUp}
                    color="bg-gradient-to-br from-[#044F88] to-[#00223A]"
                    delay={0.4}
                    format={v => v.toFixed(1)}
                />
            </div>

            {/* ═══════════ TABLE CARD (same as RequestsTable) ═══════════ */}
            <div className={cn('ot-section rounded-2xl border overflow-hidden', dark ? 'bg-white/[0.06] border-white/10 shadow-none' : 'bg-white shadow-sm border-gray-100')}>
                {/* Card Header */}
                <div className={cn('p-6 border-b flex items-center justify-between', dark ? 'border-white/10' : 'border-gray-100')}>
                    <div>
                        <h3 className={cn('font-semibold text-lg', dark ? 'text-white' : 'text-[#1d1d1d]')}>{t('admin.otCalculator.detailTitle')}</h3>
                        <p className={cn('text-sm', dark ? 'text-white/50' : 'text-[#6f6f6f]')}>
                            {t('admin.otCalculator.totalItems')} {otData.length} {t('common.items')} · {periodMode === 'monthly' ? `${MONTHS_FULL[selectedMonth]} ${selectedYear + 543}` : `${dateRange.start} – ${dateRange.end}`}
                        </p>
                    </div>
                    <Button onClick={exportCSV} variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">{t('common.exportCsv')}</span>
                    </Button>
                </div>

                {otData.length === 0 ? (
                    <div className="py-20 text-center">
                        <CalendarRange className={cn('w-10 h-10 mx-auto mb-4', dark ? 'text-white/20' : 'text-gray-300')} />
                        <p className={cn('font-medium', dark ? 'text-white' : 'text-[#1d1d1d]')}>{t('admin.otCalculator.noOtData')}</p>
                        <p className={cn('text-sm mt-1', dark ? 'text-white/50' : 'text-[#6f6f6f]')}>{t('admin.otCalculator.noOtHint')}</p>
                    </div>
                ) : (
                    <>
                        {/* ── Desktop Table ── */}
                        <div className="hidden sm:block overflow-x-auto">
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className={cn('border-b', dark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50/50 border-gray-200')}>
                                        <th className={cn('w-[60px] text-left text-xs font-semibold uppercase tracking-wider pl-6 pr-4 py-4', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>#</th>
                                        <th className={cn('text-left text-xs font-semibold uppercase tracking-wider px-4 py-4', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>{t('admin.otCalculator.employee')}</th>
                                        <th className={cn('w-[160px] text-left text-xs font-semibold uppercase tracking-wider px-4 py-4 hidden lg:table-cell', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>{t('admin.otCalculator.department')}</th>
                                        <th className={cn('w-[120px] text-right text-xs font-semibold uppercase tracking-wider px-4 py-4', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>{t('admin.otCalculator.otHours')}</th>
                                        <th className={cn('w-[120px] text-center text-xs font-semibold uppercase tracking-wider px-4 py-4 hidden lg:table-cell', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>{t('admin.otCalculator.rate')}</th>
                                        <th className={cn('w-[140px] text-right text-xs font-semibold uppercase tracking-wider pl-4 pr-6 py-4', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>{t('admin.otCalculator.otPay')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {otData.map((d, i) => (
                                        <tr key={d.emp.id} className={cn(
                                            'ot-row group border-b transition-colors duration-300',
                                            dark ? 'border-white/10 hover:bg-white/[0.04]' : 'border-gray-100 hover:bg-[#044F88]/30'
                                        )}>
                                            <td className="pl-6 pr-4 py-4 font-mono text-sm text-[#044F88] font-medium align-top">{String(i + 1).padStart(2, '0')}</td>
                                            <td className="px-4 py-4 align-top">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#044F88] to-[#00223A] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {d.emp.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className={cn('font-medium text-sm group-hover:text-[#044F88] transition-colors truncate', dark ? 'text-white' : 'text-[#1d1d1d]')}>{d.emp.name}</p>
                                                        <p className={cn('text-xs truncate lg:hidden', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>{d.emp.department}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={cn('px-4 py-4 text-sm align-top hidden lg:table-cell', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>{d.emp.department}</td>
                                            <td className="px-4 py-4 text-right align-top">
                                                <span className={cn('font-semibold text-sm tabular-nums', dark ? 'text-white' : 'text-[#1d1d1d]')}>{d.hrs.toFixed(1)}</span>
                                                <span className={cn('text-xs ml-1', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>{t('common.hours')}</span>
                                            </td>
                                            <td className="px-4 py-4 text-center align-top hidden lg:table-cell">
                                                <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium', dark ? 'bg-white/[0.06] text-white/50' : 'bg-gray-100 text-[#6f6f6f]')}>
                                                    {d.rVal}{d.rType === 'multiplier' ? '×' : `฿/${t('common.hours')}`}
                                                </span>
                                            </td>
                                            <td className="pl-4 pr-6 py-4 text-right align-top">
                                                <span className="font-semibold text-sm text-emerald-600 tabular-nums">{fmt(d.pay)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className={cn('border-t', dark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50/50 border-gray-200')}>
                                        <td className="pl-6 pr-4 py-4" colSpan={3}>
                                            <span className={cn('font-semibold text-sm', dark ? 'text-white' : 'text-[#1d1d1d]')}>{t('admin.otCalculator.grandTotal')}</span>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <span className={cn('font-semibold text-sm tabular-nums', dark ? 'text-white' : 'text-[#1d1d1d]')}>{totHrs.toFixed(1)} {t('common.hours')}</span>
                                        </td>
                                        <td className="px-4 py-4 hidden lg:table-cell"></td>
                                        <td className="pl-4 pr-6 py-4 text-right">
                                            <span className="font-bold text-base text-emerald-600 tabular-nums">฿{fmt(totPay)}</span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* ── Mobile List ── */}
                        <div className={cn('sm:hidden divide-y', dark ? 'divide-white/10' : 'divide-gray-100')}>
                            {otData.map((d, i) => (
                                <div key={d.emp.id} className={cn('ot-row p-4 flex items-center gap-3 transition-colors duration-300 group', dark ? 'hover:bg-white/[0.04]' : 'hover:bg-[#044F88]/30')}>
                                    <span className="font-mono text-xs text-[#044F88] font-medium w-5 shrink-0 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#044F88] to-[#00223A] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {d.emp.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={cn('font-medium text-sm group-hover:text-[#044F88] transition-colors truncate', dark ? 'text-white' : 'text-[#1d1d1d]')}>{d.emp.name}</p>
                                        <p className={cn('text-xs truncate', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>{d.emp.department} · {d.hrs.toFixed(1)} {t('common.hours')} · {t('admin.otCalculator.rate')} {d.rVal}{d.rType === 'multiplier' ? '×' : `฿/${t('common.hours')}`}</p>
                                    </div>
                                    <p className="font-semibold text-sm text-emerald-600 tabular-nums shrink-0">฿{fmt(d.pay)}</p>
                                </div>
                            ))}
                            {/* Mobile Total */}
                            <div className={cn('p-4 flex items-center justify-between', dark ? 'bg-white/[0.03]' : 'bg-gray-50/50')}>
                                <span className={cn('font-semibold text-sm', dark ? 'text-white' : 'text-[#1d1d1d]')}>{t('admin.otCalculator.grandTotal')}</span>
                                <div className="text-right">
                                    <p className="font-bold text-base text-emerald-600 tabular-nums">฿{fmt(totPay)}</p>
                                    <p className="text-xs text-[#6f6f6f]">{totHrs.toFixed(1)} {t('common.hours')} · {pplWithOt} {t('common.person')}</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
