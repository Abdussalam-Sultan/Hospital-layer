import { ApiCallRecord } from './types';
import { offlineDb } from './offlineDb';

// In-memory event bus for API calls so the API Console can display real-time network traffic
type ApiListener = (record: ApiCallRecord) => void;
const listeners: Set<ApiListener> = new Set();

type NetworkStatusListener = (isOnline: boolean, isSimulated: boolean) => void;
const networkListeners: Set<NetworkStatusListener> = new Set();

let isSimulatedOffline = false;

export function isSimulatingOffline(): boolean {
  return isSimulatedOffline;
}

export function isDeviceOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

export function isAppOnline(): boolean {
  return isDeviceOnline() && !isSimulatedOffline;
}

export function setSimulateOffline(simulate: boolean) {
  isSimulatedOffline = simulate;
  notifyNetworkStatus();
}

export function subscribeToNetworkStatus(listener: NetworkStatusListener) {
  networkListeners.add(listener);
  return () => {
    networkListeners.delete(listener);
  };
}

function notifyNetworkStatus() {
  const online = isAppOnline();
  networkListeners.forEach((fn) => fn(online, isSimulatedOffline));
}

// Attach native window online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => notifyNetworkStatus());
  window.addEventListener('offline', () => notifyNetworkStatus());
}

export function subscribeToApiCalls(listener: ApiListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function notifyApiCall(record: ApiCallRecord) {
  listeners.forEach((fn) => fn(record));
}

function generateCurl(method: string, url: string, headers: Record<string, string>, body?: any): string {
  let cmd = `curl -X ${method} "${typeof window !== 'undefined' ? window.location.origin : ''}${url}"`;
  for (const [key, value] of Object.entries(headers)) {
    cmd += ` \\\n  -H "${key}: ${value}"`;
  }
  if (body) {
    cmd += ` \\\n  -d '${JSON.stringify(body, null, 2)}'`;
  }
  return cmd;
}

/**
 * Robust HTTP client with transparent IndexedDB offline fallback
 */
export async function request<T = any>(
  method: string,
  url: string,
  options: {
    token?: string | null;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<{ status: number; ok: boolean; data: T; error?: string; fromCache?: boolean }> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers || {})
  };

  if (options.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const startTime = performance.now();

  // 1. If simulated offline or device offline, intercept immediately if possible
  const forceOffline = !isAppOnline();

  if (!forceOffline) {
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      const status = res.status;
      const statusText = res.statusText;

      const contentType = res.headers.get('content-type') || '';
      let responseData: any = null;
      if (contentType.includes('application/json')) {
        responseData = await res.json();
      } else {
        responseData = await res.text();
      }

      const durationMs = Math.round(performance.now() - startTime);

      notifyApiCall({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toISOString(),
        method,
        url,
        status,
        statusText,
        requestHeaders: headers,
        requestBody: options.body,
        responseBody: responseData,
        curl: generateCurl(method, url, headers, options.body),
        durationMs,
        fromCache: false
      });

      // Background caching to IndexedDB on successful responses
      if (res.ok && responseData) {
        handleBackgroundCache(method, url, responseData);
      }

      return {
        status,
        ok: res.ok,
        data: responseData as T,
        error: !res.ok ? (responseData?.error || responseData?.message || `HTTP ${status}`) : undefined,
        fromCache: false
      };
    } catch (networkErr: any) {
      console.warn(`Live request to ${url} failed, checking IndexedDB cache...`, networkErr);
      // Fall through to offline cache resolution below
    }
  }

  // 2. Offline Fallback Resolution via IndexedDB
  const cachedResolution = await resolveFromOfflineCache<T>(method, url);
  const durationMs = Math.round(performance.now() - startTime);

  if (cachedResolution.found) {
    notifyApiCall({
      id: Math.random().toString(36).substring(2, 9),
      timestamp: new Date().toISOString(),
      method,
      url,
      status: 200,
      statusText: '200 OK (IndexedDB Cache)',
      requestHeaders: headers,
      requestBody: options.body,
      responseBody: cachedResolution.data,
      curl: generateCurl(method, url, headers, options.body),
      durationMs,
      fromCache: true
    });

    return {
      status: 200,
      ok: true,
      data: cachedResolution.data as T,
      fromCache: true
    };
  }

  // If not found in cache and network is unavailable
  notifyApiCall({
    id: Math.random().toString(36).substring(2, 9),
    timestamp: new Date().toISOString(),
    method,
    url,
    status: 0,
    statusText: forceOffline ? 'Offline (Not Cached)' : 'Network Error',
    requestHeaders: headers,
    requestBody: options.body,
    responseBody: { 
      error: forceOffline 
        ? 'Network is offline and requested resource is not available in local IndexedDB cache.' 
        : 'Network request failed' 
    },
    curl: generateCurl(method, url, headers, options.body),
    durationMs,
    fromCache: false
  });

  return {
    status: 0,
    ok: false,
    data: null as any,
    error: forceOffline 
      ? 'Network offline: No cached data available for this endpoint.' 
      : 'Network request failed',
    fromCache: false
  };
}

/**
 * Background caching helper
 */
async function handleBackgroundCache(method: string, url: string, data: any) {
  try {
    if (method === 'GET') {
      if (url.includes('/api/all-patients') && Array.isArray(data)) {
        await offlineDb.cachePatients(data);
      } else if (url === '/patients' && Array.isArray(data)) {
        await offlineDb.cachePatients(data);
      } else if (url.startsWith('/patients/pat-') && data && data.id) {
        await offlineDb.cachePatients([data]);
      } else if (url.includes('/logs') && !url.includes('/verify') && !url.includes('/overrides/summary')) {
        const logsList = Array.isArray(data) ? data : data.logs;
        if (Array.isArray(logsList)) {
          await offlineDb.cacheAuditLogs(logsList);
        }
      } else if (url.includes('/logs/overrides/summary') && data) {
        await offlineDb.setMetadata('emergencySummary', data);
      } else if (url.includes('/api/meta') && data) {
        await offlineDb.cacheSystemMeta(data.wards || [], data.staff || []);
      }
    }
  } catch (err) {
    console.warn('Background IndexedDB cache write failed:', err);
  }
}

/**
 * Resolves cached response from IndexedDB for read endpoints
 */
async function resolveFromOfflineCache<T>(method: string, url: string): Promise<{ found: boolean; data: any }> {
  if (method !== 'GET') {
    return { found: false, data: null };
  }

  try {
    // 1. All patients
    if (url.includes('/api/all-patients')) {
      const cached = await offlineDb.getCachedPatients();
      if (cached && cached.length > 0) {
        return { found: true, data: cached };
      }
    }

    // 2. Assigned / ward patients
    if (url === '/patients' || url.startsWith('/patients?')) {
      const cached = await offlineDb.getCachedPatients();
      if (cached && cached.length > 0) {
        return { found: true, data: cached };
      }
    }

    // 3. Specific patient by ID
    if (url.startsWith('/patients/pat-')) {
      const patientId = url.replace('/patients/', '').split('?')[0];
      const cached = await offlineDb.getCachedPatient(patientId);
      if (cached) {
        return { found: true, data: cached };
      }
    }

    // 4. Audit logs list
    if (url.includes('/logs') && !url.includes('/verify') && !url.includes('/overrides/summary')) {
      const cachedLogs = await offlineDb.getCachedAuditLogs();
      if (cachedLogs && cachedLogs.length > 0) {
        return {
          found: true,
          data: {
            logs: cachedLogs,
            count: cachedLogs.length,
            fromOfflineCache: true
          }
        };
      }
    }

    // 5. Emergency overrides summary
    if (url.includes('/logs/overrides/summary')) {
      const cachedSummary = await offlineDb.getMetadata('emergencySummary');
      if (cachedSummary) {
        return { found: true, data: cachedSummary };
      }
    }

    // 6. System metadata (wards, staff)
    if (url.includes('/api/meta')) {
      const cached = await offlineDb.getCachedSystemMeta();
      if (cached.wards.length > 0 || cached.staff.length > 0) {
        return {
          found: true,
          data: {
            stats: {
              staffCount: cached.staff.length,
              wardCount: cached.wards.length,
              patientCount: 0,
              logCount: 0,
              anchorCount: 0
            },
            wards: cached.wards,
            staff: cached.staff,
            latestAnchor: null,
            latestLog: null,
            fromOfflineCache: true
          }
        };
      }
    }
  } catch (err) {
    console.warn('Error reading from offline IndexedDB cache:', err);
  }

  return { found: false, data: null };
}
