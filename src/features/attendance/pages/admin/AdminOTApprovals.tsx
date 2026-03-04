import { useState } from 'react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

    const filtered = otRequests
        .filter(req => filter === 'all' || req.status === filter)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="p-6 bg-slate-50 min-h-[calc(100vh-4rem)]">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">อนุมัติคำขอทำงานล่วงเวลา (OT)</h1>
                    <p className="text-sm text-slate-500 mt-1">ตรวจสอบและจัดการคำขอทำ OT ของพนักงาน</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex gap-2 flex-wrap">
                    {(['pending', 'approved', 'rejected', 'all'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === f
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                                }`}
                        >
                            {FILTER_LABELS[f]}
                        </button>
                    ))}
                </div>

                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50/80 text-slate-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">พนักงาน</th>
                            <th className="px-6 py-4">วันที่ขอ</th>
                            <th className="px-6 py-4">ช่วงเวลา</th>
                            <th className="px-6 py-4 w-1/3">เหตุผล</th>
                            <th className="px-6 py-4 text-center">การดำเนินการ / สถานะ</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filtered.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-10 text-center text-slate-400">ไม่พบคำขอ OT ในหมวดหมู่นี้</td></tr>
                        ) : (
                            filtered.map(req => {
                                const emp = employees.find(e => e.id === req.employeeId);
                                return (
                                    <tr key={req.id} className="hover:bg-slate-50/50">
                                        <td className="px-6 py-4">
                                            <p className="font-medium text-slate-900">
                                                {emp?.name}{emp?.nickname ? <span className="font-normal text-slate-500 ml-1">({emp.nickname})</span> : null}
                                            </p>
                                            <p className="text-xs text-slate-500">{emp?.department}</p>
                                        </td>
                                        <td className="px-6 py-4 text-slate-900 font-medium">{req.date}</td>
                                        <td className="px-6 py-4 text-slate-600">
                                            {req.startTime} - {req.endTime} น.
                                        </td>
                                        <td className="px-6 py-4 text-slate-600">
                                            <p className="text-xs leading-relaxed max-w-sm">{req.reason}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {req.status === 'pending' ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        onClick={() => updateOTStatus(req.id, 'approved')}
                                                        className="bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-500/20"
                                                    >
                                                        <Check className="w-4 h-4 mr-1" /> อนุมัติ
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => updateOTStatus(req.id, 'rejected')}
                                                        className="text-red-600 border-red-200 hover:bg-red-50"
                                                    >
                                                        <X className="w-4 h-4 mr-1" /> ปฏิเสธ
                                                    </Button>
                                                </div>
                                            ) : (
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-medium inline-block ${req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
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
    );
}
