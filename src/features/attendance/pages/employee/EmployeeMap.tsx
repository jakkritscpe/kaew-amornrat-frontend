import { useState, useEffect } from 'react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2, AlertCircle, Navigation2, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const userIcon = new L.DivIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:50%;background:#2075f8;border:3px solid white;box-shadow:0 0 0 4px rgba(32,117,248,0.25),0 2px 8px rgba(0,0,0,0.25)"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
});

export function EmployeeMap() {
    const { locations } = useAttendance();
    const [currentLoc, setCurrentLoc] = useState<{ lat: number; lng: number } | null>(null);
    const [geoError, setGeoError] = useState<string | null>(null);

    useEffect(() => {
        if (!navigator.geolocation) { setGeoError('อุปกรณ์ไม่รองรับ GPS'); return; }
        navigator.geolocation.getCurrentPosition(
            (p) => setCurrentLoc({ lat: p.coords.latitude, lng: p.coords.longitude }),
            () => setGeoError('ไม่สามารถเข้าถึง GPS กรุณาอนุญาตตำแหน่ง'),
            { enableHighAccuracy: true }
        );
    }, []);

    if (!currentLoc && !geoError) {
        return (
            <div className="flex flex-col min-h-full bg-[#f1f5f9]">
                <div className="bg-[#2075f8] px-5 pt-3 pb-14">
                    <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest">แผนที่การทำงาน</p>
                    <h2 className="text-xl font-black text-white mt-0.5">Work Zone</h2>
                </div>
                <div className="flex-1 bg-white rounded-t-3xl -mt-6 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center gap-4 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
                        <Loader2 className="w-7 h-7 text-[#2075f8] animate-spin" />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-[#1d1d1d]">กำลังค้นหาตำแหน่ง</p>
                        <p className="text-sm text-[#6f6f6f] mt-1">โปรดรออีกสักครู่...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (geoError) {
        return (
            <div className="flex flex-col min-h-full bg-[#f1f5f9]">
                <div className="bg-[#2075f8] px-5 pt-3 pb-14">
                    <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest">แผนที่การทำงาน</p>
                    <h2 className="text-xl font-black text-white mt-0.5">Work Zone</h2>
                </div>
                <div className="flex-1 bg-white rounded-t-3xl -mt-6 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center gap-4 px-6 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
                        <AlertCircle className="w-7 h-7 text-red-500" />
                    </div>
                    <div className="text-center">
                        <p className="font-bold text-[#1d1d1d]">ไม่พบตำแหน่ง</p>
                        <p className="text-sm text-[#6f6f6f] mt-1">{geoError}</p>
                    </div>
                </div>
            </div>
        );
    }

    const center = [currentLoc!.lat, currentLoc!.lng] as [number, number];

    return (
        <div className="flex flex-col h-full bg-[#f1f5f9]">
            {/* Blue header strip */}
            <div className="bg-[#2075f8] px-5 pt-3 pb-5 shrink-0">
                <p className="text-blue-200 text-xs font-semibold uppercase tracking-widest">แผนที่การทำงาน</p>
                <div className="flex items-center justify-between mt-0.5">
                    <h2 className="text-xl font-black text-white">Work Zone</h2>
                    <div className="flex items-center gap-1.5 bg-emerald-400/25 text-emerald-100 px-2.5 py-1 rounded-full text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                        GPS พร้อม
                    </div>
                </div>
            </div>

            {/* Map */}
            <div className="flex-1 relative z-0">
                <MapContainer
                    center={center}
                    zoom={15}
                    style={{ height: '100%', width: '100%', zIndex: 0 }}
                    zoomControl={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={center} icon={userIcon}>
                        <Popup className="text-sm font-semibold">ตำแหน่งของคุณ</Popup>
                    </Marker>
                    {locations.map(loc => (
                        <div key={loc.id}>
                            <Marker position={[loc.lat, loc.lng]}>
                                <Popup>
                                    <p className="font-bold text-sm">{loc.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">รัศมี {loc.radiusMeters} ม.</p>
                                </Popup>
                            </Marker>
                            <Circle
                                center={[loc.lat, loc.lng]}
                                radius={loc.radiusMeters}
                                pathOptions={{ color: '#2075f8', fillColor: '#2075f8', fillOpacity: 0.08, weight: 2, dashArray: '6 4' }}
                            />
                        </div>
                    ))}
                </MapContainer>
            </div>

            {/* Legend bar */}
            <div className="shrink-0 bg-white border-t border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-[#6f6f6f]">
                        <span className="flex items-center gap-1.5">
                            <Navigation2 className="w-3.5 h-3.5 text-[#2075f8]" /> คุณอยู่ที่นี่
                        </span>
                        <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-gray-500" /> จุดทำงาน
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className={cn('w-4 h-4 rounded-full border-2 border-dashed border-[#2075f8] bg-blue-50 inline-block')} />
                            Geofence
                        </span>
                    </div>
                    <span className="text-[11px] font-mono text-[#6f6f6f]">
                        {currentLoc!.lat.toFixed(4)}, {currentLoc!.lng.toFixed(4)}
                    </span>
                </div>
            </div>
        </div>
    );
}
