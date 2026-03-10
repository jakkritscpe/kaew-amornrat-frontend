import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/hooks/useAuth';
import { Home, ArrowLeft } from 'lucide-react';

export function NotFoundPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const homeHref = user?.role === 'super_admin' || user?.role === 'admin'
        ? '/admin/dashboard'
        : user
        ? '/employee/attendance/today'
        : '/';

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-24 h-24 rounded-3xl bg-[#eef4ff] flex items-center justify-center mb-6 shadow-sm">
                <span className="text-5xl font-black text-[#2075f8] leading-none">4</span>
                <span className="text-5xl font-black text-[#2075f8] leading-none">0</span>
                <span className="text-5xl font-black text-[#2075f8] leading-none">4</span>
            </div>
            <h1 className="text-2xl font-bold text-[#1d1d1d] mb-2">ไม่พบหน้าที่ต้องการ</h1>
            <p className="text-[#6f6f6f] text-sm mb-8 max-w-xs">
                หน้านี้ไม่มีอยู่หรือถูกย้ายไปแล้ว
            </p>
            <div className="flex gap-3">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-[#6f6f6f] hover:bg-gray-50 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    กลับหน้าก่อน
                </button>
                <Link
                    to={homeHref}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2075f8] text-white text-sm font-semibold hover:bg-[#1a64d4] transition-colors"
                >
                    <Home className="w-4 h-4" />
                    หน้าหลัก
                </Link>
            </div>
        </div>
    );
}
