import { useState, useEffect } from 'react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Loader2 } from 'lucide-react';
import L from 'leaflet';

// Fix typical missing markers in leaflet in React
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const userIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

export function EmployeeMap() {
    const { locations } = useAttendance();
    const [currentLoc, setCurrentLoc] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setCurrentLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.error(err),
            { enableHighAccuracy: true }
        );
    }, []);

    if (!currentLoc) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px]">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <p className="text-gray-500 text-sm">กำลังเปิดแผนที่และหาพิกัดของคุณ...</p>
            </div>
        );
    }

    // Use the first location as center if user is far, or use user loc
    const mapCenter = [currentLoc.lat, currentLoc.lng] as [number, number];

    return (
        <div className="flex flex-col h-full">
            <div className="p-4 bg-white border-b border-gray-100 shrink-0">
                <h2 className="text-lg font-bold text-gray-900">แผนที่การทำงาน</h2>
                <p className="text-xs text-gray-500">แสดงตำแหน่งของคุณและพื้นที่ที่กำหนด (Geofence)</p>
            </div>

            <div className="flex-1 relative z-0">
                <MapContainer
                    center={mapCenter}
                    zoom={15}
                    style={{ height: '100%', width: '100%', zIndex: 0 }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* User Location */}
                    <Marker position={[currentLoc.lat, currentLoc.lng]} icon={userIcon}>
                        <Popup>
                            <b>ตำแหน่ง ปัจจุบันของคุณ</b>
                        </Popup>
                    </Marker>

                    {/* Work Locations & Geofence Circles */}
                    {locations.map(loc => (
                        <div key={loc.id}>
                            <Marker position={[loc.lat, loc.lng]}>
                                <Popup>
                                    <b>{loc.name}</b><br />รัศมี {loc.radiusMeters} เมตร
                                </Popup>
                            </Marker>
                            <Circle
                                center={[loc.lat, loc.lng]}
                                radius={loc.radiusMeters}
                                pathOptions={{ color: 'blue', fillColor: 'blue', fillOpacity: 0.1, weight: 1 }}
                            />
                        </div>
                    ))}
                </MapContainer>
            </div>

            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                <div className="flex gap-4 text-xs font-medium text-gray-600 justify-center">
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span>คุณอยู่ที่นี่</div>
                    <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block"></span>ทื่ทำงาน</div>
                    <div className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full border border-blue-400 bg-blue-100 inline-block"></span>พื้นที่ที่กำหนด (Geofence)</div>
                </div>
            </div>
        </div>
    );
}
