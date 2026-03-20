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
import { useTranslation } from '@/i18n';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
  isMobileOpen: boolean;
  onMobileClose: () => void;
  dark?: boolean;
  onToggleTheme?: () => void;
}

type MenuItem = {
  id: string;
  label: string;
  icon: React.ElementType;
  subItems?: { id: string; label: string; icon: React.ElementType }[];
};

export default function Sidebar({ isCollapsed, setIsCollapsed, isMobileOpen, onMobileClose, dark }: SidebarProps) {
  const { t } = useTranslation();

  const menuItems: MenuItem[] = [
    {
      id: 'attendance',
      label: t('nav.attendanceSystem'),
      icon: Clock,
      subItems: [
        { id: 'attendance/dashboard', label: t('nav.dashboard'), icon: LayoutDashboard },
        { id: 'attendance/logs', label: t('nav.attendanceLogs'), icon: ClipboardList },
        { id: 'attendance/employees', label: t('nav.employees'), icon: Users },
        { id: 'attendance/locations', label: t('nav.locations'), icon: MapPin },
        { id: 'attendance/ot-approvals', label: t('nav.otApprovals'), icon: FileCheck2 },
        { id: 'attendance/ot-calculator', label: t('nav.otCalculator'), icon: Calculator },
        { id: 'attendance/reports', label: t('nav.reports'), icon: BarChart3 },
      ]
    },
    { id: 'settings', label: t('nav.settings'), icon: Settings },
  ];
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
          'fixed left-0 top-0 h-full z-50 border-r shadow-xl transition-colors',
          dark ? 'bg-[#1e293b] border-white/10' : 'bg-white border-gray-200/60',
          'flex flex-col transition-transform duration-300 ease-out',
          // Width: collapsed on desktop
          isCollapsed ? 'w-20' : 'w-[260px]',
          // Mobile: slide in/out via transform
          isMobileOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: always visible (override the mobile transform)
          'lg:translate-x-0',
          // On mobile when collapsed=false, slide open nicely
        )}
        aria-label={t('nav.navbar')}
      >
        {/* Logo */}
        <div className={cn('h-16 flex items-center justify-between px-4 border-b shrink-0', dark ? 'border-white/10' : 'border-gray-100')}>
          <Link to="/" className="flex items-center gap-3 overflow-hidden">
            <img src="/logo.svg" alt={t('common.companyName')} className="w-9 h-9 shrink-0 object-contain" />
            {!isCollapsed && (
              <div className="flex flex-col">
                <span className={cn('font-bold text-[15px] whitespace-nowrap leading-tight', dark ? 'text-white' : 'text-[#00223A]')}>
                  {t('common.companyName')}
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
            className={cn('lg:hidden p-1.5 rounded-lg transition-colors', dark ? 'text-white/50 hover:bg-white/10' : 'text-gray-400 hover:bg-gray-100')}
            aria-label={t('nav.closeMenu')}
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
          className={cn('hidden lg:flex absolute -right-3 top-[72px] w-6 h-6 rounded-full shadow-md border items-center justify-center transition-colors z-10', dark ? 'bg-[#1e293b] border-white/20 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-gray-50')}
          aria-label={isCollapsed ? t('nav.expandMenu') : t('nav.collapseMenu')}
        >
          {isCollapsed
            ? <ChevronRight className="w-3 h-3 text-gray-500" aria-hidden="true" />
            : <ChevronLeft className="w-3 h-3 text-gray-500" aria-hidden="true" />
          }
        </button>

        {/* Nav items */}
        <nav ref={menuRef} className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5" aria-label={t('nav.mainMenu')}>
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
                        ? dark ? 'bg-white/10 text-white font-medium' : 'bg-[#f0f5ff] text-[#044F88] font-medium'
                        : dark ? 'text-white/50 hover:bg-white/[0.06] hover:text-white' : 'text-[#6f6f6f] hover:bg-[#f0f5ff] hover:text-[#044F88]'
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
                                  : dark ? 'text-white/50 hover:bg-white/[0.06] hover:text-white' : 'text-[#6f6f6f] hover:bg-[#f0f5ff] hover:text-[#044F88]'
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
                    : dark ? 'text-white/50 hover:bg-white/[0.06] hover:text-white' : 'text-[#6f6f6f] hover:bg-[#f0f5ff] hover:text-[#044F88]'
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
            'shrink-0 border-t p-3', dark ? 'border-white/10' : 'border-gray-100',
          )}
        >
          <div className={cn('flex items-center gap-3', isCollapsed && 'justify-center')}>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#044F88] to-[#00223A] flex items-center justify-center shrink-0">
              <span className="text-white font-semibold text-sm" aria-hidden="true">
                {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
              </span>
            </div>
            {!isCollapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className={cn('font-semibold text-sm truncate', dark ? 'text-white' : 'text-[#1d1d1d]')}>{user?.name || t('nav.admin')}</p>
                  <p className={cn('text-xs', dark ? 'text-white/50' : 'text-[#6f6f6f]')}>{t('nav.adminRole')}</p>
                </div>
                <LanguageSwitcher className={cn('shrink-0', dark ? 'bg-white/10' : 'bg-gray-100')} />
              </>
            )}
          </div>

          <button
            onClick={logout}
            className={cn(
              'mt-2 flex items-center gap-2 w-full py-2 px-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors text-sm font-medium',
              isCollapsed ? 'justify-center px-0' : ''
            )}
            aria-label={t('nav.logout')}
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            {!isCollapsed && <span>{t('nav.logout')}</span>}
          </button>

        </div>
      </aside>
    </>
  );
}
