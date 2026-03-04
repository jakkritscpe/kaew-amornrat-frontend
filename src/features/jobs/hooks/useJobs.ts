'use client';
import { useState, useCallback } from 'react';

export type DocumentType = 'quotation' | 'invoice' | 'tax-invoice' | 'receipt' | 'handover';

export interface JobForm {
    id: string;
    name: string;
    jobType: string;
    customerName: string;
    customerAddress: string;
    customerPhone: string;
    description: string;
    createdAt: string;
    amount?: number;
    taxRate?: number;
    images?: string[];
}

const DOCUMENT_LABELS: Record<DocumentType, string> = {
    quotation: 'ใบเสนอราคา',
    invoice: 'ใบแจ้งหนี้',
    'tax-invoice': 'ใบกำกับภาษี',
    receipt: 'ใบเสร็จ',
    handover: 'ใบส่งมอบงาน',
};

const JOB_TYPES = [
    'ซ่อมแอร์',
    'ซ่อมไฟฟ้า',
    'งานประปา',
    'ซ่อมคอมพิวเตอร์',
    'ซ่อมเฟอร์นิเจอร์',
    'ซ่อมประตู-หน้าต่าง',
    'ติดตั้งอุปกรณ์',
    'งานทั่วไป',
];

let jobCounter = 9; // Starts after REQ-008

function generateJobId(): string {
    const id = `REQ-${String(jobCounter).padStart(3, '0')}`;
    jobCounter++;
    return id;
}

export function useJobs() {
    const [jobs, setJobs] = useState<JobForm[]>([]);

    const addJob = useCallback((formData: Omit<JobForm, 'id' | 'createdAt'>) => {
        const newJob: JobForm = {
            ...formData,
            id: generateJobId(),
            createdAt: new Date().toISOString().split('T')[0],
        };
        setJobs(prev => [newJob, ...prev]);
        return newJob;
    }, []);

    return { jobs, addJob };
}

export { DOCUMENT_LABELS, JOB_TYPES };
