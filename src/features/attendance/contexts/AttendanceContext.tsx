import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Employee, AttendanceLog, WorkLocation, OTRequest } from '../types';
import { mockEmployees, mockAttendanceLogs, mockLocations, mockOTRequests } from '../mockData';

interface AttendanceContextType {
    employees: Employee[];
    logs: AttendanceLog[];
    locations: WorkLocation[];
    otRequests: OTRequest[];

    // Actions
    addLog: (log: Omit<AttendanceLog, 'id'>) => void;
    updateLog: (id: string, updates: Partial<AttendanceLog>) => void;
    addEmployee: (emp: Omit<Employee, 'id'>) => void;
    updateEmployee: (id: string, updates: Partial<Employee>) => void;
    removeEmployee: (id: string) => void;
    addLocation: (loc: Omit<WorkLocation, 'id'>) => void;
    updateOTStatus: (id: string, status: OTRequest['status']) => void;
    submitOTRequest: (req: Omit<OTRequest, 'id' | 'status'>) => void;
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

export function AttendanceProvider({ children }: { children: ReactNode }) {
    const [employees, setEmployees] = useState<Employee[]>(mockEmployees);
    const [logs, setLogs] = useState<AttendanceLog[]>(mockAttendanceLogs);
    const [locations, setLocations] = useState<WorkLocation[]>(mockLocations);
    const [otRequests, setOtRequests] = useState<OTRequest[]>(mockOTRequests);

    const addLog = useCallback((log: Omit<AttendanceLog, 'id'>) => {
        const newLog: AttendanceLog = {
            ...log,
            id: `log-${Date.now()}`
        };
        setLogs(prev => [...prev, newLog]);
    }, []);

    const updateLog = useCallback((id: string, updates: Partial<AttendanceLog>) => {
        setLogs(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
    }, []);

    const addEmployee = useCallback((emp: Omit<Employee, 'id'>) => {
        const newEmp: Employee = {
            ...emp,
            id: `emp-${Date.now()}`
        };
        setEmployees(prev => [...prev, newEmp]);
    }, []);

    const updateEmployee = useCallback((id: string, updates: Partial<Employee>) => {
        setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));
    }, []);

    const removeEmployee = useCallback((id: string) => {
        setEmployees(prev => prev.filter(e => e.id !== id));
    }, []);

    const addLocation = useCallback((loc: Omit<WorkLocation, 'id'>) => {
        const newLoc: WorkLocation = {
            ...loc,
            id: `loc-${Date.now()}`
        };
        setLocations(prev => [...prev, newLoc]);
    }, []);

    const updateOTStatus = useCallback((id: string, status: OTRequest['status']) => {
        setOtRequests(prev => prev.map(ot => ot.id === id ? { ...ot, status } : ot));
    }, []);

    const submitOTRequest = useCallback((req: Omit<OTRequest, 'id' | 'status'>) => {
        const newReq: OTRequest = {
            ...req,
            id: `ot-${Date.now()}`,
            status: 'pending'
        };
        setOtRequests(prev => [...prev, newReq]);
    }, []);

    return (
        <AttendanceContext.Provider value={{
            employees,
            logs,
            locations,
            otRequests,
            addLog,
            updateLog,
            addEmployee,
            updateEmployee,
            removeEmployee,
            addLocation,
            updateOTStatus,
            submitOTRequest
        }}>
            {children}
        </AttendanceContext.Provider>
    );
}

export function useAttendance() {
    const context = useContext(AttendanceContext);
    if (context === undefined) {
        throw new Error('useAttendance must be used within an AttendanceProvider');
    }
    return context;
}
