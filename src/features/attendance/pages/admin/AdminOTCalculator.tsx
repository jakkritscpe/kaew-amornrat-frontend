import { useState, useMemo } from 'react';
import { useAttendance } from '../../contexts/AttendanceContext';
import {
    Download, ChevronLeft, ChevronRight, CalendarRange,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const MONTHS_FULL = [
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

function fmt(v: number): string {
    return v.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

export function AdminOTCalculator() {
    const { employees, logs, companySettings } = useAttendance();

    const now = new Date();
    const [periodMode, setPeriodMode] = useState<PeriodMode>('monthly');
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear, setSelectedYear] = useState(now.getFullYear());
    const [startDate, setStartDate] = useState(new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(now.toISOString().split('T')[0]);

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
                const h = (emp.baseWage || 0) > 0 ? (emp.baseWage || 0) / (wd * 8) : 0;
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
        const h = 'พนักงาน,แผนก,ชั่วโมง OT,อัตรา,ประเภท,ค่า OT (บาท)';
        const r = otData.map(d => `"${d.emp.name}","${d.emp.department}",${d.hrs},${d.rVal},${d.rType === 'multiplier' ? 'เท่า' : 'บาท/ชม.'},${d.pay}`);
        const lbl = periodMode === 'monthly' ? `${MONTHS_FULL[selectedMonth]} ${selectedYear + 543}` : `${dateRange.start} ถึง ${dateRange.end}`;
        const csv = `\uFEFF# สรุปค่าล่วงเวลา – ${lbl}\n${h}\n${r.join('\n')}\n\n# ยอดรวม,,${totHrs},,,${totPay}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url;
        a.download = `ot-${dateRange.start}-${dateRange.end}.csv`; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">

                {/* ═══════════ PAGE HEADER ═══════════ */}
                <header className="mb-5 sm:mb-6">
                    <h1 className="text-xl sm:text-2xl font-semibold text-[#1d1d1d] mb-0.5">คำนวณค่าล่วงเวลา</h1>
                    <p className="text-sm text-[#6f6f6f]">สรุปยอดชั่วโมงและค่าตอบแทน OT ของพนักงาน</p>
                </header>

                {/* ═══════════ PERIOD BAR ═══════════ */}
                <div className="flex flex-col gap-4 mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-slate-200">
                    {/* Row 1 on mobile / inline on desktop: Tabs + Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        {/* Mode Tabs */}
                        <div className="flex items-center gap-0 border border-slate-200 rounded-lg overflow-hidden bg-white self-start">
                            {(['monthly', 'custom'] as PeriodMode[]).map(mode => (
                                <button key={mode} type="button"
                                    onClick={() => setPeriodMode(mode)}
                                    className={cn(
                                        'px-4 py-2.5 sm:py-2 text-sm font-medium transition-colors min-w-[5.5rem] sm:min-w-0',
                                        periodMode === mode
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-white text-slate-600 hover:bg-slate-50',
                                    )}
                                >
                                    {mode === 'monthly' ? 'รายเดือน' : 'กำหนดเอง'}
                                </button>
                            ))}
                        </div>

                        {/* Controls */}
                        {periodMode === 'monthly' ? (
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button onClick={() => navMonth(-1)} className="w-10 h-10 sm:w-9 sm:h-9 shrink-0 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-400 active:scale-95 transition-all">
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 h-10 sm:h-9 flex-1 sm:flex-initial">
                                    <select className="appearance-none bg-transparent text-sm font-semibold text-slate-900 pr-1 cursor-pointer focus:outline-none flex-1 sm:flex-initial" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                                        {MONTHS_FULL.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                    </select>
                                    <span className="text-slate-300">|</span>
                                    <select className="appearance-none bg-transparent text-sm font-semibold text-slate-900 cursor-pointer focus:outline-none" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                                        {yearOpts.map(y => <option key={y} value={y}>{y + 543}</option>)}
                                    </select>
                                </div>
                                <button onClick={() => navMonth(1)} className="w-10 h-10 sm:w-9 sm:h-9 shrink-0 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-400 active:scale-95 transition-all">
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                                <input type="date" className="h-10 sm:h-9 w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-slate-400 transition-colors" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                <span className="text-slate-300 text-sm text-center hidden sm:block">→</span>
                                <span className="text-slate-400 text-xs text-center sm:hidden">ถึง</span>
                                <input type="date" className="h-10 sm:h-9 w-full sm:w-auto rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-slate-400 transition-colors" value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════════ STATS ROW ═══════════ */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
                    {[
                        { label: 'ยอดค่า OT รวม', value: `฿${fmt(totPay)}`, sub: 'บาท', color: 'text-emerald-600' },
                        { label: 'ชั่วโมง OT รวม', value: totHrs.toFixed(1), sub: 'ชั่วโมง', color: 'text-[#1d1d1d]' },
                        { label: 'พนักงานที่มี OT', value: String(pplWithOt), sub: 'คน', color: 'text-[#1d1d1d]' },
                        { label: 'เฉลี่ยต่อคน', value: avgHrs.toFixed(1), sub: 'ชม./คน', color: 'text-[#1d1d1d]' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-4 sm:px-5 sm:py-5">
                            <p className="text-xs text-[#6f6f6f] font-medium mb-2 truncate">{s.label}</p>
                            <p className={cn('text-xl sm:text-2xl font-semibold tabular-nums leading-none', s.color)}>{s.value}</p>
                            <p className="text-[11px] text-[#6f6f6f] mt-1">{s.sub}</p>
                        </div>
                    ))}
                </div>

                {/* ═══════════ TABLE CARD ═══════════ */}

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    {/* Card Header */}
                    <div className="p-5 sm:p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div>
                            <h3 className="font-semibold text-lg text-[#1d1d1d]">รายละเอียด OT รายบุคคล</h3>
                            <p className="text-sm text-[#6f6f6f]">{otData.length} รายการ · {periodMode === 'monthly' ? `${MONTHS_FULL[selectedMonth]} ${selectedYear + 543}` : `${dateRange.start} – ${dateRange.end}`}</p>
                        </div>
                        <Button onClick={exportCSV} variant="outline" className="gap-2 self-start sm:self-auto">
                            <Download className="w-4 h-4" />
                            <span>ส่งออก CSV</span>
                        </Button>
                    </div>

                    {otData.length === 0 ? (
                        /* ── Empty State ── */
                        <div className="py-20 text-center">
                            <CalendarRange className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                            <p className="text-[#1d1d1d] font-medium">ไม่พบข้อมูล OT ในช่วงเวลานี้</p>
                            <p className="text-sm text-[#6f6f6f] mt-1">ลองเปลี่ยนเดือนหรือช่วงวันที่</p>
                        </div>
                    ) : (
                        <>
                            {/* ── Desktop Table ── */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full border-collapse text-sm">
                                    <thead>
                                        <tr className="bg-gray-50/50 border-b border-gray-200">
                                            <th className="w-12 text-left text-xs text-[#6f6f6f] font-semibold uppercase tracking-wider pl-6 pr-4 py-4">#</th>
                                            <th className="text-left text-xs text-[#6f6f6f] font-semibold uppercase tracking-wider px-4 py-4">พนักงาน</th>
                                            <th className="text-left text-xs text-[#6f6f6f] font-semibold uppercase tracking-wider px-4 py-4 hidden lg:table-cell">แผนก</th>
                                            <th className="text-right text-xs text-[#6f6f6f] font-semibold uppercase tracking-wider px-4 py-4">ชั่วโมง OT</th>
                                            <th className="text-center text-xs text-[#6f6f6f] font-semibold uppercase tracking-wider px-4 py-4 hidden lg:table-cell">อัตรา</th>
                                            <th className="text-right text-xs text-[#6f6f6f] font-semibold uppercase tracking-wider pl-4 pr-6 py-4">ค่า OT (฿)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {otData.map((d, i) => (
                                            <tr key={d.emp.id} className="group border-b border-gray-100 transition-colors duration-200 hover:bg-[#e8f1fe]/30">
                                                <td className="pl-6 pr-4 py-4 font-mono text-xs text-[#6f6f6f] align-top">{String(i + 1).padStart(2, '0')}</td>
                                                <td className="px-4 py-4 align-top">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={d.emp.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.emp.name)}&background=eff6ff&color=1e3a8a&bold=true&size=36`}
                                                            alt="" className="w-8 h-8 rounded-full object-cover bg-blue-50 shrink-0" loading="lazy"
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="font-medium text-sm text-[#1d1d1d] group-hover:text-[#2075f8] transition-colors truncate">{d.emp.name}</p>
                                                            {d.emp.nickname && <p className="text-xs text-[#6f6f6f] truncate">({d.emp.nickname})</p>}
                                                            <p className="text-xs text-[#6f6f6f] truncate lg:hidden">{d.emp.department}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-sm text-[#6f6f6f] align-top hidden lg:table-cell">{d.emp.department}</td>
                                                <td className="px-4 py-4 text-right align-top">
                                                    <span className="font-semibold text-sm text-[#1d1d1d] tabular-nums">{d.hrs.toFixed(1)}</span>
                                                    <span className="text-xs text-[#6f6f6f] ml-1">ชม.</span>
                                                </td>
                                                <td className="px-4 py-4 text-center align-top hidden lg:table-cell">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-[#6f6f6f]">
                                                        {d.rVal}{d.rType === 'multiplier' ? '×' : '฿/ชม.'}
                                                    </span>
                                                </td>
                                                <td className="pl-4 pr-6 py-4 text-right align-top">
                                                    <span className="font-semibold text-sm text-emerald-600 tabular-nums">{fmt(d.pay)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr className="bg-gray-50/50 border-t border-gray-200">
                                            <td className="pl-6 pr-4 py-4" colSpan={3}>
                                                <span className="font-semibold text-sm text-[#1d1d1d]">รวมทั้งหมด</span>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="font-semibold text-sm text-[#1d1d1d] tabular-nums">{totHrs.toFixed(1)} ชม.</span>
                                            </td>
                                            <td className="px-4 py-4 hidden lg:table-cell"></td>
                                            <td className="pl-4 pr-6 py-4 text-right">
                                                <span className="font-semibold text-base text-emerald-600 tabular-nums">฿{fmt(totPay)}</span>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* ── Mobile List ── */}
                            <div className="sm:hidden divide-y divide-gray-100">
                                {otData.map((d, i) => (
                                    <div key={d.emp.id} className="p-4 flex items-center gap-3 hover:bg-[#e8f1fe]/30 transition-colors">
                                        <span className="text-xs font-mono text-[#6f6f6f] w-5 shrink-0 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                                        <img
                                            src={d.emp.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.emp.name)}&background=eff6ff&color=1e3a8a&bold=true&size=36`}
                                            alt="" className="w-9 h-9 rounded-full object-cover bg-blue-50 shrink-0" loading="lazy"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-medium text-sm text-[#1d1d1d] truncate">{d.emp.name}</p>
                                            <p className="text-xs text-[#6f6f6f] truncate">{d.emp.department} · {d.hrs.toFixed(1)} ชม. · อัตรา {d.rVal}{d.rType === 'multiplier' ? '×' : '฿/ชม.'}</p>
                                        </div>
                                        <p className="font-semibold text-sm text-emerald-600 tabular-nums shrink-0">฿{fmt(d.pay)}</p>
                                    </div>
                                ))}
                                {/* Mobile Total */}
                                <div className="p-4 sm:p-6 flex items-center justify-between bg-gray-50/50">
                                    <span className="font-semibold text-sm text-[#1d1d1d]">รวมทั้งหมด</span>
                                    <div className="text-right">
                                        <p className="font-semibold text-base text-emerald-600 tabular-nums">฿{fmt(totPay)}</p>
                                        <p className="text-xs text-[#6f6f6f]">{totHrs.toFixed(1)} ชม. · {pplWithOt} คน</p>
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
