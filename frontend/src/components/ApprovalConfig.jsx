import React, { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle2, ChevronDown, ListOrdered, Search } from "lucide-react";
import api from "../utils/api";

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

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/api/users");
      setUsers(data.users || []);
    } catch {
      showToast("Failed to load team members", "error");
    }
  };

  useEffect(() => {
    if (selectedModule) {
      fetchPoints(selectedModule.module_key);
    }
  }, [selectedModule]);

  useEffect(() => {
    if (selectedPoint) {
      fetchConfig(selectedPoint.point_key);
    }
  }, [selectedPoint]);

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
      else {
        setSelectedPoint(null);
        setSteps([]);
        setFlowName("");
      }
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

  const addStep = (user) => {
    if (steps.some(s => s.approver_id === user.id)) {
      return showToast("User is already in the workflow", "error");
    }
    setSteps([...steps, { 
       approver_id: user.id, 
       approver_name: user.name, 
       approver_designation: user.designation || 'Approver',
       permissions: { approve: true, issue: true, reject: true, revert: true, recall: true }
    }]);
    setSearch("");
  };

  const updateStepPermission = (index, key, val) => {
    const newSteps = [...steps];
    newSteps[index].permissions = { ...newSteps[index].permissions, [key]: val };
    setSteps(newSteps);
  };

  const removeStep = (index) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const saveConfig = async () => {
    if (!selectedPoint) return showToast("Select a trigger point first", "warning");
    setLoading(true);
    try {
      await api.post("/api/approvals/workflows", {
        module_key: selectedModule.module_key,
        point_key: selectedPoint.point_key,
        module_name: selectedModule.module_name,
        flow_name: flowName,
        is_active: isActive,
        steps
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

  return (
    <div className="max-w-[1400px] mx-auto space-y-8">
      {/* ── 1. Header & Global Settings ── */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm">
    <div className="bg-slate-900 px-8 py-6 flex justify-between items-center text-white rounded-t-[22px]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
              <ListOrdered size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Approval Engine</h1>
              <p className="text-slate-400 text-xs mt-0.5">Configure multi-step conditional rules for system modules</p>
            </div>
          </div>
          <button 
            onClick={saveConfig} 
            disabled={loading}
            className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center gap-2 h-max"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <CheckCircle2 size={18} />}
            Save Workflow
          </button>
        </div>
        
        <div className="p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 items-start">
          {/* Module Selection */}
          <div className="sm:col-span-1 lg:col-span-3 space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Target Application Tab</label>
             <div className="relative">
                <div 
                  onClick={() => setIsModuleDropdownOpen(!isModuleDropdownOpen)}
                  className="w-full h-12 border border-slate-200 rounded-2xl px-5 flex items-center justify-between bg-white shadow-sm ring-1 ring-slate-100 hover:ring-blue-400 transition-all cursor-pointer group"
                >
                  <span className="font-bold text-slate-700 text-[13px] whitespace-nowrap overflow-hidden text-ellipsis">{selectedModule?.module_name || 'Select Tab'}</span>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isModuleDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                
                {isModuleDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsModuleDropdownOpen(false)}></div>
                    <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                      {modules.map(m => (
                        <div 
                          key={m.module_key} 
                          onClick={() => { setSelectedModule(m); setIsModuleDropdownOpen(false); }}
                          className={`px-5 py-4 hover:bg-blue-50 text-sm font-medium transition-colors cursor-pointer flex items-center justify-between
                            ${selectedModule?.module_key === m.module_key ? 'bg-blue-50 text-blue-600' : 'text-slate-600'}`}
                        >
                          {m.module_name}
                          {selectedModule?.module_key === m.module_key && <CheckCircle2 size={14} />}
                        </div>
                      ))}
                    </div>
                  </>
                )}
             </div>
          </div>

          {/* Trigger Point Selection */}
          <div className="sm:col-span-1 lg:col-span-4 space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Available Approval Trigger</label>
             <div className="relative">
                <div 
                  onClick={() => setIsPointDropdownOpen(!isPointDropdownOpen)}
                  className="w-full h-12 border border-slate-200 rounded-2xl px-5 flex items-center justify-between bg-white shadow-sm ring-1 ring-slate-200 hover:ring-blue-400 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col overflow-hidden">
                    <span className="font-bold text-blue-600 text-[13px] whitespace-nowrap overflow-hidden text-ellipsis">{selectedPoint?.point_label || 'No hooks defined'}</span>
                    {selectedPoint?.description && <span className="text-[9px] text-slate-400 italic">Context: {selectedPoint.description}</span>}
                  </div>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform duration-300 ${isPointDropdownOpen ? 'rotate-180' : ''}`} />
                </div>
                
                {isPointDropdownOpen && points.length > 0 && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsPointDropdownOpen(false)}></div>
                    <div className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-200 rounded-3xl shadow-2xl z-20 overflow-hidden border-t-4 border-t-blue-500 animate-in fade-in slide-in-from-top-2 duration-200">
                      {points.map(p => (
                        <div 
                          key={p.point_key} 
                          onClick={() => { setSelectedPoint(p); setIsPointDropdownOpen(false); }}
                          className={`px-5 py-4 hover:bg-slate-50 transition-colors cursor-pointer group border-b border-slate-50 last:border-0
                            ${selectedPoint?.point_key === p.point_key ? 'bg-blue-50/50' : ''}`}
                        >
                          <p className={`font-bold text-sm ${selectedPoint?.point_key === p.point_key ? 'text-blue-600' : 'text-slate-700'}`}>{p.point_label}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1 group-hover:line-clamp-none">{p.description}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
             </div>
          </div>

          {/* Flow Name */}
          <div className="md:col-span-3 space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1">Flow Identity</label>
            <input 
              type="text" 
              value={flowName}
              onChange={e => setFlowName(e.target.value)}
              placeholder="e.g. Standard Workflow"
              className="w-full h-12 border border-slate-200 rounded-2xl px-5 text-sm font-medium focus:border-blue-500 outline-none bg-white shadow-sm ring-1 ring-slate-100 hover:ring-blue-400 transition-all overflow-hidden text-ellipsis"
            />
          </div>

          {/* Active Switch */}
          <div className="sm:col-span-1 lg:col-span-2 space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest pl-1 text-right block pr-1">Status</label>
            <div 
              onClick={() => setIsActive(!isActive)}
              className={`w-full h-12 rounded-2xl px-4 flex items-center justify-between cursor-pointer transition-all border
                ${isActive ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
            >
              <span className="text-xs font-bold uppercase tracking-tighter">{isActive ? 'Ready' : 'Off'}</span>
              <div className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. The Step Builder ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Configured Steps */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 shadow-sm p-8 min-h-[500px]">
           <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
             <h2 className="text-lg font-bold text-slate-800">Sequential Approval Steps</h2>
             <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-xs font-bold">{steps.length} Steps Active</span>
           </div>
           
           <div className="space-y-6 relative">
             {steps.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-20 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/30">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-300">
                    <ListOrdered size={32} />
                  </div>
                  <p className="font-medium">No approval nodes added yet.</p>
                  <p className="text-xs mt-1">Search and select team members from the right panel.</p>
               </div>
             ) : steps.map((s, idx) => (
               <div key={idx} className="flex gap-4 group">
                  {/* Connector Line */}
                  <div className="flex flex-col items-center gap-2 pt-2">
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-lg shadow-blue-200 z-10">
                      {idx + 1}
                    </div>
                    {idx !== steps.length - 1 && <div className="w-1 flex-1 bg-slate-100 rounded-full my-2"></div>}
                  </div>
                  
                  <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-blue-200 transition-all space-y-4">
                     <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-slate-800 text-base">{s.approver_name}</p>
                          <p className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block mt-1">{s.approver_designation}</p>
                        </div>
                        <button 
                          onClick={() => removeStep(idx)}
                          className="p-2 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          title="Remove Step"
                        >
                          <Trash2 size={20} />
                        </button>
                     </div>

                     <div className="pt-4 border-t border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Allowed Actions for this step</p>
                        <div className="flex flex-wrap gap-2">
                           {['approve', 'issue', 'reject', 'revert', 'recall'].map(perm => (
                              <button 
                                key={perm} 
                                onClick={() => updateStepPermission(idx, perm, !(s.permissions?.[perm] ?? true))}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-2
                                  ${(s.permissions?.[perm] ?? true) 
                                    ? 'bg-blue-50 border-blue-200 text-blue-700' 
                                    : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'}`}
                              >
                                 <div className={`w-3 h-3 rounded-full border-2 ${ (s.permissions?.[perm] ?? true) ? 'bg-blue-600 border-white' : 'border-slate-300' }`}></div>
                                 <span className="capitalize">{perm}</span>
                              </button>
                           ))}
                        </div>
                     </div>
                  </div>
               </div>
             ))}
           </div>
        </div>

        {/* Right Column: User Selection Panel */}
        <div className="lg:col-span-5 space-y-8">
           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Assign Team Members</h2>
              <div className="relative mb-6">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search name, designation, department..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-12 border border-slate-200 rounded-2xl pl-12 pr-5 text-sm focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none bg-slate-50/50 hover:bg-white transition-all"
                />
              </div>

              <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {filteredUsers.length === 0 ? (
                  <div className="p-10 text-center text-slate-400 text-xs">No users found matching your search.</div>
                ) : filteredUsers.map(u => (
                  <div key={u.id} className="group p-4 rounded-2xl hover:bg-blue-50 border border-transparent hover:border-blue-100 transition-all flex justify-between items-center bg-slate-50/30 mb-2">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors text-xs">
                           {u.name?.charAt(0) || '?'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors text-xs">{u.name || 'Unknown User'}</p>
                          <p className="text-[11px] text-slate-400 font-medium">{u.designation || 'Staff'} • {u.department || 'General'}</p>
                        </div>
                     </div>
                     <button 
                       onClick={() => addStep(u)}
                       className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-slate-400 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center justify-center shadow-sm"
                     >
                       <Plus size={20} />
                     </button>
                  </div>
                ))}
              </div>
           </div>

           <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-white">
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-blue-400" /> System Note
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Workflows are triggered automatically when a document is submitted to the **Pending Issue** stage. 
                Steps are sequential; the document will wait at each step until an action is performed by the assigned approver.
              </p>
           </div>
        </div>

      </div>
    </div>
  );
}
