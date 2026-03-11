import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Menu } from 'lucide-react';
import { NotificationBell } from '../features/attendance/components/NotificationBell';
import { TOKEN_KEY } from '../lib/api-client';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

export default function Header({ title, onMenuClick }: HeaderProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem(TOKEN_KEY);

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
        <NotificationBell token={token} />
      </div>
    </header>
  );
}
