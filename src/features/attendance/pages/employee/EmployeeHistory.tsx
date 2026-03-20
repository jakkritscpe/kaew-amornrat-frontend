import { useState, useMemo } from 'react';
import { useAttendance } from '../../contexts/useAttendance';
import { CheckCircle2, AlertCircle, XCircle, CalendarX, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatTime, formatDate, cn, decodeJwt } from '@/lib/utils';
import { EMPLOYEE_KEY, TOKEN_KEY } from '@/lib/api-client';
import { useTranslation } from '@/i18n';

function getEmployeeId(): string {
    try {
        const emp = localStorage.getItem(EMPLOYEE_KEY);
        if (emp) {
            const parsed = JSON.parse(emp);
            if (parsed?.id) return parsed.id;
        }
    } catch { /* ignore */ }
    try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            const payload = decodeJwt(token);
            if (payload?.sub) return payload.sub as string;
        }
    } catch { /* ignore */ }
    return '';
}

function getMonthOptions() {
    const opts: { value: string; label: string }[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' });
        opts.push({ value, label });
    }
    return opts;
}

const STATUS_CFG = {
    present:  { icon: CheckCircle2, dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    late:     { icon: AlertCircle,  dot: 'bg-amber-500',   badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    absent:   { icon: XCircle,      dot: 'bg-red-500',     badge: 'bg-red-50 text-red-700 border-red-200' },
    on_leave: { icon: CalendarX,    dot: 'bg-[#044F88]',    badge: 'bg-[#044F88]/5 text-[#00223A] border-[#044F88]/20' },
} as const;
const STATUS_LABEL_KEYS: Record<string, string> = {
    present: 'status.normal',
    late: 'status.late',
    absent: 'status.absent',
    on_leave: 'status.onLeave',
};
type StatusKey = keyof typeof STATUS_CFG;

export function EmployeeHistory() {
    const { t } = useTranslation();
    const { logs } = useAttendance();
    const employeeId = getEmployeeId();

    const monthOptions = useMemo(() => getMonthOptions(), []);
    const [monthIdx, setMonthIdx] = useState(0);
    const selectedMonth = monthOptions[monthIdx].value;

    const historyLogs = useMemo(() =>
        logs
            .filter(l => l.employeeId === employeeId && l.date.startsWith(selectedMonth))
            .sort((a, b) => b.date.localeCompare(a.date)),
        [logs, employeeId, selectedMonth]
    );

    const summary = useMemo(() => ({
        present: historyLogs.filter(l => l.status === 'present').length,
        late:    historyLogs.filter(l => l.status === 'late').length,
        absent:  historyLogs.filter(l => l.status === 'absent').length,
        otHours: historyLogs.reduce((s, l) => s + (l.otHours ?? 0), 0),
    }), [historyLogs]);

    return (
        <div className="flex flex-col min-h-full bg-[#f1f5f9]">

            {/* ── Blue hero ── */}
            <div className="bg-[#044F88] px-5 pt-3 pb-14">
                {/* Month navigator */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <p className="text-[#044F88]/80 text-xs font-semibold uppercase tracking-widest">{t('employee.history.title')}</p>
                        <h2 className="text-xl font-black text-white mt-0.5">{monthOptions[monthIdx].label}</h2>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <button
                            onClick={() => setMonthIdx(i => Math.min(i + 1, monthOptions.length - 1))}
                            disabled={monthIdx >= monthOptions.length - 1}
                            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white disabled:opacity-30 active:bg-white/30 touch-manipulation"
                        ><ChevronLeft className="w-4 h-4" /></button>
                        <button
                            onClick={() => setMonthIdx(i => Math.max(i - 1, 0))}
                            disabled={monthIdx <= 0}
                            className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white disabled:opacity-30 active:bg-white/30 touch-manipulation"
                        ><ChevronRight className="w-4 h-4" /></button>
                    </div>
                </div>

                {/* Summary stats */}
                <div className="grid grid-cols-4 gap-2">
                    {[
                        { label: t('employee.history.onTimeCount'),  value: summary.present,            color: 'text-emerald-300' },
                        { label: t('employee.history.lateCount'),   value: summary.late,               color: 'text-amber-300' },
                        { label: t('employee.history.absentCount'),  value: summary.absent,             color: 'text-red-300' },
                        { label: t('employee.history.otHours'),  value: summary.otHours.toFixed(1), color: 'text-white' },
                    ].map(s => (
                        <div key={s.label} className="bg-white/15 rounded-2xl p-2.5 text-center">
                            <p className={cn('text-2xl font-black tabular-nums leading-none', s.color)}>{s.value}</p>
                            <p className="text-[10px] text-[#044F88]/80 font-semibold mt-1">{s.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── White floating list ── */}
            <div className="flex-1 bg-white rounded-t-3xl -mt-6 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 pt-5 pb-6 relative z-10">
                {historyLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                            <CalendarX className="w-7 h-7 text-gray-300" />
                        </div>
                        <p className="font-bold text-[#1d1d1d]">{t('employee.history.noDataThisMonth')}</p>
                        <p className="text-sm text-[#6f6f6f]">{t('employee.history.tryOtherMonth')}</p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {historyLogs.map(log => {
                            const cfg = STATUS_CFG[log.status as StatusKey] ?? STATUS_CFG.absent;
                            const Icon = cfg.icon;
                            return (
                                <div key={log.id} className="bg-[#f8fafc] rounded-2xl border border-gray-100 px-4 py-3.5 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className={cn('w-2 h-2 rounded-full shrink-0', cfg.dot)} />
                                        <div className="min-w-0">
                                            <p className="font-bold text-[#1d1d1d] text-sm leading-tight">
                                                {formatDate(log.date)}
                                            </p>
                                            <div className="flex items-center gap-2 mt-1 text-xs text-[#6f6f6f]">
                                                <span className="tabular-nums">{formatTime(log.checkInTime)}</span>
                                                <span className="text-gray-300">→</span>
                                                <span className="tabular-nums">{formatTime(log.checkOutTime)}</span>
                                                {(log.workHours ?? 0) > 0 && (
                                                    <span className="font-semibold text-[#1d1d1d]">
                                                        · {log.workHours.toFixed(1)} {t('common.hours')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                                        <span className={cn(
                                            'inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border',
                                            cfg.badge
                                        )}>
                                            <Icon className="w-3 h-3" />
                                            {t(STATUS_LABEL_KEYS[log.status as string] ?? 'status.absent')}
                                        </span>
                                        {(log.otHours ?? 0) > 0 && (
                                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                                                <Zap className="w-3 h-3" />
                                                +{log.otHours} OT
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
