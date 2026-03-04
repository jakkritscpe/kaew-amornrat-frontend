import { useState } from 'react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { Search, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AttendanceLog } from '../../types';

const STATUS_LABEL: Record<string, string> = {
    present: 'มาทำงาน',
    late: 'มาสาย',
    absent: 'ขาดงาน',
};

export function AdminAttendanceLogs() {
    const { logs, employees, locations } = useAttendance();
    const [searchTerm, setSearchTerm] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    const filteredLogs = logs.filter(log => {
        const emp = employees.find(e => e.id === log.employeeId);
        if (!emp) return false;
        const matchesName = emp.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDept = emp.department.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDate = dateFilter ? log.date === dateFilter : true;
        return (matchesName || matchesDept) && matchesDate;
    }).sort((a: AttendanceLog, b: AttendanceLog) =>
        new Date(`${b.date}T${b.checkInTime || '00:00'}`).getTime() - new Date(`${a.date}T${a.checkInTime || '00:00'}`).getTime()
    );

    return (
        <div className="p-6 bg-slate-50 min-h-[calc(100vh-4rem)]">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">ประวัติการลงเวลา</h1>
                    <p className="text-sm text-slate-500 mt-1">รายละเอียดการเข้า-ออกงานของพนักงานทุกคน</p>
                </div>
                <Button variant="outline" className="bg-white border-slate-200">
                    <Download className="w-4 h-4 mr-2 text-slate-500" />
                    ส่งออก CSV
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex flex-wrap gap-4 items-center bg-slate-50/50">
                    <div className="relative w-full max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="ค้นหาชื่อพนักงานหรือแผนก..."
                            className="pl-9 bg-white"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-400" />
                        <Input
                            type="date"
                            value={dateFilter}
                            onChange={e => setDateFilter(e.target.value)}
                            className="bg-white text-sm"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-slate-50/80 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-4 border-b border-slate-100">พนักงาน</th>
                                <th className="px-6 py-4 border-b border-slate-100">วันที่</th>
                                <th className="px-6 py-4 border-b border-slate-100">เข้า / ออก</th>
                                <th className="px-6 py-4 border-b border-slate-100">ชั่วโมง / OT</th>
                                <th className="px-6 py-4 border-b border-slate-100">สถานะ</th>
                                <th className="px-6 py-4 border-b border-slate-100">สถานที่</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                                        ไม่พบข้อมูลการลงเวลาที่ตรงกับเงื่อนไข
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map(log => {
                                    const emp = employees.find(e => e.id === log.employeeId);
                                    const loc = locations.find(l => l.id === log.locationId);
                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-900">
                                                    {emp?.name}{emp?.nickname ? <span className="font-normal text-slate-500 ml-1">({emp.nickname})</span> : null}
                                                </p>
                                                <p className="text-xs text-slate-500">{emp?.department}</p>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">{log.date}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <span className="font-semibold text-emerald-600">{log.checkInTime || '--:--'}</span>
                                                    <span className="text-slate-300">-</span>
                                                    <span className="font-semibold text-slate-700">{log.checkOutTime || '--:--'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-slate-700">{log.workHours} ชม.</p>
                                                {log.otHours > 0 && <p className="text-xs text-purple-600 font-medium">+{log.otHours} ชม. OT</p>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${log.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                                    log.status === 'late' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-red-100 text-red-700'
                                                    }`}>
                                                    {STATUS_LABEL[log.status] || log.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                {loc?.name || 'ไม่ทราบสถานที่'}
                                                <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                                                    {log.checkInLat ? `${log.checkInLat.toFixed(4)}, ${log.checkInLng?.toFixed(4)}` : 'ไม่มีพิกัด GPS'}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
