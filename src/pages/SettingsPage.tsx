import { useState } from 'react';
import { useAuth } from '../features/auth/hooks/useAuth';
import { Shield, ShieldAlert, Check, Settings2, DollarSign } from 'lucide-react';
import { useAttendance } from '../features/attendance/contexts/AttendanceContext';

const MENU_GROUPS = [
    { id: 'dashboard', label: 'แดชบอร์ดหลัก' },
    { id: 'requests', label: 'รายการแจ้งซ่อม' },
    { id: 'jobs', label: 'ระบบใบงาน' },
    { id: 'technicians', label: 'ทีมช่าง' },
    {
        id: 'attendance',
        label: 'ระบบลงเวลา',
        subMenus: [
            { id: 'attendance/dashboard', label: 'แดชบอร์ดลงเวลา' },
            { id: 'attendance/logs', label: 'ประวัติลงเวลา' },
            { id: 'attendance/employees', label: 'จัดการพนักงาน (ลงเวลา)' },
            { id: 'attendance/locations', label: 'สถานที่ (GPS)' },
            { id: 'attendance/ot-approvals', label: 'อนุมัติ OT' },
            { id: 'attendance/ot-calculator', label: 'คำนวณ OT' },
            { id: 'attendance/reports', label: 'รายงานเวลาทำงาน' },
        ]
    },
    { id: 'settings', label: 'ตั้งค่าระบบ' },
];

export function SettingsPage() {
    const { user, getAllAdmins, updateUserPermissions } = useAuth();
    const { companySettings, updateCompanySettings } = useAttendance() ?? {};
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

    const handleTogglePermission = (adminId: string, menuId: string, currentMenus: string[], isParent = false, childIds: string[] = []) => {
        if (!updateUserPermissions) return;

        let newMenus = [...currentMenus];

        if (isParent) {
            const isCurrentlyChecked = currentMenus.includes(menuId);
            if (isCurrentlyChecked) {
                // Remove parent and all children
                newMenus = newMenus.filter(id => id !== menuId && !childIds.includes(id));
            } else {
                // Add parent and all children
                newMenus.push(menuId);
                childIds.forEach(id => {
                    if (!newMenus.includes(id)) newMenus.push(id);
                });
            }
        } else {
            // Normal toggle for individual or child items
            if (newMenus.includes(menuId)) {
                newMenus = newMenus.filter(id => id !== menuId);

                // If it's a child and we just unchecked it, check if ALL children of its parent are now unchecked
                // If so, we can optionally remove the parent, but keeping it simple: just let parent be unchecked 
                // if the user explicitly unchecks it or unchecks all. Actually, let's keep it simple:
                // Only toggle the specific child. If a child is checked, ensure parent is checked.
            } else {
                newMenus.push(menuId);
                // Automatically add parent 'attendance' if a child is checked
                if (menuId.startsWith('attendance/') && !newMenus.includes('attendance')) {
                    newMenus.push('attendance');
                }
            }

            // Cleanup: if all attendance children are unchecked, remove attendance parent
            if (menuId.startsWith('attendance/') && newMenus.includes('attendance')) {
                const attendanceChildren = MENU_GROUPS.find(g => g.id === 'attendance')?.subMenus?.map(s => s.id) || [];
                const anyChildChecked = attendanceChildren.some(id => newMenus.includes(id));
                if (!anyChildChecked) {
                    newMenus = newMenus.filter(id => id !== 'attendance');
                }
            }
        }

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
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-6">
                                            {MENU_GROUPS.map(group => {
                                                if (group.subMenus) {
                                                    const groupChildIds = group.subMenus.map(s => s.id);
                                                    const checkedChildrenCount = groupChildIds.filter(id => admin.accessibleMenus?.includes(id)).length;
                                                    const isAllChecked = checkedChildrenCount === groupChildIds.length;
                                                    const isPartiallyChecked = checkedChildrenCount > 0 && !isAllChecked;
                                                    const isGroupChecked = admin.accessibleMenus?.includes(group.id) || isPartiallyChecked;

                                                    return (
                                                        <div key={group.id} className="col-span-1 sm:col-span-2 lg:col-span-3 bg-gray-50/50 rounded-xl border border-gray-200 p-4 space-y-3">
                                                            <label className="flex items-center gap-3 cursor-pointer">
                                                                <input
                                                                    type="checkbox"
                                                                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                                    checked={isGroupChecked}
                                                                    ref={input => {
                                                                        if (input) input.indeterminate = isPartiallyChecked;
                                                                    }}
                                                                    onChange={() => handleTogglePermission(admin.id, group.id, admin.accessibleMenus || [], true, groupChildIds)}
                                                                />
                                                                <div>
                                                                    <p className="text-sm font-bold text-gray-900">{group.label} (ทั้งหมด)</p>
                                                                    <p className="text-xs text-gray-500 mt-0.5">เลือก/ยกเลิก เมนูย่อยทั้งหมด</p>
                                                                </div>
                                                            </label>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pl-7 pt-2 border-t border-gray-200/60">
                                                                {group.subMenus.map(menu => {
                                                                    const hasAccess = admin.accessibleMenus?.includes(menu.id) || false;
                                                                    return (
                                                                        <label
                                                                            key={menu.id}
                                                                            className={`flex items-start gap-3 p-2.5 rounded-lg border cursor-pointer transition-all ${hasAccess ? 'border-blue-400 bg-blue-50/50' : 'border-gray-200 bg-white hover:border-blue-200'
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
                                                                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{menu.id.split('/').pop()}</p>
                                                                            </div>
                                                                        </label>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                }

                                                // Normal individual menus
                                                const hasAccess = admin.accessibleMenus?.includes(group.id) || false;
                                                return (
                                                    <label
                                                        key={group.id}
                                                        className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${hasAccess ? 'border-blue-500 bg-blue-50/30' : 'border-gray-100 hover:border-blue-200'
                                                            }`}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            className="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                            checked={hasAccess}
                                                            onChange={() => handleTogglePermission(admin.id, group.id, admin.accessibleMenus || [])}
                                                        />
                                                        <div>
                                                            <p className={`text-sm font-medium ${hasAccess ? 'text-blue-900' : 'text-gray-700'}`}>
                                                                {group.label}
                                                            </p>
                                                            <p className="text-[10px] text-gray-400 font-mono mt-0.5">{group.id}</p>
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

            {/* Compensation Settings Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">การตั้งค่าสวัสดิการและค่าตอบแทน</h2>
                        <p className="text-sm text-gray-500">กำหนดอัตราค่าล่วงเวลา (OT) เริ่มต้นของบริษัท</p>
                    </div>
                </div>
                <div className="p-6">
                    <div className="max-w-xl space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                รูปแบบการคิดค่าล่วงเวลา (OT Type)
                            </label>
                            <select
                                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                                value={companySettings?.defaultOtRateType || 'multiplier'}
                                onChange={e => updateCompanySettings?.({ defaultOtRateType: e.target.value as 'multiplier' | 'fixed' })}
                            >
                                <option value="multiplier">คิดเป็น "เท่า" ของค่าจ้างเฉลี่ยต่อชั่วโมง</option>
                                <option value="fixed">คิดเหมาจ่ายเป็น "บาท/ชั่วโมง"</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                อัตราเริ่มต้น (Default Rate)
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 pr-20 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                                    value={companySettings?.defaultOtRateValue || 1.5}
                                    onChange={e => updateCompanySettings?.({ defaultOtRateValue: parseFloat(e.target.value) || 0 })}
                                />
                                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none bg-gray-50 border-l border-gray-200 rounded-r-lg">
                                    <span className="text-gray-500 text-sm font-medium w-12 text-center">
                                        {companySettings?.defaultOtRateType === 'multiplier' ? 'เท่า' : 'บาท/ชม.'}
                                    </span>
                                </div>
                            </div>
                            <p className="mt-2 text-sm text-gray-500 flex items-center gap-1.5">
                                <Check className="w-4 h-4 text-emerald-500" />
                                ค่านี้จะถูกตั้งเป็นตัวเลือกแรกเมื่อเพิ่มพนักงานใหม่เสมอ
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
