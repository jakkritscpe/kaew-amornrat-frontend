import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAttendance } from '../../contexts/AttendanceContext';
import { QRCodeSVG } from 'qrcode.react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
    Plus, QrCode, X, Search, FileDown, Clock,
    Building2, ImagePlus, Trash2, Camera, SwitchCamera,
    CheckCircle2, AlertCircle, XCircle, MinusCircle, Users, Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger);

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
    present: { label: 'มาทำงาน', dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
    late: { label: 'มาสาย', dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 ring-amber-200' },
    absent: { label: 'ขาดงาน', dot: 'bg-red-500', badge: 'bg-red-50 text-red-700 ring-red-200' },
    none: { label: 'ยังไม่เช็คอิน', dot: 'bg-slate-300', badge: 'bg-slate-50 text-slate-500 ring-slate-200' },
};

const STAT_ICONS: Record<string, React.ReactNode> = {
    present: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
    late: <AlertCircle className="w-4 h-4 text-amber-500" />,
    absent: <XCircle className="w-4 h-4 text-red-500" />,
    none: <MinusCircle className="w-4 h-4 text-slate-400" />,
};

type AvatarMode = 'idle' | 'camera';

export function AdminEmployees() {
    const { employees, logs, addEmployee, updateEmployee, removeEmployee } = useAttendance();

    const [searchTerm, setSearchTerm] = useState('');
    const [showQRModal, setShowQRModal] = useState<string | null>(null);
    const [showFormModal, setShowFormModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '', nickname: '', email: '', department: '', position: '',
        shiftStartTime: '09:00', shiftEndTime: '18:00',
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
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const todayDate = new Date().toISOString().split('T')[0];

    const filteredEmployees = employees.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.nickname ?? '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ── Summary stats ──
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

    // ── GSAP ──
    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo('.emp-card',
                { y: 36, opacity: 0, scale: 0.96 },
                {
                    y: 0, opacity: 1, scale: 1,
                    duration: 0.55, stagger: 0.07, ease: 'power3.out',
                    scrollTrigger: { trigger: sectionRef.current, start: 'top 80%', toggleActions: 'play none none none' },
                }
            );
        });
        return () => ctx.revert();
    }, [filteredEmployees.length]);

    // ── Webcam ──
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
        setForm({ name: '', nickname: '', email: '', department: '', position: '', shiftStartTime: '09:00', shiftEndTime: '18:00' });
        setAvatarPreview(null);
        setShowFormModal(true);
    }, []);

    const openEditForm = useCallback((id: string) => {
        const emp = employees.find(e => e.id === id);
        if (!emp) return;
        setForm({
            name: emp.name, nickname: emp.nickname || '', email: emp.email || '',
            department: emp.department, position: emp.position,
            shiftStartTime: emp.shiftStartTime || '09:00', shiftEndTime: emp.shiftEndTime || '18:00'
        });
        setAvatarPreview(emp.avatarUrl || null);
        setIsEditing(true);
        setEditingId(id);
        setShowFormModal(true);
    }, [employees]);

    const closeFormModal = useCallback(() => {
        stopCamera();
        setShowFormModal(false);
        setAvatarPreview(null);
        setAvatarMode('idle');
        setCameraError(null);
        setForm({ name: '', nickname: '', email: '', department: '', position: '', shiftStartTime: '09:00', shiftEndTime: '18:00' });
        setIsEditing(false);
        setEditingId(null);
    }, [stopCamera]);

    // ── Secure Action + PIN ──
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

    // ── Misc ──
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
        if (isEditing && editingId) {
            updateEmployee(editingId, { ...form, avatarUrl: avatarPreview ?? undefined });
        } else {
            addEmployee({ ...form, role: 'employee', avatarUrl: avatarPreview ?? undefined });
        }
        closeFormModal();
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
            a.download = `qr-${showQRModal}.png`;
            a.href = canvas.toDataURL('image/png');
            a.click();
        };
        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    };

    const selectedEmp = employees.find(e => e.id === showQRModal);

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50/60 p-6 space-y-6">

            {/* ── Page header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-balance">จัดการพนักงาน</h1>
                    <p className="text-sm text-slate-500 mt-0.5">ทั้งหมด {employees.length} คน · สืบค้นและจัดการรายชื่อพนักงาน</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-auto group focus-within:ring-4 focus-within:ring-blue-500/20 rounded-md transition-all">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
                        <Input
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="ค้นหาชื่อ ชื่อเล่น หรือแผนก…"
                            className="pl-9 w-full sm:w-64 bg-white border-slate-200 focus:border-blue-400 focus-visible:ring-4 focus-visible:ring-blue-500/20 transition-all"
                            autoComplete="off"
                            spellCheck={false}
                        />
                    </div>
                    <Button onClick={openAddForm} className="bg-blue-600 hover:bg-blue-700 shadow-sm shrink-0">
                        <Plus className="w-4 h-4 mr-2" /> เพิ่มพนักงาน
                    </Button>
                </div>
            </div>

            {/* ── Stats strip ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {([
                    { key: 'present', label: 'มาทำงาน', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-100' },
                    { key: 'late', label: 'มาสาย', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-100' },
                    { key: 'absent', label: 'ขาดงาน', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-100' },
                    { key: 'none', label: 'ยังไม่เช็คอิน', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-100' },
                ] as const).map(s => (
                    <div key={s.key} className={cn('flex items-center gap-3 rounded-xl px-4 py-3 border', s.bg, s.border)}>
                        {STAT_ICONS[s.key]}
                        <div>
                            <p className={cn('text-xl font-bold leading-none', s.text)}>{stats[s.key]}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Employee cards ── */}
            <div ref={sectionRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredEmployees.map(emp => {
                    const todayLog = logs.find(l => l.employeeId === emp.id && l.date === todayDate);
                    const status = getStatus(emp.id);
                    const statusConfig = STATUS_CONFIG[status];

                    return (
                        <div key={emp.id} className={cn(
                            'emp-card relative group bg-white rounded-2xl border border-slate-100 shadow-sm',
                            'hover:shadow-md hover:shadow-slate-200/60 hover:-translate-y-0.5',
                            'transition-all duration-300 flex flex-col',
                        )}>
                            {/* ── Action icons (top-right) ── */}
                            <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => { setSecureActionId(emp.id); setSecureActionType('edit'); setSecureStep('pin'); setTimeout(() => PIN_REFS[0]?.current?.focus(), 50); }}
                                    aria-label="แก้ไขพนักงาน"
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                    <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => { setSecureActionId(emp.id); setSecureActionType('delete'); setSecureStep('confirm'); }}
                                    aria-label="ลบพนักงาน"
                                    className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            {/* ── Card body ── */}
                            <div className="p-5 flex-1 flex flex-col gap-4">
                                {/* Top: avatar + info */}
                                <div className="flex items-start gap-3">
                                    <img
                                        src={emp.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=eff6ff&color=1e3a8a&bold=true`}
                                        alt={emp.name}
                                        width={48} height={48}
                                        className="w-12 h-12 rounded-xl object-cover shrink-0 bg-blue-100"
                                        loading="lazy"
                                    />
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-semibold text-slate-900 truncate leading-snug text-balance">
                                            {emp.name}
                                            {emp.nickname && (
                                                <span className="ml-1.5 font-normal text-slate-400 text-sm">({emp.nickname})</span>
                                            )}
                                        </h4>
                                        <p className="text-xs text-slate-500 truncate mt-0.5">{emp.position}</p>
                                        {/* Status badge */}
                                        <span className={cn(
                                            'mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1',
                                            statusConfig.badge,
                                        )}>
                                            <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', statusConfig.dot)} />
                                            {statusConfig.label}
                                        </span>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="border-t border-slate-100" />

                                {/* Info row */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-slate-400 leading-none mb-0.5">กะงาน</p>
                                            <p className="text-xs font-semibold text-slate-700 tabular-nums truncate">{emp.shiftStartTime}–{emp.shiftEndTime}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                                            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] text-slate-400 leading-none mb-0.5">แผนก</p>
                                            <p className="text-xs font-semibold text-slate-700 truncate">{emp.department}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Check-in row — always rendered to keep height consistent */}
                                <div className={cn(
                                    'flex items-center justify-between rounded-lg px-3 py-2',
                                    todayLog?.checkInTime ? 'bg-emerald-50' : 'bg-slate-50',
                                )}>
                                    <p className="text-xs text-slate-500">เช็คอินวันนี้</p>
                                    {todayLog?.checkInTime
                                        ? <p className="text-xs font-bold text-emerald-600 tabular-nums">{todayLog.checkInTime} น.</p>
                                        : <p className="text-xs text-slate-400 italic">ยังไม่มีข้อมูล</p>
                                    }
                                </div>
                            </div>

                            {/* ── Card footer ── */}
                            <div className="px-5 pb-4">
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => setShowQRModal(emp.id)}
                                    className="w-full text-blue-600 border-blue-100 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                                >
                                    <QrCode className="w-4 h-4 mr-2" /> ดู QR Code สำหรับลงเวลา
                                </Button>
                            </div>
                        </div>
                    );
                })}

                {/* Empty state */}
                {filteredEmployees.length === 0 ? (
                    <div className="col-span-3 py-20 text-center">
                        <Users className="w-12 h-12 mx-auto mb-3 text-slate-200" />
                        <p className="text-slate-500 font-medium">ไม่พบพนักงานที่ตรงกับการค้นหา</p>
                        <p className="text-sm text-slate-400 mt-1">ลองใช้คำค้นหาอื่น หรือกด <span className="font-medium">เพิ่มพนักงาน</span></p>
                    </div>
                ) : null}
            </div>

            {/* ════ MODALS (Portal to body) ════ */}
            {typeof document !== 'undefined' && createPortal(
                <>
                    {/* ════ QR Modal ════ */}
                    {showQRModal ? (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden relative">
                                <button onClick={() => setShowQRModal(null)} className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors z-10">
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="p-6 pb-5 flex flex-col items-center text-center">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                                        <QrCode className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900 mb-1">QR Code สำหรับลงเวลา</h3>
                                    {selectedEmp ? <p className="text-sm text-blue-600 font-medium">{selectedEmp.name}</p> : null}
                                    <p className="text-xs text-slate-400 mt-1 mb-5">สแกน QR Code เพื่อบันทึกเวลาเข้า-ออกงาน</p>
                                    <div className="p-4 bg-white rounded-xl border border-slate-100 shadow-inner mb-5">
                                        <QRCodeSVG value={`${window.location.origin}/qr-checkin/${showQRModal}`} size={192} level="H" includeMargin ref={qrRef} />
                                    </div>
                                    <Button onClick={downloadQR} className="w-full bg-slate-900 hover:bg-slate-800 focus-visible:ring-4 focus-visible:ring-slate-900/20 transition-all">
                                        <FileDown className="w-4 h-4 mr-2" /> ดาวน์โหลด QR Code
                                    </Button>
                                    <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/qr-checkin/${showQRModal}`); alert('คัดลอกลิงก์แล้ว!'); }} className="w-full mt-1.5 text-slate-500 text-sm focus-visible:ring-2 focus-visible:ring-slate-200 transition-all">
                                        คัดลอกลิงก์สาธารณะ
                                    </Button>
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
                            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                                <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden relative">
                                    {/* Step bar */}
                                    {isDelete && (
                                        <div className="flex h-1">
                                            <div className={`flex-1 transition-colors duration-300 ${secureStep === 'confirm' ? 'bg-red-400' : 'bg-red-200'}`} />
                                            <div className={`flex-1 transition-colors duration-300 ${secureStep === 'pin' ? 'bg-red-500' : 'bg-slate-100'}`} />
                                        </div>
                                    )}
                                    <div className="p-6 text-center">
                                        {secureStep === 'confirm' && isDelete ? (
                                            <>
                                                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                                                    <Trash2 className="w-7 h-7 text-red-500" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 mb-1">ลบพนักงาน</h3>
                                                <p className="text-sm text-slate-500 mb-6">
                                                    คุณต้องการลบ{' '}
                                                    <span className="font-semibold text-slate-800">
                                                        {target?.name}{target?.nickname ? ` (${target.nickname})` : ''}
                                                    </span>{' '}
                                                    ออกจากระบบ?
                                                    <br />
                                                    <span className="text-red-500 text-xs mt-1 block">การกระทำนี้ไม่สามารถย้อนกลับได้</span>
                                                </p>
                                                <div className="flex gap-3">
                                                    <Button variant="outline" className="flex-1" onClick={closeSecureAction}>ยกเลิก</Button>
                                                    <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                                                        onClick={() => { setSecureStep('pin'); setTimeout(() => PIN_REFS[0]?.current?.focus(), 50); }}>
                                                        ดำเนินการต่อ
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className={cn('w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4', locked ? 'bg-slate-100' : (isDelete ? 'bg-red-50' : 'bg-amber-100'))}>
                                                    <svg className={cn('w-7 h-7', locked ? 'text-slate-400' : (isDelete ? 'text-red-500' : 'text-amber-500'))} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                    </svg>
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 mb-1 text-balance">ยืนยันตัวตน</h3>
                                                <p className="text-sm text-slate-500 mb-5">กรอก PIN 4 หลักเพื่อยืนยันการ{isDelete ? 'ลบ' : 'แก้ไข'}ข้อมูล</p>

                                                {/* PIN dots */}
                                                <div className="flex justify-center gap-3 mb-4">
                                                    {[0, 1, 2, 3].map(i => (
                                                        <div key={i} className={cn(
                                                            'w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all duration-150',
                                                            i < pinInput.length ? 'border-red-400 bg-red-50 text-red-600 scale-105' : 'border-slate-200 bg-slate-50',
                                                            locked && 'opacity-40',
                                                        )}>
                                                            {i < pinInput.length ? '●' : ''}
                                                        </div>
                                                    ))}
                                                </div>

                                                {pinError && <p className={cn('text-xs mb-3', locked ? 'text-slate-500' : 'text-red-500')}>{pinError}</p>}

                                                {/* Numpad */}
                                                <div className="grid grid-cols-3 gap-2 mb-4">
                                                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k, i) =>
                                                        k === '' ? <div key={i} /> :
                                                            k === '⌫' ? (
                                                                <button key={i} type="button" disabled={locked}
                                                                    onClick={handlePinBackspace}
                                                                    className="h-12 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-lg transition-colors disabled:opacity-30 touch-manipulation">
                                                                    {k}
                                                                </button>
                                                            ) : (
                                                                <button key={i} type="button" disabled={locked || pinInput.length >= 4}
                                                                    onClick={() => handlePinDigit(k)}
                                                                    className="h-12 rounded-xl bg-slate-50 border border-slate-200 hover:bg-red-50 hover:border-red-200 hover:text-red-600 font-semibold text-lg transition-colors disabled:opacity-30 touch-manipulation">
                                                                    {k}
                                                                </button>
                                                            )
                                                    )}
                                                </div>
                                                <Button variant="ghost" className="w-full text-slate-500 text-sm" onClick={closeSecureAction}>ยกเลิก</Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })() : null}

                    {/* ════ Form Modal ════ */}
                    {showFormModal ? (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden relative">

                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 text-balance">{isEditing ? 'แก้ไขข้อมูลพนักงาน' : 'เพิ่มพนักงานใหม่'}</h2>
                                        <p className="text-sm text-slate-400 mt-0.5">{isEditing ? 'ปรับปรุงข้อมูลพนักงานในระบบให้เป็นปัจจุบัน' : 'กรอกข้อมูลพนักงานให้ครบถ้วน'}</p>
                                    </div>
                                    <button type="button" onClick={closeFormModal} className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <form onSubmit={handleFormSubmit} className="overflow-y-auto">
                                    <div className="px-6 py-5 flex flex-col md:flex-row gap-6">

                                        {/* LEFT: Avatar */}
                                        <div className="w-full md:w-48 shrink-0 flex flex-col items-center gap-3">
                                            <p className="text-sm font-medium text-slate-700 self-start">
                                                รูปโปรไฟล์ <span className="text-slate-400 font-normal text-xs">(ไม่บังคับ)</span>
                                            </p>
                                            <div className="w-40 h-40 rounded-2xl overflow-hidden border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center">
                                                {avatarMode === 'camera'
                                                    ? <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                                                    : avatarPreview
                                                        ? <img src={avatarPreview} alt="รูปโปรไฟล์" width={160} height={160} className="w-full h-full object-cover" />
                                                        : <div className="flex flex-col items-center gap-2 text-slate-300">
                                                            <ImagePlus className="w-10 h-10" />
                                                            <span className="text-xs">ยังไม่มีรูป</span>
                                                        </div>
                                                }
                                            </div>
                                            {cameraError && <p className="text-xs text-red-500 text-center">{cameraError}</p>}

                                            {avatarMode === 'camera' ? (
                                                <div className="flex flex-col gap-2 w-full">
                                                    <Button type="button" onClick={capturePhoto} className="w-full bg-blue-600 hover:bg-blue-700 text-sm">
                                                        <Camera className="w-4 h-4 mr-1.5" /> ถ่ายรูป
                                                    </Button>
                                                    <Button type="button" variant="ghost" onClick={stopCamera} className="w-full text-slate-500 text-sm">ยกเลิก</Button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-2 w-full">
                                                    <Button type="button" onClick={startCamera} variant="outline" className="w-full text-sm text-slate-700 border-slate-200">
                                                        <SwitchCamera className="w-4 h-4 mr-1.5 text-blue-500" /> เปิดกล้อง
                                                    </Button>
                                                    <Button type="button" onClick={() => avatarInputRef.current?.click()} variant="outline" className="w-full text-sm text-slate-700 border-slate-200">
                                                        <ImagePlus className="w-4 h-4 mr-1.5 text-indigo-500" /> อัปโหลดรูป
                                                    </Button>
                                                    {avatarPreview && (
                                                        <Button type="button" variant="ghost" onClick={() => { setAvatarPreview(null); if (avatarInputRef.current) avatarInputRef.current.value = ''; }}
                                                            className="w-full text-red-500 hover:bg-red-50 text-sm">
                                                            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> ลบรูป
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                            <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                                        </div>

                                        {/* RIGHT: Fields */}
                                        <div className="flex-1 space-y-4">
                                            {/* Name + Nickname */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label htmlFor="emp-name" className="text-sm font-medium text-slate-700 block mb-1.5">
                                                        ชื่อ-นามสกุล <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input id="emp-name" name="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="สมชาย ใจดี" required autoComplete="name" spellCheck={false} />
                                                </div>
                                                <div>
                                                    <label htmlFor="emp-nickname" className="text-sm font-medium text-slate-700 block mb-1.5">ชื่อเล่น</label>
                                                    <Input id="emp-nickname" name="nickname" value={form.nickname} onChange={e => setForm({ ...form, nickname: e.target.value })} placeholder="ชาย" autoComplete="nickname" spellCheck={false} />
                                                </div>
                                            </div>

                                            {/* Email */}
                                            <div>
                                                <label htmlFor="emp-email" className="text-sm font-medium text-slate-700 block mb-1.5">
                                                    อีเมล <span className="text-red-500">*</span>
                                                </label>
                                                <Input id="emp-email" name="email" type="email" inputMode="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="somchai@company.com" required autoComplete="email" spellCheck={false} />
                                            </div>

                                            {/* Department + Position */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label htmlFor="emp-department" className="text-sm font-medium text-slate-700 block mb-1.5">
                                                        แผนก <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input id="emp-department" name="department" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Engineering" required autoComplete="organization-title" />
                                                </div>
                                                <div>
                                                    <label htmlFor="emp-position" className="text-sm font-medium text-slate-700 block mb-1.5">
                                                        ตำแหน่ง <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input id="emp-position" name="position" value={form.position} onChange={e => setForm({ ...form, position: e.target.value })} placeholder="Developer" required autoComplete="organization-title" />
                                                </div>
                                            </div>

                                            {/* Shift */}
                                            <div>
                                                <label className="text-sm font-medium text-slate-700 block mb-1.5">
                                                    เวลาทำงาน <span className="text-red-500">*</span>
                                                </label>
                                                <div className="flex items-center gap-3">
                                                    <Input id="shift-start" name="shiftStartTime" type="time" value={form.shiftStartTime} onChange={e => setForm({ ...form, shiftStartTime: e.target.value })} required className="flex-1 tabular-nums" />
                                                    <span className="text-slate-400 text-sm shrink-0">ถึง</span>
                                                    <Input id="shift-end" name="shiftEndTime" type="time" value={form.shiftEndTime} onChange={e => setForm({ ...form, shiftEndTime: e.target.value })} required className="flex-1 tabular-nums" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between shrink-0">
                                        <p className="text-xs text-slate-400"><span className="text-red-400">*</span> จำเป็นต้องกรอก</p>
                                        <div className="flex gap-3">
                                            <Button type="button" variant="outline" onClick={closeFormModal}>ยกเลิก</Button>
                                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 px-6">{isEditing ? 'อัปเดตข้อมูล' : 'บันทึกข้อมูล'}</Button>
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
