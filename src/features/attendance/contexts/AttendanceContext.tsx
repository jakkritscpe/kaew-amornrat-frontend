import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Employee, AttendanceLog, WorkLocation, OTRequest } from '../types';
import { TOKEN_KEY } from '../../../lib/api-client';
import { getEmployeesApi, createEmployeeApi, updateEmployeeApi, deleteEmployeeApi } from '../../../lib/api/employees-api';
import { getLocationsApi, createLocationApi, updateLocationApi, deleteLocationApi } from '../../../lib/api/locations-api';
import { getLogsApi, checkInApi, checkOutApi } from '../../../lib/api/attendance-api';
import { getOTRequestsApi, submitOTRequestApi, updateOTStatusApi } from '../../../lib/api/ot-api';
import { getSettingsApi, updateSettingsApi } from '../../../lib/api/settings-api';

export interface CompanySettings {
  defaultOtRateType: 'multiplier' | 'fixed';
  defaultOtRateValue: number;
}

interface AttendanceContextType {
  employees: Employee[];
  logs: AttendanceLog[];
  locations: WorkLocation[];
  otRequests: OTRequest[];
  companySettings: CompanySettings;
  loading: boolean;
  error: string | null;

  refreshAll: () => Promise<void>;

  // Logs
  addLog: (lat: number, lng: number) => Promise<AttendanceLog | null>;
  checkOut: (lat: number, lng: number) => Promise<AttendanceLog | null>;
  updateLog: (id: string, updates: Partial<AttendanceLog>) => void;

  // Employees
  addEmployee: (emp: Omit<Employee, 'id'> & { password: string }) => Promise<void>;
  updateEmployee: (id: string, updates: Partial<Employee> & { password?: string }) => Promise<void>;
  removeEmployee: (id: string) => Promise<void>;

  // Locations
  addLocation: (loc: Omit<WorkLocation, 'id'>) => Promise<void>;
  updateLocation: (id: string, updates: Partial<WorkLocation>) => Promise<void>;
  removeLocation: (id: string) => Promise<void>;

  // OT
  submitOTRequest: (req: Omit<OTRequest, 'id' | 'status'>) => Promise<void>;
  updateOTStatus: (id: string, status: OTRequest['status']) => Promise<void>;

  // Settings
  updateCompanySettings: (settings: Partial<CompanySettings>) => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | null>(null);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<AttendanceLog[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [otRequests, setOTRequests] = useState<OTRequest[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    defaultOtRateType: 'multiplier',
    defaultOtRateValue: 1.5,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) { setLoading(false); return; }

      const [emps, locs, settings] = await Promise.all([
        getEmployeesApi(),
        getLocationsApi(),
        getSettingsApi().catch(() => ({ defaultOtRateType: 'multiplier' as const, defaultOtRateValue: 1.5 })),
      ]);

      setEmployees(emps);
      setLocations(locs);
      setCompanySettings(settings);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshLogs = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const data = await getLogsApi();
      setLogs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการโหลดประวัติลงเวลา');
    }
  }, []);

  const refreshOT = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;
    try {
      const data = await getOTRequestsApi();
      setOTRequests(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการโหลดคำขอ OT');
    }
  }, []);

  useEffect(() => {
    refreshAll();
    refreshLogs();
    refreshOT();
  }, [refreshAll, refreshLogs, refreshOT]);

  const addLog = useCallback(async (lat: number, lng: number) => {
    const log = await checkInApi(lat, lng);
    await refreshLogs();
    return log;
  }, [refreshLogs]);

  const checkOutAction = useCallback(async (lat: number, lng: number) => {
    const log = await checkOutApi(lat, lng);
    await refreshLogs();
    return log;
  }, [refreshLogs]);

  // Keep a local updateLog for backward compatibility with admin UI
  const updateLog = useCallback((id: string, updates: Partial<AttendanceLog>) => {
    setLogs(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, []);

  const addEmployee = useCallback(async (emp: Omit<Employee, 'id'> & { password: string }) => {
    await createEmployeeApi(emp);
    await refreshAll();
  }, [refreshAll]);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee> & { password?: string }) => {
    await updateEmployeeApi(id, updates);
    await refreshAll();
  }, [refreshAll]);

  const removeEmployee = useCallback(async (id: string) => {
    await deleteEmployeeApi(id);
    await refreshAll();
  }, [refreshAll]);

  const addLocation = useCallback(async (loc: Omit<WorkLocation, 'id'>) => {
    await createLocationApi(loc);
    await refreshAll();
  }, [refreshAll]);

  const updateLocation = useCallback(async (id: string, updates: Partial<WorkLocation>) => {
    await updateLocationApi(id, updates);
    await refreshAll();
  }, [refreshAll]);

  const removeLocation = useCallback(async (id: string) => {
    await deleteLocationApi(id);
    await refreshAll();
  }, [refreshAll]);

  const submitOTRequest = useCallback(async (req: Omit<OTRequest, 'id' | 'status'>) => {
    await submitOTRequestApi({ date: req.date, startTime: req.startTime, endTime: req.endTime, reason: req.reason });
    await refreshOT();
  }, [refreshOT]);

  const updateOTStatus = useCallback(async (id: string, status: OTRequest['status']) => {
    if (status === 'pending') return;
    await updateOTStatusApi(id, status);
    await refreshOT();
  }, [refreshOT]);

  const updateCompanySettingsAction = useCallback(async (settings: Partial<CompanySettings>) => {
    const updated = await updateSettingsApi(settings);
    setCompanySettings(updated);
  }, []);

  return (
    <AttendanceContext.Provider value={{
      employees, logs, locations, otRequests, companySettings, loading, error,
      refreshAll,
      addLog, checkOut: checkOutAction, updateLog,
      addEmployee, updateEmployee, removeEmployee,
      addLocation, updateLocation, removeLocation,
      submitOTRequest, updateOTStatus,
      updateCompanySettings: updateCompanySettingsAction,
    }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error('useAttendance must be used within AttendanceProvider');
  return ctx;
}
