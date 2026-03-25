import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { loginApi } from '../../../lib/api/auth-api';
import { EMPLOYEE_KEY } from '../../../lib/api-client';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/i18n';

export function EmployeeLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({ email: false, password: false });
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  const emailError = touched.email && !email ? t('auth.emailRequired') : '';
  const passwordError = touched.password && !password ? t('auth.passwordRequired') : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ email: true, password: true });
    setError('');

    if (!email || !password) return;

    setLoading(true);
    try {
      const result = await loginApi(email, password);
      localStorage.setItem(EMPLOYEE_KEY, JSON.stringify(result.user));
      navigate('/employee/attendance/today');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#044F88] to-[#00223A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Header */}
          <div className="flex flex-col items-center mb-6">
            <Link to="/">
              <img
                src="/logo.svg"
                alt={t('common.companyName')}
                className="h-28 w-auto object-contain mb-4 cursor-pointer"
              />
            </Link>
            <p className="text-gray-500 text-sm">{t('auth.employeeSubtitle')}</p>
          </div>

          {/* Global error */}
          <div
            className={cn(
              'overflow-hidden transition-all duration-300 ease-out',
              error ? 'max-h-20 opacity-100 mb-5' : 'max-h-0 opacity-0 mb-0'
            )}
            role="alert"
            aria-live="assertive"
          >
            <div className="flex items-center gap-2.5 bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
              {error}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="emp-email" className="block text-sm font-medium text-gray-700">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 pointer-events-none" aria-hidden="true" />
                <input
                  ref={emailRef}
                  id="emp-email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  onBlur={() => setTouched(p => ({ ...p, email: true }))}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? 'emp-email-error' : undefined}
                  className={cn(
                    'w-full pl-11 pr-4 py-3 rounded-xl border bg-gray-50 text-sm transition-colors placeholder:text-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-[#044F88]/30 focus:border-[#044F88] focus:bg-white',
                    emailError ? 'border-red-300' : 'border-gray-200'
                  )}
                  placeholder="email@company.com"
                />
              </div>
              {emailError && (
                <p id="emp-email-error" className="text-xs text-red-500 mt-1">{emailError}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="emp-password" className="block text-sm font-medium text-gray-700">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-gray-400 pointer-events-none" aria-hidden="true" />
                <input
                  id="emp-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  onBlur={() => setTouched(p => ({ ...p, password: true }))}
                  aria-invalid={!!passwordError}
                  aria-describedby={passwordError ? 'emp-password-error' : undefined}
                  className={cn(
                    'w-full pl-11 pr-11 py-3 rounded-xl border bg-gray-50 text-sm transition-colors placeholder:text-gray-400',
                    'focus:outline-none focus:ring-2 focus:ring-[#044F88]/30 focus:border-[#044F88] focus:bg-white',
                    passwordError ? 'border-red-300' : 'border-gray-200'
                  )}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                  tabIndex={-1}
                >
                  {showPassword
                    ? <EyeOff className="w-[18px] h-[18px]" />
                    : <Eye className="w-[18px] h-[18px]" />
                  }
                </button>
              </div>
              {passwordError && (
                <p id="emp-password-error" className="text-xs text-red-500 mt-1">{passwordError}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#044F88] hover:bg-[#00223A] active:scale-[0.98] disabled:bg-[#044F88]/60 disabled:pointer-events-none text-white font-semibold py-3 rounded-xl transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  {t('auth.loggingIn')}
                </span>
              ) : (
                t('auth.login')
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            {t('auth.contactAdminForPassword')}
          </p>
        </div>
      </div>
    </div>
  );
}
