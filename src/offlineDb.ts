/**
 * Aegis Clinical Offline Storage Engine (IndexedDB)
 * 
 * Provides resilient, durable client-side local caching of patient medical charts,
 * cryptographic access logs, system metadata, and offline mutation tracking
 * for low-network and zero-connectivity hospital environments.
 */

import { Patient, AccessLog, StaffMember, Ward, EmergencySummaryResponse } from './types';

const DB_NAME = 'AegisClinical_OfflineDB';
const DB_VERSION = 1;

export interface CacheStats {
  patientCount: number;
  logCount: number;
  lastSyncedAt: string | null;
  cachedWardsCount: number;
  cachedStaffCount: number;
}

class OfflineDatabase {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB is not supported in this environment.'));
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Patients store
        if (!db.objectStoreNames.contains('patients')) {
          const patientStore = db.createObjectStore('patients', { keyPath: 'id' });
          patientStore.createIndex('ward_id', 'ward_id', { unique: false });
          patientStore.createIndex('name', 'name', { unique: false });
        }

        // 2. Audit logs store (preserves cryptographic chain records)
        if (!db.objectStoreNames.contains('audit_logs')) {
          const logStore = db.createObjectStore('audit_logs', { keyPath: 'id' });
          logStore.createIndex('timestamp', 'timestamp', { unique: false });
          logStore.createIndex('action', 'action', { unique: false });
          logStore.createIndex('patient_id', 'patient_id', { unique: false });
        }

        // 3. System metadata & key-value cache (wards, staff, summaries, sync timestamps)
        if (!db.objectStoreNames.contains('system_meta')) {
          db.createObjectStore('system_meta', { keyPath: 'key' });
        }

        // 4. Cached assigned patients per staff persona
        if (!db.objectStoreNames.contains('assigned_patients')) {
          db.createObjectStore('assigned_patients', { keyPath: 'staff_id' });
        }
      };

      request.onsuccess = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        resolve(db);
      };

      request.onerror = (event) => {
        const error = (event.target as IDBOpenDBRequest).error;
        console.error('IndexedDB open error:', error);
        reject(error);
      };
    });

    return this.dbPromise;
  }

  // ==================== PATIENTS OPERATIONS ====================

  /**
   * Cache all patient records in IndexedDB
   */
  async cachePatients(patients: Patient[]): Promise<void> {
    if (!patients || patients.length === 0) return;
    try {
      const db = await this.getDB();
      const tx = db.transaction('patients', 'readwrite');
      const store = tx.objectStore('patients');

      for (const patient of patients) {
        store.put({
          ...patient,
          _cachedAt: new Date().toISOString()
        });
      }

      await this.setMetadata('last_patients_sync', new Date().toISOString());
    } catch (err) {
      console.warn('Failed to cache patients to IndexedDB:', err);
    }
  }

  /**
   * Retrieve all cached patient records from IndexedDB
   */
  async getCachedPatients(): Promise<Patient[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('patients', 'readonly');
        const store = tx.objectStore('patients');
        const request = store.getAll();

        request.onsuccess = () => {
          resolve(request.result || []);
        };
        request.onerror = () => {
          resolve([]);
        };
      });
    } catch (err) {
      console.warn('Failed to read patients from IndexedDB:', err);
      return [];
    }
  }

  /**
   * Get single cached patient by ID
   */
  async getCachedPatient(id: string): Promise<Patient | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('patients', 'readonly');
        const store = tx.objectStore('patients');
        const request = store.get(id);

        request.onsuccess = () => {
          resolve(request.result || null);
        };
        request.onerror = () => {
          resolve(null);
        };
      });
    } catch (err) {
      return null;
    }
  }

  /**
   * Cache assigned patients for a specific staff member
   */
  async cacheAssignedPatients(staffId: string, patients: Patient[]): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('assigned_patients', 'readwrite');
      const store = tx.objectStore('assigned_patients');
      store.put({
        staff_id: staffId,
        patients,
        cachedAt: new Date().toISOString()
      });
    } catch (err) {
      console.warn('Failed to cache assigned patients to IndexedDB:', err);
    }
  }

  /**
   * Retrieve cached assigned patients for a staff member
   */
  async getCachedAssignedPatients(staffId: string): Promise<Patient[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('assigned_patients', 'readonly');
        const store = tx.objectStore('assigned_patients');
        const request = store.get(staffId);

        request.onsuccess = () => {
          if (request.result && Array.isArray(request.result.patients)) {
            resolve(request.result.patients);
          } else {
            resolve([]);
          }
        };
        request.onerror = () => {
          resolve([]);
        };
      });
    } catch (err) {
      return [];
    }
  }

  // ==================== AUDIT LOGS OPERATIONS ====================

  /**
   * Cache audit logs in IndexedDB while preserving complete cryptographic integrity
   */
  async cacheAuditLogs(logs: AccessLog[]): Promise<void> {
    if (!logs || logs.length === 0) return;
    try {
      const db = await this.getDB();
      const tx = db.transaction('audit_logs', 'readwrite');
      const store = tx.objectStore('audit_logs');

      for (const log of logs) {
        store.put(log);
      }

      await this.setMetadata('last_logs_sync', new Date().toISOString());
    } catch (err) {
      console.warn('Failed to cache audit logs to IndexedDB:', err);
    }
  }

  /**
   * Retrieve all cached audit logs ordered by ID
   */
  async getCachedAuditLogs(): Promise<AccessLog[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('audit_logs', 'readonly');
        const store = tx.objectStore('audit_logs');
        const request = store.getAll();

        request.onsuccess = () => {
          const logs: AccessLog[] = request.result || [];
          // Sort descending by ID (newest first) to match API presentation
          logs.sort((a, b) => b.id - a.id);
          resolve(logs);
        };
        request.onerror = () => {
          resolve([]);
        };
      });
    } catch (err) {
      console.warn('Failed to read audit logs from IndexedDB:', err);
      return [];
    }
  }

  // ==================== SYSTEM METADATA & RECOVERY ====================

  /**
   * Save arbitrary key-value metadata to IndexedDB
   */
  async setMetadata(key: string, value: any): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('system_meta', 'readwrite');
      const store = tx.objectStore('system_meta');
      store.put({ key, value, updatedAt: new Date().toISOString() });
    } catch (err) {
      console.warn(`Failed to set metadata ${key} in IndexedDB:`, err);
    }
  }

  /**
   * Retrieve metadata value by key
   */
  async getMetadata<T = any>(key: string): Promise<T | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('system_meta', 'readonly');
        const store = tx.objectStore('system_meta');
        const request = store.get(key);

        request.onsuccess = () => {
          if (request.result && request.result.value !== undefined) {
            resolve(request.result.value as T);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => {
          resolve(null);
        };
      });
    } catch (err) {
      return null;
    }
  }

  /**
   * Cache complete system metadata (wards, staff members, emergency summary)
   */
  async cacheSystemMeta(wards: Ward[], staff: StaffMember[], emergencySummary?: EmergencySummaryResponse | null): Promise<void> {
    await this.setMetadata('wards', wards);
    await this.setMetadata('staff', staff);
    if (emergencySummary) {
      await this.setMetadata('emergencySummary', emergencySummary);
    }
    await this.setMetadata('last_full_sync', new Date().toISOString());
  }

  /**
   * Retrieve cached system metadata
   */
  async getCachedSystemMeta(): Promise<{
    wards: Ward[];
    staff: StaffMember[];
    emergencySummary: EmergencySummaryResponse | null;
  }> {
    const wards = (await this.getMetadata<Ward[]>('wards')) || [];
    const staff = (await this.getMetadata<StaffMember[]>('staff')) || [];
    const emergencySummary = await this.getMetadata<EmergencySummaryResponse>('emergencySummary');
    return { wards, staff, emergencySummary };
  }

  // ==================== CACHE STATS & PURGE ====================

  /**
   * Calculate summary statistics of the local IndexedDB offline storage
   */
  async getCacheStats(): Promise<CacheStats> {
    try {
      const db = await this.getDB();

      const countStore = (storeName: string): Promise<number> => {
        return new Promise((resolve) => {
          const tx = db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const req = store.count();
          req.onsuccess = () => resolve(req.result || 0);
          req.onerror = () => resolve(0);
        });
      };

      const [patientCount, logCount] = await Promise.all([
        countStore('patients'),
        countStore('audit_logs')
      ]);

      const lastSync = await this.getMetadata<string>('last_full_sync');
      const wards = await this.getMetadata<Ward[]>('wards');
      const staff = await this.getMetadata<StaffMember[]>('staff');

      return {
        patientCount,
        logCount,
        lastSyncedAt: lastSync || null,
        cachedWardsCount: wards?.length || 0,
        cachedStaffCount: staff?.length || 0
      };
    } catch (err) {
      return {
        patientCount: 0,
        logCount: 0,
        lastSyncedAt: null,
        cachedWardsCount: 0,
        cachedStaffCount: 0
      };
    }
  }

  /**
   * Clear all local IndexedDB cache data
   */
  async clearAllCache(): Promise<void> {
    try {
      const db = await this.getDB();
      const stores = ['patients', 'audit_logs', 'system_meta', 'assigned_patients'];
      for (const storeName of stores) {
        const tx = db.transaction(storeName, 'readwrite');
        tx.objectStore(storeName).clear();
      }
    } catch (err) {
      console.warn('Failed to clear IndexedDB cache:', err);
    }
  }
}

export const offlineDb = new OfflineDatabase();
