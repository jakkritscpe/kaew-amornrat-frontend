import { useState, useMemo } from 'react';
import { useAttendance } from '../../contexts/AttendanceContext';
import {
    Calculator, Users, Clock, DollarSign, Download, CalendarDays,
    ChevronDown, ToggleLeft, ToggleRight, TrendingUp, CalendarX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const THAI_MONTHS = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
];

type PeriodMode = 'monthly' | 'custom';

function getWorkingDays(year: number, month: number): number {
    // Approximate: 22 working days per month
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    let count = 0;
    for (let d = 1; d <= daysInMonth; d++) {
        const day = new Date(year, month, d).getDay();
        if (day !== 0 && day !== 6) count++;
    }
    return count;
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

    // Derive effective date range from period mode
    const dateRange = useMemo(() => {
        if (periodMode === 'monthly') {
            const start = new Date(selectedYear, selectedMonth, 1);
            const end = new Date(selectedYear, selectedMonth + 1, 0);
            return {
                start: start.toISOString().split('T')[0],
                end: end.toISOString().split('T')[0],
            };
        }
        return { start: startDate, end: endDate };
    }, [periodMode, selectedMonth, selectedYear, startDate, endDate]);

    // Calculate OT data per employee
    const otData = useMemo(() => {
        const workingDays = periodMode === 'monthly'
            ? getWorkingDays(selectedYear, selectedMonth)
            : 22; // fallback for custom range
        const HOURS_PER_DAY = 8;

        return employees.map(emp => {
            const empLogs = logs.filter(
                l => l.employeeId === emp.id && l.date >= dateRange.start && l.date <= dateRange.end
            );
            const totalOtHours = empLogs.reduce((sum, l) => sum + (l.otHours || 0), 0);

            // Determine rate config
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

            return {
                employee: emp,
                totalOtHours,
                rateType,
                rateValue,
                otPay: Math.round(otPay * 100) / 100, // round to 2 decimal places
                logCount: empLogs.length,
            };
        }).filter(d => d.totalOtHours > 0 || d.logCount > 0);
    }, [employees, logs, dateRange, companySettings, periodMode, selectedMonth, selectedYear]);

    // Aggregates
    const totalOtHours = otData.reduce((s, d) => s + d.totalOtHours, 0);
    const totalOtPay = otData.reduce((s, d) => s + d.otPay, 0);
    const employeesWithOt = otData.filter(d => d.totalOtHours > 0).length;
    const avgOtPerPerson = employeesWithOt > 0 ? totalOtHours / employeesWithOt : 0;

    // Year options
    const yearOptions = Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i);

    // Export CSV
    const exportCSV = () => {
        const header = 'พนักงาน,แผนก,ชั่วโมง OT,อัตรา,ประเภท,ค่า OT (บาท)';
        const rows = otData.map(d =>
            `"${d.employee.name}","${d.employee.department}",${d.totalOtHours},${d.rateValue},${d.rateType === 'multiplier' ? 'เท่า' : 'บาท/ชม.'},${d.otPay}`
        );
        const periodLabel = periodMode === 'monthly'
            ? `${THAI_MONTHS[selectedMonth]} ${selectedYear + 543}`
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

    return (
        <div className="p-4 sm:p-6 bg-slate-50/60 min-h-[calc(100vh-4rem)] space-y-6">
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Calculator className="w-6 h-6 text-blue-600" />
                        คำนวณค่าล่วงเวลา (OT)
                    </h1>
                    <p className="text-sm text-slate-500 mt-0.5">สรุปยอดชั่วโมงและค่าล่วงเวลาของพนักงาน</p>
                </div>
                <Button onClick={exportCSV} variant="outline" className="shrink-0 text-slate-700 border-slate-200 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all">
                    <Download className="w-4 h-4 mr-2" /> ส่งออก CSV
                </Button>
            </div>

            {/* ── Period Selector ── */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4 text-slate-400" />
                        ช่วงเวลา
                    </h3>
                    <button
                        type="button"
                        onClick={() => setPeriodMode(m => m === 'monthly' ? 'custom' : 'monthly')}
                        className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors px-2 py-1 rounded-md hover:bg-blue-50"
                    >
                        {periodMode === 'monthly' ? (
                            <><ToggleLeft className="w-4 h-4" /> สลับเป็นกำหนดเอง</>
                        ) : (
                            <><ToggleRight className="w-4 h-4" /> สลับเป็นรายเดือน</>
                        )}
                    </button>
                </div>

                {periodMode === 'monthly' ? (
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <label className="block text-xs font-medium text-slate-500 mb-1">เดือน</label>
                            <div className="relative">
                                <select
                                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-10 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow cursor-pointer"
                                    value={selectedMonth}
                                    onChange={e => setSelectedMonth(Number(e.target.value))}
                                >
                                    {THAI_MONTHS.map((m, i) => (
                                        <option key={i} value={i}>{m}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>
                        </div>
                        <div className="relative w-full sm:w-40">
                            <label className="block text-xs font-medium text-slate-500 mb-1">ปี (พ.ศ.)</label>
                            <div className="relative">
                                <select
                                    className="w-full appearance-none rounded-lg border border-slate-200 bg-white pl-3 pr-10 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow cursor-pointer"
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
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-medium text-slate-500 mb-1">วันที่เริ่มต้น</label>
                            <input
                                type="date"
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <span className="text-slate-400 text-sm font-medium hidden sm:block pb-2.5">ถึง</span>
                        <div className="flex-1 w-full">
                            <label className="block text-xs font-medium text-slate-500 mb-1">วันที่สิ้นสุด</label>
                            <input
                                type="date"
                                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex items-center gap-3.5 hover:shadow-md transition-shadow">
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100/60 shadow-sm shrink-0">
                        <DollarSign className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500 truncate">ยอดรวมค่า OT</p>
                        <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">{totalOtPay.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}</p>
                        <p className="text-[10px] text-slate-400">บาท</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex items-center gap-3.5 hover:shadow-md transition-shadow">
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100/60 shadow-sm shrink-0">
                        <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500 truncate">ชั่วโมง OT รวม</p>
                        <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">{totalOtHours.toFixed(1)}</p>
                        <p className="text-[10px] text-slate-400">ชั่วโมง</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex items-center gap-3.5 hover:shadow-md transition-shadow">
                    <div className="p-2.5 rounded-xl bg-violet-50 border border-violet-100/60 shadow-sm shrink-0">
                        <Users className="w-5 h-5 text-violet-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500 truncate">พนักงานที่มี OT</p>
                        <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">{employeesWithOt}</p>
                        <p className="text-[10px] text-slate-400">คน</p>
                    </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5 flex items-center gap-3.5 hover:shadow-md transition-shadow">
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100/60 shadow-sm shrink-0">
                        <TrendingUp className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500 truncate">เฉลี่ยต่อคน</p>
                        <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums">{avgOtPerPerson.toFixed(1)}</p>
                        <p className="text-[10px] text-slate-400">ชม./คน</p>
                    </div>
                </div>
            </div>

            {/* ── Detail Table ── */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 bg-white">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">รายละเอียด OT รายบุคคล</h2>
                    <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        {periodMode === 'monthly'
                            ? `ข้อมูลเดือน${THAI_MONTHS[selectedMonth]} ${selectedYear + 543}`
                            : `ข้อมูลวันที่ ${dateRange.start} ถึง ${dateRange.end}`
                        }
                    </p>
                </div>
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200/60">
                            <tr>
                                <th className="px-5 py-3.5 sm:px-6">พนักงาน</th>
                                <th className="px-5 py-3.5 sm:px-6 hidden sm:table-cell">แผนก</th>
                                <th className="px-5 py-3.5 sm:px-6 text-right">ชั่วโมง OT</th>
                                <th className="px-5 py-3.5 sm:px-6 text-center hidden md:table-cell">ประเภทอัตรา</th>
                                <th className="px-5 py-3.5 sm:px-6 text-right hidden md:table-cell">อัตรา</th>
                                <th className="px-5 py-3.5 sm:px-6 text-right">ค่า OT (บาท)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {otData.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                <CalendarX className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 font-medium text-base mb-1">ไม่พบข้อมูล OT ในช่วงเวลาที่เลือก</p>
                                            <p className="text-slate-400 text-sm">ลองเลือกช่วงเวลาอื่น หรือตรวจสอบข้อมูลการลงเวลา</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                otData.map(d => (
                                    <tr key={d.employee.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-5 py-4 sm:px-6">
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={d.employee.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(d.employee.name)}&background=eff6ff&color=1e3a8a&bold=true&size=40`}
                                                    alt="" className="w-9 h-9 rounded-full object-cover bg-blue-100 shadow-sm group-hover:scale-105 transition-transform" loading="lazy"
                                                />
                                                <div>
                                                    <p className="font-semibold text-slate-900">{d.employee.name}</p>
                                                    {d.employee.nickname && <p className="text-xs text-slate-500">({d.employee.nickname})</p>}
                                                    <p className="text-xs text-slate-500 sm:hidden mt-0.5">{d.employee.department}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 sm:px-6 text-slate-600 hidden sm:table-cell">{d.employee.department}</td>
                                        <td className="px-5 py-4 sm:px-6 text-right font-bold text-slate-900 tabular-nums">{d.totalOtHours.toFixed(1)}</td>
                                        <td className="px-5 py-4 sm:px-6 text-center hidden md:table-cell">
                                            <span className={cn(
                                                'inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide',
                                                d.rateType === 'multiplier'
                                                    ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/20'
                                                    : 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20'
                                            )}>
                                                {d.rateType === 'multiplier' ? 'เท่า' : 'บาท/ชม.'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 sm:px-6 text-right font-medium text-slate-700 tabular-nums hidden md:table-cell">
                                            {d.rateValue} {d.rateType === 'multiplier' ? '×' : '฿'}
                                        </td>
                                        <td className="px-5 py-4 sm:px-6 text-right">
                                            <span className="font-bold text-emerald-700 tabular-nums">
                                                {d.otPay.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {otData.length > 0 && (
                            <tfoot className="bg-slate-50 border-t-2 border-slate-200">
                                <tr className="font-bold">
                                    <td className="px-5 py-4 sm:px-6 text-slate-900" colSpan={2}>รวมทั้งหมด</td>
                                    <td className="px-5 py-4 sm:px-6 text-right text-slate-900 tabular-nums">{totalOtHours.toFixed(1)}</td>
                                    <td className="px-5 py-4 sm:px-6 hidden md:table-cell" colSpan={2}></td>
                                    <td className="px-5 py-4 sm:px-6 text-right text-emerald-700 tabular-nums text-lg">
                                        {totalOtPay.toLocaleString('th-TH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ฿
                                    </td>
                                </tr>
                            </tfoot>
                        )}
                    </table>
                </div>
            </div>
        </div>
    );
}
