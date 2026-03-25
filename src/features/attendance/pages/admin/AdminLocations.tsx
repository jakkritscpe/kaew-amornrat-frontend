import { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { useAttendance } from '../../contexts/useAttendance';
import type { WorkLocation } from '../../types';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import {
    Plus, X, Search, MapPin, Map as MapIcon, Navigation, Loader2, Crosshair, Pencil, Trash2, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';
import { useAdminTheme } from '@/hooks/useAdminTheme';

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
    const { t } = useTranslation();
    const { dark } = useAdminTheme();
    const { locations, addLocation, updateLocation, removeLocation } = useAttendance();

    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editTarget, setEditTarget] = useState<WorkLocation | null>(null);
    const [form, setForm] = useState({ name: '', lat: 13.7563, lng: 100.5018, radiusMeters: 300 });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<WorkLocation | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const statRef = useRef<HTMLDivElement>(null);

    const filtered = locations.filter(l =>
        l.name.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // ── Handlers ─────────────────────────────────────────────────────────────

    const openModal = useCallback((loc?: WorkLocation) => {
        if (loc) {
            setEditTarget(loc);
            setForm({ name: loc.name, lat: loc.lat, lng: loc.lng, radiusMeters: loc.radiusMeters });
        } else {
            setEditTarget(null);
            setForm({ name: '', lat: 13.7563, lng: 100.5018, radiusMeters: 300 });
        }
        setShowModal(true);
    }, []);

    const closeModal = useCallback(() => {
        setShowModal(false);
        setEditTarget(null);
    }, []);

    const handlePositionChange = useCallback((lat: number, lng: number) => {
        setForm(f => ({ ...f, lat, lng }));
    }, []);

    const handleGetCurrentLocation = useCallback(() => {
        if (!navigator.geolocation) {
            toast.error(t('admin.locations.gpsNotSupported'));
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
                toast.error(t('admin.locations.gpsAccessDenied'));
                setGettingLocation(false);
            },
            { enableHighAccuracy: true, timeout: 10000 },
        );
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
        try {
            setIsSubmitting(true);
            if (editTarget) {
                await updateLocation(editTarget.id, { ...form });
                toast.success(t('admin.locations.editSuccess', { name: form.name }));
            } else {
                await addLocation({ ...form });
                toast.success(t('admin.locations.addSuccess', { name: form.name }));
            }
            closeModal();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t('common.genericError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget || isDeleting) return;
        setIsDeleting(true);
        try {
            await removeLocation(deleteTarget.id);
            toast.success(t('admin.locations.deleteSuccess', { name: deleteTarget.name }));
            setDeleteTarget(null);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t('common.genericError'));
        } finally {
            setIsDeleting(false);
        }
    };

    // Escape to close + body scroll lock
    useEffect(() => {
        if (!showModal) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isSubmitting) closeModal(); };
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [showModal, isSubmitting, closeModal]);

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
                    <h1 className={cn('text-2xl font-bold tracking-tight', dark ? 'text-white' : 'text-[#1d1d1d]')}>{t('admin.locations.title')}</h1>
                    <p className={cn('text-sm mt-1', dark ? 'text-white/50' : 'text-[#6f6f6f]')}>{t('admin.locations.subtitle')}</p>
                </div>
                <Button
                    data-tour="add-location"
                    onClick={() => openModal()}
                    className="w-full sm:w-auto bg-gradient-to-r from-[#044F88] to-[#00223A] hover:from-[#00223A] hover:to-[#00223A] text-white shadow-sm hover:shadow-md transition-all h-10 rounded-lg shrink-0"
                >
                    <Plus className="w-4 h-4 mr-2" /> {t('admin.locations.addLocation')}
                </Button>
            </div>

            {/* ── Summary stat ── */}
            <div className="dashboard-section grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ perspective: '1000px' }}>
                <div
                    ref={statRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                    className={cn(
                        'relative rounded-2xl p-6 border',
                        dark ? 'bg-white/[0.06] border-white/10 shadow-none' : 'bg-white shadow-sm border-gray-100',
                        dark ? 'hover:shadow-none' : 'hover:shadow-xl hover:shadow-gray-200/50',
                        'transition-shadow duration-300 cursor-pointer overflow-hidden group',
                    )}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    <div className={cn('absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none', dark && 'hidden')} />
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className={cn('text-sm mb-1', dark ? 'text-white/50' : 'text-[#6f6f6f]')}>{t('admin.locations.totalLocations')}</p>
                            <span className={cn('text-3xl font-bold tabular-nums', dark ? 'text-white' : 'text-[#1d1d1d]')}>{locations.length}</span>
                            <p className={cn('text-sm mt-1', dark ? 'text-white/30' : 'text-gray-400')}>{t('common.point')}</p>
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
                <div data-tour="location-list" className={cn('dashboard-section rounded-2xl border flex flex-col overflow-hidden col-span-1 h-[400px] lg:h-auto order-2 lg:order-1 relative', dark ? 'bg-white/[0.06] border-white/10 shadow-none' : 'bg-white shadow-sm border-gray-100')}>
                    <div className={cn('p-5 border-b flex-shrink-0 z-10', dark ? 'border-white/10 bg-white/[0.03]' : 'border-gray-100 bg-white')}>
                        <div className="relative w-full group focus-within:ring-4 focus-within:ring-[#044F88]/20 rounded-lg transition-all">
                            <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none group-focus-within:text-[#044F88] transition-colors', dark ? 'text-white/30' : 'text-gray-400')} />
                            <Input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder={t('admin.locations.searchPlaceholder')}
                                className={cn('pl-9 focus:border-[#044F88] focus-visible:ring-0 transition-all rounded-lg h-10', dark ? 'bg-white/[0.06] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200')}
                                autoComplete="off"
                                spellCheck={false}
                            />
                        </div>
                    </div>

                    <div className={cn('overflow-y-auto flex-1 p-3 space-y-2', dark ? 'bg-white/[0.02]' : 'bg-gray-50/30')}>
                        {filtered.map(loc => (
                            <div key={loc.id} className={cn('loc-card p-4 rounded-xl transition-colors duration-300 border group', dark ? 'bg-white/[0.06] border-white/10 hover:bg-[#044F88]/10 hover:border-[#044F88]/20 shadow-none' : 'bg-white hover:bg-[#044F88]/5 border-gray-100 hover:border-[#044F88]/20 shadow-sm')}>
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#044F88]/5 flex items-center justify-center shrink-0 group-hover:bg-[#044F88] transition-colors duration-300">
                                        <MapPin className="w-5 h-5 text-[#044F88] group-hover:text-white transition-colors duration-300" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className={cn('font-bold text-sm leading-tight', dark ? 'text-white' : 'text-[#1d1d1d]')}>{loc.name}</p>
                                        <div className={cn('mt-2 flex flex-wrap gap-2 text-[10px] font-mono', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>
                                            <span className={cn('px-2 py-0.5 rounded-md', dark ? 'bg-white/[0.06]' : 'bg-gray-100')}>Lat: {loc.lat}</span>
                                            <span className={cn('px-2 py-0.5 rounded-md', dark ? 'bg-white/[0.06]' : 'bg-gray-100')}>Lng: {loc.lng}</span>
                                        </div>
                                        <div className="mt-2.5 inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 tracking-wide uppercase">
                                            {t('admin.locations.radius')} {loc.radiusMeters} {t('admin.locations.meters')}
                                        </div>
                                    </div>
                                    {/* Edit / Delete buttons */}
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                        <button
                                            type="button"
                                            onClick={() => openModal(loc)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#044F88] hover:bg-[#044F88]/10 transition-colors"
                                            aria-label={t('admin.locations.editLabel')}
                                        >
                                            <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteTarget(loc)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            aria-label={t('admin.locations.deleteLabel')}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div className={cn('py-16 text-center text-sm flex flex-col items-center', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>
                                <MapPin className={cn('w-10 h-10 mb-3', dark ? 'text-white/10' : 'text-gray-200')} />
                                {t('admin.locations.notFound')}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: Overview map */}
                <div data-tour="location-map" className={cn('dashboard-section rounded-2xl border overflow-hidden lg:col-span-2 relative z-0 h-[300px] sm:h-[400px] lg:h-auto order-1 lg:order-2 p-1.5', dark ? 'bg-white/[0.06] border-white/10 shadow-none' : 'bg-white shadow-sm border-gray-100')}>
                    <div className={cn('w-full h-full rounded-xl overflow-hidden border relative', dark ? 'border-white/10' : 'border-gray-100')}>
                        <div className={cn('absolute inset-0 animate-pulse -z-10', dark ? 'bg-white/[0.03]' : 'bg-gray-100')} />
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
                                                <span className="text-xs text-[#6f6f6f]">{t('admin.locations.radius')} {loc.radiusMeters} {t('admin.locations.meters')}</span>
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
            {/* ════ Delete Confirm Dialog ════ */}
            {deleteTarget && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4" onClick={() => !isDeleting && setDeleteTarget(null)}>
                    <div className={cn('rounded-2xl shadow-2xl w-full max-w-sm p-6', dark ? 'bg-[#1e293b]' : 'bg-white')} onClick={e => e.stopPropagation()}>
                        <div className="flex items-start gap-3 mb-5">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <p className={cn('font-bold', dark ? 'text-white' : 'text-[#1d1d1d]')}>{t('admin.locations.deleteConfirmTitle')}</p>
                                <p className={cn('text-sm mt-1', dark ? 'text-white/50' : 'text-[#6f6f6f]')}>
                                    {t('admin.locations.deleteConfirmDesc', { name: deleteTarget.name })}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setDeleteTarget(null)} disabled={isDeleting}
                                className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-[#6f6f6f] hover:bg-gray-50 transition-colors disabled:opacity-50">
                                {t('common.cancel')}
                            </button>
                            <button onClick={handleDelete} disabled={isDeleting}
                                className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {isDeleting ? t('common.deleting') : t('admin.locations.deleteBtn')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {typeof document !== 'undefined' && showModal && createPortal(
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={t('admin.locations.addTitle')}
                    className="fixed inset-0 z-[2000] flex items-center justify-center bg-gray-900/70 backdrop-blur-sm p-3 sm:p-6"
                    onClick={closeModal}
                >
                    <div
                        className={cn('rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[92svh] overflow-hidden animate-in zoom-in-95 duration-200', dark ? 'bg-[#1e293b]' : 'bg-white')}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* ── Header ── */}
                        <div className={cn('flex items-center justify-between px-6 sm:px-8 py-5 border-b shrink-0', dark ? 'border-white/10' : 'border-gray-100')}>
                            <div>
                                <h2 className={cn('text-xl font-bold', dark ? 'text-white' : 'text-[#1d1d1d]')}>
                                    {editTarget ? t('admin.locations.editTitle') : t('admin.locations.addTitle')}
                                </h2>
                                <p className={cn('text-sm mt-0.5', dark ? 'text-white/50' : 'text-[#6f6f6f]')}>{t('admin.locations.addSubtitle')}</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={isSubmitting}
                                className={cn('w-9 h-9 rounded-full flex items-center justify-center transition-colors disabled:opacity-40', dark ? 'text-white/40 hover:bg-white/[0.06] hover:text-white/70' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700')}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* ── Body: form (left/bottom) + map (right/top) ── */}
                        <form
                            onSubmit={handleSubmit}
                            className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden"
                        >
                            {/* Map — top on mobile, right on desktop */}
                            <div className={cn('order-1 md:order-2 md:flex-1 h-[260px] sm:h-[300px] md:h-auto relative border-b md:border-b-0 md:border-l shrink-0 md:shrink', dark ? 'border-white/10' : 'border-gray-100')}>
                                {/* Hint chip */}
                                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
                                    <div className="bg-white/90 backdrop-blur-sm border border-gray-200 text-xs text-[#1d1d1d] font-medium px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5 whitespace-nowrap">
                                        <Crosshair className="w-3 h-3 text-[#044F88] shrink-0" />
                                        {t('admin.locations.clickOrDrag')}
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
                                        <label className="text-sm font-semibold block mb-2">
                                            {t('admin.locations.nameLabel')} <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                            value={form.name}
                                            onChange={e => setForm({ ...form, name: e.target.value })}
                                            required
                                            autoFocus
                                            placeholder={t('admin.locations.namePlaceholder')}
                                            className="h-11 rounded-xl border-gray-200 focus:border-[#044F88] bg-white text-[#1d1d1d]"
                                        />
                                    </div>

                                    {/* Radius slider */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-sm font-semibold text-[#1d1d1d]">
                                                {t('admin.locations.radiusLabel')} <span className="text-red-500">*</span>
                                            </label>
                                            <span className="text-sm font-bold text-[#044F88] tabular-nums bg-[#044F88]/5 px-2.5 py-0.5 rounded-lg border border-[#044F88]/10">
                                                {form.radiusMeters} {t('admin.locations.meters')}
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
                                            <span>50 {t('admin.locations.meters')}</span>
                                            <span>2,000 {t('admin.locations.meters')}</span>
                                        </div>
                                        <p className="text-xs text-[#00223A] bg-[#044F88]/5 border border-[#044F88]/10 px-3 py-2 rounded-xl mt-3 font-medium leading-relaxed">
                                            💡 {t('admin.locations.radiusHint')}
                                        </p>
                                    </div>

                                    {/* Coordinates — synced with map picker */}
                                    <div>
                                        <label className="text-sm font-semibold block mb-2">
                                            {t('admin.locations.gpsCoords')}
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
                                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('admin.locations.findingLocation')}</>
                                            : <><Navigation className="w-4 h-4 mr-2 text-[#044F88]" /> {t('admin.locations.useCurrentLocation')}</>
                                        }
                                    </Button>
                                </div>

                                {/* Footer buttons */}
                                <div className={cn('px-6 pb-6 pt-3 border-t flex gap-3 shrink-0', dark ? 'border-white/10' : 'border-gray-100')}>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={closeModal}
                                        disabled={isSubmitting}
                                        className="flex-1 rounded-xl h-11 border-gray-200 text-[#1d1d1d] hover:bg-gray-50 font-semibold text-sm disabled:opacity-50"
                                    >
                                        {t('common.cancel')}
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting || !form.name.trim()}
                                        className="flex-1 rounded-xl h-11 bg-gradient-to-r from-[#044F88] to-[#00223A] hover:from-[#00223A] hover:to-[#00223A] text-white shadow-sm font-semibold text-sm disabled:opacity-60"
                                    >
                                        {isSubmitting
                                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('common.saving')}</>
                                            : editTarget
                                                ? <><Pencil className="w-4 h-4 mr-2" /> {t('admin.locations.saveEdit')}</>
                                                : <><MapPin className="w-4 h-4 mr-2" /> {t('admin.locations.saveLocation')}</>
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
