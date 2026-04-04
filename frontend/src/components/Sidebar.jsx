import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Store, ShieldCheck, Image as ImageIcon,
  LogOut, Briefcase, ChevronDown, ChevronRight,
  Info, Box, CalendarCheck, IndianRupee, ClipboardList,
  FileSpreadsheet, Settings2, ChevronsUpDown,
} from "lucide-react";

const toSubId = (parentId, subLabel) =>
  `${parentId}__${subLabel.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}`;

const globalMenu = [
  { id: "about",       label: "Team Bootes",      icon: Info           },
  { id: "boq_prepare", label: "BOQ Prepare",       icon: FileSpreadsheet },
  { id: "proc_setup",  label: "Procurement Setup", icon: Settings2,
    sub: ["Company List","Site List","Vendor List","UOM","Item List","Term Condition","Payment Terms","Government Laws"] },
];

const projectMenu = [
  { id: "dashboard",    label: "Dashboard",       icon: LayoutDashboard },
  { id: "view_3d",      label: "3D View",          icon: Box             },
  { id: "confidential", label: "Confidential",     icon: ShieldCheck,
    sub: ["LOA","BOQ","Drawings","RA Bills"] },
  { id: "finance",      label: "Finance",          icon: IndianRupee,
    sub: ["Payment Request","Site Expense","Petty Cash","Bills Docs"] },
  { id: "work",         label: "Work Activity",    icon: Briefcase,
    sub: ["Execution Plan","MSP Plan"] },
  { id: "staff",        label: "Staff Attendance", icon: CalendarCheck   },
  { id: "manpower",     label: "Manpower",         icon: Users,
    sub: ["Daily Manpower","All Record"] },
  { id: "store",        label: "Store",            icon: Store,
    sub: ["Received Record","Local Purchase","Consumption Record","Stock Available","GRN Docs"] },
  { id: "procurement",  label: "Procurement",      icon: ClipboardList,
    sub: ["Create Order","Order Record"] },
  { id: "images",       label: "Images",           icon: ImageIcon,
    sub: ["All Images","Compare Images"] },
];

/* ─── Tooltip for collapsed ─── */
const Tip = ({ label, show, children }) => {
  const [xy, setXY] = React.useState(null);
  return (
    <div
      onMouseEnter={e => { if (!show) return; const r = e.currentTarget.getBoundingClientRect(); setXY({ top: r.top + r.height / 2, left: r.right + 8 }); }}
      onMouseLeave={() => setXY(null)}
    >
      {children}
      {show && xy && (
        <div style={{ position:"fixed", top:xy.top, left:xy.left, transform:"translateY(-50%)", zIndex:9999 }}
          className="pointer-events-none whitespace-nowrap rounded-md bg-[#2a2a2d] px-2.5 py-1.5 text-xs font-medium text-white shadow-xl ring-1 ring-white/10">
          {label}
        </div>
      )}
    </div>
  );
};

/* ════════════════════════════ */
const Sidebar = ({
  activeTab = "about",
  setActiveTab,
  selectedProject,
  setSelectedProject,
  isCollapsed,
  setIsCollapsed,
  onLogout,
  isMobile = false,
  userName = "Jitendar Goyal",
  userEmail = "jitendar@bootes.in",
  currentUser: currentUserProp = null,
  projects: projectsProp = null,
}) => {
  const currentUser = currentUserProp || (() => { try { return JSON.parse(localStorage.getItem("bms_user") || "{}"); } catch { return {}; } })();
  const [openSub, setOpenSub]   = useState(null);
  const [projOpen, setProjOpen] = useState(false);

  const projects = projectsProp || ["All Project","B-47","GDLV","BHA","SLH","HIH","RWH"];
  const collapsed = isMobile ? false : isCollapsed;
  const initials  = userName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  const handleClick = (item, isGlobal) => {
    if (item.sub) {
      if (collapsed) { setIsCollapsed(false); setOpenSub(item.id); }
      else setOpenSub(openSub === item.id ? null : item.id);
    } else {
      setActiveTab(item.id);
      setOpenSub(null);
      if (isGlobal) setSelectedProject(null);
    }
  };

  const renderItem = (item, isGlobal = false) => {
    const Icon      = item.icon;
    const isActive  = activeTab === item.id || item.sub?.some(s => toSubId(item.id, s) === activeTab);
    const isOpen    = openSub === item.id;

    return (
      <div key={item.id}>
        <Tip label={item.label} show={collapsed}>
          <button
            onClick={() => handleClick(item, isGlobal)}
            className={`
              group w-full flex items-center gap-3 rounded-lg px-2.5 py-2 text-[13.5px]
              font-medium transition-all duration-100 mb-0.5
              ${collapsed ? "justify-center" : "justify-between"}
              ${isActive
                ? "bg-white/[.08] text-white"
                : "text-[#8b8b8f] hover:bg-white/[.05] hover:text-[#d1d1d6]"
              }
            `}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon
                size={17}
                strokeWidth={isActive ? 2 : 1.6}
                className={`shrink-0 transition-colors ${isActive ? "text-white" : "text-[#636366] group-hover:text-[#aeaeb2]"}`}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </div>
            {!collapsed && item.sub && (
              <ChevronDown
                size={13}
                className={`shrink-0 transition-transform duration-200 ${isActive ? "text-[#636366]" : "text-[#3a3a3c]"} ${isOpen ? "rotate-180" : ""}`}
              />
            )}
          </button>
        </Tip>

        {/* Sub-items — track line + dot design */}
        <AnimatePresence initial={false}>
          {!collapsed && item.sub && isOpen && (
            <motion.div
              key="sub"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="relative ml-[22px] mt-1 mb-2">
                {/* Vertical track line */}
                <div className="absolute left-[5px] top-0 bottom-0 w-px bg-[#2c2c2e]" />

                {item.sub.map((sub) => {
                  const subId    = toSubId(item.id, sub);
                  const isSubAct = activeTab === subId;
                  return (
                    <button
                      key={sub}
                      onClick={() => setActiveTab(subId)}
                      className="relative w-full text-left flex items-center gap-3 py-1.5 pl-5 pr-3 rounded-lg transition-all duration-100 group"
                      style={isSubAct ? { background: "rgba(255,255,255,0.06)" } : {}}
                    >
                      {/* Dot on track */}
                      <span className={`
                        absolute left-[2px] w-[7px] h-[7px] rounded-full border-2 transition-all shrink-0
                        ${isSubAct
                          ? "bg-white border-white"
                          : "bg-[#1c1c1e] border-[#3a3a3c] group-hover:border-[#636366]"
                        }
                      `} />
                      <span className={`text-[12.5px] truncate transition-colors ${isSubAct ? "text-white font-semibold" : "text-[#636366] group-hover:text-[#aeaeb2]"}`}>
                        {sub}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? "60px" : "248px" }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      className="h-screen flex flex-col shrink-0 overflow-hidden"
      style={{ background: "#1c1c1e", borderRight: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* ── HEADER ── */}
      <div className={`shrink-0 px-3 py-3 border-b flex items-center gap-2.5 ${collapsed ? "justify-center" : "justify-between"}`}
        style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-md">
            <img src="/logo.png" className="w-5 h-5" alt="logo" />
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-[13.5px] font-bold text-white leading-none truncate">BOOTES</p>
              <p className="text-[10px] text-[#636366] mt-0.5 truncate">bootes.in</p>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-[#636366] hover:text-[#aeaeb2] transition-colors shrink-0">
            <ChevronsUpDown size={15} />
          </button>
        )}
        {collapsed && (
          <button onClick={() => setIsCollapsed(false)}
            className="text-[#636366] hover:text-[#aeaeb2] transition-colors">
            <ChevronRight size={13} />
          </button>
        )}
      </div>


      {/* ── SCROLL ── */}
      <div className="flex-1 overflow-y-auto px-2 py-2" style={{ scrollbarWidth: "none" }}>

        {/* GLOBAL */}
        {!collapsed && (
          <p className="px-2.5 pt-1 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-[#48484a]">Global</p>
        )}
        <div className="space-y-0.5 mb-2">
          {globalMenu.map(item => renderItem(item, true))}
        </div>

        <div className="h-px mx-2 my-2" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* PROJECT */}
        {!collapsed ? (
          <div className="mb-2">
            <p className="px-2.5 pt-1 pb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-[#48484a]">Project</p>
            <button
              onClick={() => setProjOpen(!projOpen)}
              className="w-full flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium text-[#d1d1d6] transition-all hover:bg-white/5 mb-1"
            >
              <span className="truncate">{selectedProject || "Select project…"}</span>
              <ChevronDown size={13} className={`shrink-0 text-[#48484a] transition-transform ${projOpen ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {projOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="rounded-xl overflow-hidden mb-2 shadow-2xl"
                  style={{ background: "#2c2c2e", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  {projects.map(p => {
                    const name = typeof p === "string" ? p : p.name;
                    return (
                      <button key={name}
                        onClick={() => { setSelectedProject(name); setProjOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-[12.5px] transition-all flex items-center gap-2
                          ${selectedProject === name ? "text-white font-semibold bg-white/8" : "text-[#8b8b8f] hover:bg-white/5 hover:text-white"}`}
                      >
                        {selectedProject === name && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />}
                        {name}
                      </button>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button onClick={() => setIsCollapsed(false)} title="Select project" className="w-full flex justify-center mb-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold text-[#8b8b8f]"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {selectedProject ? selectedProject.slice(0, 3).toUpperCase() : "PRJ"}
            </div>
          </button>
        )}

        {/* PROJECT MENU */}
        <div className="space-y-0.5">
          {projectMenu.map(item => renderItem(item, false))}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="shrink-0 px-3 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        {!collapsed ? (
          <div className="w-full flex items-center gap-2.5 rounded-lg px-2 py-2 hover:bg-white/5 transition-all group">
            <button onClick={() => setActiveTab("profile")} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 overflow-hidden"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                {currentUser.avatar
                  ? <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                  : (currentUser.name || userName).split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12.5px] font-semibold text-white truncate leading-none">{currentUser.name || userName}</p>
                <p className="text-[11px] text-[#636366] mt-0.5 truncate">{currentUser.email || userEmail}</p>
              </div>
            </button>
            <button onClick={onLogout} title="Logout"
              className="text-[#48484a] hover:text-red-400 transition-colors p-1 rounded shrink-0">
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button onClick={() => setActiveTab("profile")} title="Profile">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
                style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}>
                {currentUser.avatar
                  ? <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                  : (currentUser.name || userName).split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()
                }
              </div>
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Sidebar;
