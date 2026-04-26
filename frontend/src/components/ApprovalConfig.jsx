import React, { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, ChevronDown, ListOrdered, Search, Workflow, AlertCircle, ShieldCheck, Undo2, Ban, Send, RotateCcw, XCircle } from "lucide-react";
import api from "../utils/api";

// Default permissions for a step based on its position
const defaultPermsForPosition = (isOnly, isLast) => {
  if (isOnly) return { approve: false, issue: true, reject: true, revert: true, recall_after_issue: true, cancel_after_issue: true };
  if (isLast) return { approve: false, issue: true, reject: true, revert: true, recall_after_issue: true, cancel_after_issue: true };
  return     { approve: true,  issue: false, reject: true, revert: true, recall_after_issue: false, cancel_after_issue: false };
};

const ACTION_DEFS = [
  { key: "approve", label: "Approve",  desc: "Forward to next stage", icon: CheckCircle2, color: "indigo"  },
  { key: "issue",   label: "Issue",    desc: "Final issue & assign number", icon: Send, color: "emerald" },
  { key: "reject",  label: "Reject",   desc: "Terminate the flow", icon: XCircle, color: "rose"    },
  { key: "revert",  label: "Revert",   desc: "Send back to requestor (Draft)", icon: Undo2, color: "amber"   },
];

const POST_ISSUE_DEFS = [
  { key: "recall_after_issue", label: "Recall after Issue", desc: "Pull issued order back to Draft", icon: RotateCcw, color: "purple" },
  { key: "cancel_after_issue", label: "Cancel after Issue", desc: "Mark issued order as Cancelled", icon: Ban,       color: "slate"  },
];

export default function ApprovalConfig({ showToast }) {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [points, setPoints] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState(false);
  const [isPointDropdownOpen, setIsPointDropdownOpen] = useState(false);
  const [flowName, setFlowName] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(false);

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchModules();
  }, []);

  useEffect(() => {
    if (selectedModule) fetchPoints(selectedModule.module_key);
  }, [selectedModule]);

  useEffect(() => {
    if (selectedPoint) fetchConfig(selectedPoint.point_key);
  }, [selectedPoint]);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/api/users");
      setUsers(data.users || []);
    } catch {
      showToast("Failed to load team members", "error");
    }
  };

  const fetchModules = async () => {
    try {
      const { data } = await api.get("/api/approvals/modules");
      setModules(data.modules || []);
      if (data.modules?.length > 0) setSelectedModule(data.modules[0]);
    } catch {
      showToast("Failed to load modules", "error");
    }
  };

  const fetchPoints = async (mKey) => {
    try {
      const { data } = await api.get(`/api/approvals/points/${mKey}`);
      setPoints(data.points || []);
      if (data.points?.length > 0) setSelectedPoint(data.points[0]);
      else { setSelectedPoint(null); setSteps([]); setFlowName(""); }
    } catch {
      showToast("Failed to load trigger points", "error");
    }
  };

  const fetchConfig = async (point_key) => {
    setLoading(true);
    setSearch("");
    try {
      const { data } = await api.get(`/api/approvals/workflows/${point_key}`);
      if (data.workflow) {
        setIsActive(data.workflow.is_active);
        setFlowName(data.workflow.flow_name || "");
        setSteps(data.workflow.steps || []);
      } else {
        setIsActive(true);
        setFlowName("");
        setSteps([]);
      }
    } catch {
      showToast("Failed to load workflow configuration", "error");
    }
    setLoading(false);
  };

  const reapplyDefaults = (arr) => {
    return arr.map((s, idx) => {
      const isOnly = arr.length === 1;
      const isLast = idx === arr.length - 1;
      // Only re-apply defaults if no permissions saved yet (new user)
      if (!s._userOverride) {
        return { ...s, permissions: defaultPermsForPosition(isOnly, isLast) };
      }
      return s;
    });
  };

  const addStep = (user) => {
    if (steps.some(s => s.approver_id === user.id)) {
      return showToast("User is already in the workflow", "error");
    }
    const next = [
      ...steps,
      {
        approver_id: user.id,
        approver_name: user.name,
        approver_designation: user.designation || "Approver",
        permissions: {},
        _userOverride: false,
      }
    ];
    setSteps(reapplyDefaults(next));
    setSearch("");
  };

  const removeStep = (index) => {
    const next = steps.filter((_, i) => i !== index);
    setSteps(reapplyDefaults(next));
  };

  const togglePerm = (index, key) => {
    const next = [...steps];
    const cur = next[index].permissions || {};
    next[index] = {
      ...next[index],
      permissions: { ...cur, [key]: !cur[key] },
      _userOverride: true,
    };
    setSteps(next);
  };

  const validate = () => {
    if (steps.length === 0) return "Add at least one approver to the workflow.";
    // Each step must have at least one forward action
    for (let i = 0; i < steps.length; i++) {
      const p = steps[i].permissions || {};
      if (!p.approve && !p.issue) {
        return `Stage ${i + 1} (${steps[i].approver_name}) must have either Approve or Issue allowed — otherwise the flow cannot move forward.`;
      }
    }
    // Last step must have issue
    const last = steps[steps.length - 1];
    if (!last.permissions?.issue) {
      return `Final stage (${last.approver_name}) must have Issue enabled — otherwise the order can never be issued.`;
    }
    return null;
  };

  const saveConfig = async () => {
    if (!selectedPoint) return showToast("Select a trigger point first", "warning");
    const err = validate();
    if (err) return showToast(err, "error");

    setLoading(true);
    try {
      const cleanSteps = steps.map(s => ({
        approver_id: s.approver_id,
        approver_name: s.approver_name,
        approver_designation: s.approver_designation,
        permissions: s.permissions || {},
      }));
      await api.post("/api/approvals/workflows", {
        module_key: selectedModule.module_key,
        point_key: selectedPoint.point_key,
        module_name: selectedModule.module_name,
        flow_name: flowName,
        is_active: isActive,
        steps: cleanSteps,
      });
      showToast("Approval workflow saved successfully");
    } catch {
      showToast("Failed to save workflow", "error");
    }
    setLoading(false);
  };

  const filteredUsers = search.trim() === ""
    ? users.slice(0, 10)
    : users.filter(u =>
        (u.name && u.name.toLowerCase().includes(search.toLowerCase())) ||
        (u.designation && u.designation.toLowerCase().includes(search.toLowerCase()))
      ).slice(0, 10);

  const validationError = validate();
  const flowMode = steps.length === 0 ? "empty" : steps.length === 1 ? "direct" : "multi";

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">

      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 px-8 py-6 flex justify-between items-center text-white rounded-t-[22px] relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
          <div className="flex items-center gap-4 relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-xl shadow-indigo-900/40">
              <Workflow size={26} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Approval Engine</h1>
              <p className="text-slate-300 text-xs mt-1 font-medium">Per-stage permissions · Direct or Multi-stage · Post-issue controls</p>
            </div>
          </div>
          <button
            onClick={saveConfig}
            disabled={loading || !!validationError}
            className="px-7 py-3 bg-gradient-to-br from-indigo-500 to-blue-600 hover:from-indigo-400 hover:to-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-xl shadow-indigo-950/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 relative"
            title={validationError || "Save workflow"}
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <CheckCircle2 size={18} />}
            Save Workflow
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Module */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Target Module</label>
            <div className="relative">
              <div onClick={() => setIsModuleDropdownOpen(!isModuleDropdownOpen)}
                className="w-full h-11 border border-slate-200 rounded-xl px-4 flex items-center justify-between bg-white shadow-sm hover:border-blue-400 transition-all cursor-pointer">
                <span className="font-bold text-slate-700 text-sm truncate">{selectedModule?.module_name || "Select Module"}</span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isModuleDropdownOpen ? "rotate-180" : ""}`} />
              </div>
              {isModuleDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsModuleDropdownOpen(false)}></div>
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {modules.map(m => (
                      <div key={m.module_key}
                        onClick={() => { setSelectedModule(m); setIsModuleDropdownOpen(false); }}
                        className={`px-4 py-3 hover:bg-blue-50 text-sm font-medium cursor-pointer flex items-center justify-between
                          ${selectedModule?.module_key === m.module_key ? "bg-blue-50 text-blue-600" : "text-slate-600"}`}>
                        {m.module_name}
                        {selectedModule?.module_key === m.module_key && <CheckCircle2 size={14} />}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Trigger Point */}
          <div className="lg:col-span-4 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Trigger Point</label>
            <div className="relative">
              <div onClick={() => setIsPointDropdownOpen(!isPointDropdownOpen)}
                className="w-full h-11 border border-slate-200 rounded-xl px-4 flex items-center justify-between bg-white shadow-sm hover:border-blue-400 transition-all cursor-pointer">
                <div className="flex flex-col overflow-hidden">
                  <span className="font-bold text-blue-600 text-sm truncate">{selectedPoint?.point_label || "No trigger points"}</span>
                  {selectedPoint?.description && <span className="text-[9px] text-slate-400 truncate">{selectedPoint.description}</span>}
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isPointDropdownOpen ? "rotate-180" : ""}`} />
              </div>
              {isPointDropdownOpen && points.length > 0 && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsPointDropdownOpen(false)}></div>
                  <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden">
                    {points.map(p => (
                      <div key={p.point_key}
                        onClick={() => { setSelectedPoint(p); setIsPointDropdownOpen(false); }}
                        className={`px-4 py-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0
                          ${selectedPoint?.point_key === p.point_key ? "bg-blue-50/50" : ""}`}>
                        <p className={`font-bold text-sm ${selectedPoint?.point_key === p.point_key ? "text-blue-600" : "text-slate-700"}`}>{p.point_label}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{p.description}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Flow Name */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Flow Name</label>
            <input type="text" value={flowName} onChange={e => setFlowName(e.target.value)}
              placeholder="e.g. Standard PO Workflow"
              className="w-full h-11 border border-slate-200 rounded-xl px-4 text-sm font-medium focus:border-blue-500 outline-none bg-white shadow-sm" />
          </div>

          {/* Active toggle */}
          <div className="lg:col-span-2 space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</label>
            <div onClick={() => setIsActive(!isActive)}
              className={`w-full h-11 rounded-xl px-4 flex items-center justify-between cursor-pointer transition-all border
                ${isActive ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 text-slate-400"}`}>
              <span className="text-xs font-bold uppercase tracking-tighter">{isActive ? "Active" : "Off"}</span>
              <div className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-emerald-500 animate-pulse" : "bg-slate-300"}`}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Flow Mode Banner */}
      <div className={`rounded-2xl px-6 py-4 border flex items-center gap-4
        ${flowMode === "empty" ? "bg-slate-50 border-slate-200 text-slate-500" :
          flowMode === "direct" ? "bg-sky-50 border-sky-200 text-sky-800" :
          "bg-indigo-50 border-indigo-200 text-indigo-800"}`}>
        <ShieldCheck size={20} className="shrink-0" />
        <div className="flex-1">
          <p className="font-bold text-sm">
            {flowMode === "empty"  && "No approvers added yet"}
            {flowMode === "direct" && "Direct Flow (1 approver)"}
            {flowMode === "multi"  && `Multi-Stage Flow (${steps.length} approvers, sequential)`}
          </p>
          <p className="text-[11px] mt-0.5 opacity-80">
            {flowMode === "empty"  && "Add an approver from the right panel to start. 1 user = direct, 2+ users = multi-stage sequential."}
            {flowMode === "direct" && "The single approver can directly issue the order — no forwarding needed."}
            {flowMode === "multi"  && "Order moves through approvers in sequence. Final stage issues the order. Intermediate stages forward via Approve."}
          </p>
        </div>
      </div>

      {/* Validation banner */}
      {validationError && steps.length > 0 && (
        <div className="rounded-2xl px-6 py-3 border bg-rose-50 border-rose-200 text-rose-700 flex items-start gap-3">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-xs uppercase tracking-wider">Configuration Issue</p>
            <p className="text-xs mt-0.5">{validationError}</p>
          </div>
        </div>
      )}

      {/* Builder grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Steps */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-6 min-h-[500px]">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-800">Approval Stages</h2>
            <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[11px] font-bold">
              {steps.length} {steps.length === 1 ? "Stage" : "Stages"}
            </span>
          </div>

          <div className="space-y-4">
            {steps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
                <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
                  <ListOrdered size={28} />
                </div>
                <p className="font-bold text-sm">No stages added yet</p>
                <p className="text-[11px] mt-1">Pick approvers from the right panel →</p>
              </div>
            ) : steps.map((s, idx) => {
              const isOnly = steps.length === 1;
              const isLast = idx === steps.length - 1;
              const stageLabel = isOnly ? "SOLE APPROVER" : isLast ? "FINAL STAGE" : `STAGE ${idx + 1}`;
              const perms = s.permissions || {};

              return (
                <div key={`${s.approver_id}-${idx}`} className="flex gap-3 group">
                  {/* Number */}
                  <div className="flex flex-col items-center gap-1.5 pt-2">
                    <div className={`w-9 h-9 rounded-xl text-white font-bold flex items-center justify-center text-sm shadow-md z-10
                      ${isLast ? "bg-emerald-600 shadow-emerald-200" : "bg-blue-600 shadow-blue-200"}`}>
                      {idx + 1}
                    </div>
                    {!isLast && <div className="w-0.5 flex-1 bg-slate-200 my-1"></div>}
                  </div>

                  <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 hover:border-blue-200 transition-all space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-800 text-sm">{s.approver_name}</p>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider
                            ${isOnly ? "bg-sky-100 text-sky-700" : isLast ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"}`}>
                            {stageLabel}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-slate-500 mt-0.5">{s.approver_designation}</p>
                      </div>
                      <button onClick={() => removeStep(idx)}
                        className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        title="Remove">
                        <Trash2 size={16} />
                      </button>
                    </div>

                    {/* Pre-issue actions */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">During Approval Flow</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {ACTION_DEFS.map(({ key, label, desc, icon: Icon, color }) => {
                          const on = !!perms[key];
                          return (
                            <button key={key} onClick={() => togglePerm(idx, key)}
                              className={`text-left px-3 py-2 rounded-lg border text-[11px] transition-all
                                ${on
                                  ? `bg-${color}-50 border-${color}-200 text-${color}-800`
                                  : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"}`}
                              style={{ background: on ? undefined : undefined }}>
                              <div className="flex items-center gap-2">
                                <input type="checkbox" checked={on} readOnly
                                  className="w-3 h-3 accent-blue-600 pointer-events-none" />
                                <Icon size={13} className={on ? "" : "opacity-40"} />
                                <span className="font-bold">{label}</span>
                              </div>
                              <p className={`text-[9px] mt-0.5 ml-5 ${on ? "opacity-80" : "opacity-50"}`}>{desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Post-issue actions */}
                    <div className="pt-3 border-t border-slate-100">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Post-Issue Powers</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {POST_ISSUE_DEFS.map(({ key, label, desc, icon: Icon, color }) => {
                          const on = !!perms[key];
                          return (
                            <button key={key} onClick={() => togglePerm(idx, key)}
                              className={`text-left px-3 py-2 rounded-lg border text-[11px] transition-all
                                ${on
                                  ? `bg-${color}-50 border-${color}-200 text-${color}-800`
                                  : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"}`}>
                              <div className="flex items-center gap-2">
                                <input type="checkbox" checked={on} readOnly
                                  className="w-3 h-3 accent-purple-600 pointer-events-none" />
                                <Icon size={13} className={on ? "" : "opacity-40"} />
                                <span className="font-bold">{label}</span>
                              </div>
                              <p className={`text-[9px] mt-0.5 ml-5 ${on ? "opacity-80" : "opacity-50"}`}>{desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column: User picker + Note */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-800 mb-4">Add Approver</h2>
            <div className="relative mb-4">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search name, designation..." value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-11 border border-slate-200 rounded-xl pl-10 pr-4 text-sm focus:border-blue-500 outline-none bg-slate-50/50 hover:bg-white transition-all" />
            </div>
            <div className="space-y-1.5 max-h-[480px] overflow-y-auto pr-1">
              {filteredUsers.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">No users found</div>
              ) : filteredUsers.map(u => {
                const already = steps.some(s => String(s.approver_id) === String(u.id));
                return (
                  <div key={u.id} className={`p-3 rounded-xl border flex justify-between items-center transition-all
                    ${already ? "bg-slate-50 border-slate-100 opacity-60" : "bg-white border-slate-100 hover:bg-blue-50 hover:border-blue-100"}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
                        {u.name?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-xs">{u.name || "Unknown"}</p>
                        <p className="text-[10px] text-slate-400">{u.designation || "Staff"} · {u.department || "General"}</p>
                      </div>
                    </div>
                    <button onClick={() => addStep(u)} disabled={already}
                      className="w-9 h-9 rounded-lg bg-white border border-slate-200 text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed">
                      <Plus size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white">
            <h3 className="font-bold mb-3 flex items-center gap-2 text-sm">
              <ShieldCheck size={16} className="text-blue-400" /> How this flow works
            </h3>
            <ul className="text-[11px] text-slate-300 leading-relaxed space-y-2 list-disc list-inside">
              <li><b>Approve</b> — moves the order to the next stage. Last stage doesn't need this.</li>
              <li><b>Issue</b> — finalises the order, assigns the order number. Required on the last stage.</li>
              <li><b>Reject / Revert</b> — terminates flow / sends back to Draft. Available on any stage.</li>
              <li><b>Recall / Cancel after Issue</b> — controls who can pull back or cancel an already issued order.</li>
              <li>Global admins can always override every action.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
