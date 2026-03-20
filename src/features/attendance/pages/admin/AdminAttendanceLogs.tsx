import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAttendance } from '../../contexts/useAttendance';
import { Search, Filter, Download, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AttendanceLog } from '../../types';
import { cn, formatTime, formatDate } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import { useAdminTheme } from '@/hooks/useAdminTheme';

// STATUS_LABEL is now derived from t() inside the component

function downloadCSV(filename: string, headers: string[], rows: string[][]) {
    const BOM = '\uFEFF';
    const csv = BOM + [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

export function AdminAttendanceLogs() {
    const { t } = useTranslation();
    const { dark } = useAdminTheme();
    const { logs, employees, locations } = useAttendance();

    const STATUS_LABEL: Record<string, string> = {
        present: t('status.present'),
        late: t('status.late'),
        absent: t('status.absent'),
    };
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

    const exportCSV = useCallback(() => {
        if (!filteredLogs.length) return;
        const headers = [t('admin.logs.csvHeaders.date'), t('admin.logs.csvHeaders.name'), t('admin.logs.csvHeaders.nickname'), t('admin.logs.csvHeaders.department'), t('admin.logs.csvHeaders.checkIn'), t('admin.logs.csvHeaders.checkOut'), t('admin.logs.csvHeaders.workHours'), t('admin.logs.csvHeaders.ot'), t('admin.logs.csvHeaders.status'), t('admin.logs.csvHeaders.location')];
        const rows = filteredLogs.map(log => {
            const emp = employees.find(e => e.id === log.employeeId);
            const loc = locations.find(l => l.id === log.locationId);
            return [
                log.date,
                emp?.name ?? '-',
                emp?.nickname ?? '',
                emp?.department ?? '-',
                formatTime(log.checkInTime),
                formatTime(log.checkOutTime),
                String(log.workHours),
                String(log.otHours),
                STATUS_LABEL[log.status] ?? log.status,
                loc?.name ?? '-',
            ];
        });
        const suffix = dateFilter || new Date().toISOString().split('T')[0];
        downloadCSV(`attendance-logs-${suffix}.csv`, headers, rows);
    }, [filteredLogs, employees, locations, dateFilter]);

    return (
        <div className="p-6 min-h-[calc(100vh-4rem)]">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className={cn('text-2xl font-bold tracking-tight', dark ? 'text-white' : 'text-slate-900')}>{t('admin.logs.title')}</h1>
                    <p className={cn('text-sm mt-1', dark ? 'text-white/50' : 'text-slate-500')}>{t('admin.logs.subtitle')}</p>
                </div>
                <Button variant="outline" className={cn(dark ? 'bg-white/[0.06] border-white/10 text-white/70 hover:bg-white/[0.1]' : 'bg-white border-slate-200')} onClick={exportCSV} disabled={!filteredLogs.length}>
                    <Download className={cn('w-4 h-4 mr-2', dark ? 'text-white/50' : 'text-slate-500')} />
                    {t('admin.logs.exportCsv')}
                </Button>
            </div>

            <div className={cn('rounded-xl overflow-hidden', dark ? 'bg-white/[0.06] border border-white/10 shadow-none' : 'bg-white shadow-sm border border-slate-200')}>
                <div className={cn('p-4 border-b flex flex-col sm:flex-row gap-4 items-stretch sm:items-center', dark ? 'border-white/10 bg-white/[0.03]' : 'border-slate-100 bg-slate-50/50')}>
                    <div className="relative w-full sm:flex-1 sm:max-w-md group focus-within:ring-4 focus-within:ring-[#044F88]/20 rounded-md transition-all">
                        <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none group-focus-within:text-[#044F88] transition-colors', dark ? 'text-white/30' : 'text-slate-400')} />
                        <Input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder={t('admin.logs.searchPlaceholder')}
                            className={cn('pl-9 transition-all', dark ? 'bg-white/[0.06] border-white/10 text-white placeholder:text-white/30' : 'bg-white')}
                            autoComplete="off"
                            spellCheck={false}
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Filter className={cn('w-4 h-4 shrink-0', dark ? 'text-white/30' : 'text-slate-400')} />
                        <Input
                            type="date"
                            value={dateFilter}
                            onChange={e => setDateFilter(e.target.value)}
                            className={cn('text-sm w-full sm:w-auto', dark ? 'bg-white/[0.06] border-white/10 text-white' : 'bg-white')}
                        />
                    </div>
                </div>

                {/* Mobile View: Cards */}
                <div className={cn('md:hidden divide-y', dark ? 'divide-white/10' : 'divide-slate-100')}>
                    {filteredLogs.length === 0 ? (
                        <div className="py-12 text-center px-4">
                            <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3', dark ? 'bg-white/[0.06]' : 'bg-slate-50')}>
                                <Search className={cn('w-6 h-6', dark ? 'text-white/20' : 'text-slate-300')} />
                            </div>
                            <p className={cn('font-medium', dark ? 'text-white/50' : 'text-slate-500')}>{t('admin.logs.noData')}</p>
                            <p className={cn('text-sm mt-1', dark ? 'text-white/30' : 'text-slate-400')}>{t('admin.logs.noDataHint')}</p>
                        </div>
                    ) : (
                        filteredLogs.map(log => {
                            const emp = employees.find(e => e.id === log.employeeId);
                            const loc = locations.find(l => l.id === log.locationId);
                            return (
                                <div key={log.id} className={cn('p-4 transition-colors', dark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50/50')}>
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className={cn('font-semibold leading-tight', dark ? 'text-white' : 'text-slate-900')}>
                                                {emp?.name}{emp?.nickname ? <span className={cn('font-normal ml-1', dark ? 'text-white/50' : 'text-slate-500')}>({emp.nickname})</span> : null}
                                            </p>
                                            <p className={cn('text-xs mt-0.5', dark ? 'text-white/40' : 'text-slate-500')}>{emp?.department}</p>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${log.status === 'present' ? 'bg-emerald-100 text-emerald-700' :
                                            log.status === 'late' ? 'bg-orange-100 text-orange-700' :
                                                'bg-red-100 text-red-700'
                                            }`}>
                                            {STATUS_LABEL[log.status] || log.status}
                                        </span>
                                    </div>
                                    <div className={cn('grid grid-cols-2 gap-y-3 gap-x-4 text-sm rounded-lg p-3', dark ? 'bg-white/[0.03]' : 'bg-slate-50/50')}>
                                        <div>
                                            <p className={cn('text-[10px] uppercase tracking-wider mb-0.5 font-semibold', dark ? 'text-white/30' : 'text-slate-400')}>{t('admin.logs.checkInOutTime')}</p>
                                            <div className={cn('flex items-center gap-1.5', dark ? 'text-white/60' : 'text-slate-600')}>
                                                <span className="font-semibold text-emerald-600">{formatTime(log.checkInTime)}</span>
                                                <span className={dark ? 'text-white/20' : 'text-slate-300'}>-</span>
                                                <span className={cn('font-semibold', dark ? 'text-white/70' : 'text-slate-700')}>{formatTime(log.checkOutTime)}</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p className={cn('text-[10px] uppercase tracking-wider mb-0.5 font-semibold', dark ? 'text-white/30' : 'text-slate-400')}>{t('admin.logs.workHours')}</p>
                                            <div className="flex items-center gap-1.5">
                                                <span className={cn('font-medium', dark ? 'text-white/70' : 'text-slate-700')}>{log.workHours} {t('common.hours')}</span>
                                                {log.otHours > 0 ? <span className="text-[10px] bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">+{log.otHours} OT</span> : null}
                                            </div>
                                        </div>
                                        <div className="col-span-2">
                                            <p className={cn('text-[10px] uppercase tracking-wider mb-0.5 font-semibold', dark ? 'text-white/30' : 'text-slate-400')}>{t('admin.logs.location')}</p>
                                            <p className={cn('text-xs font-medium truncate', dark ? 'text-white/60' : 'text-slate-600')}>{loc?.name || t('admin.logs.unknownLocation')}</p>
                                            <p className={cn('font-mono text-[9px] mt-0.5', dark ? 'text-white/30' : 'text-slate-400')}>{log.checkInLat ? `${log.checkInLat.toFixed(4)}, ${log.checkInLng?.toFixed(4)}` : t('admin.logs.noGps')}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <Link
                                            to={`/admin/attendance/logs/${log.id}`}
                                            className="inline-flex items-center gap-1 text-xs font-medium text-[#044F88] hover:text-[#00223A] hover:bg-[#044F88]/5 px-3 py-1.5 rounded-md border border-[#044F88]/20 transition-colors"
                                        >
                                            {t('admin.logs.viewDetails')} <ChevronRight className="w-3.5 h-3.5" />
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
                        <thead className={cn('font-medium', dark ? 'bg-white/[0.03] text-white/50' : 'bg-slate-50/80 text-slate-500')}>
                            <tr>
                                <th className={cn('px-6 py-4 border-b', dark ? 'border-white/10' : 'border-slate-100')}>{t('admin.logs.employee')}</th>
                                <th className={cn('px-6 py-4 border-b', dark ? 'border-white/10' : 'border-slate-100')}>{t('admin.logs.date')}</th>
                                <th className={cn('px-6 py-4 border-b', dark ? 'border-white/10' : 'border-slate-100')}>{t('admin.logs.checkInOut')}</th>
                                <th className={cn('px-6 py-4 border-b', dark ? 'border-white/10' : 'border-slate-100')}>{t('admin.logs.hoursOt')}</th>
                                <th className={cn('px-6 py-4 border-b', dark ? 'border-white/10' : 'border-slate-100')}>{t('admin.logs.status')}</th>
                                <th className={cn('px-6 py-4 border-b', dark ? 'border-white/10' : 'border-slate-100')}>{t('admin.logs.location')}</th>
                                <th className={cn('px-4 py-4 border-b text-right', dark ? 'border-white/10' : 'border-slate-100')}></th>
                            </tr>
                        </thead>
                        <tbody className={cn('divide-y', dark ? 'divide-white/10' : 'divide-slate-100')}>
                            {filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className={cn('w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3', dark ? 'bg-white/[0.06]' : 'bg-slate-50')}>
                                            <Search className={cn('w-6 h-6', dark ? 'text-white/20' : 'text-slate-300')} />
                                        </div>
                                        <p className={cn('font-medium', dark ? 'text-white/50' : 'text-slate-500')}>{t('admin.logs.noData')}</p>
                                        <p className={cn('text-sm mt-1', dark ? 'text-white/30' : 'text-slate-400')}>{t('admin.logs.noDataHint')}</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredLogs.map(log => {
                                    const emp = employees.find(e => e.id === log.employeeId);
                                    const loc = locations.find(l => l.id === log.locationId);
                                    return (
                                        <tr key={log.id} className={cn('transition-colors', dark ? 'hover:bg-white/[0.04]' : 'hover:bg-slate-50/50')}>
                                            <td className="px-6 py-4">
                                                <p className={cn('font-medium leading-tight', dark ? 'text-white' : 'text-slate-900')}>
                                                    {emp?.name}{emp?.nickname ? <span className={cn('font-normal ml-1', dark ? 'text-white/50' : 'text-slate-500')}>({emp.nickname})</span> : null}
                                                </p>
                                                <p className={cn('text-xs mt-0.5', dark ? 'text-white/40' : 'text-slate-500')}>{emp?.department}</p>
                                            </td>
                                            <td className={cn('px-6 py-4 font-medium', dark ? 'text-white/60' : 'text-slate-600')}>{formatDate(log.date)}</td>
                                            <td className="px-6 py-4">
                                                <div className={cn('flex items-center gap-2', dark ? 'text-white/60' : 'text-slate-600')}>
                                                    <span className="font-semibold text-emerald-600">{formatTime(log.checkInTime)}</span>
                                                    <span className={dark ? 'text-white/20' : 'text-slate-300'}>-</span>
                                                    <span className={cn('font-semibold', dark ? 'text-white/70' : 'text-slate-700')}>{formatTime(log.checkOutTime)}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className={cn('font-medium', dark ? 'text-white/70' : 'text-slate-700')}>{log.workHours} {t('common.hours')}</p>
                                                {log.otHours > 0 ? <p className="text-[11px] text-purple-600 font-semibold mt-0.5">+{log.otHours} {t('common.hours')} OT</p> : null}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ring-1 ring-inset ${log.status === 'present' ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' :
                                                    log.status === 'late' ? 'bg-orange-50 text-orange-700 ring-orange-600/20' :
                                                        'bg-red-50 text-red-700 ring-red-600/20'
                                                    }`}>
                                                    {STATUS_LABEL[log.status] || log.status}
                                                </span>
                                            </td>
                                            <td className={cn('px-6 py-4 text-xs', dark ? 'text-white/40' : 'text-slate-500')}>
                                                <span className={cn('font-medium', dark ? 'text-white/70' : 'text-slate-700')}>{loc?.name || t('admin.logs.unknownLocation')}</span>
                                                <div className={cn('font-mono text-[10px] mt-1', dark ? 'text-white/30' : 'text-slate-400')}>
                                                    {log.checkInLat ? `${log.checkInLat.toFixed(4)}, ${log.checkInLng?.toFixed(4)}` : t('admin.logs.noGps')}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <Link
                                                    to={`/admin/attendance/logs/${log.id}`}
                                                    className="inline-flex items-center gap-1 text-xs font-medium text-[#044F88] hover:text-[#00223A] hover:bg-[#044F88]/5 px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap"
                                                >
                                                    {t('admin.logs.details')} <ChevronRight className="w-3.5 h-3.5" />
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
