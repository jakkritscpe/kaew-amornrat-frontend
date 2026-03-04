import { cn } from '@/lib/utils';
import { Clock, Wrench, FileText, CheckCircle2, ChevronRight } from 'lucide-react';
import type { RepairRequest } from '../../repair-requests/types';
import { getPriorityLabel } from '../../repair-requests/types';

type PipelineStatus = 'pending' | 'in-progress' | 'ready-for-docs' | 'completed';

interface PipelineColumn {
    id: PipelineStatus;
    label: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
}

const PIPELINE_COLUMNS: PipelineColumn[] = [
    {
        id: 'pending',
        label: 'รอดำเนินการ',
        icon: Clock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
    },
    {
        id: 'in-progress',
        label: 'กำลังซ่อม',
        icon: Wrench,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
    },
    {
        id: 'ready-for-docs',
        label: 'รอออกเอกสาร',
        icon: FileText,
        color: 'text-violet-600',
        bgColor: 'bg-violet-50',
        borderColor: 'border-violet-200',
    },
    {
        id: 'completed',
        label: 'เสร็จสิ้น',
        icon: CheckCircle2,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
    },
];

const PRIORITY_COLORS: Record<string, string> = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-gray-100 text-gray-600',
};

function mapToPipelineStatus(status: string): PipelineStatus {
    if (status === 'completed') return 'ready-for-docs';
    return status as PipelineStatus;
}

interface JobCardProps {
    request: RepairRequest;
    onViewRequest: (request: RepairRequest) => void;
}

function JobCard({ request, onViewRequest }: JobCardProps) {
    return (
        <div
            onClick={() => onViewRequest(request)}
            className={cn(
                'bg-white rounded-xl p-4 shadow-sm border border-gray-100',
                'hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer group'
            )}
        >
            <div className="flex items-start justify-between gap-2 mb-2">
                <span className="font-mono text-xs text-[#2075f8] font-semibold">{request.id}</span>
                <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', PRIORITY_COLORS[request.priority])}>
                    {getPriorityLabel(request.priority)}
                </span>
            </div>
            <p className="text-sm font-semibold text-[#1d1d1d] line-clamp-1 mb-1 group-hover:text-[#2075f8] transition-colors">
                {request.title}
            </p>
            {request.customerName && (
                <p className="text-xs text-[#6f6f6f] line-clamp-1 mb-2">
                    🏢 {request.customerName}
                </p>
            )}
            {request.jobType && (
                <div className="mt-2">
                    <span className="inline-block text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                        {request.jobType}
                    </span>
                </div>
            )}
            <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                    {request.technician.charAt(0)}
                </div>
                <span className="text-xs text-[#6f6f6f] truncate">{request.technician}</span>
            </div>
        </div>
    );
}

interface PipelineBoardProps {
    requests: RepairRequest[];
    onViewRequest: (request: RepairRequest) => void;
}

export default function PipelineBoard({ requests, onViewRequest }: PipelineBoardProps) {
    const getColumnRequests = (columnId: PipelineStatus) => {
        if (columnId === 'ready-for-docs') {
            return requests.filter(r => r.status === 'completed');
        }
        if (columnId === 'completed') return [];
        return requests.filter(r => mapToPipelineStatus(r.status) === columnId);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100">
                <h3 className="font-semibold text-lg text-[#1d1d1d]">ขั้นตอนการทำงาน (Pipeline)</h3>
                <p className="text-sm text-[#6f6f6f]">ติดตามสถานะงานซ่อมในแต่ละขั้นตอน</p>
            </div>
            <div className="p-4 lg:p-5">
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory" style={{ touchAction: 'pan-x' }}>
                    {PIPELINE_COLUMNS.filter(col => col.id !== 'completed').map((col, idx, arr) => {
                        const colRequests = getColumnRequests(col.id);
                        const Icon = col.icon;

                        return (
                            <div key={col.id} className="flex items-start gap-2 snap-start shrink-0 w-[280px] md:w-auto md:flex-1">
                                <div className={cn('rounded-xl border p-3 flex-1 min-h-[160px]', col.bgColor, col.borderColor)}>
                                    {/* Column Header */}
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Icon className={cn('w-4 h-4', col.color)} />
                                            <span className={cn('text-sm font-semibold', col.color)}>{col.label}</span>
                                        </div>
                                        <span className={cn(
                                            'text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center',
                                            col.bgColor, col.color, 'border', col.borderColor
                                        )}>
                                            {colRequests.length}
                                        </span>
                                    </div>
                                    {/* Job Cards */}
                                    <div className="space-y-2">
                                        {colRequests.length === 0 ? (
                                            <p className="text-xs text-center py-4 opacity-50">ไม่มีงาน</p>
                                        ) : (
                                            colRequests.slice(0, 3).map(req => (
                                                <JobCard key={req.id} request={req} onViewRequest={onViewRequest} />
                                            ))
                                        )}
                                        {colRequests.length > 3 && (
                                            <p className="text-xs text-center py-1 text-[#6f6f6f]">+{colRequests.length - 3} งานเพิ่มเติม</p>
                                        )}
                                    </div>
                                </div>
                                {idx < arr.length - 1 && (
                                    <div className="flex items-center justify-center h-20 pt-10 shrink-0">
                                        <ChevronRight className="w-5 h-5 text-gray-300" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
