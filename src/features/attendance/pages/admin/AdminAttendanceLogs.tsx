import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAttendance } from '../../contexts/useAttendance';
import { Search, Filter, Download, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AttendanceLog } from '../../types';
import { formatTime, formatDate } from '@/lib/utils';

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
    }).sort((a: AttendanceLog, b: AttendanceLog) => {
        const ta = a.checkInTime ? new Date(a.checkInTime).getTime() : new Date(a.date).getTime();
        const tb = b.checkInTime ? new Date(b.checkInTime).getTime() : new Date(b.date).getTime();
        return tb - ta;
    });

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
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center bg-slate-50/50">
                    <div className="relative w-full sm:flex-1 sm:max-w-md group focus-within:ring-4 focus-within:ring-blue-500/20 rounded-md transition-all">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="ค้นหาชื่อพนักงานหรือแผนก..."
                            className="pl-9 bg-white transition-all"
                            autoComplete="off"
                            spellCheck={false}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                        <Input
                            type="date"
                            value={dateFilter}
                            onChange={e => setDateFilter(e.target.value)}
                            className="bg-white text-sm w-full sm:w-auto"
                        />
                    </div>
                </div>

                {/* Mobile View: Cards */}
                <div className="md:hidden divide-y divide-slate-100">
                    {filteredLogs.length === 0 ? (
                        <div className="py-12 text-center px-4">
                            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Search className="w-6 h-6 text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-medium">ไม่พบข้อมูลการลงเวลา</p>
                            <p className="text-sm text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกวันที่อื่น</p>
                        </div>
                    ) : (
                        filteredLogs.map(log => {
                            const emp = employees.find(e => e.id === log.employeeId);
                            const loc = locations.find(l => l.id === log.locationId);
                            return (
                                <div key={log.id} className="p-4 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="font-semibold text-slate-900 leading-tight">
                                                {emp?.name}{emp?.nickname ? <span className="font-normal text-slate-500 ml-1">({emp.nickname})</span> : null}
                                            </p>
                                            <p className="text-xs text-slate-500 mt-0.5">{emp?.department}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${log.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                            log.status === 'late' ? 'bg-orange-100 text-orange-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {STATUS_LABEL[log.status] || log.status}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm bg-slate-50/50 rounded-lg p-3">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5 font-semibold">เวลาเข้า-ออก</p>
                                            <div className="flex items-center gap-1.5 text-slate-600">
                                                <span className="font-semibold text-emerald-600">{formatTime(log.checkInTime)}</span>
                                                <span className="text-slate-300">-</span>
                                                <span className="font-semibold text-slate-700">{formatTime(log.checkOutTime)}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5 font-semibold">ชั่วโมงทำงาน</p>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-slate-700 font-medium">{log.workHours} ชม.</span>
                                                {log.otHours > 0 ? <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">+{log.otHours} OT</span> : null}
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5 font-semibold">สถานที่</p>
                                            <p className="text-xs font-medium text-slate-600 truncate">{loc?.name || 'ไม่ทราบสถานที่'}</p>
                                            <p className="font-mono text-[9px] text-slate-400 mt-0.5">{log.checkInLat ? `${log.checkInLat.toFixed(4)}, ${log.checkInLng?.toFixed(4)}` : 'ไม่มีพิกัด GPS'}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <Link
                                            to={`/admin/attendance/logs/${log.id}`}
                                            className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded-md border border-blue-200 transition-colors"
                                        >
                                            ดูรายละเอียด <ChevronRight className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-slate-50/80 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-4 border-b border-slate-100">พนักงาน</th>
                                <th className="px-6 py-4 border-b border-slate-100">วันที่</th>
                                <th className="px-6 py-4 border-b border-slate-100">เข้า / ออก</th>
                                <th className="px-6 py-4 border-b border-slate-100">ชั่วโมง / OT</th>
                                <th className="px-6 py-4 border-b border-slate-100">สถานะ</th>
                                <th className="px-6 py-4 border-b border-slate-100">สถานที่</th>
                                <th className="px-4 py-4 border-b border-slate-100 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Search className="w-6 h-6 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 font-medium">ไม่พบข้อมูลการลงเวลา</p>
                                        <p className="text-sm text-slate-400 mt-1">ลองเปลี่ยนคำค้นหา หรือเลือกวันที่อื่น</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map(log => {
                                    const emp = employees.find(e => e.id === log.employeeId);
                                    const loc = locations.find(l => l.id === log.locationId);
                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-900 leading-tight">
                                                    {emp?.name}{emp?.nickname ? <span className="font-normal text-slate-500 ml-1">({emp.nickname})</span> : null}
                                                </p>
                                                <p className="text-xs text-slate-500 mt-0.5">{emp?.department}</p>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">{formatDate(log.date)}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-slate-600">
                                                    <span className="font-semibold text-emerald-600">{formatTime(log.checkInTime)}</span>
                                                    <span className="text-slate-300">-</span>
                                                    <span className="font-semibold text-slate-700">{formatTime(log.checkOutTime)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-slate-700 font-medium">{log.workHours} ชม.</p>
                                                {log.otHours > 0 ? <p className="text-[11px] text-purple-600 font-semibold mt-0.5">+{log.otHours} ชม. OT</p> : null}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${log.status === 'present' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                                                    log.status === 'late' ? 'bg-orange-50 text-orange-700 ring-orange-600/20' :
                                                        'bg-red-50 text-red-700 ring-red-600/20'
                                                    }`}>
                                                    {STATUS_LABEL[log.status] || log.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                <span className="font-medium text-slate-700">{loc?.name || 'ไม่ทราบสถานที่'}</span>
                                                <div className="font-mono text-[10px] text-slate-400 mt-1">
                                                    {log.checkInLat ? `${log.checkInLat.toFixed(4)}, ${log.checkInLng?.toFixed(4)}` : 'ไม่มีพิกัด GPS'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <Link
                                                    to={`/admin/attendance/logs/${log.id}`}
                                                    className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap"
                                                >
                                                    รายละเอียด <ChevronRight className="w-3.5 h-3.5" />
                                                </Link>
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
