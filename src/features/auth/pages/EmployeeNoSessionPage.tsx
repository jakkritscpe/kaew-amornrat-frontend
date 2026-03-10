import { QrCode } from 'lucide-react';

export function EmployeeNoSessionPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center p-4">
      <div className="text-center text-white max-w-sm">
        <div className="w-24 h-24 bg-white/10 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <QrCode className="w-12 h-12 text-white/70" />
        </div>
        <h1 className="text-2xl font-bold mb-3">กรุณาสแกน QR Code</h1>
        <p className="text-slate-300 text-sm leading-relaxed">
          สแกน QR code บนบัตรพนักงานของคุณ<br />
          เพื่อเข้าสู่ระบบบันทึกเวลาทำงาน
        </p>
        <div className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10">
          <p className="text-xs text-slate-400">
            หากยังไม่มี QR code กรุณาติดต่อ<br />
            <span className="text-white font-medium">ผู้ดูแลระบบ</span>
          </p>
        </div>
      </div>
    </div>
  );
}
