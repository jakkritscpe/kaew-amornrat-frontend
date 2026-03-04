import type { Employee, AttendanceLog, WorkLocation, OTRequest } from './types';

export const mockLocations: WorkLocation[] = [
    {
        id: 'loc-1',
        name: 'Head Office (Bangkok)',
        lat: 13.7563,
        lng: 100.5018,
        radiusMeters: 500, // 500m
    },
    {
        id: 'loc-2',
        name: 'Warehouse A',
        lat: 13.805,
        lng: 100.550,
        radiusMeters: 300,
    }
];

export const mockEmployees: Employee[] = [
    {
        id: 'emp-001',
        name: 'สมชาย ใจดี',
        email: 'somchai.j@company.com',
        department: 'Engineering',
        position: 'Senior Developer',
        role: 'employee',
        shiftStartTime: '09:00',
        shiftEndTime: '18:00',
        avatarUrl: 'https://ui-avatars.com/api/?name=Somchai+Jaidy&background=0D8ABC&color=fff'
    },
    {
        id: 'emp-002',
        name: 'วิศวะ ช่างซ่อม',
        email: 'witsawa.c@company.com',
        department: 'Maintenance',
        position: 'Technician',
        role: 'employee',
        shiftStartTime: '08:00',
        shiftEndTime: '17:00',
        avatarUrl: 'https://ui-avatars.com/api/?name=Witsawa+Changsom&background=E53E3E&color=fff'
    },
    {
        id: 'emp-003',
        name: 'แอดมิน ระบบ',
        email: 'admin@company.com',
        department: 'IT',
        position: 'System Admin',
        role: 'admin',
        shiftStartTime: '09:00',
        shiftEndTime: '18:00',
    }
];

export const mockAttendanceLogs: AttendanceLog[] = [
    {
        id: 'log-1',
        employeeId: 'emp-001',
        date: new Date().toISOString().split('T')[0],
        checkInTime: '08:50',
        checkOutTime: null,
        checkInLat: 13.7564,
        checkInLng: 100.5019,
        checkOutLat: null,
        checkOutLng: null,
        workHours: 0,
        otHours: 0,
        status: 'present',
        locationId: 'loc-1'
    },
    {
        id: 'log-2',
        employeeId: 'emp-002',
        date: new Date().toISOString().split('T')[0],
        checkInTime: '08:15', // Late
        checkOutTime: null,
        checkInLat: 13.8052,
        checkInLng: 100.5501,
        checkOutLat: null,
        checkOutLng: null,
        workHours: 0,
        otHours: 0,
        status: 'late',
        locationId: 'loc-2'
    }
];

export const mockOTRequests: OTRequest[] = [
    {
        id: 'ot-1',
        employeeId: 'emp-001',
        date: new Date().toISOString().split('T')[0],
        startTime: '18:00',
        endTime: '20:00',
        reason: 'Deploy new web features to production',
        status: 'pending'
    }
];
