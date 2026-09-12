import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, X, Siren, Lock, FileWarning } from 'lucide-react';
import { Patient, StaffMember } from '../types';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  currentStaff: StaffMember | null;
  onSubmitOverride: (patientId: string, reason: string) => Promise<void>;
  isLoading: boolean;
}

const PRESET_REASONS = [
  'Acute cardiopulmonary arrest / Code Blue response',
  'Urgent airway management / emergency intubation',
  'Immediate cross-ward trauma surgical consult',
  'Acute anaphylactic shock resuscitation protocol',
  'Suspected hemorrhagic shock requiring stat transfusion orders'
];

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  patient,
  currentStaff,
  onSubmitOverride,
  isLoading
}) => {
  const [reason, setReason] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  if (!isOpen || !patient) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setValidationError('A specific clinical reason is legally mandatory to override access.');
      return;
    }
    setValidationError(null);
    try {
      await onSubmitOverride(patient.id, reason.trim());
      setReason('');
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Emergency override request failed.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-rose-600 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Urgent Header */}
        <div className="bg-rose-950/80 border-b border-rose-800/80 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-rose-600 text-white animate-pulse">
              <Siren className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-wide flex items-center space-x-2">
                <span>BREAK-GLASS EMERGENCY OVERRIDE</span>
              </h3>
              <p className="text-xs text-rose-200">
                Unblockable clinical override pursuant to emergency healthcare safety protocols
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-rose-300 hover:text-white p-1 rounded-lg hover:bg-rose-900/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Override Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Target Patient Info */}
          <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span>Target Patient:</span>
              <strong className="text-white text-sm">{patient.name}</strong>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Patient Ward:</span>
              <span className="font-mono px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                {patient.ward_name || `Ward ${patient.ward_id}`}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-300">
              <span>Your Active Shift Ward:</span>
              <span className="font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                {currentStaff?.current_ward_name || 'No Shift'}
              </span>
            </div>
          </div>

          {/* Audit Notice */}
          <div className="bg-amber-950/40 border border-amber-800/70 rounded-lg p-3 text-xs text-amber-200 flex items-start space-x-2.5">
            <FileWarning className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-amber-300 block mb-0.5">Mandatory Cryptographic Audit Trail</strong>
              Emergency access is <strong>unblockable</strong>, but your Staff ID, timestamp, patient ID, and stated reason will be hashed into the permanent tamper-evident audit ledger and flagged in compliance surveillance.
            </div>
          </div>

          {/* Reason Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-200 mb-1.5 flex justify-between">
              <span>Clinical Justification (Required)</span>
              <span className="text-[11px] text-slate-400">Must not be blank</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (validationError) setValidationError(null);
              }}
              placeholder="Detail the clinical emergency (e.g. Code Blue, immediate airway obstruction, stat cross-ward consult)..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Quick Presets */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">
              Quick Clinical Presets:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_REASONS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setReason(preset);
                    if (validationError) setValidationError(null);
                  }}
                  className="text-[11px] bg-slate-800/80 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded border border-slate-700/80 transition"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {validationError && (
            <div className="text-xs text-rose-300 bg-rose-950/60 border border-rose-800 p-2.5 rounded-lg flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              id="confirm-emergency-override-btn"
              type="submit"
              disabled={isLoading}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-lg shadow-rose-900/40 flex items-center space-x-2 transition"
            >
              <Siren className="w-4 h-4" />
              <span>{isLoading ? 'Hashing & Authorizing...' : 'Authorize Emergency Access'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
