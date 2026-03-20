import { createContext } from 'react';
import type { Employee, AttendanceLog, WorkLocation, OTRequest } from '../types';

export interface CompanySettings {
  defaultOtRateType: 'multiplier' | 'fixed';
  defaultOtRateValue: number;
}

export interface AttendanceContextType {
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

export const AttendanceContext = createContext<AttendanceContextType | null>(null);
