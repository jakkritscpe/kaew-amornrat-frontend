import { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { gsap } from 'gsap';
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Settings,
  Globe,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
  X,
  Clock,
  MapPin,
  FileCheck2,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '../features/auth/hooks/useAuth';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

const menuItems = [
  { id: 'dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard },
  { id: 'requests', label: 'รายการแจ้งซ่อม', icon: ClipboardList },
  { id: 'jobs', label: 'ระบบใบงาน', icon: FileText },
  { id: 'technicians', label: 'ช่าง', icon: Users },
  { id: 'attendance/dashboard', label: 'แดชบอร์ดลงเวลา', icon: Clock },
  { id: 'attendance/logs', label: 'ประวัติลงเวลา', icon: ClipboardList },
  { id: 'attendance/employees', label: 'พนักงาน (ลงเวลา)', icon: Users },
  { id: 'attendance/locations', label: 'สถานที่ (GPS)', icon: MapPin },
  { id: 'attendance/ot-approvals', label: 'อนุมัติ OT', icon: FileCheck2 },
  { id: 'attendance/reports', label: 'รายงานเวลา', icon: BarChart3 },
  { id: 'settings', label: 'ตั้งค่า', icon: Settings },
];

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.menu-item',
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
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden',
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
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#2075f8] to-[#1a64d4] flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
              <Globe className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-[15px] text-[#1d1d1d] whitespace-nowrap leading-tight">
                  หจก.แก้วอมรรัตน์
                </span>
                <span className="text-[10px] font-bold text-[#2075f8] tracking-widest leading-none mt-0.5">
                  IT SERVICES & SOLUTIONS
                </span>
              </div>
            )}
          </div>
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
          onClick={() => setIsCollapsed(!isCollapsed)}
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
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.includes(item.id);

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
                    ? 'bg-[#2075f8] text-white shadow-md shadow-blue-500/20'
                    : 'text-[#6f6f6f] hover:bg-[#f0f5ff] hover:text-[#2075f8]'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={cn('w-5 h-5 shrink-0 transition-transform duration-200', !isActive && 'group-hover:scale-110')} aria-hidden="true" />
                {!isCollapsed && (
                  <span className="font-medium text-sm whitespace-nowrap">{item.label}</span>
                )}
                {!isActive && !isCollapsed && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-0 bg-[#2075f8] rounded-full transition-all duration-200 group-hover:h-5" />
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
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#2075f8] to-[#1a64d4] flex items-center justify-center shrink-0">
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
