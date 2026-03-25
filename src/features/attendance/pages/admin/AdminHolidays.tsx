import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Holiday } from '../../types';
import { getHolidaysApi, createHolidayApi, updateHolidayApi, deleteHolidayApi } from '../../../../lib/api/holidays-api';
import { CalendarDays, Plus, Pencil, Trash2, X, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useTranslation } from '@/i18n';
import { useAdminTheme } from '@/hooks/useAdminTheme';

gsap.registerPlugin(ScrollTrigger);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string, locale = 'th-TH') {
  try {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString(locale, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

// ─── Form Modal ───────────────────────────────────────────────────────────────

interface HolidayFormData {
  date: string;
  name: string;
  description: string;
  isRecurring: boolean;
}

const EMPTY_FORM: HolidayFormData = { date: '', name: '', description: '', isRecurring: false };

interface HolidayModalProps {
  editTarget: Holiday | null;
  onClose: () => void;
  onSaved: () => void;
  dark: boolean;
}

function HolidayModal({ editTarget, onClose, onSaved, dark }: HolidayModalProps) {
  const { t } = useTranslation();
  const isEdit = !!editTarget;
  const [form, setForm] = useState<HolidayFormData>(
    isEdit
      ? { date: editTarget.date, name: editTarget.name, description: editTarget.description ?? '', isRecurring: editTarget.isRecurring }
      : EMPTY_FORM
  );
  const [saving, setSaving] = useState(false);

  const set = (field: keyof HolidayFormData, value: string | boolean) =>
    setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async () => {
    if (!form.date || !form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        date: form.date,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        isRecurring: form.isRecurring,
      };
      if (isEdit) {
        await updateHolidayApi(editTarget.id, payload);
        toast.success(t('admin.holidays.editSuccess').replace('{name}', form.name.trim()));
      } else {
        await createHolidayApi(payload);
        toast.success(t('admin.holidays.addSuccess').replace('{name}', form.name.trim()));
      }
      onSaved();
    } catch {
      toast.error(t('common.genericError'));
    } finally {
      setSaving(false);
    }
  };

  const inputCls = cn(
    'h-11 rounded-xl focus:border-[#044F88]',
    dark ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30' : 'border-gray-200 bg-white text-[#1d1d1d]'
  );
  const labelCls = cn('text-sm font-semibold block mb-2', dark ? 'text-white' : 'text-[#1d1d1d]');

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh]',
        dark ? 'bg-[#1e293b] border border-white/10' : 'bg-white border border-gray-100'
      )}>
        {/* Header */}
        <div className={cn('flex items-center justify-between p-6 pb-4 border-b shrink-0', dark ? 'border-white/10' : 'border-gray-100')}>
          <div>
            <h2 className={cn('text-lg font-bold', dark ? 'text-white' : 'text-[#1d1d1d]')}>
              {isEdit ? t('admin.holidays.formTitleEdit') : t('admin.holidays.formTitleAdd')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={cn('p-2 rounded-xl transition-colors', dark ? 'text-white/40 hover:bg-white/10' : 'text-gray-400 hover:bg-gray-100')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Date */}
          <div>
            <label className={labelCls}>{t('admin.holidays.dateLabel')}</label>
            <Input
              type="date"
              value={form.date}
              onChange={e => set('date', e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Name */}
          <div>
            <label className={labelCls}>{t('admin.holidays.nameLabel')}</label>
            <Input
              placeholder={t('admin.holidays.namePlaceholder')}
              value={form.name}
              onChange={e => set('name', e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Description */}
          <div>
            <label className={cn(labelCls, 'flex items-center gap-1')}>
              {t('admin.holidays.descriptionLabel')}
              <span className={cn('text-xs font-normal', dark ? 'text-white/40' : 'text-gray-400')}>
                ({t('admin.employees.avatarOptional')})
              </span>
            </label>
            <textarea
              placeholder={t('admin.holidays.descriptionPlaceholder')}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              rows={2}
              className={cn(
                'w-full rounded-xl border px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-[#044F88] transition-colors',
                dark ? 'border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:border-[#044F88]' : 'border-gray-200 bg-white text-[#1d1d1d] focus:border-[#044F88]'
              )}
            />
          </div>

          {/* Is Recurring */}
          <div
            onClick={() => set('isRecurring', !form.isRecurring)}
            className={cn(
              'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors select-none',
              form.isRecurring
                ? dark ? 'bg-[#044F88]/20 border-[#044F88]/50' : 'bg-[#044F88]/5 border-[#044F88]/30'
                : dark ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'
            )}
          >
            <div className={cn(
              'w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border-2 transition-colors',
              form.isRecurring
                ? 'bg-[#044F88] border-[#044F88]'
                : dark ? 'border-white/20' : 'border-gray-300'
            )}>
              {form.isRecurring && <span className="text-white text-xs font-bold">✓</span>}
            </div>
            <div>
              <p className={cn('text-sm font-semibold', dark ? 'text-white' : 'text-[#1d1d1d]')}>
                {t('admin.holidays.isRecurringLabel')}
              </p>
              <p className={cn('text-xs mt-0.5', dark ? 'text-white/50' : 'text-gray-500')}>
                {t('admin.holidays.isRecurringHint')}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={cn('flex gap-3 p-6 pt-4 border-t shrink-0', dark ? 'border-white/10' : 'border-gray-100')}>
          <Button
            variant="outline"
            onClick={onClose}
            className={cn('flex-1', dark ? 'border-white/10 text-white hover:bg-white/10' : '')}
            disabled={saving}
          >
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving || !form.date || !form.name.trim()}
            className="flex-1 bg-[#044F88] hover:bg-[#044F88]/90 text-white"
          >
            {saving ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('common.saving')}</span>
            ) : (
              isEdit ? t('admin.holidays.saveEdit') : t('admin.holidays.saveAdd')
            )}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────

function DeleteModal({ holiday, onClose, onDeleted, dark }: {
  holiday: Holiday; onClose: () => void; onDeleted: () => void; dark: boolean;
}) {
  const { t } = useTranslation();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteHolidayApi(holiday.id);
      toast.success(t('admin.holidays.deleteSuccess').replace('{name}', holiday.name));
      onDeleted();
    } catch {
      toast.error(t('admin.holidays.deleteFail'));
      setDeleting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        'relative w-full max-w-sm rounded-2xl shadow-2xl p-6',
        dark ? 'bg-[#1e293b] border border-white/10' : 'bg-white border border-gray-100'
      )}>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className={cn('font-bold text-base', dark ? 'text-white' : 'text-[#1d1d1d]')}>
              {t('admin.holidays.deleteConfirmTitle')}
            </h3>
            <p className={cn('text-sm mt-0.5', dark ? 'text-white/60' : 'text-gray-500')}>
              {t('admin.holidays.deleteConfirmMsg').replace('{name}', holiday.name)}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onClose} disabled={deleting}
            className={cn('flex-1', dark ? 'border-white/10 text-white hover:bg-white/10' : '')}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleDelete} disabled={deleting}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white">
            {deleting ? (
              <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('common.deleting')}</span>
            ) : t('common.delete')}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AdminHolidays() {
  const { t } = useTranslation();
  const { dark } = useAdminTheme();

  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [filter, setFilter] = useState<'all' | 'recurring' | 'onetime'>('all');
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Holiday | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Holiday | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getHolidaysApi(year);
      setHolidays(data);
    } catch {
      setError(t('common.genericError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [year]);

  // GSAP entrance
  useEffect(() => {
    if (loading) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('.page-header', { y: -20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out' });
      gsap.fromTo('.dashboard-section', { y: 30, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.5, ease: 'power3.out',
        scrollTrigger: { trigger: containerRef.current, start: 'top 80%', toggleActions: 'play none none none' },
      });
      gsap.fromTo('.holiday-row',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.35, stagger: 0.05, ease: 'power2.out', delay: 0.15 }
      );
    });
    return () => ctx.revert();
  }, [loading, holidays.length]);

  // Filter + sort displayed holidays
  const displayed = holidays
    .filter(h => {
      if (filter === 'recurring') return h.isRecurring;
      if (filter === 'onetime') return !h.isRecurring;
      return true;
    })
    .sort((a, b) => a.date.localeCompare(b.date));

  const filterBtnCls = (active: boolean) => cn(
    'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
    active
      ? 'bg-[#044F88] text-white shadow-sm'
      : dark ? 'text-white/50 hover:bg-white/10' : 'text-gray-500 hover:bg-gray-100'
  );

  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 1 + i);

  return (
    <div ref={containerRef} className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="page-header flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#044F88]/10 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-[#044F88]" />
            </div>
            <div>
              <h1 className={cn('text-xl font-bold', dark ? 'text-white' : 'text-[#1d1d1d]')}>
                {t('admin.holidays.title')}
              </h1>
              <p className={cn('text-sm', dark ? 'text-white/50' : 'text-gray-500')}>
                {t('admin.holidays.subtitle')}
              </p>
            </div>
          </div>
        </div>
        <Button
          onClick={() => { setEditTarget(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-[#044F88] hover:bg-[#044F88]/90 text-white rounded-xl"
        >
          <Plus className="w-4 h-4" />
          {t('admin.holidays.addHoliday')}
        </Button>
      </div>

      {/* Controls */}
      <div className="dashboard-section flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Filter tabs */}
        <div className={cn('flex gap-1 p-1 rounded-xl', dark ? 'bg-white/5' : 'bg-gray-100')}>
          <button onClick={() => setFilter('all')} className={filterBtnCls(filter === 'all')}>
            {t('admin.holidays.filterAll')}
          </button>
          <button onClick={() => setFilter('recurring')} className={filterBtnCls(filter === 'recurring')}>
            {t('admin.holidays.filterRecurring')}
          </button>
          <button onClick={() => setFilter('onetime')} className={filterBtnCls(filter === 'onetime')}>
            {t('admin.holidays.filterOneTime')}
          </button>
        </div>

        {/* Year picker + count */}
        <div className="flex items-center gap-3">
          <span className={cn('text-sm', dark ? 'text-white/50' : 'text-gray-500')}>
            {t('admin.holidays.yearFilter')}:
          </span>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className={cn(
              'h-9 px-3 rounded-xl text-sm border focus:outline-none focus:ring-1 focus:ring-[#044F88] cursor-pointer',
              dark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-[#1d1d1d]'
            )}
          >
            {yearOptions.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          {!loading && (
            <span className={cn('text-sm', dark ? 'text-white/40' : 'text-gray-400')}>
              {t('admin.holidays.totalCount').replace('{n}', String(displayed.length))}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="dashboard-section">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className={cn('w-8 h-8 animate-spin', dark ? 'text-white/30' : 'text-gray-300')} />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <p className={cn('text-sm', dark ? 'text-white/50' : 'text-gray-500')}>{error}</p>
            <Button variant="outline" onClick={load} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />{t('common.retry')}
            </Button>
          </div>
        ) : displayed.length === 0 ? (
          <div className={cn('rounded-2xl border flex flex-col items-center justify-center py-20 gap-3', dark ? 'bg-white/[0.03] border-white/10' : 'bg-gray-50 border-gray-100')}>
            <CalendarDays className={cn('w-12 h-12', dark ? 'text-white/20' : 'text-gray-200')} />
            <p className={cn('text-sm font-medium', dark ? 'text-white/40' : 'text-gray-400')}>{t('admin.holidays.noData')}</p>
            <p className={cn('text-xs', dark ? 'text-white/30' : 'text-gray-300')}>{t('admin.holidays.noDataHint')}</p>
          </div>
        ) : (
          <div className={cn('rounded-2xl border overflow-hidden', dark ? 'border-white/10' : 'border-gray-100')}>
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {displayed.map((holiday) => (
                <div
                  key={holiday.id}
                  className={cn(
                    'holiday-row flex items-center gap-4 p-4 transition-colors',
                    dark ? 'hover:bg-white/[0.03] divide-white/10' : 'hover:bg-gray-50/80'
                  )}
                >
                  {/* Date badge */}
                  <div className={cn(
                    'flex flex-col items-center justify-center w-14 h-14 rounded-xl shrink-0 text-center',
                    dark ? 'bg-[#044F88]/20' : 'bg-[#044F88]/5'
                  )}>
                    <span className="text-[#044F88] font-bold text-lg leading-none">
                      {holiday.date.split('-')[2]}
                    </span>
                    <span className={cn('text-xs mt-0.5', dark ? 'text-white/40' : 'text-gray-400')}>
                      {new Date(holiday.date + 'T00:00:00').toLocaleDateString('th-TH', { month: 'short' })}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={cn('font-semibold text-sm truncate', dark ? 'text-white' : 'text-[#1d1d1d]')}>
                        {holiday.name}
                      </p>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-medium shrink-0',
                        holiday.isRecurring
                          ? dark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-50 text-blue-600'
                          : dark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-50 text-purple-600'
                      )}>
                        {holiday.isRecurring ? t('admin.holidays.recurring') : t('admin.holidays.oneTime')}
                      </span>
                    </div>
                    <p className={cn('text-xs mt-1', dark ? 'text-white/40' : 'text-gray-400')}>
                      {formatDate(holiday.date)}
                    </p>
                    {holiday.description && (
                      <p className={cn('text-xs mt-1 truncate', dark ? 'text-white/30' : 'text-gray-400')}>
                        {holiday.description}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setEditTarget(holiday); setShowForm(true); }}
                      aria-label={t('admin.holidays.editLabel')}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        dark ? 'text-white/30 hover:bg-white/10 hover:text-white' : 'text-gray-400 hover:bg-gray-100 hover:text-[#1d1d1d]'
                      )}
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(holiday)}
                      aria-label={t('admin.holidays.deleteLabel')}
                      className={cn(
                        'p-2 rounded-lg transition-colors',
                        dark ? 'text-white/30 hover:bg-red-500/10 hover:text-red-400' : 'text-gray-400 hover:bg-red-50 hover:text-red-500'
                      )}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showForm && (
        <HolidayModal
          editTarget={editTarget}
          dark={dark}
          onClose={() => { setShowForm(false); setEditTarget(null); }}
          onSaved={() => { setShowForm(false); setEditTarget(null); load(); }}
        />
      )}
      {deleteTarget && (
        <DeleteModal
          holiday={deleteTarget}
          dark={dark}
          onClose={() => setDeleteTarget(null)}
          onDeleted={() => { setDeleteTarget(null); load(); }}
        />
      )}
    </div>
  );
}
