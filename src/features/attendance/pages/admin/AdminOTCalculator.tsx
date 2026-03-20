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

gsap.registerPlugin(ScrollTrigger);

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
                'relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100',
                'hover:shadow-xl hover:shadow-gray-200/50 transition-shadow duration-300',
                'cursor-pointer overflow-hidden group'
            )}
            style={{ transformStyle: 'preserve-3d' }}
        >
            {/* Glossy sheen effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="flex items-start justify-between relative z-10">
                <div>
                    <p className="text-sm text-[#6f6f6f] mb-1">{title}</p>
                    <span className="text-3xl font-bold text-[#1d1d1d] tabular-nums">
                        {formatted}
                    </span>
                    <p className="text-sm text-gray-400 mt-1">{suffix}</p>
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
    const { employees, logs, companySettings } = useAttendance();
    const containerRef = useRef<HTMLDivElement>(null);

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
        <div ref={containerRef} className="space-y-6">
            {/* ═══════════ PERIOD SELECTOR ═══════════ */}
            <div className="ot-section bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h3 className="font-semibold text-lg text-[#1d1d1d]">เลือกช่วงเวลา</h3>
                        <p className="text-sm text-[#6f6f6f]">เลือกเดือนหรือกำหนดช่วงวันที่เอง</p>
                    </div>
                    {/* Mode Tabs */}
                    <div className="flex items-center gap-0 border border-gray-200 rounded-lg overflow-hidden bg-white self-start sm:self-auto">
                        {(['monthly', 'custom'] as PeriodMode[]).map(mode => (
                            <button key={mode} type="button"
                                onClick={() => setPeriodMode(mode)}
                                className={cn(
                                    'px-4 py-2.5 sm:py-2 text-sm font-medium transition-colors min-w-[5.5rem] sm:min-w-0',
                                    periodMode === mode
                                        ? 'bg-gradient-to-r from-[#044F88] to-[#00223A] text-white'
                                        : 'bg-white text-[#6f6f6f] hover:bg-gray-50',
                                )}
                            >
                                {mode === 'monthly' ? 'รายเดือน' : 'กำหนดเอง'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-5">
                    {periodMode === 'monthly' ? (
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <button onClick={() => navMonth(-1)} className="w-10 h-10 sm:w-9 sm:h-9 shrink-0 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-[#6f6f6f] hover:text-[#1d1d1d] hover:border-gray-400 hover:bg-gray-50 active:scale-95 transition-all">
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 h-10 sm:h-9 flex-1 sm:flex-initial">
                                <select className="appearance-none bg-transparent text-sm font-semibold text-[#1d1d1d] pr-1 cursor-pointer focus:outline-none flex-1 sm:flex-initial" value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}>
                                    {MONTHS_FULL.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                </select>
                                <span className="text-gray-300">|</span>
                                <select className="appearance-none bg-transparent text-sm font-semibold text-[#1d1d1d] cursor-pointer focus:outline-none" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>
                                    {yearOpts.map(y => <option key={y} value={y}>{y + 543}</option>)}
                                </select>
                            </div>
                            <button onClick={() => navMonth(1)} className="w-10 h-10 sm:w-9 sm:h-9 shrink-0 rounded-lg border border-gray-200 bg-white flex items-center justify-center text-[#6f6f6f] hover:text-[#1d1d1d] hover:border-gray-400 hover:bg-gray-50 active:scale-95 transition-all">
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                            <input type="date" className="h-10 sm:h-9 w-full sm:w-auto rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-[#1d1d1d] focus:outline-none focus:ring-2 focus:ring-[#044F88]/30 focus:border-[#044F88] transition-all" value={startDate} onChange={e => setStartDate(e.target.value)} />
                            <span className="text-gray-300 text-sm text-center hidden sm:block">→</span>
                            <span className="text-[#6f6f6f] text-xs text-center sm:hidden">ถึง</span>
                            <input type="date" className="h-10 sm:h-9 w-full sm:w-auto rounded-lg border border-gray-200 bg-white px-3 text-sm font-medium text-[#1d1d1d] focus:outline-none focus:ring-2 focus:ring-[#044F88]/30 focus:border-[#044F88] transition-all" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>
                    )}
                </div>
            </div>

            {/* ═══════════ STATS GRID (same as Dashboard) ═══════════ */}
            <div className="ot-section grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ perspective: '1000px' }}>
                <StatCard
                    title="ยอดค่า OT รวม"
                    value={totPay}
                    suffix="บาท"
                    icon={DollarSign}
                    color="bg-gradient-to-br from-emerald-500 to-teal-500"
                    delay={0.1}
                    format={v => `฿${fmt(v)}`}
                />
                <StatCard
                    title="ชั่วโมง OT รวม"
                    value={totHrs}
                    suffix="ชั่วโมง"
                    icon={Clock}
                    color="bg-gradient-to-br from-[#044F88] to-[#00223A]"
                    delay={0.2}
                    format={v => v.toFixed(1)}
                />
                <StatCard
                    title="พนักงานที่มี OT"
                    value={pplWithOt}
                    suffix="คน"
                    icon={Users}
                    color="bg-gradient-to-br from-amber-500 to-orange-500"
                    delay={0.3}
                />
                <StatCard
                    title="เฉลี่ยต่อคน"
                    value={avgHrs}
                    suffix="ชม./คน"
                    icon={TrendingUp}
                    color="bg-gradient-to-br from-[#044F88] to-[#00223A]"
                    delay={0.4}
                    format={v => v.toFixed(1)}
                />
            </div>

            {/* ═══════════ TABLE CARD (same as RequestsTable) ═══════════ */}
            <div className="ot-section bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Card Header */}
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div>
                        <h3 className="font-semibold text-lg text-[#1d1d1d]">รายละเอียด OT รายบุคคล</h3>
                        <p className="text-sm text-[#6f6f6f]">
                            รายการทั้งหมด {otData.length} รายการ · {periodMode === 'monthly' ? `${MONTHS_FULL[selectedMonth]} ${selectedYear + 543}` : `${dateRange.start} – ${dateRange.end}`}
                        </p>
                    </div>
                    <Button onClick={exportCSV} variant="outline" className="gap-2">
                        <Download className="w-4 h-4" />
                        <span className="hidden sm:inline">ส่งออก CSV</span>
                    </Button>
                </div>

                {otData.length === 0 ? (
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
                                        <th className="w-[60px] text-left text-xs text-[#6f6f6f] font-semibold uppercase tracking-wider pl-6 pr-4 py-4">#</th>
                                        <th className="text-left text-xs text-[#6f6f6f] font-semibold uppercase tracking-wider px-4 py-4">พนักงาน</th>
                                        <th className="w-[160px] text-left text-xs text-[#6f6f6f] font-semibold uppercase tracking-wider px-4 py-4 hidden lg:table-cell">แผนก</th>
                                        <th className="w-[120px] text-right text-xs text-[#6f6f6f] font-semibold uppercase tracking-wider px-4 py-4">ชั่วโมง OT</th>
                                        <th className="w-[120px] text-center text-xs text-[#6f6f6f] font-semibold uppercase tracking-wider px-4 py-4 hidden lg:table-cell">อัตรา</th>
                                        <th className="w-[140px] text-right text-xs text-[#6f6f6f] font-semibold uppercase tracking-wider pl-4 pr-6 py-4">ค่า OT (฿)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {otData.map((d, i) => (
                                        <tr key={d.emp.id} className={cn(
                                            'ot-row group border-b border-gray-100 transition-colors duration-300',
                                            'hover:bg-[#044F88]/30'
                                        )}>
                                            <td className="pl-6 pr-4 py-4 font-mono text-sm text-[#044F88] font-medium align-top">{String(i + 1).padStart(2, '0')}</td>
                                            <td className="px-4 py-4 align-top">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#044F88] to-[#00223A] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                                        {d.emp.name.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm text-[#1d1d1d] group-hover:text-[#044F88] transition-colors truncate">{d.emp.name}</p>
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
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-[#6f6f6f]">
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
                                            <span className="font-bold text-base text-emerald-600 tabular-nums">฿{fmt(totPay)}</span>
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* ── Mobile List ── */}
                        <div className="sm:hidden divide-y divide-gray-100">
                            {otData.map((d, i) => (
                                <div key={d.emp.id} className="ot-row p-4 flex items-center gap-3 hover:bg-[#044F88]/30 transition-colors duration-300 group">
                                    <span className="font-mono text-xs text-[#044F88] font-medium w-5 shrink-0 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#044F88] to-[#00223A] flex items-center justify-center text-white text-xs font-bold shrink-0">
                                        {d.emp.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm text-[#1d1d1d] group-hover:text-[#044F88] transition-colors truncate">{d.emp.name}</p>
                                        <p className="text-xs text-[#6f6f6f] truncate">{d.emp.department} · {d.hrs.toFixed(1)} ชม. · อัตรา {d.rVal}{d.rType === 'multiplier' ? '×' : '฿/ชม.'}</p>
                                    </div>
                                    <p className="font-semibold text-sm text-emerald-600 tabular-nums shrink-0">฿{fmt(d.pay)}</p>
                                </div>
                            ))}
                            {/* Mobile Total */}
                            <div className="p-4 flex items-center justify-between bg-gray-50/50">
                                <span className="font-semibold text-sm text-[#1d1d1d]">รวมทั้งหมด</span>
                                <div className="text-right">
                                    <p className="font-bold text-base text-emerald-600 tabular-nums">฿{fmt(totPay)}</p>
                                    <p className="text-xs text-[#6f6f6f]">{totHrs.toFixed(1)} ชม. · {pplWithOt} คน</p>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
