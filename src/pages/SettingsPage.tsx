import { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import {
    Shield, Check, DollarSign, Users, Plus, Pencil, Trash2,
    Loader2, X, Eye, EyeOff, ShieldAlert, AlertTriangle, UserCog,
} from 'lucide-react';
import { useAttendance } from '../features/attendance/contexts/useAttendance';
import { getEmployeesApi, createEmployeeApi, updateEmployeeApi, deleteEmployeeApi, updateEmployeeMenusApi } from '../lib/api/employees-api';
import type { Employee } from '../features/attendance/types';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';

type Tab = 'rbac' | 'accounts' | 'compensation';

// ─── Admin Account Modal ────────────────────────────────────────────────────
interface AdminFormData {
    name: string;
    email: string;
    password: string;
    department: string;
    position: string;
    role: 'admin' | 'manager';
}

const EMPTY_FORM: AdminFormData = {
    name: '', email: '', password: '', department: '', position: '', role: 'admin',
};

interface AdminModalProps {
    editTarget: Employee | null;
    onClose: () => void;
    onSaved: () => void;
}

function AdminModal({ editTarget, onClose, onSaved }: AdminModalProps) {
    const { t } = useTranslation();
    const isEdit = !!editTarget;
    const [form, setForm] = useState<AdminFormData>(
        isEdit
            ? { name: editTarget.name, email: editTarget.email, password: '', department: editTarget.department, position: editTarget.position, role: (editTarget.role === 'manager' ? 'manager' : 'admin') }
            : EMPTY_FORM
    );
    const [showPw, setShowPw] = useState(false);
    const [saving, setSaving] = useState(false);

    const set = (field: keyof AdminFormData, value: string) =>
        setForm(f => ({ ...f, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEdit && !form.password) return;
        setSaving(true);
        try {
            if (isEdit) {
                const patch: Partial<Employee> & { password?: string } = {
                    name: form.name, email: form.email,
                    department: form.department, position: form.position,
                    role: form.role,
                };
                if (form.password) patch.password = form.password;
                await updateEmployeeApi(editTarget.id, patch);
                toast.success(t('settings.accounts.editSuccess'));
            } else {
                await createEmployeeApi({
                    name: form.name, email: form.email, password: form.password,
                    department: form.department || 'IT', position: form.position || 'Admin',
                    role: form.role, shiftStartTime: '09:00:00', shiftEndTime: '18:00:00',
                    otRateUseDefault: true,
                } as Omit<Employee, 'id'> & { password: string });
                toast.success(t('settings.accounts.addSuccess'));
            }
            onSaved();
            onClose();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t('common.genericError'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <div>
                        <h3 className="font-bold text-[#1d1d1d]">{isEdit ? t('settings.accounts.editTitle') : t('settings.accounts.addTitle')}</h3>
                        <p className="text-xs text-[#6f6f6f] mt-0.5">{t('settings.accounts.formDesc')}</p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <Field label={t('settings.accounts.nameLabel')} className="col-span-2">
                            <input required value={form.name} onChange={e => set('name', e.target.value)}
                                placeholder="สมชาย ใจดี" className={inputCls} />
                        </Field>
                        <Field label="Email">
                            <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                                placeholder="admin@example.com" className={inputCls} />
                        </Field>
                        <Field label={isEdit ? t('settings.accounts.passwordNewLabel') : t('settings.accounts.passwordLabel')}>
                            <div className="relative">
                                <input
                                    required={!isEdit}
                                    type={showPw ? 'text' : 'password'}
                                    value={form.password}
                                    onChange={e => set('password', e.target.value)}
                                    placeholder={isEdit ? t('settings.accounts.passwordHint') : '••••••••'}
                                    className={cn(inputCls, 'pr-9')}
                                />
                                <button type="button" onClick={() => setShowPw(v => !v)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </Field>
                        <Field label={t('settings.accounts.departmentLabel')}>
                            <input value={form.department} onChange={e => set('department', e.target.value)}
                                placeholder="IT" className={inputCls} />
                        </Field>
                        <Field label={t('settings.accounts.positionLabel')}>
                            <input value={form.position} onChange={e => set('position', e.target.value)}
                                placeholder={t('settings.accounts.positionPlaceholder')} className={inputCls} />
                        </Field>
                        <Field label="Role" className="col-span-2">
                            <select value={form.role} onChange={e => set('role', e.target.value as 'admin' | 'manager')} className={inputCls}>
                                <option value="admin">Admin</option>
                                <option value="manager">Manager</option>
                            </select>
                        </Field>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <button type="button" onClick={onClose}
                            className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-[#6f6f6f] hover:bg-gray-50 transition-colors">
                            {t('common.cancel')}
                        </button>
                        <button type="submit" disabled={saving}
                            className="flex-1 h-10 rounded-xl bg-[#044F88] hover:bg-[#00223A] text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                            {saving ? t('common.saving') : isEdit ? t('settings.accounts.saveEdit') : t('settings.accounts.saveAdd')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

const inputCls = 'w-full h-10 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm text-[#1d1d1d] focus:outline-none focus:ring-2 focus:ring-[#044F88]/25 focus:border-[#044F88] focus:bg-white transition-colors';

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
    return (
        <div className={cn('space-y-1', className)}>
            <label className="text-xs font-semibold text-[#1d1d1d]">{label}</label>
            {children}
        </div>
    );
}

// ─── Main SettingsPage ──────────────────────────────────────────────────────
export function SettingsPage() {
    const { t } = useTranslation();
    const { user } = useAuth();
    const { companySettings, updateCompanySettings } = useAttendance() ?? {};

    const MENU_GROUPS = [
        {
            id: 'attendance',
            label: t('nav.attendanceSystem'),
            subMenus: [
                { id: 'attendance/dashboard', label: t('settings.rbac.menuLabels.attendanceDashboard') },
                { id: 'attendance/logs', label: t('settings.rbac.menuLabels.attendanceLogs') },
                { id: 'attendance/employees', label: t('settings.rbac.menuLabels.attendanceEmployees') },
                { id: 'attendance/locations', label: t('settings.rbac.menuLabels.attendanceLocations') },
                { id: 'attendance/ot-approvals', label: t('settings.rbac.menuLabels.attendanceOtApprovals') },
                { id: 'attendance/ot-calculator', label: t('settings.rbac.menuLabels.attendanceOtCalculator') },
                { id: 'attendance/reports', label: t('settings.rbac.menuLabels.attendanceReports') },
            ],
        },
    ];

    const [activeTab, setActiveTab] = useState<Tab>('rbac');
    const [savedUserId, setSavedUserId] = useState<string | null>(null);

    // RBAC state
    const [rbacAdmins, setRbacAdmins] = useState<Employee[]>([]);
    const [loadingRbac, setLoadingRbac] = useState(false);

    // Admin accounts state
    const [adminAccounts, setAdminAccounts] = useState<Employee[]>([]);
    const [loadingAccounts, setLoadingAccounts] = useState(false);
    const [modalTarget, setModalTarget] = useState<Employee | null | 'new'>(null);
    const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
    const [deleting, setDeleting] = useState(false);

    const loadRbacAdmins = async () => {
        setLoadingRbac(true);
        try {
            const [admins, managers] = await Promise.all([
                getEmployeesApi({ role: 'admin' }),
                getEmployeesApi({ role: 'manager' }),
            ]);
            setRbacAdmins([...admins, ...managers]);
        } catch {
            toast.error(t('settings.accounts.loadFailed'));
        } finally {
            setLoadingRbac(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'rbac') loadRbacAdmins();
    }, [activeTab]);

    useEffect(() => {
        if (activeTab === 'accounts') loadAdminAccounts();
    }, [activeTab]);

    const loadAdminAccounts = async () => {
        setLoadingAccounts(true);
        try {
            const [admins, managers] = await Promise.all([
                getEmployeesApi({ role: 'admin' }),
                getEmployeesApi({ role: 'manager' }),
            ]);
            setAdminAccounts([...admins, ...managers]);
        } catch {
            toast.error(t('settings.accounts.loadFailed'));
        } finally {
            setLoadingAccounts(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setDeleting(true);
        try {
            await deleteEmployeeApi(deleteTarget.id);
            toast.success(t('settings.accounts.deleteSuccess', { name: deleteTarget.name }));
            setDeleteTarget(null);
            loadAdminAccounts();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : t('settings.accounts.deleteFailed'));
        } finally {
            setDeleting(false);
        }
    };

    const handleTogglePermission = async (adminId: string, menuId: string, isParent = false, childIds: string[] = []) => {
        const admin = rbacAdmins.find(a => a.id === adminId);
        if (!admin) return;
        let newMenus = [...(admin.accessibleMenus || [])];
        if (isParent) {
            const isChecked = childIds.every(id => newMenus.includes(id));
            newMenus = isChecked
                ? newMenus.filter(id => id !== menuId && !childIds.includes(id))
                : [...newMenus.filter(id => id !== menuId), ...childIds];
        } else {
            if (newMenus.includes(menuId)) {
                newMenus = newMenus.filter(id => id !== menuId);
                if (menuId.startsWith('attendance/')) {
                    const kids = MENU_GROUPS.find(g => g.id === 'attendance')?.subMenus?.map(s => s.id) || [];
                    if (!kids.some(id => newMenus.includes(id))) newMenus = newMenus.filter(id => id !== 'attendance');
                }
            } else {
                newMenus.push(menuId);
                if (menuId.startsWith('attendance/') && !newMenus.includes('attendance')) newMenus.push('attendance');
            }
        }
        // Optimistic update
        setRbacAdmins(prev => prev.map(a => a.id === adminId ? { ...a, accessibleMenus: newMenus } : a));
        setSavedUserId(adminId);
        setTimeout(() => setSavedUserId(null), 2000);
        try {
            await updateEmployeeMenusApi(adminId, newMenus);
        } catch {
            toast.error(t('settings.rbac.saveFailed'));
            loadRbacAdmins(); // revert on error
        }
    };

    // ── Not super_admin: block entirely ──
    if (user?.role !== 'super_admin') {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                    <Shield className="w-8 h-8 text-gray-300" />
                </div>
                <div className="text-center">
                    <p className="font-bold text-[#1d1d1d]">{t('settings.noAccess')}</p>
                    <p className="text-sm text-[#6f6f6f] mt-1">{t('settings.noAccessDesc')}</p>
                </div>
            </div>
        );
    }

    const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
        { id: 'rbac', label: t('settings.tabRbac'), icon: Shield },
        { id: 'accounts', label: t('settings.tabAccounts'), icon: UserCog },
        { id: 'compensation', label: t('settings.tabCompensation'), icon: DollarSign },
    ];

    return (
        <div className="space-y-6">
            {/* ── Tab bar ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex gap-1">
                {tabs.map(t => {
                    const Icon = t.icon;
                    return (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                                activeTab === t.id
                                    ? 'bg-[#044F88] text-white shadow-sm'
                                    : 'text-[#6f6f6f] hover:bg-gray-50'
                            )}
                        >
                            <Icon className="w-4 h-4" />
                            <span className="hidden sm:inline">{t.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* ══════════════════════════════════════
                TAB 1 — RBAC
            ══════════════════════════════════════ */}
            {activeTab === 'rbac' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                        <div className="p-2 bg-[#044F88]/5 rounded-xl text-[#044F88]">
                            <Shield className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-[#1d1d1d]">{t('settings.rbac.title')}</h2>
                            <p className="text-xs text-[#6f6f6f] mt-0.5">{t('settings.rbac.subtitle')}</p>
                        </div>
                    </div>
                    <div className="p-6">
                        {loadingRbac ? (
                            <div className="flex items-center justify-center py-14 gap-3 text-[#6f6f6f]">
                                <Loader2 className="w-5 h-5 animate-spin text-[#044F88]" />
                                <span className="text-sm">{t('common.loading')}</span>
                            </div>
                        ) : rbacAdmins.length === 0 ? (
                            <div className="text-center py-14">
                                <ShieldAlert className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                <p className="font-semibold text-[#1d1d1d]">{t('settings.rbac.noAdmins')}</p>
                                <p className="text-sm text-[#6f6f6f] mt-1">{t('settings.rbac.noAdminsHint')}</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {rbacAdmins.map(admin => (
                                    <div key={admin.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                                        <div className="bg-gray-50/70 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-[#044F88] flex items-center justify-center text-white font-bold text-sm">
                                                    {admin.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-[#1d1d1d] text-sm">{admin.name}</p>
                                                    <p className="text-[11px] text-[#6f6f6f] font-mono">{admin.email}</p>
                                                </div>
                                            </div>
                                            {savedUserId === admin.id && (
                                                <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full">
                                                    <Check className="w-3.5 h-3.5" /> {t('settings.rbac.saved')}
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-5">
                                            <p className="text-xs font-bold text-[#6f6f6f] uppercase tracking-widest mb-4">{t('settings.rbac.menuPermissions')}</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
                                                {MENU_GROUPS.map(group => {
                                                    if (group.subMenus) {
                                                        const childIds = group.subMenus.map(s => s.id);
                                                        const checkedCount = childIds.filter(id => admin.accessibleMenus?.includes(id)).length;
                                                        const isAll = checkedCount === childIds.length;
                                                        const isPartial = checkedCount > 0 && !isAll;
                                                        return (
                                                            <div key={group.id} className="col-span-1 sm:col-span-2 lg:col-span-3 bg-gray-50/60 rounded-xl border border-gray-100 p-4 space-y-3">
                                                                <label className="flex items-center gap-2.5 cursor-pointer">
                                                                    <input type="checkbox" className="w-4 h-4 rounded text-[#044F88] cursor-pointer"
                                                                        checked={isAll || isPartial}
                                                                        ref={el => { if (el) el.indeterminate = isPartial; }}
                                                                        onChange={() => handleTogglePermission(admin.id, group.id, true, childIds)}
                                                                    />
                                                                    <span className="text-sm font-bold text-[#1d1d1d]">{group.label}</span>
                                                                </label>
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pl-6 pt-2 border-t border-gray-100">
                                                                    {group.subMenus.map(menu => {
                                                                        const has = admin.accessibleMenus?.includes(menu.id) ?? false;
                                                                        return (
                                                                            <label key={menu.id} className={cn(
                                                                                'flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition-all text-sm',
                                                                                has ? 'border-[#044F88]/30 bg-[#044F88]/10 text-[#044F88]' : 'border-gray-100 bg-white text-[#6f6f6f] hover:border-[#044F88]/10'
                                                                            )}>
                                                                                <input type="checkbox" className="w-3.5 h-3.5 rounded text-[#044F88] cursor-pointer"
                                                                                    checked={has}
                                                                                    onChange={() => handleTogglePermission(admin.id, menu.id)}
                                                                                />
                                                                                <span className="font-medium">{menu.label}</span>
                                                                            </label>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        );
                                                    }
                                                    const has = admin.accessibleMenus?.includes(group.id) ?? false;
                                                    return (
                                                        <label key={group.id} className={cn(
                                                            'flex items-center gap-2.5 p-3 rounded-xl border-2 cursor-pointer transition-all text-sm',
                                                            has ? 'border-[#044F88] bg-[#044F88]/10 text-[#044F88]' : 'border-gray-100 text-[#6f6f6f] hover:border-[#044F88]/10'
                                                        )}>
                                                            <input type="checkbox" className="w-4 h-4 rounded text-[#044F88] cursor-pointer"
                                                                checked={has}
                                                                onChange={() => handleTogglePermission(admin.id, group.id)}
                                                            />
                                                            <span className="font-medium">{group.label}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
                TAB 2 — Admin Accounts
            ══════════════════════════════════════ */}
            {activeTab === 'accounts' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                                <Users className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="font-bold text-[#1d1d1d]">{t('settings.accounts.title')}</h2>
                                <p className="text-xs text-[#6f6f6f] mt-0.5">{t('settings.accounts.subtitle')}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setModalTarget('new')}
                            className="flex items-center gap-2 bg-[#044F88] hover:bg-[#00223A] text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
                        >
                            <Plus className="w-4 h-4" /> {t('settings.accounts.addAdmin')}
                        </button>
                    </div>
                    <div className="p-6">
                        {loadingAccounts ? (
                            <div className="flex items-center justify-center py-14 gap-3 text-[#6f6f6f]">
                                <Loader2 className="w-5 h-5 animate-spin text-[#044F88]" />
                                <span className="text-sm">{t('common.loading')}</span>
                            </div>
                        ) : adminAccounts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-14 gap-3">
                                <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center">
                                    <Users className="w-7 h-7 text-gray-300" />
                                </div>
                                <p className="font-semibold text-[#1d1d1d]">{t('settings.accounts.noAccounts')}</p>
                                <button onClick={() => setModalTarget('new')}
                                    className="text-sm text-[#044F88] font-semibold hover:underline">
                                    {t('settings.accounts.addFirst')}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {adminAccounts.map(acc => (
                                    <div key={acc.id} className="flex items-center justify-between gap-4 bg-[#f8fafc] rounded-2xl border border-gray-100 px-4 py-3.5">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#044F88] to-[#6366f1] flex items-center justify-center text-white font-bold text-sm shrink-0">
                                                {acc.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-[#1d1d1d] text-sm truncate">{acc.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                                    <p className="text-xs text-[#6f6f6f] truncate">{acc.email}</p>
                                                    <span className={cn(
                                                        'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                                                        acc.role === 'manager'
                                                            ? 'bg-purple-50 text-purple-700'
                                                            : 'bg-[#044F88]/5 text-[#044F88]'
                                                    )}>
                                                        {acc.role}
                                                    </span>
                                                </div>
                                                {acc.department && (
                                                    <p className="text-[11px] text-[#6f6f6f] mt-0.5">{acc.department} · {acc.position}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <button
                                                onClick={() => setModalTarget(acc)}
                                                className="p-2 rounded-xl text-[#6f6f6f] hover:bg-[#044F88]/5 hover:text-[#044F88] transition-colors"
                                                title={t('settings.accounts.editBtn')}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(acc)}
                                                className="p-2 rounded-xl text-[#6f6f6f] hover:bg-red-50 hover:text-red-500 transition-colors"
                                                title={t('settings.accounts.deleteBtn')}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════
                TAB 3 — Compensation
            ══════════════════════════════════════ */}
            {activeTab === 'compensation' && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                        <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="font-bold text-[#1d1d1d]">{t('settings.compensation.title')}</h2>
                            <p className="text-xs text-[#6f6f6f] mt-0.5">{t('settings.compensation.subtitle')}</p>
                        </div>
                    </div>
                    <div className="p-6 max-w-lg space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-[#1d1d1d]">{t('settings.compensation.rateType')}</label>
                            <select
                                className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#044F88]/25 focus:border-[#044F88] focus:bg-white"
                                value={companySettings?.defaultOtRateType || 'multiplier'}
                                onChange={e => updateCompanySettings?.({ defaultOtRateType: e.target.value as 'multiplier' | 'fixed' })}
                            >
                                <option value="multiplier">{t('settings.compensation.multiplierDesc')}</option>
                                <option value="fixed">{t('settings.compensation.fixedDesc')}</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-[#1d1d1d]">{t('settings.compensation.defaultRate')}</label>
                            <div className="relative">
                                <input
                                    type="number" step="0.1" min="0"
                                    className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50 px-3 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-[#044F88]/25 focus:border-[#044F88] focus:bg-white"
                                    value={companySettings?.defaultOtRateValue || 1.5}
                                    onChange={e => updateCompanySettings?.({ defaultOtRateValue: parseFloat(e.target.value) || 0 })}
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none border-l border-gray-200 bg-gray-50 rounded-r-xl">
                                    <span className="text-xs font-semibold text-[#6f6f6f]">
                                        {companySettings?.defaultOtRateType === 'multiplier' ? t('settings.compensation.multiplierUnit') : t('settings.compensation.fixedUnit')}
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-[#6f6f6f] flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                                {t('settings.compensation.hint')}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Admin Account Modal ── */}
            {modalTarget !== null && (
                <AdminModal
                    editTarget={modalTarget === 'new' ? null : modalTarget}
                    onClose={() => setModalTarget(null)}
                    onSaved={loadAdminAccounts}
                />
            )}

            {/* ── Delete Confirm Modal ── */}
            {deleteTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setDeleteTarget(null)}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
                        <div className="flex items-start gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                            </div>
                            <div>
                                <p className="font-bold text-[#1d1d1d]">{t('settings.accounts.deleteConfirmTitle')}</p>
                                <p className="text-sm text-[#6f6f6f] mt-0.5">
                                    {t('settings.accounts.deleteConfirm', { name: deleteTarget.name })}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setDeleteTarget(null)} className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-[#6f6f6f] hover:bg-gray-50 transition-colors">
                                {t('common.cancel')}
                            </button>
                            <button onClick={handleDelete} disabled={deleting}
                                className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                                {deleting ? t('settings.accounts.deleting') : t('settings.accounts.deleteBtn2')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
