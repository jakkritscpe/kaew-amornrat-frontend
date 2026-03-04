import { useState, useMemo } from 'react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { Clock, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function EmployeeHistory() {
    const { logs } = useAttendance();
    const employeeId = 'emp-001'; // Mock user

    const [selectedMonth, setSelectedMonth] = useState<string>(
        new Date().toISOString().substring(0, 7) // 'YYYY-MM'
    );

    const historyLogs = useMemo(() => {
        return logs
            .filter((l) => l.employeeId === employeeId && l.date.startsWith(selectedMonth))
            .sort((a, b) => b.date.localeCompare(a.date)); // descending
    }, [logs, employeeId, selectedMonth]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'present': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none"><CheckCircle2 className="w-3 h-3 mr-1" /> มาปกติ</Badge>;
            case 'late': return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-200 shadow-none"><AlertCircle className="w-3 h-3 mr-1" /> สาย</Badge>;
            case 'absent': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 shadow-none"><XCircle className="w-3 h-3 mr-1" /> ขาด</Badge>;
            case 'on_leave': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 shadow-none">ลา</Badge>;
            default: return null;
        }
    };

    return (
        <div className="p-4 flex flex-col h-full bg-gray-50">
            <div className="flex justify-between items-center mb-6 mt-2">
                <h2 className="text-xl font-bold text-gray-900">ประวัติการทำงาน</h2>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[140px] bg-white">
                        <SelectValue placeholder="เลือกเดือน" />
                    </SelectTrigger>
                    <SelectContent>
                        {/* Mock recent months */}
                        <SelectItem value="2026-03">มีนาคม 2026</SelectItem>
                        <SelectItem value="2026-02">กุมภาพันธ์ 2026</SelectItem>
                        <SelectItem value="2026-01">มกราคม 2026</SelectItem>
                        <SelectItem value="2025-12">ธันวาคม 2025</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-3 pb-8">
                {historyLogs.length === 0 ? (
                    <div className="text-center text-gray-500 py-10 bg-white rounded-xl shadow-sm border border-gray-100">
                        ไม่มีประวัติในเดือนนี้
                    </div>
                ) : (
                    historyLogs.map(log => (
                        <div key={log.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                            <div>
                                <p className="font-semibold text-gray-900 mb-1">{log.date}</p>
                                <div className="flex items-center text-xs text-gray-500 gap-3">
                                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> เข้า: {log.checkInTime || '-'}</span>
                                    <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> ออก: {log.checkOutTime || '-'}</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                {getStatusBadge(log.status)}
                                {log.otHours > 0 && (
                                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                                        OT +{log.otHours} ชม.
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
