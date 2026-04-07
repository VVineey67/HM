import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck, UserPlus, Users, Save, Loader2,
  CheckCircle2, XCircle, Mail, Phone, Building2,
  Briefcase, Camera, FolderOpen, Trash2, Plus,
  UserCircle, Lock, Eye, EyeOff, KeyRound, SendHorizonal,
  GitMerge, ChevronDown,
} from "lucide-react";
import api from "../utils/api";
import ManageProjects from "../components/ManageProjects";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ROLE_BADGE = {
  global_admin: { label: "Global Admin", color: "bg-purple-100 text-purple-700 border border-purple-200" },
  admin:        { label: "Admin",        color: "bg-blue-100 text-blue-700 border border-blue-200"       },
  user:         { label: "User",         color: "bg-slate-100 text-slate-600 border border-slate-200"    },
};

const inp = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:border-blue-400 focus:ring-2 focus:ring-blue-100 outline-none transition-all";
const lbl = "text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-1.5";
const btnPrimary = "flex items-center gap-2 rounded-xl bg-linear-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:shadow-md transition-all disabled:opacity-50";

/* Resize image to max 800px, return base64 JPEG */
const resizeImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("File read failed"));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image load failed"));
      img.onload = () => {
        try {
          const maxSize = 800;
          const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
          const canvas = document.createElement("canvas");
          canvas.width  = Math.round(img.width  * ratio) || 1;
          canvas.height = Math.round(img.height * ratio) || 1;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL("image/jpeg", 0.92));
        } catch (err) { reject(err); }
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

const Toast = ({ msg, type }) => (
  <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl px-5 py-3 shadow-lg text-sm font-semibold
    ${type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
    {type === "success" ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
    {msg}
  </div>
);

const PermRow = ({ perm, onChange }) => {
  const checks = ["can_view", "can_add", "can_edit", "can_delete"];
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <span className="w-36 text-sm font-medium text-slate-700">{perm.module_name}</span>
      {checks.map((k) => (
        <label key={k} className="flex items-center gap-1 cursor-pointer">
          <input type="checkbox" checked={perm[k]}
            onChange={(e) => onChange(perm.module_id, k, e.target.checked)}
            className="w-4 h-4 rounded accent-blue-600" />
          <span className="text-xs text-slate-500 capitalize">{k.replace("can_", "")}</span>
        </label>
      ))}
    </div>
  );
};

/* ════════════════════════════════════════
   MAIN PROFILE COMPONENT
════════════════════════════════════════ */
export default function Profile({ onProfileUpdate, onProjectsUpdate }) {
  const currentUser      = JSON.parse(localStorage.getItem("bms_user") || "{}");
  const isAdminOrAbove   = ["global_admin", "admin"].includes(currentUser.role);
  const isGlobalAdmin    = currentUser.role === "global_admin";

  const NAV = [
    { id: "profile",  label: "My Profile",      icon: UserCircle },
    { id: "security", label: "Security",         icon: Lock       },
    ...(isAdminOrAbove ? [
      { id: "add_user", label: "Add User",       icon: UserPlus   },
      { id: "team",     label: "Manage Users",   icon: Users      },
    ] : []),
    ...(isGlobalAdmin ? [
      { id: "projects", label: "Manage Projects", icon: FolderOpen },
    ] : []),
  ];

  const [section, setSection]   = useState("profile");
  const [toast, setToast]       = useState(null);
  const [loading, setLoading]   = useState(false);

  /* Avatar */
  const [avatar, setAvatar]     = useState(currentUser.avatar || null);
  const fileRef                 = useRef();

  /* Edit profile */
  const [profile, setProfile]   = useState({
    name:        currentUser.name        || "",
    contact_no:  currentUser.contact_no  || "",
    designation: currentUser.designation || "",
    department:  currentUser.department  || "",
  });

  /* Security — OTP flow */
  const [secStep, setSecStep]   = useState(1); // 1=send OTP, 2=verify+change
  const [otpLoading, setOtpLoading] = useState(false);
  const [otp, setOtp]           = useState("");
  const [newPw, setNewPw]       = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  /* Add user */
  const [newUser, setNewUser]   = useState({ name: "", email: "", contact_no: "", designation: "", department: "", role: "user" });

  /* Team / permissions */
  const [members, setMembers]         = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [permUser, setPermUser]       = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [permLoading, setPermLoading] = useState(false);
  const [permFilter, setPermFilter]   = useState("all");

  /* Projects count for header stats */
  const [projectsCount, setProjectsCount] = useState(0);
  useEffect(() => {
    fetch(`${API}/api/projects`).then(r => r.json())
      .then(d => setProjectsCount((d.projects || []).filter(p => p.isActive).length))
      .catch(() => {});
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (section === "team" && isAdminOrAbove) fetchTeam();
  }, [section]);

  const fetchTeam = async () => {
    setTeamLoading(true);
    try {
      const { data } = await api.get("/api/users");
      setMembers(data.users || []);
    } catch { showToast("Failed to load team", "error"); }
    finally { setTeamLoading(false); }
  };

  const [avatarLoading, setAvatarLoading] = useState(false);

  /* ── Avatar upload ── */
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = "";

    setAvatarLoading(true);
    try {
      // Step 1: resize karo
      const base64 = await resizeImage(file);

      // Step 2: preview dikhao
      setAvatar(base64);

      // Step 3: Supabase Storage pe upload
      const { data } = await api.post("/api/auth/avatar", { avatar: base64 });
      setAvatar(data.url);
      const updated = { ...currentUser, avatar: data.url };
      localStorage.setItem("bms_user", JSON.stringify(updated));
      onProfileUpdate?.(updated);
      showToast("Profile picture updated successfully");
    } catch (err) {
      showToast(err?.response?.data?.error || err?.message || "Upload failed", "error");
    } finally {
      setAvatarLoading(false);
    }
  };

  /* ── Avatar delete ── */
  const deleteAvatar = async () => {
    setAvatar(null);
    const updated = { ...currentUser, avatar: null };
    localStorage.setItem("bms_user", JSON.stringify(updated));
    onProfileUpdate?.(updated);
    try { await api.delete("/api/auth/avatar"); } catch { /* silent */ }
    showToast("Profile picture removed");
  };

  /* ── Save profile ── */
  const saveProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put("/api/auth/profile", profile);
      const updated  = { ...currentUser, ...data.user, avatar: currentUser.avatar };
      localStorage.setItem("bms_user", JSON.stringify(updated));
      onProfileUpdate?.(updated);
      showToast("Profile updated successfully");
    } catch { showToast("Failed to update profile", "error"); }
    finally { setLoading(false); }
  };

  /* ── Security: Send OTP ── */
  const sendOtp = async () => {
    setOtpLoading(true);
    try {
      await api.post("/api/auth/send-otp", { email: currentUser.email });
      setSecStep(2);
      showToast(`OTP sent to ${currentUser.email}`);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to send OTP", "error");
    } finally { setOtpLoading(false); }
  };

  /* ── Security: Verify OTP + Change Password ── */
  const verifyOtpAndChange = async (e) => {
    e.preventDefault();
    if (newPw !== confirmPw) return showToast("Passwords do not match", "error");
    if (newPw.length < 8)    return showToast("Password must be at least 8 characters", "error");
    if (!otp.trim())         return showToast("Enter the OTP", "error");
    setOtpLoading(true);
    try {
      await api.post("/api/auth/verify-otp-change-password", {
        email: currentUser.email,
        otp,
        newPassword: newPw,
      });
      showToast("Password changed successfully!");
      setSecStep(1);
      setOtp(""); setNewPw(""); setConfirmPw("");
    } catch (err) {
      showToast(err.response?.data?.error || "Invalid OTP or failed", "error");
    } finally { setOtpLoading(false); }
  };

  /* ── Add member ── */
  const addMember = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/users", newUser);
      setNewUser({ name: "", email: "", contact_no: "", designation: "", department: "", role: "user" });
      showToast(`Invite sent to ${newUser.email}`);
    } catch (err) { showToast(err.response?.data?.error || "Failed to add member", "error"); }
    finally { setLoading(false); }
  };

  /* ── Toggle active ── */
  const toggleActive = async (member) => {
    try {
      await api.put(`/api/users/${member.id}`, { is_active: !member.is_active });
      setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, is_active: !m.is_active } : m));
      showToast(`${member.name} ${member.is_active ? "deactivated" : "activated"}`);
    } catch { showToast("Failed to update member", "error"); }
  };

  /* ── Permissions ── */
  const viewPerms = async (member) => {
    setPermUser(member);
    setPermFilter("all");
    setPermLoading(true);
    try {
      const { data } = await api.get(`/api/users/${member.id}/permissions`);
      setPermissions(data.permissions || []);
    } catch { showToast("Failed to load permissions", "error"); }
    finally { setPermLoading(false); }
  };

  const updatePerm = (moduleId, key, value) =>
    setPermissions((prev) => prev.map((p) => p.module_id === moduleId ? { ...p, [key]: value } : p));

  const savePerms = async () => {
    setPermLoading(true);
    try {
      await api.put(`/api/users/${permUser.id}/permissions`, { permissions });
      showToast("Permissions saved");
    } catch { showToast("Failed to save permissions", "error"); }
    finally { setPermLoading(false); }
  };


  const badge = ROLE_BADGE[currentUser.role] || ROLE_BADGE.user;

  /* Serialization */
  const [serSites,    setSerSites]    = useState([]);
  const [serConfigs,  setSerConfigs]  = useState([]);
  const [serLoading,  setSerLoading]  = useState(false);
  const [serSaving,   setSerSaving]   = useState(null); // siteId being saved

  useEffect(() => {
    if (section === "serialization" && isGlobalAdmin) fetchSerData();
  }, [section]);

  const fetchSerData = async () => {
    setSerLoading(true);
    try {
      const [sitesRes, configsRes] = await Promise.all([
        fetch(`${API}/api/procurement/sites`).then(r => r.json()),
        fetch(`${API}/api/intakes/serialization`).then(r => r.json()),
      ]);
      setSerSites(sitesRes.sites || []);
      setSerConfigs(configsRes.configs || []);
    } catch { showToast("Failed to load data", "error"); }
    setSerLoading(false);
  };

  const getSerConfig = (siteId) =>
    serConfigs.find(c => c.site_id === siteId && c.doc_type === "intake") || {};

  const updateSerConfig = (siteId, field, value) => {
    setSerConfigs(prev => {
      const exists = prev.find(c => c.site_id === siteId && c.doc_type === "intake");
      if (exists) return prev.map(c => c.site_id === siteId && c.doc_type === "intake" ? { ...c, [field]: value } : c);
      return [...prev, { doc_type: "intake", site_id: siteId, [field]: value }];
    });
  };

  const saveSerConfig = async (site) => {
    const cfg = getSerConfig(site.id);
    if (!cfg.prefix) return showToast("Prefix is required", "error");
    setSerSaving(site.id);
    try {
      const res = await fetch(`${API}/api/intakes/serialization`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_type: "intake", site_id: site.id,
          site_name: site.siteName, prefix: cfg.prefix,
          pad_length: parseInt(cfg.pad_length) || 2,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      showToast(`Saved for ${site.siteName}`);
      fetchSerData();
    } catch { showToast("Failed to save", "error"); }
    setSerSaving(null);
  };

  /* Approval Flows */
  const APPROVAL_MODULES = [
    { key: "intake", label: "Intake (PR)" },
    { key: "order",  label: "Purchase Order" },
  ];
  const [approvalFlows,   setApprovalFlows]   = useState({});
  const [approvalUsers,   setApprovalUsers]   = useState([]);
  const [approvalSaving,  setApprovalSaving]  = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);

  useEffect(() => {
    if (section === "approval_flow" && isGlobalAdmin) fetchApprovalData();
  }, [section]);

  const fetchApprovalData = async () => {
    setApprovalLoading(true);
    try {
      const [flowsRes, usersRes] = await Promise.all([
        fetch(`${API}/api/intakes/approval-flows`).then(r => r.json()),
        api.get("/api/users").then(r => r.data),
      ]);
      const flowMap = {};
      (flowsRes.flows || []).forEach(f => { flowMap[f.module] = f; });
      setApprovalFlows(flowMap);
      setApprovalUsers(usersRes.users || []);
    } catch { showToast("Failed to load", "error"); }
    setApprovalLoading(false);
  };

  const updateApprovalFlow = (module, userId) => {
    const user = approvalUsers.find(u => u.id === userId);
    setApprovalFlows(prev => ({
      ...prev,
      [module]: { ...prev[module], approver_user_id: userId, approver_name: user?.name || "", approver_email: user?.email || "" },
    }));
  };

  const saveApprovalFlow = async (module) => {
    const cfg = approvalFlows[module] || {};
    setApprovalSaving(module);
    try {
      const res = await fetch(`${API}/api/intakes/approval-flows`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module, approver_user_id: cfg.approver_user_id, approver_name: cfg.approver_name, approver_email: cfg.approver_email }),
      });
      if (!res.ok) throw new Error("Failed");
      showToast(`Saved for ${APPROVAL_MODULES.find(m => m.key === module)?.label}`);
    } catch { showToast("Failed to save", "error"); }
    setApprovalSaving(null);
  };

  const TABS = [
    { id: "profile",       label: "Personal info",  show: true },
    { id: "security",      label: "Security",        show: true },
    { id: "add_user",      label: "Add User",        show: isAdminOrAbove },
    { id: "team",          label: "Manage Users",    show: isAdminOrAbove },
    { id: "projects",      label: "Projects",        show: isGlobalAdmin  },
    { id: "serialization", label: "Serialization",   show: isGlobalAdmin  },
    { id: "approval_flow", label: "Approval Flow",   show: isGlobalAdmin  },
  ].filter(t => t.show);

  const accessLabel = currentUser.role === "global_admin" ? "Global" : currentUser.role === "admin" ? "Admin" : "Standard";
  const roleLabel   = currentUser.role === "global_admin" ? "Global Admin" : currentUser.role === "admin" ? "Admin" : "User";

  /* ══ RENDER ══ */
  return (
    <div className="min-h-screen bg-[#f0f2f5] p-4 md:p-6">
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

      <div className="space-y-4">

        {/* ── DARK PROFILE HEADER CARD ── */}
        <div className="rounded-2xl px-5 py-4 md:px-6 md:py-5 shadow-lg" style={{ background: "linear-gradient(135deg, #1a1f3c 0%, #2d1b69 100%)" }}>
          <div className="flex items-center gap-4">

            {/* Avatar */}
            <div className="relative group shrink-0">
              <div className="w-20 h-20 rounded-2xl border-2 border-white/20 overflow-hidden shadow-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                {avatarLoading ? (
                  <Loader2 size={24} className="text-white animate-spin" />
                ) : avatar ? (
                  <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-white font-black text-3xl select-none">
                    {currentUser.name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                )}
              </div>
              <div className={`absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center gap-2 transition-opacity
                ${avatarLoading ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100"}`}>
                <button onClick={() => fileRef.current.click()} className="flex flex-col items-center gap-0.5">
                  <Camera size={16} className="text-white" />
                  <span className="text-[9px] text-white font-bold">Edit</span>
                </button>
                {avatar && (
                  <button onClick={deleteAvatar} className="flex flex-col items-center gap-0.5">
                    <Trash2 size={16} className="text-red-300" />
                    <span className="text-[9px] text-red-300 font-bold">Del</span>
                  </button>
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-indigo-500 border-2 border-white/20 flex items-center justify-center pointer-events-none">
                <Camera size={11} className="text-white" />
              </div>
            </div>

            {/* Name + Role + Email */}
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-black text-white leading-tight">{currentUser.name || "—"}</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: "rgba(139,92,246,0.3)", color: "#c4b5fd", border: "1px solid rgba(139,92,246,0.4)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block" />
                  {roleLabel}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                  Active
                </span>
              </div>
              <p className="text-xs text-white/40 mt-1 truncate">{currentUser.email}</p>
            </div>

          </div>
        </div>

        {/* ── TAB NAV ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 px-4 py-1.5 flex gap-1 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id}
              onClick={() => { setSection(t.id); setPermUser(null); setSecStep(1); }}
              className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all
                ${section === t.id
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── CONTENT ── */}
        <div>

            {/* ─── MY PROFILE ─── */}
            {section === "profile" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Left: Current info */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 h-full">
                    <p className={lbl + " mb-5"}>Current Info</p>
                    <div className="space-y-4">
                      {[
                        { icon: UserCircle, label: "Full Name",   value: currentUser.name,        color: "text-indigo-500", bg: "bg-indigo-50" },
                        { icon: Mail,       label: "Email",        value: currentUser.email,       color: "text-blue-500",   bg: "bg-blue-50"   },
                        { icon: Phone,      label: "Contact",      value: currentUser.contact_no,  color: "text-green-500",  bg: "bg-green-50"  },
                        { icon: Briefcase,  label: "Designation",  value: currentUser.designation, color: "text-orange-500", bg: "bg-orange-50" },
                        { icon: Building2,  label: "Department",   value: currentUser.department,  color: "text-purple-500", bg: "bg-purple-50" },
                      ].map(({ icon: Icon, label: l, value, color, bg }) => (
                        <div key={l} className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                            <Icon size={15} className={color} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{l}</p>
                            <p className="text-sm font-semibold text-slate-700 truncate mt-0.5">{value || "—"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Edit form */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                        <UserCircle size={18} className="text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-base font-black text-slate-800">Edit Profile</h2>
                        <p className="text-xs text-slate-500">Update your personal information</p>
                      </div>
                    </div>

                    <form onSubmit={saveProfile} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <span className={lbl}>Full Name *</span>
                          <div className="relative">
                            <UserCircle size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input className={`${inp} pl-10`} value={profile.name}
                              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} required />
                          </div>
                        </div>
                        <div>
                          <span className={lbl}>Email Address</span>
                          <div className="relative">
                            <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                            <input className={`${inp} pl-10 opacity-50 cursor-not-allowed`}
                              value={currentUser.email || ""} disabled />
                          </div>
                        </div>
                        <div>
                          <span className={lbl}>Contact Number</span>
                          <div className="relative">
                            <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input className={`${inp} pl-10`} value={profile.contact_no}
                              onChange={(e) => setProfile((p) => ({ ...p, contact_no: e.target.value }))}
                              placeholder="+91 98765 43210" />
                          </div>
                        </div>
                        <div>
                          <span className={lbl}>Designation</span>
                          <div className="relative">
                            <Briefcase size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input className={`${inp} pl-10`} value={profile.designation}
                              onChange={(e) => setProfile((p) => ({ ...p, designation: e.target.value }))}
                              placeholder="Project Manager" />
                          </div>
                        </div>
                        <div className="sm:col-span-2">
                          <span className={lbl}>Department</span>
                          <div className="relative">
                            <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input className={`${inp} pl-10`} value={profile.department}
                              onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))}
                              placeholder="Engineering" />
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-4 border-t border-slate-50">
                        <button type="submit" disabled={loading} className={btnPrimary}>
                          {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                          Save Changes
                        </button>
                        <p className="text-xs text-slate-400">Email address cannot be changed</p>
                      </div>
                    </form>
                  </div>
                </div>

              </div>
            )}

            {/* ─── SECURITY ─── */}
            {section === "security" && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 max-w-lg">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-800">Change Password</h2>
                    <p className="text-sm text-slate-500">OTP will be sent to your email for verification</p>
                  </div>
                </div>

                {/* Step indicators */}
                <div className="flex items-center gap-2 mb-7">
                  {[{ n: 1, label: "Send OTP" }, { n: 2, label: "Verify & Set" }].map(({ n, label }) => (
                    <React.Fragment key={n}>
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all
                          ${secStep >= n ? "bg-linear-to-br from-blue-600 to-purple-600 text-white shadow" : "bg-slate-100 text-slate-400"}`}>
                          {secStep > n ? <CheckCircle2 size={14} /> : n}
                        </div>
                        <span className={`text-xs font-semibold hidden sm:block ${secStep >= n ? "text-slate-700" : "text-slate-400"}`}>{label}</span>
                      </div>
                      {n < 2 && <div className={`flex-1 h-px ${secStep > n ? "bg-blue-400" : "bg-slate-200"}`} />}
                    </React.Fragment>
                  ))}
                </div>

                {/* Step 1 — Send OTP */}
                {secStep === 1 && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-100 rounded-xl">
                      <Mail size={18} className="text-blue-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-blue-700 uppercase tracking-widest">OTP will be sent to</p>
                        <p className="text-sm font-semibold text-slate-800 mt-0.5">{currentUser.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={sendOtp}
                      disabled={otpLoading}
                      className={btnPrimary}
                    >
                      {otpLoading
                        ? <Loader2 size={16} className="animate-spin" />
                        : <SendHorizonal size={16} />
                      }
                      Send OTP to Email
                    </button>
                  </div>
                )}

                {/* Step 2 — Enter OTP + New Password */}
                {secStep === 2 && (
                  <form onSubmit={verifyOtpAndChange} className="space-y-4">
                    <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 mb-2">
                      <CheckCircle2 size={16} className="text-green-500 shrink-0" />
                      <p className="text-sm text-green-700 font-medium">OTP sent to <strong>{currentUser.email}</strong></p>
                    </div>

                    <div>
                      <span className={lbl}>Enter OTP</span>
                      <input
                        className={`${inp} text-center text-2xl font-black tracking-[0.4em]`}
                        placeholder="• • • • • •"
                        maxLength={8}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                        required
                      />
                    </div>

                    <div>
                      <span className={lbl}>New Password</span>
                      <div className="relative">
                        <input
                          type={showNewPw ? "text" : "password"}
                          className={`${inp} pr-11`}
                          placeholder="Minimum 8 characters"
                          value={newPw}
                          onChange={(e) => setNewPw(e.target.value)}
                          required
                        />
                        <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className={lbl}>Confirm New Password</span>
                      <div className="relative">
                        <input
                          type={showConfirmPw ? "text" : "password"}
                          className={`${inp} pr-11`}
                          placeholder="Re-enter password"
                          value={confirmPw}
                          onChange={(e) => setConfirmPw(e.target.value)}
                          required
                        />
                        <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-1">
                      <button type="submit" disabled={otpLoading} className={btnPrimary}>
                        {otpLoading ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                        Verify & Update Password
                      </button>
                      <button type="button" onClick={() => { setSecStep(1); setOtp(""); setNewPw(""); setConfirmPw(""); }}
                        className="text-sm text-slate-500 hover:text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors">
                        Resend OTP
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* ─── ADD USER ─── */}
            {section === "add_user" && isAdminOrAbove && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-lg font-black text-slate-800 mb-1">Add User</h2>
                <p className="text-sm text-slate-500 mb-6">An invite email will be sent to set their password.</p>
                <form onSubmit={addMember} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className={lbl}>Full Name *</span>
                      <input className={inp} value={newUser.name}
                        onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))} required />
                    </div>
                    <div>
                      <span className={lbl}>Email Address *</span>
                      <input type="email" className={inp} value={newUser.email}
                        onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} required />
                    </div>
                    <div>
                      <span className={lbl}>Contact Number</span>
                      <input className={inp} value={newUser.contact_no}
                        onChange={(e) => setNewUser((p) => ({ ...p, contact_no: e.target.value }))} />
                    </div>
                    <div>
                      <span className={lbl}>Designation</span>
                      <input className={inp} value={newUser.designation}
                        onChange={(e) => setNewUser((p) => ({ ...p, designation: e.target.value }))} />
                    </div>
                    <div>
                      <span className={lbl}>Department</span>
                      <input className={inp} value={newUser.department}
                        onChange={(e) => setNewUser((p) => ({ ...p, department: e.target.value }))} />
                    </div>
                    <div>
                      <span className={lbl}>Role</span>
                      <select className={inp} value={newUser.role}
                        onChange={(e) => setNewUser((p) => ({ ...p, role: e.target.value }))}>
                        <option value="user">User</option>
                        {isGlobalAdmin && <option value="admin">Admin</option>}
                      </select>
                    </div>
                  </div>
                  <button type="submit" disabled={loading} className={btnPrimary}>
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}
                    Send Invite
                  </button>
                </form>
              </div>
            )}

            {/* ─── MANAGE USERS ─── */}
            {section === "team" && isAdminOrAbove && (
              <div className="space-y-4">
                {permUser ? (
                  /* Permissions panel */
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="text-lg font-black text-slate-800">Permissions</h2>
                        <p className="text-sm text-slate-500">{permUser.name} — {permUser.email}</p>
                      </div>
                      <button onClick={() => setPermUser(null)}
                        className="text-sm font-semibold text-slate-500 hover:text-slate-800 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                        ← Back
                      </button>
                    </div>

                    {permLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 size={24} className="animate-spin text-blue-500" />
                      </div>
                    ) : (
                      <>
                        {/* Filter: All or specific tab */}
                        <div className="mb-4">
                          <span className={lbl}>Filter by Tab</span>
                          <select
                            className={inp}
                            value={permFilter}
                            onChange={(e) => setPermFilter(e.target.value)}
                          >
                            <option value="all">All Tabs</option>
                            {permissions.map((p) => (
                              <option key={p.module_id} value={p.module_id}>{p.module_name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Header row */}
                        <div className="mb-2 flex items-center gap-3 px-1">
                          <span className="w-36 text-[10px] font-bold uppercase tracking-widest text-slate-400">Tab / Module</span>
                          {["View", "Add", "Edit", "Delete"].map((k) => (
                            <span key={k} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 w-12 text-center">{k}</span>
                          ))}
                        </div>
                        <div className="rounded-xl border border-slate-100 px-4 bg-slate-50">
                          {permissions
                            .filter((p) => permFilter === "all" || p.module_id === permFilter)
                            .map((perm) => (
                              <PermRow key={perm.module_id} perm={perm} onChange={updatePerm} />
                            ))
                          }
                          {permissions.length === 0 && (
                            <p className="py-6 text-center text-sm text-slate-400">No modules found</p>
                          )}
                        </div>
                        <div className="mt-4">
                          <button onClick={savePerms} disabled={permLoading} className={btnPrimary}>
                            {permLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            Save Permissions
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  /* Team list */
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="text-lg font-black text-slate-800">Manage Users</h2>
                        {!teamLoading && (
                          <p className="text-sm text-slate-500">{members.length} team member{members.length !== 1 ? "s" : ""}</p>
                        )}
                      </div>
                    </div>

                    {teamLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 size={24} className="animate-spin text-blue-500" />
                      </div>
                    ) : members.length === 0 ? (
                      <p className="text-center text-sm text-slate-400 py-8">No team members found.</p>
                    ) : (
                      <div className="space-y-2">
                        {members.map((m) => {
                          const mb = ROLE_BADGE[m.role] || ROLE_BADGE.user;
                          return (
                            <div key={m.id}
                              className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-10 h-10 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
                                  {m.avatar
                                    ? <img src={m.avatar} alt="" className="w-full h-full object-cover" />
                                    : (m.name?.charAt(0)?.toUpperCase() || "?")
                                  }
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <p className="font-semibold text-sm text-slate-800 truncate">{m.name}</p>
                                    {!m.is_active && (
                                      <span className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded-full">Inactive</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 truncate">{m.email}</p>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${mb.color}`}>{mb.label}</span>
                                    {m.designation && <span className="text-[10px] text-slate-400">{m.designation}</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button onClick={() => viewPerms(m)}
                                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                                  Permissions
                                </button>
                                {m.id !== currentUser.id && (
                                  <button onClick={() => toggleActive(m)}
                                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors
                                      ${m.is_active ? "text-red-500 hover:bg-red-50" : "text-green-600 hover:bg-green-50"}`}>
                                    {m.is_active ? "Deactivate" : "Activate"}
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── MANAGE PROJECTS ─── */}
            {section === "projects" && isGlobalAdmin && (
              <ManageProjects onProjectsUpdate={onProjectsUpdate} />
            )}

            {/* ─── SERIALIZATION ─── */}
            {section === "serialization" && isGlobalAdmin && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                    <KeyRound size={17} className="text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-800">Serialization</h2>
                    <p className="text-xs text-slate-500">Configure document number series per site</p>
                  </div>
                </div>

                {serLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 size={22} className="animate-spin text-indigo-400" />
                  </div>
                ) : serSites.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">No sites registered. Add sites first from Procurement Setup → Site List.</p>
                ) : (
                  <div className="space-y-3">
                    {/* Header row */}
                    <div className="grid grid-cols-12 gap-3 px-4 pb-1">
                      <div className="col-span-3"><span className={lbl}>Site</span></div>
                      <div className="col-span-2"><span className={lbl}>Doc Type</span></div>
                      <div className="col-span-3"><span className={lbl}>Prefix / Format</span></div>
                      <div className="col-span-2"><span className={lbl}>Pad Length</span></div>
                      <div className="col-span-2"><span className={lbl}>Preview</span></div>
                    </div>
                    {serSites.map(site => {
                      const cfg    = getSerConfig(site.id);
                      const next   = (cfg.current_number || 0) + 1;
                      const padded = String(next).padStart(parseInt(cfg.pad_length) || 2, "0");
                      const preview = cfg.prefix ? `${cfg.prefix}${padded}` : "—";
                      return (
                        <div key={site.id} className="grid grid-cols-12 gap-3 items-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-200 transition-all">
                          <div className="col-span-3">
                            <p className="text-sm font-semibold text-slate-700">{site.siteName}</p>
                            {site.siteCode && <p className="text-xs text-slate-400 font-mono">{site.siteCode}</p>}
                          </div>
                          <div className="col-span-2">
                            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">Intake</span>
                          </div>
                          <div className="col-span-3">
                            <input
                              className={inp}
                              value={cfg.prefix || ""}
                              onChange={e => updateSerConfig(site.id, "prefix", e.target.value)}
                              placeholder={`e.g. PR/${site.siteCode || "SITE"}/`}
                            />
                          </div>
                          <div className="col-span-2">
                            <select
                              className={inp}
                              value={cfg.pad_length || 2}
                              onChange={e => updateSerConfig(site.id, "pad_length", parseInt(e.target.value))}>
                              {[1,2,3,4].map(n => <option key={n} value={n}>{n} digit{n>1?"s":""} ({"0".repeat(n-1)}1)</option>)}
                            </select>
                          </div>
                          <div className="col-span-2 flex items-center justify-between gap-2">
                            <span className="text-xs font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 truncate">
                              {preview}
                            </span>
                            <button
                              onClick={() => saveSerConfig(site)}
                              disabled={serSaving === site.id}
                              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all">
                              {serSaving === site.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                              Save
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ─── APPROVAL FLOW ─── */}
            {section === "approval_flow" && isGlobalAdmin && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <GitMerge size={17} className="text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-800">Approval Flow</h2>
                    <p className="text-xs text-slate-500">Set who can approve each module's documents</p>
                  </div>
                </div>

                {approvalLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 size={22} className="animate-spin text-violet-400" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Column headers */}
                    <div className="grid grid-cols-12 gap-3 px-4 pb-1">
                      <div className="col-span-3"><span className={lbl}>Module</span></div>
                      <div className="col-span-2"><span className={lbl}>Flow</span></div>
                      <div className="col-span-4"><span className={lbl}>Approver</span></div>
                      <div className="col-span-3"><span className={lbl}>Currently Set</span></div>
                    </div>

                    {APPROVAL_MODULES.map(mod => {
                      const cfg = approvalFlows[mod.key] || {};
                      return (
                        <div key={mod.key} className="grid grid-cols-12 gap-3 items-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-violet-200 transition-all">
                          <div className="col-span-3">
                            <p className="text-sm font-semibold text-slate-700">{mod.label}</p>
                          </div>
                          <div className="col-span-2">
                            <div className="flex flex-col gap-1 text-xs text-slate-500">
                              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"/>Submitted</span>
                              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-violet-400 inline-block"/>Approve/Reject</span>
                              <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"/>Assign &amp; Work</span>
                            </div>
                          </div>
                          <div className="col-span-4">
                            <div className="relative">
                              <select
                                className={inp + " appearance-none pr-8"}
                                value={cfg.approver_user_id || ""}
                                onChange={e => updateApprovalFlow(mod.key, e.target.value)}>
                                <option value="">— No approver set —</option>
                                {approvalUsers.map(u => (
                                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                ))}
                              </select>
                              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                          </div>
                          <div className="col-span-3 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              {cfg.approver_name ? (
                                <>
                                  <p className="text-xs font-semibold text-slate-700 truncate">{cfg.approver_name}</p>
                                  <p className="text-[10px] text-slate-400 truncate">{cfg.approver_email}</p>
                                </>
                              ) : (
                                <p className="text-xs text-slate-300">Not configured</p>
                              )}
                            </div>
                            <button
                              onClick={() => saveApprovalFlow(mod.key)}
                              disabled={approvalSaving === mod.key}
                              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 disabled:opacity-50 transition-all">
                              {approvalSaving === mod.key ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                              Save
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <div className="mt-4 p-4 rounded-xl bg-violet-50 border border-violet-100">
                      <p className="text-xs font-semibold text-violet-700 mb-1">How it works</p>
                      <ul className="text-xs text-violet-600 space-y-1 list-disc list-inside">
                        <li>User raises an intake → status: <strong>Submitted</strong></li>
                        <li>Configured approver sees it → can <strong>Approve</strong> or <strong>Reject</strong></li>
                        <li>After approval → approver assigns to a team member → status: <strong>In Review</strong></li>
                        <li>Assigned person starts working → status: <strong>Working</strong></li>
                        <li>Quotations collected → Comparative generated → PR <strong>Closed</strong></li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}

        </div>
      </div>
    </div>
  );
}

