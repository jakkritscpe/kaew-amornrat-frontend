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
        <div className="min-h-[calc(100vh-4rem)] bg-[#fafafa]">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">

                {/* ═══════════ HERO HEADER ═══════════ */}
                <header className="mb-8 sm:mb-10">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Overtime Report</p>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none mb-1">
                        คำนวณค่าล่วงเวลา
                    </h1>
                    <p className="text-base text-slate-500 font-light">สรุปยอดชั่วโมงและค่าตอบแทน OT</p>
                </header>

                {/* ═══════════ PERIOD BAR ═══════════ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
                    {/* Left: Mode Tabs */}
                    <div className="flex items-center gap-0 border border-slate-200 rounded-lg overflow-hidden bg-white">
                        {(['monthly', 'custom'] as PeriodMode[]).map(mode => (
                            <button key={mode} type="button"
                                onClick={() => setPeriodMode(mode)}
                                className={cn(
                                    'px-4 py-2 text-sm font-medium transition-colors',
                                    periodMode === mode
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-white text-slate-600 hover:bg-slate-50',
                                )}
                            >
                                {mode === 'monthly' ? 'รายเดือน' : 'กำหนดเอง'}
                            </button>
                        ))}
                    </div>

                    {/* Right: Controls */}
                    {periodMode === 'monthly' ? (
                        <div className="flex items-center gap-2">
                            <button onClick={() => navMonth(-1)} className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-400 active:scale-95 transition-all">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 h-9">
                                <select className="appearance-none bg-transparent text-sm font-semibold text-slate-900 pr-1 cursor-pointer focus:outline-none" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                                    {MONTHS_FULL.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                </select>
                                <span className="text-slate-300">|</span>
                                <select className="appearance-none bg-transparent text-sm font-semibold text-slate-900 cursor-pointer focus:outline-none" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                                    {yearOpts.map(y => <option key={y} value={y}>{y + 543}</option>)}
                                </select>
                            </div>
                            <button onClick={() => navMonth(1)} className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:text-slate-900 hover:border-slate-400 active:scale-95 transition-all">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <input type="date" className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-slate-400 transition-colors" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            <span className="text-slate-300 text-sm">→</span>
                            <input type="date" className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-800 focus:outline-none focus:border-slate-400 transition-colors" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    )}
                </div>

                {/* ═══════════ STATS ROW ═══════════ */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-slate-200 rounded-xl overflow-hidden mb-8">
                    {[
                        { label: 'ยอดค่า OT รวม', value: `฿${fmt(totPay)}`, accent: 'text-emerald-600' },
                        { label: 'ชั่วโมง OT รวม', value: `${totHrs.toFixed(1)} ชม.`, accent: 'text-slate-900' },
                        { label: 'พนักงานที่มี OT', value: `${pplWithOt} คน`, accent: 'text-slate-900' },
                        { label: 'เฉลี่ยต่อคน', value: `${avgHrs.toFixed(1)} ชม.`, accent: 'text-slate-900' },
                    ].map((s, i) => (
                        <div key={i} className="bg-white p-4 sm:p-5 lg:p-6">
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">{s.label}</p>
                            <p className={cn('text-xl sm:text-2xl lg:text-3xl font-black tabular-nums tracking-tight leading-none', s.accent)}>{s.value}</p>
                        </div>
                    ))}
                </div>

                {/* ═══════════ TABLE SECTION ═══════════ */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">รายละเอียดรายบุคคล</h2>
                        <p className="text-sm text-slate-400 font-light">{otData.length} รายการ · {periodMode === 'monthly' ? `${MONTHS_FULL[selectedMonth]} ${selectedYear + 543}` : `${dateRange.start} – ${dateRange.end}`}</p>
                    </div>
                    <Button onClick={exportCSV} variant="outline" size="sm" className="border-slate-200 text-slate-600 hover:bg-white hover:text-slate-900 hover:border-slate-400 transition-all h-9 px-4">
                        <Download className="w-3.5 h-3.5 mr-1.5" />
                        ส่งออก CSV
                    </Button>
                </div>

                {otData.length === 0 ? (
                    /* ── Empty State ── */
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white py-20 text-center">
                        <CalendarRange className="w-10 h-10 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-600 font-semibold">ไม่พบข้อมูล OT ในช่วงเวลานี้</p>
                        <p className="text-sm text-slate-400 mt-1">ลองเปลี่ยนเดือนหรือช่วงวันที่</p>
                    </div>
                ) : (
                    <>
                        {/* ── Desktop Table ── */}
                        <div className="hidden sm:block bg-white rounded-xl border border-slate-200 overflow-hidden">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-slate-200 text-left">
                                        <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest w-8">#</th>
                                        <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest">ชื่อ</th>
                                        <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">แผนก</th>
                                        <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">ชั่วโมง</th>
                                        <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center hidden lg:table-cell">อัตรา</th>
                                        <th className="px-5 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest text-right">ค่า OT</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {otData.map((d, i) => (
                                        <tr key={d.emp.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/70 transition-colors">
                                            <td className="px-5 py-3.5 text-xs text-slate-300 font-mono tabular-nums">{String(i + 1).padStart(2, '0')}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={d.emp.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.emp.name)}&background=f1f5f9&color=334155&bold=true&size=36`}
                                                        alt="" className="w-8 h-8 rounded-lg object-cover bg-slate-100" loading="lazy"
                                                    />
                                                    <div className="min-w-0">
                                                        <p className="font-semibold text-slate-900 truncate text-[13px]">{d.emp.name}</p>
                                                        <p className="text-[11px] text-slate-400 truncate lg:hidden">{d.emp.department}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-slate-500 hidden lg:table-cell">{d.emp.department}</td>
                                            <td className="px-5 py-3.5 text-right font-bold text-slate-800 tabular-nums font-mono">{d.hrs.toFixed(1)}</td>
                                            <td className="px-5 py-3.5 text-center hidden lg:table-cell">
                                                <span className="text-xs font-semibold text-slate-500">
                                                    {d.rVal}{d.rType === 'multiplier' ? '×' : '฿/ชม.'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 text-right">
                                                <span className="font-black text-emerald-600 tabular-nums font-mono text-[15px]">{fmt(d.pay)}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                                        <td className="px-5 py-4" colSpan={3}>
                                            <span className="font-bold text-slate-900 text-sm">รวมทั้งหมด</span>
                                        </td>
                                        <td className="px-5 py-4 text-right font-bold text-slate-900 tabular-nums font-mono">{totHrs.toFixed(1)}</td>
                                        <td className="px-5 py-4 hidden lg:table-cell"></td>
                                        <td className="px-5 py-4 text-right">
                                            <span className="font-black text-emerald-600 tabular-nums font-mono text-lg">฿{fmt(totPay)}</span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* ── Mobile List ── */}
                        <div className="sm:hidden space-y-2">
                            {otData.map((d, i) => (
                                <div key={d.emp.id} className="bg-white rounded-xl border border-slate-200 p-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-[10px] font-mono text-slate-300 w-5 shrink-0">{String(i + 1).padStart(2, '0')}</span>
                                        <img
                                            src={d.emp.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.emp.name)}&background=f1f5f9&color=334155&bold=true&size=36`}
                                            alt="" className="w-9 h-9 rounded-lg object-cover bg-slate-100" loading="lazy"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-slate-900 text-sm truncate">{d.emp.name}</p>
                                            <p className="text-[11px] text-slate-400">{d.emp.department}</p>
                                        </div>
                                        <p className="font-black text-emerald-600 tabular-nums font-mono text-base shrink-0">฿{fmt(d.pay)}</p>
                                    </div>
                                    <div className="flex items-center gap-4 pl-8 text-xs text-slate-400">
                                        <span><b className="text-slate-700 font-mono">{d.hrs.toFixed(1)}</b> ชม.</span>
                                        <span className="text-slate-200">|</span>
                                        <span>อัตรา {d.rVal}{d.rType === 'multiplier' ? '×' : '฿/ชม.'}</span>
                                    </div>
                                </div>
                            ))}

                            {/* Mobile Total */}
                            <div className="bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">ยอดรวม</p>
                                    <p className="text-sm text-slate-300 mt-0.5">{totHrs.toFixed(1)} ชม. · {pplWithOt} คน</p>
                                </div>
                                <p className="text-2xl font-black tabular-nums font-mono">฿{fmt(totPay)}</p>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
