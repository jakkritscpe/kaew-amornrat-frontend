import { useState } from 'react';
import { Phone, MessageCircle, Facebook } from 'lucide-react';
import { cn } from '@/lib/utils';

const dockItems = [
    {
        label: 'Facebook',
        icon: Facebook,
        href: 'https://www.facebook.com/NorFreelance',
        activeColor: 'from-[#1877F2] to-[#42a5f5]',
        iconActive: 'text-white',
    },
    {
        label: 'LINE',
        icon: MessageCircle,
        href: 'https://line.me/R/ti/p/@231yswce',
        activeColor: 'from-[#06C755] to-[#4ade80]',
        iconActive: 'text-white',
    },
    {
        label: 'โทร',
        icon: Phone,
        href: 'tel:0854288897',
        activeColor: 'from-[#C2410C] to-[#f97316]',
        iconActive: 'text-white',
    },
];

export function FloatingDock() {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <div className="fixed bottom-6 right-6 z-50">
            {/* Outer glow container */}
            <div className="rounded-[28px] bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_8px_40px_rgba(0,0,0,0.08),0_0_0_1px_rgba(255,255,255,0.6)] p-2.5 flex flex-col gap-2">
                {dockItems.map((item, i) => {
                    const Icon = item.icon;
                    const isHovered = hoveredIndex === i;

                    return (
                        <a
                            key={item.label}
                            href={item.href}
                            target={item.href.startsWith('tel:') ? undefined : '_blank'}
                            rel={item.href.startsWith('tel:') ? undefined : 'noopener noreferrer'}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            aria-label={item.label}
                            className="relative flex items-center justify-center"
                        >
                            {/* Icon container */}
                            <div
                                className={cn(
                                    'relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ease-out',
                                    isHovered
                                        ? `bg-gradient-to-br ${item.activeColor} shadow-lg scale-110 -translate-y-1`
                                        : 'bg-[#e8eaef]/80 hover:bg-[#dfe1e6] scale-100',
                                )}
                                style={{
                                    boxShadow: isHovered
                                        ? '0 8px 24px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.2) inset'
                                        : 'none',
                                }}
                            >
                                {/* Glass reflection on hover */}
                                {isHovered && (
                                    <div className="absolute inset-0 rounded-2xl overflow-hidden">
                                        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-white/20 rotate-12 blur-sm" />
                                    </div>
                                )}
                                <Icon
                                    className={cn(
                                        'w-5 h-5 relative z-10 transition-colors duration-300',
                                        isHovered ? item.iconActive : 'text-[#8b8fa3]',
                                    )}
                                />
                            </div>

                            {/* Floating tooltip */}
                            <div
                                className={cn(
                                    'absolute right-full mr-3 px-3 py-1.5 rounded-lg bg-[#00223A] text-white text-xs font-medium whitespace-nowrap transition-all duration-200 pointer-events-none',
                                    isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2',
                                )}
                            >
                                {item.label}
                                {/* Arrow */}
                                <div className="absolute top-1/2 -right-1 -translate-y-1/2 w-2 h-2 bg-[#00223A] rotate-45" />
                            </div>
                        </a>
                    );
                })}
            </div>
        </div>
    );
}
