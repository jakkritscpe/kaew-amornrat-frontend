import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAttendance } from '../../contexts/useAttendance';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
    ArrowLeft, Clock, MapPin, User, Calendar,
    Timer, TrendingUp, AlertCircle, CheckCircle2, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, formatTime, formatDate } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import { useAdminTheme } from '@/hooks/useAdminTheme';

// Fix Leaflet default icon broken by bundlers — same as EmployeeMap.tsx
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const checkInIcon = new L.DivIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:50%;background:#10b981;border:3px solid white;box-shadow:0 0 0 4px rgba(16,185,129,0.25),0 2px 8px rgba(0,0,0,0.25)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

const checkOutIcon = new L.DivIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:50%;background:#ef4444;border:3px solid white;box-shadow:0 0 0 4px rgba(239,68,68,0.25),0 2px 8px rgba(0,0,0,0.25)"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

/** Auto-fit map to show all markers */
function FitBounds({ positions }: { positions: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (positions.length === 0) return;
        if (positions.length === 1) {
            map.setView(positions[0], 16);
        } else {
            const bounds = L.latLngBounds(positions);
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
        }
    }, [map, positions]);
    return null;
}

function formatFullDate(ds: string): string {
    if (!ds) return '-';
    const [y, m, d] = ds.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('th-TH', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function calcLateMinutes(checkInTime: string, shiftStart: string): number {
    const checkIn = new Date(checkInTime);
    const [h, m] = shiftStart.split(':').map(Number);
    const start = new Date(checkIn);
    start.setHours(h, m, 0, 0);
    return Math.max(0, Math.floor((checkIn.getTime() - start.getTime()) / 60000));
}

// STATUS_CONFIG labels are derived from t() inside the component
const STATUS_CONFIG_STYLES = {
    present: { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-600/20', dot: 'bg-emerald-500' },
    late:    { bg: 'bg-orange-100',  text: 'text-orange-700',  ring: 'ring-orange-600/20',  dot: 'bg-orange-500'  },
    absent:  { bg: 'bg-red-100',     text: 'text-red-700',     ring: 'ring-red-600/20',     dot: 'bg-red-500'     },
    on_leave:{ bg: 'bg-[#044F88]/10',    text: 'text-[#00223A]',    ring: 'ring-[#044F88]/20',    dot: 'bg-[#044F88]'    },
} as const;

export function AdminAttendanceLogDetail() {
    const { t } = useTranslation();
    const { dark } = useAdminTheme();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { logs, employees, locations } = useAttendance();

    const STATUS_LABELS: Record<string, string> = {
        present: t('status.present'),
        late: t('status.late'),
        absent: t('status.absent'),
        on_leave: t('status.onLeave'),
    };

    const log = logs.find(l => l.id === id);
    const emp = log ? employees.find(e => e.id === log.employeeId) : undefined;
    const loc = log ? locations.find(l => l.id === log.locationId) : undefined;

    // Collect valid GPS positions for map
    const mapPositions: [number, number][] = [];
    if (log?.checkInLat != null && log?.checkInLng != null)  mapPositions.push([log.checkInLat,  log.checkInLng]);
    if (log?.checkOutLat != null && log?.checkOutLng != null) mapPositions.push([log.checkOutLat, log.checkOutLng]);

    // Map center fallback: work location or first available position
    const mapCenter: [number, number] =
        mapPositions[0] ??
        (loc ? [loc.lat, loc.lng] : [13.7563, 100.5018]);

    // ── Not found ──────────────────────────────────────────────────────────
    if (!log) {
        return (
            <div className="p-6 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
                <div className={cn('w-16 h-16 rounded-full flex items-center justify-center', dark ? 'bg-white/[0.06]' : 'bg-slate-100')}>
                    <AlertCircle className={cn('w-8 h-8', dark ? 'text-white/30' : 'text-slate-400')} />
                </div>
                <div className="text-center">
                    <p className={cn('text-lg font-semibold', dark ? 'text-white/70' : 'text-slate-700')}>{t('admin.logDetail.notFound')}</p>
                    <p className={cn('text-sm mt-1', dark ? 'text-white/30' : 'text-slate-400')}>{t('admin.logDetail.recordId')}: {id}</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/admin/attendance/logs')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> {t('admin.logDetail.backToList')}
                </Button>
            </div>
        );
    }

    const statusStyle = STATUS_CONFIG_STYLES[log.status] ?? STATUS_CONFIG_STYLES.absent;
    const statusLabel = STATUS_LABELS[log.status] ?? log.status;
    const lateMinutes = (log.status === 'late' && log.checkInTime && emp?.shiftStartTime)
        ? calcLateMinutes(log.checkInTime, emp.shiftStartTime)
        : 0;

    // Initials for avatar placeholder
    const initials = emp?.name
        ? emp.name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : '??';

    return (
        <div className="min-h-[calc(100vh-4rem)]">

            {/* ── Top nav bar ────────────────────────────────────────────── */}
            <div className={cn('border-b sticky top-0 z-10', dark ? 'bg-white/[0.06] border-white/10' : 'bg-white border-slate-200')}>
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className={cn('flex items-center gap-1.5 text-sm transition-colors rounded-md px-2 py-1 -ml-2', dark ? 'text-white/50 hover:text-white hover:bg-white/[0.06]' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100')}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        {t('admin.logDetail.attendanceLogs')}
                    </button>
                    <span className={dark ? 'text-white/20' : 'text-slate-300'}>/</span>
                    <span className={cn('text-sm font-medium truncate', dark ? 'text-white/70' : 'text-slate-700')}>{emp?.name ?? '—'}</span>
                    <span className={cn('hidden sm:inline', dark ? 'text-white/20' : 'text-slate-300')}>/</span>
                    <span className={cn('text-sm hidden sm:inline', dark ? 'text-white/40' : 'text-slate-500')}>{formatDate(log.date)}</span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

                {/* ── Hero card ──────────────────────────────────────────── */}
                <div className={cn('rounded-xl border p-5 sm:p-6', dark ? 'bg-white/[0.06] border-white/10 shadow-none' : 'bg-white border-slate-200 shadow-sm')}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        {/* Avatar + employee info */}
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#044F88] to-[#00223A] flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm select-none">
                                {emp?.avatarUrl
                                    ? <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full rounded-full object-cover" />
                                    : initials
                                }
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className={cn('text-xl font-bold leading-tight', dark ? 'text-white' : 'text-slate-900')}>
                                        {emp?.name ?? t('admin.dashboard.unknownName')}
                                    </h1>
                                    {emp?.nickname && (
                                        <span className={cn('font-normal text-base', dark ? 'text-white/40' : 'text-slate-400')}>({emp.nickname})</span>
                                    )}
                                </div>
                                <p className={cn('text-sm mt-0.5', dark ? 'text-white/50' : 'text-slate-500')}>
                                    {emp?.department ?? '—'}
                                    {emp?.position && <span className={dark ? 'text-white/30' : 'text-slate-400'}> · {emp.position}</span>}
                                </p>
                            </div>
                        </div>

                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ring-1 ring-inset self-start shrink-0 ${statusStyle.bg} ${statusStyle.text} ${statusStyle.ring}`}>
                            <span className={`w-2 h-2 rounded-full ${statusStyle.dot}`} />
                            {statusLabel}
                        </span>
                    </div>

                    {/* Date + location row */}
                    <div className={cn('mt-4 pt-4 border-t flex flex-col sm:flex-row gap-3 text-sm', dark ? 'border-white/10 text-white/60' : 'border-slate-100 text-slate-600')}>
                        <div className="flex items-center gap-2">
                            <Calendar className={cn('w-4 h-4 shrink-0', dark ? 'text-white/30' : 'text-slate-400')} />
                            <span className="font-medium">{formatFullDate(log.date)}</span>
                        </div>
                        {loc && (
                            <div className="flex items-center gap-2 sm:ml-4">
                                <MapPin className={cn('w-4 h-4 shrink-0', dark ? 'text-white/30' : 'text-slate-400')} />
                                <span>{loc.name}</span>
                            </div>
                        )}
                        {emp && (
                            <div className="flex items-center gap-2 sm:ml-4">
                                <Clock className={cn('w-4 h-4 shrink-0', dark ? 'text-white/30' : 'text-slate-400')} />
                                <span>{t('admin.logDetail.shift')} {emp.shiftStartTime} – {emp.shiftEndTime}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Stats row ──────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Check-in */}
                    <div className={cn('rounded-xl border p-4 sm:p-5', dark ? 'bg-white/[0.06] border-white/10 shadow-none' : 'bg-white border-slate-200 shadow-sm')}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', dark ? 'bg-emerald-500/10' : 'bg-emerald-50')}>
                                <Clock className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className={cn('text-xs font-semibold uppercase tracking-wider', dark ? 'text-white/50' : 'text-slate-500')}>{t('admin.logDetail.checkInTime')}</span>
                        </div>
                        <p className={cn('text-2xl font-bold tabular-nums', dark ? 'text-white' : 'text-slate-900')}>{formatTime(log.checkInTime)}</p>
                        {log.status === 'late' && lateMinutes > 0 ? (
                            <p className="text-xs text-orange-600 font-medium mt-1 flex items-center gap-1">
                                <Timer className="w-3 h-3" /> {t('admin.logDetail.lateMinutes').replace('{n}', String(lateMinutes))}
                            </p>
                        ) : log.checkInTime ? (
                            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> {t('admin.logDetail.onTime')}
                            </p>
                        ) : (
                            <p className={cn('text-xs mt-1', dark ? 'text-white/30' : 'text-slate-400')}>{t('admin.logDetail.noData')}</p>
                        )}
                    </div>

                    {/* Check-out */}
                    <div className={cn('rounded-xl border p-4 sm:p-5', dark ? 'bg-white/[0.06] border-white/10 shadow-none' : 'bg-white border-slate-200 shadow-sm')}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', dark ? 'bg-white/[0.06]' : 'bg-slate-100')}>
                                <Clock className={cn('w-4 h-4', dark ? 'text-white/50' : 'text-slate-500')} />
                            </div>
                            <span className={cn('text-xs font-semibold uppercase tracking-wider', dark ? 'text-white/50' : 'text-slate-500')}>{t('admin.logDetail.checkOutTime')}</span>
                        </div>
                        <p className={cn('text-2xl font-bold tabular-nums', dark ? 'text-white' : 'text-slate-900')}>{formatTime(log.checkOutTime)}</p>
                        {!log.checkOutTime && (
                            <p className="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
                                <Info className="w-3 h-3" /> {t('admin.logDetail.notCheckedOut')}
                            </p>
                        )}
                    </div>

                    {/* Work hours */}
                    <div className={cn('rounded-xl border p-4 sm:p-5', dark ? 'bg-white/[0.06] border-white/10 shadow-none' : 'bg-white border-slate-200 shadow-sm')}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', dark ? 'bg-[#044F88]/10' : 'bg-[#044F88]/5')}>
                                <User className="w-4 h-4 text-[#044F88]" />
                            </div>
                            <span className={cn('text-xs font-semibold uppercase tracking-wider', dark ? 'text-white/50' : 'text-slate-500')}>{t('admin.logDetail.workHours')}</span>
                        </div>
                        <p className={cn('text-2xl font-bold tabular-nums', dark ? 'text-white' : 'text-slate-900')}>
                            {log.workHours > 0 ? log.workHours.toFixed(2) : '—'}
                        </p>
                        <p className={cn('text-xs mt-1', dark ? 'text-white/30' : 'text-slate-400')}>{t('admin.logDetail.hours')}</p>
                    </div>

                    {/* OT */}
                    <div className={cn('rounded-xl border p-4 sm:p-5', dark ? 'bg-white/[0.06] border-white/10 shadow-none' : (log.otHours > 0 ? 'bg-purple-50/30 border-purple-200' : 'bg-white border-slate-200'), dark ? '' : 'shadow-sm')}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', log.otHours > 0 ? (dark ? 'bg-purple-500/10' : 'bg-purple-100') : (dark ? 'bg-white/[0.06]' : 'bg-slate-100'))}>
                                <TrendingUp className={cn('w-4 h-4', log.otHours > 0 ? 'text-purple-600' : (dark ? 'text-white/30' : 'text-slate-400'))} />
                            </div>
                            <span className={cn('text-xs font-semibold uppercase tracking-wider', dark ? 'text-white/50' : 'text-slate-500')}>{t('admin.logDetail.overtime')}</span>
                        </div>
                        <p className={cn('text-2xl font-bold tabular-nums', log.otHours > 0 ? 'text-purple-700' : (dark ? 'text-white/30' : 'text-slate-400'))}>
                            {log.otHours > 0 ? `+${log.otHours.toFixed(2)}` : '—'}
                        </p>
                        <p className={cn('text-xs mt-1', dark ? 'text-white/30' : 'text-slate-400')}>{log.otHours > 0 ? t('admin.logDetail.otHours') : t('admin.logDetail.noOt')}</p>
                    </div>
                </div>

                {/* ── Map section ────────────────────────────────────────── */}
                <div className={cn('rounded-xl border overflow-hidden', dark ? 'bg-white/[0.06] border-white/10 shadow-none' : 'bg-white border-slate-200 shadow-sm')}>
                    <div className={cn('px-5 py-4 border-b flex items-center justify-between', dark ? 'border-white/10' : 'border-slate-100')}>
                        <div>
                            <h2 className={cn('text-sm font-semibold', dark ? 'text-white/80' : 'text-slate-800')}>{t('admin.logDetail.mapTitle')}</h2>
                            <p className={cn('text-xs mt-0.5', dark ? 'text-white/30' : 'text-slate-400')}>{t('admin.logDetail.mapSubtitle')}</p>
                        </div>
                        {/* Legend */}
                        <div className={cn('hidden sm:flex items-center gap-4 text-xs', dark ? 'text-white/50' : 'text-slate-500')}>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm" />
                                {t('admin.logDetail.checkInTime')}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-sm" />
                                {t('admin.logDetail.checkOutTime')}
                            </span>
                            {loc && (
                                <span className="flex items-center gap-1.5">
                                    <span className="w-4 h-3 rounded border-2 border-dashed border-[#044F88]/80 bg-[#044F88]/5 inline-block" />
                                    Geofence
                                </span>
                            )}
                        </div>
                    </div>

                    {mapPositions.length === 0 ? (
                        <div className={cn('h-[360px] flex flex-col items-center justify-center gap-3', dark ? 'bg-white/[0.03]' : 'bg-slate-50')}>
                            <div className={cn('w-14 h-14 rounded-full flex items-center justify-center', dark ? 'bg-white/[0.06]' : 'bg-slate-100')}>
                                <MapPin className={cn('w-7 h-7', dark ? 'text-white/20' : 'text-slate-300')} />
                            </div>
                            <div className="text-center">
                                <p className={cn('font-medium text-sm', dark ? 'text-white/50' : 'text-slate-500')}>{t('admin.logDetail.noGpsData')}</p>
                                <p className={cn('text-xs mt-1', dark ? 'text-white/30' : 'text-slate-400')}>{t('admin.logDetail.noGpsPositions')}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-[400px] sm:h-[460px] relative z-0">
                            <MapContainer
                                center={mapCenter}
                                zoom={15}
                                style={{ height: '100%', width: '100%', zIndex: 0 }}
                                zoomControl={true}
                            >
                                <TileLayer
                                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                />
                                <FitBounds positions={mapPositions} />

                                {/* Work location geofence circle */}
                                {loc && (
                                    <Circle
                                        center={[loc.lat, loc.lng]}
                                        radius={loc.radiusMeters}
                                        pathOptions={{
                                            color: '#044F88',
                                            fillColor: '#044F88',
                                            fillOpacity: 0.08,
                                            weight: 2,
                                            dashArray: '6 4',
                                        }}
                                    />
                                )}

                                {/* Check-in marker */}
                                {log.checkInLat != null && log.checkInLng != null && (
                                    <Marker position={[log.checkInLat, log.checkInLng]} icon={checkInIcon}>
                                        <Popup>
                                            <div className="text-sm space-y-0.5">
                                                <p className="font-semibold text-emerald-700">{t('admin.logDetail.checkInTime')}</p>
                                                <p className="text-gray-600">{formatTime(log.checkInTime)}</p>
                                                <p className="font-mono text-[11px] text-gray-400">
                                                    {log.checkInLat.toFixed(6)}, {log.checkInLng.toFixed(6)}
                                                </p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )}

                                {/* Check-out marker */}
                                {log.checkOutLat != null && log.checkOutLng != null && (
                                    <Marker position={[log.checkOutLat, log.checkOutLng]} icon={checkOutIcon}>
                                        <Popup>
                                            <div className="text-sm space-y-0.5">
                                                <p className="font-semibold text-red-600">{t('admin.logDetail.checkOutTime')}</p>
                                                <p className="text-gray-600">{formatTime(log.checkOutTime)}</p>
                                                <p className="font-mono text-[11px] text-gray-400">
                                                    {log.checkOutLat.toFixed(6)}, {log.checkOutLng.toFixed(6)}
                                                </p>
                                            </div>
                                        </Popup>
                                    </Marker>
                                )}
                            </MapContainer>
                        </div>
                    )}

                    {/* Mobile legend */}
                    <div className={cn('sm:hidden px-5 py-3 border-t flex items-center gap-4 text-xs', dark ? 'border-white/10 text-white/50' : 'border-slate-100 text-slate-500')}>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> {t('admin.logDetail.checkInTime')}
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> {t('admin.logDetail.checkOutTime')}
                        </span>
                        {loc && (
                            <span className="flex items-center gap-1.5">
                                <span className="w-4 h-3 rounded border-2 border-dashed border-[#044F88]/80 bg-[#044F88]/5 inline-block" /> Geofence
                            </span>
                        )}
                    </div>
                </div>

                {/* ── GPS detail cards ───────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Check-in GPS */}
                    <div className={cn('rounded-xl border p-5', dark ? 'bg-white/[0.06] border-white/10 shadow-none' : 'bg-white border-slate-200 shadow-sm')}>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                            <h3 className={cn('text-sm font-semibold', dark ? 'text-white/70' : 'text-slate-700')}>{t('admin.logDetail.gpsCheckIn')}</h3>
                        </div>
                        {log.checkInLat != null && log.checkInLng != null ? (
                            <div className="space-y-2">
                                <div className={cn('flex justify-between items-center py-2 border-b', dark ? 'border-white/5' : 'border-slate-50')}>
                                    <span className={cn('text-xs', dark ? 'text-white/40' : 'text-slate-500')}>Latitude</span>
                                    <span className={cn('font-mono text-sm', dark ? 'text-white/80' : 'text-slate-800')}>{log.checkInLat.toFixed(6)}</span>
                                </div>
                                <div className={cn('flex justify-between items-center py-2 border-b', dark ? 'border-white/5' : 'border-slate-50')}>
                                    <span className={cn('text-xs', dark ? 'text-white/40' : 'text-slate-500')}>Longitude</span>
                                    <span className={cn('font-mono text-sm', dark ? 'text-white/80' : 'text-slate-800')}>{log.checkInLng.toFixed(6)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className={cn('text-xs', dark ? 'text-white/40' : 'text-slate-500')}>{t('admin.logDetail.time')}</span>
                                    <span className="text-sm font-medium text-emerald-700">{formatTime(log.checkInTime)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className={cn('flex items-center gap-2 text-sm', dark ? 'text-white/30' : 'text-slate-400')}>
                                <AlertCircle className="w-4 h-4" /> {t('admin.logDetail.noGpsData')}
                            </div>
                        )}
                    </div>

                    {/* Check-out GPS */}
                    <div className={cn('rounded-xl border p-5', dark ? 'bg-white/[0.06] border-white/10 shadow-none' : 'bg-white border-slate-200 shadow-sm')}>
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                            <h3 className={cn('text-sm font-semibold', dark ? 'text-white/70' : 'text-slate-700')}>{t('admin.logDetail.gpsCheckOut')}</h3>
                        </div>
                        {log.checkOutLat != null && log.checkOutLng != null ? (
                            <div className="space-y-2">
                                <div className={cn('flex justify-between items-center py-2 border-b', dark ? 'border-white/5' : 'border-slate-50')}>
                                    <span className={cn('text-xs', dark ? 'text-white/40' : 'text-slate-500')}>Latitude</span>
                                    <span className={cn('font-mono text-sm', dark ? 'text-white/80' : 'text-slate-800')}>{log.checkOutLat.toFixed(6)}</span>
                                </div>
                                <div className={cn('flex justify-between items-center py-2 border-b', dark ? 'border-white/5' : 'border-slate-50')}>
                                    <span className={cn('text-xs', dark ? 'text-white/40' : 'text-slate-500')}>Longitude</span>
                                    <span className={cn('font-mono text-sm', dark ? 'text-white/80' : 'text-slate-800')}>{log.checkOutLng.toFixed(6)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className={cn('text-xs', dark ? 'text-white/40' : 'text-slate-500')}>{t('admin.logDetail.time')}</span>
                                    <span className={cn('text-sm font-medium', dark ? 'text-white/70' : 'text-slate-700')}>{formatTime(log.checkOutTime)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className={cn('flex items-center gap-2 text-sm', dark ? 'text-white/30' : 'text-slate-400')}>
                                <AlertCircle className="w-4 h-4" />
                                {log.checkOutTime ? t('admin.logDetail.noGpsData') : t('admin.logDetail.notCheckedOutYet')}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
