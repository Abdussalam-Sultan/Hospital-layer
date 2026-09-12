import React, { useState, useEffect } from 'react';
import { 
  Wifi, 
  WifiOff, 
  Database, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  ShieldCheck, 
  Clock, 
  FileText, 
  X, 
  AlertCircle,
  HardDrive
} from 'lucide-react';
import { offlineDb, CacheStats } from '../offlineDb';
import { isAppOnline, isSimulatingOffline, setSimulateOffline } from '../api';

interface OfflineManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onForceSync: () => Promise<void>;
  isSyncing?: boolean;
}

export const OfflineManagerModal: React.FC<OfflineManagerModalProps> = ({
  isOpen,
  onClose,
  onForceSync,
  isSyncing = false
}) => {
  const [stats, setStats] = useState<CacheStats>({
    patientCount: 0,
    logCount: 0,
    lastSyncedAt: null,
    cachedWardsCount: 0,
    cachedStaffCount: 0
  });
  const [simulated, setSimulated] = useState(isSimulatingOffline());
  const [isClearing, setIsClearing] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const refreshStats = async () => {
    const currentStats = await offlineDb.getCacheStats();
    setStats(currentStats);
  };

  useEffect(() => {
    if (isOpen) {
      refreshStats();
      setSimulated(isSimulatingOffline());
    }
  }, [isOpen]);

  const handleToggleSimulation = () => {
    const nextState = !simulated;
    setSimulateOffline(nextState);
    setSimulated(nextState);
    setNotification(nextState ? 'Simulated Offline Mode enabled. Network requests will now resolve from IndexedDB.' : 'Online Mode restored.');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear the local IndexedDB cache?')) {
      setIsClearing(true);
      await offlineDb.clearAllCache();
      await refreshStats();
      setIsClearing(false);
      setNotification('IndexedDB cache has been cleared.');
      setTimeout(() => setNotification(null), 3000);
    }
  };

  const handleSyncNow = async () => {
    await onForceSync();
    await refreshStats();
    setNotification('Data freshly synced from server into IndexedDB cache.');
    setTimeout(() => setNotification(null), 3000);
  };

  if (!isOpen) return null;

  const online = isAppOnline();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div 
        id="offline-manager-modal"
        className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-xl w-full overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-950 border border-cyan-800 rounded-lg text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <span>IndexedDB Offline Storage Layer</span>
              </h3>
              <p className="text-xs text-slate-400">
                Local durable persistence for low-network and offline resilience
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {notification && (
            <div className="p-3 bg-cyan-950/70 border border-cyan-700/50 rounded-lg text-xs text-cyan-200 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>{notification}</span>
            </div>
          )}

          {/* Network Mode Toggle Banner */}
          <div className={`p-4 rounded-xl border transition-all ${
            online
              ? 'bg-emerald-950/30 border-emerald-800/60'
              : 'bg-amber-950/30 border-amber-700/60'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`p-2.5 rounded-lg border ${
                  online
                    ? 'bg-emerald-900/40 border-emerald-700 text-emerald-400'
                    : 'bg-amber-900/40 border-amber-600 text-amber-300'
                }`}>
                  {online ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center space-x-2">
                    <span>{online ? 'Application Online (Live Server)' : 'Offline Mode Active'}</span>
                    {simulated && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Simulated
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {online 
                      ? 'Queries hit live API routes; successful responses auto-populate IndexedDB.'
                      : 'All queries are being intercepted and resolved locally from IndexedDB.'}
                  </p>
                </div>
              </div>

              {/* Simulation Switch */}
              <button
                id="toggle-offline-simulation-btn"
                onClick={handleToggleSimulation}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  simulated 
                    ? 'bg-amber-600 hover:bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
              >
                {simulated ? 'Restore Online' : 'Simulate Offline'}
              </button>
            </div>
          </div>

          {/* IndexedDB Object Stores Statistics */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
              <HardDrive className="w-4 h-4 text-cyan-400" />
              <span>Cached IndexedDB Object Stores</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              {/* Patients Store */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>patients store</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {stats.patientCount} records
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Indexed by primary key <code>id</code> & <code>ward_id</code>
                </div>
              </div>

              {/* Audit Logs Store */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>audit_logs store</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-300">
                    {stats.logCount} logs
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Preserves SHA-256 cryptographic chain hashes
                </div>
              </div>

              {/* System Metadata Store */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">system_meta store</span>
                  <span className="text-xs font-mono font-bold text-purple-300">
                    {stats.cachedWardsCount} wards / {stats.cachedStaffCount} staff
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Cached hospital wards, staff directories, & summaries
                </div>
              </div>

              {/* Last Sync Timestamp */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Last Synced</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-300">
                    {stats.lastSyncedAt ? new Date(stats.lastSyncedAt).toLocaleTimeString() : 'Not yet'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Local cache timestamp
                </div>
              </div>
            </div>
          </div>

          {/* Technical Implementation Details */}
          <div className="p-3.5 bg-slate-950/80 border border-slate-800/80 rounded-lg text-xs space-y-2 text-slate-400">
            <div className="flex items-center space-x-2 text-slate-300 font-medium">
              <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>How Offline Caching Works in Aegis Clinical</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-400 pl-1">
              <li>Automatic background cache replication whenever live network requests succeed.</li>
              <li>Network interception automatically pulls patient medical charts and audit logs from browser IndexedDB when disconnected.</li>
              <li>Cryptographic audit log chains remain intact and inspectable locally even during complete hospital intranet outages.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            id="clear-cache-btn"
            onClick={handleClearCache}
            disabled={isClearing}
            className="flex items-center space-x-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/50 px-3 py-2 rounded-lg border border-rose-900/50 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Cache</span>
          </button>

          <div className="flex items-center space-x-3">
            <button
              id="force-sync-btn"
              onClick={handleSyncNow}
              disabled={isSyncing || !online}
              className={`flex items-center space-x-2 text-xs px-3.5 py-2 rounded-lg font-medium transition ${
                !online
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Fresh Data'}</span>
            </button>

            <button
              onClick={onClose}
              className="text-xs px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
