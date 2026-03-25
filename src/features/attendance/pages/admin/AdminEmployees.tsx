import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAttendance } from '../../contexts/useAttendance';
import { QRCodeSVG } from 'qrcode.react';
import { regenerateQRApi } from '../../../../lib/api/auth-api';
import { verifyPinApi } from '../../../../lib/api/employees-api';
import { toast } from 'sonner';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    Plus, QrCode, X, Search, FileDown, Clock,
    Building2, ImagePlus, Trash2, Camera, SwitchCamera,
    CheckCircle2, AlertCircle, XCircle, MinusCircle, Users, Pencil,
    MapPin, DollarSign, Link2, Check, RefreshCw, AlertTriangle, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn, formatTime } from '@/lib/utils';
import { useTranslation } from '@/i18n';
import { useAdminTheme } from '@/hooks/useAdminTheme';

gsap.registerPlugin(ScrollTrigger);

// ── Image helpers ───────────────────────────────────────────────────────────

/**
 * Resize + center-crop image to a square, output as JPEG.
 * White background is applied so transparent PNGs render correctly.
 * @param dataUrl  source data URL (any image format)
 * @param size     output side length in px (default 256)
 * @param quality  JPEG quality 0–1 (default 0.82)
 */
async function resizeImage(dataUrl: string, size = 256, quality = 0.82): Promise<string> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const side = Math.min(img.width, img.height);
            const sx = (img.width - side) / 2;
            const sy = (img.height - side) / 2;
            const canvas = document.createElement('canvas');
            const out = Math.min(size, side);
            canvas.width = out;
            canvas.height = out;
            const ctx = canvas.getContext('2d');
            if (!ctx) { reject(new Error('Canvas not supported')); return; }
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, out, out);
            ctx.drawImage(img, sx, sy, side, side, 0, 0, out, out);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('ไม่สามารถโหลดรูปภาพได้'));
        img.src = dataUrl;
    });
}

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์ได้'));
        reader.readAsDataURL(file);
    });
}

/** Estimate encoded image size in KB from a data URL */
function estimateSizeKB(dataUrl: string): number {
    const base64 = dataUrl.split(',')[1] ?? '';
    return Math.round((base64.length * 3) / 4 / 1024);
}

const STATUS_STYLE: Record<string, { labelKey: string; dot: string; badge: string }> = {
    present: { labelKey: 'status.present', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    late: { labelKey: 'status.late', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
    absent: { labelKey: 'status.absent', dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 ring-red-200' },
    none: { labelKey: 'status.notCheckedIn', dot: 'bg-gray-400', badge: 'bg-gray-50 text-gray-500 ring-gray-200' },
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
    const { t } = useTranslation();
    const { dark } = useAdminTheme();
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
            gsap.fromTo(cardRef.current?.querySelector('.stat-icon') ?? null,
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
                'relative rounded-2xl p-6 border',
                dark ? 'bg-white/[0.06] border-white/10 shadow-none' : 'bg-white shadow-sm border-gray-100',
                dark ? 'hover:shadow-none' : 'hover:shadow-xl hover:shadow-gray-200/50',
                'transition-shadow duration-300 cursor-pointer overflow-hidden group'
            )}
            style={{ transformStyle: 'preserve-3d' }}
        >
            <div className={cn('absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none', dark && 'hidden')} />
            <div className="flex items-start justify-between relative z-10">
                <div>
                    <p className={cn('text-sm mb-1', dark ? 'text-white/50' : 'text-[#6f6f6f]')}>{title}</p>
                    <span className={cn('text-3xl font-bold tabular-nums', dark ? 'text-white' : 'text-[#1d1d1d]')}>
                        {displayValue.toLocaleString()}
                    </span>
                    <p className={cn('text-sm mt-1', dark ? 'text-white/30' : 'text-gray-400')}>{t('common.person')}</p>
                </div>
                <div className={cn('stat-icon w-12 h-12 rounded-xl flex items-center justify-center shrink-0', color)}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </div>
        </div>
    );
}

export function AdminEmployees() {
    const { t } = useTranslation();
    const { dark } = useAdminTheme();
    const { employees, logs, locations, addEmployee, updateEmployee, removeEmployee, companySettings, refreshAll, loading, error } = useAttendance();

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

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isProcessingImage, setIsProcessingImage] = useState(false);

    // Secure Action (Edit/Delete) + PIN
    const [secureActionId, setSecureActionId] = useState<string | null>(null);
    const [secureActionType, setSecureActionType] = useState<'delete' | 'edit' | null>(null);
    const [secureStep, setSecureStep] = useState<'confirm' | 'pin'>('confirm');
    const [pinInput, setPinInput] = useState('');
    const [pinError, setPinError] = useState('');
    const [pinAttempts, setPinAttempts] = useState(0);
    const [isPinVerifying, setIsPinVerifying] = useState(false);
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
        if (!navigator.mediaDevices?.getUserMedia) {
            setCameraError(t('admin.employees.cameraNotSupported'));
            return;
        }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
            });
            streamRef.current = stream;
            setAvatarMode('camera');
            // srcObject is assigned in useEffect below, after the <video> element mounts
        } catch (err) {
            if (err instanceof DOMException && err.name === 'NotAllowedError') {
                setCameraError(t('admin.employees.cameraPermission'));
            } else {
                setCameraError(t('admin.employees.cameraError'));
            }
        }
    }, []);

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        setAvatarMode('idle');
    }, []);

    // Assign MediaStream to <video> after it mounts (when avatarMode switches to 'camera')
    useEffect(() => {
        if (avatarMode === 'camera' && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [avatarMode]);

    const capturePhoto = useCallback(async () => {
        if (!videoRef.current) return;
        setIsProcessingImage(true);
        try {
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error('Canvas not supported');
            ctx.drawImage(videoRef.current, 0, 0);
            const raw = canvas.toDataURL('image/jpeg');
            const resized = await resizeImage(raw);
            setAvatarPreview(resized);
            stopCamera();
        } catch {
            toast.error(t('admin.employees.photoError'));
        } finally {
            setIsProcessingImage(false);
        }
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

    const handlePinDigit = async (digit: string) => {
        const locked = pinAttempts >= 3;
        if (locked || isDeleting || isPinVerifying) return;
        const next = (pinInput + digit).slice(0, 4);
        setPinInput(next);
        setPinError('');
        if (next.length < 4) PIN_REFS[next.length]?.current?.focus();
        if (next.length === 4) {
            setIsPinVerifying(true);
            try {
                const valid = await verifyPinApi(next);
                if (valid) {
                    if (secureActionType === 'delete') {
                        setIsDeleting(true);
                        try {
                            const target = employees.find(e => e.id === secureActionId);
                            await removeEmployee(secureActionId!);
                            toast.success(t('admin.employees.deleteSuccess', { name: target?.name ?? '' }));
                            closeSecureAction();
                        } catch (err) {
                            toast.error(err instanceof Error ? err.message : t('admin.employees.deleteFail'));
                            setPinInput('');
                            PIN_REFS[0]?.current?.focus();
                        } finally {
                            setIsDeleting(false);
                        }
                    } else if (secureActionType === 'edit') {
                        openEditForm(secureActionId!);
                        closeSecureAction();
                    }
                }
            } catch (err: unknown) {
                const status = (err as { status?: number }).status;
                if (status === 428) {
                    setPinError(t('admin.employees.pinNotSet'));
                } else {
                    const newAttempts = pinAttempts + 1;
                    setPinAttempts(newAttempts);
                    setPinError(newAttempts >= 3 ? t('admin.employees.pinLocked') : t('admin.employees.pinWrong', { n: String(3 - newAttempts) }));
                }
                setPinInput('');
                PIN_REFS[0]?.current?.focus();
            } finally {
                setIsPinVerifying(false);
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

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        // Reset input so the same file can be re-selected later
        e.target.value = '';
        if (!file.type.startsWith('image/')) {
            toast.error(t('admin.employees.imageTypeError'));
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error(t('admin.employees.imageSizeError'));
            return;
        }
        setIsProcessingImage(true);
        try {
            const raw = await readFileAsDataUrl(file);
            const resized = await resizeImage(raw);
            setAvatarPreview(resized);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t('admin.employees.imageLoadError'));
        } finally {
            setIsProcessingImage(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (isSubmitting) return;
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
            // When using company default, omit type/value — backend reads company settings
            // when calculating OT. Sending them risks schema rejection if company settings
            // use a fixed rate > multiplier range (e.g. 50 ฿/hr).
            ...(form.otUseDefault ? {} : {
                otRateType: form.otType,
                otRateValue: Number(form.otValue) || 0,
            }),
        };
        try {
            setIsSubmitting(true);
            if (isEditing && editingId) {
                await updateEmployee(editingId, form.password ? { ...payload, password: form.password } : payload);
                toast.success(t('admin.employees.updateSuccess', { name: form.name }));
            } else {
                await addEmployee({ ...payload, role: 'employee', password: form.password || 'password123' });
                toast.success(t('admin.employees.addSuccess', { name: form.name }));
            }
            closeFormModal();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t('common.genericError'));
        } finally {
            setIsSubmitting(false);
        }
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
        toast.success(t('admin.employees.saveQrSuccess'));
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
            toast.success(t('admin.employees.regenerateSuccess'));
        } catch {
            toast.error(t('admin.employees.regenerateFail'));
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

    if (loading && employees.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-[#044F88]" />
                <p className="text-sm text-[#6f6f6f]">{t('admin.employees.loading')}</p>
            </div>
        );
    }

    if (error && employees.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4">
                <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                    <AlertTriangle className="w-7 h-7 text-red-400" />
                </div>
                <div className="text-center">
                    <p className="text-sm font-semibold text-[#1d1d1d]">{t('admin.employees.loadFailed')}</p>
                    <p className="text-xs text-[#6f6f6f] mt-1">{error}</p>
                </div>
                <Button onClick={() => refreshAll()} variant="outline" className="gap-2 mt-2">
                    <RefreshCw className="w-4 h-4" /> {t('common.retry')}
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ── Page header ── */}
            <div className="page-header flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className={cn('text-2xl font-bold tracking-tight', dark ? 'text-white' : 'text-[#1d1d1d]')}>{t('admin.employees.title')}</h1>
                    <p className={cn('text-sm mt-1', dark ? 'text-white/50' : 'text-[#6f6f6f]')}>{t('admin.employees.totalDesc', { n: String(employees.length) })}</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    <div data-tour="employee-search" className="relative w-full sm:w-auto group focus-within:ring-4 focus-within:ring-[#044F88]/20 rounded-lg transition-all">
                        <Search className={cn('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none group-focus-within:text-[#044F88] transition-colors', dark ? 'text-white/30' : 'text-gray-400')} />
                        <Input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder={t('admin.employees.searchPlaceholder')}
                            className={cn('pl-9 w-full sm:w-64 focus:border-[#044F88] focus-visible:ring-0 transition-all rounded-lg h-10', dark ? 'bg-white/[0.06] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-gray-200')}
                            autoComplete="off"
                            spellCheck={false}
                        />
                    </div>
                    <Button data-tour="add-employee" onClick={openAddForm} className="bg-gradient-to-r from-[#044F88] to-[#00223A] hover:from-[#00223A] hover:to-[#00223A] text-white shadow-sm hover:shadow-md transition-all h-10 rounded-lg shrink-0">
                        <Plus className="w-4 h-4 mr-2" /> {t('admin.employees.addEmployee')}
                    </Button>
                </div>
            </div>

            {/* ── Stats grid (Match Dashboard) ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" style={{ perspective: '1000px' }}>
                <StatCard title={t('status.present')} value={stats.present} icon={STAT_ICONS.present} color={STAT_COLORS.present} delay={0.1} />
                <StatCard title={t('status.late')} value={stats.late} icon={STAT_ICONS.late} color={STAT_COLORS.late} delay={0.2} />
                <StatCard title={t('status.absent')} value={stats.absent} icon={STAT_ICONS.absent} color={STAT_COLORS.absent} delay={0.3} />
                <StatCard title={t('status.notCheckedIn')} value={stats.none} icon={STAT_ICONS.none} color={STAT_COLORS.none} delay={0.4} />
            </div>

            {/* ── Employee cards ── */}
            <div ref={sectionRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEmployees.map((emp, empIdx) => {
                    const todayLog = logs.find(l => l.employeeId === emp.id && l.date === todayDate);
                    const status = getStatus(emp.id);
                    const statusConfig = STATUS_STYLE[status];

                    return (
                        <div key={emp.id} {...(empIdx === 0 ? { 'data-tour': 'employee-card' } : {})} className={cn(
                            'emp-card relative group rounded-2xl border',
                            dark ? 'bg-white/[0.06] border-white/10 shadow-none hover:border-[#044F88]/30' : 'bg-white border-gray-100 shadow-sm hover:shadow-xl hover:shadow-gray-200/50 hover:border-[#044F88]/20',
                            'transition-all duration-300 flex flex-col',
                        )}>
                            {/* ── Action icons (top-right) ── */}
                            <div className="absolute top-4 right-4 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => { setSecureActionId(emp.id); setSecureActionType('edit'); setSecureStep('pin'); setTimeout(() => PIN_REFS[0]?.current?.focus(), 50); }}
                                    aria-label={t('admin.employees.editLabel')}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-white hover:bg-[#044F88] transition-colors"
                                >
                                    <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => { setSecureActionId(emp.id); setSecureActionType('delete'); setSecureStep('confirm'); }}
                                    aria-label={t('admin.employees.deleteLabel')}
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
                                            className="w-14 h-14 rounded-full object-cover shrink-0 bg-[#044F88]/5 ring-2 ring-white shadow-sm"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#044F88] to-[#00223A] flex items-center justify-center text-white text-lg font-bold shrink-0 ring-2 ring-white shadow-sm">
                                            {emp.name.charAt(0)}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1 pt-1">
                                        <h4 className={cn('font-semibold truncate group-hover:text-[#044F88] transition-colors', dark ? 'text-white' : 'text-[#1d1d1d]')}>
                                            {emp.name}
                                            {emp.nickname && (
                                                <span className={cn('ml-1.5 font-normal text-sm', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>({emp.nickname})</span>
                                            )}
                                        </h4>
                                        <p className={cn('text-sm truncate mt-0.5', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>{emp.position}</p>
                                        {/* Status badge */}
                                        <span className={cn(
                                            'mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium ring-1',
                                            statusConfig.badge,
                                        )}>
                                            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusConfig.dot)} />
                                            {t(statusConfig.labelKey)}
                                        </span>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className={cn('border-t', dark ? 'border-white/10' : 'border-gray-100')} />

                                {/* Info row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-[#044F88]/5 flex items-center justify-center shrink-0">
                                            <Clock className="w-4 h-4 text-[#044F88]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">{t('admin.employees.shift')}</p>
                                            <p className={cn('text-xs font-semibold tabular-nums truncate', dark ? 'text-white' : 'text-[#1d1d1d]')}>{emp.shiftStartTime}–{emp.shiftEndTime}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                                            <Building2 className="w-4 h-4 text-indigo-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">{t('admin.employees.department')}</p>
                                            <p className={cn('text-xs font-semibold truncate', dark ? 'text-white' : 'text-[#1d1d1d]')}>{emp.department}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Check-in row */}
                                <div className={cn(
                                    'flex items-center justify-between rounded-xl px-4 py-3 border',
                                    todayLog?.checkInTime
                                        ? (dark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50/50 border-emerald-100/50')
                                        : (dark ? 'bg-white/[0.03] border-white/5' : 'bg-gray-50/50 border-gray-100/50'),
                                )}>
                                    <p className={cn('text-xs font-medium', dark ? 'text-white/40' : 'text-[#6f6f6f]')}>{t('admin.employees.checkedInToday')}</p>
                                    {todayLog?.checkInTime
                                        ? <p className="text-xs font-bold text-emerald-600 tabular-nums">{formatTime(todayLog.checkInTime)}</p>
                                        : <p className="text-xs text-gray-400">{t('admin.employees.noData')}</p>
                                    }
                                </div>
                            </div>

                            {/* ── Card footer ── */}
                            <div className="px-6 pb-6 pt-0">
                                <Button
                                    variant="outline"
                                    {...(empIdx === 0 ? { 'data-tour': 'qr-button' } : {})}
                                    onClick={() => setShowQRModal(emp.id)}
                                    className={cn('w-full border transition-colors rounded-xl h-10',
                                        dark ? 'text-white border-white/20 hover:text-white hover:bg-white/10' : 'text-[#6f6f6f] border-gray-200 hover:text-[#044F88] hover:bg-[#044F88]/5 hover:border-[#044F88]/20'
                                    )}
                                >
                                    <QrCode className="w-4 h-4 mr-2" /> {t('admin.employees.scanAttendance')}
                                </Button>
                            </div>
                        </div>
                    );
                })}

                {/* Empty state */}
                {filteredEmployees.length === 0 ? (
                    <div className={cn('col-span-1 md:col-span-2 lg:col-span-3 py-24 text-center rounded-2xl border', dark ? 'bg-white/[0.06] border-white/10 shadow-none' : 'bg-white border-gray-100 shadow-sm')}>
                        <Users className={cn('w-12 h-12 mx-auto mb-4', dark ? 'text-white/20' : 'text-gray-300')} />
                        <p className={cn('font-semibold text-lg', dark ? 'text-white' : 'text-[#1d1d1d]')}>{t('admin.employees.noResults')}</p>
                        <p className={cn('text-sm mt-1', dark ? 'text-white/50' : 'text-[#6f6f6f]')}>{t('admin.employees.noResultsHint')}</p>
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
                                <div className="relative bg-gradient-to-br from-[#044F88] to-[#00223A] px-6 pt-5 pb-10">
                                    <button
                                        onClick={closeQRModal}
                                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/35 flex items-center justify-center text-white transition-colors"
                                        aria-label={t('common.close')}
                                    >
                                        <X className="w-4 h-4" />
                                    </button>

                                    <p className="text-[11px] font-semibold text-[#044F88]/20 uppercase tracking-widest mb-3">{t('admin.employees.qrTitle')}</p>

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
                                            <p className="text-sm text-white/70 truncate mt-0.5">
                                                {selectedEmp?.position}
                                                {selectedEmp?.department && (
                                                    <span className="text-white/50"> · {selectedEmp.department}</span>
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
                                            <span className="absolute top-0 left-0 w-5 h-5 border-t-[3px] border-l-[3px] border-[#044F88] rounded-tl-lg" />
                                            <span className="absolute top-0 right-0 w-5 h-5 border-t-[3px] border-r-[3px] border-[#044F88] rounded-tr-lg" />
                                            <span className="absolute bottom-0 left-0 w-5 h-5 border-b-[3px] border-l-[3px] border-[#044F88] rounded-bl-lg" />
                                            <span className="absolute bottom-0 right-0 w-5 h-5 border-b-[3px] border-r-[3px] border-[#044F88] rounded-br-lg" />
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
                                            <QrCode className="w-3.5 h-3.5 text-[#044F88]" />
                                            {t('admin.employees.scanToLogin')}
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
                                            {t('admin.employees.saveQr')}
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
                                                ? <><Check className="w-4 h-4" /> {t('admin.employees.copied')}</>
                                                : <><Link2 className="w-4 h-4" /> {t('admin.employees.copyLink')}</>
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
                                                {t('admin.employees.regenerateQr')}
                                            </button>
                                        ) : (
                                            <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-3">
                                                <div className="flex items-start gap-2.5">
                                                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                                                    <div>
                                                        <p className="text-sm font-semibold text-red-700">{t('admin.employees.regenerateConfirm')}</p>
                                                        <p className="text-xs text-red-500 mt-0.5">{t('admin.employees.regenerateWarning')}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => setConfirmRegenerate(false)}
                                                        className="h-9 text-sm rounded-lg border-gray-200"
                                                    >
                                                        {t('common.cancel')}
                                                    </Button>
                                                    <Button
                                                        onClick={() => showQRModal && handleRegenerateQR(showQRModal)}
                                                        className="h-9 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white"
                                                    >
                                                        {t('admin.employees.regenerateBtn')}
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
                                <div className={cn('rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative', dark ? 'bg-[#1e293b]' : 'bg-white')}>
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
                                                <h3 className="text-xl font-bold text-[#1d1d1d] mb-2">{t('admin.employees.deleteConfirmTitle')}</h3>
                                                <p className="text-[15px] text-[#6f6f6f] mb-8 leading-relaxed">
                                                    {t('admin.employees.deleteConfirmMsg', { name: `${target?.name ?? ''}${target?.nickname ? ` (${target.nickname})` : ''}` })}
                                                    <span className="text-red-500 font-medium text-sm mt-2 block">{t('admin.employees.deleteWarning')}</span>
                                                </p>
                                                <div className="flex gap-3">
                                                    <Button variant="outline" className="flex-1 rounded-xl h-12 font-medium" onClick={closeSecureAction}>{t('common.cancel')}</Button>
                                                    <Button className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl h-12 font-medium"
                                                        onClick={() => { setSecureStep('pin'); setTimeout(() => PIN_REFS[0]?.current?.focus(), 50); }}>
                                                        {t('admin.employees.deleteConfirmBtn')}
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5', locked ? 'bg-gray-100' : (isDelete ? 'bg-red-50' : 'bg-[#044F88/10]'))}>
                                                    <CheckCircle2 className={cn('w-8 h-8', locked ? 'text-gray-400' : (isDelete ? 'text-red-500' : 'text-[#044F88]'))} />
                                                </div>
                                                <h3 className="text-xl font-bold text-[#1d1d1d] mb-2">{t('admin.employees.pinTitle')}</h3>
                                                <p className="text-sm text-[#6f6f6f] mb-6">{t('admin.employees.pinDesc')}</p>

                                                {/* PIN dots */}
                                                <div className="flex justify-center gap-4 mb-6">
                                                    {['d0', 'd1', 'd2', 'd3'].map((id, i) => (
                                                        <div key={id} className={cn(
                                                            'w-14 h-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-bold transition-all duration-200',
                                                            i < pinInput.length ? (isDelete ? 'border-red-400 bg-red-50 text-red-500 scale-105' : 'border-[#044F88]/80 bg-[#044F88]/5 text-[#044F88] scale-105') : 'border-gray-200 bg-gray-50',
                                                            locked && 'opacity-40',
                                                        )}>
                                                            {i < pinInput.length ? '●' : ''}
                                                        </div>
                                                    ))}
                                                </div>

                                                {pinError && <p className={cn('text-sm mb-4 font-medium', locked ? 'text-[#6f6f6f]' : 'text-red-500')}>{pinError}</p>}

                                                {/* Numpad */}
                                                {isDeleting || isPinVerifying ? (
                                                    <div className="flex flex-col items-center gap-3 mb-6 py-4">
                                                        <Loader2 className={cn('w-8 h-8 animate-spin', isDeleting ? 'text-red-400' : 'text-[#044F88]')} />
                                                        <p className="text-sm text-[#6f6f6f]">{isDeleting ? t('admin.employees.deletingEmployee') : t('admin.employees.pinVerifying')}</p>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'empty', '0', '⌫'].map((k) =>
                                                            k === 'empty' ? <div key="empty" /> :
                                                                k === '⌫' ? (
                                                                    <button key="backspace" type="button" disabled={locked}
                                                                        onClick={handlePinBackspace}
                                                                        className="h-14 rounded-2xl bg-gray-100 hover:bg-gray-200 text-[#6f6f6f] font-bold text-xl transition-colors disabled:opacity-30 touch-manipulation">
                                                                        {k}
                                                                    </button>
                                                                ) : (
                                                                    <button key={k} type="button" disabled={locked || pinInput.length >= 4}
                                                                        onClick={() => handlePinDigit(k)}
                                                                        className="h-14 rounded-2xl bg-white border border-gray-200 shadow-sm hover:border-[#044F88] hover:text-[#044F88] text-[#1d1d1d] font-semibold text-xl transition-all disabled:opacity-30 touch-manipulation">
                                                                        {k}
                                                                    </button>
                                                                )
                                                        )}
                                                    </div>
                                                )}
                                                <Button variant="ghost" className="w-full text-[#6f6f6f] font-medium" disabled={isDeleting} onClick={closeSecureAction}>{t('common.cancel')}</Button>
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
                            <div className={cn('rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden relative', dark ? 'bg-[#1e293b]' : 'bg-white')}>

                                {/* Header */}
                                <div className={cn('flex items-center justify-between px-8 py-6 border-b shrink-0', dark ? 'border-white/10 bg-[#1e293b]' : 'border-gray-100 bg-white')}>
                                    <div>
                                        <h2 className={cn('text-xl font-bold', dark ? 'text-white' : 'text-[#1d1d1d]')}>{isEditing ? t('admin.employees.formTitleEdit') : t('admin.employees.formTitleAdd')}</h2>
                                        <p className={cn('text-sm mt-1', dark ? 'text-white/50' : 'text-[#6f6f6f]')}>{isEditing ? t('admin.employees.formDescEdit') : t('admin.employees.formDescAdd')}</p>
                                    </div>
                                    <button type="button" onClick={closeFormModal} className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-[#1d1d1d] transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleFormSubmit} className={cn('overflow-y-auto', dark ? 'bg-white/[0.02]' : 'bg-gray-50/30')}>
                                    <div className="px-8 py-6 flex flex-col md:flex-row gap-8">

                                        {/* LEFT: Avatar */}
                                        <div className="w-full md:w-56 shrink-0 flex flex-col items-center gap-4">
                                            <p className="text-sm font-semibold text-[#1d1d1d] self-start">
                                                {t('admin.employees.avatar')} <span className="text-gray-400 font-normal text-xs">{t('admin.employees.avatarOptional')}</span>
                                            </p>

                                            {/* Avatar circle — camera / preview / placeholder */}
                                            <div className="relative w-48 h-48">
                                                <div className={cn(
                                                    'w-48 h-48 rounded-full overflow-hidden border-2 border-dashed bg-white flex items-center justify-center shadow-sm transition-colors',
                                                    isProcessingImage ? 'border-[#044F88]/30' : 'border-gray-200 hover:border-[#044F88]/30',
                                                )}>
                                                    {avatarMode === 'camera' ? (
                                                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                                    ) : avatarPreview ? (
                                                        <img src={avatarPreview} alt={t('admin.employees.avatar')} width={192} height={192} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="flex flex-col items-center gap-3 text-gray-300">
                                                            <ImagePlus className="w-12 h-12" />
                                                            <span className="text-sm font-medium">{t('admin.employees.noImage')}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Processing overlay */}
                                                {isProcessingImage && (
                                                    <div className="absolute inset-0 rounded-full bg-white/75 flex flex-col items-center justify-center gap-2">
                                                        <Loader2 className="w-8 h-8 text-[#044F88] animate-spin" />
                                                        <span className="text-xs font-medium text-[#044F88]">{t('admin.employees.processing')}</span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Image size badge */}
                                            {avatarPreview && !isProcessingImage && (
                                                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                                                    <CheckCircle2 className="w-3 h-3 shrink-0" />
                                                    {estimateSizeKB(avatarPreview)} KB · 256×256 px
                                                </div>
                                            )}

                                            {cameraError && <p className="text-xs text-red-500 font-medium text-center">{cameraError}</p>}

                                            {/* Action buttons */}
                                            {avatarMode === 'camera' ? (
                                                <div className="flex flex-col gap-2 w-full mt-2">
                                                    <Button
                                                        type="button"
                                                        onClick={capturePhoto}
                                                        disabled={isProcessingImage}
                                                        className="w-full bg-[#044F88] hover:bg-[#00223A] text-white rounded-xl h-10 disabled:opacity-60"
                                                    >
                                                        {isProcessingImage
                                                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('admin.employees.processingDots')}</>
                                                            : <><Camera className="w-4 h-4 mr-2" /> {t('admin.employees.takePhoto')}</>
                                                        }
                                                    </Button>
                                                    <Button type="button" variant="ghost" onClick={stopCamera} disabled={isProcessingImage} className="w-full text-[#6f6f6f] rounded-xl h-10">
                                                        {t('admin.employees.cancelCamera')}
                                                    </Button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-2 w-full mt-2">
                                                    <Button
                                                        type="button"
                                                        onClick={startCamera}
                                                        disabled={isProcessingImage}
                                                        variant="outline"
                                                        className="w-full text-[#1d1d1d] border-gray-200 hover:bg-gray-50 rounded-xl h-10 disabled:opacity-60"
                                                    >
                                                        <SwitchCamera className="w-4 h-4 mr-2 text-[#044F88]" /> {t('admin.employees.fromCamera')}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        onClick={() => avatarInputRef.current?.click()}
                                                        disabled={isProcessingImage}
                                                        variant="outline"
                                                        className="w-full text-[#1d1d1d] border-gray-200 hover:bg-gray-50 rounded-xl h-10 disabled:opacity-60"
                                                    >
                                                        {isProcessingImage
                                                            ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t('admin.employees.processingDots')}</>
                                                            : <><ImagePlus className="w-4 h-4 mr-2 text-indigo-500" /> {t('admin.employees.uploadImage')}</>
                                                        }
                                                    </Button>
                                                    {avatarPreview && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            disabled={isProcessingImage}
                                                            onClick={() => { setAvatarPreview(null); if (avatarInputRef.current) avatarInputRef.current.value = ''; }}
                                                            className="w-full text-red-500 hover:bg-red-50 rounded-xl h-10 mt-1"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" /> {t('common.delete')}
                                                        </Button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Hidden file input — explicit MIME types for better mobile picker */}
                                            <input
                                                ref={avatarInputRef}
                                                type="file"
                                                accept="image/jpeg,image/png,image/webp,image/gif"
                                                className="hidden"
                                                onChange={handleAvatarChange}
                                            />
                                        </div>

                                        {/* RIGHT: Fields */}
                                        <div className="flex-1 space-y-6">
                                            {/* Name + Nickname */}
                                            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
                                                <div>
                                                    <label htmlFor="emp-name" className="text-sm font-semibold text-[#1d1d1d] block mb-2">
                                                        {t('admin.employees.nameLabel')} <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input id="emp-name" name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" required autoComplete="name" spellCheck={false} className="h-11 rounded-xl border-gray-200 focus:border-[#044F88] bg-white text-[#1d1d1d]" />
                                                </div>
                                                <div>
                                                    <label htmlFor="emp-nickname" className="text-sm font-semibold text-[#1d1d1d] block mb-2">{t('admin.employees.nicknameLabel')}</label>
                                                    <Input id="emp-nickname" name="nickname" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} placeholder="Jay" autoComplete="nickname" spellCheck={false} className="h-11 rounded-xl border-gray-200 focus:border-[#044F88] bg-white text-[#1d1d1d]" />
                                                </div>
                                            </div>

                                            {/* Email */}
                                            <div>
                                                <label htmlFor="emp-email" className="text-sm font-semibold text-[#1d1d1d] block mb-2">
                                                    {t('admin.employees.emailLabel')} <span className="text-red-500">*</span>
                                                </label>
                                                <Input id="emp-email" name="email" type="email" inputMode="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@company.com" required autoComplete="email" spellCheck={false} className="h-11 rounded-xl border-gray-200 focus:border-[#044F88] bg-white text-[#1d1d1d]" />
                                            </div>

                                            <div>
                                                <label htmlFor="emp-password" className="text-sm font-semibold text-[#1d1d1d] block mb-2">
                                                    {isEditing ? t('admin.employees.passwordNewLabel') : t('admin.employees.passwordLabel')} {!isEditing && <span className="text-red-500">*</span>}
                                                    {isEditing && <span className="text-xs text-gray-400 ml-1">{t('admin.employees.passwordHint')}</span>}
                                                </label>
                                                <Input id="emp-password" name="password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="******" required={!isEditing} minLength={6} autoComplete="new-password" className="h-11 rounded-xl border-gray-200 focus:border-[#044F88] bg-white text-[#1d1d1d]" />
                                            </div>

                                            {/* Department + Position */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div>
                                                    <label htmlFor="emp-department" className="text-sm font-semibold text-[#1d1d1d] block mb-2">
                                                        {t('admin.employees.departmentLabel')} <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input id="emp-department" name="department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Engineering" required autoComplete="organization-title" className="h-11 rounded-xl border-gray-200 focus:border-[#044F88] bg-white text-[#1d1d1d]" />
                                                </div>
                                                <div>
                                                    <label htmlFor="emp-position" className="text-sm font-semibold text-[#1d1d1d] block mb-2">
                                                        {t('admin.employees.positionLabel')} <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input id="emp-position" name="position" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} placeholder="Developer" required autoComplete="organization-title" className="h-11 rounded-xl border-gray-200 focus:border-[#044F88] bg-white text-[#1d1d1d]" />
                                                </div>
                                            </div>

                                            {/* Shift */}
                                            <div>
                                                <label className="text-sm font-semibold text-[#1d1d1d] block mb-2">
                                                    {t('admin.employees.shiftLabel')} <span className="text-red-500">*</span>
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <Input id="shift-start" name="shiftStartTime" type="time" value={form.shiftStartTime} onChange={e => setForm({ ...form, shiftStartTime: e.target.value })} required className="h-11 rounded-xl border-gray-200 focus:border-[#044F88] bg-white tabular-nums text-[#1d1d1d] text-center" />
                                                    <span className="text-gray-400 font-medium">-</span>
                                                    <Input id="shift-end" name="shiftEndTime" type="time" value={form.shiftEndTime} onChange={e => setForm({ ...form, shiftEndTime: e.target.value })} required className="h-11 rounded-xl border-gray-200 focus:border-[#044F88] bg-white tabular-nums text-[#1d1d1d] text-center" />
                                                </div>
                                            </div>

                                            {/* Location Zone */}
                                            <div>
                                                <label htmlFor="emp-location" className="text-sm font-semibold text-[#1d1d1d] block mb-2">
                                                    <MapPin className="w-4 h-4 inline-block mr-1 text-[#6f6f6f]" />
                                                    {t('admin.employees.locationLabel')} <span className="text-gray-400 font-normal text-xs">{t('admin.employees.avatarOptional')}</span>
                                                </label>
                                                <select
                                                    id="emp-location"
                                                    className="w-full h-11 rounded-xl border border-gray-200 bg-white px-4 text-sm text-[#1d1d1d] focus:outline-none focus:ring-2 focus:ring-[#044F88]/20 focus:border-[#044F88] transition-shadow"
                                                    value={form.locationId}
                                                    onChange={e => setForm({ ...form, locationId: e.target.value })}
                                                >
                                                    <option value="">—</option>
                                                    {locations.map(loc => (
                                                        <option key={loc.id} value={loc.id}>{loc.name} ({loc.radiusMeters} {t('common.meters')})</option>
                                                    ))}
                                                </select>
                                                <p className="mt-2 text-xs text-[#6f6f6f]"></p>
                                            </div>

                                            {/* ── Compensation ── */}
                                            <div className="border-t border-gray-100 pt-6 mt-4">
                                                <h4 className="text-base font-bold text-[#1d1d1d] mb-4 flex items-center gap-2">
                                                    <DollarSign className="w-5 h-5 text-emerald-500" />
                                                    {t('admin.employees.otRateTitle')}
                                                </h4>

                                                {/* Base Wage */}
                                                <div className="mb-5">
                                                    <label htmlFor="emp-base-wage" className="text-sm font-semibold text-[#1d1d1d] block mb-2">
                                                        {t('admin.employees.wageLabel')} <span className="text-gray-400 font-normal text-xs">{t('admin.employees.avatarOptional')}</span>
                                                    </label>
                                                    <Input
                                                        id="emp-base-wage" type="number" min="0" step="100"
                                                        value={form.baseWage}
                                                        onChange={e => setForm({ ...form, baseWage: e.target.value })}
                                                        placeholder="15000"
                                                        className="h-11 rounded-xl border-gray-200 focus:border-emerald-500 bg-white font-medium"
                                                    />
                                                </div>

                                                {/* OT Rate Toggle */}
                                                <div className="space-y-4">
                                                    <label className="text-sm font-semibold text-[#1d1d1d] block">{t('admin.employees.otRateTitle')}</label>
                                                    <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                                                        <input
                                                            type="checkbox"
                                                            className="w-5 h-5 rounded border-gray-300 text-[#044F88] focus:ring-[#044F88] cursor-pointer"
                                                            checked={form.otUseDefault}
                                                            onChange={e => setForm({ ...form, otUseDefault: e.target.checked })}
                                                        />
                                                        <span className="text-sm font-medium text-[#1d1d1d]">
                                                            {t('admin.employees.otUseDefault')}
                                                            <span className="ml-2 text-xs font-bold text-[#044F88] bg-[#044F88]/5 border border-[#044F88]/10 px-2 py-0.5 rounded-full">
                                                                {companySettings.defaultOtRateValue} {companySettings.defaultOtRateType === 'multiplier' ? t('admin.employees.otMultiplierUnit') : t('admin.employees.otFixedUnit')}
                                                            </span>
                                                        </span>
                                                    </label>

                                                    {!form.otUseDefault && (
                                                        <div className="p-4 rounded-xl border border-[#044F88]/10 bg-[#044F88]/5/50 space-y-4 animate-in slide-in-from-top-2">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                <div>
                                                                    <label className="text-xs font-semibold text-[#6f6f6f] block mb-1.5">{t('admin.employees.otCalcType')}</label>
                                                                    <select
                                                                        className="w-full h-11 rounded-lg border border-gray-200 bg-white px-3 text-sm text-[#1d1d1d] font-medium focus:outline-none focus:ring-2 focus:ring-[#044F88]/20 focus:border-[#044F88] transition-shadow"
                                                                        value={form.otType}
                                                                        onChange={e => setForm({ ...form, otType: e.target.value as 'multiplier' | 'fixed' })}
                                                                    >
                                                                        <option value="multiplier">{t('admin.employees.otMultiplierLabel')}</option>
                                                                        <option value="fixed">{t('admin.employees.otFixedLabel')}</option>
                                                                    </select>
                                                                </div>
                                                                <div>
                                                                    <label className="text-xs font-semibold text-[#6f6f6f] block mb-1.5">{t('admin.employees.otValueLabel')}</label>
                                                                    <div className="relative">
                                                                        <Input
                                                                            type="number" step="0.1" min="0"
                                                                            value={form.otValue}
                                                                            onChange={e => setForm({ ...form, otValue: e.target.value })}
                                                                            placeholder={form.otType === 'multiplier' ? t('admin.employees.otMultiplierPlaceholder') : t('admin.employees.otFixedPlaceholder')}
                                                                            className="h-11 rounded-lg border-gray-200 focus:border-[#044F88] pr-12 font-medium"
                                                                        />
                                                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-[#6f6f6f] pointer-events-none">
                                                                            {form.otType === 'multiplier' ? t('admin.employees.otMultiplierUnit') : t('common.baht')}
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
                                    <div className={cn('px-8 py-5 border-t flex items-center justify-between shrink-0', dark ? 'border-white/10 bg-[#1e293b]' : 'border-gray-100 bg-white')}>
                                        <p className="text-sm font-medium text-gray-400"><span className="text-red-500 mr-1">*</span>{t('admin.employees.required')}</p>
                                        <div className="flex gap-3">
                                            <Button type="button" variant="outline" onClick={closeFormModal} disabled={isSubmitting} className="rounded-xl h-11 px-5 border-gray-200 text-[#1d1d1d] hover:bg-gray-50 font-semibold text-sm disabled:opacity-50">{t('common.cancel')}</Button>
                                            <Button type="submit" disabled={isSubmitting} className="rounded-xl h-11 px-8 bg-gradient-to-r from-[#044F88] to-[#00223A] hover:from-[#00223A] hover:to-[#00223A] text-white shadow-sm font-semibold text-sm disabled:opacity-70 min-w-[160px]">
                                                {isSubmitting
                                                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('common.saving')}</>
                                                    : (isEditing ? t('admin.employees.saveEdit') : t('admin.employees.saveAdd'))
                                                }
                                            </Button>
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
