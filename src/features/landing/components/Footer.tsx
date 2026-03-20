import { Phone, Mail, Facebook, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/i18n';

export function Footer() {
    const { t } = useTranslation();

    return (
        <footer className="bg-[#00223A] pt-20 pb-10 border-t border-[#044F88]/30">
            <div className="container mx-auto px-4 md:px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">

                    {/* Brand Setup */}
                    <div className="lg:col-span-1">
                        <div className="flex items-center gap-3 mb-6">
                            <img src="/logo.svg" alt={t('common.companyName')} className="h-10 w-auto object-contain brightness-0 invert" />
                            <div>
                                <span className="font-bold text-xl text-white block leading-tight">{t('common.companyName')}</span>
                                <span className="text-xs text-white/60 tracking-wider font-bold">IT SERVICES & SOLUTIONS</span>
                            </div>
                        </div>
                        <p className="text-white/70 text-sm leading-relaxed mb-8">
                            {t('landing.footer.description')}
                        </p>
                        <div className="flex gap-4">
                            <a href="https://www.facebook.com/NorFreelance" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors border border-white/10">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="https://line.me/R/ti/p/@231yswce" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors border border-white/10">
                                <MessageCircle className="w-5 h-5" />
                            </a>
                            <a href="tel:0854288897" className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors border border-white/10">
                                <Phone className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Main Menu */}
                    <div>
                        <h4 className="text-white font-bold text-lg mb-6">{t('landing.footer.mainMenu')}</h4>
                        <ul className="space-y-4">
                            <li><a href="#home" className="text-white/70 hover:text-white transition-colors">{t('landing.footer.home')}</a></li>
                            <li><a href="#services" className="text-white/70 hover:text-white transition-colors">{t('landing.footer.services')}</a></li>
                            <li><a href="#contact" className="text-white/70 hover:text-white transition-colors">{t('landing.footer.contact')}</a></li>
                        </ul>
                    </div>

                    {/* Services Menu */}
                    <div>
                        <h4 className="text-white font-bold text-lg mb-6">{t('landing.footer.ourServices')}</h4>
                        <ul className="space-y-4">
                            <li><a href="#services" className="text-white/70 hover:text-white transition-colors">Computer</a></li>
                            <li><a href="#services" className="text-white/70 hover:text-white transition-colors">CCTV</a></li>
                            <li><a href="#services" className="text-white/70 hover:text-white transition-colors">Server</a></li>
                            <li><a href="#services" className="text-white/70 hover:text-white transition-colors">Network</a></li>
                            <li><a href="#services" className="text-white/70 hover:text-white transition-colors">Firewall</a></li>
                            <li><a href="#services" className="text-white/70 hover:text-white transition-colors">NAS & Backup</a></li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h4 className="text-white font-bold text-lg mb-6">{t('landing.footer.contactUs')}</h4>
                        <ul className="space-y-4 mb-8 text-white/70">
                            <li>
                                <a href="tel:0854288897" className="flex items-center gap-3 hover:text-white transition-colors">
                                    <Phone className="w-4 h-4 text-[#C2410C]" />
                                    085-428-8897
                                </a>
                            </li>
                            <li>
                                <a href="mailto:noratep7@hotmail.com" className="flex items-center gap-3 hover:text-white transition-colors">
                                    <Mail className="w-4 h-4 text-[#C2410C]" />
                                    noratep7@hotmail.com
                                </a>
                            </li>
                            <li>
                                <a href="https://line.me/R/ti/p/@231yswce" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-white transition-colors">
                                    <MessageCircle className="w-4 h-4 text-[#C2410C]" />
                                    LINE: @231yswce
                                </a>
                            </li>
                        </ul>
                        <a href="tel:0854288897">
                            <Button className="w-full bg-[#C2410C] hover:bg-[#C2410C]/90 text-white gap-2">
                                <Phone className="w-4 h-4" />
                                {t('landing.footer.callNow')}
                            </Button>
                        </a>
                    </div>

                </div>

                <div className="pt-8 border-t border-white/10 text-center text-white/50 text-sm">
                    © {new Date().getFullYear()} {t('common.companyName')}. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
