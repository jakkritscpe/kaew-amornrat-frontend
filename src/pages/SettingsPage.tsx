import { useState } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { Shield, ShieldAlert, Check, Settings2 } from 'lucide-react';

const MENU_OPTIONS = [
    { id: 'dashboard', label: 'แดชบอร์ดหลัก' },
    { id: 'requests', label: 'รายการแจ้งซ่อม' },
    { id: 'jobs', label: 'ระบบใบงาน' },
    { id: 'technicians', label: 'ทีมช่าง' },
    { id: 'attendance/dashboard', label: 'แดชบอร์ดลงเวลา' },
    { id: 'attendance/logs', label: 'ประวัติลงเวลา' },
    { id: 'attendance/employees', label: 'จัดการพนักงาน (ลงเวลา)' },
    { id: 'attendance/locations', label: 'สถานที่ (GPS)' },
    { id: 'attendance/ot-approvals', label: 'อนุมัติ OT' },
    { id: 'attendance/reports', label: 'รายงานเวลาทำงาน' },
    { id: 'settings', label: 'ตั้งค่าระบบ' },
];

export function SettingsPage() {
    const { user, getAllAdmins, updateUserPermissions } = useAuth();
    const [savedUserId, setSavedUserId] = useState<string | null>(null);

    // If not super_admin, show placeholder or access denied
    if (user?.role !== 'super_admin') {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5">
                    <Settings2 className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">ตั้งค่าระบบ</h3>
                <p className="text-gray-500">ฟีเจอร์นี้กำลังอยู่ในระหว่างการพัฒนา</p>
            </div>
        );
    }

    const admins = getAllAdmins ? getAllAdmins().filter(a => a.role === 'admin') : [];

    const handleTogglePermission = (adminId: string, menuId: string, currentMenus: string[]) => {
        if (!updateUserPermissions) return;

        const newMenus = currentMenus.includes(menuId)
            ? currentMenus.filter(id => id !== menuId)
            : [...currentMenus, menuId];

        updateUserPermissions(adminId, newMenus);

        // Show saved indicator temporarily
        setSavedUserId(adminId);
        setTimeout(() => setSavedUserId(null), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">จัดการสิทธิ์ผู้ดูแลระบบ (Role-Based Access Control)</h2>
                        <p className="text-sm text-gray-500">กำหนดเมนูที่อนุญาตให้ Admin แต่ละคนเข้าถึงได้</p>
                    </div>
                </div>

                <div className="p-6">
                    {admins.length === 0 ? (
                        <div className="text-center py-10">
                            <ShieldAlert className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500">ไม่พบบัญชีระดับ Admin ในระบบ</p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {admins.map(admin => (
                                <div key={admin.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-gray-50 px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold shadow-inner">
                                                {admin.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900">{admin.name}</h3>
                                                <p className="text-xs text-gray-500">Username: <span className="font-mono">{admin.username}</span></p>
                                            </div>
                                        </div>
                                        {savedUserId === admin.id && (
                                            <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full animate-in fade-in slide-in-from-right-2">
                                                <Check className="w-4 h-4" /> บันทึกแล้ว
                                            </span>
                                        )}
                                    </div>
                                    <div className="p-5 bg-white">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-4 tracking-wide uppercase">สิทธิ์การเข้าถึงเมนู</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-6">
                                            {MENU_OPTIONS.map(menu => {
                                                const hasAccess = admin.accessibleMenus?.includes(menu.id) || false;
                                                return (
                                                    <label
                                                        key={menu.id}
                                                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${hasAccess ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100 hover:border-blue-200'
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                            checked={hasAccess}
                                                            onChange={() => handleTogglePermission(admin.id, menu.id, admin.accessibleMenus || [])}
                                                        />
                                                        <div>
                                                            <p className={`text-sm font-medium ${hasAccess ? 'text-blue-900' : 'text-gray-700'}`}>
                                                                {menu.label}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{menu.id}</p>
                                                        </div>
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
        </div>
    );
}
