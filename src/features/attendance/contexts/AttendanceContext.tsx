import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { Employee, AttendanceLog, WorkLocation, OTRequest } from '../types';
import { TOKEN_KEY } from '../../../lib/api-client';
import { useAuth } from '../../auth/hooks/useAuth';
import { getEmployeesApi, createEmployeeApi, updateEmployeeApi, deleteEmployeeApi } from '../../../lib/api/employees-api';
import { getLocationsApi, createLocationApi, updateLocationApi, deleteLocationApi } from '../../../lib/api/locations-api';
import { getLogsApi, checkInApi, checkOutApi } from '../../../lib/api/attendance-api';
import { getOTRequestsApi, submitOTRequestApi, updateOTStatusApi } from '../../../lib/api/ot-api';
import { getSettingsApi, updateSettingsApi } from '../../../lib/api/settings-api';
import { AttendanceContext } from './attendance-context-value';
import type { CompanySettings } from './attendance-context-value';
export type { CompanySettings } from './attendance-context-value';

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
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

  const refreshAll = useCallback(async (retries = 2) => {
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
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1000));
        return refreshAll(retries - 1);
      }
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

  const prevUserRef = useRef(user);
  useEffect(() => {
    const justLoggedIn = !prevUserRef.current && !!user;
    prevUserRef.current = user;

    // Fetch on mount (if token exists) or when user just logged in
    if (justLoggedIn || user) {
      refreshAll();
      refreshLogs();
      refreshOT();
    }

    // Clear data on logout
    if (!user) {
      setEmployees([]);
      setLogs([]);
      setLocations([]);
      setOTRequests([]);
    }
  }, [user, refreshAll, refreshLogs, refreshOT]);

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

