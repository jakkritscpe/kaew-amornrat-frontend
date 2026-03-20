import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
  Clock,
  MapPin,
  FileCheck2,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Calculator,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../features/auth/hooks/useAuth';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

type MenuItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  subItems?: { id: string; label: string; icon: React.ElementType }[];
};

const menuItems: MenuItem[] = [
  {
    id: 'attendance',
    label: 'ระบบลงเวลา',
    icon: Clock,
    subItems: [
      { id: 'attendance/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
      { id: 'attendance/logs', label: 'ประวัติลงเวลา', icon: ClipboardList },
      { id: 'attendance/employees', label: 'พนักงาน', icon: Users },
      { id: 'attendance/locations', label: 'สถานที่', icon: MapPin },
      { id: 'attendance/ot-approvals', label: 'อนุมัติ OT', icon: FileCheck2 },
      { id: 'attendance/ot-calculator', label: 'คำนวณ OT', icon: Calculator },
      { id: 'attendance/reports', label: 'รายงานเวลา', icon: BarChart3 },
    ]
  },
  { id: 'settings', label: 'ตั้งค่า', icon: Settings },
];

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [openSubmenus, setOpenSubmenus] = useState<Record<string, boolean>>({
    'attendance': location.pathname.includes('/attendance')
  });

  const toggleSubmenu = (id: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setOpenSubmenus(prev => ({ ...prev, [id]: true }));
      return;
    }
    setOpenSubmenus(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    if (location.pathname.includes('/attendance')) {
      // Use queueMicrotask to avoid synchronous setState within effect
      queueMicrotask(() => setOpenSubmenus(prev => ({ ...prev, 'attendance': true })));
    }
  }, [location.pathname]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.menu-item:not(.sub-item)',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, delay: 0.1, ease: 'power3.out' }
      );
      gsap.fromTo(profileRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, delay: 0.5, ease: 'back.out(1.7)' }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-all duration-300 lg:hidden',
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <aside
        className={cn(
          // Base: fixed, full height, white, transition position
          'fixed left-0 top-0 h-full z-50 bg-white border-r border-gray-200/60 shadow-xl',
          'flex flex-col transition-transform duration-300 ease-out',
          // Width: collapsed on desktop
          isCollapsed ? 'w-20' : 'w-[260px]',
          // Mobile: slide in/out via transform
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible (override the mobile transform)
          'lg:translate-x-0',
          // On mobile when collapsed=false, slide open nicely
        )}
        aria-label="แถบนำทาง"
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 shrink-0">
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <img src="/logo.svg" alt="หจก.แก้วอมรรัตน์" className="w-9 h-9 shrink-0 object-contain" />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-[15px] text-[#00223A] whitespace-nowrap leading-tight">
                  หจก.แก้วอมรรัตน์
                </span>
                <span className="text-[10px] font-bold text-[#044F88] tracking-widest leading-none mt-0.5">
                  IT SERVICES & SOLUTIONS
                </span>
              </div>
            )}
          </Link>
          {/* Close on mobile / Collapse on desktop */}
          <button
            onClick={() => {
              if (window.innerWidth < 1024) {
                onMobileClose();
              } else {
                setIsCollapsed(!isCollapsed);
              }
            }}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
            aria-label="ปิดเมนู"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Desktop collapse toggle */}
        <button
          onClick={() => {
            setIsCollapsed(!isCollapsed);
            if (!isCollapsed) setOpenSubmenus({});
          }}
          className="hidden lg:flex absolute -right-3 top-[72px] w-6 h-6 bg-white rounded-full shadow-md border border-gray-200 items-center justify-center hover:bg-gray-50 transition-colors z-10"
          aria-label={isCollapsed ? 'ขยายเมนู' : 'ย่อเมนู'}
        >
          {isCollapsed
            ? <ChevronRight className="w-3 h-3 text-gray-500" aria-hidden="true" />
            : <ChevronLeft className="w-3 h-3 text-gray-500" aria-hidden="true" />
          }
        </button>

        {/* Nav items */}
        <nav ref={menuRef} className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5" aria-label="เมนูหลัก">
          {menuItems.filter(item => {
            if (user?.role === 'super_admin') return true;
            if (user?.role === 'admin') {
              if (item.id === 'settings') return false; // super_admin only
              const allowed = user.accessibleMenus || [];
              const isDirectlyAllowed = allowed.includes(item.id);
              const isAnySubAllowed = item.subItems?.some(sub => allowed.includes(sub.id));
              return isDirectlyAllowed || isAnySubAllowed;
            }
            return false;
          }).map((item) => {
            const Icon = item.icon;

            // Check if ANY sub-item is active
            const isAnyChildActive = item.subItems?.some(sub => location.pathname.includes(sub.id));
            const isActive = location.pathname.includes(item.id) || !!isAnyChildActive;

            if (item.subItems) {
              const isOpen = openSubmenus[item.id] && !isCollapsed;

              return (
                <div key={item.id} className="menu-item flex flex-col">
                  <button
                    onClick={() => toggleSubmenu(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group w-full text-left relative',
                      isCollapsed ? 'justify-center' : 'justify-between',
                      isActive && !isOpen
                        ? 'bg-[#f0f5ff] text-[#044F88] font-medium'
                        : 'text-[#6f6f6f] hover:bg-[#f0f5ff] hover:text-[#044F88]'
                    )}
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Icon className={cn('w-5 h-5 shrink-0 transition-transform duration-200', (!isActive || isOpen) && 'group-hover:scale-110')} aria-hidden="true" />
                      {!isCollapsed && (
                        <span className={cn('font-medium text-sm whitespace-nowrap truncate', isActive && 'text-[#044F88]')}>{item.label}</span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <div className={cn('shrink-0 transition-colors', isActive && !isOpen ? 'text-[#044F88]' : 'text-gray-400 group-hover:text-[#044F88]')}>
                        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    )}
                  </button>

                  {/* Sub-items Container */}
                  {!isCollapsed && (
                    <div
                      className={cn(
                        'overflow-hidden transition-all duration-300 ease-in-out',
                        isOpen ? 'max-h-96 opacity-100 mt-1' : 'max-h-0 opacity-0'
                      )}
                    >
                      <div className="flex flex-col gap-1 pl-[44px] pr-2 py-1 relative">
                        {/* Parent connection line indicator */}
                        <div className="absolute left-[23px] top-2 bottom-4 w-px bg-gray-200" />

                        {item.subItems.filter(subItem => {
                          if (user?.role === 'super_admin') return true;
                          if (user?.role === 'admin') {
                            return (user.accessibleMenus || []).includes(subItem.id);
                          }
                          return false;
                        }).map(subItem => {
                          const SubIcon = subItem.icon;
                          const isSubActive = location.pathname.includes(subItem.id);
                          return (
                            <Link
                              key={subItem.id}
                              to={`/admin/${subItem.id}`}
                              onClick={onMobileClose}
                              className={cn(
                                'sub-item relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-sm font-medium group',
                                isSubActive
                                  ? 'bg-[#044F88] text-white shadow-sm shadow-[#044F88]/20'
                                  : 'text-[#6f6f6f] hover:bg-[#f0f5ff] hover:text-[#044F88]'
                              )}
                            >
                              <SubIcon className={cn('w-4 h-4 shrink-0', !isSubActive && 'group-hover:scale-110')} aria-hidden="true" />
                              <span className="whitespace-nowrap truncate">{subItem.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Normal standalone menu items
            return (
              <Link
                key={item.id}
                to={`/admin/${item.id}`}
                onClick={onMobileClose}
                title={isCollapsed ? item.label : undefined}
                className={cn(
                  'menu-item flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative',
                  isCollapsed && 'justify-center',
                  isActive
                    ? 'bg-[#044F88] text-white shadow-md shadow-[#044F88]/20 font-medium'
                    : 'text-[#6f6f6f] hover:bg-[#f0f5ff] hover:text-[#044F88]'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={cn('w-5 h-5 shrink-0 transition-transform duration-200', !isActive && 'group-hover:scale-110')} aria-hidden="true" />
                {!isCollapsed && (
                  <span className="text-sm whitespace-nowrap font-medium">{item.label}</span>
                )}
                {!isActive && !isCollapsed && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-[#044F88] rounded-full transition-all duration-200 group-hover:h-5" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Profile + Logout */}
        <div
          ref={profileRef}
          className={cn(
            'shrink-0 border-t border-gray-100 p-3',
          )}
        >
          <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#044F88] to-[#00223A] flex items-center justify-center shrink-0">
              <span className="text-white font-semibold text-sm" aria-hidden="true">
                {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
              </span>
            </div>
            {!isCollapsed && (
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm text-[#1d1d1d] truncate">{user?.name || 'แอดมิน'}</p>
                <p className="text-xs text-[#6f6f6f]">ผู้ดูแลระบบ</p>
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className={cn(
              'mt-2 flex items-center gap-2 w-full py-2 px-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-medium',
              isCollapsed ? 'justify-center px-0' : ''
            )}
            aria-label="ออกจากระบบ"
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            {!isCollapsed && <span>ออกจากระบบ</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
