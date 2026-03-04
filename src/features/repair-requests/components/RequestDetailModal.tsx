import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { X, MapPin, User, Calendar, Wrench, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { RepairRequest } from '../types';
import { getStatusLabel, getPriorityLabel } from '../types';

interface RequestDetailModalProps {
  request: RepairRequest | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
}

const statusStyles: Record<string, string> = {
  'pending': 'status-pending',
  'in-progress': 'status-in-progress',
  'completed': 'status-completed'
};

const priorityStyles: Record<string, string> = {
  'low': 'priority-low',
  'medium': 'priority-medium',
  'high': 'priority-high'
};

const statusIcons: Record<string, React.ElementType> = {
  'pending': Clock,
  'in-progress': AlertCircle,
  'completed': CheckCircle2
};

export default function RequestDetailModal({ request, isOpen, onClose, onUpdateStatus }: RequestDetailModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && request) {
      const ctx = gsap.context(() => {
        // Overlay fade in
        gsap.fromTo(overlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: 'power2.out' }
        );

        // Modal slide up
        gsap.fromTo(modalRef.current,
          { y: 100, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5, delay: 0.1, ease: 'power3.out' }
        );

        // Content stagger
        gsap.fromTo('.detail-item',
          { x: -20, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.4, stagger: 0.08, delay: 0.3, ease: 'power3.out' }
        );
      });

      return () => ctx.revert();
    }
  }, [isOpen, request]);

  const handleClose = () => {
    const ctx = gsap.context(() => {
      gsap.to(modalRef.current, {
        y: 100,
        opacity: 0,
        duration: 0.3,
        ease: 'power3.in'
      });
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3,
        delay: 0.1,
        onComplete: onClose
      });
    });

    return () => ctx.revert();
  };

  if (!isOpen || !request) return null;

  const StatusIcon = statusIcons[request.status];

  const getNextStatus = () => {
    if (request.status === 'pending') return 'in-progress';
    if (request.status === 'in-progress') return 'completed';
    return null;
  };

  const getNextStatusLabel = () => {
    if (request.status === 'pending') return 'เริ่มดำเนินการ';
    if (request.status === 'in-progress') return 'เสร็จสิ้น';
    return null;
  };

  const nextStatus = getNextStatus();
  const nextStatusLabel = getNextStatusLabel();

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(5px)' }}
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-32 bg-gradient-to-br from-[#2075f8] to-[#1a64d4] rounded-t-2xl overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative h-full flex items-end p-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge className="bg-white/20 text-white border-0">
                  {request.id}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    'gap-1 border-white/30 text-white',
                    statusStyles[request.status]
                  )}
                >
                  <StatusIcon className="w-3 h-3" />
                  {getStatusLabel(request.status)}
                </Badge>
              </div>
              <h2 className="text-2xl font-bold text-white">{request.title}</h2>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div className="detail-item">
            <h3 className="text-sm font-medium text-[#6f6f6f] mb-2">รายละเอียด</h3>
            <p className="text-[#1d1d1d]">{request.description}</p>
          </div>

          {/* Info Grid */}
          <div className="detail-item grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-[#2075f8]" />
              </div>
              <div>
                <p className="text-sm text-[#6f6f6f]">ความสำคัญ</p>
                <Badge
                  variant="outline"
                  className={cn(
                    'mt-1 font-medium',
                    priorityStyles[request.priority]
                  )}
                >
                  {getPriorityLabel(request.priority)}
                </Badge>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Wrench className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-[#6f6f6f]">ช่างผู้รับผิดชอบ</p>
                <p className="font-medium text-[#1d1d1d] mt-1">{request.technician}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-[#6f6f6f]">สถานที่</p>
                <p className="font-medium text-[#1d1d1d] mt-1">{request.location}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-[#6f6f6f]">ผู้แจ้ง</p>
                <p className="font-medium text-[#1d1d1d] mt-1">{request.requester}</p>
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="detail-item flex items-center gap-6 p-4 bg-gray-50 rounded-xl">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-[#6f6f6f]">
                แจ้งเมื่อ: {new Date(request.createdAt).toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
            {request.completedAt && (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-emerald-600">
                  เสร็จสิ้น: {new Date(request.completedAt).toLocaleDateString('th-TH', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          {nextStatus && (
            <div className="detail-item flex gap-3 pt-4 border-t border-gray-100">
              <Button
                onClick={() => {
                  onUpdateStatus(request.id, nextStatus);
                  handleClose();
                }}
                className={cn(
                  'flex-1 h-12 rounded-xl font-semibold',
                  nextStatus === 'completed'
                    ? 'bg-emerald-500 hover:bg-emerald-600'
                    : 'bg-[#2075f8] hover:bg-[#1a64d4]'
                )}
              >
                {nextStatus === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                ) : (
                  <Wrench className="w-5 h-5 mr-2" />
                )}
                {nextStatusLabel}
              </Button>
              <Button
                variant="outline"
                onClick={handleClose}
                className="h-12 px-6 rounded-xl"
              >
                ปิด
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
