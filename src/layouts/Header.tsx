import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Search, Bell, Menu, Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onNewRequest: () => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  title: string;
  onMenuClick: () => void;
}

export default function Header({ onNewRequest, searchQuery, setSearchQuery, title, onMenuClick }: HeaderProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(headerRef.current,
        { y: -60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out' }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <header
      ref={headerRef}
      className="h-16 bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-30 px-4 lg:px-6 flex items-center justify-between gap-4"
    >
      {/* Left: Hamburger + Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className="lg:hidden flex-shrink-0 p-2 -ml-1 rounded-xl hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-blue-400"
          aria-label="เปิดเมนู"
        >
          <Menu className="w-5 h-5 text-gray-600" aria-hidden="true" />
        </button>
        <h1 className="text-lg font-bold text-[#1d1d1d] truncate">{title}</h1>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search — Expanded on desktop, icon toggle on mobile */}
        <div className="relative">
          {/* Desktop search bar */}
          <div className="hidden md:flex relative items-center">
            <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" aria-hidden="true" />
            <Input
              type="search"
              placeholder="ค้นหา…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 h-9 w-52 lg:w-64 bg-gray-50 border-gray-200 rounded-xl text-sm focus:bg-white focus:border-blue-400"
              aria-label="ค้นหารายการแจ้งซ่อม"
            />
          </div>

          {/* Mobile search toggle */}
          {!isSearchOpen && (
            <button
              className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-blue-400"
              onClick={() => setIsSearchOpen(true)}
              aria-label="ค้นหา"
              aria-expanded={isSearchOpen}
            >
              <Search className="w-5 h-5 text-gray-600" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Mobile search overlay (full width) */}
        {/* {isSearchOpen && (
          <div className="md:hidden fixed inset-x-0 top-0 h-16 bg-white z-50 flex items-center gap-2 px-4 border-b border-gray-100">
            <Search className="w-4 h-4 text-gray-400 shrink-0" aria-hidden="true" />
            <Input
              type="search"
              placeholder="ค้นหา…"
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-base"
              aria-label="ค้นหา"
            />
            <button
              onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
              className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="ปิดการค้นหา"
            >
              <X className="w-4 h-4 text-gray-500" aria-hidden="true" />
            </button>
          </div>
        )} */}

        {/* Notification */}
        <button
          className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors focus-visible:ring-2 focus-visible:ring-blue-400"
          aria-label="การแจ้งเตือน"
        >
          <Bell className="w-5 h-5 text-gray-600" aria-hidden="true" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
        </button>

        {/* New Request Button */}
        {/* <button
          onClick={onNewRequest}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-xl',
            'bg-[#2075f8] hover:bg-[#1a64d4] active:bg-[#1558c0]',
            'text-white text-sm font-semibold transition-colors',
            'focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2',
            'touch-manipulation select-none'
          )}
          style={{ touchAction: 'manipulation' }}
        >
          <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">แจ้งซ่อมใหม่</span>
          <span className="sm:hidden">ใหม่</span>
        </button> */}
      </div>
    </header>
  );
}
