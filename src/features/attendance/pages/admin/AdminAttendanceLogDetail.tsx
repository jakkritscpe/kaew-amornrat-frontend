import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAttendance } from '../../contexts/AttendanceContext';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import {
    ArrowLeft, Clock, MapPin, User, Calendar,
    Timer, TrendingUp, AlertCircle, CheckCircle2, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatTime, formatDate } from '@/lib/utils';

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

const STATUS_CONFIG = {
    present: { label: 'มาทำงาน', bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-600/20', dot: 'bg-emerald-500' },
    late:    { label: 'มาสาย',   bg: 'bg-orange-100',  text: 'text-orange-700',  ring: 'ring-orange-600/20',  dot: 'bg-orange-500'  },
    absent:  { label: 'ขาดงาน',  bg: 'bg-red-100',     text: 'text-red-700',     ring: 'ring-red-600/20',     dot: 'bg-red-500'     },
    on_leave:{ label: 'ลางาน',   bg: 'bg-blue-100',    text: 'text-blue-700',    ring: 'ring-blue-600/20',    dot: 'bg-blue-500'    },
} as const;

export function AdminAttendanceLogDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { logs, employees, locations } = useAttendance();

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
            <div className="p-6 bg-slate-50 min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-slate-400" />
                </div>
                <div className="text-center">
                    <p className="text-lg font-semibold text-slate-700">ไม่พบข้อมูลการลงเวลา</p>
                    <p className="text-sm text-slate-400 mt-1">รหัสบันทึก: {id}</p>
                </div>
                <Button variant="outline" onClick={() => navigate('/admin/attendance/logs')}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> กลับไปรายการ
                </Button>
            </div>
        );
    }

    const status = STATUS_CONFIG[log.status] ?? STATUS_CONFIG.absent;
    const lateMinutes = (log.status === 'late' && log.checkInTime && emp?.shiftStartTime)
        ? calcLateMinutes(log.checkInTime, emp.shiftStartTime)
        : 0;

    // Initials for avatar placeholder
    const initials = emp?.name
        ? emp.name.trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase()
        : '??';

    return (
        <div className="bg-slate-50 min-h-[calc(100vh-4rem)]">

            {/* ── Top nav bar ────────────────────────────────────────────── */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors rounded-md px-2 py-1 -ml-2 hover:bg-slate-100"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        ประวัติการลงเวลา
                    </button>
                    <span className="text-slate-300">/</span>
                    <span className="text-sm text-slate-700 font-medium truncate">{emp?.name ?? '—'}</span>
                    <span className="text-slate-300 hidden sm:inline">/</span>
                    <span className="text-sm text-slate-500 hidden sm:inline">{formatDate(log.date)}</span>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">

                {/* ── Hero card ──────────────────────────────────────────── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        {/* Avatar + employee info */}
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm select-none">
                                {emp?.avatarUrl
                                    ? <img src={emp.avatarUrl} alt={emp.name} className="w-full h-full rounded-full object-cover" />
                                    : initials
                                }
                            </div>
                            <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <h1 className="text-xl font-bold text-slate-900 leading-tight">
                                        {emp?.name ?? 'ไม่ทราบชื่อ'}
                                    </h1>
                                    {emp?.nickname && (
                                        <span className="text-slate-400 font-normal text-base">({emp.nickname})</span>
                                    )}
                                </div>
                                <p className="text-sm text-slate-500 mt-0.5">
                                    {emp?.department ?? '—'}
                                    {emp?.position && <span className="text-slate-400"> · {emp.position}</span>}
                                </p>
                            </div>
                        </div>

                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold ring-1 ring-inset self-start shrink-0 ${status.bg} ${status.text} ${status.ring}`}>
                            <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                            {status.label}
                        </span>
                    </div>

                    {/* Date + location row */}
                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="font-medium">{formatFullDate(log.date)}</span>
                        </div>
                        {loc && (
                            <div className="flex items-center gap-2 sm:ml-4">
                                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>{loc.name}</span>
                            </div>
                        )}
                        {emp && (
                            <div className="flex items-center gap-2 sm:ml-4">
                                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                <span>กะ {emp.shiftStartTime} – {emp.shiftEndTime}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Stats row ──────────────────────────────────────────── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Check-in */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-emerald-600" />
                            </div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">เข้างาน</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatTime(log.checkInTime)}</p>
                        {log.status === 'late' && lateMinutes > 0 ? (
                            <p className="text-xs text-orange-600 font-medium mt-1 flex items-center gap-1">
                                <Timer className="w-3 h-3" /> สาย {lateMinutes} นาที
                            </p>
                        ) : log.checkInTime ? (
                            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> ตรงเวลา
                            </p>
                        ) : (
                            <p className="text-xs text-slate-400 mt-1">ไม่มีข้อมูล</p>
                        )}
                    </div>

                    {/* Check-out */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                <Clock className="w-4 h-4 text-slate-500" />
                            </div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ออกงาน</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 tabular-nums">{formatTime(log.checkOutTime)}</p>
                        {!log.checkOutTime && (
                            <p className="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
                                <Info className="w-3 h-3" /> ยังไม่ออกงาน
                            </p>
                        )}
                    </div>

                    {/* Work hours */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <User className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">ชั่วโมงงาน</span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900 tabular-nums">
                            {log.workHours > 0 ? log.workHours.toFixed(2) : '—'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">ชั่วโมง</p>
                    </div>

                    {/* OT */}
                    <div className={`bg-white rounded-xl border shadow-sm p-4 sm:p-5 ${log.otHours > 0 ? 'border-purple-200 bg-purple-50/30' : 'border-slate-200'}`}>
                        <div className="flex items-center gap-2 mb-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${log.otHours > 0 ? 'bg-purple-100' : 'bg-slate-100'}`}>
                                <TrendingUp className={`w-4 h-4 ${log.otHours > 0 ? 'text-purple-600' : 'text-slate-400'}`} />
                            </div>
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">โอที</span>
                        </div>
                        <p className={`text-2xl font-bold tabular-nums ${log.otHours > 0 ? 'text-purple-700' : 'text-slate-400'}`}>
                            {log.otHours > 0 ? `+${log.otHours.toFixed(2)}` : '—'}
                        </p>
                        <p className="text-xs text-slate-400 mt-1">{log.otHours > 0 ? 'ชั่วโมง OT' : 'ไม่มี OT'}</p>
                    </div>
                </div>

                {/* ── Map section ────────────────────────────────────────── */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-slate-800">แผนที่การเข้า-ออกงาน</h2>
                            <p className="text-xs text-slate-400 mt-0.5">แสดงตำแหน่ง GPS ที่บันทึกขณะ Check-in และ Check-out</p>
                        </div>
                        {/* Legend */}
                        <div className="hidden sm:flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-sm" />
                                เข้างาน
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-3 rounded-full bg-red-500 inline-block shadow-sm" />
                                ออกงาน
                            </span>
                            {loc && (
                                <span className="flex items-center gap-1.5">
                                    <span className="w-4 h-3 rounded border-2 border-dashed border-blue-400 bg-blue-50 inline-block" />
                                    Geofence
                                </span>
                            )}
                        </div>
                    </div>

                    {mapPositions.length === 0 ? (
                        <div className="h-[360px] flex flex-col items-center justify-center gap-3 bg-slate-50">
                            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center">
                                <MapPin className="w-7 h-7 text-slate-300" />
                            </div>
                            <div className="text-center">
                                <p className="text-slate-500 font-medium text-sm">ไม่มีข้อมูล GPS</p>
                                <p className="text-xs text-slate-400 mt-1">ไม่พบพิกัดการเข้า-ออกงาน</p>
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
                                            color: '#3b82f6',
                                            fillColor: '#3b82f6',
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
                                                <p className="font-semibold text-emerald-700">เข้างาน</p>
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
                                                <p className="font-semibold text-red-600">ออกงาน</p>
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
                    <div className="sm:hidden px-5 py-3 border-t border-slate-100 flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" /> เข้างาน
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> ออกงาน
                        </span>
                        {loc && (
                            <span className="flex items-center gap-1.5">
                                <span className="w-4 h-3 rounded border-2 border-dashed border-blue-400 bg-blue-50 inline-block" /> Geofence
                            </span>
                        )}
                    </div>
                </div>

                {/* ── GPS detail cards ───────────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Check-in GPS */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-3 h-3 rounded-full bg-emerald-500 shrink-0" />
                            <h3 className="text-sm font-semibold text-slate-700">ข้อมูล GPS: เข้างาน</h3>
                        </div>
                        {log.checkInLat != null && log.checkInLng != null ? (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                    <span className="text-xs text-slate-500">Latitude</span>
                                    <span className="font-mono text-sm text-slate-800">{log.checkInLat.toFixed(6)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                    <span className="text-xs text-slate-500">Longitude</span>
                                    <span className="font-mono text-sm text-slate-800">{log.checkInLng.toFixed(6)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-xs text-slate-500">เวลา</span>
                                    <span className="text-sm font-medium text-emerald-700">{formatTime(log.checkInTime)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <AlertCircle className="w-4 h-4" /> ไม่มีข้อมูล GPS
                            </div>
                        )}
                    </div>

                    {/* Check-out GPS */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                        <div className="flex items-center gap-2 mb-4">
                            <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                            <h3 className="text-sm font-semibold text-slate-700">ข้อมูล GPS: ออกงาน</h3>
                        </div>
                        {log.checkOutLat != null && log.checkOutLng != null ? (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                    <span className="text-xs text-slate-500">Latitude</span>
                                    <span className="font-mono text-sm text-slate-800">{log.checkOutLat.toFixed(6)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                                    <span className="text-xs text-slate-500">Longitude</span>
                                    <span className="font-mono text-sm text-slate-800">{log.checkOutLng.toFixed(6)}</span>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-xs text-slate-500">เวลา</span>
                                    <span className="text-sm font-medium text-slate-700">{formatTime(log.checkOutTime)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-slate-400">
                                <AlertCircle className="w-4 h-4" />
                                {log.checkOutTime ? 'ไม่มีข้อมูล GPS' : 'ยังไม่ได้ออกงาน'}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
