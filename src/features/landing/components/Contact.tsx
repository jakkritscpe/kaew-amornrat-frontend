import { MapPin, Clock, Phone, Mail, Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useTranslation } from '@/i18n';

export function Contact() {
    const { t } = useTranslation();

    return (
        <section id="contact" className="py-24 bg-white">
            <div className="container mx-auto px-4 md:px-6">
                <div className="bg-[#f8fafc] rounded-[2.5rem] p-6 lg:p-12">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24">

                        {/* Left Info */}
                        <div className="bg-[#00223A] rounded-3xl p-8 lg:p-12 text-white flex flex-col justify-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#044F88] rounded-full filter blur-[100px] opacity-50 translate-x-1/2 -translate-y-1/2" />

                            <div className="relative z-10">
                                <h2 className="text-3xl font-bold mb-8">{t('landing.contact.title')}</h2>

                                <div className="space-y-6">
                                    <a href="tel:0854288897" className="flex items-start gap-4 group">
                                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                            <Phone className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-lg mb-1">{t('landing.contact.phone')}</h4>
                                            <p className="text-white/70 group-hover:text-white transition-colors">085-428-8897</p>
                                        </div>
                                    </a>

                                    <a href="mailto:noratep7@hotmail.com" className="flex items-start gap-4 group">
                                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-lg mb-1">{t('landing.contact.email')}</h4>
                                            <p className="text-white/70 group-hover:text-white transition-colors">noratep7@hotmail.com</p>
                                        </div>
                                    </a>

                                    <a href="https://line.me/R/ti/p/@231yswce" target="_blank" rel="noopener noreferrer" className="flex items-start gap-4 group">
                                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                            <MessageCircle className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-lg mb-1">LINE</h4>
                                            <p className="text-white/70 group-hover:text-white transition-colors">@231yswce</p>
                                        </div>
                                    </a>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                            <MapPin className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-lg mb-1">{t('landing.contact.serviceArea')}</h4>
                                            <p className="text-white/70">{t('landing.contact.serviceAreaValue')}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-lg mb-1">{t('landing.contact.workingHours')}</h4>
                                            <p className="text-white/70">{t('landing.contact.workingHoursValue')}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-12 pt-8 border-t border-white/10">
                                    <p className="text-lg font-medium text-white/50 mb-2">{t('common.companyName')}</p>
                                    <p className="text-sm text-white/50">{t('landing.contact.companyTagline')}</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Form */}
                        <div className="flex flex-col justify-center">
                            <div className="mb-8">
                                <h3 className="text-2xl font-bold text-[#00223A] mb-2">{t('landing.contact.sendMessage')}</h3>
                                <p className="text-[#6f6f6f]">{t('landing.contact.sendMessageDesc')}</p>
                            </div>

                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">{t('landing.contact.nameLabel')}</Label>
                                        <Input id="name" placeholder={t('landing.contact.namePlaceholder')} className="h-12 bg-white" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">{t('landing.contact.phoneLabel')}</Label>
                                        <Input id="phone" placeholder={t('landing.contact.phonePlaceholder')} className="h-12 bg-white" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="service">{t('landing.contact.serviceLabel')}</Label>
                                    <Input id="service" placeholder={t('landing.contact.servicePlaceholder')} className="h-12 bg-white" />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">{t('landing.contact.messageLabel')}</Label>
                                    <Textarea id="message" placeholder={t('landing.contact.messagePlaceholder')} className="min-h-[120px] bg-white resize-none" />
                                </div>

                                <Button className="w-full h-14 bg-[#C2410C] hover:bg-[#C2410C]/90 text-white text-lg rounded-xl">
                                    <Send className="w-5 h-5 mr-2" />
                                    {t('landing.contact.submit')}
                                </Button>
                            </form>
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
