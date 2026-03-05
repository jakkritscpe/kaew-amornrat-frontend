import { useState, useRef, useEffect } from 'react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus, X, Search, MapPin, Map as MapIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

// Fix Leaflet Default Icon issue in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export function AdminLocations() {
    const { locations, addLocation } = useAttendance();
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [form, setForm] = useState({ name: '', lat: 13.7563, lng: 100.5018, radiusMeters: 500 });

    const containerRef = useRef<HTMLDivElement>(null);

    const filtered = locations.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        addLocation({ ...form });
        setShowAddModal(false);
        setForm({ name: '', lat: 13.7563, lng: 100.5018, radiusMeters: 500 });
    };

    // ── GSAP Animations ──
    useEffect(() => {
        const ctx = gsap.context(() => {
            // Header animation
            gsap.fromTo('.page-header',
                { y: -20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
            );

            // Container entrance
            gsap.fromTo('.dashboard-section',
                { y: 30, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out',
                    scrollTrigger: { trigger: containerRef.current, start: 'top 80%', toggleActions: 'play none none none' },
                }
            );

            // Location card stagger
            gsap.fromTo('.loc-card',
                { x: -20, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.3 }
            );
        });
        return () => ctx.revert();
    }, [filtered.length]);

    // Simple stat card hover effect
    const statRef = useRef<HTMLDivElement>(null);
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        gsap.to(card, {
            rotateX: (y - rect.height / 2) / 10,
            rotateY: (rect.width / 2 - x) / 10,
            transformPerspective: 1000,
            duration: 0.3,
            ease: 'power2.out'
        });
    };
    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        gsap.to(e.currentTarget, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power2.out' });
    };

    return (
        <div ref={containerRef} className="space-y-6 pb-12">
            {/* ── Page header ── */}
            <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1d1d1d] tracking-tight">จัดการสถานที่ทำงาน</h1>
                    <p className="text-sm text-[#6f6f6f] mt-1">กำหนดพิกัด GPS และขอบเขตพื้นที่สำหรับการลงเวลา</p>
                </div>
                <Button onClick={() => setShowAddModal(true)} className="w-full sm:w-auto bg-gradient-to-r from-[#2075f8] to-[#1a64d4] hover:from-[#1a64d4] hover:to-[#1655b5] text-white shadow-sm hover:shadow-md transition-all h-10 rounded-lg shrink-0">
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่มสถานที่
                </Button>
            </div>

            {/* ── Summary Stat ── */}
            <div className="dashboard-section grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ perspective: '1000px' }}>
                <div
                    ref={statRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className={cn(
                        'relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100',
                        'hover:shadow-xl hover:shadow-gray-200/50 transition-shadow duration-300',
                        'cursor-pointer overflow-hidden group'
                    )}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-sm text-[#6f6f6f] mb-1">สถานที่ทั้งหมด</p>
                            <span className="text-3xl font-bold text-[#1d1d1d] tabular-nums">
                                {locations.length}
                            </span>
                            <p className="text-sm text-gray-400 mt-1">จุด</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-indigo-500 to-blue-500 group-hover:scale-110 transition-transform duration-500">
                            <MapIcon className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Content Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[600px]">

                {/* ── Left: Location List ── */}
                <div className="dashboard-section bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden col-span-1 h-[400px] lg:h-auto order-2 lg:order-1 relative">
                    <div className="p-5 border-b border-gray-100 flex-shrink-0 bg-white z-10">
                        <div className="relative w-full group focus-within:ring-4 focus-within:ring-[#2075f8]/20 rounded-lg transition-all">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-focus-within:text-[#2075f8] transition-colors" />
                            <Input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="ค้นหาสถานที่..."
                                className="pl-9 bg-white border-gray-200 focus:border-[#2075f8] focus-visible:ring-0 transition-all rounded-lg h-10"
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 p-3 space-y-2 bg-gray-50/30">
                        {filtered.map(loc => (
                            <div key={loc.id} className="loc-card p-4 rounded-xl bg-white hover:bg-[#e8f1fe]/30 cursor-pointer transition-colors duration-300 border border-gray-100 hover:border-blue-200 shadow-sm group">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-50/80 flex items-center justify-center shrink-0 group-hover:bg-[#2075f8] transition-colors duration-300">
                                        <MapPin className="w-5 h-5 text-[#2075f8] group-hover:text-white transition-colors duration-300" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-[#1d1d1d] text-sm leading-tight group-hover:text-[#2075f8] transition-colors">{loc.name}</p>
                                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-mono text-[#6f6f6f]">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded-md">Lat: {loc.lat}</span>
                                            <span className="bg-gray-100 px-2 py-0.5 rounded-md">Lng: {loc.lng}</span>
                                        </div>
                                        <div className="mt-2.5 inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 tracking-wide uppercase">
                                            รัศมี {loc.radiusMeters} เมตร
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div className="py-16 text-center text-[#6f6f6f] text-sm flex flex-col items-center">
                                <MapPin className="w-10 h-10 text-gray-200 mb-3" />
                                ไม่พบสถานที่ที่ค้นหา
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Right: Map ── */}
                <div className="dashboard-section bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2 relative z-0 h-[300px] sm:h-[400px] lg:h-auto order-1 lg:order-2 p-1.5">
                    <div className="w-full h-full rounded-xl overflow-hidden border border-gray-100 relative">
                        {/* Shimmer loading placeholder for map */}
                        <div className="absolute inset-0 bg-gray-100 animate-pulse -z-10" />

                        <MapContainer
                            center={[13.78, 100.52]}
                            zoom={11}
                            style={{ height: '100%', width: '100%', zIndex: 1 }}
                        >
                            <TileLayer
                                attribution='&copy; OpenStreetMap'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {locations.map(loc => (
                                <div key={loc.id}>
                                    <Marker position={[loc.lat, loc.lng]}>
                                        <Popup className="rounded-xl overflow-hidden">
                                            <div className="text-center font-sans">
                                                <b className="text-[#1d1d1d] text-sm block mb-1">{loc.name}</b>
                                                <span className="text-xs text-[#6f6f6f]">รัศมี {loc.radiusMeters} เมตร</span>
                                            </div>
                                        </Popup>
                                    </Marker>
                                    <Circle
                                        center={[loc.lat, loc.lng]}
                                        radius={loc.radiusMeters}
                                        pathOptions={{ color: '#2075f8', fillColor: '#2075f8', fillOpacity: 0.15, weight: 2 }}
                                    />
                                </div>
                            ))}
                        </MapContainer>
                    </div>
                </div>
            </div>

            {/* ════ Modal เพิ่มสถานที่ ════ */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100">
                            <div>
                                <h2 className="text-xl font-bold text-[#1d1d1d]">เพิ่มสถานที่ใหม่</h2>
                                <p className="text-sm text-[#6f6f6f] mt-1">กำหนดจุดลงเวลาทำงานแห่งใหม่</p>
                            </div>
                            <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreate} className="p-6 space-y-5 bg-gray-50/30">
                            <div>
                                <label className="text-sm font-semibold text-[#1d1d1d] block mb-2">ชื่อสถานที่ <span className="text-red-500">*</span></label>
                                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="เช่น สำนักงานใหญ่" className="h-11 rounded-xl border-gray-200 focus:border-[#2075f8] bg-white text-[#1d1d1d]" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-semibold text-[#1d1d1d] block mb-2">ละติจูด <span className="text-red-500">*</span></label>
                                    <Input type="number" step="any" value={form.lat} onChange={e => setForm({ ...form, lat: parseFloat(e.target.value) })} required className="h-11 rounded-xl border-gray-200 focus:border-[#2075f8] bg-white text-[#1d1d1d] tabular-nums" />
                                </div>
                                <div>
                                    <label className="text-sm font-semibold text-[#1d1d1d] block mb-2">ลองจิจูด <span className="text-red-500">*</span></label>
                                    <Input type="number" step="any" value={form.lng} onChange={e => setForm({ ...form, lng: parseFloat(e.target.value) })} required className="h-11 rounded-xl border-gray-200 focus:border-[#2075f8] bg-white text-[#1d1d1d] tabular-nums" />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-[#1d1d1d] block mb-2">รัศมีขอบเขต (เมตร) <span className="text-red-500">*</span></label>
                                <Input type="number" value={form.radiusMeters} onChange={e => setForm({ ...form, radiusMeters: parseInt(e.target.value, 10) })} required className="h-11 rounded-xl border-gray-200 focus:border-[#2075f8] bg-white text-[#1d1d1d] tabular-nums" />
                                <p className="text-xs text-[#6f6f6f] mt-2 bg-blue-50 text-blue-700 p-2 rounded-lg font-medium">💡 แนะนำ: 200 - 500 เมตร เพื่อรองรับความคลาดเคลื่อนของ GPS</p>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-100">
                                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="rounded-xl h-11 px-6 border-gray-200 text-[#1d1d1d] hover:bg-gray-50 font-semibold text-sm">ยกเลิก</Button>
                                <Button type="submit" className="rounded-xl h-11 px-8 bg-gradient-to-r from-[#2075f8] to-[#1a64d4] hover:from-[#1a64d4] hover:to-[#1655b5] text-white shadow-sm font-semibold text-sm">บันทึกสถานที่</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
