import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck, UserPlus, Users, Save, Loader2,
  CheckCircle2, XCircle, X, Mail, Phone, Building2,
  Briefcase, Camera, FolderOpen, Trash2, Plus,
  UserCircle, Lock, Eye, EyeOff, KeyRound, SendHorizonal,
  GitMerge, ChevronDown, Pencil, LayoutDashboard, ShieldAlert
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../utils/api";
import ManageProjects from "../components/ManageProjects";
import ApprovalConfig from "../components/ApprovalConfig";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ROLE_BADGE = {
  global_admin: { label: "Global Admin", color: "bg-violet-100 text-violet-700 border border-violet-200" },
  super_admin:  { label: "Super Admin",  color: "bg-purple-100 text-purple-700 border border-purple-200" },
  admin:        { label: "Admin",        color: "bg-blue-100 text-blue-700 border border-blue-200"        },
  user:         { label: "User",         color: "bg-slate-100 text-slate-600 border border-slate-200"     },
};

const PROFILE_SECTIONS = [
  { key: "manage_user",   label: "Manage Users"   },
  { key: "add_project",   label: "Add Project"    },
  { key: "serialization", label: "Serialization"  },
  { key: "approval_flow", label: "Approval Flow"  },
];

const DEFAULT_PROFILE_PERMS = {
  manage_user:   { view: false, edit: false },
  add_project:   { view: false, edit: false },
  serialization: { view: false, edit: false },
  approval_flow: { view: false, edit: false },
};

const MODULE_PERM_KEYS = [
  { key: "can_view",              label: "View"     },
  { key: "can_edit",              label: "Edit"     },
  { key: "can_bulk_upload",       label: "Bulk Up"  },
  { key: "can_add",               label: "Doc Up"   },
  { key: "can_delete",            label: "Delete"   },
  { key: "can_export",            label: "Export"   },
  { key: "can_download_document", label: "Dl Doc"   },
];

// Per-module available permissions (based on what features each tab has)
const PERM_LABELS = {
  can_view:              "View",
  can_edit:              "Edit",
  can_add:               "Upload / Add",
  can_bulk_upload:       "Bulk Upload",
  can_delete:            "Delete",
  can_export:            "Export",
  can_download_document: "Download",
};

const MODULE_PERM_CONFIG = {
  // Read-only tabs
  dashboard:              ["can_view"],
  view_3d:                ["can_view"],
  manpower_all_record:    ["can_view", "can_export"],
  stock_available:        ["can_view", "can_export"],
  compare_images:         ["can_view"],
  order_record:           ["can_view", "can_export"],
  // Simple edit tabs
  term_condition:         ["can_view", "can_edit"],
  payment_terms:          ["can_view", "can_edit"],
  government_laws:        ["can_view", "can_edit"],
  boq_prepare:            ["can_view", "can_edit", "can_delete", "can_export"],
  // Standard tabs
  site_list:              ["can_view", "can_edit", "can_delete", "can_export"],
  category_list:          ["can_view", "can_edit", "can_delete", "can_export"],
  uom:                    ["can_view", "can_edit", "can_delete", "can_export"],
  execution_plan:         ["can_view", "can_edit", "can_delete", "can_export"],
  msp_plan:               ["can_view", "can_edit", "can_delete", "can_export"],
  daily_manpower:         ["can_view", "can_edit", "can_delete", "can_export"],
  site_expense:           ["can_view", "can_edit", "can_delete", "can_export"],
  petty_cash:             ["can_view", "can_edit", "can_delete", "can_export"],
  payment_request:        ["can_view", "can_edit", "can_delete", "can_export"],
  local_purchase:         ["can_view", "can_edit", "can_delete", "can_export"],
  consumption_record:     ["can_view", "can_edit", "can_delete", "can_export"],
  create_order:           ["can_view", "can_edit", "can_delete", "can_export"],
  // With doc upload
  company_list:           ["can_view", "can_edit", "can_delete", "can_export", "can_add"],
  vendor_list:            ["can_view", "can_edit", "can_delete", "can_export", "can_add"],
  received_record:        ["can_view", "can_edit", "can_delete", "can_export", "can_add"],
  // With bulk upload
  item_list:              ["can_view", "can_edit", "can_bulk_upload", "can_delete", "can_export"],
  staff_attendance:       ["can_view", "can_edit", "can_bulk_upload", "can_delete", "can_export"],
  // With document download
  loa:                    ["can_view", "can_edit", "can_delete", "can_add", "can_download_document"],
  boq:                    ["can_view", "can_edit", "can_delete", "can_add", "can_download_document"],
  drawings:               ["can_view", "can_add",  "can_delete", "can_download_document"],
  ra_bills:               ["can_view", "can_edit", "can_delete", "can_add", "can_download_document"],
  bills_docs:             ["can_view", "can_add",  "can_delete", "can_download_document"],
  grn_docs:               ["can_view", "can_add",  "can_delete", "can_download_document"],
  all_images:             ["can_view", "can_add",  "can_delete", "can_download_document"],
  // Intake / Order with full set
  intake:                 ["can_view", "can_edit", "can_delete", "can_export", "can_add", "can_download_document"],
  order:                  ["can_view", "can_edit", "can_delete", "can_export"],
};
const DEFAULT_MODULE_PERMS = ["can_view", "can_edit", "can_delete", "can_export"];

// 2-level hierarchy matching sidebar exactly
const MODULE_SECTIONS = [
  {
    section: "Global",
    groups: [
      { label: "BOQ Prepare",       keys: ["boq_prepare"],              single: true },
      { label: "Create",            keys: ["intake","order"] },
      { label: "Procurement Setup", keys: ["company_list","site_list","vendor_list","uom","category_list","item_list","term_condition","payment_terms","government_laws"] },
    ],
  },
  {
    section: "Project",
    groups: [
      { label: "Dashboard",         keys: ["dashboard"],                                                                    single: true },
      { label: "3D View",           keys: ["view_3d"],                                                                   single: true },
      { label: "Confidential",      keys: ["loa","boq","drawings","ra_bills"] },
      { label: "Finance",           keys: ["payment_request","site_expense","petty_cash","bills_docs"] },
      { label: "Work Activity",     keys: ["execution_plan","msp_plan"] },
      { label: "Staff Attendance",  keys: ["staff_attendance"],                                                          single: true },
      { label: "Manpower",          keys: ["daily_manpower","manpower_all_record"] },
      { label: "Store",             keys: ["received_record","local_purchase","consumption_record","stock_available","grn_docs"] },
      { label: "Procurement",       keys: ["create_order","order_record"] },
      { label: "Images",            keys: ["all_images","compare_images"] },
    ],
  },
];

/* Reusable grouped permission renderer — mirrors sidebar hierarchy */
const GroupedPermissions = ({ modules, onChange }) => {
  const allSectionKeys = MODULE_SECTIONS.flatMap(s => s.groups.flatMap(g => g.keys));
  const ungrouped = modules.filter(m => !allSectionKeys.includes(m.module_key));

  const toggleAllGlobal = (key, val) => {
    modules.forEach(m => {
      const avail = MODULE_PERM_CONFIG[m.module_key] || DEFAULT_MODULE_PERMS;
      if (avail.includes(key)) onChange(m.module_id, key, val);
    });
  };

  const toggleAllSection = (groupKeys, val) => {
    modules.filter(m => groupKeys.includes(m.module_key)).forEach(m => {
      const avail = MODULE_PERM_CONFIG[m.module_key] || DEFAULT_MODULE_PERMS;
      avail.forEach(k => onChange(m.module_id, k, val));
    });
  };

  const renderRow = (mod) => {
    const availKeys = MODULE_PERM_CONFIG[mod.module_key] || DEFAULT_MODULE_PERMS;
    const allChecked = availKeys.every(k => mod[k]);
    const anyChecked = availKeys.some(k => mod[k]);
    return (
      <div key={mod.module_id}
        className={`flex items-center gap-4 px-5 py-3 border-b border-slate-50 last:border-0 transition-colors ${anyChecked ? "bg-blue-50/30" : "hover:bg-slate-50/80"}`}>
        <div className="w-48 shrink-0">
          <p className="text-[13px] font-bold text-slate-700 truncate">{mod.module_name}</p>
          <p className="text-[9px] font-medium text-slate-400 uppercase tracking-widest mt-0.5">{mod.module_key}</p>
        </div>
        
        {/* Per-row All toggle */}
        <div className="w-16 shrink-0 flex justify-center border-r border-slate-100 pr-2 mr-1">
          <label className="flex flex-col items-center gap-1 cursor-pointer select-none">
            <input type="checkbox" checked={allChecked}
              ref={el => { if (el) el.indeterminate = anyChecked && !allChecked; }}
              onChange={e => availKeys.forEach(k => onChange(mod.module_id, k, e.target.checked))}
              className="w-4 h-4 rounded-md accent-blue-600 cursor-pointer" />
            <span className="text-[8px] font-black text-slate-400 uppercase">All</span>
          </label>
        </div>

        <div className="flex flex-1 flex-wrap gap-x-6 gap-y-2">
          {availKeys.map(key => (
            <label key={key} className="flex items-center gap-2 cursor-pointer select-none group">
              <input type="checkbox" checked={mod[key] || false}
                onChange={e => onChange(mod.module_id, key, e.target.checked)}
                className="w-4 h-4 rounded-md accent-blue-600 cursor-pointer transition-transform group-active:scale-90" />
              <span className="text-[11px] font-medium text-slate-500 group-hover:text-slate-700 transition-colors">{PERM_LABELS[key]}</span>
            </label>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* GLOBAL BULK ACTIONS */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Global Bulk Actions</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {MODULE_PERM_KEYS.map(pk => (
            <button key={pk.key} type="button"
              onClick={() => toggleAllGlobal(pk.key, true)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:shadow-sm transition-all text-center">
              All {pk.label}
            </button>
          ))}
          <button type="button" onClick={() => modules.forEach(m => (MODULE_PERM_CONFIG[m.module_key]||DEFAULT_MODULE_PERMS).forEach(k => onChange(m.module_id, k, false)))}
            className="px-3 py-2 bg-red-50 border border-red-100 rounded-xl text-[10px] font-bold text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-xs text-center">
            Clear All
          </button>
        </div>
      </div>

      {MODULE_SECTIONS.map(({ section, groups }) => {
        const sectionHasMods = groups.some(g => modules.some(m => g.keys.includes(m.module_key)));
        if (!sectionHasMods) return null;
        return (
          <div key={section}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{section}</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <div className="space-y-3 pl-2">
              {groups.map(group => {
                const groupMods = modules.filter(m => group.keys.includes(m.module_key));
                if (groupMods.length === 0) return null;

                const allInGroupChecked = groupMods.every(m => (MODULE_PERM_CONFIG[m.module_key]||DEFAULT_MODULE_PERMS).every(k => m[k]));

                return (
                  <div key={group.label} className="space-y-1.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[11px] font-bold text-slate-500">{group.label}</span>
                      <button type="button" onClick={() => toggleAllSection(group.keys, !allInGroupChecked)}
                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md transition-all ${allInGroupChecked ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400 hover:text-blue-600"}`}>
                        {allInGroupChecked ? "Unselect Group" : "Select Group"}
                      </button>
                    </div>
                    <div className={`rounded-xl border overflow-hidden border-slate-200 bg-white`}>
                      {groupMods.map(renderRow)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {ungrouped.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Other</span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden pl-2">
            {ungrouped.map(renderRow)}
          </div>
        </div>
      )}
    </div>
  );
};

const inp = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all shadow-sm";
const lbl = "text-[12px] font-bold text-slate-500 mb-1.5 ml-1 block";
const btnPrimary = "flex items-center gap-2 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-200 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50";
const secHeader = "flex items-center gap-2 mb-5 border-l-4 border-blue-500 pl-4 py-1";
const secTitle = "text-xs font-black uppercase tracking-[0.2em] text-slate-400";

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

const PermRow = ({ perm, onChange }) => (
  <div className="flex items-center gap-1 py-2.5 border-b border-slate-50 last:border-0">
    <span className="w-32 shrink-0 text-sm font-medium text-slate-700 truncate">{perm.module_name}</span>
    {MODULE_PERM_KEYS.map(({ key }) => (
      <div key={key} className="w-14 flex justify-center shrink-0">
        <input type="checkbox" checked={perm[key] || false}
          onChange={(e) => onChange(perm.module_id, key, e.target.checked)}
          className="w-4 h-4 rounded accent-blue-600" />
      </div>
    ))}
  </div>
);

/* ════════════════════════════════════════
   MAIN PROFILE COMPONENT
════════════════════════════════════════ */
export default function Profile({ onProfileUpdate, onProjectsUpdate }) {
  const currentUser      = JSON.parse(localStorage.getItem("bms_user") || "{}");
  const isAdminOrAbove   = ["global_admin", "super_admin", "admin"].includes(currentUser.role);
  const isGlobalAdmin    = currentUser.role === "global_admin";

  const canManage = (viewerRole, targetRole, targetId) => {
    if (targetId === currentUser.id) return false; // Cannot manage yourself
    if (targetRole === "global_admin") return false; // Rule: No one touches Global Admin
    if (viewerRole === "global_admin") return true;  // Global Admin manages everyone else
    if (viewerRole === "super_admin") return ["admin", "user"].includes(targetRole);
    if (viewerRole === "admin") return targetRole === "user";
    return false;
  };

  const getManageableRoles = (viewerRole) => {
    if (viewerRole === "global_admin") return ["super_admin", "admin", "user"];
    if (viewerRole === "super_admin") return ["admin", "user"];
    if (viewerRole === "admin") return ["user"];
    return [];
  };

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
  const [showAddUser, setShowAddUser] = useState(false);

  /* Avatar & Header */
  const [avatar, setAvatar]     = useState(currentUser.avatar || null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  
  const uiSettings = currentUser.profile_permissions?.ui || {};
  const [coverImage, setCoverImage] = useState(uiSettings.cover_image || null);
  const [coverLoading, setCoverLoading] = useState(false);
  
  const GRADIENTS = [
    { name: "Midnight", value: "linear-gradient(135deg, #1a1f3c 0%, #2d1b69 100%)" },
    { name: "Ocean",    value: "linear-gradient(135deg, #0f172a 0%, #2563eb 100%)" },
    { name: "Sunset",   value: "linear-gradient(135deg, #4c1d95 0%, #db2777 100%)" },
    { name: "Emerald",  value: "linear-gradient(135deg, #064e3b 0%, #059669 100%)" },
    { name: "Coal",     value: "linear-gradient(135deg, #111827 0%, #374151 100%)" },
    { name: "Royal",    value: "linear-gradient(135deg, #1e1b4b 0%, #4338ca 100%)" },
  ];
  const [headerTheme, setHeaderTheme] = useState(uiSettings.header_theme || GRADIENTS[0].value);
  const [showThemePicker, setShowThemePicker] = useState(false);

  const fileRef                 = useRef();
  const coverFileRef            = useRef();

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
  const [newUser, setNewUser]             = useState({ name: "", email: "", contact_no: "", designation: "", department: "", role: "user" });
  const [newUserProfilePerms, setNewUserProfilePerms] = useState(DEFAULT_PROFILE_PERMS);
  const [newUserModules, setNewUserModules]   = useState([]);
  const [modulesLoading, setModulesLoading]   = useState(false);
  const [allPermsSelected, setAllPermsSelected] = useState(false);

  /* Team / permissions */
  const [members, setMembers]         = useState([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [permUser, setPermUser]       = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [editingProfilePerms, setEditingProfilePerms] = useState(DEFAULT_PROFILE_PERMS);
  const [permLoading, setPermLoading] = useState(false);
  const [permFilter, setPermFilter]   = useState("all");
  const [viewType, setViewType]       = useState("list");
  const [confirmRoleChange, setConfirmRoleChange] = useState(null); // { member, newRole }

  /* Projects count for header stats */
  const [projectsCount, setProjectsCount] = useState(0);
  useEffect(() => {
    // 1. Fetch projects count for header
    fetch(`${API}/api/projects`).then(r => r.json())
      .then(d => setProjectsCount((d.projects || []).filter(p => p.isActive).length))
      .catch(() => {});

    // 2. Sync current user permissions from DB (in case admin changed them)
    const syncProfile = async () => {
      try {
        const u = JSON.parse(localStorage.getItem("bms_user") || "{}");
        if (!u.id) return;
        const res = await fetch(`${API}/api/users/${u.id}/permissions`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("bms_token")}` }
        });
        if (res.ok) {
          const data = await res.json();
          const updatedUser = { 
            ...u, 
            profile_permissions: data.profile_permissions,
            app_permissions: data.permissions 
          };
          localStorage.setItem("bms_user", JSON.stringify(updatedUser));
          onProfileUpdate?.(updatedUser);
        }
      } catch (err) {
        console.error("Profile sync failed", err);
      }
    };
    syncProfile();
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (section === "team" && isAdminOrAbove) fetchTeam();
  }, [section]);

  useEffect(() => {
    if (showAddUser && newUserModules.length === 0) fetchModulesForNewUser();
  }, [showAddUser]);

  const fetchModulesForNewUser = async () => {
    setModulesLoading(true);
    try {
      const { data } = await api.get("/api/users/modules/list");
      setNewUserModules((data.modules || []).map(m => ({
        module_id:             m.id,
        module_key:            m.module_key,
        module_name:           m.module_name,
        can_view:              false,
        can_add:               false,
        can_edit:              false,
        can_delete:            false,
        can_bulk_upload:       false,
        can_export:            false,
        can_download_document: false,
      })));
    } catch { /* silent */ }
    finally { setModulesLoading(false); }
  };

  const updateNewUserModule = (modId, key, val) =>
    setNewUserModules(prev => prev.map(m => {
      if (m.module_id !== modId) return m;
      const updated = { ...m, [key]: val };
      if (val === true && ["can_add", "can_edit", "can_delete", "can_bulk_upload", "can_export", "can_download_document"].includes(key)) {
        updated.can_view = true;
      }
      return updated;
    }));

  const handleAllPerms = (checked) => {
    setAllPermsSelected(checked);
    setNewUserModules(prev => prev.map(m => {
      const availKeys = MODULE_PERM_CONFIG[m.module_key] || DEFAULT_MODULE_PERMS;
      return { ...m, ...Object.fromEntries(availKeys.map(k => [k, checked])) };
    }));
    // Bulk update Profile Section Perms too
    const nextProfilePerms = {};
    Object.keys(DEFAULT_PROFILE_PERMS).forEach(k => { nextProfilePerms[k] = { view: checked, edit: checked }; });
    setNewUserProfilePerms(nextProfilePerms);
  };

  const applyRoleDefaults = (role) => {
    if (role === "user") return; // Keep manual for user

    // Handle App Tab Permissions
    setNewUserModules(prev => prev.map(m => {
      const availKeys = MODULE_PERM_CONFIG[m.module_key] || DEFAULT_MODULE_PERMS;
      const updates = {};
      availKeys.forEach(k => {
        if (role === "super_admin") updates[k] = k !== "can_delete";
        if (role === "admin")       updates[k] = k === "can_view";
      });
      return { ...m, ...updates };
    }));

    // Handle Profile Management Access
    const nextProfilePerms = {};
    Object.keys(DEFAULT_PROFILE_PERMS).forEach(k => {
      if (role === "super_admin") nextProfilePerms[k] = { view: true, edit: true };
      if (role === "admin")       nextProfilePerms[k] = { view: true, edit: false };
    });
    setNewUserProfilePerms(nextProfilePerms);
    setAllPermsSelected(role === "super_admin");
  };

  const fetchTeam = async () => {
    setTeamLoading(true);
    try {
      const { data } = await api.get("/api/users");
      setMembers(data.users || []);
    } catch { showToast("Failed to load team", "error"); }
    finally { setTeamLoading(false); }
  };


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

  const handleCoverChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCoverLoading(true);
    try {
      const base64 = await resizeImage(file); // reuse helper
      const { data } = await api.post("/api/auth/cover", { cover: base64 });
      setCoverImage(data.url);
      const updated = { ...currentUser, profile_permissions: { ...currentUser.profile_permissions, ui: { ...currentUser.profile_permissions?.ui, cover_image: data.url } } };
      localStorage.setItem("bms_user", JSON.stringify(updated));
      onProfileUpdate?.(updated);
      showToast("Cover image updated");
    } catch (err) {
      showToast("Cover upload failed", "error");
    } finally { setCoverLoading(false); }
  };

  const changeHeaderTheme = async (themeValue) => {
    try {
      setHeaderTheme(themeValue);
      setCoverImage(null); // Clear image so theme is visible
      setShowThemePicker(false);
      
      // Update DB: Set theme AND nullify cover image
      await api.put("/api/auth/profile", { 
        header_theme: themeValue,
        cover_image: null 
      });

      const updated = { ...currentUser, profile_permissions: { ...currentUser.profile_permissions, ui: { ...currentUser.profile_permissions?.ui, header_theme: themeValue, cover_image: null } } };
      localStorage.setItem("bms_user", JSON.stringify(updated));
      onProfileUpdate?.(updated);
      showToast("Theme applied effectively");
    } catch { showToast("Failed to save theme", "error"); }
  };

  const deleteCover = async () => {
    setCoverImage(null);
    const updated = { ...currentUser, profile_permissions: { ...currentUser.profile_permissions, ui: { ...currentUser.profile_permissions?.ui, cover_image: null } } };
    localStorage.setItem("bms_user", JSON.stringify(updated));
    onProfileUpdate?.(updated);
    try { await api.delete("/api/auth/cover"); } catch { /* silent */ }
    showToast("Cover removed");
  };
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
      const u = JSON.parse(localStorage.getItem("bms_user") || "{}");
      const { data } = await api.post("/api/users", { ...newUser, profile_permissions: newUserProfilePerms, createdById: u.id || "", createdByName: u.name || "" });
      const userId = data.user?.id;
      if (userId && newUserModules.some(m => MODULE_PERM_KEYS.some(k => m[k.key]))) {
        await api.put(`/api/users/${userId}/permissions`, { permissions: newUserModules });
      }
      setNewUser({ name: "", email: "", contact_no: "", designation: "", department: "", role: "user" });
      setNewUserProfilePerms(DEFAULT_PROFILE_PERMS);
      setAllPermsSelected(false);
      setNewUserModules(prev => prev.map(m => ({ ...m, can_view: false, can_add: false, can_edit: false, can_delete: false, can_bulk_upload: false, can_export: false, can_download_document: false })));
      setShowAddUser(false); // Modal close karo
      showToast(`Invite sent to ${newUser.email}`);
      fetchTeam(); // List refresh karo
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

  /* ── Change role ── */
  const [editingRoleId, setEditingRoleId] = useState(null);
  const changeRole = (member, newRole) => {
    if (newRole === member.role) { setEditingRoleId(null); return; }
    setConfirmRoleChange({ member, newRole });
    setEditingRoleId(null);
  };

  const executeRoleChange = async (resetPermissions) => {
    if (!confirmRoleChange) return;
    const { member, newRole } = confirmRoleChange;
    setLoading(true);
    try {
      await api.put(`/api/users/${member.id}`, { role: newRole, reset_permissions: resetPermissions });
      setMembers(prev => prev.map(m => m.id === member.id ? { ...m, role: newRole } : m));
      showToast(`${member.name} ka role update hua ${resetPermissions ? "with default permissions" : ""}`);
    } catch (err) { 
      showToast(err.response?.data?.error || "Failed to update role", "error"); 
    } finally {
      setLoading(false);
      setConfirmRoleChange(null);
    }
  };

  /* ── Remove user (global_admin only) ── */
  const removeUser = async (member) => {
    if (!window.confirm(`"${member.name}" ko permanently delete karna chahte ho? Yeh action undo nahi ho sakta.`)) return;
    try {
      await api.delete(`/api/users/${member.id}`);
      setMembers(prev => prev.filter(m => m.id !== member.id));
      showToast(`${member.name} removed`);
    } catch (err) { showToast(err.response?.data?.error || "Failed to remove user", "error"); }
  };

  /* ── Permissions ── */
  const viewPerms = async (member) => {
    setPermUser(member);
    setPermFilter("all");
    setPermLoading(true);
    setPermissions([]); // PURANI VALUES CLEAR KARO
    setEditingProfilePerms(DEFAULT_PROFILE_PERMS); // PROFILE PERMS BHI RESET KARO
    try {
      const { data } = await api.get(`/api/users/${member.id}/permissions`);
      setPermissions(data.permissions || []);
      setEditingProfilePerms(data.profile_permissions || DEFAULT_PROFILE_PERMS);
    } catch { showToast("Failed to load permissions", "error"); }
    finally { setPermLoading(false); }
  };

  const updatePerm = (moduleId, key, value) =>
    setPermissions((prev) => prev.map((p) => {
      if (p.module_id !== moduleId) return p;
      const updated = { ...p, [key]: value };
      // Smart Toggle: If Edit/Delete/Add/Export/Download/Bulk is checked, View must be checked
      if (value === true && ["can_add", "can_edit", "can_delete", "can_bulk_upload", "can_export", "can_download_document"].includes(key)) {
        updated.can_view = true;
      }
      return updated;
    }));

  const savePerms = async () => {
    setPermLoading(true);
    try {
      await api.put(`/api/users/${permUser.id}/permissions`, { 
        permissions, 
        profile_permissions: editingProfilePerms 
      });
      showToast("Permissions saved");
    } catch { showToast("Failed to save permissions", "error"); }
    finally { setPermLoading(false); }
  };


  const badge = ROLE_BADGE[currentUser.role] || ROLE_BADGE.user;

  /* Serialization */
  const [serSites,    setSerSites]    = useState([]);
  const [serConfigs,  setSerConfigs]  = useState([]);
  const [orderSerConfigs, setOrderSerConfigs] = useState([]);
  const [serLoading,  setSerLoading]  = useState(false);
  const [serSaving,   setSerSaving]   = useState(null); // siteId being saved
  const [serTab, setSerTab] = useState("intake"); // "intake" | "order"

  useEffect(() => {
    if (section === "serialization" && isGlobalAdmin) fetchSerData();
  }, [section]);

  const fetchSerData = async () => {
    setSerLoading(true);
    try {
      const [sitesRes, configsRes, orderRes] = await Promise.all([
        fetch(`${API}/api/procurement/sites`).then(r => r.json()),
        fetch(`${API}/api/intakes/serialization`).then(r => r.json()),
        fetch(`${API}/api/orders/serialization`).then(r => r.json())
      ]);
      setSerSites(sitesRes.sites || []);
      setSerConfigs(configsRes.configs || []);
      setOrderSerConfigs(orderRes.configs || []);
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

  const currentFY = () => {
    const d = new Date();
    const m = d.getMonth();
    const y = d.getFullYear();
    const fy = m >= 3 ? y : y - 1;
    return `${fy}-${String(fy + 1).slice(-2)}`;
  };

  const getOrderSerConfig = (siteId) => {
    const fy = currentFY();
    return orderSerConfigs.find(c => c.site_id === siteId && c.financial_year === fy) || { financial_year: fy };
  };

  const updateOrderSerConfig = (siteId, field, value) => {
    setOrderSerConfigs(prev => {
      const fy = currentFY();
      const exists = prev.find(c => c.site_id === siteId && c.financial_year === fy);
      if (exists) return prev.map(c => c.site_id === siteId && c.financial_year === fy ? { ...c, [field]: value } : c);
      return [...prev, { site_id: siteId, financial_year: fy, [field]: value }];
    });
  };

  const saveOrderSerConfig = async (site) => {
    const cfg = getOrderSerConfig(site.id);
    setSerSaving("order_" + site.id);
    try {
      const res = await fetch(`${API}/api/orders/serialization`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          site_id: site.id,
          financial_year: cfg.financial_year,
          current_number: parseInt(cfg.current_number) || 0
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      showToast(`Order sequence saved for ${site.siteName}`);
      fetchSerData();
    } catch { showToast("Failed to save sequence", "error"); }
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

  const pp = currentUser.profile_permissions || {};
  const TABS = [
    { id: "profile",       label: "Personal info",  show: true },
    { id: "security",      label: "Security",        show: true },
    { id: "team",          label: "Manage Users",    show: isGlobalAdmin || !!pp.manage_user?.view   },
    { id: "projects",      label: "Projects",        show: isGlobalAdmin || !!pp.add_project?.view   },
    { id: "serialization", label: "Serialization",   show: isGlobalAdmin || !!pp.serialization?.view },
    { id: "approval_flow", label: "Approval Flow",   show: isGlobalAdmin || !!pp.approval_flow?.view },
  ].filter(t => t.show);

  const accessLabel = currentUser.role === "global_admin" ? "Global" : currentUser.role === "super_admin" ? "Super" : currentUser.role === "admin" ? "Admin" : "Standard";
  const roleLabel   = ROLE_BADGE[currentUser.role]?.label || "User";

  /* ══ RENDER ══ */
  return (
    <div className="min-h-screen bg-[#f0f2f5] p-4 md:p-6">
      {toast && <Toast msg={toast.msg} type={toast.type} />}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
      <input ref={coverFileRef} type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />

      <div className="space-y-4">

        {/* ── CUSTOMIZABLE PROFILE HEADER CARD ── */}
        <div className="relative group/header transition-all duration-500 rounded-3xl shadow-xl hover:shadow-2xl overflow-visible">

          {/* BACKGROUND LAYER (Handles Image & Gradient) */}
          <div className="absolute inset-0 rounded-3xl overflow-hidden transition-all duration-500 pointer-events-none" 
            style={{ 
              background: coverImage ? `url(${coverImage}) center/cover no-repeat` : headerTheme,
            }}>
            {/* Darker Overlay for maximum readability */}
            <div className={`absolute inset-0 transition-opacity duration-300 ${coverImage ? "bg-black/40 backdrop-blur-[1px]" : "bg-black/10"}`} />
            
            {/* Subtle Gradient from bottom to ensure text pop */}
            <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-80" />
          </div>

          {/* Theme/Image Controls (Placed outside overflow-hidden for dropdown visibility) */}
          <div className="absolute top-5 right-5 flex items-center gap-3 opacity-0 group-hover/header:opacity-100 transition-all duration-300 z-50">
            {/* Palette Button */}
            <div className="relative">
              <button 
                onClick={() => setShowThemePicker(!showThemePicker)}
                className="w-10 h-10 rounded-xl bg-black/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-black/40 transition-all shadow-xl active:scale-90"
                title="Change Theme"
              >
                <LayoutDashboard size={20} />
              </button>
              
              <AnimatePresence>
                {showThemePicker && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 15, scale: 0.9 }}
                    className="absolute right-0 top-full mt-4 w-64 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-200/50 p-4 z-[100] origin-top-right overflow-visible"
                    style={{ position: "absolute", right: 0 }}
                  >
                    <div className="flex items-center justify-between mb-4 px-1">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Premium Themes</p>
                      <button onClick={() => setShowThemePicker(false)} className="text-slate-300 hover:text-slate-500 transition-colors"><X size={14} /></button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      {GRADIENTS.map((g) => (
                        <button 
                          key={g.name}
                          onClick={() => changeHeaderTheme(g.value)}
                          className={`h-12 rounded-2xl border-2 transition-all hover:scale-110 shadow-sm active:scale-90 ${headerTheme === g.value ? "border-indigo-500 ring-4 ring-indigo-500/10" : "border-slate-100"}`}
                          style={{ background: g.value }}
                          title={g.name}
                        />
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => { setCoverImage(null); deleteCover(); setShowThemePicker(false); }}
                      className="w-full mt-5 py-3 text-[10px] font-black text-slate-400 hover:text-red-500 transition-all uppercase tracking-[0.2em] border-t border-slate-100 flex items-center justify-center gap-2"
                    >
                      <Trash2 size={12} /> Reset Background
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Camera Button */}
            <button 
              onClick={() => coverFileRef.current.click()}
              className="w-10 h-10 rounded-xl bg-black/20 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-black/40 transition-all shadow-xl active:scale-90"
              title="Upload Cover"
            >
              {coverLoading ? <Loader2 size={18} className="animate-spin" /> : <Camera size={20} />}
            </button>
          </div>

          {/* CONTENT LAYER */}
          <div className="relative flex flex-col md:flex-row items-center gap-6 z-20 p-6 md:p-10">

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


            {/* ─── MANAGE USERS ─── */}
            {section === "team" && (isGlobalAdmin || !!pp.manage_user?.view) && (
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
                        {permissions.length === 0 ? (
                          <p className="py-6 text-center text-sm text-slate-400">No modules found</p>
                        ) : (
                          <div className="space-y-6">
                            {/* Profile Management Section */}
                            <div className="border-b border-slate-100 pb-5">
                              <p className={lbl + " mb-3"}>Profile Management Access</p>
                              <div className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
                                <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-100 bg-slate-100/60">
                                  <span className="flex-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Section</span>
                                  <span className="w-14 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">View</span>
                                  <span className="w-14 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">Edit</span>
                                </div>
                                {PROFILE_SECTIONS.map(sec => (
                                  <div key={sec.key} className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-50 last:border-0">
                                    <span className="flex-1 text-sm font-medium text-slate-700">{sec.label}</span>
                                    {["view", "edit"].map(k => (
                                      <div key={k} className="w-14 flex justify-center">
                                        <input type="checkbox"
                                          checked={editingProfilePerms[sec.key]?.[k] || false}
                                          onChange={e => {
                                            setEditingProfilePerms(prev => ({
                                              ...prev,
                                              [sec.key]: { ...prev[sec.key], [k]: e.target.checked }
                                            }));
                                          }}
                                          className="w-4 h-4 rounded accent-blue-600" />
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* App Tab Permissions */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className={lbl}>App Tab Permissions</p>
                                    <label className="flex items-center gap-2 cursor-pointer select-none">
                                        <input type="checkbox"
                                            checked={permissions.length > 0 && permissions.every(m => {
                                                const availKeys = MODULE_PERM_CONFIG[m.module_key] || DEFAULT_MODULE_PERMS;
                                                return availKeys.every(k => m[k]);
                                            })}
                                            onChange={e => {
                                                const checked = e.target.checked;
                                                setPermissions(prev => prev.map(m => {
                                                    const availKeys = MODULE_PERM_CONFIG[m.module_key] || DEFAULT_MODULE_PERMS;
                                                    return { ...m, ...Object.fromEntries(availKeys.map(k => [k, checked])) };
                                                }));
                                                // Also sync profile perms for consistency
                                                const next = {};
                                                Object.keys(DEFAULT_PROFILE_PERMS).forEach(k => { next[k] = { view: checked, edit: checked }; });
                                                setEditingProfilePerms(next);
                                            }}
                                            className="w-4 h-4 rounded accent-blue-600" />
                                        <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Select All Modules</span>
                                    </label>
                                </div>
                                <GroupedPermissions modules={permissions} onChange={updatePerm} />
                            </div>
                          </div>
                        )}
                        <div className="mt-2">
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
                  <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-black text-slate-800 tracking-tight">User Management</h2>
                        {!teamLoading && (
                          <div className="flex items-center gap-3 mt-0.5">
                            <p className="text-xs font-medium text-slate-500">
                              Total {members.length} team member{members.length !== 1 ? "s" : ""}
                            </p>
                            <div className="h-3 w-px bg-slate-200" />
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                              <button
                                onClick={() => setViewType("list")}
                                className={`p-1 rounded-md transition-all ${viewType === "list" ? "bg-white shadow-sm text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
                                title="List View"
                              >
                                <Briefcase size={14} />
                              </button>
                              <button
                                onClick={() => setViewType("tile")}
                                className={`p-1 rounded-md transition-all ${viewType === "tile" ? "bg-white shadow-sm text-blue-600" : "text-slate-400 hover:text-slate-600"}`}
                                title="Tile View"
                              >
                                <LayoutDashboard size={14} />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      {(isGlobalAdmin || !!pp.manage_user?.edit) && (
                        <button 
                          onClick={() => setShowAddUser(true)}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
                        >
                          <UserPlus size={16} />
                          Add New User
                        </button>
                      )}
                    </div>

                    {teamLoading ? (
                      <div className="flex justify-center py-16">
                        <Loader2 size={32} className="animate-spin text-blue-500" />
                      </div>
                    ) : members.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <Users className="text-slate-300" size={32} />
                        </div>
                        <p className="text-sm font-medium text-slate-400">No team members found.</p>
                      </div>
                    ) : (
                      <div className={viewType === "tile" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-5 animate-in fade-in slide-in-from-bottom-2 duration-300" : "divide-y divide-slate-50"}>
                        {members.map((m) => {
                          const mb = ROLE_BADGE[m.role] || ROLE_BADGE.user;
                          const initials = m.name?.split(" ").map(n => n[0]).join("").toUpperCase() || "?";
                          
                          if (viewType === "tile") {
                            return (
                              <div key={m.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group p-5 relative">
                                <div className="flex flex-col items-center text-center">
                                  {/* Avatar */}
                                  <div className="relative mb-3">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl overflow-hidden shadow-sm ring-4 ${m.is_active ? "ring-green-50" : "ring-red-50"}`}
                                      style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
                                      {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full object-cover" /> : initials}
                                    </div>
                                    <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${m.is_active ? "bg-green-500" : "bg-red-500"}`} />
                                  </div>

                                  <h3 className="font-bold text-slate-800 text-[15px] truncate max-w-full">{m.name}</h3>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{m.designation || "No Title"}</p>
                                  
                                  <div className="mt-3 flex flex-col gap-1.5 w-full">
                                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                                      <Mail size={12} className="opacity-60" />
                                      <span className="truncate">{m.email}</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                                      <Building2 size={12} className="opacity-60" />
                                      <span>{m.department || "General"}</span>
                                    </div>
                                  </div>

                                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                                    <div className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg ${mb.color}`}>
                                      {mb.label.toUpperCase()}
                                    </div>
                                    {m.is_active === false && (
                                      <div className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-100 uppercase">
                                        Inactive
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Hover Actions */}
                                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100">
                                  {canManage(currentUser.role, m.role, m.id) && (isGlobalAdmin || !!pp.manage_user?.edit) && (
                                    <>
                                      <button onClick={() => viewPerms(m)} title="Permissions"
                                        className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                        <ShieldCheck size={16} />
                                      </button>
                                      <button onClick={() => toggleActive(m)} title={m.is_active ? "Deactivate" : "Activate"}
                                        className={`p-2 rounded-xl transition-all shadow-sm
                                          ${m.is_active ? "bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white" : "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white"}`}>
                                        {m.is_active ? <XCircle size={16} /> : <CheckCircle2 size={16} />}
                                      </button>
                                      <button onClick={() => removeUser(m)} title="Remove"
                                        className="p-2 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                        <Trash2 size={16} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          }

                          // Default List View (Existing layout)
                          return (
                            <div key={m.id}
                              className="group flex flex-col md:flex-row md:items-center justify-between p-5 hover:bg-slate-50/50 transition-all gap-4">
                              <div className="flex items-center gap-4 min-w-0">
                                {/* Avatar with status ring */}
                                <div className="relative shrink-0">
                                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-base overflow-hidden shadow-sm ring-2 ${m.is_active ? "ring-green-100" : "ring-red-100"}`}
                                    style={{ background: "linear-gradient(135deg, #3b82f6, #8b5cf6)" }}>
                                    {m.avatar ? <img src={m.avatar} alt="" className="w-full h-full object-cover" /> : initials}
                                  </div>
                                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${m.is_active ? "bg-green-500" : "bg-red-500"}`} />
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-baseline gap-2 mb-0.5">
                                    <p className="font-bold text-[15px] text-slate-800 tracking-tight truncate">{m.name}</p>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.department || "General"}</span>
                                  </div>
                                  <div className="flex items-center gap-3 text-xs text-slate-500 mb-1.5">
                                    <span className="flex items-center gap-1"><Mail size={12} className="opacity-60" /> {m.email}</span>
                                    {m.contact_no && <span className="flex items-center gap-1"><Phone size={12} className="opacity-60" /> {m.contact_no}</span>}
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {/* Role Select / Badge */}
                                    {canManage(currentUser.role, m.role, m.id) && editingRoleId === m.id ? (
                                      <select
                                        autoFocus
                                        className="text-[11px] font-bold px-2 py-1 rounded-lg border border-blue-400 bg-white text-slate-700 outline-none shadow-sm"
                                        defaultValue={m.role}
                                        onChange={e => changeRole(m, e.target.value)}
                                        onBlur={() => setEditingRoleId(null)}>
                                        {getManageableRoles(currentUser.role).map(r => (
                                          <option key={r} value={r}>{ROLE_BADGE[r]?.label || r}</option>
                                        ))}
                                      </select>
                                    ) : (
                                      <div
                                        onClick={() => canManage(currentUser.role, m.role, m.id) && setEditingRoleId(m.id)}
                                        className={`flex items-center gap-1.5 text-[10px] font-black px-3 py-1 rounded-lg transition-all ${mb.color} ${canManage(currentUser.role, m.role, m.id) ? "cursor-pointer hover:shadow-md" : ""}`}
                                      >
                                        {mb.label.toUpperCase()}
                                        {canManage(currentUser.role, m.role, m.id) && <Pencil size={10} className="opacity-60" />}
                                      </div>
                                    )}
                                    {m.designation && (
                                      <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-wide">
                                        <Briefcase size={10} /> {m.designation}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Actions - Premium Buttons */}
                              <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                {canManage(currentUser.role, m.role, m.id) && (isGlobalAdmin || !!pp.manage_user?.edit) && (
                                  <>
                                    <button onClick={() => viewPerms(m)} title="Manage Permissions"
                                      className="p-2.5 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm">
                                      <ShieldCheck size={18} />
                                    </button>
                                    <button onClick={() => toggleActive(m)} title={m.is_active ? "Deactivate User" : "Activate User"}
                                      className={`p-2.5 rounded-xl transition-all shadow-sm
                                        ${m.is_active ? "bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white" : "bg-green-50 text-green-600 hover:bg-green-600 hover:text-white"}`}>
                                      {m.is_active ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
                                    </button>
                                    <button onClick={() => removeUser(m)} title="Remove User"
                                      className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                      <Trash2 size={18} />
                                    </button>
                                  </>
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
            {section === "projects" && (isGlobalAdmin || !!pp.add_project?.view) && (
              <ManageProjects isGlobalAdmin={isGlobalAdmin} permissions={pp.add_project} onProjectsUpdate={onProjectsUpdate} />
            )}

            {/* ─── SERIALIZATION ─── */}
            {section === "serialization" && (isGlobalAdmin || !!pp.serialization?.view) && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                      <KeyRound size={17} className="text-indigo-600" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-800">Serialization</h2>
                      <p className="text-xs text-slate-500">Configure document number series per site</p>
                    </div>
                  </div>
                  
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button onClick={() => setSerTab("intake")}
                      className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${serTab === "intake" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}>
                      Intake
                    </button>
                    <button onClick={() => setSerTab("order")}
                      className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${serTab === "order" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}>
                      Purchase / Work Order
                    </button>
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
                    {serTab === "intake" ? (
                      <>
                        {/* Header row for Intake */}
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
                      </>
                    ) : (
                      <>
                        {/* Header row for Order */}
                        <div className="grid grid-cols-12 gap-3 px-4 pb-1">
                          <div className="col-span-3"><span className={lbl}>Site</span></div>
                          <div className="col-span-2"><span className={lbl}>Financial Year</span></div>
                          <div className="col-span-3"><span className={lbl}>Start From Next Serial</span></div>
                          <div className="col-span-2"><span className={lbl}>Example Format</span></div>
                          <div className="col-span-2"><span className={lbl}>Action</span></div>
                        </div>
                        {serSites.map(site => {
                          const cfg = getOrderSerConfig(site.id);
                          const fy = cfg.financial_year || currentFY();
                          const next = parseInt(cfg.current_number) || 0;
                          // Dynamic preview like the backend logic: "COMP/SITE/PO/FY/001"
                          const preview = `CMP/${site.siteCode || "S"}/PO/${fy}/${String(next + 1).padStart(3, "0")}`;
                          
                          return (
                            <div key={site.id} className="grid grid-cols-12 gap-3 items-center p-4 rounded-xl border border-slate-100 bg-slate-50 hover:border-indigo-200 transition-all">
                              <div className="col-span-3">
                                <p className="text-sm font-semibold text-slate-700">{site.siteName}</p>
                                {site.siteCode && <p className="text-xs text-slate-400 font-mono">{site.siteCode}</p>}
                              </div>
                              <div className="col-span-2">
                                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-slate-200 text-slate-700 border border-slate-300">
                                   {fy}
                                </span>
                              </div>
                              <div className="col-span-3">
                                <input
                                  type="number"
                                  min="0"
                                  className={inp}
                                  value={cfg.current_number !== undefined ? cfg.current_number : 0}
                                  onChange={e => updateOrderSerConfig(site.id, "current_number", e.target.value)}
                                  title="0 means next PO will be 1"
                                />
                                <p className="text-[10px] text-slate-400 mt-1">If 0, next document is 001</p>
                              </div>
                              <div className="col-span-2 text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-1.5 rounded-lg border border-indigo-100 truncate w-full"
                                   title={preview}>
                                 {preview.length > 18 ? preview.slice(0, 18) + '...' : preview}
                              </div>
                              <div className="col-span-2 flex items-center justify-end gap-2">
                                <button
                                  onClick={() => saveOrderSerConfig(site)}
                                  disabled={serSaving === "order_" + site.id}
                                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all">
                                  {serSaving === "order_" + site.id ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                  Save
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ─── APPROVAL FLOW ─── */}
            {section === "approval_flow" && (isGlobalAdmin || !!pp.approval_flow?.view) && (
               <ApprovalConfig showToast={showToast} />
            )}


      {/* ─── ADD USER MODAL ─── */}
      <AnimatePresence>
        {showAddUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddUser(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
              
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
              
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                    <UserPlus size={20} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight">Add New Member</h3>
                    <p className="text-xs font-medium text-slate-400 mt-0.5">Invite a colleague to your team</p>
                  </div>
                </div>
                <button onClick={() => setShowAddUser(false)} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 transition-colors">
                  <XCircle size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <form id="add-member-form" onSubmit={addMember} className="space-y-8">
                  {/* Basic Info */}
                  <div>
                    <div className={secHeader}>
                      <p className={secTitle}>Basic Details</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div><span className={lbl}>Full Name *</span><input className={inp} placeholder="e.g. John Doe" value={newUser.name} onChange={(e) => setNewUser((p) => ({ ...p, name: e.target.value }))} required /></div>
                      <div><span className={lbl}>Email Address *</span><input type="email" className={inp} placeholder="john@example.com" value={newUser.email} onChange={(e) => setNewUser((p) => ({ ...p, email: e.target.value }))} required /></div>
                      <div><span className={lbl}>Phone Number</span><input className={inp} placeholder="+91 00000 00000" value={newUser.contact_no} onChange={(e) => setNewUser((p) => ({ ...p, contact_no: e.target.value }))} /></div>
                      <div><span className={lbl}>Designation</span><input className={inp} placeholder="Product Manager" value={newUser.designation} onChange={(e) => setNewUser((p) => ({ ...p, designation: e.target.value }))} /></div>
                      <div><span className={lbl}>Department</span><input className={inp} placeholder="Operations" value={newUser.department} onChange={(e) => setNewUser((p) => ({ ...p, department: e.target.value }))} /></div>
                      <div>
                        <span className={lbl}>Role Access</span>
                        <select className={inp} value={newUser.role}
                          onChange={(e) => { const newRole = e.target.value; setNewUser((p) => ({ ...p, role: newRole })); applyRoleDefaults(newRole); }}>
                          {getManageableRoles(currentUser.role).includes("super_admin") && <option value="super_admin">Super Admin (Organization)</option>}
                          {getManageableRoles(currentUser.role).includes("admin") && <option value="admin">Administrator (Team)</option>}
                          <option value="user">Standard User (Staff)</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Profile Perms */}
                  <div>
                    <div className="flex items-center gap-2 mb-5 border-l-4 border-purple-500 pl-4 py-1">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Management Access</p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden shadow-sm">
                      <div className="flex items-center gap-4 px-6 py-4 bg-slate-50/80 border-b border-slate-100">
                        <span className="w-48 shrink-0 text-[10px] font-black uppercase tracking-widest text-slate-400">Platform Section</span>
                        <span className="w-20 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">View</span>
                        <span className="w-20 text-center text-[10px] font-black uppercase tracking-widest text-slate-400">Edit</span>
                      </div>
                      {PROFILE_SECTIONS.map(sec => (
                        <div key={sec.key} className="flex items-center gap-4 px-6 py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                          <span className="w-48 shrink-0 text-[13px] font-bold text-slate-700">{sec.label}</span>
                          {["view", "edit"].map(k => (
                            <div key={k} className="w-20 flex justify-center">
                              <input type="checkbox" checked={newUserProfilePerms[sec.key]?.[k] || false}
                                onChange={e => setNewUserProfilePerms(prev => ({ ...prev, [sec.key]: { ...prev[sec.key], [k]: e.target.checked } }))}
                                className="w-5 h-5 rounded-md accent-purple-600 cursor-pointer shadow-sm" />
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Tab Perms */}
                  <div className="pb-4">
                    <div className="flex items-center justify-between mb-4 border-l-4 border-emerald-500 pl-3">
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Module Permissions</p>
                      <label className="flex items-center gap-2 cursor-pointer group">
                        <input type="checkbox" checked={allPermsSelected} onChange={e => handleAllPerms(e.target.checked)} className="w-4 h-4 rounded accent-emerald-600" />
                        <span className="text-[10px] font-black text-slate-400 group-hover:text-emerald-600 uppercase tracking-widest transition-colors">Full Grant</span>
                      </label>
                    </div>
                    {modulesLoading ? <div className="flex justify-center p-8"><Loader2 className="animate-spin text-emerald-500" /></div> : <GroupedPermissions modules={newUserModules} onChange={updateNewUserModule} />}
                  </div>
                </form>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
                <button onClick={() => setShowAddUser(false)} className="px-5 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
                <button form="add-member-form" type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center gap-2">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <SendHorizonal size={16} />}
                  Send Invitation
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* ─── ROLE CHANGE CONFIRMATION MODAL ─── */}
      <AnimatePresence>
        {confirmRoleChange && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setConfirmRoleChange(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" />
              
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20">
              
              <div className="p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4 border border-amber-100">
                  <ShieldAlert size={32} className="text-amber-500" />
                </div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight mb-2">Update User Role?</h3>
                <p className="text-sm font-medium text-slate-500 leading-relaxed px-4">
                  Aap <span className="font-bold text-slate-800">{confirmRoleChange.member.name}</span> ka role <span className="text-blue-600 font-bold uppercase tracking-wider">{confirmRoleChange.newRole}</span> par change kar rahe hain.
                  <br /><br />
                  Kya aap permissions ko bhi reset karna chahte hain?
                </p>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
                <button 
                  onClick={() => executeRoleChange(true)}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Confirm & Reset to {confirmRoleChange.newRole} Defaults
                </button>
                <button 
                  onClick={() => executeRoleChange(false)}
                  className="w-full py-3 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-2xl text-sm font-bold transition-all active:scale-95"
                >
                  Change Role Only (Keep Current Perms)
                </button>
                <button 
                  onClick={() => setConfirmRoleChange(null)}
                  className="w-full py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

        </div>
      </div>
    </div>
  );
}

