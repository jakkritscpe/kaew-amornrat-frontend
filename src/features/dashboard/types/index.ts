import type { RequestStatus } from '../../repair-requests/types';

export interface Stats {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
    totalChange: number;
    pendingChange: number;
    inProgressChange: number;
    completedChange: number;
}

export interface MonthlyData {
    month: string;
    requests: number;
    completed: number;
}

export interface StatusDistribution {
    status: RequestStatus;
    count: number;
    percentage: number;
}
