import { api } from '../api-client';

export interface CompanySettings {
  defaultOtRateType: 'multiplier' | 'fixed';
  defaultOtRateValue: number;
}

export async function getSettingsApi(): Promise<CompanySettings> {
  return api.get<CompanySettings>('/api/settings');
}

export async function updateSettingsApi(data: Partial<CompanySettings>): Promise<CompanySettings> {
  return api.put<CompanySettings>('/api/settings', data);
}
