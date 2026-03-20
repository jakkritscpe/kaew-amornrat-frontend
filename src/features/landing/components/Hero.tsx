import { useEffect, useRef, useState, useCallback } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { gsap } from 'gsap';
import { useTranslation } from '@/i18n';

const heroImageSrcs = [
    'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1557597774-9d273605dfa9?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1631375937044-6dd5beac01d2?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1593448848024-77a27f0690b1?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1517433456519-e8073893c6e0?q=80&w=2070&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1606904825846-647eb07f5be2?q=80&w=2070&auto=format&fit=crop',
];

export function Hero() {
    const { t } = useTranslation();
    const containerRef = useRef<HTMLDivElement>(null);
    const [current, setCurrent] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

    const next = useCallback(() => {
        setCurrent(prev => (prev + 1) % heroImageSrcs.length);
    }, []);


    useEffect(() => {
        intervalRef.current = setInterval(next, 5000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [next]);

    useEffect(() => {
        const ctx = gsap.context(() => {
            gsap.fromTo(
                '.hero-element',
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: 'power3.out' }
            );
        }, containerRef);

        return () => ctx.revert();
    }, []);

    return (
        <section ref={containerRef} id="home" className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden bg-[#00223A]">
            {/* Background Slideshow */}
            {heroImageSrcs.map((src, i) => (
                <div
                    key={i}
                    className="absolute inset-0 z-0 transition-opacity duration-1000 ease-in-out"
                    style={{ opacity: i === current ? 1 : 0 }}
                >
                    <img
                        src={src}
                        alt={t(`landing.hero.alt.${i}`)}
                        className="w-full h-full object-cover scale-105"
                        style={{
                            animation: i === current ? 'heroZoom 6s ease-out forwards' : 'none',
                        }}
                    />
                </div>
            ))}
            {/* Overlay */}
            <div className="absolute inset-0 z-[1] bg-gradient-to-r from-[#00223A]/90 to-[#00223A]/70" />

            {/* Content */}
            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <div className="max-w-3xl">
                    <div className="hero-element inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
                        <Clock className="w-4 h-4 text-[#C2410C]" />
                        <span className="text-white text-sm font-medium">{t('landing.hero.service24h')}</span>
                    </div>

                    <h1 className="hero-element text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
                        {t('landing.hero.title')}<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">{t('landing.hero.subtitle')}</span>
                    </h1>

                    <p className="hero-element text-lg md:text-xl text-white/80 mb-10 max-w-2xl leading-relaxed whitespace-pre-line">
                        {t('landing.hero.description')}
                    </p>

                    <div className="hero-element flex flex-wrap gap-4 mb-16">
                        <a href="#contact">
                            <Button size="lg" className="bg-[#C2410C] hover:bg-[#C2410C]/90 text-white text-lg h-14 px-8 rounded-full">
                                {t('landing.hero.contactUs')}
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </a>
                        <a href="#services">
                            <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-lg h-14 px-8 rounded-full backdrop-blur-sm">
                                {t('landing.hero.viewServices')}
                            </Button>
                        </a>
                    </div>

                    {/* Service Tags */}
                    <div className="hero-element flex flex-wrap gap-3">
                        {['Computer', 'CCTV', 'Server', 'Network', 'Firewall', 'NAS', 'Backup', 'Lan WiFi', 'Fiber Optic'].map((tag) => (
                            <span key={tag} className="px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white/90 text-sm">
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Slide Indicators */}
                    <div className="hero-element flex gap-2 mt-10">
                        {heroImageSrcs.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrent(i)}
                                className={`h-1 rounded-full transition-all duration-500 ${i === current ? 'w-8 bg-white' : 'w-4 bg-white/30 hover:bg-white/50'}`}
                                aria-label={t('landing.hero.slideLabel', { n: i + 1 })}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Wave Divider */}
            <div className="absolute bottom-0 left-0 right-0 z-10">
                <svg viewBox="0 0 1440 120" className="w-full h-auto text-[#f8fafc] fill-current">
                    <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,42.7C1120,32,1280,32,1360,32L1440,32L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z" />
                </svg>
            </div>

            <style>{`
                @keyframes heroZoom {
                    from { transform: scale(1.05); }
                    to { transform: scale(1.15); }
                }
            `}</style>
        </section>
    );
}
