export type StaffRole = 'doctor' | 'nurse' | 'clerk' | 'admin';

export interface Ward {
  id: number;
  name: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: StaffRole;
  default_ward: string;
  created_at?: string;
  current_ward_id?: number | null;
  current_ward_name?: string | null;
}

export interface Shift {
  id: string;
  staff_id: string;
  ward_id: number;
  ward_name?: string;
  start_time: string;
  end_time: string | null;
}

export interface Patient {
  id: string;
  name: string;
  dob: string;
  ward_id: number;
  ward_name?: string;
  diagnosis: string;
  admitted_at: string;
}

export interface AccessLog {
  id: number;
  staff_id: string;
  patient_id: string | null;
  action: 'LOGIN' | 'VIEW_RECORD' | 'EMERGENCY_ACCESS' | 'DENIED';
  result: 'GRANTED' | 'DENIED';
  reason: string | null;
  staff_ward_at_time: string;
  patient_ward_at_time: string | null;
  timestamp: string;
  prev_hash: string;
  entry_hash: string;
}

export interface ChainAnchor {
  id: number;
  anchor_hash: string;
  row_id_at_anchor: number;
  created_at: string;
}

export interface VerifyResult {
  valid: boolean;
  totalEntries?: number;
  lastAnchorCheckedAt?: string | null;
  brokenAtId?: number;
  reason?: string;
}

export interface EmergencySummaryItem {
  staff_id: string;
  staff_name: string;
  staff_role: StaffRole;
  emergency_access_count: number;
  last_emergency_access_at: string;
}

export interface EmergencySummaryResponse {
  description: string;
  totalEmergencyOverrides: number;
  rankings: EmergencySummaryItem[];
}

export interface SystemMeta {
  stats: {
    staffCount: number;
    wardCount: number;
    patientCount: number;
    logCount: number;
    anchorCount: number;
  };
  wards: Ward[];
  staff: StaffMember[];
  latestAnchor: ChainAnchor | null;
  latestLog: AccessLog | null;
}

export interface ApiCallRecord {
  id: string;
  timestamp: string;
  method: string;
  url: string;
  status: number;
  statusText: string;
  requestHeaders?: Record<string, string>;
  requestBody?: any;
  responseBody?: any;
  curl: string;
  durationMs: number;
  fromCache?: boolean;
}

export interface OfflineCacheStats {
  patientCount: number;
  logCount: number;
  lastSyncedAt: string | null;
  cachedWardsCount: number;
  cachedStaffCount: number;
}
