import React, { useState } from 'react';
import { 
  GitCommit, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  Anchor, 
  AlertTriangle, 
  Copy, 
  Check, 
  Eye, 
  Siren, 
  Lock, 
  Unlock, 
  FileSpreadsheet,
  Terminal,
  ExternalLink,
  ChevronDown,
  WifiOff,
  Database
} from 'lucide-react';
import { AccessLog, VerifyResult, EmergencySummaryResponse, ChainAnchor, StaffMember } from '../types';

interface AuditLogsViewProps {
  logs: AccessLog[];
  verifyResult: VerifyResult | null;
  emergencySummary: EmergencySummaryResponse | null;
  onVerifyChain: () => Promise<void>;
  onAnchorNow: () => Promise<void>;
  onSimulateTamper: () => Promise<void>;
  onRefreshLogs: () => Promise<void>;
  isLoading: boolean;
  isOnline?: boolean;
  onOpenOfflineManager?: () => void;
  currentStaff?: StaffMember | null;
  onSelectPersona?: (staffId: string) => Promise<void>;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({
  logs,
  verifyResult,
  emergencySummary,
  onVerifyChain,
  onAnchorNow,
  onSimulateTamper,
  onRefreshLogs,
  isLoading,
  isOnline = true,
  onOpenOfflineManager,
  currentStaff,
  onSelectPersona
}) => {
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [selectedLogForHashDetail, setSelectedLogForHashDetail] = useState<AccessLog | null>(null);
  const [showOverrideSurveillance, setShowOverrideSurveillance] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getActionBadge = (action: string, result: string) => {
    switch (action) {
      case 'EMERGENCY_ACCESS':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950/80 border border-rose-700 text-rose-300 font-mono">
            <Siren className="w-3 h-3 text-rose-400" />
            <span>EMERGENCY_ACCESS</span>
          </span>
        );
      case 'DENIED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950/80 border border-amber-700 text-amber-300 font-mono">
            <Lock className="w-3 h-3 text-amber-400" />
            <span>DENIED</span>
          </span>
        );
      case 'VIEW_RECORD':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/80 border border-emerald-700 text-emerald-300 font-mono">
            <Unlock className="w-3 h-3 text-emerald-400" />
            <span>VIEW_RECORD</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 border border-slate-700 text-slate-300 font-mono">
            <span>{action}</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Offline Mode Active Banner */}
      {!isOnline && (
        <div className="bg-amber-950/70 border border-amber-600/70 rounded-xl p-4 text-amber-200 shadow-md flex items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-900/60 border border-amber-600 rounded-lg text-amber-300 shrink-0">
              <WifiOff className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-bold text-white flex items-center space-x-2">
                <span>Audit Trail Running in Offline Mode</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/40">
                  IndexedDB Audit Ledger
                </span>
              </h3>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Displaying {logs.length} cryptographically chained audit events preserved locally in IndexedDB storage.
              </p>
            </div>
          </div>
          {onOpenOfflineManager && (
            <button
              onClick={onOpenOfflineManager}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-900/80 hover:bg-amber-800 text-amber-100 border border-amber-600 text-xs font-medium transition shrink-0"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Cache Details</span>
            </button>
          )}
        </div>
      )}

      {/* Top Banner with Verification & Simulation Controls */}
      {currentStaff?.role !== 'admin' && (
        <div className="bg-purple-950/40 border border-purple-800/80 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-purple-900/60 border border-purple-700/60 rounded-lg text-purple-300 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-purple-100 uppercase tracking-wide">
                Administrator Privileges Required
              </h4>
              <p className="text-xs text-purple-300/90 mt-0.5">
                {currentStaff
                  ? `Active persona (${currentStaff.name}) has clinical role "${currentStaff.role}". Cryptographic audit verification and full log inspections require an administrator token.`
                  : 'No active session. Authenticate as an administrator to inspect or verify the compliance audit trail.'}
              </p>
            </div>
          </div>
          {onSelectPersona && (
            <button
              onClick={() => onSelectPersona('admin-miranda-bailey')}
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg transition shrink-0 shadow-sm"
            >
              Sign in as Admin (Miranda Bailey)
            </button>
          )}
        </div>
      )}

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-cyan-950 border border-cyan-800 rounded-lg text-cyan-400 shrink-0">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Tamper-Evident Cryptographic Audit Ledger</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                  SHA-256 Hash Chain
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Every access attempt, emergency override, and authentication event is hashed sequentially with the previous entry's SHA-256 hash. Modifying any prior row immediately breaks the mathematical linkage upon verification.
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="verify-chain-btn"
              onClick={onVerifyChain}
              disabled={isLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-lg shadow-sm transition flex items-center space-x-1.5"
              title="Runs GET /logs/verify to cryptographically check all entry hashes and chain linkage"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Verify Chain Integrity</span>
            </button>

            <button
              id="anchor-now-btn"
              onClick={onAnchorNow}
              disabled={isLoading}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg transition flex items-center space-x-1.5"
              title="Runs POST /admin/anchor-now to checkpoint current chain head into chain_anchors"
            >
              <Anchor className="w-4 h-4 text-cyan-400" />
              <span>Snapshot Anchor</span>
            </button>

            <button
              id="simulate-tamper-btn"
              onClick={onSimulateTamper}
              disabled={isLoading}
              className="bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-200 text-xs font-semibold px-3 py-2 rounded-lg transition flex items-center space-x-1.5"
              title="Modifies an existing record in MySQL without updating entry_hash to demonstrate detection"
            >
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>Simulate MySQL Tamper</span>
            </button>

            <button
              onClick={() => setShowOverrideSurveillance(!showOverrideSurveillance)}
              className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg transition flex items-center space-x-1.5"
            >
              <Siren className="w-4 h-4 text-amber-400" />
              <span>Surveillance ({emergencySummary?.totalEmergencyOverrides || 0})</span>
            </button>

            <button
              onClick={onRefreshLogs}
              disabled={isLoading}
              className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800 rounded-lg transition"
              title="Refresh Logs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Verification Result Banner (if verification has been run) */}
      {verifyResult && (
        <div
          id="verify-chain-result"
          className={`border-2 rounded-xl p-4 transition-all animate-in fade-in slide-in-from-top-2 ${
            verifyResult.valid
              ? 'bg-emerald-950/60 border-emerald-600 text-emerald-100'
              : 'bg-rose-950/80 border-rose-600 text-rose-100 animate-pulse'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              {verifyResult.valid ? (
                <div className="p-2 bg-emerald-600 rounded-lg text-white shrink-0 mt-0.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 bg-rose-600 rounded-lg text-white shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded uppercase border ${
                    verifyResult.valid
                      ? 'bg-emerald-900 text-emerald-200 border-emerald-700'
                      : 'bg-rose-900 text-rose-200 border-rose-700'
                  }`}>
                    {verifyResult.valid ? 'VALID: TRUE' : 'VALID: FALSE (TAMPER DETECTED)'}
                  </span>
                  <h3 className="text-sm font-bold">
                    {verifyResult.valid
                      ? 'Audit Ledger Cryptographically Verified'
                      : `Chain Integrity Compromised at Row #${verifyResult.brokenAtId}`}
                  </h3>
                </div>
                <p className="text-xs mt-1 opacity-90">
                  {verifyResult.valid
                    ? `Verified ${verifyResult.totalEntries || logs.length} consecutive entries. Every SHA-256 hash matches its stored preimage and previous link.`
                    : `Discrepancy detected: ${verifyResult.reason}`}
                </p>
                {verifyResult.lastAnchorCheckedAt && (
                  <div className="text-[11px] opacity-75 font-mono mt-1">
                    Anchor check against checkpoint timestamp: {new Date(verifyResult.lastAnchorCheckedAt).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Status Code</span>
              <strong className="text-sm font-mono text-white">HTTP 200 OK</strong>
            </div>
          </div>
        </div>
      )}

      {/* Emergency Overrides Surveillance Drawer */}
      {showOverrideSurveillance && emergencySummary && (
        <div className="bg-slate-900 border border-amber-800/80 rounded-xl p-5 space-y-3 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-amber-300">
              <Siren className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold">Emergency Overrides Surveillance (GET /logs/overrides/summary)</h3>
            </div>
            <span className="text-xs bg-amber-950/80 text-amber-300 border border-amber-700 px-2.5 py-1 rounded-full font-semibold">
              Total Overrides: {emergencySummary.totalEmergencyOverrides}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Identifies staff members with disproportionate emergency override activity to detect potential abuse of the break-glass mechanism.
          </p>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2 px-3">Staff ID & Name</th>
                  <th className="py-2 px-3">Role</th>
                  <th className="py-2 px-3">Override Count</th>
                  <th className="py-2 px-3">Last Override Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {emergencySummary.rankings.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-slate-500 italic">
                      No emergency override events recorded yet.
                    </td>
                  </tr>
                ) : (
                  emergencySummary.rankings.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-3">
                        <strong className="text-white block">{item.staff_name}</strong>
                        <span className="text-[10px] text-slate-500 font-mono">{item.staff_id}</span>
                      </td>
                      <td className="py-2.5 px-3 uppercase font-mono text-[11px] text-slate-300">
                        {item.staff_role}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-mono font-bold">
                          {item.emergency_access_count}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px]">
                        {new Date(item.last_emergency_access_at).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
            <span>Audit Trail Ledger ({logs.length} Total Events)</span>
          </h3>
          <span className="text-[11px] text-slate-500">Ordered by chronological row sequence</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/40 text-slate-400 uppercase text-[10px] font-semibold">
                <th className="py-3 px-3">#</th>
                <th className="py-3 px-3">Action</th>
                <th className="py-3 px-3">Result</th>
                <th className="py-3 px-3">Staff & Ward Snapshot</th>
                <th className="py-3 px-3">Patient & Ward Snapshot</th>
                <th className="py-3 px-3">Clinical Reason</th>
                <th className="py-3 px-3">Cryptographic Linkage (SHA-256)</th>
                <th className="py-3 px-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <GitCommit className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm font-medium">Audit chain is currently empty.</p>
                    <p className="text-xs text-slate-600 mt-1">Sign in as a staff member or view patient charts to generate audit log records.</p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const isBrokenRow = verifyResult && !verifyResult.valid && verifyResult.brokenAtId === log.id;
                  return (
                    <tr
                      key={log.id}
                      className={`transition ${
                        isBrokenRow
                          ? 'bg-rose-950/50 border-l-4 border-rose-500'
                          : 'hover:bg-slate-800/30'
                      }`}
                    >
                      {/* Row ID */}
                      <td className="py-3 px-3 font-mono text-slate-400 font-bold">
                        #{log.id}
                      </td>

                      {/* Action */}
                      <td className="py-3 px-3">
                        {getActionBadge(log.action, log.result)}
                      </td>

                      {/* Result */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          log.result === 'GRANTED'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950/60 text-rose-400 border border-rose-800'
                        }`}>
                          {log.result}
                        </span>
                      </td>

                      {/* Staff & Ward Snapshot */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-slate-200 text-[11px]">
                          {log.staff_id}
                        </div>
                        <div className="text-[10px] text-cyan-300 font-mono">
                          Shift Ward: {log.staff_ward_at_time}
                        </div>
                      </td>

                      {/* Patient & Ward Snapshot */}
                      <td className="py-3 px-3">
                        {log.patient_id ? (
                          <>
                            <div className="font-mono text-slate-200 text-[11px]">
                              {log.patient_id}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Patient Ward: {log.patient_ward_at_time || 'N/A'}
                            </div>
                          </>
                        ) : (
                          <span className="text-slate-600 font-mono">—</span>
                        )}
                      </td>

                      {/* Clinical Reason */}
                      <td className="py-3 px-3 max-w-xs">
                        {log.reason ? (
                          <span className={`text-[11px] line-clamp-2 ${
                            log.action === 'EMERGENCY_ACCESS'
                              ? 'text-rose-200 font-medium'
                              : 'text-slate-300'
                          }`}>
                            "{log.reason}"
                          </span>
                        ) : (
                          <span className="text-slate-600 font-mono text-[11px]">null</span>
                        )}
                      </td>

                      {/* Hash Linkage */}
                      <td className="py-3 px-3 font-mono text-[10px]">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-1 text-slate-500">
                            <span>prev:</span>
                            <span className="text-slate-400 truncate max-w-[120px]">
                              {log.prev_hash.substring(0, 8)}...{log.prev_hash.substring(log.prev_hash.length - 4)}
                            </span>
                            <button
                              onClick={() => handleCopy(log.prev_hash)}
                              className="text-slate-600 hover:text-slate-300 p-0.5 rounded"
                              title="Copy prev_hash"
                            >
                              {copiedHash === log.prev_hash ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                          <div className="flex items-center space-x-1 text-slate-400">
                            <span className="text-cyan-400 font-bold">hash:</span>
                            <span className="text-cyan-300 truncate max-w-[120px]">
                              {log.entry_hash.substring(0, 8)}...{log.entry_hash.substring(log.entry_hash.length - 4)}
                            </span>
                            <button
                              onClick={() => handleCopy(log.entry_hash)}
                              className="text-slate-500 hover:text-slate-300 p-0.5 rounded"
                              title="Copy entry_hash"
                            >
                              {copiedHash === log.entry_hash ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              onClick={() => setSelectedLogForHashDetail(log)}
                              className="text-slate-500 hover:text-cyan-300 p-0.5 rounded ml-1"
                              title="Inspect Preimage and Hash details"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-3 text-right font-mono text-[10px] text-slate-400 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal for inspecting SHA256 Hash Preimage */}
      {selectedLogForHashDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                <GitCommit className="w-4 h-4 text-cyan-400" />
                <span>Log Entry #{selectedLogForHashDetail.id} Cryptographic Inspection</span>
              </h4>
              <button
                onClick={() => setSelectedLogForHashDetail(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Canonical Preimage String Format:
                </label>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-slate-300 break-all">
                  {selectedLogForHashDetail.prev_hash}|{selectedLogForHashDetail.staff_id}|{selectedLogForHashDetail.patient_id || 'null'}|{selectedLogForHashDetail.action}|{selectedLogForHashDetail.result}|{selectedLogForHashDetail.reason || 'null'}|{selectedLogForHashDetail.staff_ward_at_time}|{selectedLogForHashDetail.patient_ward_at_time || 'null'}|{selectedLogForHashDetail.timestamp}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Previous Hash (prev_hash):
                </label>
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded font-mono text-[11px] text-slate-400 break-all">
                  {selectedLogForHashDetail.prev_hash}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-cyan-400 block mb-1">
                  Computed SHA-256 Digest (entry_hash):
                </label>
                <div className="p-2.5 bg-cyan-950/50 border border-cyan-800 rounded font-mono text-[11px] text-cyan-200 break-all">
                  {selectedLogForHashDetail.entry_hash}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLogForHashDetail(null)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
