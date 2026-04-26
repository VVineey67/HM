import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Store, ShieldCheck, Image as ImageIcon,
  LogOut, Briefcase, ChevronDown, ChevronRight,
  Info, Box, CalendarCheck, IndianRupee, ClipboardList,
  FileSpreadsheet, Settings2, ChevronsUpDown, PackagePlus,
  Database, History,
} from "lucide-react";

const toSubId = (parentId, subLabel) =>
  `${parentId}__${subLabel.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}`;

const globalMenu = [
  { id: "about",       label: "Team Zyrex",       icon: Info           },
  { id: "boq_prepare", label: "BOQ Prepare",       icon: FileSpreadsheet },
  { id: "create",      label: "Create",            icon: PackagePlus,
    sub: ["Intake", "Order"] },
  { id: "proc_setup",  label: "Procurement Setup", icon: Settings2,
    sub: ["Company List","Site List","Vendor List","UOM","Category List","Item List","Term Condition","Payment Terms","Government Laws","Contact List","Annexure"] },
  { id: "master_data", label: "Master Data",       icon: Database,
    sub: ["Vendor Master Data", "Item Master Data"] },
  { id: "audit",       label: "Audit",             icon: History         },
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
    sub: ["Order Dashboard","Intake Dashboard"] },
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
// Map of sidebar tab ID → module_key in DB
const TAB_MODULE_KEY = {
  boq_prepare:                    "boq_prepare",
  create__intake:                 "intake",
  create__order:                  "order",
  proc_setup__company_list:       "company_list",
  proc_setup__site_list:          "site_list",
  proc_setup__vendor_list:        "vendor_list",
  proc_setup__uom:                "uom",
  proc_setup__category_list:      "category_list",
  proc_setup__item_list:          "item_list",
  proc_setup__term_condition:     "term_condition",
  proc_setup__payment_terms:      "payment_terms",
  proc_setup__government_laws:    "government_laws",
  proc_setup__contact_list:       "contact_list",
  proc_setup__annexure:           "annexure",
  dashboard:                      "dashboard",
  view_3d:                        "view_3d",
  confidential__loa:              "loa",
  confidential__boq:              "boq",
  confidential__drawings:         "drawings",
  confidential__ra_bills:         "ra_bills",
  finance__payment_request:       "payment_request",
  finance__site_expense:          "site_expense",
  finance__petty_cash:            "petty_cash",
  finance__bills_docs:            "bills_docs",
  work__execution_plan:           "execution_plan",
  work__msp_plan:                 "msp_plan",
  staff:                          "staff_attendance",
  manpower__daily_manpower:       "daily_manpower",
  manpower__all_record:           "manpower_all_record",
  store__received_record:         "received_record",
  store__local_purchase:          "local_purchase",
  store__consumption_record:      "consumption_record",
  store__stock_available:         "stock_available",
  store__grn_docs:                "grn_docs",
  procurement__order_dashboard:   "order_dashboard",
  procurement__intake_dashboard:  "intake_dashboard",
  images__all_images:             "all_images",
  images__compare_images:         "compare_images",
  approvals__config:              "approval_workflows",
  master_data:                    "master_data",
  master_data__vendor_master_data: "master_data",
  master_data__item_master_data:   "master_data",
  audit:                          "audit",
};

/* ─── Z brand mark (image, no frame) ─── */
const ZMark = ({ size = 52 }) => (
  <img
    src="/Z.png"
    alt="Zyrex"
    style={{ width: size, height: size }}
    className="object-contain shrink-0"
  />
);

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
  userEmail = "support@zyrex.app",
  currentUser: currentUserProp = null,
  projects: projectsProp = null,
  userTabPermissions = null,
}) => {
  const currentUser = currentUserProp || (() => { try { return JSON.parse(localStorage.getItem("bms_user") || "{}"); } catch { return {}; } })();
  const [openSub, setOpenSub]   = useState(null);
  const [projOpen, setProjOpen] = useState(false);
  const isGlobalAdmin = currentUser.role === "global_admin";

  // Check if a tab is visible based on permissions
  // Rule: global_admin always sees all. Others: if userTabPermissions is set and has_any_permissions,
  // only show tabs where can_view = true. If no permissions set → show all (backward compat).
  const isTabVisible = (tabId) => {
    if (tabId === "about" || tabId === "profile") return true; // always visible
    if (isGlobalAdmin) return true;
    
    // If permissions haven't loaded yet (null), keep gated tabs hidden
    if (!userTabPermissions) return false; 
    
    // If no permission map or specifically no any permissions, hide all gated
    if (!userTabPermissions.hasAny || !userTabPermissions.map) return false;
    const moduleKey = TAB_MODULE_KEY[tabId];
    if (!moduleKey) return true;
    const perm = userTabPermissions.map?.[moduleKey];
    if (!perm) return true; // module not in DB → show
    return perm.can_view === true;
  };

  const projects = projectsProp || [];
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
    // Filter sub-items by permission
    const visibleSubs = item.sub?.filter(s => isTabVisible(toSubId(item.id, s)));
    // Hide parent if it has subs and none are visible; hide leaf item if not visible
    if (item.sub && visibleSubs.length === 0) return null;
    if (!item.sub && !isTabVisible(item.id)) return null;

    const Icon      = item.icon;
    const isActive  = activeTab === item.id || visibleSubs?.some(s => toSubId(item.id, s) === activeTab) || item.sub?.some(s => toSubId(item.id, s) === activeTab);
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
                ? "bg-cyan-400/10 text-white ring-1 ring-cyan-400/25"
                : "text-[#8b95a3] hover:bg-cyan-400/5 hover:text-cyan-100"
              }
            `}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon
                size={17}
                strokeWidth={isActive ? 2 : 1.6}
                className={`shrink-0 transition-colors ${isActive ? "text-cyan-300" : "text-[#5a6878] group-hover:text-cyan-300"}`}
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

                {(visibleSubs || item.sub).map((sub) => {
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
      animate={{ width: collapsed ? "60px" : "240px" }}
      transition={{ duration: 0.22, ease: "easeInOut" }}
      className="h-screen flex flex-col shrink-0 overflow-hidden print:hidden"
      style={{ background: "#06111f", borderRight: "1px solid rgba(34,211,238,0.12)" }}
    >
      {/* ── HEADER ── */}
      <div className={`relative shrink-0 border-b ${collapsed ? "px-2 py-2 flex justify-center" : "px-3 py-2"}`}
        style={{ borderColor: "rgba(34,211,238,0.12)" }}>
        {collapsed ? (
          <button onClick={() => setIsCollapsed(false)} title="Expand" className="flex items-center justify-center">
            <img src="/Z.png" alt="Zyrex" className="h-8 w-auto object-contain" />
          </button>
        ) : (
          <>
            <img
              src="/Z.png"
              alt="Zyrex ERP Solutions"
              className="block w-[85%] h-auto object-contain mx-auto"
            />
            <button onClick={() => setIsCollapsed(true)}
              title="Collapse"
              className="absolute top-1 right-1 text-[#48484a] hover:text-cyan-400 transition-colors p-1 rounded hover:bg-white/5 z-10">
              <ChevronsUpDown size={13} />
            </button>
          </>
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
                  style={{ background: "#0a1828", border: "1px solid rgba(34,211,238,0.18)" }}
                >
                  {projects.map(p => {
                    const name    = typeof p === "string" ? p : p.name;
                    const logoUrl = typeof p === "object" ? p.logoUrl : null;
                    return (
                      <button key={name}
                        onClick={() => { setSelectedProject(name); setProjOpen(false); }}
                        className={`w-full text-left px-3 py-2 text-[12.5px] transition-all flex items-center gap-2
                          ${selectedProject === name ? "text-white font-semibold bg-cyan-400/10" : "text-[#8b95a3] hover:bg-cyan-400/5 hover:text-cyan-100"}`}
                      >
                        {logoUrl ? (
                          <img src={logoUrl} alt={name} className="w-5 h-5 rounded object-cover shrink-0" />
                        ) : (
                          selectedProject === name && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                        )}
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
            {(() => {
              const activePrj = projects.find(p => (typeof p === "string" ? p : p.name) === selectedProject);
              const logo = activePrj && typeof activePrj === "object" ? activePrj.logoUrl : null;
              return logo ? (
                <img src={logo} alt={selectedProject} className="w-8 h-8 rounded-lg object-cover" />
              ) : (
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold text-[#8b8b8f]"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  {selectedProject ? selectedProject.slice(0, 3).toUpperCase() : "PRJ"}
                </div>
              );
            })()}
          </button>
        )}

        {/* PROJECT MENU */}
        <div className="space-y-0.5">
          {projectMenu.map(item => renderItem(item, false))}
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="shrink-0 px-2 py-2" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
        {!collapsed ? (
          <div className="rounded-xl px-2.5 py-2 flex items-center gap-2.5"
            style={{ background: "rgba(34,211,238,0.05)", border: "1px solid rgba(34,211,238,0.15)" }}>
            <button onClick={() => setActiveTab("profile")} className="flex items-center gap-2.5 flex-1 min-w-0 text-left">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 overflow-hidden ring-2 ring-cyan-400/20"
                style={{ background: "linear-gradient(135deg,#0891b2,#22d3ee)" }}>
                {currentUser.avatar
                  ? <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                  : (currentUser.name || userName).split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-white truncate leading-tight">{currentUser.name || userName}</p>
                <p className="text-[10px] text-[#48484a] mt-0.5 truncate">{currentUser.email || userEmail}</p>
              </div>
            </button>
            <button onClick={onLogout} title="Logout"
              className="text-[#48484a] hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5 shrink-0">
              <LogOut size={13} />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <button onClick={() => setActiveTab("profile")} title="Profile">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold text-white overflow-hidden ring-2 ring-cyan-400/20"
                style={{ background: "linear-gradient(135deg,#0891b2,#22d3ee)" }}>
                {currentUser.avatar
                  ? <img src={currentUser.avatar} alt="" className="w-full h-full object-cover" />
                  : (currentUser.name || userName).split(" ").map(n => n[0]).join("").slice(0,2).toUpperCase()
                }
              </div>
            </button>
            <button onClick={onLogout} title="Logout"
              className="text-[#48484a] hover:text-red-400 transition-colors">
              <LogOut size={12} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default Sidebar;
