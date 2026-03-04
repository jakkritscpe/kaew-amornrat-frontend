import { useState } from 'react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar, FileText } from 'lucide-react';

export function EmployeeOTRequest() {
    const { otRequests, submitOTRequest } = useAttendance();
    const employeeId = 'emp-001'; // mock

    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [startTime, setStartTime] = useState('18:00');
    const [endTime, setEndTime] = useState('20:00');
    const [reason, setReason] = useState('');

    const myOTs = otRequests.filter(req => req.employeeId === employeeId).sort((a, b) => b.id.localeCompare(a.id));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!startTime || !endTime || !reason) return;
        submitOTRequest({
            employeeId, date, startTime, endTime, reason
        });
        setReason('');
        alert('ส่งคำขอ OT สำเร็จแล้ว!');
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'pending': return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200">รออนุมัติ</Badge>;
            case 'approved': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200">อนุมัติแล้ว</Badge>;
            case 'rejected': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200">ปฏิเสธ</Badge>;
            default: return null;
        }
    };

    return (
        <div className="p-4 bg-gray-50 min-h-full">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">ฟอร์มขอทำ OT (ล่วงเวลา)</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Calendar className="w-4 h-4" /> วันที่</label>
                        <Input id="ot-date" type="date" value={date} onChange={e => setDate(e.target.value)} required />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Clock className="w-4 h-4" /> เวลาเริ่ม</label>
                            <Input id="ot-start" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><Clock className="w-4 h-4" /> เวลาสิ้นสุด</label>
                            <Input id="ot-end" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-700 mb-1 flex items-center gap-2"><FileText className="w-4 h-4" /> เหตุผล / รายละเอียดงาน</label>
                        <textarea
                            id="ot-reason"
                            className="w-full flex min-h-[80px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                            placeholder="เช่น ขึ้นระบบใหม่ให้ลูกค้า..."
                            value={reason}
                            onChange={e => setReason(e.target.value)}
                            required
                        />
                    </div>

                    <Button type="submit" className="w-full h-12 text-md bg-blue-600 hover:bg-blue-700 rounded-xl mt-2">
                        ส่งคำขอ OT
                    </Button>
                </form>
            </div>

            <div className="pb-8">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-widest mb-3 px-1">ประวัติคำขอ OT ล่าสุด</h3>
                <div className="space-y-3">
                    {myOTs.length === 0 ? (
                        <div className="text-center text-gray-400 py-6">ไม่มีประวัติคำขอ OT</div>
                    ) : (
                        myOTs.map(req => (
                            <div key={req.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="font-medium text-gray-900 text-sm">
                                        {req.date} <span className="text-gray-500 font-normal ml-1">({req.startTime} - {req.endTime})</span>
                                    </div>
                                    {getStatusBadge(req.status)}
                                </div>
                                <p className="text-xs text-gray-600 line-clamp-2">{req.reason}</p>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
