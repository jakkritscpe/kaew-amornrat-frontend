import { useAttendance } from '../../contexts/AttendanceContext';
import { Card } from '@/components/ui/card';
import { BarChart3, TrendingUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AdminReports() {
    const { employees, otRequests } = useAttendance();
    const departments = Array.from(new Set(employees.map(e => e.department)));

    const weeklyData = [
        { day: 'จ.', p: 95 },
        { day: 'อ.', p: 88 },
        { day: 'พ.', p: 92 },
        { day: 'พฤ.', p: 90 },
        { day: 'ศ.', p: 85 },
    ];

    return (
        <div className="p-6 bg-slate-50 min-h-[calc(100vh-4rem)]">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">รายงานและสถิติ</h1>
                    <p className="text-sm text-slate-500 mt-1">แนวโน้มการมาทำงานและข้อมูลการทำงานล่วงเวลา</p>
                </div>
                <Button variant="outline" className="bg-white border-slate-200 shadow-sm">
                    <Download className="w-4 h-4 mr-2" />
                    ดาวน์โหลดรายงาน PDF
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 border-slate-200 shadow-sm shadow-slate-100/50">
                    <h3 className="font-semibold text-slate-800 flex items-center mb-6">
                        <TrendingUp className="w-5 h-5 mr-2 text-blue-500" />
                        อัตราการมาทำงานรายสัปดาห์
                    </h3>
                    <div className="flex items-end justify-between h-48 mt-4 gap-2">
                        {weeklyData.map((d, i) => (
                            <div key={i} className="flex flex-col items-center flex-1">
                                <div className="w-full max-w-[40px] bg-blue-100 rounded-t-md relative h-full flex items-end">
                                    <div
                                        className="w-full bg-blue-600 rounded-t-md transition-all"
                                        style={{ height: `${d.p}%` }}
                                    ></div>
                                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-blue-600">{d.p}%</span>
                                </div>
                                <span className="text-xs font-medium text-slate-500 mt-2">{d.day}</span>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6 border-slate-200 shadow-sm shadow-slate-100/50">
                    <h3 className="font-semibold text-slate-800 flex items-center mb-6">
                        <BarChart3 className="w-5 h-5 mr-2 text-indigo-500" />
                        สัดส่วนพนักงานแต่ละแผนก
                    </h3>
                    <div className="space-y-4">
                        {departments.map((dept, i) => {
                            const empCount = employees.filter(e => e.department === dept).length;
                            const total = employees.length;
                            const pct = Math.round((empCount / total) * 100);
                            return (
                                <div key={i} className="w-full">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-medium text-slate-700">{dept}</span>
                                        <span className="text-slate-500">{empCount} คน</span>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2">
                                        <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card className="p-5 flex flex-col items-center text-center justify-center">
                    <p className="text-sm text-slate-500 font-medium">จำนวนพนักงานทั้งหมด</p>
                    <h4 className="text-3xl font-black text-slate-900 mt-2">{employees.length} คน</h4>
                </Card>
                <Card className="p-5 flex flex-col items-center text-center justify-center">
                    <p className="text-sm text-slate-500 font-medium">ชั่วโมง OT ที่อนุมัติ (เดือนนี้)</p>
                    <h4 className="text-3xl font-black text-purple-600 mt-2">
                        {otRequests.filter(r => r.status === 'approved').length * 2} ชม.
                    </h4>
                </Card>
                <Card className="p-5 flex flex-col items-center text-center justify-center">
                    <p className="text-sm text-slate-500 font-medium">ความตรงต่อเวลาโดยรวม</p>
                    <h4 className="text-3xl font-black text-emerald-600 mt-2">91%</h4>
                </Card>
            </div>
        </div>
    );
}
