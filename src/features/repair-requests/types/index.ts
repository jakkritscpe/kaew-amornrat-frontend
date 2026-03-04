export type RequestStatus = 'pending' | 'in-progress' | 'completed';
export type Priority = 'low' | 'medium' | 'high';

export interface RepairRequest {
  id: string;
  title: string;
  description: string;
  status: RequestStatus;
  priority: Priority;
  technician: string;
  createdAt: string;
  completedAt?: string;
  location: string;
  requester: string;
  // Customer / Job Form Fields
  customerName?: string;
  customerAddress?: string;
  customerPhone?: string;
  jobType?: string;
}

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    'pending': 'รอดำเนินการ',
    'in-progress': 'กำลังซ่อม',
    'completed': 'เสร็จสิ้น'
  };
  return labels[status] || status;
};

export const getPriorityLabel = (priority: string): string => {
  const labels: Record<string, string> = {
    'low': 'ต่ำ',
    'medium': 'ปานกลาง',
    'high': 'สูง'
  };
  return labels[priority] || priority;
};
