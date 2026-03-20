import { useState, useEffect, useRef } from 'react';
import { useAttendance } from '../../contexts/useAttendance';
import { FileText, Filter, Clock, Ban, AlignLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

const FILTER_LABELS: Record<string, string> = {
    all: 'ทั้งหมด',
    pending: 'รออนุมัติ',
    approved: 'อนุมัติแล้ว',
    rejected: 'ปฏิเสธแล้ว',
};

const STATUS_LABELS: Record<string, string> = {
    approved: 'อนุมัติแล้ว',
    rejected: 'ปฏิเสธแล้ว',
    pending: 'รออนุมัติ',
};

export function AdminOTApprovals() {
    const { otRequests, employees, updateOTStatus } = useAttendance();
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
                    <h1 className="text-2xl font-bold text-[#1d1d1d] tracking-tight">อนุมัติทำงานล่วงเวลา (OT)</h1>
                    <p className="text-sm text-[#6f6f6f] mt-1">ตรวจสอบและจัดการคำขอทำ OT ของพนักงานในระบบ</p>
                </div>
            </div>

            {/* ── Main Content Container ── */}
            <div className="dashboard-section bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden relative min-h-[500px]">
                {/* ── Filter Tabs ── */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3 overflow-x-auto hide-scrollbar bg-white relative z-10">
                    <Filter className="w-4 h-4 text-gray-400 shrink-0 mr-1" />
                    {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={cn(
                                'px-4 py-2 text-sm font-semibold rounded-xl transition-all whitespace-nowrap',
                                filter === f
                                    ? 'bg-[#044F88] text-white shadow-md shadow-[#044F88]/20'
                                    : 'bg-gray-50 text-[#6f6f6f] hover:bg-gray-100 border border-gray-100 hover:text-[#1d1d1d]'
                            )}
                        >
                            {FILTER_LABELS[f]}
                            {f === 'pending' && filter !== 'pending' && otRequests.filter(r => r.status === 'pending').length > 0 && (
                                <span className="ml-2 px-1.5 py-0.5 rounded-md bg-white border border-gray-200 text-amber-600 text-[10px] font-bold">
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
                <div className="bg-gray-50/30">

                    {/* Mobile View: Cards */}
                    <div className="md:hidden divide-y divide-gray-100/50 p-3 space-y-3">
                        {filtered.length === 0 ? (
                            <div className="py-16 text-center text-[#6f6f6f] text-sm flex flex-col items-center">
                                <FileText className="w-12 h-12 text-gray-200 mb-4" />
                                <p className="font-semibold text-lg text-[#1d1d1d]">ไม่มีคำขอ OT ในหมวดหมู่นี้</p>
                            </div>
                        ) : (
                            filtered.map(req => {
                                const emp = employees.find(e => e.id === req.employeeId);
                                return (
                                    <div key={req.id} className="ot-row bg-white rounded-2xl p-5 border border-gray-100 shadow-sm relative overflow-hidden group">
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
                                                    <p className="font-bold text-[#1d1d1d] leading-tight group-hover:text-[#044F88] transition-colors">
                                                        {emp?.name}
                                                    </p>
                                                    <p className="text-xs text-[#6f6f6f] mt-0.5 flex items-center gap-1">
                                                        {emp?.department} {emp?.nickname && `(${emp.nickname})`}
                                                    </p>
                                                </div>
                                            </div>
                                            {req.status === 'pending' ? (
                                                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-500/20 shrink-0">
                                                    รออนุมัติ
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

                                        <div className="bg-gray-50 rounded-xl p-3.5 mb-4 grid grid-cols-2 gap-3 border border-gray-100/50">
                                            <div className="flex items-start gap-2">
                                                <Clock className="w-4 h-4 text-[#044F88] shrink-0 mt-0.5" />
                                                <div>
                                                    <p className="text-[10px] font-bold text-[#6f6f6f] uppercase tracking-wider mb-0.5">วันที่และเวลา</p>
                                                    <p className="font-semibold text-sm text-[#1d1d1d] tabular-nums leading-tight">{req.date}</p>
                                                    <p className="text-xs text-[#6f6f6f] font-medium mt-0.5">{req.startTime} - {req.endTime} น.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start gap-2">
                                                <AlignLeft className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                                <div className="min-w-0">
                                                    <p className="text-[10px] font-bold text-[#6f6f6f] uppercase tracking-wider mb-0.5">เหตุผล</p>
                                                    <p className="text-xs text-[#1d1d1d] leading-relaxed line-clamp-2">{req.reason}</p>
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
                                                    <span className="w-4 h-4 mr-2" >✓</span> อนุมัติ
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => updateOTStatus(req.id, 'rejected')}
                                                    className="flex-1 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 h-10 rounded-xl font-semibold bg-white"
                                                >
                                                    {/* Changed X to Ban/Cancel equivalent */}
                                                    <Ban className="w-4 h-4 mr-2" /> ปฏิเสธ
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
                            <thead className="bg-gray-50/50 text-[#6f6f6f] text-xs uppercase tracking-wider font-semibold border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4">พนักงาน</th>
                                    <th className="px-6 py-4">วันที่ และ ช่วงเวลา</th>
                                    <th className="px-6 py-4 w-1/3">เหตุผล</th>
                                    <th className="px-6 py-4 text-center">การดำเนินการ / สถานะ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {filtered.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-24 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4 border border-gray-100">
                                                    <FileText className="w-8 h-8 text-gray-300" />
                                                </div>
                                                <p className="text-[#1d1d1d] font-semibold text-lg mb-1">ไม่พบคำขอ OT ในหมวดหมู่นี้</p>
                                                <p className="text-[#6f6f6f] text-sm">ลองเปลี่ยนแท็บตัวกรองด้านบนเพื่อดูรายการอื่น</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filtered.map(req => {
                                        const emp = employees.find(e => e.id === req.employeeId);
                                        return (
                                            <tr key={req.id} className="ot-row hover:bg-[#044F88]/30 transition-colors duration-300 group">
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
                                                            <p className="font-semibold text-[#1d1d1d] group-hover:text-[#044F88] transition-colors">{emp?.name || 'ไม่ทราบชื่อ'}</p>
                                                            {emp?.nickname && <p className="text-xs text-[#6f6f6f]">({emp.nickname})</p>}
                                                            <p className="text-xs text-[#6f6f6f] mt-0.5">{emp?.department}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-[#1d1d1d] tabular-nums mb-0.5">{req.date}</p>
                                                    <p className="text-xs font-medium text-[#6f6f6f] tabular-nums flex items-center gap-1.5">
                                                        <ClockIcon className="w-3.5 h-3.5 text-[#044F88]" />
                                                        {req.startTime} - {req.endTime} น.
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 max-w-[300px] whitespace-normal">
                                                    <p className="text-sm text-[#1d1d1d] leading-relaxed line-clamp-2">{req.reason}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center align-middle">
                                                    {req.status === 'pending' ? (
                                                        <div className="flex items-center justify-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                onClick={() => updateOTStatus(req.id, 'approved')}
                                                                className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg h-9 px-4 shadow-sm"
                                                            >
                                                                <span className="w-3.5 h-3.5 mr-1.5">✓</span> อนุมัติ
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => updateOTStatus(req.id, 'rejected')}
                                                                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200 rounded-lg h-9 px-4 shadow-sm bg-white"
                                                            >
                                                                <Ban className="w-3.5 h-3.5 mr-1.5" /> ปฏิเสธ
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
