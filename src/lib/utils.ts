import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Decode a JWT payload without verifying signature (client-side only) */
export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

/** Format ISO timestamp → "HH:mm" (e.g. "08:42") */
export function formatTime(ts: string | Date | null | undefined): string {
  if (!ts) return '--:--';
  const d = typeof ts === 'string' ? new Date(ts) : ts;
  if (isNaN(d.getTime())) return '--:--';
  return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** Format "YYYY-MM-DD" or ISO Date → "D MMM BBBB" in Thai (e.g. "9 มี.ค. 2569") */
export function formatDate(ds: string | Date | null | undefined): string {
  if (!ds) return '-';
  // For "YYYY-MM-DD" strings, parse as local date to avoid UTC midnight shift
  if (typeof ds === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(ds)) {
    const [y, m, d] = ds.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const d = typeof ds === 'string' ? new Date(ds) : ds;
  if (isNaN(d.getTime())) return String(ds);
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });
}
