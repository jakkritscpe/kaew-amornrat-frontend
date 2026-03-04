import type { Stats, MonthlyData, StatusDistribution } from '../types';

export const mockStats: Stats = {
    total: 1248,
    pending: 42,
    inProgress: 18,
    completed: 1188,
    totalChange: 12,
    pendingChange: -5,
    inProgressChange: 2,
    completedChange: 15
};

export const mockMonthlyData: MonthlyData[] = [
    { month: 'ม.ค.', requests: 145, completed: 138 },
    { month: 'ก.พ.', requests: 162, completed: 155 },
    { month: 'มี.ค.', requests: 178, completed: 170 },
    { month: 'เม.ย.', requests: 195, completed: 188 },
    { month: 'พ.ค.', requests: 210, completed: 205 },
    { month: 'มิ.ย.', requests: 188, completed: 182 },
    { month: 'ก.ค.', requests: 170, completed: 150 }
];

export const mockStatusDistribution: StatusDistribution[] = [
    { status: 'pending', count: 42, percentage: 3.4 },
    { status: 'in-progress', count: 18, percentage: 1.4 },
    { status: 'completed', count: 1188, percentage: 95.2 }
];
