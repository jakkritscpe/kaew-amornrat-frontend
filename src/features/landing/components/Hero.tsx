import { useEffect, useRef } from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { gsap } from 'gsap';

export function Hero() {
    const containerRef = useRef<HTMLDivElement>(null);

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
        <section ref={containerRef} id="home" className="relative min-h-[90vh] flex items-center pt-20 overflow-hidden">
            {/* Background Image & Overlay */}
            <div className="absolute inset-0 z-0">
                <img
                    src="https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=2070&auto=format&fit=crop"
                    alt="IT Technician"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#00223A]/90 to-[#00223A]/70" />
            </div>

            {/* Content */}
            <div className="container relative z-10 mx-auto px-4 md:px-6">
                <div className="max-w-3xl">
                    <div className="hero-element inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-8">
                        <Clock className="w-4 h-4 text-[#C2410C]" />
                        <span className="text-white text-sm font-medium">บริการ 24 ชั่วโมง</span>
                    </div>

                    <h1 className="hero-element text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
                        บริการไอทีมืออาชีพ<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">มาถึงที่คุณ</span>
                    </h1>

                    <p className="hero-element text-lg md:text-xl text-white/80 mb-10 max-w-2xl leading-relaxed">
                        ซ่อม ติดตั้ง ดูแลระบบไอทีครบวงจร โดยทีมช่างผู้เชี่ยวชาญ<br />
                        พร้อมให้บริการทั่วกรุงเทพและปริมณฑล
                    </p>

                    <div className="hero-element flex flex-wrap gap-4 mb-16">
                        <Button size="lg" className="bg-[#C2410C] hover:bg-[#C2410C]/90 text-white text-lg h-14 px-8 rounded-full">
                            ติดต่อเรา
                            <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                        <Button size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-lg h-14 px-8 rounded-full backdrop-blur-sm">
                            ดูบริการของเรา
                        </Button>
                    </div>

                    {/* Service Tags */}
                    <div className="hero-element flex flex-wrap gap-3">
                        {['Computer', 'CCTV', 'Server', 'Network', 'Firewall', 'NAS', 'Backup', 'Lan WiFi', 'Fiber Optic'].map((tag) => (
                            <span key={tag} className="px-4 py-2 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm text-white/90 text-sm">
                                {tag}
                            </span>
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
        </section>
    );
}
