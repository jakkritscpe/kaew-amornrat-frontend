import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { qrLoginApi } from '../../../lib/api/auth-api';

export function QRLoginPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMsg('QR code ไม่ถูกต้อง');
      return;
    }

    qrLoginApi(token)
      .then((result) => {
        // Store employee info
        localStorage.setItem('attendance_employee', JSON.stringify(result.user));
        setStatus('success');
        setTimeout(() => navigate('/employee/attendance/today'), 1000);
      })
      .catch((err) => {
        setStatus('error');
        setErrorMsg(err instanceof Error ? err.message : 'QR code ไม่ถูกต้องหรือหมดอายุ');
      });
  }, [token, navigate]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-semibold">กำลังเข้าสู่ระบบ...</h2>
          <p className="text-blue-200 mt-2 text-sm">กรุณารอสักครู่</p>
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
          <h2 className="text-2xl font-bold">เข้าสู่ระบบสำเร็จ</h2>
          <p className="text-green-200 mt-2">กำลังนำไปยังหน้าบันทึกเวลา...</p>
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
        <h2 className="text-2xl font-bold">QR Code ไม่ถูกต้อง</h2>
        <p className="text-red-200 mt-2 mb-6">{errorMsg}</p>
        <p className="text-sm text-red-200">กรุณาติดต่อผู้ดูแลระบบเพื่อขอ QR code ใหม่</p>
      </div>
    </div>
  );
}
