import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck, UserPlus, Users, Save, Loader2,
  CheckCircle2, XCircle, Mail, Phone, Building2,
  Briefcase, Camera, FolderOpen, Trash2, Plus,
  UserCircle, Lock, Eye, EyeOff, KeyRound, SendHorizonal,
} from "lucide-react";
import api from "../utils/api";

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

  /* Projects */
  const EMPTY_PROJECT = { name: "", code: "", location: "", manager: "", address: "", city: "", state: "", pincode: "" };
  const [projects, setProjects] = useState(() => {
    const s = localStorage.getItem("bms_projects");
    if (!s) return [{ name: "All Project" }, { name: "B-47" }, { name: "GDLV" }, { name: "BHA" }, { name: "SLH" }, { name: "HIH" }, { name: "RWH" }];
    const parsed = JSON.parse(s);
    if (parsed.length > 0 && typeof parsed[0] === "string") return parsed.map(n => ({ name: n }));
    return parsed;
  });
  const [newProject, setNewProject] = useState({ ...EMPTY_PROJECT });

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
      await api.post("/api/auth/send-otp");
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
      await api.post("/api/auth/verify-otp-change-password", { otp, newPassword: newPw });
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

  /* ── Projects ── */
  const addProject = () => {
    const name = newProject.name.trim();
    if (!name) return showToast("Project name is required", "error");
    if (projects.some(p => p.name === name)) return showToast("Project already exists", "error");
    const updated = [...projects, { ...newProject, name }];
    setProjects(updated);
    localStorage.setItem("bms_projects", JSON.stringify(updated));
    onProjectsUpdate?.(updated);
    setNewProject({ ...EMPTY_PROJECT });
    showToast(`Project "${name}" added`);
  };

  const removeProject = (name) => {
    if (name === "All Project") return showToast("Cannot remove 'All Project'", "error");
    const updated = projects.filter((p) => p.name !== name);
    setProjects(updated);
    localStorage.setItem("bms_projects", JSON.stringify(updated));
    onProjectsUpdate?.(updated);
    showToast(`Project "${name}" removed`);
  };

  const badge = ROLE_BADGE[currentUser.role] || ROLE_BADGE.user;

  /* ══ RENDER ══ */
  return (
    <div className="min-h-screen bg-[#f0f2f5] p-4 md:p-6">
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />

      <div className="flex flex-col md:flex-row gap-5 items-start h-full">

        {/* ── Left Panel ── */}
        <div className="w-full md:w-72 shrink-0 space-y-4">

          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {/* Cover */}
            <div className="h-24 bg-linear-to-r from-blue-600 via-indigo-500 to-purple-600" />

            {/* Avatar */}
            <div className="flex flex-col items-center -mt-12 pb-6 px-5">
              <div className="relative group">
                {/* Avatar circle */}
                <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center shrink-0">
                  {avatarLoading ? (
                    <Loader2 size={28} className="text-white animate-spin" />
                  ) : avatar ? (
                    <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-black text-3xl select-none">
                      {currentUser.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  )}
                </div>

                {/* Hover overlay — Update + Delete (loading ke waqt nahi dikhega) */}
                <div className={`absolute inset-0 rounded-full bg-black/55 flex items-center justify-center gap-3 transition-opacity
                  ${avatarLoading ? "opacity-0 pointer-events-none" : "opacity-0 group-hover:opacity-100"}`}>
                  <button
                    onClick={() => fileRef.current.click()}
                    title="Update photo"
                    className="flex flex-col items-center gap-0.5"
                  >
                    <Camera size={18} className="text-white" />
                    <span className="text-[9px] text-white font-bold">Update</span>
                  </button>
                  {avatar && (
                    <button
                      onClick={deleteAvatar}
                      title="Remove photo"
                      className="flex flex-col items-center gap-0.5"
                    >
                      <Trash2 size={18} className="text-red-400" />
                      <span className="text-[9px] text-red-400 font-bold">Delete</span>
                    </button>
                  )}
                </div>

                {/* Camera badge — always visible */}
                <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-blue-600 border-2 border-white flex items-center justify-center shadow pointer-events-none">
                  <Camera size={12} className="text-white" />
                </div>
              </div>

              <h3 className="mt-3 font-black text-base text-slate-800 text-center leading-tight">
                {currentUser.name || "—"}
              </h3>
              <span className={`mt-1.5 text-[11px] font-bold px-3 py-0.5 rounded-full ${badge.color}`}>
                {badge.label}
              </span>
              <p className="text-xs text-slate-400 mt-1.5 text-center truncate max-w-full px-2">
                {currentUser.email}
              </p>

              {/* Info pills */}
              <div className="mt-3 w-full space-y-1.5">
                {currentUser.designation && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                    <Briefcase size={13} className="text-blue-500 shrink-0" />
                    <span className="text-xs text-slate-600 truncate">{currentUser.designation}</span>
                  </div>
                )}
                {currentUser.department && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                    <Building2 size={13} className="text-purple-500 shrink-0" />
                    <span className="text-xs text-slate-600 truncate">{currentUser.department}</span>
                  </div>
                )}
                {currentUser.contact_no && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl">
                    <Phone size={13} className="text-green-500 shrink-0" />
                    <span className="text-xs text-slate-600 truncate">{currentUser.contact_no}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Nav */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2">
            {NAV.map((item) => (
              <button
                key={item.id}
                onClick={() => { setSection(item.id); setPermUser(null); setSecStep(1); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left mb-0.5 last:mb-0
                  ${section === item.id
                    ? "bg-linear-to-r from-blue-600 to-purple-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-50"
                  }`}
              >
                <item.icon size={17} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

          {/* ── Right Content ── */}
          <div className="flex-1 min-w-0">

            {/* ─── MY PROFILE ─── */}
            {section === "profile" && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="mb-6">
                  <h2 className="text-lg font-black text-slate-800">My Profile</h2>
                  <p className="text-sm text-slate-500">Update your personal information</p>
                </div>

                <form onSubmit={saveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <span className={lbl}>Full Name</span>
                      <input className={inp} value={profile.name}
                        onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} required />
                    </div>
                    <div>
                      <span className={lbl}>Email Address</span>
                      <input className={`${inp} opacity-50 cursor-not-allowed`}
                        value={currentUser.email || ""} disabled />
                    </div>
                    <div>
                      <span className={lbl}>Contact Number</span>
                      <input className={inp} value={profile.contact_no}
                        onChange={(e) => setProfile((p) => ({ ...p, contact_no: e.target.value }))}
                        placeholder="+91 98765 43210" />
                    </div>
                    <div>
                      <span className={lbl}>Designation</span>
                      <input className={inp} value={profile.designation}
                        onChange={(e) => setProfile((p) => ({ ...p, designation: e.target.value }))}
                        placeholder="Project Manager" />
                    </div>
                    <div className="sm:col-span-2">
                      <span className={lbl}>Department</span>
                      <input className={inp} value={profile.department}
                        onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))}
                        placeholder="Engineering" />
                    </div>
                  </div>
                  <div className="pt-1">
                    <button type="submit" disabled={loading} className={btnPrimary}>
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Save Changes
                    </button>
                  </div>
                </form>

                {/* Overview cards */}
                <div className="mt-7 pt-6 border-t border-slate-100">
                  <p className={lbl}>Current Info</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                    {[
                      { icon: Mail,      label: "Email",       value: currentUser.email       },
                      { icon: Phone,     label: "Contact",     value: currentUser.contact_no  },
                      { icon: Briefcase, label: "Designation", value: currentUser.designation },
                      { icon: Building2, label: "Department",  value: currentUser.department  },
                    ].map(({ icon: Icon, label: l, value }) => (
                      <div key={l} className="rounded-xl bg-slate-50 border border-slate-100 p-3 flex items-start gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <Icon size={13} className="text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{l}</p>
                          <p className="text-xs font-semibold text-slate-700 mt-0.5 truncate">{value || "—"}</p>
                        </div>
                      </div>
                    ))}
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
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <h2 className="text-lg font-black text-slate-800 mb-1">Manage Projects</h2>
                <p className="text-sm text-slate-500 mb-6">Add or remove projects from the sidebar.</p>

                {/* Add new project form */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 mb-6">
                  <p className={`${lbl} mb-3`}>New Project</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <span className={lbl}>Project Name *</span>
                      <input className={inp} placeholder="e.g. B-47"
                        value={newProject.name}
                        onChange={(e) => setNewProject((p) => ({ ...p, name: e.target.value }))} />
                    </div>
                    <div>
                      <span className={lbl}>Project Code</span>
                      <input className={inp} placeholder="e.g. BMS-001"
                        value={newProject.code}
                        onChange={(e) => setNewProject((p) => ({ ...p, code: e.target.value }))} />
                    </div>
                    <div>
                      <span className={lbl}>Project Location</span>
                      <input className={inp} placeholder="e.g. Mumbai"
                        value={newProject.location}
                        onChange={(e) => setNewProject((p) => ({ ...p, location: e.target.value }))} />
                    </div>
                    <div>
                      <span className={lbl}>Project Manager Name</span>
                      <input className={inp} placeholder="Manager full name"
                        value={newProject.manager}
                        onChange={(e) => setNewProject((p) => ({ ...p, manager: e.target.value }))} />
                    </div>
                    <div className="sm:col-span-2">
                      <span className={lbl}>Project Address</span>
                      <input className={inp} placeholder="Street / Area"
                        value={newProject.address}
                        onChange={(e) => setNewProject((p) => ({ ...p, address: e.target.value }))} />
                    </div>
                    <div>
                      <span className={lbl}>City</span>
                      <input className={inp} placeholder="City"
                        value={newProject.city}
                        onChange={(e) => setNewProject((p) => ({ ...p, city: e.target.value }))} />
                    </div>
                    <div>
                      <span className={lbl}>State</span>
                      <input className={inp} placeholder="State"
                        value={newProject.state}
                        onChange={(e) => setNewProject((p) => ({ ...p, state: e.target.value }))} />
                    </div>
                    <div>
                      <span className={lbl}>Pincode</span>
                      <input className={inp} placeholder="000000"
                        value={newProject.pincode}
                        onChange={(e) => setNewProject((p) => ({ ...p, pincode: e.target.value }))} />
                    </div>
                  </div>
                  <div className="mt-3">
                    <button onClick={addProject}
                      className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-blue-600 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow hover:shadow-md transition-all">
                      <Plus size={15} />
                      Add Project
                    </button>
                  </div>
                </div>

                {/* Project list */}
                <div className="space-y-2">
                  {projects.map((p) => {
                    const pName = typeof p === "string" ? p : p.name;
                    const details = typeof p === "object" ? p : {};
                    return (
                      <div key={pName}
                        className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50 hover:bg-white transition-all">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                              {pName.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm text-slate-800">{pName}</p>
                              <p className="text-[11px] text-slate-400 truncate">
                                {[details.code, details.location, details.city].filter(Boolean).join(" · ") || "No details added"}
                              </p>
                            </div>
                          </div>
                          {pName !== "All Project" && (
                            <button onClick={() => removeProject(pName)}
                              className="text-slate-400 hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-red-50 shrink-0 ml-2">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        {/* Detail chips */}
                        {typeof p === "object" && (details.manager || details.address || details.state || details.pincode) && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5 pl-12">
                            {details.manager && <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-medium">👤 {details.manager}</span>}
                            {details.address && <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">{details.address}</span>}
                            {details.state   && <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">{details.state}</span>}
                            {details.pincode && <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full">{details.pincode}</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
    </div>
  );
}

