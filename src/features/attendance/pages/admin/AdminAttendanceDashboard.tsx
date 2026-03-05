import { useState, useRef, useEffect } from 'react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Users, Clock, AlertTriangle, FileCheck2, CalendarX, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

const STATUS_LABEL: Record<string, string> = {
    present: 'มาทำงาน',
    late: 'มาสาย',
    absent: 'ขาดงาน',
};

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
}

function StatCard({ title, value, suffix = 'คน', icon: Icon, color, delay, href }: StatCardProps) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(cardRef.current,
                { rotateX: 90, opacity: 0, transformOrigin: 'center bottom' },
                { rotateX: 0, opacity: 1, duration: 0.8, delay, ease: 'power3.out' }
            );
            const counter = { val: 0 };
            gsap.to(counter, {
                val: value,
                duration: 1.5,
                delay: delay + 0.3,
                ease: 'expo.out',
                onUpdate: () => setDisplayValue(Math.round(counter.val))
            });
            gsap.fromTo(cardRef.current?.querySelector('.stat-icon'),
                { rotate: -180, scale: 0 },
                { rotate: 0, scale: 1, duration: 0.8, delay: delay + 0.4, ease: 'back.out(1.7)' }
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
                href && 'hover:border-[#2075f8]'
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
                    {href && (
                        <div className="mt-4 flex items-center text-sm font-medium text-[#2075f8] opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                            ตรวจสอบ <ArrowRight className="w-4 h-4 ml-1" />
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
    const { employees, logs, otRequests } = useAttendance();
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
                { y: 30, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 0.6, stagger: 0.15, ease: 'power3.out',
                    scrollTrigger: { trigger: containerRef.current, start: 'top 80%', toggleActions: 'play none none none' },
                }
            );

            gsap.fromTo('.log-row',
                { x: -30, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.6 }
            );
        });
        return () => ctx.revert();
    }, [todayLogs.length]);

    return (
        <div ref={containerRef} className="space-y-6">
            {/* ── Page header ── */}
            <div className="dashboard-section flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1d1d1d] tracking-tight">แดชบอร์ดการลงเวลา</h1>
                    <p className="text-sm text-[#6f6f6f] mt-1">สรุปภาพรวมการเข้างานประจำวัน</p>
                </div>
                <div className="bg-white px-4 py-2 rounded-xl border border-gray-100 shadow-sm flex items-center gap-2 w-max">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-sm font-semibold text-[#1d1d1d]">{displayDate}</span>
                </div>
            </div>

            {/* ── Stats grid (Match Dashboard) ── */}
            <div className="dashboard-section grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ perspective: '1000px' }}>
                <StatCard
                    title="มาทำงาน" value={presentCount} icon={Users}
                    color="bg-gradient-to-br from-emerald-500 to-teal-500" delay={0.1}
                />
                <StatCard
                    title="มาสาย" value={lateCount} icon={Clock}
                    color="bg-gradient-to-br from-amber-500 to-orange-500" delay={0.2}
                />
                <StatCard
                    title="ขาดงาน" value={absentCount} icon={AlertTriangle}
                    color="bg-gradient-to-br from-red-500 to-rose-500" delay={0.3}
                />
                <StatCard
                    title="รออนุมัติ OT" value={pendingOTs} suffix="รายการ" icon={FileCheck2}
                    color="bg-gradient-to-br from-[#2075f8] to-[#1a64d4]" delay={0.4}
                    href="/admin/attendance/ot-approvals"
                />
            </div>

            {/* ── Recent Check-ins Table (Matches RequestsTable) ── */}
            <div className="dashboard-section bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-lg font-semibold text-[#1d1d1d]">การเช็คอินล่าสุดวันนี้</h2>
                        <p className="text-sm text-[#6f6f6f] mt-0.5">รายการลงเวลาเข้า-ออกงานประจำวัน</p>
                    </div>
                    <Link to="/admin/attendance/logs" className="hidden sm:flex items-center text-sm font-medium text-[#2075f8] hover:text-[#1a64d4] transition-colors group">
                        ดูประวัติทั้งหมด <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-gray-50/50 text-[#6f6f6f] text-xs uppercase tracking-wider font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">พนักงาน</th>
                                <th className="px-6 py-4 hidden sm:table-cell">แผนก</th>
                                <th className="px-6 py-4">เวลาเข้า</th>
                                <th className="px-6 py-4">เวลาออก</th>
                                <th className="px-6 py-4">สถานะ</th>
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
                                            <p className="text-[#1d1d1d] font-semibold text-lg mb-1">ยังไม่มีข้อมูลการลงเวลาวันนี้</p>
                                            <p className="text-[#6f6f6f] text-sm">เมื่อพนักงานเช็คอิน ข้อมูลจะแสดงที่นี่โดยอัตโนมัติ</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                todayLogs.map(log => {
                                    const emp = employees.find(e => e.id === log.employeeId);
                                    return (
                                        <tr key={log.id} className="log-row hover:bg-[#e8f1fe]/30 transition-colors duration-300 group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    {emp?.avatarUrl ? (
                                                        <img
                                                            src={emp.avatarUrl}
                                                            alt={emp.name}
                                                            className="w-10 h-10 rounded-full object-cover shrink-0 bg-blue-50 ring-2 ring-white shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0 ring-2 ring-white shadow-sm">
                                                            {emp?.name.charAt(0) || '?'}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="font-semibold text-[#1d1d1d] group-hover:text-[#2075f8] transition-colors">{emp?.name || 'ไม่ทราบชื่อ'}</p>
                                                        {emp?.nickname && <p className="text-xs text-[#6f6f6f]">({emp.nickname})</p>}
                                                        <p className="text-xs text-[#6f6f6f] sm:hidden mt-0.5">{emp?.department}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[#6f6f6f] hidden sm:table-cell">{emp?.department}</td>
                                            <td className="px-6 py-4">
                                                <span className="font-semibold text-[#1d1d1d] tabular-nums">{log.checkInTime}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-medium text-[#6f6f6f] tabular-nums">{log.checkOutTime || '--:--'}</span>
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
                        <Link to="/admin/attendance/logs" className="flex justify-center items-center w-full text-sm font-medium text-[#2075f8] bg-white border border-blue-100 hover:border-blue-200 hover:bg-blue-50/50 rounded-xl py-3 shadow-sm transition-all">
                            ดูประวัติทั้งหมด <ArrowRight className="w-4 h-4 ml-1" />
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
