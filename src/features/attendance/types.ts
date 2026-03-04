export type Role = 'admin' | 'employee' | 'manager';
export type AttendanceStatus = 'present' | 'late' | 'absent' | 'on_leave';
export type OTRequestStatus = 'pending' | 'approved' | 'rejected';

export interface Employee {
    id: string;
    name: string;
    nickname?: string;
    email: string;
    department: string;
    position: string;
    role: Role;
    shiftStartTime: string; // e.g. "09:00"
    shiftEndTime: string;   // e.g. "18:00"
    avatarUrl?: string; // Additional for UI
}

export interface AttendanceLog {
    id: string;
    employeeId: string;
    date: string; // YYYY-MM-DD
    checkInTime: string | null; // e.g. "09:05:00" or ISO
    checkOutTime: string | null;
    checkInLat: number | null;
    checkInLng: number | null;
    checkOutLat: number | null;
    checkOutLng: number | null;
    workHours: number; // e.g. 8.5
    otHours: number;   // e.g. 2
    status: AttendanceStatus;
    locationId: string | null;
}

export interface WorkLocation {
    id: string;
    name: string;
    lat: number;
    lng: number;
    radiusMeters: number;
}

export interface OTRequest {
    id: string;
    employeeId: string;
    date: string;
    startTime: string; // e.g. "18:00"
    endTime: string;   // e.g. "20:00"
    reason: string;
    status: OTRequestStatus;
}
