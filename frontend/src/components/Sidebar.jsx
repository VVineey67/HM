import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Store, ShieldCheck, Image as ImageIcon,
  LogOut, Briefcase, ChevronDown, ChevronLeft, ChevronRight, X,
  Info, Search, Box, CalendarCheck, IndianRupee, ClipboardList, FileSpreadsheet,
} from "lucide-react";

// --- HELPERS & CONFIG ---
const toSubId = (parentId, subLabel) => {
  return `${parentId}__${subLabel.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")}`;
};

const globalMenu = [
  { id: "about", label: "Team Bootes", icon: Info },
  { id: "boq_prepare", label: "BOQ Prepare", icon: FileSpreadsheet },
];

const projectMenu = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "view_3d", label: "3D View", icon: Box },
  { id: "confidential", label: "Confidential", icon: ShieldCheck, sub: ["LOA", "BOQ", "Drawings", "RA Bills"] },
  { id: "finance", label: "Finance", icon: IndianRupee, sub: ["Payment Request", "Site Expense", "Petty Cash", "Bills Docs"] },
  { id: "work", label: "Work Activity", icon: Briefcase, sub: ["Execution Plan", "MSP Plan"] },
  { id: "staff", label: "Staff Attendance", icon: CalendarCheck },
  { id: "manpower", label: "Manpower", icon: Users, sub: ["Daily Manpower", "All Record"] },
  { id: "store", label: "Store", icon: Store, sub: ["Received Record", "Local Purchase", "Consumption Record", "Stock Available", "GRN Docs"] },
  { id: "procurement", label: "Procurement", icon: ClipboardList, sub: ["Payment Request", "Purchase Request", "Purchase Order", "Order Record"] },
  { id: "images", label: "Images", icon: ImageIcon, sub: ["All Images", "Compare Images"] },
];

const thinScrollbarStyle = `
  .ultra-thin-scroll::-webkit-scrollbar { width: 3px !important; }
  .ultra-thin-scroll::-webkit-scrollbar-track { background: transparent !important; }
  .ultra-thin-scroll::-webkit-scrollbar-thumb { background-color: rgba(255, 255, 255, 0.1) !important; border-radius: 10px !important; }
`;

const SidebarTooltip = ({ label, children, show }) => {
  const [pos, setPos] = React.useState(null);

  const handleMouseEnter = (e) => {
    if (!show) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setPos({ top: rect.top + rect.height / 2, left: rect.right + 10 });
  };

  return (
    <div onMouseEnter={handleMouseEnter} onMouseLeave={() => setPos(null)}>
      {children}
      {show && pos && (
        <div
          style={{ position: "fixed", top: pos.top, left: pos.left, transform: "translateY(-50%)", zIndex: 9999 }}
          className="bg-[#1e2a45] text-white text-xs font-medium px-3 py-1.5 rounded-lg shadow-xl border border-white/10 whitespace-nowrap pointer-events-none"
        >
          {label}
          <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#1e2a45]" />
        </div>
      )}
    </div>
  );
};

const Sidebar = ({
  activeTab = "dashboard",
  setActiveTab,
  selectedProject,
  setSelectedProject,
  isCollapsed,
  setIsCollapsed,
  onLogout,
  onClose,
  isMobile = false,
  userName = "Jitendar Goyal",
}) => {
  const [openSub, setOpenSub] = useState(null);
  const [projectOpen, setProjectOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");

  const projects = ["All Project","B-47", "GDLV", "BHA", "SLH", "HIH", "RWH"];
  const collapsed = isMobile ? false : isCollapsed;
  const userInitial = userName.charAt(0).toUpperCase();
  const filteredProjects = projects.filter((p) => p.toLowerCase().includes(projectSearch.toLowerCase()));

  const handleItemClick = (item, isGlobal = false) => {
    if (item.sub) {
      if (collapsed) {
        setIsCollapsed(false);
        setOpenSub(item.id);
      } else {
        setOpenSub(openSub === item.id ? null : item.id);
      }
    } else {
      setActiveTab(item.id);
      setOpenSub(null);
      if (isGlobal) setSelectedProject("Select Project");
    }
  };

  const renderMenuItem = (item, isGlobal = false) => {
    const Icon = item.icon;
    const active = activeTab === item.id || (item.sub && item.sub.some(s => toSubId(item.id, s) === activeTab));
    
    return (
      <div key={item.id}>
        <SidebarTooltip label={item.label} show={collapsed}>
          <button
            onClick={() => handleItemClick(item, isGlobal)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm mb-1 transition-all
              ${active ? "bg-white text-black font-semibold shadow-sm" : "text-gray-400 hover:bg-white/10 hover:text-white"}
              ${collapsed ? "justify-center" : "justify-between"}`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <Icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </div>
            {!collapsed && item.sub && <ChevronDown size={13} className={`transition-transform duration-200 ${openSub === item.id ? "rotate-180" : ""}`} />}
          </button>
        </SidebarTooltip>

        <AnimatePresence>
          {!collapsed && item.sub && openSub === item.id && (
            <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden ml-4 pl-3 border-l border-white/10 mb-2">
              {item.sub.map((subLabel) => (
                <button
                  key={subLabel}
                  onClick={() => setActiveTab(toSubId(item.id, subLabel))}
                  className={`w-full text-left text-xs py-2 px-2 rounded-md transition-colors ${activeTab === toSubId(item.id, subLabel) ? "text-white bg-white/15" : "text-gray-500 hover:text-gray-300"}`}
                >
                  {subLabel}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <>
      <style>{thinScrollbarStyle}</style>

      <motion.div 
        animate={{ width: collapsed ? "70px" : "260px" }} 
        className="h-screen bg-[#0b1022] text-white flex flex-col border-r border-white/10 overflow-hidden"
      >
        
        {/* HEADER SECTION */}
        <div className={`flex items-center border-b border-white/10 shrink-0 p-4 relative ${collapsed ? "flex-col gap-4 justify-center" : "h-20"}`}>
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : "w-full"}`}>
            <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-inner">
              <img src="/logo.png" className="h-7 w-7" alt="logo" />
            </div>
            {!collapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="font-bold text-lg leading-tight tracking-tight">BOOTES</p>
                <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Monitoring System </p>
              </div>
            )}
          </div>

          {/* HIDE/SHOW BUTTON */}
          {!isMobile && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              title={collapsed ? "Expand" : "Collapse"}
              className={`${collapsed ? "relative" : "absolute right-3"} bg-white/5 border border-white/10 rounded-full p-1.5 hover:bg-white/10 transition-colors shadow-sm`}
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          )}
        </div>

        {/* MENU CONTENT */}
        <div className="flex-1 px-2 py-4 overflow-y-auto ultra-thin-scroll">
          <div className="mb-6">
            {!collapsed && <p className="text-[10px] text-gray-500 font-bold px-3 mb-3 uppercase tracking-widest">Global</p>}
            {globalMenu.map(item => renderMenuItem(item, true))}
          </div>

          <div className="h-px bg-white/5 my-4 mx-2" />

          {/* PROJECT SELECTOR */}
          <div className="mb-4">
            {!collapsed ? (
              <div className="px-1 mb-4">
                <p className="text-[10px] text-gray-500 font-bold px-2 mb-3 uppercase tracking-widest">Project</p>
                <button onClick={() => setProjectOpen(!projectOpen)} className="w-full flex justify-between items-center px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm border border-white/5">
                  <span className="truncate font-medium">{selectedProject || "Select Project"}</span>
                  <ChevronDown size={14} className={`${projectOpen ? "rotate-180" : ""} transition-transform`} />
                </button>
                <AnimatePresence>
                  {projectOpen && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="mt-2 bg-[#12182d] rounded-lg overflow-hidden border border-white/10 shadow-2xl">
                       <div className="max-h-40 overflow-y-auto p-1 ultra-thin-scroll">
                        {projects.map(p => (
                          <div key={p} onClick={() => { setSelectedProject(p); setProjectOpen(false); }} className={`p-2 text-xs rounded cursor-pointer ${selectedProject === p ? "bg-white text-black font-bold" : "hover:bg-white/10 text-gray-300"}`}>{p}</div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
               <div className="flex justify-center mb-6 cursor-pointer" onClick={() => setIsCollapsed(false)} title="Select Project">
                  <div className="h-9 w-9 bg-white/5 rounded-lg flex items-center justify-center text-[10px] font-bold text-blue-400 border border-blue-400/20">PROJ</div>
               </div>
            )}

            <div className="space-y-0.5">
              {projectMenu.map(item => renderMenuItem(item, false))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className={`p-4 border-t border-white/10 shrink-0 ${collapsed ? "flex flex-col items-center gap-4" : ""}`}>
          {!collapsed ? (
            <>
              <div className="flex items-center gap-3 mb-3 px-1">
                <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-xs font-bold border border-white/10">
                  {userInitial}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{userName}</p>
                  <p className="text-[10px] text-green-500 font-bold">ONLINE</p>
                </div>
              </div>
              <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-400/10 rounded-lg text-xs font-bold transition-colors">
                <LogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <button onClick={onLogout} title="Logout" className="text-red-400 hover:bg-red-400/10 p-2.5 rounded-lg">
              <LogOut size={18} />
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;