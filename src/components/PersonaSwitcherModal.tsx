import React, { useState } from 'react';
import { X, Check, Lock, Shield, Stethoscope, HeartPulse, UserCheck, Key } from 'lucide-react';
import { StaffMember } from '../types';

interface PersonaSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffList: StaffMember[];
  currentStaffId: string | null;
  onSelectPersona: (staffId: string, password?: string) => Promise<void>;
  isLoading: boolean;
}

export const PersonaSwitcherModal: React.FC<PersonaSwitcherModalProps> = ({
  isOpen,
  onClose,
  staffList,
  currentStaffId,
  onSelectPersona,
  isLoading
}) => {
  const [customId, setCustomId] = useState('');
  const [customPassword, setCustomPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customId.trim()) {
      setError('Please enter a Staff ID');
      return;
    }
    setError(null);
    try {
      await onSelectPersona(customId.trim(), customPassword);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'doctor':
        return <Stethoscope className="w-4 h-4 text-blue-400" />;
      case 'nurse':
        return <HeartPulse className="w-4 h-4 text-emerald-400" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-purple-400" />;
      default:
        return <UserCheck className="w-4 h-4 text-amber-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Key className="w-4 h-4 text-cyan-400" />
              <span>Hospital Sign In</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Use your Staff ID and password to sign in to the hospital system.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Quick Notice */}
          <div className="bg-cyan-950/40 border border-cyan-800/60 rounded-lg p-3 text-xs text-cyan-200 flex items-start space-x-2">
            <span className="font-semibold text-cyan-400">Secure sign in:</span>
            <span>
              Enter your hospital Staff ID and password to authenticate. Access is still constrained by your active shift ward and role.
            </span>
          </div>

          {/* Pre-Seeded Personas Grid */}
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
              Pre-Configured Staff Personas
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {staffList.map((staff) => {
                const isSelected = staff.id === currentStaffId;
                return (
                  <button
                    key={staff.id}
                    id={`persona-${staff.id}`}
                    disabled={isLoading}
                    onClick={async () => {
                      setError(null);
                      try {
                        await onSelectPersona(staff.id, 'password123');
                        onClose();
                      } catch (err: any) {
                        setError(err.message || 'Login failed');
                      }
                    }}
                    className={`p-3 rounded-lg border text-left flex items-start justify-between transition-all ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500 ring-1 ring-cyan-500/50'
                        : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        {getRoleIcon(staff.role)}
                        <span className="text-sm font-semibold text-white">
                          {staff.name}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="capitalize px-1.5 py-0.5 rounded bg-slate-700/80 text-slate-300 text-[11px] font-mono">
                          {staff.role}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          Active: <strong className="text-cyan-300">{staff.current_ward_name || 'No Shift'}</strong>
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        ID: {staff.id}
                      </div>
                    </div>
                    {isSelected && (
                      <span className="bg-cyan-500 text-slate-950 p-1 rounded-full text-xs">
                        <Check className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Manual Login Form */}
          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Staff ID & Password Sign In
            </h4>
            <form onSubmit={handleCustomLogin} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Staff ID
                  </label>
                  <input
                    type="text"
                    value={customId}
                    onChange={(e) => setCustomId(e.target.value)}
                    placeholder="e.g. doc-meredith-grey"
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={customPassword}
                    onChange={(e) => setCustomPassword(e.target.value)}
                    placeholder="password123"
                    className="w-full bg-slate-800 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              </div>

              {error && (
                <p className="text-xs text-rose-400 bg-rose-950/40 border border-rose-800/60 p-2 rounded">
                  {error}
                </p>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2 rounded-md transition"
                >
                  {isLoading ? 'Authenticating...' : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
