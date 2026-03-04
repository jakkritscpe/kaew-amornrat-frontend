import { useState } from 'react';
import { useAttendance } from '../../contexts/AttendanceContext';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Plus, X, Search, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function AdminLocations() {
    const { locations, addLocation } = useAttendance();
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [form, setForm] = useState({ name: '', lat: 13.7563, lng: 100.5018, radiusMeters: 500 });

    const filtered = locations.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        addLocation({ ...form });
        setShowAddModal(false);
        setForm({ name: '', lat: 13.7563, lng: 100.5018, radiusMeters: 500 });
    };

    return (
        <div className="p-6 bg-slate-50 min-h-[calc(100vh-4rem)]">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">จัดการสถานที่ทำงาน</h1>
                    <p className="text-sm text-slate-500 mt-1">กำหนดพิกัด GPS และขอบเขตพื้นที่สำหรับการลงเวลา</p>
                </div>
                <Button onClick={() => setShowAddModal(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    เพิ่มสถานที่
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                {/* รายการสถานที่ */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden col-span-1">
                    <div className="p-4 border-b border-slate-100 flex-shrink-0">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder="ค้นหาสถานที่..."
                                className="pl-9 bg-slate-50/50"
                            />
                        </div>
                    </div>
                    <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                        {filtered.map(loc => (
                            <div key={loc.id} className="p-4 hover:bg-slate-50 cursor-pointer transition-colors">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                                        <MapPin className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900 text-sm">{loc.name}</p>
                                        <p className="text-xs text-slate-500 mt-1 font-mono">ละติจูด: {loc.lat}</p>
                                        <p className="text-xs text-slate-500 font-mono">ลองจิจูด: {loc.lng}</p>
                                        <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
                                            รัศมี: {loc.radiusMeters} เมตร
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div className="p-8 text-center text-slate-500 text-sm">ไม่พบสถานที่</div>
                        )}
                    </div>
                </div>

                {/* แผนที่ */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden col-span-2 relative z-0">
                    <MapContainer
                        center={[13.78, 100.52]}
                        zoom={11}
                        style={{ height: '100%', width: '100%' }}
                    >
                        <TileLayer
                            attribution='&copy; OpenStreetMap'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
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
                                    pathOptions={{ color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 2 }}
                                />
                            </div>
                        ))}
                    </MapContainer>
                </div>
            </div>

            {/* Modal เพิ่มสถานที่ */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-slate-900">เพิ่มสถานที่ใหม่</h2>
                            <button onClick={() => setShowAddModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1.5">ชื่อสถานที่</label>
                                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required placeholder="เช่น คลังสินค้า B" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1.5">ละติจูด</label>
                                    <Input type="number" step="any" value={form.lat} onChange={e => setForm({ ...form, lat: parseFloat(e.target.value) })} required />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 block mb-1.5">ลองจิจูด</label>
                                    <Input type="number" step="any" value={form.lng} onChange={e => setForm({ ...form, lng: parseFloat(e.target.value) })} required />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-700 block mb-1.5">รัศมีขอบเขต (เมตร)</label>
                                <Input type="number" value={form.radiusMeters} onChange={e => setForm({ ...form, radiusMeters: parseInt(e.target.value, 10) })} required />
                                <p className="text-[10px] text-slate-400 mt-1">แนะนำ: 200 - 500 เมตร เพื่อรองรับความคลาดเคลื่อนของ GPS</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
                                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>ยกเลิก</Button>
                                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">บันทึกสถานที่</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
