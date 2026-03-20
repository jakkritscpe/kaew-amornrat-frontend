import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Menu, Sun, Moon, HelpCircle } from 'lucide-react';
import { NotificationBell } from '../features/attendance/components/NotificationBell';
import { TOKEN_KEY } from '../lib/api-client';
import { cn } from '@/lib/utils';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  dark?: boolean;
  onToggleTheme?: () => void;
  onHelpClick?: () => void;
}

export default function Header({ title, onMenuClick, dark, onToggleTheme, onHelpClick }: HeaderProps) {
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
      className={cn(
        'h-16 backdrop-blur-md border-b sticky top-0 z-30 px-4 lg:px-6 flex items-center justify-between gap-4 transition-colors',
        dark ? 'bg-[#0f172a]/90 border-white/10' : 'bg-white/90 border-gray-100'
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onMenuClick}
          className={cn(
            'lg:hidden flex-shrink-0 p-2 -ml-1 rounded-xl transition-colors',
            dark ? 'hover:bg-white/10' : 'hover:bg-gray-100'
          )}
          aria-label="Menu"
        >
          <Menu className={cn('w-5 h-5', dark ? 'text-white/70' : 'text-gray-600')} />
        </button>
        <h1 className={cn('text-lg font-bold truncate', dark ? 'text-white' : 'text-[#1d1d1d]')}>{title}</h1>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {onHelpClick && (
          <button
            onClick={onHelpClick}
            data-tour="help-btn"
            className={cn(
              'p-2 rounded-xl transition-all duration-200',
              dark ? 'bg-white/10 text-white/50 hover:bg-white/15 hover:text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
            )}
            title="Help"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        )}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            data-tour="theme-toggle"
            className={cn(
              'p-2 rounded-xl transition-all duration-200',
              dark ? 'bg-white/10 text-amber-400 hover:bg-white/15' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )}
            title={dark ? 'Light mode' : 'Dark mode'}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        )}
        <NotificationBell token={token} />
      </div>
    </header>
  );
}
