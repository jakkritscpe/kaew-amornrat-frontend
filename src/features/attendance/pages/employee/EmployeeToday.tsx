import { useState, useEffect, useCallback } from 'react';
import { getTodayLogApi, checkInApi, checkOutApi } from '../../../../lib/api/attendance-api';
import type { AttendanceLog } from '../../types';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { MapPin, LogIn, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function EmployeeToday() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [todayLog, setTodayLog] = useState<AttendanceLog | null>(null);
    const [loadingLog, setLoadingLog] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);

    const [currentLoc, setCurrentLoc] = useState<{ lat: number; lng: number } | null>(null);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [checkingLoc, setCheckingLoc] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchTodayLog = useCallback(async () => {
        try {
            const log = await getTodayLogApi();
            setTodayLog(log);
        } catch {
            // Not logged in or no log yet — ignore
        } finally {
            setLoadingLog(false);
        }
    }, []);

    useEffect(() => {
        fetchTodayLog();
    }, [fetchTodayLog]);

    useEffect(() => {
        if (!navigator.geolocation) {
            setGeoError('GPS not supported');
            setCheckingLoc(false);
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setCurrentLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGeoError(null);
                setCheckingLoc(false);
            },
            () => {
                setGeoError('กรุณาเปิด GPS');
                setCheckingLoc(false);
            },
            { enableHighAccuracy: true }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    const handleAction = async () => {
        if (!currentLoc) return;
        setActionLoading(true);
        setActionError(null);
        try {
            if (!todayLog?.checkInTime) {
                const log = await checkInApi(currentLoc.lat, currentLoc.lng);
                setTodayLog(log);
            } else if (!todayLog.checkOutTime) {
                const log = await checkOutApi(currentLoc.lat, currentLoc.lng);
                setTodayLog(log);
            }
        } catch (err) {
            setActionError(err instanceof Error ? err.message : 'เกิดข้อผิดพลาด');
        } finally {
            setActionLoading(false);
        }
    };

    const isCheckedIn = !!todayLog?.checkInTime;
    const isCheckedOut = !!todayLog?.checkOutTime;

    const formatTime = (ts: string | Date | null | undefined) => {
        if (!ts) return '--:--';
        const d = typeof ts === 'string' ? new Date(ts) : ts;
        return format(d, 'HH:mm');
    };

    if (loadingLog) {
        return (
            <div className="flex items-center justify-center h-full py-20">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-4 flex flex-col items-center">
            <div className="text-center my-6">
                <p className="text-blue-600 font-semibold mb-1">
                    {format(currentTime, 'EEEE dd MMMM yyyy', { locale: th })}
                </p>
                <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 tracking-tight">
                    {format(currentTime, 'HH:mm:ss')}
                </h1>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 w-full mb-6">
                <div className="flex items-start gap-3">
                    <div className="bg-blue-50 p-2 rounded-full mt-1">
                        {checkingLoc ? (
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                        ) : geoError ? (
                            <MapPin className="w-5 h-5 text-red-500" />
                        ) : (
                            <MapPin className="w-5 h-5 text-emerald-500" />
                        )}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">สถานะตำแหน่งของคุณ</h3>
                        {checkingLoc ? (
                            <p className="text-sm text-gray-500">กำลังค้นหาตำแหน่ง...</p>
                        ) : geoError ? (
                            <p className="text-sm text-red-500">ไม่สามารถเข้าถึงตำแหน่งได้</p>
                        ) : (
                            <>
                                <p className="text-sm text-emerald-600 font-medium tracking-tight">พร้อมบันทึกเวลา</p>
                                <p className="text-[10px] text-gray-400 mt-1">Lat: {currentLoc?.lat.toFixed(4)}, Lng: {currentLoc?.lng.toFixed(4)}</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {actionError && (
                <div className="w-full bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">
                    {actionError}
                </div>
            )}

            <div className="w-full">
                {isCheckedOut ? (
                    <div className="bg-gray-100 p-6 rounded-3xl text-center border border-gray-200">
                        <h2 className="text-xl font-bold text-gray-700 mb-2">วันนี้คุณหมดกะงานแล้ว</h2>
                        <p className="text-gray-500 text-sm">เลิกงานเวลา {formatTime(todayLog?.checkOutTime)}</p>
                    </div>
                ) : (
                    <Button
                        size="lg"
                        disabled={checkingLoc || !!geoError || isCheckedOut || actionLoading}
                        onClick={handleAction}
                        className={`w-full py-8 text-xl rounded-2xl shadow-lg transition-transform active:scale-95 ${!isCheckedIn
                            ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/25'
                            : 'bg-orange-500 hover:bg-orange-600 shadow-orange-500/25'
                            }`}
                    >
                        {actionLoading ? (
                            <Loader2 className="mr-3 w-6 h-6 animate-spin" />
                        ) : !isCheckedIn ? (
                            <><LogIn className="mr-3 w-6 h-6" /> เช็คอิน (เข้างาน)</>
                        ) : (
                            <><LogOut className="mr-3 w-6 h-6" /> เช็คเอาท์ (เลิกงาน)</>
                        )}
                    </Button>
                )}
            </div>

            {todayLog && (
                <div className="grid grid-cols-2 gap-4 w-full mt-8">
                    <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-sm">
                        <p className="text-xs text-gray-500 font-medium mb-1">เวลาเข้า</p>
                        <p className="text-xl font-bold text-emerald-600">{formatTime(todayLog.checkInTime)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-sm">
                        <p className="text-xs text-gray-500 font-medium mb-1">เวลาออก</p>
                        <p className="text-xl font-bold text-gray-900">{formatTime(todayLog.checkOutTime)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-sm">
                        <p className="text-xs text-gray-500 font-medium mb-1">ชม. ทำงาน</p>
                        <p className="text-xl font-bold text-blue-600">{(todayLog.workHours ?? 0).toFixed(1)} <span className="text-sm font-normal">ชม.</span></p>
                    </div>
                    <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-sm">
                        <p className="text-xs text-gray-500 font-medium mb-1">OT</p>
                        <p className="text-xl font-bold text-purple-600">{(todayLog.otHours ?? 0).toFixed(1)} <span className="text-sm font-normal">ชม.</span></p>
                    </div>
                </div>
            )}
        </div>
    );
}
