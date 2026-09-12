import React from 'react';
import { X, CheckCircle2, Siren, User, Calendar, Stethoscope, Building, ShieldCheck, Heart, Activity, WifiOff, Database } from 'lucide-react';
import { Patient, StaffMember } from '../types';
import { sanitizePatientForRole } from '../../utils/roleAccess.js';

interface PatientRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  accessMode: 'regular' | 'emergency';
  emergencyReason?: string | null;
  isOffline?: boolean;
  currentStaff?: StaffMember | null;
}

export const PatientRecordModal: React.FC<PatientRecordModalProps> = ({
  isOpen,
  onClose,
  patient,
  accessMode,
  emergencyReason,
  isOffline = false,
  currentStaff = null
}) => {
  if (!isOpen || !patient) return null;

  const visiblePatient = sanitizePatientForRole(patient, currentStaff?.role);
  const isClerkView = currentStaff?.role === 'clerk';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Banner Header */}
        <div className={`px-6 py-4 flex items-center justify-between border-b ${
          accessMode === 'emergency'
            ? 'bg-rose-950/80 border-rose-800 text-rose-100'
            : 'bg-emerald-950/80 border-emerald-800 text-emerald-100'
        }`}>
          <div className="flex items-center space-x-3">
            {accessMode === 'emergency' ? (
              <div className="p-2 rounded-lg bg-rose-600 text-white animate-pulse">
                <Siren className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-emerald-600 text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold tracking-wide">
                  PATIENT MEDICAL RECORD
                </h3>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase border font-mono ${
                  accessMode === 'emergency'
                    ? 'bg-rose-900/60 text-rose-200 border-rose-700'
                    : 'bg-emerald-900/60 text-emerald-200 border-emerald-700'
                }`}>
                  {accessMode === 'emergency' ? 'EMERGENCY OVERRIDE (200 OK)' : 'WARD PERMITTED (200 OK)'}
                </span>
                {isOffline && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1 font-mono">
                    <Database className="w-3 h-3 text-amber-300" />
                    <span>CACHED IN IDB</span>
                  </span>
                )}
              </div>
              <p className="text-xs opacity-80 mt-0.5">
                {isOffline
                  ? 'Loaded securely from browser IndexedDB storage during offline / low-network operation.'
                  : isClerkView
                  ? 'Role-restricted view: DOB and diagnosis are hidden for clerical staff.'
                  : accessMode === 'emergency'
                  ? 'Access unlocked via break-glass protocol. Event logged to cryptographic hash chain.'
                  : 'Access authorized under your currently active shift ward assignment.'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5">
          {/* Emergency reason alert if applicable */}
          {accessMode === 'emergency' && emergencyReason && (
            <div className="bg-rose-950/40 border border-rose-700/80 rounded-lg p-3 text-xs text-rose-200">
              <span className="font-semibold text-rose-300 block mb-1">
                Audited Clinical Justification:
              </span>
              <p className="font-mono text-xs bg-slate-950/70 p-2 rounded border border-rose-900/60 text-rose-100">
                "{emergencyReason}"
              </p>
            </div>
          )}

          {/* Patient Overview Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-lg">
              <span className="text-[11px] text-slate-400 block font-medium">Patient Full Name</span>
              <div className="text-base font-bold text-white mt-1 flex items-center space-x-2">
                <User className="w-4 h-4 text-cyan-400" />
                <span>{visiblePatient.name}</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">ID: {visiblePatient.id}</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-lg">
              <span className="text-[11px] text-slate-400 block font-medium">Assigned Ward</span>
              <div className="text-sm font-bold text-cyan-300 mt-1 flex items-center space-x-2">
                <Building className="w-4 h-4 text-cyan-400" />
                <span>{visiblePatient.ward_name || `Ward ${visiblePatient.ward_id}`}</span>
              </div>
              <span className="text-[10px] text-slate-500">Bed Location #0{visiblePatient.ward_id}</span>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-lg">
              <span className="text-[11px] text-slate-400 block font-medium">Date of Birth & Age</span>
              <div className="text-sm font-semibold text-slate-200 mt-1 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <span>{visiblePatient.dob}</span>
              </div>
              <span className="text-[10px] text-slate-500">Admitted: {new Date(visiblePatient.admitted_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Clinical Diagnosis & Medical Orders */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
              <Stethoscope className="w-4 h-4 text-cyan-400" />
              <span>Primary Clinical Diagnosis</span>
            </div>
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-md text-sm font-medium text-slate-100">
              {visiblePatient.diagnosis}
            </div>

            {/* Vital Signs simulation */}
            <div className="pt-2">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Telemetry & Vitals (Live Telemetry Monitor)
              </span>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-slate-900/90 border border-slate-800 p-2 rounded text-center">
                  <span className="text-[10px] text-slate-400 block">Heart Rate</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono">76 bpm</span>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 p-2 rounded text-center">
                  <span className="text-[10px] text-slate-400 block">Blood Pressure</span>
                  <span className="text-sm font-bold text-cyan-400 font-mono">124/82</span>
                </div>
                <div className="bg-slate-900/90 border border-slate-800 p-2 rounded text-center">
                  <span className="text-[10px] text-slate-400 block">SpO2 Oxygen</span>
                  <span className="text-sm font-bold text-blue-400 font-mono">98% Room Air</span>
                </div>
              </div>
            </div>
          </div>

          {/* Close button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-4 py-2 rounded-lg border border-slate-700 transition"
            >
              Close Patient Chart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
