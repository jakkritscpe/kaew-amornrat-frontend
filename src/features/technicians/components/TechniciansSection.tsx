import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Users, Wrench, Star, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Technician } from '../types';

gsap.registerPlugin(ScrollTrigger);

interface TechniciansSectionProps {
  technicians: Technician[];
}

export default function TechniciansSection({ technicians }: TechniciansSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Cards stagger entrance
      gsap.fromTo('.tech-card',
        { y: 40, opacity: 0, scale: 0.95 },
        {
          y: 0,
          opacity: 1,
          scale: 1,
          duration: 0.6,
          stagger: 0.1,
          ease: 'power3.out',
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
    <div ref={sectionRef}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-[#1d1d1d]">ทีมช่าง technician</h3>
            <p className="text-sm text-[#6f6f6f]">จำนวน {technicians.length} คน</p>
          </div>
        </div>
      </div>

      {/* Technicians Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {technicians.map((tech, index) => (
          <div
            key={tech.id}
            className={cn(
              'tech-card bg-white rounded-2xl p-5 shadow-sm border border-gray-100',
              'hover:shadow-lg hover:shadow-gray-200/50 transition-all duration-300',
              'group cursor-pointer'
            )}
          >
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="relative">
                <img
                  src={tech.avatar}
                  alt={tech.name}
                  className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 object-cover"
                />
                {tech.activeRequests > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#2075f8] text-white text-xs font-medium rounded-full flex items-center justify-center">
                    {tech.activeRequests}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-[#1d1d1d] group-hover:text-[#2075f8] transition-colors truncate">
                  {tech.name}
                </h4>
                <div className="flex items-center gap-1 mt-1">
                  <Wrench className="w-3 h-3 text-gray-400" />
                  <span className="text-xs text-[#6f6f6f] truncate">{tech.specialty}</span>
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={cn(
                        'w-3 h-3',
                        star <= 4 ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                      )}
                    />
                  ))}
                  <span className="text-xs text-[#6f6f6f] ml-1">4.8</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <ClipboardList className="w-4 h-4 text-[#2075f8]" />
                </div>
                <div>
                  <p className="text-xs text-[#6f6f6f]">งานปัจจุบัน</p>
                  <p className="font-semibold text-sm text-[#1d1d1d]">{tech.activeRequests}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-[#6f6f6f]">เสร็จสิ้น</p>
                  <p className="font-semibold text-sm text-[#1d1d1d]">{(index * 37 + 100) % 200 + 50}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
