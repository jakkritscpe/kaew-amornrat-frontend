import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { RepairRequest, Priority } from '../types';
import { mockTechnicians } from '../../technicians/api/mockData';

interface NewRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (request: Omit<RepairRequest, 'id' | 'createdAt' | 'status'>) => void;
  editRequest?: RepairRequest | null;
}

export default function NewRequestModal({ isOpen, onClose, onSubmit, editRequest }: NewRequestModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    technician: '',
    location: '',
    requester: ''
  });

  // Reset form when modal opens/closes or editRequest changes
  useEffect(() => {
    if (editRequest) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        title: editRequest.title,
        description: editRequest.description,
        priority: editRequest.priority,
        technician: editRequest.technician,
        location: editRequest.location,
        requester: editRequest.requester
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        technician: '',
        location: '',
        requester: ''
      });
    }
  }, [editRequest, isOpen]);

  useEffect(() => {
    if (isOpen) {
      const ctx = gsap.context(() => {
        // Overlay fade in
        gsap.fromTo(overlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: 'power2.out' }
        );

        // Modal scale up
        gsap.fromTo(modalRef.current,
          { scale: 0.9, y: 50, opacity: 0 },
          { scale: 1, y: 0, opacity: 1, duration: 0.5, delay: 0.1, ease: 'power3.out' }
        );

        // Inputs stagger slide
        gsap.fromTo('.form-field',
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.3, stagger: 0.08, delay: 0.2, ease: 'power3.out' }
        );
      });

      return () => ctx.revert();
    }
  }, [isOpen]);

  const handleClose = () => {
    const ctx = gsap.context(() => {
      gsap.to(modalRef.current, {
        scale: 0.9,
        y: 50,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    onSubmit(formData);
    setIsSubmitting(false);
    setIsSuccess(true);

    // Show success state then close
    setTimeout(() => {
      setIsSuccess(false);
      handleClose();
    }, 1000);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!isOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(5px)' }}
      onClick={handleClose}
    >
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-[#1d1d1d]">
            {editRequest ? 'แก้ไขรายการแจ้งซ่อม' : 'สร้างรายการแจ้งซ่อมใหม่'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Title */}
          <div className="form-field space-y-2">
            <Label htmlFor="title" className="text-sm font-medium text-[#1d1d1d]">
              หัวข้อ <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="เช่น ซ่อมแอร์ห้องประชุม"
              required
              className="h-11 rounded-xl border-gray-200 focus:border-[#2075f8] focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Description */}
          <div className="form-field space-y-2">
            <Label htmlFor="description" className="text-sm font-medium text-[#1d1d1d]">
              รายละเอียด
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="อธิบายปัญหาที่ต้องการซ่อม..."
              rows={3}
              className="rounded-xl border-gray-200 focus:border-[#2075f8] focus:ring-2 focus:ring-blue-100 transition-all resize-none"
            />
          </div>

          {/* Priority & Technician */}
          <div className="form-field grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-sm font-medium text-[#1d1d1d]">
                ความสำคัญ
              </Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleChange('priority', value)}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">ต่ำ</SelectItem>
                  <SelectItem value="medium">ปานกลาง</SelectItem>
                  <SelectItem value="high">สูง</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="technician" className="text-sm font-medium text-[#1d1d1d]">
                ช่างผู้รับผิดชอบ
              </Label>
              <Select
                value={formData.technician}
                onValueChange={(value) => handleChange('technician', value)}
              >
                <SelectTrigger className="h-11 rounded-xl border-gray-200">
                  <SelectValue placeholder="เลือกช่าง" />
                </SelectTrigger>
                <SelectContent>
                  {mockTechnicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.name}>
                      <div className="flex items-center gap-2">
                        <span>{tech.name}</span>
                        <span className="text-xs text-gray-400">({tech.specialty})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location & Requester */}
          <div className="form-field grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-sm font-medium text-[#1d1d1d]">
                สถานที่
              </Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="เช่น ห้อง 101"
                className="h-11 rounded-xl border-gray-200 focus:border-[#2075f8] focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="requester" className="text-sm font-medium text-[#1d1d1d]">
                ผู้แจ้ง
              </Label>
              <Input
                id="requester"
                value={formData.requester}
                onChange={(e) => handleChange('requester', e.target.value)}
                placeholder="ชื่อผู้แจ้ง"
                className="h-11 rounded-xl border-gray-200 focus:border-[#2075f8] focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="form-field pt-4">
            <Button
              type="submit"
              disabled={isSubmitting || isSuccess}
              className={cn(
                'w-full h-12 rounded-xl font-semibold transition-all duration-300',
                isSuccess
                  ? 'bg-emerald-500 hover:bg-emerald-600'
                  : 'bg-[#2075f8] hover:bg-[#1a64d4]'
              )}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : isSuccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  สำเร็จ
                </>
              ) : (
                editRequest ? 'บันทึกการแก้ไข' : 'สร้างรายการแจ้งซ่อม'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
