import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import StatsGrid from './StatsGrid';
import PipelineBoard from './PipelineBoard';
import type { Stats } from '../types';
import type { RepairRequest } from '../../repair-requests/types';

gsap.registerPlugin(ScrollTrigger);

interface DashboardProps {
  stats: Stats;
  requests: RepairRequest[];
  onViewRequest: (request: RepairRequest) => void;
}

export default function Dashboard({
  stats,
  requests,
  onViewRequest,
}: DashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.dashboard-section',
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.6,
          stagger: 0.2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: containerRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none',
          },
        }
      );
    });
    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Stats Grid */}
      <div className="dashboard-section">
        <StatsGrid stats={stats} />
      </div>

      {/* Pipeline Board */}
      <div className="dashboard-section">
        <PipelineBoard requests={requests} onViewRequest={onViewRequest} />
      </div>

      {/* Recent Requests Table */}
      {/* <div className="dashboard-section">
        <RequestsTable
          requests={requests}
          onViewRequest={onViewRequest}
          onEditRequest={onEditRequest}
          onUpdateStatus={onUpdateStatus}
        />
      </div> */}
    </div>
  );
}
