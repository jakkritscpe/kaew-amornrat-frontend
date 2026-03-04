import type { Technician } from '../types';

export const mockTechnicians: Technician[] = [
    {
        id: 'TECH-001',
        name: 'สมชาย ใจดี',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=somchai',
        specialty: 'งานช่างทั่วไป',
        activeRequests: 2
    },
    {
        id: 'TECH-002',
        name: 'มานี มีชัย',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=manee',
        specialty: 'แอร์และเครื่องใช้ไฟฟ้า',
        activeRequests: 2
    },
    {
        id: 'TECH-003',
        name: 'สมหมาย ขยันทำ',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sommai',
        specialty: 'งานไฟฟ้าและแสงสว่าง',
        activeRequests: 0
    },
    {
        id: 'TECH-004',
        name: 'วิศวะ ช่างซ่อม',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wisawa',
        specialty: 'คอมพิวเตอร์และอิเล็กทรอนิกส์',
        activeRequests: 2
    },
    {
        id: 'TECH-005',
        name: 'ประมูล ช่างประปา',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=pramool',
        specialty: 'งานประปาและ sanitation',
        activeRequests: 1
    }
];
