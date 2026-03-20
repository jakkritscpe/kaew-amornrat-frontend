import { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { useAttendance } from '../../contexts/useAttendance';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import {
    Plus, X, Search, MapPin, Map as MapIcon, Navigation, Loader2, Crosshair,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

gsap.registerPlugin(ScrollTrigger);

// ── Fix Leaflet default icon broken by bundlers ──────────────────────────────
const DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Custom draggable picker marker (blue dot)
const pickerIcon = new L.DivIcon({
    className: '',
    html: `<div style="
        width:26px;height:26px;border-radius:50%;
        background:#044F88;border:4px solid white;
        box-shadow:0 0 0 3px rgba(4,79,136,0.25),0 3px 12px rgba(0,0,0,0.3);
        cursor:grab
    "></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
});

// ── Sub-components (must live outside main component for stable refs) ─────────

/** Smoothly flies to new coordinates when they change (e.g., from manual input) */
function FlyTo({ lat, lng }: { lat: number; lng: number }) {
    const map = useMap();
    const prev = useRef({ lat, lng });
    useEffect(() => {
        if (prev.current.lat !== lat || prev.current.lng !== lng) {
            map.flyTo([lat, lng], map.getZoom(), { duration: 0.5 });
            prev.current = { lat, lng };
        }
    }, [lat, lng, map]);
    return null;
}

/** Invalidates map size after mount — fixes blank tiles when map renders inside a modal */
function MapResizer() {
    const map = useMap();
    useEffect(() => {
        const id = setTimeout(() => map.invalidateSize(), 80);
        return () => clearTimeout(id);
    }, [map]);
    return null;
}

/** Interactive picker: click on map or drag marker to set lat/lng */
function LocationPicker({
    lat, lng, radius, onPositionChange,
}: {
    lat: number;
    lng: number;
    radius: number;
    onPositionChange: (lat: number, lng: number) => void;
}) {
    const markerRef = useRef<L.Marker>(null);

    useMapEvents({
        click(e) {
            onPositionChange(
                parseFloat(e.latlng.lat.toFixed(6)),
                parseFloat(e.latlng.lng.toFixed(6)),
            );
        },
    });

    return (
        <>
            <Marker
                position={[lat, lng]}
                draggable
                icon={pickerIcon}
                ref={markerRef}
                eventHandlers={{
                    dragend() {
                        const pos = markerRef.current?.getLatLng();
                        if (pos) {
                            onPositionChange(
                                parseFloat(pos.lat.toFixed(6)),
                                parseFloat(pos.lng.toFixed(6)),
                            );
                        }
                    },
                }}
            />
            <Circle
                center={[lat, lng]}
                radius={radius > 0 ? radius : 1}
                pathOptions={{
                    color: '#044F88',
                    fillColor: '#044F88',
                    fillOpacity: 0.12,
                    weight: 2,
                    dashArray: '6 4',
                    interactive: false, // pass clicks through to map
                }}
            />
        </>
    );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AdminLocations() {
    const { locations, addLocation } = useAttendance();

    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [form, setForm] = useState({ name: '', lat: 13.7563, lng: 100.5018, radiusMeters: 300 });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const statRef = useRef<HTMLDivElement>(null);

    const filtered = locations.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // ── Handlers ─────────────────────────────────────────────────────────────

    const openModal = useCallback(() => {
        setForm({ name: '', lat: 13.7563, lng: 100.5018, radiusMeters: 300 });
        setShowAddModal(true);
    }, []);

    const closeModal = useCallback(() => {
        setShowAddModal(false);
    }, []);

    const handlePositionChange = useCallback((lat: number, lng: number) => {
        setForm(f => ({ ...f, lat, lng }));
    }, []);

    const handleGetCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error('เบราว์เซอร์ไม่รองรับ GPS');
            return;
        }
        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setForm(f => ({
                    ...f,
                    lat: parseFloat(pos.coords.latitude.toFixed(6)),
                    lng: parseFloat(pos.coords.longitude.toFixed(6)),
                }));
                setGettingLocation(false);
            },
            () => {
                toast.error('ไม่สามารถเข้าถึง GPS กรุณาอนุญาตตำแหน่ง');
                setGettingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        try {
            setIsSubmitting(true);
            await addLocation({ ...form });
            toast.success(`เพิ่ม "${form.name}" สำเร็จ`);
            closeModal();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด กรุณาลองใหม่');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Escape to close + body scroll lock
    useEffect(() => {
        if (!showAddModal) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isSubmitting) closeModal(); };
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [showAddModal, isSubmitting, closeModal]);

    // ── GSAP animations ───────────────────────────────────────────────────────

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.page-header',
                { y: -20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' },
            );
            gsap.fromTo('.dashboard-section',
                { y: 30, opacity: 0 },
                {
                    y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power3.out',
                    scrollTrigger: { trigger: containerRef.current, start: 'top 80%', toggleActions: 'play none none none' },
                },
            );
            gsap.fromTo('.loc-card',
                { x: -20, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power2.out', delay: 0.3 },
            );
        });
        return () => ctx.revert();
    }, [filtered.length]);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        gsap.to(card, {
            rotateX: (e.clientY - rect.top - rect.height / 2) / 10,
            rotateY: (rect.width / 2 - (e.clientX - rect.left)) / 10,
            transformPerspective: 1000,
            duration: 0.3,
            ease: 'power2.out',
        });
    };
    const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
        gsap.to(e.currentTarget, { rotateX: 0, rotateY: 0, duration: 0.5, ease: 'power2.out' });
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <div ref={containerRef} className="space-y-6 pb-12">

            {/* ── Page header ── */}
            <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1d1d1d] tracking-tight">จัดการสถานที่ทำงาน</h1>
                    <p className="text-sm text-[#6f6f6f] mt-1">กำหนดพิกัด GPS และขอบเขตพื้นที่สำหรับการลงเวลา</p>
                </div>
                <Button
                    onClick={openModal}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#044F88] to-[#00223A] hover:from-[#00223A] hover:to-[#00223A] text-white shadow-sm hover:shadow-md transition-all h-10 rounded-lg shrink-0"
                >
                    <Plus className="w-4 h-4 mr-2" /> เพิ่มสถานที่
                </Button>
            </div>

            {/* ── Summary stat ── */}
            <div className="dashboard-section grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ perspective: '1000px' }}>
                <div
                    ref={statRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className={cn(
                        'relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100',
                        'hover:shadow-xl hover:shadow-gray-200/50 transition-shadow duration-300',
                        'cursor-pointer overflow-hidden group',
                    )}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-sm text-[#6f6f6f] mb-1">สถานที่ทั้งหมด</p>
                            <span className="text-3xl font-bold text-[#1d1d1d] tabular-nums">{locations.length}</span>
                            <p className="text-sm text-gray-400 mt-1">จุด</p>
                        </div>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-[#044F88] to-[#00223A] group-hover:scale-110 transition-transform duration-500">
                            <MapIcon className="w-6 h-6 text-white" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main content grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[600px]">

                {/* Left: Location list */}
                <div className="dashboard-section bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden col-span-1 h-[400px] lg:h-auto order-2 lg:order-1 relative">
                    <div className="p-5 border-b border-gray-100 flex-shrink-0 bg-white z-10">
                        <div className="relative w-full group focus-within:ring-4 focus-within:ring-[#044F88]/20 rounded-lg transition-all">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-focus-within:text-[#044F88] transition-colors" />
                            <Input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="ค้นหาสถานที่..."
                                className="pl-9 bg-white border-gray-200 focus:border-[#044F88] focus-visible:ring-0 transition-all rounded-lg h-10"
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 p-3 space-y-2 bg-gray-50/30">
                        {filtered.map(loc => (
                            <div key={loc.id} className="loc-card p-4 rounded-xl bg-white hover:bg-[#044F88]/30 cursor-pointer transition-colors duration-300 border border-gray-100 hover:border-[#044F88]/20 shadow-sm group">
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#044F88]/5 flex items-center justify-center shrink-0 group-hover:bg-[#044F88] transition-colors duration-300">
                                        <MapPin className="w-5 h-5 text-[#044F88] group-hover:text-white transition-colors duration-300" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-[#1d1d1d] text-sm leading-tight group-hover:text-[#044F88] transition-colors">{loc.name}</p>
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

                {/* Right: Overview map */}
                <div className="dashboard-section bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden lg:col-span-2 relative z-0 h-[300px] sm:h-[400px] lg:h-auto order-1 lg:order-2 p-1.5">
                    <div className="w-full h-full rounded-xl overflow-hidden border border-gray-100 relative">
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
                                <Fragment key={loc.id}>
                                    <Marker position={[loc.lat, loc.lng]}>
                                        <Popup>
                                            <div className="text-center font-sans">
                                                <b className="text-[#1d1d1d] text-sm block mb-1">{loc.name}</b>
                                                <span className="text-xs text-[#6f6f6f]">รัศมี {loc.radiusMeters} เมตร</span>
                                            </div>
                                        </Popup>
                                    </Marker>
                                    <Circle
                                        center={[loc.lat, loc.lng]}
                                        radius={loc.radiusMeters}
                                        pathOptions={{ color: '#044F88', fillColor: '#044F88', fillOpacity: 0.15, weight: 2 }}
                                    />
                                </Fragment>
                            ))}
                        </MapContainer>
                    </div>
                </div>
            </div>

            {/* ════ Modal เพิ่มสถานที่ — Portal to body (z-[2000] > Leaflet z-indices) ════ */}
            {typeof document !== 'undefined' && showAddModal && createPortal(
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="เพิ่มสถานที่ใหม่"
                    className="fixed inset-0 z-[2000] flex items-center justify-center bg-gray-900/70 backdrop-blur-sm p-3 sm:p-6"
                    onClick={closeModal}
                >
                    <div
                        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92svh] overflow-hidden animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* ── Header ── */}
                        <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-gray-100 shrink-0">
                            <div>
                                <h2 className="text-xl font-bold text-[#1d1d1d]">เพิ่มสถานที่ใหม่</h2>
                                <p className="text-sm text-[#6f6f6f] mt-0.5">คลิกบนแผนที่หรือลากหมุดเพื่อกำหนดพิกัด</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={isSubmitting}
                                className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors disabled:opacity-40"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* ── Body: form (left/bottom) + map (right/top) ── */}
                        <form
                            onSubmit={handleCreate}
                            className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden"
                        >
                            {/* Map — top on mobile, right on desktop */}
                            <div className="order-1 md:order-2 md:flex-1 h-[260px] sm:h-[300px] md:h-auto relative border-b md:border-b-0 md:border-l border-gray-100 shrink-0 md:shrink">
                                {/* Hint chip */}
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
                                    <div className="bg-white/90 backdrop-blur-sm border border-gray-200 text-xs text-[#1d1d1d] font-medium px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                                        <Crosshair className="w-3 h-3 text-[#044F88] shrink-0" />
                                        คลิกหรือลากหมุดเพื่อเลือกพิกัด
                                    </div>
                                </div>

                                <MapContainer
                                    center={[form.lat, form.lng]}
                                    zoom={15}
                                    style={{ height: '100%', width: '100%' }}
                                    zoomControl
                                >
                                    <TileLayer
                                        attribution='&copy; OpenStreetMap'
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                    />
                                    <MapResizer />
                                    <FlyTo lat={form.lat} lng={form.lng} />
                                    <LocationPicker
                                        lat={form.lat}
                                        lng={form.lng}
                                        radius={form.radiusMeters}
                                        onPositionChange={handlePositionChange}
                                    />
                                </MapContainer>
                            </div>

                            {/* Form fields — bottom on mobile, left on desktop */}
                            <div className="order-2 md:order-1 md:w-80 shrink-0 flex flex-col overflow-y-auto">
                                <div className="p-6 space-y-5 flex-1">

                                    {/* Name */}
                                    <div>
                                        <label className="text-sm font-semibold text-[#1d1d1d] block mb-2">
                                            ชื่อสถานที่ <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            required
                                            autoFocus
                                            placeholder="เช่น สำนักงานใหญ่"
                                            className="h-11 rounded-xl border-gray-200 focus:border-[#044F88] bg-white text-[#1d1d1d]"
                                        />
                                    </div>

                                    {/* Radius slider */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm font-semibold text-[#1d1d1d]">
                                                รัศมีขอบเขต <span className="text-red-500">*</span>
                                            </label>
                                            <span className="text-sm font-bold text-[#044F88] tabular-nums bg-[#044F88]/5 px-2.5 py-0.5 rounded-lg border border-[#044F88]/10">
                                                {form.radiusMeters} ม.
                                            </span>
                                        </div>
                                        <input
                                            type="range"
                                            min={50}
                                            max={2000}
                                            step={50}
                                            value={form.radiusMeters}
                                            onChange={e => setForm({ ...form, radiusMeters: parseInt(e.target.value, 10) })}
                                            className="w-full h-2 rounded-full accent-[#044F88] cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-medium select-none">
                                            <span>50 ม.</span>
                                            <span>2,000 ม.</span>
                                        </div>
                                        <p className="text-xs text-[#00223A] bg-[#044F88]/5 border border-[#044F88]/10 px-3 py-2 rounded-xl mt-3 font-medium leading-relaxed">
                                            💡 แนะนำ 200–500 ม. เพื่อรองรับความคลาดเคลื่อนของ GPS
                                        </p>
                                    </div>

                                    {/* Coordinates — synced with map picker */}
                                    <div>
                                        <label className="text-sm font-semibold text-[#1d1d1d] block mb-2">
                                            พิกัด GPS
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">Latitude</p>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    value={form.lat}
                                                    onChange={e => {
                                                        const v = parseFloat(e.target.value);
                                                        if (!isNaN(v)) setForm(f => ({ ...f, lat: v }));
                                                    }}
                                                    required
                                                    className="h-10 rounded-xl border-gray-200 focus:border-[#044F88] bg-white tabular-nums text-sm font-mono"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-1 font-semibold">Longitude</p>
                                                <Input
                                                    type="number"
                                                    step="any"
                                                    value={form.lng}
                                                    onChange={e => {
                                                        const v = parseFloat(e.target.value);
                                                        if (!isNaN(v)) setForm(f => ({ ...f, lng: v }));
                                                    }}
                                                    required
                                                    className="h-10 rounded-xl border-gray-200 focus:border-[#044F88] bg-white tabular-nums text-sm font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Get current location */}
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleGetCurrentLocation}
                                        disabled={gettingLocation || isSubmitting}
                                        className="w-full h-10 rounded-xl border-gray-200 text-[#1d1d1d] hover:bg-[#044F88]/5 hover:border-[#044F88]/30 hover:text-[#044F88] transition-all font-medium text-sm disabled:opacity-60"
                                    >
                                        {gettingLocation
                                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> กำลังหาตำแหน่ง...</>
                                            : <><Navigation className="w-4 h-4 mr-2 text-[#044F88]" /> ใช้ตำแหน่งปัจจุบัน</>
                                        }
                                    </Button>
                                </div>

                                {/* Footer buttons */}
                                <div className="px-6 pb-6 pt-3 border-t border-gray-100 flex gap-3 shrink-0">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={closeModal}
                                        disabled={isSubmitting}
                                        className="flex-1 rounded-xl h-11 border-gray-200 text-[#1d1d1d] hover:bg-gray-50 font-semibold text-sm disabled:opacity-50"
                                    >
                                        ยกเลิก
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || !form.name.trim()}
                                        className="flex-1 rounded-xl h-11 bg-gradient-to-r from-[#044F88] to-[#00223A] hover:from-[#00223A] hover:to-[#00223A] text-white shadow-sm font-semibold text-sm disabled:opacity-60"
                                    >
                                        {isSubmitting
                                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> กำลังบันทึก...</>
                                            : <><MapPin className="w-4 h-4 mr-2" /> บันทึกสถานที่</>
                                        }
                                    </Button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body,
            )}
        </div>
    );
}
