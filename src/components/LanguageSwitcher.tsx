import { useTranslation } from '@/i18n';
import { cn } from '@/lib/utils';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useTranslation();

  return (
    <div className={cn('flex rounded-md bg-black/10 p-0.5 text-[11px] font-semibold', className)}>
      <button
        onClick={() => setLocale('th')}
        className={cn(
          'px-2 py-0.5 rounded transition-all',
          locale === 'th' ? 'bg-white text-[#1d1d1d] shadow-sm' : 'text-white/70 hover:text-white'
        )}
      >
        TH
      </button>
      <button
        onClick={() => setLocale('en')}
        className={cn(
          'px-2 py-0.5 rounded transition-all',
          locale === 'en' ? 'bg-white text-[#1d1d1d] shadow-sm' : 'text-white/70 hover:text-white'
        )}
      >
        EN
      </button>
    </div>
  );
}
