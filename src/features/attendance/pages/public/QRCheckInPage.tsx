import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAttendance } from '../../contexts/AttendanceContext';
import { findMatchingLocation } from '../../utils/geo';
import { MapPin, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function QRCheckInPage() {
    const { employeeId } = useParams<{ employeeId: string }>();
    const { employees, locations, logs, addLog, updateLog } = useAttendance();
    const [loading, setLoading] = useState(true);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [currentLoc, setCurrentLoc] = useState<{ lat: number; lng: number } | null>(null);
    const [result, setResult] = useState<{ success: boolean; type: 'in' | 'out'; msg: string } | null>(null);

    const employee = employees.find(e => e.id === employeeId);

    useEffect(() => {
        if (!navigator.geolocation) {
            setGeoError('เบราว์เซอร์ของคุณไม่รองรับการตรวจสอบตำแหน่ง (GPS)');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCurrentLoc({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                });
                setLoading(false);
            },
            (err) => {
                setGeoError('ไม่สามารถเข้าถึงตำแหน่งได้ กรุณาเปิดการตั้งค่า GPS ให้เบราว์เซอร์');
                setLoading(false);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }, []);

    if (!employee) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-50">
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">ไม่พบข้อมูลพนักงาน</h2>
                <p className="text-gray-500 mt-2">QR Code อาจไม่ถูกต้อง หรือพนักงานถูกลบออกจากระบบแล้ว</p>
            </div>
        );
    }

    const handleCheckIn = () => {
        if (!currentLoc) return;

        const matchedLocation = findMatchingLocation(currentLoc.lat, currentLoc.lng, locations);

        if (!matchedLocation) {
            setResult({
                success: false,
                type: 'in', // Doesn't matter
                msg: 'คุณอยู่นอกพื้นที่ที่กำหนด (Geofence) ไม่สามารถลงเวลาได้'
            });
            return;
        }

        const todayDate = new Date().toISOString().split('T')[0];
        const nowTime = new Date().toTimeString().slice(0, 5); // "HH:MM"

        // Find today's log
        const todayLog = logs.find(l => l.employeeId === employee.id && l.date === todayDate);

        if (!todayLog) {
            // Check IN
            const shiftStart = parseInt(employee.shiftStartTime.split(':')[0], 10);
            const nowHour = parseInt(nowTime.split(':')[0], 10);
            const isLate = nowHour > shiftStart;

            addLog({
                employeeId: employee.id,
                date: todayDate,
                checkInTime: nowTime,
                checkOutTime: null,
                checkInLat: currentLoc.lat,
                checkInLng: currentLoc.lng,
                checkOutLat: null,
                checkOutLng: null,
                workHours: 0,
                otHours: 0,
                status: isLate ? 'late' : 'present',
                locationId: matchedLocation.id
            });
            setResult({ success: true, type: 'in', msg: `บันทึกเวลาเข้างานเรียบร้อยเวลา ${nowTime}` });
        } else if (todayLog && !todayLog.checkOutTime) {
            // Check OUT
            updateLog(todayLog.id, {
                checkOutTime: nowTime,
                checkOutLat: currentLoc.lat,
                checkOutLng: currentLoc.lng,
                // Calculate basic work hours mock
                workHours: 8 // default
            });
            setResult({ success: true, type: 'out', msg: `บันทึกเวลาออกงานเรียบร้อยเวลา ${nowTime}` });
        } else {
            setResult({ success: false, type: 'out', msg: 'คุณลงเวลาออกงานแล้วสำหรับวันนี้' });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">กำลังค้นหาพิกัดของคุณ...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-white px-6">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 text-center relative overflow-hidden">
                {/* Decorative Top Banner */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-blue-600"></div>

                {result ? (
                    <div className="pt-4">
                        {result.success ? (
                            <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
                        ) : (
                            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                        )}
                        <h2 className={result.success ? 'text-2xl font-bold text-gray-900' : 'text-xl font-bold text-red-600'}>
                            {result.success ? (result.type === 'in' ? 'เข้างานสำเร็จ' : 'ออกงานสำเร็จ') : 'เกิดข้อผิดพลาด'}
                        </h2>
                        <p className="text-gray-500 mt-2 text-sm">{result.msg}</p>
                    </div>
                ) : (
                    <div className="pt-2">
                        <div className="w-20 h-20 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                            <span className="text-blue-600 font-bold text-2xl">{employee.name.charAt(0)}</span>
                        </div>

                        <h2 className="text-xl font-bold text-gray-900">{employee.name}</h2>
                        <p className="text-gray-500 text-sm mb-6">{employee.department} • {employee.position}</p>

                        {geoError ? (
                            <div className="bg-red-50 p-4 rounded-xl mb-6 border border-red-100">
                                <p className="text-sm text-red-600 font-medium">{geoError}</p>
                            </div>
                        ) : (
                            <div className="bg-blue-50/50 p-4 rounded-xl mb-6 flex items-center gap-3">
                                <div className="p-2 bg-white rounded-full text-blue-500 shadow-sm shrink-0">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-blue-800 font-semibold mb-0.5">พิกัด GPS ตรวจสอบแล้ว</p>
                                    <p className="text-[10px] text-gray-500 truncate w-40">Lat: {currentLoc?.lat.toFixed(4)}, Lng: {currentLoc?.lng.toFixed(4)}</p>
                                </div>
                            </div>
                        )}

                        <Button
                            size="lg"
                            className="w-full text-lg py-6 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 rounded-full disabled:opacity-50"
                            disabled={!!geoError}
                            onClick={handleCheckIn}
                        >
                            {!logs.find(l => l.employeeId === employee.id && l.date === new Date().toISOString().split('T')[0])
                                ? 'เช็คอิน เข้างาน'
                                : 'เช็คเอาท์ เลิกงาน'}
                        </Button>

                        <p className="text-xs text-gray-400 mt-6 font-medium tracking-wide">
                            REPAIRHUB ATTENDANCE
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
