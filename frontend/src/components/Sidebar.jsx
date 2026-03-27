import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Store,
  ShieldCheck,
  Image as ImageIcon,
  LogOut,
  Briefcase,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Info,
  Search,
  Box,
  CalendarCheck,
  IndianRupee,
  ClipboardList,
} from "lucide-react";
 
const Sidebar = ({
  activeTab = "dashboard",
  setActiveTab,
  selectedProject,
  setSelectedProject,
  isCollapsed,
  setIsCollapsed,
  onLogout,
  onClose,           // ← Mobile close button ke liye
  isMobile = false,
  userName = "Jitendar Goyal",
  profileImage,
}) => {
  const [openSub, setOpenSub] = useState(null);
  const [projectOpen, setProjectOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
 
  const projects = [
    "B-47","GDLV","BHA","SLH","HIH","RWH","JEX","SBGM","HKD","RSTF","VRI","JANPURAEXT",
  ];
 
  const menuConfig = [
    { id: "about", label: "Team Bootes", icon: Info },
    { id: "view_3d", label: "3D View", icon: Box },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    {
      id: "confidential",
      label: "Confidential",
      icon: ShieldCheck,
      sub: ["LOA", "BOQ", "Drawings", "RA Bills"],
    },
    {
      id: "finance",
      label: "Finance",
      icon: IndianRupee,
      sub: ["Payment Request", "Site Expense", "Petty Cash", "Bills Docs"],
    },
    {
      id: "work",
      label: "Work Activity",
      icon: Briefcase,
      sub: ["Execution Plan", "MSP Plan"],
    },
    { id: "staff", label: "Staff Attendance", icon: CalendarCheck },
    {
      id: "manpower",
      label: "Manpower",
      icon: Users,
      sub: ["Daily Manpower", "All Record"],
    },
    {
      id: "store",
      label: "Store",
      icon: Store,
      sub: ["Received Record","Local Purchase","Consumption Record","Stock Available","GRN Docs"],
    },
    {
      id: "procurement",
      label: "Procurement",
      icon: ClipboardList,
      sub: ["Payment Request","Purchase Request","Purchase Order","Order Record"],
    },
    {
      id: "images",
      label: "Images",
      icon: ImageIcon,
      sub: ["All Images", "Compare Images"],
    },
  ];
 
  // Mobile pe collapsed kabhi nahi hoga
  const collapsed = isMobile ? false : isCollapsed;
 
  const toggleSub = (id) => {
    if (collapsed) return;
    setOpenSub(openSub === id ? null : id);
  };
 
  const userInitial = userName.charAt(0).toUpperCase();
 
  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? "80px" : "260px" }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-screen bg-[#0b1022] text-white flex flex-col border-r border-white/10 overflow-hidden"
    >
      {/* ===== HEADER ===== */}
      <div className="h-16 md:h-20 flex items-center px-4 shrink-0 relative border-b border-white/10">
        <div className="flex items-center gap-3 w-full">
          {/* Logo */}
          <div className="h-9 w-9 md:h-10 md:w-10 bg-white rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <img src="/logo.png" className="h-6 w-6 md:h-7 md:w-7 object-contain" />
          </div>
 
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
            >
              <p className="font-bold text-base md:text-lg leading-tight">BOOTES</p>
              <p className="text-[10px] text-blue-400">Monitoring System</p>
            </motion.div>
          )}
        </div>
 
        {/* ✅ MOBILE pe X button - sidebar band karne ke liye */}
        {isMobile && (
          <button
            onClick={onClose}
            className="ml-auto text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        )}
 
        {/* Desktop pe collapse button */}
        {!isMobile && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 bg-[#0b1022] border border-white/10 rounded-full p-1 z-10"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}
      </div>
 
      {/* ===== SCROLLABLE CONTENT ===== */}
      <div className="flex-1 px-2 py-3 overflow-y-auto overflow-x-hidden">
 
        {/* PROJECT SELECTOR */}
        {!collapsed && (
          <div className="mb-4">
            <button
              onClick={() => setProjectOpen(!projectOpen)}
              className="w-full flex justify-between items-center px-3 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm transition-colors"
            >
              <span className="truncate text-left">
                {selectedProject || "Select Project"}
              </span>
              <ChevronDown
                size={14}
                className={`shrink-0 ml-2 transition-transform ${projectOpen ? "rotate-180" : ""}`}
              />
            </button>
 
            <AnimatePresence>
              {projectOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 bg-black/30 p-2 rounded-lg overflow-hidden"
                >
                  <div className="flex items-center gap-2 bg-white/5 rounded px-2 mb-2">
                    <Search size={12} className="text-gray-400 shrink-0" />
                    <input
                      placeholder="Search project..."
                      className="w-full bg-transparent text-xs py-1.5 outline-none text-white placeholder-gray-500"
                      onChange={(e) => setProjectSearch(e.target.value)}
                      value={projectSearch}
                    />
                  </div>
 
                  <div className="max-h-40 overflow-y-auto space-y-0.5">
                    {projects
                      .filter((p) =>
                        p.toLowerCase().includes(projectSearch.toLowerCase())
                      )
                      .map((p) => (
                        <div
                          key={p}
                          onClick={() => {
                            setSelectedProject(p);
                            setProjectOpen(false);
                            setProjectSearch("");
                          }}
                          className={`p-2 text-xs rounded cursor-pointer transition-colors
                            ${selectedProject === p
                              ? "bg-white text-black font-semibold"
                              : "hover:bg-white/10 text-gray-300"
                            }`}
                        >
                          {p}
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
 
        {/* Collapsed state mein project icon */}
        {collapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            title={selectedProject || "Select Project"}
            className="w-full flex justify-center py-2 mb-3"
          >
            <div className="h-8 w-8 bg-white/10 rounded-lg flex items-center justify-center text-xs font-bold">
              {selectedProject ? selectedProject.charAt(0) : "P"}
            </div>
          </button>
        )}
 
        {/* ===== MENU ITEMS ===== */}
        <div className="space-y-0.5">
          {menuConfig.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id || activeTab.startsWith(item.id + "_");
            const isSubOpen = openSub === item.id;
 
            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (item.sub) {
                      toggleSub(item.id);
                    } else {
                      setActiveTab(item.id);
                    }
                  }}
                  title={collapsed ? item.label : ""}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                    ${isActive
                      ? "bg-white text-black font-semibold shadow-sm"
                      : "text-gray-400 hover:bg-white/10 hover:text-white"
                    }
                    ${collapsed ? "justify-center" : "justify-between"}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={17} className="shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!collapsed && item.sub && (
                    <ChevronDown
                      size={13}
                      className={`shrink-0 transition-transform text-gray-500 ${isSubOpen ? "rotate-180" : ""}`}
                    />
                  )}
                </button>
 
                {/* SUB MENU */}
                <AnimatePresence>
                  {!collapsed && item.sub && isSubOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 pl-3 border-l border-white/10 mt-1 mb-1 space-y-0.5">
                        {item.sub.map((sub) => {
                          const subId = `${item.id}_${sub.toLowerCase().replace(/ /g, "_")}`;
                          const isSubActive = activeTab === subId;
                          return (
                            <button
                              key={sub}
                              onClick={() => setActiveTab(subId)}
                              className={`w-full text-left text-xs py-2 px-2 rounded-md transition-colors
                                ${isSubActive
                                  ? "text-white bg-white/10 font-medium"
                                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                                }`}
                            >
                              {sub}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
 
      {/* ===== FOOTER ===== */}
      <div className={`p-3 border-t border-white/10 shrink-0 ${collapsed ? "flex flex-col items-center gap-2" : ""}`}>
        {!collapsed ? (
          <>
            <div className="flex items-center gap-2 mb-2 px-1">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{userName}</p>
                <p className="text-[10px] text-gray-500">Active</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg text-xs transition-colors"
            >
              <LogOut size={13} />
              Logout
            </button>
          </>
        ) : (
          <>
            <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-sm font-bold">
              {userInitial}
            </div>
            <button onClick={onLogout} title="Logout" className="text-red-400 hover:text-red-300 p-1">
              <LogOut size={16} />
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};
 
export default Sidebar;