import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MagneticButtonProps {
    onClick: () => void;
    className?: string;
    icon?: React.ReactNode;
    text: string;
    mobileText?: string;
}

export function MagneticButton({ onClick, className, icon = <Plus className="w-4 h-4 mr-2" />, text, mobileText }: MagneticButtonProps) {
    const buttonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const ctx = gsap.context(() => {
            // Button pop animation on mount
            gsap.fromTo(buttonRef.current,
                { scale: 0, opacity: 0 },
                { scale: 1, opacity: 1, duration: 0.4, delay: 0.5, ease: 'back.out(1.7)' }
            );
        });
        return () => ctx.revert();
    }, []);

    // Magnetic button effect
    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
        const btn = e.currentTarget;
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(btn, {
            x: x * 0.2,
            y: y * 0.2,
            duration: 0.3,
            ease: 'power2.out'
        });
    };

    const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
        gsap.to(e.currentTarget, {
            x: 0,
            y: 0,
            duration: 0.3,
            ease: 'power2.out'
        });
    };

    return (
        <Button
            ref={buttonRef}
            onClick={onClick}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={cn(
                "bg-[#044F88] hover:bg-[#00223A] text-white rounded-xl px-4 py-2 h-10 shadow-lg shadow-[#044F88]/25 hover:shadow-xl hover:shadow-[#044F88]/30 transition-all duration-300",
                className
            )}
        >
            {icon}
            <span className={mobileText ? "hidden sm:inline" : ""}>{text}</span>
            {mobileText && <span className="sm:hidden">{mobileText}</span>}
        </Button>
    );
}
