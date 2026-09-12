import React, { useState } from 'react';
import { 
  Terminal, 
  Play, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Check, 
  Clock, 
  ArrowRight, 
  Send, 
  Code, 
  FileText, 
  RefreshCw,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  ShieldAlert
} from 'lucide-react';
import { ApiCallRecord } from '../types';
import { request } from '../api';

interface ApiConsoleViewProps {
  apiHistory: ApiCallRecord[];
  staffToken: string | null;
  adminToken: string | null;
  onRunCompleteSuite: () => Promise<void>;
  isSuiteRunning: boolean;
  suiteSteps: Array<{
    title: string;
    description: string;
    status: 'pending' | 'running' | 'success' | 'failed';
    details?: string;
    endpoint?: string;
  }>;
}

const PRESET_ENDPOINTS = [
  {
    name: '1. Staff Login',
    method: 'POST',
    path: '/auth/login',
    body: { staffId: 'doc-meredith-grey', password: 'password123' },
    auth: 'none'
  },
  {
    name: '2. List Assigned Patients',
    method: 'GET',
    path: '/patients',
    auth: 'staff'
  },
  {
    name: '3. View Patient (Permitted: Ward 1)',
    method: 'GET',
    path: '/patients/pat-101',
    auth: 'staff'
  },
  {
    name: '4. View Patient (Cross-Ward 403: ICU)',
    method: 'GET',
    path: '/patients/pat-119',
    auth: 'staff'
  },
  {
    name: '5. Break-Glass Emergency Override',
    method: 'POST',
    path: '/patients/pat-119/emergency-access',
    body: { reason: 'Acute cardiac arrest requiring immediate cross-ward defibrillation' },
    auth: 'staff'
  },
  {
    name: '6. Admin Login',
    method: 'POST',
    path: '/auth/login',
    body: { staffId: 'admin-miranda-bailey', password: 'password123' },
    auth: 'none'
  },
  {
    name: '7. Fetch Audit Logs',
    method: 'GET',
    path: '/logs?limit=50',
    auth: 'admin'
  },
  {
    name: '8. Verify Hash Chain',
    method: 'GET',
    path: '/logs/verify',
    auth: 'admin'
  },
  {
    name: '9. Emergency Overrides Surveillance',
    method: 'GET',
    path: '/logs/overrides/summary',
    auth: 'admin'
  },
  {
    name: '10. Reassign Shift',
    method: 'POST',
    path: '/admin/reassign-shift',
    body: { staffId: 'doc-meredith-grey', wardId: 4 },
    auth: 'admin'
  },
  {
    name: '11. Snapshot Anchor Checkpoint',
    method: 'POST',
    path: '/admin/anchor-now',
    auth: 'admin'
  }
];

export const ApiConsoleView: React.FC<ApiConsoleViewProps> = ({
  apiHistory,
  staffToken,
  adminToken,
  onRunCompleteSuite,
  isSuiteRunning,
  suiteSteps
}) => {
  const [activeConsoleTab, setActiveConsoleTab] = useState<'suite' | 'sandbox' | 'traffic'>('suite');

  // Custom sandbox state
  const [selectedPreset, setSelectedPreset] = useState(PRESET_ENDPOINTS[0]);
  const [customMethod, setCustomMethod] = useState(PRESET_ENDPOINTS[0].method);
  const [customPath, setCustomPath] = useState(PRESET_ENDPOINTS[0].path);
  const [customBody, setCustomBody] = useState(
    PRESET_ENDPOINTS[0].body ? JSON.stringify(PRESET_ENDPOINTS[0].body, null, 2) : ''
  );
  const [authType, setAuthType] = useState<'none' | 'staff' | 'admin'>('none');
  const [sandboxResponse, setSandboxResponse] = useState<any>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  // Selected item in live traffic
  const [selectedTrafficItem, setSelectedTrafficItem] = useState<ApiCallRecord | null>(null);

  const handleSelectPreset = (preset: typeof PRESET_ENDPOINTS[0]) => {
    setSelectedPreset(preset);
    setCustomMethod(preset.method);
    setCustomPath(preset.path);
    setCustomBody(preset.body ? JSON.stringify(preset.body, null, 2) : '');
    setAuthType(preset.auth as any);
  };

  const handleExecuteSandbox = async () => {
    setSandboxLoading(true);
    setSandboxResponse(null);

    let token: string | null = null;
    if (authType === 'staff') token = staffToken;
    if (authType === 'admin') token = adminToken;

    let parsedBody: any = undefined;
    if (['POST', 'PUT', 'PATCH'].includes(customMethod) && customBody.trim()) {
      try {
        parsedBody = JSON.parse(customBody);
      } catch (e: any) {
        setSandboxResponse({ error: `Invalid JSON body: ${e.message}` });
        setSandboxLoading(false);
        return;
      }
    }

    const res = await request(customMethod, customPath, {
      token,
      body: parsedBody
    });

    setSandboxResponse(res);
    setSandboxLoading(false);
  };

  const currentCurl = () => {
    let token: string | null = null;
    if (authType === 'staff') token = staffToken;
    if (authType === 'admin') token = adminToken;

    let cmd = `curl -X ${customMethod} "${window.location.origin}${customPath}"`;
    cmd += ` \\\n  -H "Accept: application/json"`;
    if (token) {
      cmd += ` \\\n  -H "Authorization: Bearer ${token.substring(0, 16)}..."`;
    }
    if (customBody.trim() && ['POST', 'PUT', 'PATCH'].includes(customMethod)) {
      cmd += ` \\\n  -H "Content-Type: application/json"`;
      cmd += ` \\\n  -d '${customBody.replace(/\n/g, '')}'`;
    }
    return cmd;
  };

  return (
    <div className="space-y-6">
      {/* Console Sub-Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex space-x-2">
          <button
            id="tab-suite-runner"
            onClick={() => setActiveConsoleTab('suite')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeConsoleTab === 'suite'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Automated End-to-End Test Suite</span>
          </button>

          <button
            id="tab-sandbox"
            onClick={() => setActiveConsoleTab('sandbox')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeConsoleTab === 'sandbox'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Endpoint Sandbox & Curl Lab</span>
          </button>

          <button
            id="tab-traffic"
            onClick={() => setActiveConsoleTab('traffic')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeConsoleTab === 'traffic'
                ? 'bg-cyan-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Live Traffic Inspector ({apiHistory.length})</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>REST API Ready at <code className="text-cyan-300 font-mono">http://localhost:3000</code></span>
        </div>
      </div>

      {/* TAB 1: AUTOMATED 9-STEP TEST RUNNER */}
      {activeConsoleTab === 'suite' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Play className="w-4 h-4 text-cyan-400" />
                  <span>Full-Cycle API Compliance & Verification Suite</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                  Executes all requirements sequentially against the live backend: Authentication, Shift scoping, Cross-ward 403 rejection, Break-glass emergency override, Cryptographic hash verification, Anchor snapshot, and Dynamic shift reassignments.
                </p>
              </div>

              <button
                id="run-full-suite-btn"
                onClick={onRunCompleteSuite}
                disabled={isSuiteRunning}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-lg shadow-lg shadow-emerald-950 flex items-center space-x-2 transition shrink-0"
              >
                <Play className={`w-4 h-4 ${isSuiteRunning ? 'animate-spin' : ''}`} />
                <span>{isSuiteRunning ? 'Running Test Sequence...' : 'Execute 9-Step Verification Suite'}</span>
              </button>
            </div>
          </div>

          {/* Test Steps List */}
          <div className="space-y-3">
            {suiteSteps.map((step, idx) => {
              return (
                <div
                  key={idx}
                  className={`bg-slate-900 border rounded-xl p-4 transition-all ${
                    step.status === 'running'
                      ? 'border-cyan-500 bg-cyan-950/20 ring-1 ring-cyan-500/50'
                      : step.status === 'success'
                      ? 'border-emerald-800/80 bg-slate-900'
                      : step.status === 'failed'
                      ? 'border-rose-700 bg-rose-950/30'
                      : 'border-slate-800 opacity-80'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5">
                        {step.status === 'running' && (
                          <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                        )}
                        {step.status === 'success' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        )}
                        {step.status === 'failed' && (
                          <XCircle className="w-4 h-4 text-rose-400" />
                        )}
                        {step.status === 'pending' && (
                          <div className="w-4 h-4 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                            {idx + 1}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white">
                            {step.title}
                          </span>
                          {step.endpoint && (
                            <code className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-slate-950 text-cyan-300 border border-slate-800">
                              {step.endpoint}
                            </code>
                          )}
                        </div>
                        <p className="text-xs text-slate-400">
                          {step.description}
                        </p>
                        {step.details && (
                          <div className="mt-2 text-[11px] font-mono p-2 bg-slate-950 border border-slate-800 rounded text-slate-300 whitespace-pre-wrap">
                            {step.details}
                          </div>
                        )}
                      </div>
                    </div>

                    <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded border ${
                      step.status === 'success'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                        : step.status === 'failed'
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : step.status === 'running'
                        ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}>
                      {step.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ENDPOINT SANDBOX & CURL LAB */}
      {activeConsoleTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preset Endpoints Selector */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Hospital API Endpoints
            </h4>
            <div className="space-y-1 max-h-[600px] overflow-y-auto pr-1">
              {PRESET_ENDPOINTS.map((preset, idx) => {
                const isSelected = selectedPreset.name === preset.name;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500 text-white'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <div className="font-semibold text-slate-200 truncate">
                      {preset.name}
                    </div>
                    <div className="flex items-center space-x-1.5 mt-1 font-mono text-[10px]">
                      <span className={`px-1 py-0.2 rounded font-bold ${
                        preset.method === 'GET' ? 'bg-blue-950 text-blue-400' : 'bg-emerald-950 text-emerald-400'
                      }`}>
                        {preset.method}
                      </span>
                      <span className="text-slate-400 truncate">{preset.path}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Request Form & Response Viewer */}
          <div className="lg:col-span-2 space-y-4">
            {/* Request Builder */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center space-x-2">
                <select
                  value={customMethod}
                  onChange={(e) => setCustomMethod(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono font-bold text-cyan-400 focus:outline-hidden"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                  <option value="PUT">PUT</option>
                  <option value="DELETE">DELETE</option>
                </select>

                <input
                  type="text"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  placeholder="/patients"
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-hidden focus:border-cyan-500"
                />

                <button
                  id="send-request-btn"
                  onClick={handleExecuteSandbox}
                  disabled={sandboxLoading}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-4 py-2 rounded-lg flex items-center space-x-1.5 shadow-sm transition shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sandboxLoading ? 'Sending...' : 'Send'}</span>
                </button>
              </div>

              {/* Auth Header Selector */}
              <div className="flex items-center space-x-3 text-xs bg-slate-950 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-400 font-semibold">Auth Header:</span>
                <label className="flex items-center space-x-1 text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="auth"
                    checked={authType === 'none'}
                    onChange={() => setAuthType('none')}
                  />
                  <span>None</span>
                </label>
                <label className="flex items-center space-x-1 text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="auth"
                    checked={authType === 'staff'}
                    onChange={() => setAuthType('staff')}
                  />
                  <span>Bearer Staff Token</span>
                </label>
                <label className="flex items-center space-x-1 text-slate-300 cursor-pointer">
                  <input
                    type="radio"
                    name="auth"
                    checked={authType === 'admin'}
                    onChange={() => setAuthType('admin')}
                  />
                  <span>Bearer Admin Token</span>
                </label>
              </div>

              {/* Request Body (if POST/PUT) */}
              {['POST', 'PUT', 'PATCH'].includes(customMethod) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">
                    Request Body (JSON)
                  </label>
                  <textarea
                    rows={4}
                    value={customBody}
                    onChange={(e) => setCustomBody(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs font-mono text-cyan-200 focus:outline-hidden focus:border-cyan-500"
                  />
                </div>
              )}

              {/* Copyable curl snippet */}
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 relative">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                    Terminal curl command
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(currentCurl());
                      setCopiedCurl(true);
                      setTimeout(() => setCopiedCurl(false), 2000);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                  >
                    {copiedCurl ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCurl ? 'Copied!' : 'Copy curl'}</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre">
                  {currentCurl()}
                </pre>
              </div>
            </div>

            {/* Response Viewer */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Live Response
                </h4>
                {sandboxResponse && (
                  <div className="flex items-center space-x-2 font-mono text-xs">
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      sandboxResponse.ok
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-rose-950 text-rose-300 border border-rose-800'
                    }`}>
                      HTTP {sandboxResponse.status}
                    </span>
                  </div>
                )}
              </div>

              {sandboxResponse ? (
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 max-h-96 overflow-y-auto">
                  <pre className="text-xs font-mono text-slate-200">
                    {JSON.stringify(sandboxResponse.data, null, 2)}
                  </pre>
                </div>
              ) : (
                <div className="py-10 text-center text-slate-500 text-xs italic">
                  Press "Send" above to execute the request and view response payloads.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LIVE TRAFFIC INSPECTOR */}
      {activeConsoleTab === 'traffic' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Network Activity Stream ({apiHistory.length} Calls)
              </h3>
              <span className="text-[11px] text-slate-500">Real-time HTTP requests</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Method</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Endpoint Path</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                  {apiHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                        No API traffic captured yet.
                      </td>
                    </tr>
                  ) : (
                    apiHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                            item.method === 'GET' ? 'bg-blue-950 text-blue-300' : 'bg-emerald-950 text-emerald-300'
                          }`}>
                            {item.method}
                          </span>
                        </td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                            item.status >= 200 && item.status < 300
                              ? 'text-emerald-400'
                              : item.status === 403
                              ? 'text-amber-400 font-bold'
                              : 'text-rose-400'
                          }`}>
                            {item.status || 'ERR'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-200 truncate max-w-xs">
                          {item.url}
                        </td>
                        <td className="py-2 px-3 text-slate-400">
                          {item.durationMs}ms
                        </td>
                        <td className="py-2 px-3 text-slate-500">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2 px-3 text-right">
                          <button
                            onClick={() => setSelectedTrafficItem(item)}
                            className="text-cyan-400 hover:text-cyan-300 font-sans text-xs underline"
                          >
                            Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Traffic Item Modal */}
          {selectedTrafficItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
              <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-4 text-xs">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-cyan-400">
                      {selectedTrafficItem.method} {selectedTrafficItem.url}
                    </span>
                    <span className="font-mono text-emerald-400">
                      HTTP {selectedTrafficItem.status}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedTrafficItem(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">curl Snippet:</span>
                    <pre className="p-2.5 bg-slate-950 border border-slate-800 rounded font-mono text-[10px] text-slate-300 overflow-x-auto whitespace-pre">
                      {selectedTrafficItem.curl}
                    </pre>
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block mb-1">Response JSON:</span>
                    <pre className="p-2.5 bg-slate-950 border border-slate-800 rounded font-mono text-[10px] text-slate-200 overflow-x-auto">
                      {JSON.stringify(selectedTrafficItem.responseBody, null, 2)}
                    </pre>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedTrafficItem(null)}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs px-4 py-2 rounded-lg"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
