import { useAttendance } from '../../contexts/AttendanceContext';
import { Users, Clock, AlertTriangle, FileCheck2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

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

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="p-6 border-l-4 border-l-emerald-500 shadow-sm">
                    <div className="flex items-center">
                        <div className="p-3 rounded-xl bg-emerald-50">
                            <Users className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-500">มาทำงาน</p>
                            <h3 className="text-2xl font-bold text-slate-900">{presentCount}</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-orange-500 shadow-sm">
                    <div className="flex items-center">
                        <div className="p-3 rounded-xl bg-orange-50">
                            <Clock className="w-6 h-6 text-orange-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-500">มาสาย</p>
                            <h3 className="text-2xl font-bold text-slate-900">{lateCount}</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-red-500 shadow-sm">
                    <div className="flex items-center">
                        <div className="p-3 rounded-xl bg-red-50">
                            <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-500">ขาดงาน</p>
                            <h3 className="text-2xl font-bold text-slate-900">{absentCount}</h3>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-l-4 border-l-blue-500 shadow-sm hover:bg-blue-50/50 transition-colors cursor-pointer">
                    <div className="flex items-center">
                        <div className="p-3 rounded-xl bg-blue-50">
                            <FileCheck2 className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-slate-500">รออนุมัติ OT</p>
                            <h3 className="text-2xl font-bold text-slate-900">{pendingOTs}</h3>
                        </div>
                    </div>
                </Card>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="font-semibold text-slate-800">การเช็คอินล่าสุดวันนี้</h2>
                </div>
                <div className="p-0 overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50/80 text-slate-500 font-medium">
                            <tr>
                                <th className="px-6 py-3">พนักงาน</th>
                                <th className="px-6 py-3">แผนก</th>
                                <th className="px-6 py-3">เวลาเข้า</th>
                                <th className="px-6 py-3">เวลาออก</th>
                                <th className="px-6 py-3">สถานะ</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {todayLogs.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">ยังไม่มีข้อมูลการลงเวลาวันนี้</td></tr>
                            ) : (
                                todayLogs.map(log => {
                                    const emp = employees.find(e => e.id === log.employeeId);
                                    return (
                                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                                                    {emp?.name.charAt(0) || '?'}
                                                </div>
                                                {emp?.name || 'ไม่ทราบชื่อ'}{emp?.nickname ? <span className="font-normal text-slate-500 ml-1">({emp.nickname})</span> : null}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600">{emp?.department}</td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">{log.checkInTime}</td>
                                            <td className="px-6 py-4 text-slate-600 font-medium">{log.checkOutTime || '--:--'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${log.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                                    log.status === 'late' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-red-100 text-red-700'
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
            </div>
        </div>
    );
}
