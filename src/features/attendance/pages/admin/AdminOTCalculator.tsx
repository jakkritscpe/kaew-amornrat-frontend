import { useState, useMemo } from 'react';
import { useAttendance } from '../../contexts/AttendanceContext';
import {
    Calculator, Users, Clock, DollarSign, Download, CalendarDays,
    ChevronDown, TrendingUp, CalendarX, ArrowRight, Sparkles,
    ChevronLeft, ChevronRight as ChevronRightIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const THAI_MONTHS = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.',
];
const THAI_MONTHS_FULL = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

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

function formatCurrency(v: number): string {
    return v.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function AdminOTCalculator() {
    const { employees, logs, companySettings } = useAttendance();

    const now = new Date();
    const [periodMode, setPeriodMode] = useState<PeriodMode>('monthly');
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [startDate, setStartDate] = useState(
        new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);

    const dateRange = useMemo(() => {
        if (periodMode === 'monthly') {
            const start = new Date(selectedYear, selectedMonth, 1);
            const end = new Date(selectedYear, selectedMonth + 1, 0);
            return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
        }
        return { start: startDate, end: endDate };
    }, [periodMode, selectedMonth, selectedYear, startDate, endDate]);

    const otData = useMemo(() => {
        const workingDays = periodMode === 'monthly' ? getWorkingDays(selectedYear, selectedMonth) : 22;
        const HOURS_PER_DAY = 8;
        return employees.map(emp => {
            const empLogs = logs.filter(l => l.employeeId === emp.id && l.date >= dateRange.start && l.date <= dateRange.end);
            const totalOtHours = empLogs.reduce((sum, l) => sum + (l.otHours || 0), 0);
            const useDefault = emp.otRateConfig?.useDefault ?? true;
            const rateType = useDefault ? companySettings.defaultOtRateType : (emp.otRateConfig?.type || 'multiplier');
            const rateValue = useDefault ? companySettings.defaultOtRateValue : (emp.otRateConfig?.value || 0);
            let otPay = 0;
            if (rateType === 'multiplier') {
                const baseWage = emp.baseWage || 0;
                const hourlyRate = baseWage > 0 ? baseWage / (workingDays * HOURS_PER_DAY) : 0;
                otPay = totalOtHours * hourlyRate * rateValue;
            } else {
                otPay = totalOtHours * rateValue;
            }
            return { employee: emp, totalOtHours, rateType, rateValue, otPay: Math.round(otPay * 100) / 100, logCount: empLogs.length };
        }).filter(d => d.totalOtHours > 0 || d.logCount > 0);
    }, [employees, logs, dateRange, companySettings, periodMode, selectedMonth, selectedYear]);

    const totalOtHours = otData.reduce((s, d) => s + d.totalOtHours, 0);
    const totalOtPay = otData.reduce((s, d) => s + d.otPay, 0);
    const employeesWithOt = otData.filter(d => d.totalOtHours > 0).length;
    const avgOtPerPerson = employeesWithOt > 0 ? totalOtHours / employeesWithOt : 0;
    const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

    const navigateMonth = (dir: -1 | 1) => {
        let m = selectedMonth + dir;
        let y = selectedYear;
        if (m < 0) { m = 11; y--; }
        if (m > 11) { m = 0; y++; }
        setSelectedMonth(m);
        setSelectedYear(y);
    };

    const exportCSV = () => {
        const header = 'พนักงาน,แผนก,ชั่วโมง OT,อัตรา,ประเภท,ค่า OT (บาท)';
        const rows = otData.map(d =>
            `"${d.employee.name}","${d.employee.department}",${d.totalOtHours},${d.rateValue},${d.rateType === 'multiplier' ? 'เท่า' : 'บาท/ชม.'},${d.otPay}`
        );
        const periodLabel = periodMode === 'monthly'
            ? `${THAI_MONTHS_FULL[selectedMonth]} ${selectedYear + 543}`
            : `${dateRange.start} ถึง ${dateRange.end}`;
        const csvContent = `\uFEFF# สรุปค่าล่วงเวลา – ${periodLabel}\n${header}\n${rows.join('\n')}\n\n# ยอดรวม,,${totalOtHours},,,${totalOtPay}`;
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ot-summary-${dateRange.start}-to-${dateRange.end}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const periodLabel = periodMode === 'monthly'
        ? `${THAI_MONTHS_FULL[selectedMonth]} ${selectedYear + 543}`
        : `${dateRange.start} – ${dateRange.end}`;

    // ─── SUMMARY CARD DATA ───
    const summaryCards = [
        {
            label: 'ยอดรวมค่า OT',
            value: formatCurrency(totalOtPay),
            unit: 'บาท',
            icon: DollarSign,
            gradient: 'from-emerald-500 to-teal-600',
            bgLight: 'bg-emerald-50',
            textColor: 'text-emerald-700',
            ring: 'ring-emerald-500/20',
        },
        {
            label: 'ชั่วโมง OT รวม',
            value: totalOtHours.toFixed(1),
            unit: 'ชั่วโมง',
            icon: Clock,
            gradient: 'from-blue-500 to-indigo-600',
            bgLight: 'bg-blue-50',
            textColor: 'text-blue-700',
            ring: 'ring-blue-500/20',
        },
        {
            label: 'พนักงานที่มี OT',
            value: String(employeesWithOt),
            unit: 'คน',
            icon: Users,
            gradient: 'from-violet-500 to-purple-600',
            bgLight: 'bg-violet-50',
            textColor: 'text-violet-700',
            ring: 'ring-violet-500/20',
        },
        {
            label: 'เฉลี่ยต่อคน',
            value: avgOtPerPerson.toFixed(1),
            unit: 'ชม./คน',
            icon: TrendingUp,
            gradient: 'from-amber-500 to-orange-600',
            bgLight: 'bg-amber-50',
            textColor: 'text-amber-700',
            ring: 'ring-amber-500/20',
        },
    ];

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-8 space-y-5 sm:space-y-6">

                {/* ════════════════════════════════════════════ */}
                {/* ── HEADER ──                                 */}
                {/* ════════════════════════════════════════════ */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/25">
                                <Calculator className="w-5 h-5 text-white" />
                            </div>
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                คำนวณค่าล่วงเวลา
                            </h1>
                        </div>
                        <p className="text-sm text-slate-500 pl-[3.25rem]">
                            สรุปยอดชั่วโมงและค่าตอบแทน OT ของพนักงาน
                        </p>
                    </div>
                    <Button
                        onClick={exportCSV}
                        className="bg-white text-slate-700 border border-slate-200 shadow-sm hover:bg-slate-50 hover:shadow-md hover:border-slate-300 active:scale-[0.98] transition-all duration-200 h-10 px-4 text-sm font-medium"
                    >
                        <Download className="w-4 h-4 mr-2 text-slate-500" />
                        ส่งออก CSV
                    </Button>
                </div>

                {/* ════════════════════════════════════════════ */}
                {/* ── PERIOD SELECTOR ──                        */}
                {/* ════════════════════════════════════════════ */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                    {/* Segmented Control */}
                    <div className="px-4 sm:px-5 pt-4 sm:pt-5 pb-0">
                        <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-0.5">
                            {(['monthly', 'custom'] as PeriodMode[]).map(mode => (
                                <button
                                    key={mode}
                                    type="button"
                                    onClick={() => setPeriodMode(mode)}
                                    className={cn(
                                        'relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap',
                                        periodMode === mode
                                            ? 'bg-white text-slate-900 shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700',
                                    )}
                                >
                                    {mode === 'monthly' ? (
                                        <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5" /> รายเดือน</span>
                                    ) : (
                                        <span className="flex items-center gap-1.5"><ArrowRight className="w-3.5 h-3.5" /> กำหนดเอง</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="p-4 sm:p-5">
                        {periodMode === 'monthly' ? (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                                {/* Month Navigator */}
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">เดือน</label>
                                    <div className="flex items-center gap-1.5">
                                        <button
                                            type="button"
                                            onClick={() => navigateMonth(-1)}
                                            className="shrink-0 w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50 active:scale-95 transition-all"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <div className="relative flex-1">
                                            <select
                                                className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 h-10 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all cursor-pointer"
                                                value={selectedMonth}
                                                onChange={e => setSelectedMonth(Number(e.target.value))}
                                            >
                                                {THAI_MONTHS_FULL.map((m, i) => (
                                                    <option key={i} value={i}>{m}</option>
                                                ))}
                                            </select>
                                            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => navigateMonth(1)}
                                            className="shrink-0 w-10 h-10 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 hover:border-slate-300 hover:bg-slate-50 active:scale-95 transition-all"
                                        >
                                            <ChevronRightIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                {/* Year */}
                                <div className="w-full sm:w-36">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">ปี (พ.ศ.)</label>
                                    <div className="relative">
                                        <select
                                            className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-4 pr-10 h-10 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all cursor-pointer"
                                            value={selectedYear}
                                            onChange={e => setSelectedYear(Number(e.target.value))}
                                        >
                                            {yearOptions.map(y => (
                                                <option key={y} value={y}>{y + 543}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">วันที่เริ่มต้น</label>
                                    <input
                                        type="date"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 h-10 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="hidden sm:flex items-center pb-0.5">
                                    <div className="w-8 h-px bg-slate-300" />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">วันที่สิ้นสุด</label>
                                    <input
                                        type="date"
                                        className="w-full rounded-xl border border-slate-200 bg-white px-4 h-10 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 transition-all"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ════════════════════════════════════════════ */}
                {/* ── SUMMARY CARDS ──                          */}
                {/* ════════════════════════════════════════════ */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {summaryCards.map((card, i) => {
                        const Icon = card.icon;
                        return (
                            <div key={i} className="group relative bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
                                {/* Subtle gradient top stripe */}
                                <div className={cn('absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-80', card.gradient)} />
                                <div className="p-4 sm:p-5 pt-5 sm:pt-6">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className={cn('p-2 sm:p-2.5 rounded-xl border shadow-sm', card.bgLight, `border-${card.textColor.replace('text-', '')}/10`)}>
                                            <Icon className={cn('w-4 h-4 sm:w-5 sm:h-5', card.textColor)} />
                                        </div>
                                    </div>
                                    <p className="text-[11px] sm:text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">{card.label}</p>
                                    <div className="flex items-baseline gap-1.5">
                                        <p className="text-xl sm:text-2xl lg:text-[1.75rem] font-extrabold text-slate-900 tabular-nums leading-none tracking-tight">
                                            {card.value}
                                        </p>
                                        <span className="text-[10px] sm:text-xs font-medium text-slate-400">{card.unit}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* ════════════════════════════════════════════ */}
                {/* ── DETAIL TABLE / MOBILE CARDS ──            */}
                {/* ════════════════════════════════════════════ */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                    {/* Table Header */}
                    <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-amber-500" />
                                รายละเอียด OT รายบุคคล
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5 font-medium">{periodLabel} · {otData.length} รายการ</p>
                        </div>
                        {otData.length > 0 && (
                            <div className="flex items-center gap-2 text-xs font-semibold">
                                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/10 tabular-nums">
                                    ฿ {formatCurrency(totalOtPay)}
                                </span>
                                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/10 tabular-nums">
                                    {totalOtHours.toFixed(1)} ชม.
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Empty State */}
                    {otData.length === 0 ? (
                        <div className="px-6 py-20 text-center">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-slate-50 to-slate-100 mb-5 ring-1 ring-slate-200/60">
                                <CalendarX className="w-9 h-9 text-slate-300" />
                            </div>
                            <p className="text-slate-600 font-semibold text-base mb-1">ไม่พบข้อมูล OT</p>
                            <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
                                ยังไม่มีข้อมูลล่วงเวลาในช่วง <span className="font-medium text-slate-500">{periodLabel}</span> ลองเลือกช่วงเวลาอื่น
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* ── DESKTOP TABLE (hidden on mobile) ── */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="bg-slate-50/80 border-b border-slate-200/60">
                                            <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">พนักงาน</th>
                                            <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest">แผนก</th>
                                            <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">ชั่วโมง OT</th>
                                            <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-center hidden lg:table-cell">ประเภท</th>
                                            <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right hidden lg:table-cell">อัตรา</th>
                                            <th className="px-6 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-widest text-right">ค่า OT</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100/80">
                                        {otData.map((d, idx) => (
                                            <tr key={d.employee.id} className="group hover:bg-blue-50/40 transition-colors duration-150">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative">
                                                            <img
                                                                src={d.employee.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.employee.name)}&background=eff6ff&color=1e3a8a&bold=true&size=40`}
                                                                alt=""
                                                                className="w-9 h-9 rounded-xl object-cover bg-blue-100 shadow-sm ring-2 ring-white group-hover:ring-blue-100 transition-all"
                                                                loading="lazy"
                                                            />
                                                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center text-[8px] font-black text-slate-400 ring-1 ring-slate-200">
                                                                {idx + 1}
                                                            </span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-semibold text-slate-900 truncate">{d.employee.name}</p>
                                                            {d.employee.nickname && <p className="text-[11px] text-slate-400 truncate">({d.employee.nickname})</p>}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-slate-600 text-sm">{d.employee.department}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-bold text-slate-900 tabular-nums">{d.totalOtHours.toFixed(1)}</span>
                                                    <span className="text-slate-400 text-xs ml-1">ชม.</span>
                                                </td>
                                                <td className="px-6 py-4 text-center hidden lg:table-cell">
                                                    <span className={cn(
                                                        'inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide',
                                                        d.rateType === 'multiplier'
                                                            ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/15'
                                                            : 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15'
                                                    )}>
                                                        {d.rateType === 'multiplier' ? 'ตัวคูณ' : 'บาท/ชม.'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-semibold text-slate-700 tabular-nums hidden lg:table-cell">
                                                    {d.rateValue}{d.rateType === 'multiplier' ? '×' : '฿'}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="font-extrabold text-emerald-700 tabular-nums text-base">
                                                        {formatCurrency(d.otPay)}
                                                    </span>
                                                    <span className="text-emerald-500 text-xs ml-0.5">฿</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gradient-to-r from-slate-50 to-emerald-50/40 border-t-2 border-slate-200 font-bold">
                                            <td className="px-6 py-4 text-slate-900" colSpan={2}>
                                                <span className="flex items-center gap-1.5">
                                                    <DollarSign className="w-4 h-4 text-emerald-600" />
                                                    รวมทั้งหมด
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right text-slate-900 tabular-nums">{totalOtHours.toFixed(1)} <span className="font-medium text-slate-400 text-xs">ชม.</span></td>
                                            <td className="px-6 py-4 hidden lg:table-cell" colSpan={2}></td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-emerald-700 tabular-nums text-xl">{formatCurrency(totalOtPay)}</span>
                                                <span className="text-emerald-500 ml-1">฿</span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* ── MOBILE CARD VIEW (visible only on mobile) ── */}
                            <div className="sm:hidden divide-y divide-slate-100">
                                {otData.map((d, idx) => (
                                    <div key={d.employee.id} className="px-4 py-4 hover:bg-slate-50/60 transition-colors">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                <div className="relative shrink-0">
                                                    <img
                                                        src={d.employee.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.employee.name)}&background=eff6ff&color=1e3a8a&bold=true&size=40`}
                                                        alt="" className="w-10 h-10 rounded-xl object-cover bg-blue-100 shadow-sm ring-2 ring-white" loading="lazy"
                                                    />
                                                    <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-white rounded-full flex items-center justify-center text-[9px] font-black text-slate-400 ring-1 ring-slate-200">
                                                        {idx + 1}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-slate-900 text-sm truncate">{d.employee.name}</p>
                                                    <p className="text-[11px] text-slate-500 truncate">{d.employee.department} · {d.employee.position}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-2">
                                            <div className="bg-blue-50/60 rounded-xl px-3 py-2 text-center ring-1 ring-inset ring-blue-100/60">
                                                <p className="text-[10px] font-medium text-blue-600 mb-0.5">ชั่วโมง OT</p>
                                                <p className="text-sm font-bold text-blue-800 tabular-nums">{d.totalOtHours.toFixed(1)}</p>
                                            </div>
                                            <div className="bg-slate-50/60 rounded-xl px-3 py-2 text-center ring-1 ring-inset ring-slate-100">
                                                <p className="text-[10px] font-medium text-slate-500 mb-0.5">อัตรา</p>
                                                <p className="text-sm font-bold text-slate-800 tabular-nums">
                                                    {d.rateValue}{d.rateType === 'multiplier' ? '×' : '฿'}
                                                </p>
                                            </div>
                                            <div className="bg-emerald-50/60 rounded-xl px-3 py-2 text-center ring-1 ring-inset ring-emerald-100/60">
                                                <p className="text-[10px] font-medium text-emerald-600 mb-0.5">ค่า OT</p>
                                                <p className="text-sm font-bold text-emerald-800 tabular-nums">{formatCurrency(d.otPay)}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {/* Mobile total */}
                                <div className="px-4 py-4 bg-gradient-to-r from-slate-50 to-emerald-50/40">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                                            <DollarSign className="w-4 h-4 text-emerald-600" />
                                            รวมทั้งหมด
                                        </span>
                                        <div className="text-right">
                                            <p className="text-lg font-extrabold text-emerald-700 tabular-nums">{formatCurrency(totalOtPay)} <span className="text-sm">฿</span></p>
                                            <p className="text-[11px] text-slate-500 font-medium">{totalOtHours.toFixed(1)} ชม. · {employeesWithOt} คน</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
