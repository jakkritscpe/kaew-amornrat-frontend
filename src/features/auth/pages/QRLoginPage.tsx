import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { qrLoginApi } from '../../../lib/api/auth-api';
import { setToken, EMPLOYEE_KEY, USER_KEY } from '../../../lib/api-client';
import type { User } from '../types';
import { useTranslation } from '@/i18n';

export function QRLoginPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(token ? 'loading' : 'error');
  const [errorMsg, setErrorMsg] = useState(token ? '' : t('auth.qrInvalid'));
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!token) return;

    qrLoginApi(token)
      .then((result) => {
        setToken(result.token);
        localStorage.setItem(EMPLOYEE_KEY, JSON.stringify(result.user));

        const role = result.user.role;
        if (role === 'admin' || role === 'manager') {
          const adminUser: User = {
            id: result.user.id,
            username: result.user.email,
            name: result.user.name,
            role: role === 'admin' ? 'super_admin' : 'admin',
            employeeId: result.user.id,
            accessibleMenus: result.user.accessibleMenus || [],
          };
          localStorage.setItem(USER_KEY, JSON.stringify(adminUser));
          setIsAdmin(true);
          setStatus('success');
          setTimeout(() => navigate('/admin/dashboard', { replace: true }), 1200);
        } else {
          setStatus('success');
          setTimeout(() => navigate('/employee/attendance/today', { replace: true }), 1200);
        }
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : t('auth.qrExpired'));
      });
  }, [token, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#044F88] to-[#00223A] flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-semibold">{t('auth.loggingIn')}</h2>
          <p className="text-[#044F88]/80 mt-2 text-sm">{t('auth.pleaseWait')}</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-emerald-700 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✓</span>
          </div>
          <h2 className="text-2xl font-bold">{t('auth.loginSuccess')}</h2>
          <p className="text-green-200 mt-2">
            {isAdmin ? t('auth.redirectToDashboard') : t('auth.redirectToAttendance')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center p-4">
      <div className="text-center text-white max-w-sm">
        <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✕</span>
        </div>
        <h2 className="text-2xl font-bold">{t('auth.qrInvalid')}</h2>
        <p className="text-red-200 mt-2 mb-6">{errorMsg}</p>
        <p className="text-sm text-red-200">{t('auth.noQrContact')} {t('auth.systemAdmin')}</p>
      </div>
    </div>
  );
}
