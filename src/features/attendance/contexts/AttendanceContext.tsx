import { useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { Employee, AttendanceLog, WorkLocation, OTRequest } from '../types';
import { useAuth } from '../../auth/hooks/useAuth';
import { getEmployeesApi } from '../../../lib/api/employees-api';
import { getLocationsApi } from '../../../lib/api/locations-api';
import { getLogsApi, checkInApi, checkOutApi } from '../../../lib/api/attendance-api';
import { getOTRequestsApi } from '../../../lib/api/ot-api';
import { getSettingsApi, updateSettingsApi } from '../../../lib/api/settings-api';
import { useEmployeeActions } from '../hooks/useEmployeeActions';
import { useLocationActions } from '../hooks/useLocationActions';
import { useOTActions } from '../hooks/useOTActions';
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
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshAll = useCallback(async (retries = 2) => {
    try {
      setLoading(true);
      setError(null);
      const [emps, locs, settings] = await Promise.all([
        getEmployeesApi(),
        getLocationsApi(),
        getSettingsApi().catch(() => ({ defaultOtRateType: 'multiplier' as const, defaultOtRateValue: 1.5 })),
      ]);

      setEmployees(emps);
      setLocations(locs);
      setCompanySettings(settings);
      setRetrying(false);
    } catch (e) {
      if (retries > 0) {
        setRetrying(true);
        await new Promise(r => setTimeout(r, 1000));
        return refreshAll(retries - 1);
      }
      setRetrying(false);
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshLogs = useCallback(async () => {
    try {
      setLogs(await getLogsApi());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการโหลดประวัติลงเวลา');
    }
  }, []);

  const refreshOT = useCallback(async () => {
    try {
      setOTRequests(await getOTRequestsApi());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'เกิดข้อผิดพลาดในการโหลดคำขอ OT');
    }
  }, []);

  const prevUserRef = useRef(user);
  useEffect(() => {
    const justLoggedIn = !prevUserRef.current && !!user;
    prevUserRef.current = user;
    if (justLoggedIn || user) { refreshAll(); refreshLogs(); refreshOT(); }
    if (!user) { setEmployees([]); setLogs([]); setLocations([]); setOTRequests([]); }
  }, [user, refreshAll, refreshLogs, refreshOT]);

  // ─── Attendance log actions ──────────────────────────────────────────────
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

  const updateLog = useCallback((id: string, updates: Partial<AttendanceLog>) => {
    setLogs(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l));
  }, []);

  // ─── Settings action ─────────────────────────────────────────────────────
  const updateCompanySettings = useCallback(async (settings: Partial<CompanySettings>) => {
    setCompanySettings(await updateSettingsApi(settings));
  }, []);

  // ─── Domain action hooks ─────────────────────────────────────────────────
  const employeeActions = useEmployeeActions(refreshAll);
  const locationActions = useLocationActions(refreshAll);
  const otActions = useOTActions(refreshOT);

  return (
    <AttendanceContext.Provider value={{
      employees, logs, locations, otRequests, companySettings, loading, retrying, error,
      refreshAll,
      addLog, checkOut: checkOutAction, updateLog,
      ...employeeActions,
      ...locationActions,
      ...otActions,
      updateCompanySettings,
    }}>
      {children}
    </AttendanceContext.Provider>
  );
}
