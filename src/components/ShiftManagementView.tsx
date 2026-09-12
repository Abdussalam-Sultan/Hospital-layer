import React, { useState } from 'react';
import { 
  Clock, 
  UserCheck, 
  ArrowRight, 
  Building, 
  Shield, 
  CheckCircle2, 
  RefreshCw, 
  Stethoscope, 
  HeartPulse, 
  Users,
  AlertCircle
} from 'lucide-react';
import { StaffMember, Ward } from '../types';

interface ShiftManagementViewProps {
  staffList: StaffMember[];
  wards: Ward[];
  currentStaff: StaffMember | null;
  onReassignShift: (staffId: string, wardId: number) => Promise<void>;
  isLoading: boolean;
  onRefreshStaff: () => Promise<void>;
}

export const ShiftManagementView: React.FC<ShiftManagementViewProps> = ({
  staffList,
  wards,
  currentStaff,
  onReassignShift,
  isLoading,
  onRefreshStaff
}) => {
  const [selectedStaffId, setSelectedStaffId] = useState<string>(staffList[0]?.id || '');
  const [targetWardId, setTargetWardId] = useState<number>(wards[0]?.id || 1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStaffId) return;

    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await onReassignShift(selectedStaffId, targetWardId);
      const staffObj = staffList.find((s) => s.id === selectedStaffId);
      const wardObj = wards.find((w) => w.id === targetWardId);
      setSuccessMessage(`Successfully reassigned ${staffObj?.name || selectedStaffId} to ${wardObj?.name || `Ward ${targetWardId}`}. Shift updated immediately without token regeneration!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reassign shift');
    }
  };

  const handleQuickTransferTest = async () => {
    // Quick test: toggle Meredith Grey between Ward 1 and ICU
    const meredith = staffList.find((s) => s.id === 'doc-meredith-grey');
    if (!meredith) return;
    const nextWard = meredith.current_ward_id === 1 ? 4 : 1; // 1 = Ward 1, 4 = ICU
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await onReassignShift('doc-meredith-grey', nextWard);
      const wardName = nextWard === 1 ? 'Ward 1' : 'ICU';
      setSuccessMessage(`Automated Transfer: Dr. Meredith Grey moved to ${wardName}. Check Clinical Patients tab to see her accessible patient list update dynamically!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Transfer test failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Policy Explanation Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-2.5 bg-cyan-950 border border-cyan-800 rounded-lg text-cyan-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                <span>Dynamic Shift-Based Access Policy</span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-mono">
                  POST /admin/reassign-shift
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
                Hospital access permissions evaluate active shift records in SQLite (<code className="text-cyan-300 bg-slate-950 px-1 py-0.5 rounded">shifts.end_time IS NULL</code>) at the millisecond of every request. When staff are transferred, their access updates <strong>immediately</strong> without issuing a new JWT or signing out.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleQuickTransferTest}
              disabled={isLoading}
              className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm transition flex items-center space-x-2"
            >
              <ArrowRight className="w-4 h-4" />
              <span>1-Click Reassign Dr. Meredith Grey (Ward 1 ⇄ ICU)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Reassign Form & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Reassignment Control Box */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-cyan-400" />
            <span>Reassign Staff Ward</span>
          </h3>

          <form onSubmit={handleReassign} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Select Staff Member
              </label>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-hidden focus:border-cyan-500"
              >
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.name} ({staff.role}) — Currently in {staff.current_ward_name || 'None'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                New Assigned Ward
              </label>
              <select
                value={targetWardId}
                onChange={(e) => setTargetWardId(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-hidden focus:border-cyan-500"
              >
                {wards.map((ward) => (
                  <option key={ward.id} value={ward.id}>
                    {ward.name}
                  </option>
                ))}
              </select>
            </div>

            {successMessage && (
              <div className="bg-emerald-950/60 border border-emerald-800 p-3 rounded-lg text-xs text-emerald-200 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {errorMessage && (
              <div className="bg-rose-950/60 border border-rose-800 p-3 rounded-lg text-xs text-rose-200 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold py-2.5 px-4 rounded-lg shadow-sm transition flex items-center justify-center space-x-2"
            >
              <span>Execute Reassignment</span>
            </button>
          </form>
        </div>

        {/* Live Staff Shift Duty Roster */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Users className="w-4 h-4 text-cyan-400" />
              <span>Live Staff Shift Duty Roster ({staffList.length} Staff)</span>
            </h3>
            <button
              onClick={onRefreshStaff}
              className="text-xs text-slate-400 hover:text-slate-200 p-1 rounded flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px]">
                  <th className="py-2.5 px-3">Staff Name</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3">Default Ward</th>
                  <th className="py-2.5 px-3">Active Shift Ward</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {staffList.map((staff) => {
                  const isCurrent = currentStaff?.id === staff.id;
                  return (
                    <tr
                      key={staff.id}
                      className={`hover:bg-slate-800/40 transition ${
                        isCurrent ? 'bg-cyan-950/20' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-white flex items-center space-x-1.5">
                          <span>{staff.name}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-cyan-900/60 text-cyan-300 border border-cyan-700 px-1.5 py-0.2 rounded">
                              YOU
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {staff.id}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 capitalize font-mono text-[11px] text-slate-300">
                        {staff.role}
                      </td>
                      <td className="py-2.5 px-3 text-slate-400">
                        {staff.default_ward}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-cyan-300 font-mono text-[11px] border border-slate-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          <span>{staff.current_ward_name || 'No Shift'}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setSelectedStaffId(staff.id);
                            // Choose a different ward
                            const next = wards.find((w) => w.id !== staff.current_ward_id) || wards[0];
                            setTargetWardId(next.id);
                          }}
                          className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline"
                        >
                          Select for Move
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
