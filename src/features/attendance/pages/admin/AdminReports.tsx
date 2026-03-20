import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAttendance } from '../../contexts/useAttendance';
import { getLogsApi } from '@/lib/api/attendance-api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    BarChart3, TrendingUp, Download, Users, Clock, AlertTriangle, CheckCircle2,
    ChevronLeft, ChevronRight, Loader2, CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import { useAdminTheme } from '@/hooks/useAdminTheme';
import type { AttendanceLog, Employee } from '../../types';

// ── Types ───────────────────────────────────────────────────────────────────

type ReportMode = 'late' | 'ontime';

// ── Helpers ─────────────────────────────────────────────────────────────────

// THAI_MONTHS and THAI_MONTHS_SHORT are now created inside the component via useTranslation

function pad2(n: number) { return n.toString().padStart(2, '0'); }

function monthRange(year: number, month: number) {
    const start = `${year}-${pad2(month + 1)}-01`;
    const last = new Date(year, month + 1, 0).getDate();
    const end = `${year}-${pad2(month + 1)}-${pad2(last)}`;
    return { start, end };
}

function yearRange(year: number) {
    return { start: `${year}-01-01`, end: `${year}-12-31` };
}

// formatThaiDate is now created inside the component via useTranslation

function calcOTHours(startTime: string, endTime: string) {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    return Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
}

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
    const BOM = '\uFEFF';
    const csv = BOM + [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function buildRanking(logs: AttendanceLog[], status: 'late' | 'present', empMap: Map<string, Employee>) {
    const byEmp = new Map<string, { count: number; dates: string[] }>();
    logs.filter(l => l.status === status).forEach(l => {
        const entry = byEmp.get(l.employeeId) ?? { count: 0, dates: [] };
        entry.count++;
        entry.dates.push(l.date);
        byEmp.set(l.employeeId, entry);
    });
    return Array.from(byEmp.entries())
        .map(([empId, info]) => {
            const emp = empMap.get(empId);
            return { empId, name: emp?.name ?? '?', department: emp?.department ?? '-', ...info };
        })
        .sort((a, b) => b.count - a.count);
}

// ── Mode style config (static, no translations) ────────────────────────────

const MODE_STYLE = {
    late: {
        status: 'late' as const,
        csvPrefix: 'late',
        iconCard: AlertTriangle,
        iconMonthly: CalendarDays,
        iconChart: BarChart3,
        iconRank: AlertTriangle,
        iconEmpty: TrendingUp,
        barCurrent: 'bg-amber-500',
        barDefault: 'bg-amber-300',
        barLabel: 'text-amber-600',
        badgeHigh: 'bg-red-100 text-red-700',
        badgeMid: 'bg-amber-100 text-amber-700',
        badgeLow: 'bg-slate-100 text-slate-600',
        dateBadge: 'bg-amber-50 text-amber-700',
        progressBar: 'bg-amber-400',
        rankColors: ['bg-red-100 text-red-600', 'bg-amber-100 text-amber-600', 'bg-yellow-100 text-yellow-600', 'bg-slate-100 text-slate-500'],
        totalColor: 'text-amber-600',
        summaryCardColor: 'bg-amber-500',
        iconMonthlyColor: 'text-amber-500',
        iconRankColor: 'text-red-400',
    },
    ontime: {
        status: 'present' as const,
        csvPrefix: 'ontime',
        iconCard: CheckCircle2,
        iconMonthly: CalendarDays,
        iconChart: BarChart3,
        iconRank: CheckCircle2,
        iconEmpty: CheckCircle2,
        barCurrent: 'bg-emerald-500',
        barDefault: 'bg-emerald-300',
        barLabel: 'text-emerald-600',
        badgeHigh: 'bg-emerald-100 text-emerald-700',
        badgeMid: 'bg-emerald-100 text-emerald-700',
        badgeLow: 'bg-emerald-50 text-emerald-600',
        dateBadge: 'bg-emerald-50 text-emerald-700',
        progressBar: 'bg-emerald-400',
        rankColors: ['bg-emerald-100 text-emerald-600', 'bg-teal-100 text-teal-600', 'bg-cyan-100 text-cyan-600', 'bg-slate-100 text-slate-500'],
        totalColor: 'text-emerald-600',
        summaryCardColor: 'bg-emerald-500',
        iconMonthlyColor: 'text-emerald-500',
        iconRankColor: 'text-emerald-500',
    },
} as const;

/** Build translated labels for a given mode. Must be called inside a component. */
function useModeCfgLabels(mode: ReportMode, t: (key: string) => string) {
    const isLate = mode === 'late';
    return {
        label: isLate ? t('admin.reports.modeLabel') : t('admin.reports.modeLabelOnTime'),
        monthlyTitle: isLate ? t('admin.reports.monthlyTitle') : t('admin.reports.monthlyTitleOnTime'),
        yearlyChartTitle: isLate ? t('admin.reports.yearlyChartTitle') : t('admin.reports.yearlyChartTitleOnTime'),
        yearlyRankTitle: isLate ? t('admin.reports.yearlyRankTitle') : t('admin.reports.yearlyRankTitleOnTime'),
        emptyMonthly: isLate ? t('admin.reports.emptyMonthly') : t('admin.reports.emptyMonthlyOnTime'),
        emptyYearly: isLate ? t('admin.reports.emptyYearly') : t('admin.reports.emptyYearlyOnTime'),
        yearlyTotalLabel: t('admin.reports.yearlyTotal'),
        yearlyTotalUnit: t('common.times'),
        rankUnit: t('common.days'),
        colCount: isLate ? t('admin.reports.colCountLate') : t('admin.reports.colCountOnTime'),
        colDates: isLate ? t('admin.reports.colDatesLate') : t('admin.reports.colDatesOnTime'),
        csvColCount: isLate ? t('admin.reports.csvCountLate') : t('admin.reports.csvCountOnTime'),
        csvColDates: isLate ? t('admin.reports.csvDatesLate') : t('admin.reports.csvDatesOnTime'),
    };
}

// ── Component ───────────────────────────────────────────────────────────────

export function AdminReports() {
    const { t } = useTranslation();
    const { dark } = useAdminTheme();
    const { employees, otRequests } = useAttendance();
    const now = new Date();

    const THAI_MONTHS = Array.from({ length: 12 }, (_, i) => t(`months.full.${i}`));
    const THAI_MONTHS_SHORT = Array.from({ length: 12 }, (_, i) => t(`months.short.${i}`));

    const formatThaiDate = (dateStr: string) => {
        const d = new Date(dateStr + 'T00:00:00');
        return `${d.getDate()} ${THAI_MONTHS_SHORT[d.getMonth()]}`;
    };

    const [mode, setMode] = useState<ReportMode>('late');
    const [viewMonth, setViewMonth] = useState(now.getMonth());
    const [viewYear, setViewYear] = useState(now.getFullYear());
    const [monthlyLogs, setMonthlyLogs] = useState<AttendanceLog[]>([]);
    const [yearlyLogs, setYearlyLogs] = useState<AttendanceLog[]>([]);
    const [loadingMonthly, setLoadingMonthly] = useState(true);
    const [loadingYearly, setLoadingYearly] = useState(true);

    const style = MODE_STYLE[mode];
    const labels = useModeCfgLabels(mode, t);
    const cfg = { ...style, ...labels };
    const filterStatus = cfg.status;

    const empMap = useMemo(() => {
        const m = new Map<string, Employee>();
        employees.forEach(e => m.set(e.id, e));
        return m;
    }, [employees]);

    // Fetch monthly logs
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingMonthly(true);
            try {
                const { start, end } = monthRange(viewYear, viewMonth);
                const data = await getLogsApi({ startDate: start, endDate: end, limit: 200 });
                if (!cancelled) setMonthlyLogs(data);
            } catch { /* ignore */ }
            if (!cancelled) setLoadingMonthly(false);
        })();
        return () => { cancelled = true; };
    }, [viewYear, viewMonth]);

    // Fetch yearly logs
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingYearly(true);
            try {
                const { start, end } = yearRange(viewYear);
                const data = await getLogsApi({ startDate: start, endDate: end, limit: 200 });
                if (!cancelled) setYearlyLogs(data);
            } catch { /* ignore */ }
            if (!cancelled) setLoadingYearly(false);
        })();
        return () => { cancelled = true; };
    }, [viewYear]);

    // ── Monthly stats ───────────────────────────────────────────────────────

    const monthlyStats = useMemo(() => {
        const total = monthlyLogs.length;
        const lateCount = monthlyLogs.filter(l => l.status === 'late').length;
        const presentCount = monthlyLogs.filter(l => l.status === 'present').length;
        const punctualityRate = total > 0 ? Math.round((presentCount / total) * 100) : 0;
        const ranking = buildRanking(monthlyLogs, filterStatus, empMap);
        return { total, lateCount, presentCount, punctualityRate, ranking };
    }, [monthlyLogs, empMap, filterStatus]);

    // ── Yearly stats (monthly breakdown) ────────────────────────────────────

    const yearlyMonthlyBreakdown = useMemo(() => {
        const months = Array.from({ length: 12 }, () => ({ total: 0, late: 0, present: 0 }));
        yearlyLogs.forEach(l => {
            const m = new Date(l.date + 'T00:00:00').getMonth();
            months[m].total++;
            if (l.status === 'late') months[m].late++;
            if (l.status === 'present') months[m].present++;
        });
        return months;
    }, [yearlyLogs]);

    const yearlyFilteredTotal = useMemo(
        () => yearlyLogs.filter(l => l.status === filterStatus).length,
        [yearlyLogs, filterStatus],
    );

    const yearlyRanking = useMemo(
        () => buildRanking(yearlyLogs, filterStatus, empMap).map(({ dates: _d, ...rest }) => rest),
        [yearlyLogs, empMap, filterStatus],
    );

    // ── OT this month ───────────────────────────────────────────────────────

    const monthlyOT = useMemo(() => {
        const { start, end } = monthRange(viewYear, viewMonth);
        const filtered = otRequests.filter(r => r.status === 'approved' && r.date >= start && r.date <= end);
        const hours = filtered.reduce((sum, r) => sum + calcOTHours(r.startTime, r.endTime), 0);
        return { count: filtered.length, hours: Math.round(hours * 10) / 10 };
    }, [otRequests, viewYear, viewMonth]);

    // ── Navigation ──────────────────────────────────────────────────────────

    const prevMonth = useCallback(() => {
        setViewMonth(m => m === 0 ? (setViewYear(y => y - 1), 11) : m - 1);
    }, []);

    const nextMonth = useCallback(() => {
        const isCur = viewYear === now.getFullYear() && viewMonth === now.getMonth();
        if (isCur) return;
        setViewMonth(m => m === 11 ? (setViewYear(y => y + 1), 0) : m + 1);
    }, [viewYear, viewMonth, now]);

    const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth();

    // ── Export CSV ──────────────────────────────────────────────────────────

    const exportMonthlyCSV = useCallback(() => {
        if (!monthlyStats.ranking.length) return;
        const headers = [t('admin.reports.csvRank'), t('admin.reports.csvName'), t('admin.reports.csvDept'), cfg.csvColCount, cfg.csvColDates];
        const rows = monthlyStats.ranking.map((r, i) => [
            String(i + 1), r.name, r.department, String(r.count),
            r.dates.map(formatThaiDate).join(', '),
        ]);
        downloadCSV(`${cfg.csvPrefix}-report-${viewYear}-${pad2(viewMonth + 1)}.csv`, headers, rows);
    }, [monthlyStats.ranking, viewYear, viewMonth, cfg, t, formatThaiDate]);

    const exportYearlyCSV = useCallback(() => {
        if (!yearlyRanking.length) return;
        const headers = [t('admin.reports.csvRank'), t('admin.reports.csvName'), t('admin.reports.csvDept'), cfg.csvColCount];
        const rows = yearlyRanking.map((r, i) => [String(i + 1), r.name, r.department, String(r.count)]);
        downloadCSV(`${cfg.csvPrefix}-report-${viewYear}.csv`, headers, rows);
    }, [yearlyRanking, viewYear, cfg, t]);

    // ── Render ──────────────────────────────────────────────────────────────

    const barKey = filterStatus === 'late' ? 'late' : 'present';
    const maxBarVal = Math.max(...yearlyMonthlyBreakdown.map(m => m[barKey]), 1);

    return (
        <div className="space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className={cn('text-2xl font-bold tracking-tight', dark ? 'text-white' : 'text-[#1d1d1d]')}>{t('admin.reports.title')}</h1>
                    <p className={cn('text-sm mt-1', dark ? 'text-white/50' : 'text-[#6f6f6f]')}>{t('admin.reports.subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* ── Mode toggle ── */}
                    <div data-tour="report-mode-toggle" className={cn('flex rounded-lg p-0.5', dark ? 'bg-white/[0.06]' : 'bg-slate-100')}>
                        <button
                            onClick={() => setMode('late')}
                            className={cn(
                                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all',
                                mode === 'late'
                                    ? (dark ? 'bg-white/10 text-amber-400 shadow-sm' : 'bg-white text-amber-600 shadow-sm')
                                    : (dark ? 'text-white/40 hover:text-white/60' : 'text-slate-500 hover:text-slate-700')
                            )}
                        >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {t('admin.reports.modeLabel')}
                        </button>
                        <button
                            onClick={() => setMode('ontime')}
                            className={cn(
                                'flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all',
                                mode === 'ontime'
                                    ? (dark ? 'bg-white/10 text-emerald-400 shadow-sm' : 'bg-white text-emerald-600 shadow-sm')
                                    : (dark ? 'text-white/40 hover:text-white/60' : 'text-slate-500 hover:text-slate-700')
                            )}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {t('admin.reports.modeLabelOnTime')}
                        </button>
                    </div>

                    {/* ── Month nav ── */}
                    <div data-tour="report-month-nav" className="flex items-center gap-1.5">
                        <Button variant="outline" size="icon" onClick={prevMonth} className="h-9 w-9">
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <div className={cn('text-sm font-semibold min-w-[150px] text-center', dark ? 'text-white' : 'text-[#1d1d1d]')}>
                            {THAI_MONTHS[viewMonth]} {viewYear + 543}
                        </div>
                        <Button variant="outline" size="icon" onClick={nextMonth} disabled={isCurrentMonth} className="h-9 w-9">
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Summary cards ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard icon={Users} label={t('admin.reports.totalEmployees')} value={`${employees.length}`} unit={t('common.person')} color="bg-[#044F88]" />
                <SummaryCard
                    icon={TrendingUp} label={t('admin.reports.onTimeRate')}
                    value={loadingMonthly ? '...' : `${monthlyStats.punctualityRate}%`}
                    color="bg-emerald-500"
                />
                <SummaryCard
                    icon={cfg.iconCard} label={mode === 'late' ? t('admin.reports.lateThisMonth') : t('admin.reports.onTimeThisMonth')}
                    value={loadingMonthly ? '...' : `${mode === 'late' ? monthlyStats.lateCount : monthlyStats.presentCount}`}
                    unit={t('common.times')} color={cfg.summaryCardColor}
                />
                <SummaryCard
                    icon={Clock} label={t('admin.reports.otApprovedThisMonth')}
                    value={`${monthlyOT.hours}`}
                    unit={`${t('common.hours')} (${monthlyOT.count} ${t('common.items')})`} color="bg-purple-500"
                />
            </div>

            {/* ── Monthly report table ── */}
            <Card data-tour="report-monthly-table" className={cn('overflow-hidden', dark ? 'bg-white/[0.06] border-white/10 shadow-none' : 'border-slate-200 shadow-sm')}>
                <div className={cn('px-5 py-4 border-b flex items-center justify-between', dark ? 'border-white/10' : 'border-slate-100')}>
                    <h3 className={cn('font-semibold flex items-center gap-2', dark ? 'text-white' : 'text-[#1d1d1d]')}>
                        <cfg.iconMonthly className={cn('w-5 h-5', cfg.iconMonthlyColor)} />
                        {cfg.monthlyTitle} — {THAI_MONTHS[viewMonth]} {viewYear + 543}
                    </h3>
                    <Button variant="outline" size="sm" onClick={exportMonthlyCSV}
                        disabled={!monthlyStats.ranking.length} className="h-8 text-xs gap-1.5">
                        <Download className="w-3.5 h-3.5" /> CSV
                    </Button>
                </div>

                {loadingMonthly ? (
                    <div className="flex items-center justify-center py-16 gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-[#044F88]" />
                        <span className="text-sm text-[#6f6f6f]">{t('common.loading')}</span>
                    </div>
                ) : monthlyStats.ranking.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-2">
                        <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center',
                            mode === 'late' ? 'bg-emerald-50' : 'bg-slate-50')}>
                            <cfg.iconEmpty className={cn('w-6 h-6', mode === 'late' ? 'text-emerald-400' : 'text-slate-300')} />
                        </div>
                        <p className="text-sm text-[#6f6f6f]">{cfg.emptyMonthly}</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className={dark ? 'bg-white/[0.03] text-white/40' : 'bg-slate-50 text-[#6f6f6f]'}>
                                    <th className="text-left px-5 py-3 font-semibold w-12">#</th>
                                    <th className="text-left px-5 py-3 font-semibold">{t('admin.reports.employeeName')}</th>
                                    <th className="text-left px-5 py-3 font-semibold">{t('admin.reports.department')}</th>
                                    <th className="text-center px-5 py-3 font-semibold">{cfg.colCount}</th>
                                    <th className="text-left px-5 py-3 font-semibold hidden md:table-cell">{cfg.colDates}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {monthlyStats.ranking.map((r, i) => (
                                    <tr key={r.empId} className={cn('border-t', dark ? 'border-white/5 hover:bg-white/[0.04]' : 'border-slate-50 hover:bg-slate-50/50')}>
                                        <td className={cn('px-5 py-3', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>{i + 1}</td>
                                        <td className={cn('px-5 py-3 font-medium', dark ? 'text-white' : 'text-[#1d1d1d]')}>{r.name}</td>
                                        <td className={cn('px-5 py-3', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>{r.department}</td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={cn(
                                                'inline-flex items-center justify-center min-w-[28px] px-2 py-0.5 rounded-full text-xs font-bold',
                                                mode === 'late'
                                                    ? (r.count >= 5 ? cfg.badgeHigh : r.count >= 3 ? cfg.badgeMid : cfg.badgeLow)
                                                    : cfg.badgeHigh
                                            )}>
                                                {r.count}
                                            </span>
                                        </td>
                                        <td className={cn('px-5 py-3 text-xs hidden md:table-cell', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>
                                            <div className="flex flex-wrap gap-1">
                                                {r.dates.map(d => (
                                                    <span key={d} className={cn('px-2 py-0.5 rounded font-medium', cfg.dateBadge)}>
                                                        {formatThaiDate(d)}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Card>

            {/* ── Yearly chart + ranking ── */}
            <div data-tour="report-yearly-chart" className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bar chart */}
                <Card className={cn('overflow-hidden', dark ? 'bg-white/[0.06] border-white/10 shadow-none' : 'border-slate-200 shadow-sm')}>
                    <div className={cn('px-5 py-4 border-b', dark ? 'border-white/10' : 'border-slate-100')}>
                        <h3 className={cn('font-semibold flex items-center gap-2', dark ? 'text-white' : 'text-[#1d1d1d]')}>
                            <cfg.iconChart className="w-5 h-5 text-[#044F88]" />
                            {cfg.yearlyChartTitle} — {viewYear + 543}
                        </h3>
                    </div>

                    {loadingYearly ? (
                        <div className="flex items-center justify-center py-16 gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-[#044F88]" />
                            <span className="text-sm text-[#6f6f6f]">{t('common.loading')}</span>
                        </div>
                    ) : (
                        <div className="p-5">
                            <div className="flex items-end justify-between h-48 gap-1.5">
                                {yearlyMonthlyBreakdown.map((m, i) => {
                                    const val = m[barKey];
                                    const barH = maxBarVal > 0 ? Math.max((val / maxBarVal) * 100, val > 0 ? 8 : 0) : 0;
                                    const isCurrent = i === viewMonth && viewYear === now.getFullYear();
                                    return (
                                        <div key={i} className="flex flex-col items-center flex-1 h-full">
                                            <div className="w-full max-w-[36px] rounded-t-md relative h-full flex items-end justify-center">
                                                <div
                                                    className={cn(
                                                        'w-full rounded-t-md transition-all duration-300',
                                                        isCurrent ? cfg.barCurrent : cfg.barDefault
                                                    )}
                                                    style={{ height: `${barH}%` }}
                                                />
                                                {val > 0 && (
                                                    <span className={cn('absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold', cfg.barLabel)}>
                                                        {val}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={cn(
                                                'text-[10px] font-medium mt-1.5',
                                                isCurrent ? cn(cfg.barLabel, 'font-bold') : 'text-slate-400'
                                            )}>
                                                {THAI_MONTHS_SHORT[i]}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="text-center mt-4 text-sm text-[#6f6f6f]">
                                {cfg.yearlyTotalLabel} <span className={cn('font-bold', cfg.totalColor)}>{yearlyFilteredTotal}</span> {cfg.yearlyTotalUnit}
                            </div>
                        </div>
                    )}
                </Card>

                {/* Yearly ranking */}
                <Card className={cn('overflow-hidden', dark ? 'bg-white/[0.06] border-white/10 shadow-none' : 'border-slate-200 shadow-sm')}>
                    <div className={cn('px-5 py-4 border-b flex items-center justify-between', dark ? 'border-white/10' : 'border-slate-100')}>
                        <h3 className={cn('font-semibold flex items-center gap-2', dark ? 'text-white' : 'text-[#1d1d1d]')}>
                            <cfg.iconRank className={cn('w-5 h-5', cfg.iconRankColor)} />
                            {cfg.yearlyRankTitle} {viewYear + 543}
                        </h3>
                        <Button variant="outline" size="sm" onClick={exportYearlyCSV}
                            disabled={!yearlyRanking.length} className="h-8 text-xs gap-1.5">
                            <Download className="w-3.5 h-3.5" /> CSV
                        </Button>
                    </div>

                    {loadingYearly ? (
                        <div className="flex items-center justify-center py-16 gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-[#044F88]" />
                            <span className="text-sm text-[#6f6f6f]">{t('common.loading')}</span>
                        </div>
                    ) : yearlyRanking.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-2">
                            <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center',
                                mode === 'late' ? 'bg-emerald-50' : 'bg-slate-50')}>
                                <cfg.iconEmpty className={cn('w-6 h-6', mode === 'late' ? 'text-emerald-400' : 'text-slate-300')} />
                            </div>
                            <p className="text-sm text-[#6f6f6f]">{cfg.emptyYearly}</p>
                        </div>
                    ) : (
                        <div className={cn('divide-y max-h-[360px] overflow-y-auto', dark ? 'divide-white/5' : 'divide-slate-50')}>
                            {yearlyRanking.map((r, i) => {
                                const barW = Math.max((r.count / yearlyRanking[0].count) * 100, 10);
                                return (
                                    <div key={r.empId} className={cn('px-5 py-3 flex items-center gap-4', dark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50/50')}>
                                        <span className={cn(
                                            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                                            cfg.rankColors[Math.min(i, 3)]
                                        )}>
                                            {i + 1}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-baseline gap-2">
                                                <span className={cn('text-sm font-medium truncate', dark ? 'text-white' : 'text-[#1d1d1d]')}>{r.name}</span>
                                                <span className={cn('text-[10px] shrink-0', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>{r.department}</span>
                                            </div>
                                            <div className={cn('mt-1.5 w-full rounded-full h-1.5', dark ? 'bg-white/10' : 'bg-slate-100')}>
                                                <div className={cn('h-1.5 rounded-full transition-all', cfg.progressBar)}
                                                    style={{ width: `${barW}%` }} />
                                            </div>
                                        </div>
                                        <span className={cn('text-sm font-bold shrink-0', cfg.totalColor)}>
                                            {r.count} {cfg.rankUnit}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </Card>
            </div>

            {/* ── Department breakdown ── */}
            <Card className={cn('overflow-hidden', dark ? 'bg-white/[0.06] border-white/10 shadow-none' : 'border-slate-200 shadow-sm')}>
                <div className={cn('px-5 py-4 border-b', dark ? 'border-white/10' : 'border-slate-100')}>
                    <h3 className={cn('font-semibold flex items-center gap-2', dark ? 'text-white' : 'text-[#1d1d1d]')}>
                        <BarChart3 className="w-5 h-5 text-indigo-500" />
                        {t('admin.reports.deptBreakdown')}
                    </h3>
                </div>
                <div className="p-5 space-y-4">
                    {Array.from(new Set(employees.map(e => e.department))).map(dept => {
                        const empCount = employees.filter(e => e.department === dept).length;
                        const pct = employees.length > 0 ? Math.round((empCount / employees.length) * 100) : 0;
                        const deptFiltered = monthlyLogs.filter(l => l.status === filterStatus && empMap.get(l.employeeId)?.department === dept).length;
                        return (
                            <div key={dept}>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className={cn('font-medium', dark ? 'text-white' : 'text-[#1d1d1d]')}>{dept}</span>
                                    <span className={dark ? 'text-white/40' : 'text-[#6f6f6f]'}>
                                        {empCount} {t('common.person')}
                                        {deptFiltered > 0 && (
                                            <span className={cn('ml-2', cfg.totalColor)}>
                                                · {cfg.label} {deptFiltered} {t('common.times')}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className={cn('w-full rounded-full h-2', dark ? 'bg-white/10' : 'bg-slate-100')}>
                                    <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}

// ── Sub-components ──────────────────────────────────────────────────────────

function SummaryCard({ icon: Icon, label, value, unit, color }: {
    icon: React.ElementType; label: string; value: string; unit?: string; color: string;
}) {
    const { dark } = useAdminTheme();
    return (
        <Card className={cn('p-4 flex items-center gap-4', dark ? 'bg-white/[0.06] border-white/10 shadow-none' : 'border-slate-200 shadow-sm')}>
            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', color)}>
                <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
                <p className={cn('text-[11px] font-semibold uppercase tracking-wider', dark ? 'text-white/50' : 'text-[#6f6f6f]')}>{label}</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                    <span className={cn('text-xl font-black', dark ? 'text-white' : 'text-[#1d1d1d]')}>{value}</span>
                    {unit && <span className={cn('text-xs', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>{unit}</span>}
                </div>
            </div>
        </Card>
    );
}
