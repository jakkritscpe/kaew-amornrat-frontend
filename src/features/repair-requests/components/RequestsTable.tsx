import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  MoreHorizontal,
  Eye,
  Edit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { Badge } from '@/components/ui/badge';
import type { RepairRequest } from '../types';
import { getStatusLabel, getPriorityLabel } from '../types';

gsap.registerPlugin(ScrollTrigger);

interface RequestsTableProps {
  requests: RepairRequest[];
  onViewRequest: (request: RepairRequest) => void;
  onEditRequest: (request: RepairRequest) => void;
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

export default function RequestsTable({
  requests,
  onViewRequest,
  onEditRequest,
  onUpdateStatus
}: RequestsTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const itemsPerPage = 5;

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Rows slide in
      gsap.fromTo('.req-row',
        { x: -50, opacity: 0 },
        {
          x: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.05,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: tableRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );

      // Divider lines draw
      gsap.fromTo('.table-divider',
        { width: '0%' },
        {
          width: '100%',
          duration: 0.4,
          stagger: 0.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: tableRef.current,
            start: 'top 80%',
            toggleActions: 'play none none none'
          }
        }
      );
    });

    return () => ctx.revert();
  }, []);

  // Filter requests
  const filteredRequests = filterStatus
    ? requests.filter(r => r.status === filterStatus)
    : requests;

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div ref={tableRef} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg text-[#1d1d1d]">รายการแจ้งซ่อมล่าสุด</h3>
          <p className="text-sm text-[#6f6f6f]">รายการทั้งหมด {filteredRequests.length} รายการ</p>
        </div>

        {/* Filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              <span>กรอง</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setFilterStatus(null)}>
              ทั้งหมด
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('pending')}>
              รอดำเนินการ
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('in-progress')}>
              กำลังซ่อม
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus('completed')}>
              เสร็จสิ้น
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-200">
              <th className="w-[130px] text-left text-xs text-[#6f6f6f] font-semibold uppercase tracking-wider pl-6 pr-4 py-4">
                รหัส
              </th>
              <th className="text-left text-xs text-[#6f6f6f] font-semibold uppercase tracking-wider px-4 py-4">
                หัวข้อ
              </th>
              <th className="w-[160px] text-left text-xs text-[#6f6f6f] font-semibold uppercase tracking-wider px-4 py-4">
                สถานะ
              </th>
              <th className="w-[120px] text-left text-xs text-[#6f6f6f] font-semibold uppercase tracking-wider px-4 py-4">
                ความสำคัญ
              </th>
              <th className="w-[170px] text-left text-xs text-[#6f6f6f] font-semibold uppercase tracking-wider px-4 py-4">
                ช่าง
              </th>
              <th className="w-[160px] text-left text-xs text-[#6f6f6f] font-semibold uppercase tracking-wider px-4 py-4">
                วันที่
              </th>
              <th className="w-[72px] text-right text-xs text-[#6f6f6f] font-semibold uppercase tracking-wider pl-4 pr-6 py-4">
                จัดการ
              </th>

            </tr>
          </thead>
          <tbody>
            {paginatedRequests.map((request) => {
              const StatusIcon = statusIcons[request.status];

              return (
                <tr
                  key={request.id}
                  className={cn(
                    'req-row req-row-hover group border-b border-gray-100 transition-colors duration-300',
                    'hover:bg-[#e8f1fe]/30'
                  )}
                >
                  <td className="pl-6 pr-4 py-4 font-mono text-sm text-[#2075f8] font-medium align-top">
                    {request.id}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-col gap-1">
                      <p className="font-medium text-sm text-[#1d1d1d] group-hover:text-[#2075f8] transition-colors line-clamp-1">
                        {request.title}
                      </p>
                      <p className="text-xs text-[#6f6f6f] line-clamp-1">
                        {request.description}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Badge
                      variant="outline"
                      className={cn(
                        'gap-1.5 font-medium status-pulse w-fit',
                        statusStyles[request.status]
                      )}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {getStatusLabel(request.status)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Badge
                      variant="outline"
                      className={cn(
                        'font-medium w-fit',
                        priorityStyles[request.priority]
                      )}
                    >
                      {getPriorityLabel(request.priority)}
                    </Badge>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium text-gray-600">
                          {request.technician.charAt(0)}
                        </span>
                      </div>
                      <span className="text-sm text-[#1d1d1d] truncate">{request.technician}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-[#6f6f6f] whitespace-nowrap">
                    {new Date(request.createdAt).toLocaleDateString('th-TH', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td className="pl-4 pr-6 py-4 align-top text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onViewRequest(request)}>
                          <Eye className="w-4 h-4 mr-2" />
                          ดูรายละเอียด
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEditRequest(request)}>
                          <Edit2 className="w-4 h-4 mr-2" />
                          แก้ไข
                        </DropdownMenuItem>
                        {request.status !== 'completed' && (
                          <DropdownMenuItem
                            onClick={() => onUpdateStatus(
                              request.id,
                              request.status === 'pending' ? 'in-progress' : 'completed'
                            )}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            {request.status === 'pending' ? 'เริ่มดำเนินการ' : 'เสร็จสิ้น'}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
        <p className="text-sm text-[#6f6f6f]">
          แสดง {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredRequests.length)} จาก {filteredRequests.length} รายการ
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-[#1d1d1d] px-2">
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
