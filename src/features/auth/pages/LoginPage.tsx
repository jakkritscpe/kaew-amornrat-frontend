import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Lock, Mail, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { loginWithCredentials, isLoading } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('กรุณากรอกข้อมูลให้ครบถ้วน');
            return;
        }

        try {
            await loginWithCredentials!(email, password);
            navigate('/admin');
        } catch {
            setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col justify-center items-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-[2rem] p-8 sm:p-10 shadow-sm border border-gray-100">
                    {/* Logo and Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2075f8] to-[#1a64d4] flex items-center justify-center shadow-xl shadow-blue-500/20 mb-5">
                            <Globe className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-[#1d1d1d] text-center">หจก.แก้วอมรรัตน์</h1>
                        <p className="text-[#2075f8] font-bold mt-1 text-[13px] tracking-[0.15em] text-center">IT SERVICES & SOLUTIONS</p>
                        <p className="text-[#6f6f6f] mt-4 text-sm font-medium text-center">เข้าสู่ระบบเพื่อจัดการข้อมูล</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#1d1d1d]">อีเมล</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    type="email"
                                    placeholder="admin@repair-hub.local"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-[#1d1d1d]">รหัสผ่าน</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 h-12 bg-gray-50 border-gray-200 focus:bg-white"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            className="w-full h-12 bg-[#2075f8] hover:bg-[#1a64d4] text-white text-base rounded-xl mt-4"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    กำลังเข้าสู่ระบบ...
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    เข้าสู่ระบบ
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </div>
                            )}
                        </Button>
                    </form>
                </div>

                {/* Footer info */}
                <p className="text-center text-[#6f6f6f] text-sm mt-8">
                    ทดสอบระบบ: <span className="font-bold text-[#1d1d1d]">admin@repair-hub.local</span> / <span className="font-bold text-[#1d1d1d]">admin1234</span>
                </p>
            </div>
        </div>
    );
}
