import { Globe, Phone, Mail, Facebook, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Footer() {
    return (
        <footer className="bg-[#00223A] pt-20 pb-10 border-t border-[#044F88]/30">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

                    {/* Brand Setup */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-2 mb-6 text-white">
                            <Globe className="w-8 h-8" />
                            <div>
                                <span className="font-bold text-xl block leading-tight">หจก.แก้วอมรรัตน์</span>
                                <span className="text-xs text-white/60 tracking-wider">IT SERVICES & SOLUTIONS</span>
                            </div>
                        </div>
                        <p className="text-white/70 text-sm leading-relaxed mb-8">
                            บริการซ่อมและติดตั้งระบบไอทีแบบ Onsite โดยทีมช่างมืออาชีพ
                            พร้อมให้บริการทั่วกรุงเทพและปริมณฑล
                        </p>
                        <div className="flex gap-4">
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors border border-white/10">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors border border-white/10">
                                <MessageCircle className="w-5 h-5" />
                            </a>
                            <a href="#" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors border border-white/10">
                                <Phone className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Main Menu */}
                    <div>
                        <h4 className="text-white font-bold text-lg mb-6">เมนูหลัก</h4>
                        <ul className="space-y-4">
                            <li><a href="#home" className="text-white/70 hover:text-white transition-colors">หน้าหลัก</a></li>
                            <li><a href="#services" className="text-white/70 hover:text-white transition-colors">บริการ</a></li>
                            <li><a href="#contact" className="text-white/70 hover:text-white transition-colors">ติดต่อ</a></li>
                        </ul>
                    </div>

                    {/* Services Menu */}
                    <div>
                        <h4 className="text-white font-bold text-lg mb-6">บริการของเรา</h4>
                        <ul className="space-y-4">
                            <li><a href="#" className="text-white/70 hover:text-white transition-colors">Computer</a></li>
                            <li><a href="#" className="text-white/70 hover:text-white transition-colors">CCTV</a></li>
                            <li><a href="#" className="text-white/70 hover:text-white transition-colors">Server</a></li>
                            <li><a href="#" className="text-white/70 hover:text-white transition-colors">Network</a></li>
                            <li><a href="#" className="text-white/70 hover:text-white transition-colors">Firewall</a></li>
                            <li><a href="#" className="text-white/70 hover:text-white transition-colors">NAS & Backup</a></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-white font-bold text-lg mb-6">ติดต่อเรา</h4>
                        <ul className="space-y-4 mb-8 text-white/70">
                            <li className="flex items-center gap-3">
                                <Phone className="w-4 h-4 text-[#044F88]" />
                                0X-XXX-XXXX
                            </li>
                            <li className="flex items-center gap-3">
                                <Mail className="w-4 h-4 text-[#044F88]" />
                                contact@kaewamornrat.com
                            </li>
                        </ul>
                        <Button className="w-full bg-[#C2410C] hover:bg-[#C2410C]/90 text-white gap-2">
                            <Phone className="w-4 h-4" />
                            ติดต่อเลย
                        </Button>
                    </div>

                </div>

                <div className="pt-8 border-t border-white/10 text-center text-white/50 text-sm">
                    © {new Date().getFullYear()} หจก.แก้วอมรรัตน์. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
