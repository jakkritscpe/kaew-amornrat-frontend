import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAttendance } from '../../contexts/AttendanceContext';
import { QRCodeSVG } from 'qrcode.react';
import { regenerateQRApi } from '../../../../lib/api/auth-api';
import { toast } from 'sonner';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    Plus, QrCode, X, Search, FileDown, Clock,
    Building2, ImagePlus, Trash2, Camera, SwitchCamera,
    CheckCircle2, AlertCircle, XCircle, MinusCircle, Users, Pencil,
    MapPin, DollarSign, Link2, Check, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
    present: { label: 'มาทำงาน', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    late: { label: 'มาสาย', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
    absent: { label: 'ขาดงาน', dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 ring-red-200' },
    none: { label: 'ยังไม่เช็คอิน', dot: 'bg-gray-400', badge: 'bg-gray-50 text-gray-500 ring-gray-200' },
};

const STAT_ICONS: Record<string, React.ElementType> = {
    present: CheckCircle2,
    late: AlertCircle,
    absent: XCircle,
    none: MinusCircle,
};

const STAT_COLORS: Record<string, string> = {
    present: 'bg-gradient-to-br from-emerald-500 to-teal-500',
    late: 'bg-gradient-to-br from-amber-500 to-orange-500',
    absent: 'bg-gradient-to-br from-red-500 to-rose-500',
    none: 'bg-gradient-to-br from-gray-400 to-gray-500',
};

type AvatarMode = 'idle' | 'camera';

function StatCard({ title, value, icon: Icon, color, delay }: { title: string, value: number, icon: React.ElementType, color: string, delay: number }) {
    const cardRef = useRef<HTMLDivElement>(null);
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(cardRef.current,
                { rotateX: 90, opacity: 0, transformOrigin: 'center bottom' },
                { rotateX: 0, opacity: 1, duration: 0.5, delay, ease: 'power3.out' }
            );
            const counter = { val: 0 };
            gsap.to(counter, {
                val: value,
                duration: 0.8,
                delay: delay + 0.1,
                ease: 'expo.out',
                onUpdate: () => setDisplayValue(Math.round(counter.val))
            });
            gsap.fromTo(cardRef.current?.querySelector('.stat-icon'),
                { rotate: -180, scale: 0 },
                { rotate: 0, scale: 1, duration: 0.4, delay: delay + 0.15, ease: 'back.out(1.7)' }
            );
        });
        return () => ctx.revert();
    }, [value, delay]);

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
        <div
            ref={cardRef}
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
                    <p className="text-sm text-[#6f6f6f] mb-1">{title}</p>
                    <span className="text-3xl font-bold text-[#1d1d1d] tabular-nums">
                        {displayValue.toLocaleString()}
                    </span>
                    <p className="text-sm text-gray-400 mt-1">คน</p>
                </div>
                <div className={cn('stat-icon w-12 h-12 rounded-xl flex items-center justify-center shrink-0', color)}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );
}

export function AdminEmployees() {
    const { employees, logs, locations, addEmployee, updateEmployee, removeEmployee, companySettings, refreshAll } = useAttendance();

    const [searchTerm, setSearchTerm] = useState('');
    const [showQRModal, setShowQRModal] = useState<string | null>(null);
    const [confirmRegenerate, setConfirmRegenerate] = useState(false);
    const [copied, setCopied] = useState(false);
    const selectedEmp = employees.find(e => e.id === showQRModal) ?? null;
    const [showFormModal, setShowFormModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '', nickname: '', email: '', password: '', department: '', position: '',
        shiftStartTime: '09:00', shiftEndTime: '18:00',
        locationId: '' as string,
        baseWage: '' as string | number,
        otUseDefault: true,
        otType: 'multiplier' as 'multiplier' | 'fixed',
        otValue: '' as string | number,
    });
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [avatarMode, setAvatarMode] = useState<AvatarMode>('idle');
    const [cameraError, setCameraError] = useState<string | null>(null);

    // Secure Action (Edit/Delete) + PIN
    const [secureActionId, setSecureActionId] = useState<string | null>(null);
    const [secureActionType, setSecureActionType] = useState<'delete' | 'edit' | null>(null);
    const [secureStep, setSecureStep] = useState<'confirm' | 'pin'>('confirm');
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');
    const [pinAttempts, setPinAttempts] = useState(0);
    const ADMIN_PIN = '1234';
    const PIN_REFS = [
        useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
        useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null),
    ];

    const sectionRef = useRef<HTMLDivElement>(null);
    const qrRef = useRef<SVGSVGElement>(null);
    const qrModalRef = useRef<HTMLDivElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const todayDate = new Date().toISOString().split('T')[0];

    const filteredEmployees = employees.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.nickname ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatus = (empId: string) => {
        const log = logs.find(l => l.employeeId === empId && l.date === todayDate);
        return log ? log.status : 'none';
    };

    const stats = employees.reduce((acc, currentEmployee) => {
        const status = getStatus(currentEmployee.id);
        if (status === 'present') acc.present++;
        else if (status === 'late') acc.late++;
        else if (status === 'absent') acc.absent++;
        else acc.none++;
        return acc;
    }, { present: 0, late: 0, absent: 0, none: 0 });

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Header animation
            gsap.fromTo('.page-header',
                { y: -20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' }
            );

            // Cards stagger
            gsap.fromTo('.emp-card',
                { y: 30, opacity: 0 },
                {
                    y: 0, opacity: 1,
                    duration: 0.4, stagger: 0.03, ease: 'power3.out',
                    scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none none' },
                }
            );
        });
        return () => ctx.revert();
    }, [filteredEmployees.length]);

    const startCamera = useCallback(async () => {
        setCameraError(null);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: 640, height: 480 } });
            streamRef.current = stream;
            setAvatarMode('camera');
            setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 50);
        } catch { setCameraError('ไม่สามารถเข้าถึงกล้องได้'); }
    }, []);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setAvatarMode('idle');
    }, []);

    const capturePhoto = useCallback(() => {
        if (!videoRef.current) return;
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0);
        setAvatarPreview(canvas.toDataURL('image/jpeg', 0.85));
        stopCamera();
    }, [stopCamera]);

    const openAddForm = useCallback(() => {
        setIsEditing(false);
        setEditingId(null);
        setForm({
            name: '', nickname: '', email: '', password: '', department: '', position: '',
            shiftStartTime: '09:00', shiftEndTime: '18:00',
            locationId: '', baseWage: '',
            otUseDefault: true,
            otType: companySettings.defaultOtRateType,
            otValue: companySettings.defaultOtRateValue,
        });
        setAvatarPreview(null);
        setShowFormModal(true);
    }, [companySettings]);

    const openEditForm = useCallback((id: string) => {
        const emp = employees.find(e => e.id === id);
        if (!emp) return;
        setForm({
            name: emp.name, nickname: emp.nickname || '', email: emp.email || '', password: '',
            department: emp.department, position: emp.position,
            shiftStartTime: emp.shiftStartTime || '09:00', shiftEndTime: emp.shiftEndTime || '18:00',
            locationId: emp.locationId || '',
            baseWage: emp.baseWage ?? '',
            otUseDefault: emp.otRateConfig?.useDefault ?? true,
            otType: emp.otRateConfig?.type || companySettings.defaultOtRateType,
            otValue: emp.otRateConfig?.value ?? companySettings.defaultOtRateValue,
        });
        setAvatarPreview(emp.avatarUrl || null);
        setIsEditing(true);
        setEditingId(id);
        setShowFormModal(true);
    }, [employees, companySettings]);

    const closeFormModal = useCallback(() => {
        stopCamera();
        setShowFormModal(false);
        setAvatarPreview(null);
        setAvatarMode('idle');
        setCameraError(null);
        setForm({
            name: '', nickname: '', email: '', password: '', department: '', position: '',
            shiftStartTime: '09:00', shiftEndTime: '18:00',
            locationId: '', baseWage: '',
            otUseDefault: true,
            otType: companySettings.defaultOtRateType,
            otValue: companySettings.defaultOtRateValue,
        });
        setIsEditing(false);
        setEditingId(null);
    }, [stopCamera, companySettings]);

    const closeSecureAction = useCallback(() => {
        setSecureActionId(null);
        setSecureActionType(null);
        setSecureStep('confirm');
        setPinInput('');
        setPinError('');
        setPinAttempts(0);
    }, []);

    const handlePinDigit = (digit: string) => {
        const locked = pinAttempts >= 3;
        if (locked) return;
        const next = (pinInput + digit).slice(0, 4);
        setPinInput(next);
        setPinError('');
        if (next.length < 4) PIN_REFS[next.length]?.current?.focus();
        if (next.length === 4) {
            if (next === ADMIN_PIN) {
                if (secureActionType === 'delete') {
                    removeEmployee(secureActionId!);
                } else if (secureActionType === 'edit') {
                    openEditForm(secureActionId!);
                }
                closeSecureAction();
            } else {
                const newAttempts = pinAttempts + 1;
                setPinAttempts(newAttempts);
                setPinInput('');
                PIN_REFS[0]?.current?.focus();
                setPinError(newAttempts >= 3 ? 'ถูกล็อค – ลองใหม่ภายหลัง' : `PIN ไม่ถูกต้อง (${3 - newAttempts} ครั้งที่เหลือ)`);
            }
        }
    };
    const handlePinBackspace = () => {
        if (pinAttempts >= 3) return;
        const next = pinInput.slice(0, -1);
        setPinInput(next);
        setPinError('');
        PIN_REFS[Math.max(0, next.length)]?.current?.focus();
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) { alert('รูปภาพต้องมีขนาดไม่เกิน 2 MB'); return; }
        const reader = new FileReader();
        reader.onload = () => setAvatarPreview(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            name: form.name,
            nickname: form.nickname,
            email: form.email,
            department: form.department,
            position: form.position,
            shiftStartTime: form.shiftStartTime,
            shiftEndTime: form.shiftEndTime,
            avatarUrl: avatarPreview ?? undefined,
            locationId: form.locationId || undefined,
            baseWage: form.baseWage ? Number(form.baseWage) : undefined,
            otRateUseDefault: form.otUseDefault,
            otRateType: form.otUseDefault ? companySettings.defaultOtRateType : form.otType,
            otRateValue: form.otUseDefault ? companySettings.defaultOtRateValue : (Number(form.otValue) || 0),
        };
        if (isEditing && editingId) {
            updateEmployee(editingId, form.password ? { ...payload, password: form.password } : payload);
        } else {
            addEmployee({ ...payload, role: 'employee', password: form.password || 'password123' });
        }
        closeFormModal();
    };

    const closeQRModal = () => {
        setShowQRModal(null);
        setConfirmRegenerate(false);
        setCopied(false);
    };

    const downloadQR = () => {
        if (!qrRef.current) return;
        const svgData = new XMLSerializer().serializeToString(qrRef.current);
        const canvas = document.createElement('canvas');
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width; canvas.height = img.height;
            canvas.getContext('2d')?.drawImage(img, 0, 0);
            const a = document.createElement('a');
            a.download = `qr-${selectedEmp?.name ?? showQRModal}.png`;
            a.href = canvas.toDataURL('image/png');
            a.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        toast.success('บันทึก QR สำเร็จ');
    };

    const copyQRLink = () => {
        const url = selectedEmp?.qrToken
            ? `${window.location.origin}/employee/qr-login/${selectedEmp.qrToken}`
            : '';
        if (!url) return;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRegenerateQR = async (employeeId: string) => {
        try {
            await regenerateQRApi(employeeId);
            await refreshAll();
            setConfirmRegenerate(false);
            toast.success('ออก QR ใหม่สำเร็จ — QR เดิมถูกยกเลิกแล้ว');
        } catch {
            toast.error('ไม่สามารถออก QR ใหม่ได้ กรุณาลองใหม่');
        }
    };

    useEffect(() => {
        if (!showQRModal) return;

        // Lock body scroll (prevents background scroll on iOS)
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        // Enter animation
        if (qrModalRef.current) {
            const isMobile = window.innerWidth < 640;
            if (isMobile) {
                gsap.fromTo(qrModalRef.current,
                    { y: 80, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.32, ease: 'power3.out' }
                );
            } else {
                gsap.fromTo(qrModalRef.current,
                    { scale: 0.95, opacity: 0, y: 12 },
                    { scale: 1, opacity: 1, y: 0, duration: 0.22, ease: 'power3.out' }
                );
            }
        }

        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeQRModal(); };
        window.addEventListener('keydown', onKey);
        return () => {
            window.removeEventListener('keydown', onKey);
            document.body.style.overflow = prev;
        };
    }, [showQRModal]);

    return (
        <div className="space-y-6">
            {/* ── Page header ── */}
            <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1d1d1d] tracking-tight">จัดการพนักงาน</h1>
                    <p className="text-sm text-[#6f6f6f] mt-1">ทั้งหมด {employees.length} คน · สืบค้นและจัดการรายชื่อพนักงาน</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-auto group focus-within:ring-4 focus-within:ring-[#2075f8]/20 rounded-lg transition-all">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none group-focus-within:text-[#2075f8] transition-colors" />
                        <Input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="ค้นหาชื่อ ชื่อเล่น หรือแผนก…"
                            className="pl-9 w-full sm:w-64 bg-white border-gray-200 focus:border-[#2075f8] focus-visible:ring-0 transition-all rounded-lg h-10"
                            autoComplete="off"
                            spellCheck={false}
                        />
                    </div>
                    <Button onClick={openAddForm} className="bg-gradient-to-r from-[#2075f8] to-[#1a64d4] hover:from-[#1a64d4] hover:to-[#1655b5] text-white shadow-sm hover:shadow-md transition-all h-10 rounded-lg shrink-0">
                        <Plus className="w-4 h-4 mr-2" /> เพิ่มพนักงาน
                    </Button>
                </div>
            </div>

            {/* ── Stats grid (Match Dashboard) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ perspective: '1000px' }}>
                <StatCard title="มาทำงาน" value={stats.present} icon={STAT_ICONS.present} color={STAT_COLORS.present} delay={0.1} />
                <StatCard title="มาสาย" value={stats.late} icon={STAT_ICONS.late} color={STAT_COLORS.late} delay={0.2} />
                <StatCard title="ขาดงาน" value={stats.absent} icon={STAT_ICONS.absent} color={STAT_COLORS.absent} delay={0.3} />
                <StatCard title="ยังไม่เช็คอิน" value={stats.none} icon={STAT_ICONS.none} color={STAT_COLORS.none} delay={0.4} />
            </div>

            {/* ── Employee cards ── */}
            <div ref={sectionRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map(emp => {
                    const todayLog = logs.find(l => l.employeeId === emp.id && l.date === todayDate);
                    const status = getStatus(emp.id);
                    const statusConfig = STATUS_CONFIG[status];

                    return (
                        <div key={emp.id} className={cn(
                            'emp-card relative group bg-white rounded-2xl border border-gray-100 shadow-sm',
                            'hover:shadow-xl hover:shadow-gray-200/50 hover:border-blue-200',
                            'transition-all duration-300 flex flex-col',
                        )}>
                            {/* ── Action icons (top-right) ── */}
                            <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => { setSecureActionId(emp.id); setSecureActionType('edit'); setSecureStep('pin'); setTimeout(() => PIN_REFS[0]?.current?.focus(), 50); }}
                                    aria-label="แก้ไขพนักงาน"
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#2075f8] transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => { setSecureActionId(emp.id); setSecureActionType('delete'); setSecureStep('confirm'); }}
                                    aria-label="ลบพนักงาน"
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-500 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>

                            {/* ── Card body ── */}
                            <div className="p-6 flex-1 flex flex-col gap-5">
                                {/* Top: avatar + info */}
                                <div className="flex items-start gap-4">
                                    {emp.avatarUrl ? (
                                        <img
                                            src={emp.avatarUrl}
                                            alt={emp.name}
                                            width={56} height={56}
                                            className="w-14 h-14 rounded-full object-cover shrink-0 bg-blue-50 ring-2 ring-white shadow-sm"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-lg font-bold shrink-0 ring-2 ring-white shadow-sm">
                                            {emp.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1 pt-1">
                                        <h4 className="font-semibold text-[#1d1d1d] truncate group-hover:text-[#2075f8] transition-colors">
                                            {emp.name}
                                            {emp.nickname && (
                                                <span className="ml-1.5 font-normal text-[#6f6f6f] text-sm">({emp.nickname})</span>
                                            )}
                                        </h4>
                                        <p className="text-sm text-[#6f6f6f] truncate mt-0.5">{emp.position}</p>
                                        {/* Status badge */}
                                        <span className={cn(
                                            'mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ring-1',
                                            statusConfig.badge,
                                        )}>
                                            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusConfig.dot)} />
                                            {statusConfig.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-gray-100" />

                                {/* Info row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                            <Clock className="w-4 h-4 text-[#2075f8]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">กะงาน</p>
                                            <p className="text-xs font-semibold text-[#1d1d1d] tabular-nums truncate">{emp.shiftStartTime}–{emp.shiftEndTime}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                            <Building2 className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">แผนก</p>
                                            <p className="text-xs font-semibold text-[#1d1d1d] truncate">{emp.department}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Check-in row */}
                                <div className={cn(
                                    'flex items-center justify-between rounded-xl px-4 py-3 border',
                                    todayLog?.checkInTime ? 'bg-emerald-50/50 border-emerald-100/50' : 'bg-gray-50/50 border-gray-100/50',
                                )}>
                                    <p className="text-xs font-medium text-[#6f6f6f]">เช็คอินวันนี้</p>
                                    {todayLog?.checkInTime
                                        ? <p className="text-xs font-bold text-emerald-600 tabular-nums">{todayLog.checkInTime} น.</p>
                                        : <p className="text-xs text-gray-400">ยังไม่มีข้อมูล</p>
                                    }
                                </div>
                            </div>

                            {/* ── Card footer ── */}
                            <div className="px-6 pb-6 pt-0">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowQRModal(emp.id)}
                                    className="w-full text-[#6f6f6f] border-gray-200 hover:text-[#2075f8] hover:bg-blue-50 hover:border-blue-200 transition-colors rounded-xl h-10"
                                >
                                    <QrCode className="w-4 h-4 mr-2" /> สแกนลงเวลา
                                </Button>
                            </div>
                        </div>
                    );
                })}

                {/* Empty state */}
                {filteredEmployees.length === 0 ? (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 py-24 text-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                        <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-[#1d1d1d] font-semibold text-lg">ไม่พบพนักงานที่ตรงกับการค้นหา</p>
                        <p className="text-sm text-[#6f6f6f] mt-1">ลองใช้คำค้นหาอื่น หรือกดปุ่มเพิ่มพนักงานใหม่</p>
                    </div>
                ) : null}
            </div>

            {/* ════ MODALS (Portal to body) ════ */}
            {typeof document !== 'undefined' && createPortal(
                <>
                    {/* ════ QR Modal ════ */}
                    {showQRModal ? (
                        <div
                            role="dialog"
                            aria-modal="true"
                            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-gray-900/70 backdrop-blur-sm p-0 sm:p-4"
                            onClick={closeQRModal}
                        >
                            <div
                                ref={qrModalRef}
                                className="bg-white w-full rounded-t-3xl max-h-[90svh] overflow-y-auto overscroll-contain will-change-transform shadow-2xl sm:w-auto sm:min-w-[360px] sm:max-w-sm sm:rounded-3xl sm:max-h-[calc(100svh-2rem)]"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Drag handle – mobile only */}
                                <div className="flex justify-center pt-2.5 pb-1 sm:hidden">
                                    <div className="w-9 h-1 rounded-full bg-gray-300" />
                                </div>
                                {/* ── Branded header with employee identity ── */}
                                <div className="relative bg-gradient-to-br from-[#2075f8] to-[#1250c4] px-6 pt-5 pb-10">
                                    <button
                                        onClick={closeQRModal}
                                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center text-white transition-colors"
                                        aria-label="ปิด"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>

                                    <p className="text-[11px] font-semibold text-blue-200 uppercase tracking-widest mb-3">QR ลงเวลาของ</p>

                                    <div className="flex items-center gap-4">
                                        {selectedEmp?.avatarUrl ? (
                                            <img
                                                src={selectedEmp.avatarUrl}
                                                alt={selectedEmp.name}
                                                className="w-14 h-14 rounded-2xl object-cover ring-4 ring-white/25 shrink-0"
                                            />
                                        ) : (
                                            <div className="w-14 h-14 rounded-2xl bg-white/20 ring-4 ring-white/20 flex items-center justify-center text-white text-2xl font-bold shrink-0 select-none">
                                                {selectedEmp?.name.charAt(0) ?? '?'}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-bold text-white leading-tight truncate">
                                                {selectedEmp?.name}
                                            </h3>
                                            <p className="text-sm text-blue-200 truncate mt-0.5">
                                                {selectedEmp?.position}
                                                {selectedEmp?.department && (
                                                    <span className="text-blue-300"> · {selectedEmp.department}</span>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* ── QR card — lifts over header ── */}
                                <div className="px-5 -mt-6">
                                    <div className="bg-white p-5 flex flex-col items-center gap-3">
                                        {/* QR with corner-bracket frame */}
                                        <div className="relative p-3">
                                            <span className="absolute top-0 left-0 w-5 h-5 border-t-[3px] border-l-[3px] border-[#2075f8] rounded-tl-lg" />
                                            <span className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-[#2075f8] rounded-tr-lg" />
                                            <span className="absolute bottom-0 left-0 w-5 h-5 border-b-[3px] border-l-[3px] border-[#2075f8] rounded-bl-lg" />
                                            <span className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-[#2075f8] rounded-br-lg" />
                                            <QRCodeSVG
                                                value={
                                                    selectedEmp?.qrToken
                                                        ? `${window.location.origin}/employee/qr-login/${selectedEmp.qrToken}`
                                                        : `${window.location.origin}/employee/qr-login/`
                                                }
                                                size={192}
                                                level="H"
                                                includeMargin
                                                ref={qrRef}
                                            />
                                        </div>
                                        <div className="flex items-center gap-1.5 text-xs text-[#6f6f6f]">
                                            <QrCode className="w-3.5 h-3.5 text-[#2075f8]" />
                                            สแกนเพื่อเข้าสู่ระบบลงเวลา
                                        </div>
                                    </div>
                                </div>

                                {/* ── Actions ── */}
                                <div className="px-5 pt-4 space-y-3" style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}>
                                    {/* Primary: Download + Copy */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            onClick={downloadQR}
                                            className="bg-[#1d1d1d] hover:bg-gray-800 active:bg-gray-900 text-white rounded-xl h-12 sm:h-11 text-sm font-semibold gap-2 touch-manipulation"
                                        >
                                            <FileDown className="w-4 h-4" />
                                            บันทึก QR
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={copyQRLink}
                                            className={cn(
                                                'rounded-xl h-12 sm:h-11 text-sm font-medium gap-2 transition-all border-gray-200 touch-manipulation',
                                                copied
                                                    ? 'border-emerald-300 text-emerald-600 bg-emerald-50 hover:bg-emerald-50'
                                                    : 'text-[#1d1d1d] hover:bg-gray-50'
                                            )}
                                        >
                                            {copied
                                                ? <><Check className="w-4 h-4" /> คัดลอกแล้ว</>
                                                : <><Link2 className="w-4 h-4" /> คัดลอกลิงก์</>
                                            }
                                        </Button>
                                    </div>

                                    {/* Danger zone: Regenerate */}
                                    <div className="border-t border-gray-100 pt-3">
                                        {!confirmRegenerate ? (
                                            <button
                                                onClick={() => setConfirmRegenerate(true)}
                                                className="w-full flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors py-2.5 rounded-xl"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                                ออก QR ใหม่ · ยกเลิก QR เดิม
                                            </button>
                                        ) : (
                                            <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-3">
                                                <div className="flex items-start gap-2.5">
                                                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-red-700">ยืนยันออก QR ใหม่?</p>
                                                        <p className="text-xs text-red-500 mt-0.5">QR เดิมทั้งหมดจะใช้ไม่ได้ทันที</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setConfirmRegenerate(false)}
                                                        className="h-9 text-sm rounded-lg border-gray-200"
                                                    >
                                                        ยกเลิก
                                                    </Button>
                                                    <Button
                                                        onClick={() => showQRModal && handleRegenerateQR(showQRModal)}
                                                        className="h-9 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white"
                                                    >
                                                        ออก QR ใหม่
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : null}

                    {/* ════ Secure Action Modal (Confirm + PIN) ════ */}
                    {secureActionId ? (() => {
                        const target = employees.find(e => e.id === secureActionId);
                        const locked = pinAttempts >= 3;
                        const isDelete = secureActionType === 'delete';
                        return (
                            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
                                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative">
                                    {/* Step bar */}
                                    {isDelete && (
                                        <div className="flex h-1.5">
                                            <div className={`flex-1 transition-colors duration-300 ${secureStep === 'confirm' ? 'bg-red-400' : 'bg-red-100'}`} />
                                            <div className={`flex-1 transition-colors duration-300 ${secureStep === 'pin' ? 'bg-red-500' : 'bg-gray-100'}`} />
                                        </div>
                                    )}
                                    <div className="p-8 text-center">
                                        {secureStep === 'confirm' && isDelete ? (
                                            <>
                                                <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
                                                    <Trash2 className="w-8 h-8 text-red-500" />
                                                </div>
                                                <h3 className="text-xl font-bold text-[#1d1d1d] mb-2">ลบพนักงาน</h3>
                                                <p className="text-[15px] text-[#6f6f6f] mb-8 leading-relaxed">
                                                    คุณต้องการลบ{' '}
                                                    <span className="font-semibold text-[#1d1d1d]">
                                                        {target?.name}{target?.nickname ? ` (${target.nickname})` : ''}
                                                    </span>{' '}
                                                    <br />ออกจากระบบใช่ไหม?
                                                    <span className="text-red-500 font-medium text-sm mt-2 block">ระวัง! การกระทำนี้ไม่สามารถย้อนกลับได้</span>
                                                </p>
                                                <div className="flex gap-3">
                                                    <Button variant="outline" className="flex-1 rounded-xl h-12 font-medium" onClick={closeSecureAction}>ยกเลิก</Button>
                                                    <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 font-medium"
                                                        onClick={() => { setSecureStep('pin'); setTimeout(() => PIN_REFS[0]?.current?.focus(), 50); }}>
                                                        ใช่, ลบเลย
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5', locked ? 'bg-gray-100' : (isDelete ? 'bg-red-50' : 'bg-[#e8f1fe]'))}>
                                                    <CheckCircle2 className={cn('w-8 h-8', locked ? 'text-gray-400' : (isDelete ? 'text-red-500' : 'text-[#2075f8]'))} />
                                                </div>
                                                <h3 className="text-xl font-bold text-[#1d1d1d] mb-2">ยืนยันรหัส PIN</h3>
                                                <p className="text-sm text-[#6f6f6f] mb-6">กรุณากรอกรหัส PIN 4 หลักเพื่อยืนยันสิทธิ์ของคุณ</p>

                                                {/* PIN dots */}
                                                <div className="flex justify-center gap-4 mb-6">
                                                    {[0, 1, 2, 3].map(i => (
                                                        <div key={i} className={cn(
                                                            'w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200',
                                                            i < pinInput.length ? (isDelete ? 'border-red-400 bg-red-50 text-red-500 scale-105' : 'border-blue-400 bg-blue-50 text-blue-500 scale-105') : 'border-gray-200 bg-gray-50',
                                                            locked && 'opacity-40',
                                                        )}>
                                                            {i < pinInput.length ? '●' : ''}
                                                        </div>
                                                    ))}
                                                </div>

                                                {pinError && <p className={cn('text-sm mb-4 font-medium', locked ? 'text-[#6f6f6f]' : 'text-red-500')}>{pinError}</p>}

                                                {/* Numpad */}
                                                <div className="grid grid-cols-3 gap-3 mb-6">
                                                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) =>
                                                        k === '' ? <div key={i} /> :
                                                            k === '⌫' ? (
                                                                <button key={i} type="button" disabled={locked}
                                                                    onClick={handlePinBackspace}
                                                                    className="h-14 rounded-2xl bg-gray-100 hover:bg-gray-200 text-[#6f6f6f] font-bold text-xl transition-colors disabled:opacity-30 touch-manipulation">
                                                                    {k}
                                                                </button>
                                                            ) : (
                                                                <button key={i} type="button" disabled={locked || pinInput.length >= 4}
                                                                    onClick={() => handlePinDigit(k)}
                                                                    className="h-14 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-[#2075f8] hover:text-[#2075f8] text-[#1d1d1d] font-semibold text-xl transition-all disabled:opacity-30 touch-manipulation">
                                                                    {k}
                                                                </button>
                                                            )
                                                    )}
                                                </div>
                                                <Button variant="ghost" className="w-full text-[#6f6f6f] font-medium" onClick={closeSecureAction}>ยกเลิก</Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })() : null}

                    {/* ════ Form Modal ════ */}
                    {showFormModal ? (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 sm:p-6">
                            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden relative">

                                {/* Header */}
                                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 shrink-0 bg-white">
                                    <div>
                                        <h2 className="text-xl font-bold text-[#1d1d1d]">{isEditing ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}</h2>
                                        <p className="text-sm text-[#6f6f6f] mt-1">{isEditing ? 'ปรับปรุงข้อมูลพนักงานในระบบให้เป็นปัจจุบัน' : 'กรอกข้อมูลรายละเอียดของพนักงานให้ครบถ้วน'}</p>
                                    </div>
                                    <button type="button" onClick={closeFormModal} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-[#1d1d1d] transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleFormSubmit} className="overflow-y-auto bg-gray-50/30">
                                    <div className="px-8 py-6 flex flex-col md:flex-row gap-8">

                                        {/* LEFT: Avatar */}
                                        <div className="w-full md:w-56 shrink-0 flex flex-col items-center gap-4">
                                            <p className="text-sm font-semibold text-[#1d1d1d] self-start">
                                                รูปโปรไฟล์ <span className="text-gray-400 font-normal text-xs">(ไม่บังคับ)</span>
                                            </p>
                                            <div className="w-48 h-48 rounded-full overflow-hidden border-2 border-dashed border-gray-200 bg-white hover:border-blue-300 transition-colors flex items-center justify-center shadow-sm">
                                                {avatarMode === 'camera'
                                                    ? <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                                    : avatarPreview
                                                        ? <img src={avatarPreview} alt="รูปโปรไฟล์" width={192} height={192} className="w-full h-full object-cover" />
                                                        : <div className="flex flex-col items-center gap-3 text-gray-300">
                                                            <ImagePlus className="w-12 h-12" />
                                                            <span className="text-sm font-medium">ไม่มีรูปภาพ</span>
                                                        </div>
                                                }
                                            </div>
                                            {cameraError && <p className="text-xs text-red-500 font-medium text-center">{cameraError}</p>}

                                            {avatarMode === 'camera' ? (
                                                <div className="flex flex-col gap-2 w-full mt-2">
                                                    <Button type="button" onClick={capturePhoto} className="w-full bg-[#2075f8] hover:bg-[#1a64d4] text-white rounded-xl h-10">
                                                        <Camera className="w-4 h-4 mr-2" /> ถ่ายรูป
                                                    </Button>
                                                    <Button type="button" variant="ghost" onClick={stopCamera} className="w-full text-[#6f6f6f] rounded-xl h-10">ยกเลิกกล้อง</Button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-2 w-full mt-2">
                                                    <Button type="button" onClick={startCamera} variant="outline" className="w-full text-[#1d1d1d] border-gray-200 hover:bg-gray-50 rounded-xl h-10">
                                                        <SwitchCamera className="w-4 h-4 mr-2 text-[#2075f8]" /> ถ่ายจากกล้อง
                                                    </Button>
                                                    <Button type="button" onClick={() => avatarInputRef.current?.click()} variant="outline" className="w-full text-[#1d1d1d] border-gray-200 hover:bg-gray-50 rounded-xl h-10">
                                                        <ImagePlus className="w-4 h-4 mr-2 text-indigo-500" /> อัปโหลดรูปภาพ
                                                    </Button>
                                                    {avatarPreview && (
                                                        <Button type="button" variant="ghost" onClick={() => { setAvatarPreview(null); if (avatarInputRef.current) avatarInputRef.current.value = ''; }}
                                                            className="w-full text-red-500 hover:bg-red-50 rounded-xl h-10 mt-1">
                                                            <Trash2 className="w-4 h-4 mr-2" /> ลบรูปปัจจุบัน
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                        </div>

                                        {/* RIGHT: Fields */}
                                        <div className="flex-1 space-y-6">
                                            {/* Name + Nickname */}
                                            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
                                                <div>
                                                    <label htmlFor="emp-name" className="text-sm font-semibold text-[#1d1d1d] block mb-2">
                                                        ชื่อ-นามสกุล <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input id="emp-name" name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="เช่น สมชาย ใจดี" required autoComplete="name" spellCheck={false} className="h-11 rounded-xl border-gray-200 focus:border-[#2075f8] bg-white text-[#1d1d1d]" />
                                                </div>
                                                <div>
                                                    <label htmlFor="emp-nickname" className="text-sm font-semibold text-[#1d1d1d] block mb-2">ชื่อเล่น</label>
                                                    <Input id="emp-nickname" name="nickname" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} placeholder="เช่น ชาย" autoComplete="nickname" spellCheck={false} className="h-11 rounded-xl border-gray-200 focus:border-[#2075f8] bg-white text-[#1d1d1d]" />
                                                </div>
                                            </div>

                                            {/* Email */}
                                            <div>
                                                <label htmlFor="emp-email" className="text-sm font-semibold text-[#1d1d1d] block mb-2">
                                                    อีเมล <span className="text-red-500">*</span>
                                                </label>
                                                <Input id="emp-email" name="email" type="email" inputMode="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@company.com" required autoComplete="email" spellCheck={false} className="h-11 rounded-xl border-gray-200 focus:border-[#2075f8] bg-white text-[#1d1d1d]" />
                                            </div>

                                            <div>
                                                <label htmlFor="emp-password" className="text-sm font-semibold text-[#1d1d1d] block mb-2">
                                                    รหัสผ่าน {!isEditing && <span className="text-red-500">*</span>}
                                                    {isEditing && <span className="text-xs text-gray-400 ml-1">(เว้นว่างหากไม่ต้องการเปลี่ยน)</span>}
                                                </label>
                                                <Input id="emp-password" name="password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="อย่างน้อย 6 ตัวอักษร" required={!isEditing} minLength={6} autoComplete="new-password" className="h-11 rounded-xl border-gray-200 focus:border-[#2075f8] bg-white text-[#1d1d1d]" />
                                            </div>

                                            {/* Department + Position */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="emp-department" className="text-sm font-semibold text-[#1d1d1d] block mb-2">
                                                        แผนก <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input id="emp-department" name="department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="เช่น Engineering" required autoComplete="organization-title" className="h-11 rounded-xl border-gray-200 focus:border-[#2075f8] bg-white text-[#1d1d1d]" />
                                                </div>
                                                <div>
                                                    <label htmlFor="emp-position" className="text-sm font-semibold text-[#1d1d1d] block mb-2">
                                                        ตำแหน่ง <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input id="emp-position" name="position" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} placeholder="เช่น Developer" required autoComplete="organization-title" className="h-11 rounded-xl border-gray-200 focus:border-[#2075f8] bg-white text-[#1d1d1d]" />
                                                </div>
                                            </div>

                                            {/* Shift */}
                                            <div>
                                                <label className="text-sm font-semibold text-[#1d1d1d] block mb-2">
                                                    เวลาทำงาน <span className="text-red-500">*</span>
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <Input id="shift-start" name="shiftStartTime" type="time" value={form.shiftStartTime} onChange={e => setForm({ ...form, shiftStartTime: e.target.value })} required className="h-11 rounded-xl border-gray-200 focus:border-[#2075f8] bg-white tabular-nums text-[#1d1d1d] text-center" />
                                                    <span className="text-gray-400 font-medium">ถึง</span>
                                                    <Input id="shift-end" name="shiftEndTime" type="time" value={form.shiftEndTime} onChange={e => setForm({ ...form, shiftEndTime: e.target.value })} required className="h-11 rounded-xl border-gray-200 focus:border-[#2075f8] bg-white tabular-nums text-[#1d1d1d] text-center" />
                                                </div>
                                            </div>

                                            {/* Location Zone */}
                                            <div>
                                                <label htmlFor="emp-location" className="text-sm font-semibold text-[#1d1d1d] block mb-2">
                                                    <MapPin className="w-4 h-4 inline-block mr-1 text-[#6f6f6f]" />
                                                    โซนสถานที่ทำงาน <span className="text-gray-400 font-normal text-xs">(ไม่บังคับ)</span>
                                                </label>
                                                <select
                                                    id="emp-location"
                                                    className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-[#1d1d1d] focus:outline-none focus:ring-2 focus:ring-[#2075f8]/20 focus:border-[#2075f8] transition-shadow"
                                                    value={form.locationId}
                                                    onChange={e => setForm({ ...form, locationId: e.target.value })}
                                                >
                                                    <option value="">— ไม่กำหนดโซน (ลงเวลาได้ทุกที่บนโลก) —</option>
                                                    {locations.map(loc => (
                                                        <option key={loc.id} value={loc.id}>{loc.name} (ในระยะ {loc.radiusMeters} เมตร)</option>
                                                    ))}
                                                </select>
                                                <p className="mt-2 text-xs text-[#6f6f6f]">หากมีการตั้งค่าโซน พนักงานจะสามารถเช็คอินได้เมื่ออยู่ในระยะจำกัดเท่านั้น</p>
                                            </div>

                                            {/* ── Compensation ── */}
                                            <div className="border-t border-gray-100 pt-6 mt-4">
                                                <h4 className="text-base font-bold text-[#1d1d1d] mb-4 flex items-center gap-2">
                                                    <DollarSign className="w-5 h-5 text-emerald-500" />
                                                    ค่าจ้างและอัตรา OT
                                                </h4>

                                                {/* Base Wage */}
                                                <div className="mb-5">
                                                    <label htmlFor="emp-base-wage" className="text-sm font-semibold text-[#1d1d1d] block mb-2">
                                                        เงินเดือน/ค่าจ้างพื้นฐาน (บาท) <span className="text-gray-400 font-normal text-xs">(ไม่บังคับ)</span>
                                                    </label>
                                                    <Input
                                                        id="emp-base-wage" type="number" min="0" step="100"
                                                        value={form.baseWage}
                                                        onChange={e => setForm({ ...form, baseWage: e.target.value })}
                                                        placeholder="เช่น 15000"
                                                        className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 bg-white font-medium"
                                                    />
                                                </div>

                                                {/* OT Rate Toggle */}
                                                <div className="space-y-4">
                                                    <label className="text-sm font-semibold text-[#1d1d1d] block">อัตราการจ่าย OT ล่วงเวลา</label>
                                                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            className="w-5 h-5 rounded border-gray-300 text-[#2075f8] focus:ring-[#2075f8] cursor-pointer"
                                                            checked={form.otUseDefault}
                                                            onChange={e => setForm({ ...form, otUseDefault: e.target.checked })}
                                                        />
                                                        <span className="text-sm font-medium text-[#1d1d1d]">
                                                            ใช้อัตราหลักของบริษัท
                                                            <span className="ml-2 text-xs font-bold text-[#2075f8] bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                                                                {companySettings.defaultOtRateValue} {companySettings.defaultOtRateType === 'multiplier' ? 'เท่า' : 'บาท/ชม.'}
                                                            </span>
                                                        </span>
                                                    </label>

                                                    {!form.otUseDefault && (
                                                        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 space-y-4 animate-in slide-in-from-top-2">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="text-xs font-semibold text-[#6f6f6f] block mb-1.5">คำนวณแบบ</label>
                                                                    <select
                                                                        className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-[#1d1d1d] font-medium focus:outline-none focus:ring-2 focus:ring-[#2075f8]/20 focus:border-[#2075f8] transition-shadow"
                                                                        value={form.otType}
                                                                        onChange={e => setForm({ ...form, otType: e.target.value as 'multiplier' | 'fixed' })}
                                                                    >
                                                                        <option value="multiplier">ตัวคูณ (เท่าของค่าจ้าง)</option>
                                                                        <option value="fixed">เหมาจ่าย (บาท / ชั่วโมง)</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs font-semibold text-[#6f6f6f] block mb-1.5">ตัวเลข</label>
                                                                    <div className="relative">
                                                                        <Input
                                                                            type="number" step="0.1" min="0"
                                                                            value={form.otValue}
                                                                            onChange={e => setForm({ ...form, otValue: e.target.value })}
                                                                            placeholder={form.otType === 'multiplier' ? 'ตัวอย่าง: 1.5' : 'ตัวอย่าง: 50'}
                                                                            className="h-11 rounded-lg border-gray-200 focus:border-[#2075f8] pr-12 font-medium"
                                                                        />
                                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6f6f6f] pointer-events-none">
                                                                            {form.otType === 'multiplier' ? 'เท่า' : 'บาท'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-8 py-5 border-t border-gray-100 bg-white flex items-center justify-between shrink-0">
                                        <p className="text-sm font-medium text-gray-400"><span className="text-red-500 mr-1">*</span>ข้อมูลภาคบังคับ</p>
                                        <div className="flex gap-3">
                                            <Button type="button" variant="outline" onClick={closeFormModal} className="rounded-xl h-11 px-5 border-gray-200 text-[#1d1d1d] hover:bg-gray-50 font-semibold text-sm">ยกเลิก</Button>
                                            <Button type="submit" className="rounded-xl h-11 px-8 bg-gradient-to-r from-[#2075f8] to-[#1a64d4] hover:from-[#1a64d4] hover:to-[#1655b5] text-white shadow-sm font-semibold text-sm">{isEditing ? 'บันทึกการปรับปรุง' : 'เพิ่มพนักงานเข้าสู่ระบบ'}</Button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : null}
                </>,
                document.body
            )}
        </div>
    );
}
