import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ClipboardList, Clock, Wrench, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Stats } from '../types';

gsap.registerPlugin(ScrollTrigger);

interface StatsGridProps {
  stats: Stats;
}

interface StatCardProps {
  title: string;
  value: number;
  change: number;
  icon: React.ElementType;
  color: string;
  delay: number;
}

function StatCard({ title, value, change, icon: Icon, color, delay }: StatCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const valueRef = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 3D Flip entrance
      gsap.fromTo(cardRef.current,
        { rotateX: 90, opacity: 0, transformOrigin: 'center bottom' },
        {
          rotateX: 0,
          opacity: 1,
          duration: 0.8,
          delay,
          ease: 'power3.out'
        }
      );

      // Counter animation
      const counter = { val: 0 };
      gsap.to(counter, {
        val: value,
        duration: 1.5,
        delay: delay + 0.3,
        ease: 'expo.out',
        onUpdate: () => setDisplayValue(Math.round(counter.val))
      });

      // Icon spin
      gsap.fromTo('.stat-icon-' + title,
        { rotate: -180, scale: 0 },
        { rotate: 0, scale: 1, duration: 0.8, delay: delay + 0.4, ease: 'back.out(1.7)' }
      );
    });

    return () => ctx.revert();
  }, [value, delay, title]);

  // 3D tilt effect on hover
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (y - centerY) / 10;
    const rotateY = (centerX - x) / 10;

    gsap.to(card, {
      rotateX: rotateX,
      rotateY: rotateY,
      transformPerspective: 1000,
      duration: 0.3,
      ease: 'power2.out'
    });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.5,
      ease: 'power2.out'
    });
  };

  const isPositive = change >= 0;

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100',
        'hover:shadow-xl hover:shadow-gray-200/50 transition-shadow duration-300',
        'cursor-pointer overflow-hidden group'
      )}
      style={{ transformStyle: 'preserve-3d' }}
    >
      {/* Glossy sheen effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Ripple effect on click */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="ripple-effect absolute w-full h-full" />
      </div>

      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm text-[#6f6f6f] mb-1">{title}</p>
          <span
            ref={valueRef}
            className="text-3xl font-bold text-[#1d1d1d] tabular-nums"
          >
            {displayValue.toLocaleString()}
          </span>

          {/* Change indicator */}
          <div className={cn(
            'flex items-center gap-1 mt-2 text-sm',
            isPositive ? 'text-emerald-600' : 'text-red-500'
          )}>
            {isPositive ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="font-medium">{Math.abs(change)}%</span>
            <span className="text-gray-400 text-xs">จากเดือนที่แล้ว</span>
          </div>
        </div>

        <div
          className={cn(
            'stat-icon-' + title,
            'w-12 h-12 rounded-xl flex items-center justify-center',
            color
          )}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function StatsGrid({ stats }: StatsGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Parallax effect on scroll
      ScrollTrigger.create({
        trigger: containerRef.current,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self) => {
          gsap.to('.stat-card', {
            y: -20 * self.progress,
            duration: 0.1
          });
        }
      });
    });

    return () => ctx.revert();
  }, []);

  const statItems = [
    {
      title: 'รายการทั้งหมด',
      value: stats.total,
      change: stats.totalChange,
      icon: ClipboardList,
      color: 'bg-gradient-to-br from-[#2075f8] to-[#1a64d4]',
      delay: 0.1
    },
    {
      title: 'รอดำเนินการ',
      value: stats.pending,
      change: stats.pendingChange,
      icon: Clock,
      color: 'bg-gradient-to-br from-amber-500 to-orange-500',
      delay: 0.2
    },
    {
      title: 'กำลังซ่อม',
      value: stats.inProgress,
      change: stats.inProgressChange,
      icon: Wrench,
      color: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      delay: 0.3
    },
    {
      title: 'เสร็จสิ้น',
      value: stats.completed,
      change: stats.completedChange,
      icon: CheckCircle2,
      color: 'bg-gradient-to-br from-emerald-500 to-teal-500',
      delay: 0.4
    },
  ];

  return (
    <div
      ref={containerRef}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      style={{ perspective: '1000px' }}
    >
      {statItems.map((stat) => (
        <div key={stat.title} className="stat-card">
          <StatCard {...stat} />
        </div>
      ))}
    </div>
  );
}
