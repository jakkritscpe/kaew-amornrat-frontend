import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';

// Uses Vite proxy (/api → backend) in dev; empty string means same-origin in production
const API_URL = import.meta.env.VITE_API_URL ?? '';

interface EmployeeInfo {
  id: string;
  name: string;
  position: string;
  avatarUrl?: string;
}

export function QRCheckInPage() {
    const { employeeId } = useParams<{ employeeId: string }>();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [currentLoc, setCurrentLoc] = useState<{ lat: number; lng: number } | null>(null);
    const [employee, setEmployee] = useState<EmployeeInfo | null>(null);
    const [result, setResult] = useState<{ success: boolean; type: 'in' | 'out'; msg: string } | null>(null);
    const [fetchError, setFetchError] = useState<string | null>(null);

    useEffect(() => {
        if (!employeeId) return;
        fetch(`${API_URL}/api/qr-checkin/${employeeId}`)
            .then(r => r.json())
            .then(json => {
                if (json.success) setEmployee(json.data);
                else setFetchError(t('qrCheckIn.employeeNotFound'));
            })
            .catch(() => setFetchError(t('qrCheckIn.employeeLoadError')));
    }, [employeeId]);

    useEffect(() => {
        if (!navigator.geolocation) {
            setGeoError(t('qrCheckIn.gpsNotSupported'));
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setCurrentLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setLoading(false);
            },
            () => {
                setGeoError(t('qrCheckIn.gpsAccessDenied'));
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    }, []);

    if (fetchError) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-50">
                <XCircle className="w-16 h-16 text-red-500 mb-4" />
                <h2 className="text-xl font-bold text-gray-900">{t('qrCheckIn.employeeNotFound')}</h2>
                <p className="text-gray-500 mt-2">{fetchError}</p>
            </div>
        );
    }

    const handleCheckIn = async () => {
        if (!currentLoc || !employeeId) return;
        setActionLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/qr-checkin/${employeeId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: currentLoc.lat, lng: currentLoc.lng }),
            });
            const json = await res.json();
            if (json.success) {
                const action = json.data?.action as 'check-in' | 'check-out';
                setResult({
                    success: true,
                    type: action === 'check-in' ? 'in' : 'out',
                    msg: json.message ?? t('qrCheckIn.recordSuccess'),
                });
            } else {
                setResult({ success: false, type: 'in', msg: json.error ?? t('qrCheckIn.error') });
            }
        } catch {
            setResult({ success: false, type: 'in', msg: t('qrCheckIn.serverError') });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <Loader2 className="w-10 h-10 text-[#044F88] animate-spin mb-4" />
                <p className="text-gray-500 font-medium">{t('qrCheckIn.findingCoords')}</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-[#044F88]/5 to-white px-6">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm p-8 text-center relative overflow-hidden">
                {/* Decorative Top Banner */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-[#044F88]"></div>

                {result ? (
                    <div className="pt-4">
                        {result.success ? (
                            <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
                        ) : (
                            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
                        )}
                        <h2 className={result.success ? 'text-2xl font-bold text-gray-900' : 'text-xl font-bold text-red-600'}>
                            {result.success ? (result.type === 'in' ? t('qrCheckIn.checkInSuccess') : t('qrCheckIn.checkOutSuccess')) : t('qrCheckIn.error')}
                        </h2>
                        <p className="text-gray-500 mt-2 text-sm">{result.msg}</p>
                    </div>
                ) : (
                    <div className="pt-2">
                        <div className="w-20 h-20 rounded-full bg-[#044F88]/10 flex items-center justify-center mx-auto mb-4">
                            {employee?.avatarUrl ? (
                                <img src={employee.avatarUrl} alt={employee.name} className="w-20 h-20 rounded-full object-cover" />
                            ) : (
                                <span className="text-[#044F88] font-bold text-2xl">
                                    {employee ? employee.name.charAt(0) : '?'}
                                </span>
                            )}
                        </div>

                        {employee ? (
                            <>
                                <h2 className="text-xl font-bold text-gray-900">{employee.name}</h2>
                                <p className="text-gray-500 text-sm mb-6">{employee.position}</p>
                            </>
                        ) : (
                            <div className="mb-6">
                                <Loader2 className="w-6 h-6 text-[#044F88] animate-spin mx-auto" />
                            </div>
                        )}

                        {geoError ? (
                            <div className="bg-red-50 p-4 rounded-xl mb-6 border border-red-100">
                                <p className="text-sm text-red-600 font-medium">{geoError}</p>
                            </div>
                        ) : (
                            <div className="bg-[#044F88]/5 p-4 rounded-xl mb-6 flex items-center gap-3">
                                <div className="p-2 bg-white rounded-full text-[#044F88] shadow-sm shrink-0">
                                    <MapPin className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <p className="text-xs text-[#00223A] font-semibold mb-0.5">{t('qrCheckIn.gpsVerified')}</p>
                                    <p className="text-[10px] text-gray-500 truncate w-40">Lat: {currentLoc?.lat.toFixed(4)}, Lng: {currentLoc?.lng.toFixed(4)}</p>
                                </div>
                            </div>
                        )}

                        <Button
                            size="lg"
                            className="w-full text-lg py-6 bg-[#044F88] hover:bg-[#00223A] shadow-lg shadow-[#044F88]/30 rounded-full disabled:opacity-50"
                            disabled={!!geoError || !employee || actionLoading}
                            onClick={handleCheckIn}
                        >
                            {actionLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : t('qrCheckIn.checkInOut')}
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
