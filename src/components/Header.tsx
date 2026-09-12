import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  User, 
  RefreshCw, 
  Users, 
  FileText, 
  GitCommit, 
  Terminal, 
  Clock, 
  Key,
  Building2,
  ChevronDown,
  Wifi,
  WifiOff,
  Database
} from 'lucide-react';
import { StaffMember } from '../types';

interface HeaderProps {
  currentStaff: StaffMember | null;
  activeTab: 'patients' | 'shifts' | 'logs' | 'api-test';
  setActiveTab: (tab: 'patients' | 'shifts' | 'logs' | 'api-test') => void;
  onOpenPersonaSwitcher: () => void;
  onSignOut?: () => void;
  onReseed: () => void;
  isReseeding: boolean;
  totalLogs: number;
  isChainValid: boolean | null;
  isOnline?: boolean;
  isSimulatedOffline?: boolean;
  cachedPatientCount?: number;
  onOpenOfflineManager?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentStaff,
  activeTab,
  setActiveTab,
  onOpenPersonaSwitcher,
  onSignOut,
  onReseed,
  isReseeding,
  totalLogs,
  isChainValid,
  isOnline = true,
  isSimulatedOffline = false,
  cachedPatientCount = 0,
  onOpenOfflineManager
}) => {
  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'doctor':
        return 'bg-blue-900/60 text-blue-300 border-blue-700/50';
      case 'nurse':
        return 'bg-emerald-900/60 text-emerald-300 border-emerald-700/50';
      case 'admin':
        return 'bg-purple-900/60 text-purple-300 border-purple-700/50';
      default:
        return 'bg-amber-900/60 text-amber-300 border-amber-700/50';
    }
  };

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 sticky top-0 z-30 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-cyan-600 flex items-center justify-center text-white font-bold shadow-inner">
              <Building2 className="h-6 w-6 text-cyan-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  AEGIS CLINICAL
                </h1>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700 font-mono">
                  v1.0-PROTOTYPE
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Shift-Dynamic Access Control & Tamper-Evident Hash Chain Audit
              </p>
            </div>
          </div>

          {/* Quick Stats & Controls */}
          <div className="flex items-center space-x-3">
            {/* Offline / IndexedDB Storage Status Pill */}
            <button
              id="offline-manager-pill"
              onClick={onOpenOfflineManager}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-all ${
                !isOnline
                  ? 'bg-amber-950/80 border-amber-500 text-amber-300 animate-pulse hover:bg-amber-900/80'
                  : 'bg-slate-800/90 border-slate-700 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
              title="Click to view IndexedDB Offline Storage Manager"
            >
              {!isOnline ? (
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <div className="flex items-center space-x-1 text-emerald-400">
                  <Database className="w-3.5 h-3.5" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                </div>
              )}
              <span className="font-medium">
                {!isOnline ? 'Offline (IDB Active)' : 'IndexedDB Ready'}
              </span>
              {cachedPatientCount > 0 && (
                <>
                  <span className="text-slate-500">|</span>
                  <span className="font-mono text-[11px] text-cyan-300">{cachedPatientCount} cached</span>
                </>
              )}
            </button>

            {/* Chain Integrity Pill */}
            <div 
              onClick={() => setActiveTab('logs')}
              className={`hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs cursor-pointer transition-colors ${
                isChainValid === true
                  ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300 hover:bg-emerald-900/50'
                  : isChainValid === false
                  ? 'bg-rose-950/70 border-rose-600 text-rose-300 animate-pulse hover:bg-rose-900/70'
                  : 'bg-slate-800 border-slate-700 text-slate-300'
              }`}
              title="Audit Hash-Chain Status"
            >
              {isChainValid === true ? (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              ) : isChainValid === false ? (
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <GitCommit className="w-3.5 h-3.5 text-slate-400" />
              )}
              <span className="font-medium">
                {isChainValid === true ? 'Chain Valid' : isChainValid === false ? 'Tamper Detected' : 'Chain Unverified'}
              </span>
              <span className="text-slate-500">|</span>
              <span className="font-mono text-[11px] text-slate-300">{totalLogs} logs</span>
            </div>

            {/* Persona Switcher Pill */}
            {currentStaff ? (
              <div className="flex items-center gap-2">
                <button
                  id="persona-switcher-btn"
                  onClick={onOpenPersonaSwitcher}
                  className="flex items-center space-x-2.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-lg text-left transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center text-slate-200">
                    <User className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div className="text-xs">
                    <div className="font-semibold text-slate-100 flex items-center space-x-1.5">
                      <span>{currentStaff.name}</span>
                      <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${getRoleBadgeColor(currentStaff.role)}`}>
                        {currentStaff.role}
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px] flex items-center space-x-1">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Active Shift: <strong className="text-cyan-300 font-medium">{currentStaff.current_ward_name || 'Unassigned'}</strong></span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
                <button
                  type="button"
                  onClick={onSignOut}
                  className="bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenPersonaSwitcher}
                className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Select Staff Persona</span>
              </button>
            )}

            {/* Quick Reseed DB Button */}
            <button
              onClick={onReseed}
              disabled={isReseeding}
              className="hidden lg:flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 p-2 rounded-lg border border-slate-800 hover:border-slate-700 transition"
              title="Reset Database to Clean Initial Seed State"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin text-cyan-400' : ''}`} />
              <span>Reset DB</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-t border-slate-800/80 pt-2 pb-2">
          <button
            id="tab-patients"
            onClick={() => setActiveTab('patients')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-xs font-medium transition-all ${
              activeTab === 'patients'
                ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Clinical Patients</span>
          </button>

          <button
            id="tab-shifts"
            onClick={() => setActiveTab('shifts')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-xs font-medium transition-all ${
              activeTab === 'shifts'
                ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Shift Reassignments</span>
          </button>

          <button
            id="tab-logs"
            onClick={() => setActiveTab('logs')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-xs font-medium transition-all ${
              activeTab === 'logs'
                ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <GitCommit className="w-4 h-4" />
            <span>Cryptographic Audit Log</span>
          </button>

          <button
            id="tab-api-test"
            onClick={() => setActiveTab('api-test')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-xs font-medium transition-all ${
              activeTab === 'api-test'
                ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>API Test Suite & Curl Lab</span>
          </button>
        </div>
      </div>
    </header>
  );
};
