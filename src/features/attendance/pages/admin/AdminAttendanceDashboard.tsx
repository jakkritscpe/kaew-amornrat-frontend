import { useAttendance } from '../../contexts/AttendanceContext';
import { Users, Clock, AlertTriangle, FileCheck2, CalendarX, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';

const STATUS_LABEL: Record<string, string> = {
    present: 'มาทำงาน',
    late: 'สาย',
    absent: 'ขาดงาน',
};

export function AdminAttendanceDashboard() {
    const { employees, logs, otRequests } = useAttendance();
    const todayDate = new Date().toISOString().split('T')[0];

    const todayLogs = logs.filter(l => l.date === todayDate);
    const totalEmployees = employees.length;

    const presentCount = todayLogs.filter(l => l.status === 'present').length;
    const lateCount = todayLogs.filter(l => l.status === 'late').length;
    const absentCount = totalEmployees - presentCount - lateCount;

    const pendingOTs = otRequests.filter(req => req.status === 'pending').length;

    const [y, m, d] = todayDate.split('-');
    const displayDate = `${parseInt(d)} / ${parseInt(m)} / ${parseInt(y) + 543}`;

    return (
        <div className="p-6 space-y-6 bg-slate-50 min-h-[calc(100vh-4rem)]">
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">แดชบอร์ดการลงเวลา</h1>
                <p className="text-sm text-slate-500 mt-1">สรุปภาพรวมวันนี้: {displayDate}</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="p-4 sm:p-6 border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow bg-white relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-emerald-50/50 to-emerald-100/20 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
                    <div className="flex items-center">
                        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100/50 shadow-sm">
                            <Users className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-500 tracking-wide">มาทำงาน</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{presentCount}</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 sm:p-6 border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow bg-white relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-orange-50/50 to-orange-100/20 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
                    <div className="flex items-center">
                        <div className="p-3 rounded-xl bg-orange-50 border border-orange-100/50 shadow-sm">
                            <Clock className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-500 tracking-wide">มาสาย</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{lateCount}</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-4 sm:p-6 border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow bg-white relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-red-50/50 to-red-100/20 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
                    <div className="flex items-center">
                        <div className="p-3 rounded-xl bg-red-50 border border-red-100/50 shadow-sm">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-500 tracking-wide">ขาดงาน</p>
                            <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{absentCount}</h3>
                        </div>
                    </div>
                </Card>

                <Link to="/admin/attendance/ot-approvals" className="block outline-none focus:ring-2 focus:ring-blue-500 rounded-xl">
                    <Card className="h-full p-4 sm:p-6 border-l-4 border-l-blue-500 shadow-sm hover:shadow-md hover:bg-slate-50/50 transition-all bg-white relative overflow-hidden group cursor-pointer">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-br from-blue-50/50 to-blue-100/20 rounded-bl-full -z-10 transition-transform group-hover:scale-110" />
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="p-3 rounded-xl bg-blue-50 border border-blue-100/50 shadow-sm">
                                    <FileCheck2 className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-slate-500 tracking-wide">รออนุมัติ OT</p>
                                    <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{pendingOTs}</h3>
                                </div>
                            </div>
                            <ArrowRight className="w-5 h-5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-4 group-hover:translate-x-0 duration-300" />
                        </div>
                    </Card>
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-slate-100 flex justify-between items-center bg-white">
                    <div>
                        <h2 className="text-base sm:text-lg font-semibold text-slate-900">การเช็คอินล่าสุดวันนี้</h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">รายการลงเวลาเข้า-ออกงานประจำวัน</p>
                    </div>
                    <Link to="/admin/attendance/logs" className="hidden sm:flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
                        ดูทั้งหมด <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                </div>
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-slate-50/80 text-slate-500 text-xs uppercase tracking-wider font-semibold border-b border-slate-200/60">
                            <tr>
                                <th className="px-5 py-3.5 sm:px-6">พนักงาน</th>
                                <th className="px-5 py-3.5 sm:px-6 hidden sm:table-cell">แผนก</th>
                                <th className="px-5 py-3.5 sm:px-6">เวลาเข้า</th>
                                <th className="px-5 py-3.5 sm:px-6">เวลาออก</th>
                                <th className="px-5 py-3.5 sm:px-6">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {todayLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                                <CalendarX className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <p className="text-slate-500 font-medium text-base mb-1">ยังไม่มีข้อมูลการลงเวลาวันนี้</p>
                                            <p className="text-slate-400 text-sm">เมื่อพนักงานเช็คอิน ข้อมูลจะแสดงที่นี่</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                todayLogs.map(log => {
                                    const emp = employees.find(e => e.id === log.employeeId);
                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-5 py-4 sm:px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-blue-100 border border-blue-200 text-blue-700 font-bold flex items-center justify-center text-sm shadow-sm group-hover:scale-105 transition-transform">
                                                        {emp?.name.charAt(0) || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-900">{emp?.name || 'ไม่ทราบชื่อ'}</p>
                                                        {emp?.nickname && <p className="text-xs text-slate-500">({emp.nickname})</p>}
                                                        <p className="text-xs text-slate-500 sm:hidden mt-0.5">{emp?.department}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 sm:px-6 text-slate-600 hidden sm:table-cell">{emp?.department}</td>
                                            <td className="px-5 py-4 sm:px-6 text-slate-900 font-medium">{log.checkInTime}</td>
                                            <td className="px-5 py-4 sm:px-6 text-slate-500 font-medium">{log.checkOutTime || '--:--'}</td>
                                            <td className="px-5 py-4 sm:px-6">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase ${log.status === 'present' ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' :
                                                        log.status === 'late' ? 'bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20' :
                                                            'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/10'
                                                    }`}>
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
                {todayLogs.length > 0 && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 sm:hidden">
                        <Link to="/admin/attendance/logs" className="block w-full text-center text-sm font-medium text-blue-600 hover:text-blue-700 bg-white border border-slate-200 rounded-lg py-2.5 shadow-sm">
                            ดูประวัติทั้งหมด
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
