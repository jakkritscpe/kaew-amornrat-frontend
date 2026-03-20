import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { getTodayLogApi, checkInApi, checkOutApi } from '../../../../lib/api/attendance-api';
import type { AttendanceLog } from '../../types';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { MapPin, LogIn, LogOut, Loader2, CheckCircle2, Clock4, Timer, Zap, AlertCircle, X } from 'lucide-react';
import { formatTime, cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import { EMPLOYEE_KEY } from '@/lib/api-client';

type ShiftUrgency = 'early' | 'warning' | 'late' | 'veryLate';

function getShiftUrgency(shiftStartTime: string | undefined, now: Date): ShiftUrgency {
    if (!shiftStartTime) return 'early';
    const [h, m] = shiftStartTime.split(':').map(Number);
    const shiftMinutes = h * 60 + m;
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const diff = nowMinutes - shiftMinutes;
    if (diff < 0) return 'early';       // ก่อนเวลากะ
    if (diff < 15) return 'warning';     // เลยกะ < 15 นาที (ใกล้สาย)
    if (diff < 60) return 'late';        // เลยกะ 15-60 นาที (สาย)
    return 'veryLate';                   // เลยกะ > 60 นาที (สายมาก)
}

const URGENCY_STYLE = {
    early: {
        btn: 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_24px_rgba(16,185,129,0.45)] hover:shadow-[0_0_32px_rgba(16,185,129,0.6)]',
        confirm: 'bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.4)]',
        pulse: false,
    },
    warning: {
        btn: 'bg-amber-500 hover:bg-amber-600 shadow-[0_0_24px_rgba(245,158,11,0.45)] hover:shadow-[0_0_32px_rgba(245,158,11,0.6)]',
        confirm: 'bg-amber-500 hover:bg-amber-600 shadow-[0_0_20px_rgba(245,158,11,0.4)]',
        pulse: false,
    },
    late: {
        btn: 'bg-orange-500 hover:bg-orange-600 shadow-[0_0_24px_rgba(249,115,22,0.45)] hover:shadow-[0_0_32px_rgba(249,115,22,0.6)]',
        confirm: 'bg-orange-500 hover:bg-orange-600 shadow-[0_0_20px_rgba(249,115,22,0.4)]',
        pulse: false,
    },
    veryLate: {
        btn: 'bg-red-500 hover:bg-red-600 shadow-[0_0_24px_rgba(239,68,68,0.5)] hover:shadow-[0_0_36px_rgba(239,68,68,0.65)] animate-pulse',
        confirm: 'bg-red-500 hover:bg-red-600 shadow-[0_0_20px_rgba(239,68,68,0.4)]',
        pulse: true,
    },
} as const;

const CHECKOUT_STYLE = {
    btn: 'bg-[#044F88] hover:bg-[#00223A] shadow-[0_0_24px_rgba(4,79,136,0.4)] hover:shadow-[0_0_32px_rgba(4,79,136,0.55)]',
    confirm: 'bg-[#044F88] hover:bg-[#00223A] shadow-[0_0_20px_rgba(4,79,136,0.4)]',
};

export function EmployeeToday() {
    const { t } = useTranslation();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [todayLog, setTodayLog] = useState<AttendanceLog | null>(null);
    const [loadingLog, setLoadingLog] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [actionError, setActionError] = useState<string | null>(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [confirmTime, setConfirmTime] = useState<Date | null>(null);
    const [currentLoc, setCurrentLoc] = useState<{ lat: number; lng: number } | null>(null);
    const [geoError, setGeoError] = useState<string | null>(null);
    const [checkingLoc, setCheckingLoc] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchTodayLog = useCallback(async () => {
        try {
            setTodayLog(await getTodayLogApi());
        } catch (e) {
            // 404 = ยังไม่มีข้อมูลวันนี้ ถือเป็นเรื่องปกติ
            // error อื่นๆ แสดงใน actionError
            const status = e instanceof Error && 'status' in e ? (e as { status: number }).status : 0;
            if (status !== 404) setActionError(t('employee.today.loadError'));
        } finally {
            setLoadingLog(false);
        }
    }, []);

    useEffect(() => { fetchTodayLog(); }, [fetchTodayLog]);

    useEffect(() => {
        if (!navigator.geolocation) { setGeoError(t('employee.today.gpsNotSupported')); setCheckingLoc(false); return; }
        const id = navigator.geolocation.watchPosition(
            (p) => { setCurrentLoc({ lat: p.coords.latitude, lng: p.coords.longitude }); setGeoError(null); setCheckingLoc(false); },
            () => { setGeoError(t('employee.today.gpsPermission')); setCheckingLoc(false); },
            { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(id);
    }, []);

    const openConfirm = () => {
        setConfirmTime(new Date());
        setShowConfirm(true);
    };

    const handleAction = async () => {
        if (!currentLoc) return;
        setShowConfirm(false);
        setActionLoading(true);
        setActionError(null);
        try {
            if (!todayLog?.checkInTime) setTodayLog(await checkInApi(currentLoc.lat, currentLoc.lng));
            else if (!todayLog.checkOutTime) setTodayLog(await checkOutApi(currentLoc.lat, currentLoc.lng));
        } catch (e) {
            setActionError(e instanceof Error ? e.message : t('common.genericError'));
        } finally { setActionLoading(false); }
    };

    const isCheckedIn = !!todayLog?.checkInTime;
    const isCheckedOut = !!todayLog?.checkOutTime;

    // Shift-aware button color
    const empRaw = localStorage.getItem(EMPLOYEE_KEY);
    const shiftStart = empRaw ? JSON.parse(empRaw)?.shiftStartTime : undefined;
    const urgency = isCheckedIn ? null : getShiftUrgency(shiftStart, currentTime);
    const btnStyle = isCheckedIn ? CHECKOUT_STYLE : URGENCY_STYLE[urgency ?? 'early'];

    if (loadingLog) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-[#044F88] py-24">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
        );
    }

    return (
        <>
        <div className="flex flex-col min-h-full bg-[#f1f5f9]">

            {/* ── Blue hero with clock ── */}
            <div className="bg-[#044F88] px-5 pt-3 pb-14">
                <p className="text-[#044F88]/80 text-sm">
                    <span className="text-white font-semibold capitalize">
                        {format(currentTime, 'EEEE', { locale: th })}
                    </span>
                    {'  '}
                    {format(currentTime, 'd MMMM yyyy', { locale: th })}
                </p>

                {/* Giant clock */}
                <div className="flex items-end gap-1 mt-2">
                    <span className="text-[72px] font-black text-white leading-none tabular-nums tracking-tighter">
                        {format(currentTime, 'HH:mm')}
                    </span>
                    <span className="text-2xl font-bold text-white/50 tabular-nums mb-3 leading-none">
                        :{format(currentTime, 'ss')}
                    </span>
                </div>

                {/* GPS status pill */}
                <div className={cn(
                    'inline-flex items-center gap-2 mt-3 px-3 py-1.5 rounded-full text-xs font-semibold',
                    checkingLoc
                        ? 'bg-white/20 text-[#044F88]/80'
                        : geoError
                            ? 'bg-red-400/25 text-red-100'
                            : 'bg-emerald-400/25 text-emerald-100'
                )}>
                    {checkingLoc
                        ? <Loader2 className="w-3 h-3 animate-spin" />
                        : geoError
                            ? <AlertCircle className="w-3 h-3" />
                            : <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />}
                    {checkingLoc ? t('employee.today.findingLocation') : geoError ? geoError : t('employee.today.gpsReady')}
                </div>
            </div>

            {/* ── White floating card ── */}
            <div className="flex-1 bg-white rounded-t-3xl -mt-6 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-4 pt-5 pb-6 space-y-4 relative z-10">

                {/* Error */}
                {actionError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {actionError}
                    </div>
                )}

                {/* Done state */}
                {isCheckedOut ? (
                    <div className="flex flex-col items-center text-center py-6 gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                        </div>
                        <div>
                            <p className="font-bold text-[#1d1d1d] text-xl">{t('employee.today.doneForToday')}</p>
                            <p className="text-[#6f6f6f] text-sm mt-1">
                                {t('employee.today.finishedAt')} <span className="font-semibold text-[#1d1d1d]">{formatTime(todayLog?.checkOutTime)}</span> น.
                            </p>
                        </div>
                    </div>
                ) : (
                    /* CTA button */
                    <button
                        disabled={checkingLoc || !!geoError || actionLoading}
                        onClick={openConfirm}
                        className={cn(
                            'w-full py-5 rounded-2xl font-bold text-lg text-white',
                            'flex items-center justify-center gap-3',
                            'transition-all duration-150 active:scale-[0.97] touch-manipulation',
                            'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
                            btnStyle.btn
                        )}
                    >
                        {actionLoading
                            ? <Loader2 className="w-6 h-6 animate-spin" />
                            : !isCheckedIn
                                ? <><LogIn className="w-6 h-6" /> {t('employee.today.checkIn')}</>
                                : <><LogOut className="w-6 h-6" /> {t('employee.today.checkOut')}</>
                        }
                    </button>
                )}

                {/* Location coords */}
                {!checkingLoc && !geoError && currentLoc && (
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-[#f8fafc] rounded-xl border border-gray-100 text-xs">
                        <MapPin className="w-3.5 h-3.5 text-[#044F88] shrink-0" />
                        <span className="text-[#6f6f6f]">{t('employee.today.position')}</span>
                        <span className="font-mono text-[#1d1d1d] font-medium ml-auto">
                            {currentLoc.lat.toFixed(5)}, {currentLoc.lng.toFixed(5)}
                        </span>
                    </div>
                )}

                {/* Stats grid */}
                {todayLog && (
                    <div className="pt-1">
                        <p className="text-[11px] font-bold text-[#6f6f6f] uppercase tracking-widest mb-3 px-1">{t('employee.today.todaySummary')}</p>
                        <div className="grid grid-cols-2 gap-3">
                            <StatCard label={t('employee.today.timeIn')}   value={formatTime(todayLog.checkInTime)}                  icon={Clock4}  iconBg="bg-[#044F88]/5"    iconColor="text-[#044F88]" />
                            <StatCard label={t('employee.today.timeOut')}    value={formatTime(todayLog.checkOutTime)}                 icon={LogOut}  iconBg="bg-orange-50"  iconColor="text-orange-500" />
                            <StatCard label={t('employee.today.workHours')}  value={`${(todayLog.workHours ?? 0).toFixed(1)} ${t('common.hours')}`}   icon={Timer}   iconBg="bg-emerald-50" iconColor="text-emerald-600" />
                            <StatCard label={t('employee.today.otToday')}     value={`${(todayLog.otHours ?? 0).toFixed(1)} ${t('common.hours')}`}     icon={Zap}     iconBg="bg-purple-50"  iconColor="text-purple-600" />
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* ── Confirm Modal ── */}
        {showConfirm && currentLoc && confirmTime && createPortal(
            <div className="fixed inset-0 z-50 flex items-end justify-center">
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                    onClick={() => setShowConfirm(false)}
                />

                {/* Bottom sheet */}
                <div className="relative w-full max-w-md bg-white rounded-t-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-300">

                    {/* Handle bar */}
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 rounded-full bg-gray-200" />
                    </div>

                    {/* Header */}
                    <div className={cn(
                        'flex items-center justify-between px-5 py-4',
                        !isCheckedIn ? 'bg-[#044F88]/5' : 'bg-orange-50'
                    )}>
                        <div className="flex items-center gap-3">
                            <div className={cn(
                                'w-11 h-11 rounded-2xl flex items-center justify-center',
                                !isCheckedIn ? 'bg-[#044F88]' : 'bg-orange-500'
                            )}>
                                {!isCheckedIn
                                    ? <LogIn className="w-5 h-5 text-white" />
                                    : <LogOut className="w-5 h-5 text-white" />}
                            </div>
                            <div>
                                <p className="font-bold text-[#1d1d1d] text-base leading-tight">
                                    {!isCheckedIn ? t('employee.today.confirmCheckIn') : t('employee.today.confirmCheckOut')}
                                </p>
                                <p className="text-xs text-[#6f6f6f] mt-0.5">
                                    {!isCheckedIn ? t('employee.today.recordTimeIn') : t('employee.today.recordTimeOut')}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Info rows */}
                    <div className="px-5 py-4 space-y-3">
                        {/* Time */}
                        <div className="flex items-center justify-between bg-[#f8fafc] rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <Clock4 className={cn('w-4 h-4', !isCheckedIn ? 'text-[#044F88]' : 'text-orange-500')} />
                                <span className="text-sm text-[#6f6f6f] font-medium">{t('employee.today.time')}</span>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-[#1d1d1d] text-base tabular-nums">
                                    {format(confirmTime, 'HH:mm:ss')}
                                </p>
                                <p className="text-[11px] text-[#6f6f6f] tabular-nums">
                                    {format(confirmTime, 'd MMM yyyy', { locale: th })}
                                </p>
                            </div>
                        </div>

                        {/* GPS */}
                        <div className="flex items-center justify-between bg-[#f8fafc] rounded-2xl px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <MapPin className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm text-[#6f6f6f] font-medium">{t('employee.today.gpsPosition')}</span>
                            </div>
                            <div className="text-right">
                                <p className="font-mono text-xs font-semibold text-[#1d1d1d]">
                                    {currentLoc.lat.toFixed(5)}
                                </p>
                                <p className="font-mono text-xs font-semibold text-[#1d1d1d]">
                                    {currentLoc.lng.toFixed(5)}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="px-5 pb-8 pt-1 flex gap-3">
                        <button
                            onClick={() => setShowConfirm(false)}
                            className="flex-1 py-4 rounded-2xl bg-gray-100 text-[#1d1d1d] font-bold text-base hover:bg-gray-200 transition-colors active:scale-[0.97]"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            onClick={handleAction}
                            className={cn(
                                'flex-2 basis-[60%] py-4 rounded-2xl font-bold text-base text-white',
                                'flex items-center justify-center gap-2',
                                'transition-all active:scale-[0.97]',
                                btnStyle.confirm
                            )}
                        >
                            {!isCheckedIn
                                ? <><LogIn className="w-5 h-5" /> {t('employee.today.checkInShort')}</>
                                : <><LogOut className="w-5 h-5" /> {t('employee.today.checkOutShort')}</>}
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )}
        </>
    );
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor }: {
    label: string; value: string; icon: React.ElementType; iconBg: string; iconColor: string;
}) {
    return (
        <div className="bg-[#f8fafc] rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
            <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', iconBg)}>
                <Icon className={cn('w-4 h-4', iconColor)} />
            </div>
            <div className="min-w-0">
                <p className="text-[10px] text-[#6f6f6f] font-semibold uppercase tracking-wide">{label}</p>
                <p className="text-[15px] font-bold text-[#1d1d1d] tabular-nums mt-0.5 leading-none">{value}</p>
            </div>
        </div>
    );
}
