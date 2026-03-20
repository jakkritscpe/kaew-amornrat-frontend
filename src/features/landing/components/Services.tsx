import { useEffect, useRef } from 'react';
import { Monitor, Video, Server, Wifi, Shield, Database, RefreshCcw } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useTranslation } from '@/i18n';

gsap.registerPlugin(ScrollTrigger);

const serviceKeys = [
    { key: 'computer', icon: Monitor },
    { key: 'cctv', icon: Video },
    { key: 'server', icon: Server },
    { key: 'network', icon: Wifi },
    { key: 'firewall', icon: Shield },
    { key: 'nas', icon: Database },
    { key: 'backup', icon: RefreshCcw },
] as const;

export function Services() {
    const { t } = useTranslation();
    const sectionRef = useRef<HTMLElement>(null);
    const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                cardsRef.current,
                { y: 50, opacity: 0 },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.6,
                    stagger: 0.1,
                    ease: 'power2.out',
                    scrollTrigger: {
                        trigger: sectionRef.current,
                        start: 'top 80%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        });

        return () => ctx.revert();
    }, []);

    return (
        <section ref={sectionRef} id="services" className="py-24 bg-[#f8fafc]">
            <div className="container mx-auto px-4 md:px-6">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-[#00223A] mb-4">{t('landing.services.title')}</h2>
                    <p className="text-[#6f6f6f] text-lg max-w-2xl mx-auto">
                        {t('landing.services.subtitle')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {serviceKeys.map((service, index) => {
                        const Icon = service.icon;
                        return (
                            <div
                                key={index}
                                ref={el => { cardsRef.current[index] = el; }}
                                className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                            >
                                <div className="w-14 h-14 rounded-2xl bg-[#044F88]/10 flex items-center justify-center mb-6 text-[#044F88]">
                                    <Icon className="w-7 h-7" />
                                </div>

                                <h3 className="text-xl font-bold text-[#00223A] mb-2">{t(`landing.services.${service.key}.name`)}</h3>
                                <p className="text-[#6f6f6f] mb-6 text-sm">{t(`landing.services.${service.key}.desc`)}</p>

                                <ul className="space-y-3">
                                    {[0, 1, 2, 3].map((fIndex) => (
                                        <li key={fIndex} className="flex items-center text-sm text-[#1d1d1d]">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#044F88] mr-3" />
                                            {t(`landing.services.${service.key}.features.${fIndex}`)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
