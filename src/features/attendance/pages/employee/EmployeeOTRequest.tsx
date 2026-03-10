import { useState, useMemo } from 'react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { Input } from '@/components/ui/input';
import { Clock, Calendar, FileText, CheckCircle2, XCircle, Hourglass, Send, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { formatDate, cn } from '@/lib/utils';

const STATUS_CFG = {
    pending:  { label: 'รออนุมัติ',   icon: Hourglass,    badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    approved: { label: 'อนุมัติแล้ว', icon: CheckCircle2, badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    rejected: { label: 'ปฏิเสธ',      icon: XCircle,      badge: 'bg-red-50 text-red-700 border-red-200' },
} as const;

function calcDuration(start: string, end: string) {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const mins = eh * 60 + em - sh * 60 - sm;
    if (mins <= 0) return null;
    const h = Math.floor(mins / 60), m = mins % 60;
    return h > 0 ? (m > 0 ? `${h} ชม. ${m} นาที` : `${h} ชม.`) : `${m} นาที`;
}

export function EmployeeOTRequest() {
    const { otRequests, submitOTRequest } = useAttendance();
    const employeeId = 'emp-001';

    const today = new Date().toISOString().split('T')[0];
    const [date, setDate] = useState(today);
    const [startTime, setStartTime] = useState('18:00');
    const [endTime, setEndTime] = useState('20:00');
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const myOTs = useMemo(() =>
        otRequests.filter(r => r.employeeId === employeeId).sort((a, b) => b.id.localeCompare(a.id)),
        [otRequests, employeeId]
    );

    const dur = startTime && endTime ? calcDuration(startTime, endTime) : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!dur || !reason.trim()) return;
        setSubmitting(true);
        try {
            await submitOTRequest({ employeeId, date, startTime, endTime, reason: reason.trim() });
            toast.success('ส่งคำขอ OT สำเร็จ', { description: `${formatDate(date)} · ${startTime} – ${endTime}` });
            setReason('');
        } catch (err) {
            toast.error('ส่งไม่สำเร็จ', { description: err instanceof Error ? err.message : 'กรุณาลองใหม่' });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col min-h-full bg-[#f1f5f9]">

            {/* ── Blue hero ── */}
            <div className="bg-[#2075f8] px-5 pt-3 pb-14">
                <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest">ขอทำล่วงเวลา</p>
                <h2 className="text-xl font-black text-white mt-0.5">OT Request</h2>

                {/* Duration preview */}
                {dur ? (
                    <div className="inline-flex items-center gap-2 mt-3 px-3.5 py-1.5 rounded-full bg-white/20 text-white text-sm font-semibold">
                        <Zap className="w-3.5 h-3.5" />
                        รวม {dur}
                    </div>
                ) : (
                    <div className="inline-flex items-center gap-2 mt-3 px-3.5 py-1.5 rounded-full bg-white/15 text-blue-200 text-sm">
                        <Clock className="w-3.5 h-3.5" />
                        เลือกช่วงเวลา OT
                    </div>
                )}
            </div>

            {/* ── White floating content ── */}
            <div className="flex-1 bg-white rounded-t-3xl -mt-6 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 pt-5 pb-6 space-y-6 relative z-10">

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Date */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                            <Calendar className="w-3.5 h-3.5 text-[#2075f8]" /> วันที่
                        </label>
                        <Input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            max={today}
                            required
                            className="h-11 rounded-xl border-gray-200 bg-[#f8fafc] text-sm font-medium focus:bg-white"
                        />
                    </div>

                    {/* Time range */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                            <Clock className="w-3.5 h-3.5 text-[#2075f8]" /> ช่วงเวลา
                        </label>
                        <div className="grid grid-cols-[1fr_auto_1fr] gap-2 items-center">
                            <Input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required
                                className="h-11 rounded-xl border-gray-200 bg-[#f8fafc] text-sm font-medium text-center focus:bg-white" />
                            <span className="text-[#6f6f6f] font-medium">–</span>
                            <Input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required
                                className="h-11 rounded-xl border-gray-200 bg-[#f8fafc] text-sm font-medium text-center focus:bg-white" />
                        </div>
                        {dur && (
                            <p className="text-xs text-[#2075f8] font-semibold flex items-center gap-1 px-1">
                                <Zap className="w-3 h-3" /> {dur}
                            </p>
                        )}
                    </div>

                    {/* Reason */}
                    <div className="space-y-1.5">
                        <label className="flex items-center gap-1.5 text-xs font-bold text-[#1d1d1d] uppercase tracking-wider">
                            <FileText className="w-3.5 h-3.5 text-[#2075f8]" /> เหตุผล
                        </label>
                        <textarea
                            className={cn(
                                'w-full min-h-[80px] rounded-xl border border-gray-200 bg-[#f8fafc]',
                                'px-3 py-2.5 text-sm text-[#1d1d1d] placeholder:text-gray-300 resize-none',
                                'focus:outline-none focus:ring-2 focus:ring-[#2075f8]/20 focus:border-[#2075f8] focus:bg-white',
                                'transition-colors'
                            )}
                            placeholder="เช่น ขึ้นระบบใหม่ให้ลูกค้า, ปิดงานด่วน..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={submitting || !reason.trim() || !dur}
                        className={cn(
                            'w-full h-12 rounded-xl font-bold text-sm text-white',
                            'flex items-center justify-center gap-2',
                            'bg-[#2075f8] hover:bg-[#1a64d4] shadow-sm shadow-blue-200',
                            'transition-all duration-150 active:scale-[0.98] touch-manipulation',
                            'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100'
                        )}
                    >
                        {submitting
                            ? <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" /></svg>
                            : <Send className="w-4 h-4" />}
                        {submitting ? 'กำลังส่ง...' : 'ส่งคำขอ OT'}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-100" />
                    <p className="text-[11px] font-bold text-[#6f6f6f] uppercase tracking-widest">ประวัติคำขอ</p>
                    <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* History list */}
                {myOTs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                            <FileText className="w-6 h-6 text-gray-200" />
                        </div>
                        <p className="text-sm text-[#6f6f6f]">ยังไม่มีประวัติคำขอ</p>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {myOTs.map(req => {
                            const cfg = STATUS_CFG[req.status as keyof typeof STATUS_CFG] ?? STATUS_CFG.pending;
                            const Icon = cfg.icon;
                            const d = calcDuration(req.startTime, req.endTime);
                            return (
                                <div key={req.id} className="bg-[#f8fafc] rounded-2xl border border-gray-100 px-4 py-3.5">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div>
                                            <p className="font-bold text-[#1d1d1d] text-sm">{formatDate(req.date)}</p>
                                            <div className="flex items-center gap-1.5 text-xs text-[#6f6f6f] mt-0.5">
                                                <Clock className="w-3 h-3" />
                                                {req.startTime} – {req.endTime}
                                                {d && <span className="text-[#2075f8] font-semibold">· {d}</span>}
                                            </div>
                                        </div>
                                        <span className={cn(
                                            'inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0',
                                            cfg.badge
                                        )}>
                                            <Icon className="w-3 h-3" />
                                            {cfg.label}
                                        </span>
                                    </div>
                                    <p className="text-xs text-[#6f6f6f] line-clamp-2 leading-relaxed">{req.reason}</p>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
