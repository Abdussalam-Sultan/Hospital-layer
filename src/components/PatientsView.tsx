import React, { useState } from 'react';
import { 
  Building, 
  Lock, 
  Unlock, 
  AlertTriangle, 
  Search, 
  Siren, 
  CheckCircle, 
  ShieldAlert, 
  User, 
  ChevronRight,
  Info,
  Calendar,
  Activity,
  WifiOff,
  Database
} from 'lucide-react';
import { Patient, StaffMember, Ward } from '../types';
import { sanitizePatientForRole } from '../../utils/roleAccess.js';

interface PatientsViewProps {
  currentStaff: StaffMember | null;
  assignedPatients: Patient[];
  allPatients: Patient[];
  wards: Ward[];
  selectedWardFilter: number | 'all' | 'assigned';
  setSelectedWardFilter: (val: number | 'all' | 'assigned') => void;
  onViewPatient: (patientId: string) => Promise<void>;
  onOpenEmergencyModal: (patient: Patient) => void;
  isLoading: boolean;
  deniedError: { patient: Patient; message: string; status: number } | null;
  clearDeniedError: () => void;
  isOnline?: boolean;
  onOpenOfflineManager?: () => void;
  onOpenPersonaSwitcher?: () => void;
}

export const PatientsView: React.FC<PatientsViewProps> = ({
  currentStaff,
  assignedPatients,
  allPatients,
  wards,
  selectedWardFilter,
  setSelectedWardFilter,
  onViewPatient,
  onOpenEmergencyModal,
  isLoading,
  deniedError,
  clearDeniedError,
  isOnline = true,
  onOpenOfflineManager,
  onOpenPersonaSwitcher
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const role = currentStaff?.role ?? 'clerk';
  const canSeeAllPatients = role === 'admin';
  const effectiveWardFilter = role !== 'admin' && selectedWardFilter === 'all' ? 'assigned' : selectedWardFilter;

  // Determine active ward ID for the current staff member
  const currentWardId = currentStaff?.current_ward_id;

  // Filter patients based on selection and search
  let patientListToDisplay: Patient[] = [];
  if (effectiveWardFilter === 'assigned') {
    patientListToDisplay = assignedPatients;
  } else if (effectiveWardFilter === 'all') {
    patientListToDisplay = allPatients;
  } else {
    patientListToDisplay = allPatients.filter((p) => p.ward_id === effectiveWardFilter);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    patientListToDisplay = patientListToDisplay.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.diagnosis.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
    );
  }

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
                <span>Offline / Low-Network Mode Active</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/40">
                  IndexedDB Local Cache
                </span>
              </h3>
              <p className="text-xs text-amber-300/80 mt-0.5">
                Hospital network unavailable. Displaying locally cached patient charts from browser IndexedDB storage.
              </p>
            </div>
          </div>
          {onOpenOfflineManager && (
            <button
              onClick={onOpenOfflineManager}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-900/80 hover:bg-amber-800 text-amber-100 border border-amber-600 text-xs font-medium transition shrink-0"
            >
              <Database className="w-3.5 h-3.5" />
              <span>Storage Stats</span>
            </button>
          )}
        </div>
      )}

      {/* Dynamic Shift Policy Info Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start space-x-3">
            <div className="p-2.5 bg-cyan-950 border border-cyan-800 rounded-lg text-cyan-400 shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Active Shift Enforcement:</span>
                <span className={`font-mono ${currentStaff ? 'text-cyan-400' : 'text-amber-400'}`}>
                  {currentStaff ? currentStaff.current_ward_name || 'No Active Shift' : 'No Active Persona'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {currentStaff ? (
                  <>
                    You are currently logged in as <strong className="text-slate-200">{currentStaff.name}</strong> ({currentStaff.role}).
                    Access to patient medical charts is strictly scoped to your currently active shift ward. Attempting to access out-of-ward patients triggers a logged 403 Forbidden unless an emergency override is declared.
                  </>
                ) : (
                  <>
                    No staff persona is currently active. Select a persona from the header or click below to authenticate as a doctor, nurse, or clerk to access assigned patient charts.
                  </>
                )}
              </p>
              {!currentStaff && onOpenPersonaSwitcher && (
                <div className="mt-2.5">
                  <button
                    onClick={onOpenPersonaSwitcher}
                    className="inline-flex items-center space-x-1.5 px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded text-xs font-semibold transition"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Select Staff Persona</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center space-x-3 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 shrink-0 text-xs">
            <div>
              <span className="text-slate-500 block text-[11px]">Assigned to You</span>
              <strong className="text-emerald-400 text-sm">{assignedPatients.length} Patients</strong>
            </div>
            <div className="h-6 w-px bg-slate-800"></div>
            <div>
              <span className="text-slate-500 block text-[11px]">Hospital Total</span>
              <strong className="text-slate-300 text-sm">{allPatients.length} Patients</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Denied Access Alert Banner (if user recently hit a 403) */}
      {deniedError && (
        <div className="bg-rose-950/70 border-2 border-rose-700 rounded-xl p-4 text-white shadow-xl animate-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-rose-600 rounded-lg text-white shrink-0 mt-0.5 animate-bounce">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-rose-900 text-rose-200 border border-rose-700 font-mono text-xs font-bold rounded">
                    HTTP 403 FORBIDDEN
                  </span>
                  <h3 className="text-sm font-bold text-rose-100">
                    Access Denied: Cross-Ward Policy Violation
                  </h3>
                </div>
                <p className="text-xs text-rose-200 mt-1">
                  {deniedError.message}
                </p>
                <div className="text-[11px] text-rose-300/80 font-mono mt-1">
                  Target: {deniedError.patient.name} ({deniedError.patient.ward_name || `Ward ${deniedError.patient.ward_id}`}) | Your Shift: {currentStaff?.current_ward_name}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={clearDeniedError}
                className="text-xs text-rose-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-rose-900/50 transition"
              >
                Dismiss
              </button>
              <button
                id="break-glass-btn"
                onClick={() => {
                  onOpenEmergencyModal(deniedError.patient);
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md flex items-center space-x-1.5 transition"
              >
                <Siren className="w-4 h-4" />
                <span>Emergency Override</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Ward Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            id="filter-assigned"
            onClick={() => setSelectedWardFilter('assigned')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
              effectiveWardFilter === 'assigned'
                ? 'bg-cyan-600 text-white shadow-xs font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            My Ward ({currentStaff?.current_ward_name || 'Assigned'})
          </button>

          {canSeeAllPatients && (
            <button
              id="filter-all"
              onClick={() => setSelectedWardFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition ${
                effectiveWardFilter === 'all'
                  ? 'bg-cyan-600 text-white shadow-xs font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              All Hospital Beds ({allPatients.length})
            </button>
          )}

          {wards.map((ward) => (
            <button
              key={ward.id}
              onClick={() => setSelectedWardFilter(ward.id)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                selectedWardFilter === ward.id
                  ? 'bg-cyan-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {ward.name}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search patient, diagnosis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Patient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {patientListToDisplay.map((patient) => {
          const visiblePatient = sanitizePatientForRole(patient, role);
          const isAssignedToWard = currentWardId && patient.ward_id === currentWardId;

          return (
            <div
              key={patient.id}
              id={`patient-card-${patient.id}`}
              className={`bg-slate-900 border rounded-xl p-4 flex flex-col justify-between transition-all hover:shadow-lg ${
                isAssignedToWard
                  ? 'border-emerald-800/80 hover:border-emerald-600 bg-linear-to-b from-slate-900 to-emerald-950/20'
                  : 'border-slate-800 hover:border-rose-800/60'
              }`}
            >
              <div className="space-y-3">
                {/* Header: Name and Ward Badge */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-lg ${
                      isAssignedToWard ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white leading-tight">
                        {visiblePatient.name}
                      </h3>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {visiblePatient.id}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border font-mono ${
                    isAssignedToWard
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                    {visiblePatient.ward_name || `Ward ${visiblePatient.ward_id}`}
                  </span>
                </div>

                {/* Details */}
                <div className="text-xs space-y-1 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between text-slate-400">
                    <span>DOB:</span>
                    <span className="text-slate-200">{visiblePatient.dob}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Admitted:</span>
                    <span className="text-slate-200">{new Date(patient.admitted_at).toLocaleDateString()}</span>
                  </div>
                  <div className="pt-1 border-t border-slate-800 text-slate-400">
                    <span className="block text-[11px] font-medium text-slate-500">Diagnosis preview:</span>
                    <span className="text-slate-300 line-clamp-1 italic text-[11px]">
                      {isAssignedToWard ? visiblePatient.diagnosis : '•••••••••••••••• (Restricted)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-800/80 mt-3 flex items-center justify-between">
                {isAssignedToWard ? (
                  <button
                    id={`view-patient-${patient.id}`}
                    disabled={isLoading}
                    onClick={() => onViewPatient(patient.id)}
                    className="w-full bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 transition"
                  >
                    <Unlock className="w-3.5 h-3.5" />
                    <span>View Record (Authorized)</span>
                  </button>
                ) : (
                  <div className="flex w-full space-x-2">
                    <button
                      id={`test-denied-${patient.id}`}
                      disabled={isLoading}
                      onClick={() => onViewPatient(patient.id)}
                      className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-medium py-2 px-2.5 rounded-lg flex items-center justify-center space-x-1 border border-slate-700 transition"
                      title="Tests normal cross-ward access (expected 403 Forbidden)"
                    >
                      <Lock className="w-3 h-3 text-rose-400" />
                      <span>Test Access</span>
                    </button>
                    <button
                      id={`override-${patient.id}`}
                      onClick={() => onOpenEmergencyModal(patient)}
                      className="bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 hover:text-white text-xs font-semibold py-2 px-3 rounded-lg flex items-center space-x-1 transition"
                      title="Emergency override access"
                    >
                      <Siren className="w-3.5 h-3.5 text-rose-400" />
                      <span>Override</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {patientListToDisplay.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
            <Building className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm font-medium">No patients found for this ward filter.</p>
            <p className="text-xs text-slate-600 mt-1">Try switching to "All Hospital Beds" or adjusting the search term.</p>
          </div>
        )}
      </div>
    </div>
  );
};
