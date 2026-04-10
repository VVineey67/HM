import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Sidebar from "./components/Sidebar";

// Read current tab + project from URL hash
const parseHash = () => {
  const params = new URLSearchParams(window.location.hash.slice(1));
  return {
    tab:     params.get("tab")     || "about",
    project: params.get("project") || null,
    isReset:  params.get("type") === "recovery" || params.get("type") === "invite",
    isInvite: params.get("type") === "invite",
  };
};

// Write tab + project to URL (pushState so back-button works)
const pushUrl = (tab, project) => {
  const params = new URLSearchParams();
  params.set("tab", tab);
  if (project) params.set("project", project);
  window.history.pushState(null, "", `#${params.toString()}`);
};

import About from "./pages/About";
import Profile from "./pages/Profile";
 
import View3D from "./pages/Model";
import Dashboard from "./pages/Dashboard";
 
// Confidential
import LOA from "./pages/confidential/LOA";
import BOQ from "./pages/confidential/BOQ";
import Drawings from "./pages/confidential/Drawings";
import RABills from "./pages/confidential/RABills";
 
// Finance
import SiteExpense from "./pages/Finance/SiteExpense";
import PettyCash from "./pages/Finance/PettyCash";
import BillsDocs from "./pages/Finance/BillsDocs";
 
// Work Activity
import ExecutionPlan from "./pages/WorkActivity/ExecutionPlan";
import MSPPlan from "./pages/WorkActivity/MSPPlan";
 
// Manpower
import DailyManpower from "./pages/Manpower/DailyManpower";
import AllRecordManpower from "./pages/Manpower/AllRecord";
 
// Store
import ReceivedRecord from "./pages/Store/ReceivedRecord";
import LocalPurchase from "./pages/Store/LocalPurchase";
import ConsumptionRecord from "./pages/Store/ConsumptionRecord";
import StockAvailable from "./pages/Store/StockAvailable";
import GRNDocs from "./pages/Store/GRNDocs";

// Global Create
import GlobalCreateOrder from "./pages/Create/CreateOrder";
import IntakeList from "./pages/Create/IntakeList";

// Procurement
import ItemList from "./pages/Procurement/ItemList";
import VendorList from "./pages/Procurement/VendorList";
import CompanyList from "./pages/Procurement/CompanyList";
import CreateOrder from "./pages/Procurement/CreateOrder";
import OrderRecord from "./pages/Procurement/OrderRecord";
import TermCondition from "./pages/Procurement/TermCondition";
import PaymentTerms from "./pages/Procurement/PaymentTerms";
import GovernmentLaws from "./pages/Procurement/GovernmentLaws";
import SiteList from "./pages/Procurement/SiteList";
import UOMList from "./pages/Procurement/UOMList";
import CategoryList from "./pages/Procurement/CategoryList";
import ContactList from "./pages/Procurement/ContactList";
import AnnexureMaster from "./pages/Procurement/AnnexureMaster";
import ApprovalConfig from "./components/ApprovalConfig";

// Images
import AllImages from "./pages/Images/AllImages";
import CompareImages from "./pages/Images/CompareImages";
 
// Attendance
import Attendance from "./pages/Attendance/Attendance";
 
const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

function App() {
  // Detect Supabase password-recovery / invite redirect
  const [isResetMode, setIsResetMode]   = useState(() => parseHash().isReset);
  const [isInviteMode, setIsInviteMode] = useState(() => parseHash().isInvite);

  const loggedIn = !!localStorage.getItem("bms_token");
  const [isLoggedIn, setIsLoggedIn] = useState(() => loggedIn);
  const [userRole, setUserRole] = useState(() => {
    const u = localStorage.getItem("bms_user");
    return u ? JSON.parse(u).role : null;
  });
  const [currentUser, setCurrentUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("bms_user") || "{}"); } catch { return {}; }
  });
  // projects = [{ name: "All Project" }, ...active projects from DB]
  const [projects, setProjects] = useState([{ name: "All Project" }]);

  // Tab-level permissions for sidebar filtering
  // { hasAny: bool, map: { module_key: { can_view, can_edit, ... } } }
  const [userTabPermissions, setUserTabPermissions] = useState(() => {
    // If we have currentUser with app_permissions in localStorage, load it instantly
    if (currentUser?.app_permissions) {
      const permMap = {};
      currentUser.app_permissions.forEach(p => { permMap[p.module_key] = p; });
      return { hasAny: currentUser.app_permissions.length > 0, map: permMap };
    }
    return null;
  });

  // Restore tab + project from URL on load
  const [activeTab, setActiveTab] = useState(() => {
    const { isReset, tab } = parseHash();
    return (!isReset && loggedIn) ? tab : "about";
  });
  const [selectedProject, setSelectedProject] = useState(() => {
    const { isReset, project } = parseHash();
    return (!isReset && loggedIn) ? project : null;
  });

  const [editingOrderId, setEditingOrderId] = useState(null);

  const [isCollapsed, setIsCollapsed] = useState(() => localStorage.getItem("bms_sidebar_collapsed") === "true");

  const handleSetIsCollapsed = (val) => {
    const next = typeof val === "function" ? val(isCollapsed) : val;
    setIsCollapsed(next);
    localStorage.setItem("bms_sidebar_collapsed", String(next));
  };

  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const fetchProjects = async () => {
    try {
      const res  = await fetch(`${API}/api/projects`);
      const data = await res.json();
      const active = (data.projects || [])
        .filter(p => p.isActive)
        .map(p => ({ ...p, name: p.projectCode || p.projectName }));
      setProjects([{ name: "All Project" }, ...active]);
    } catch {
      setProjects([{ name: "All Project" }]);
    }
  };

  const fetchUserPermissions = async () => {
    const token = localStorage.getItem("bms_token");
    if (!token) return;
    try {
      const res  = await fetch(`${API}/api/auth/my-permissions`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const permMap = {};
      (data.permissions || []).forEach(p => { permMap[p.module_key] = p; });
      setUserTabPermissions({ hasAny: data.has_any_permissions, map: permMap });
    } catch { /* silent — don't break the app */ }
  };

  // Fetch projects + permissions whenever logged in
  useEffect(() => {
    if (isLoggedIn) { fetchProjects(); fetchUserPermissions(); }
  }, [isLoggedIn]);

  const handleLogin = (user) => {
    setUserRole(user.role);
    setCurrentUser(user);
    setIsLoggedIn(true);
    setActiveTab("about");
    pushUrl("about", null);
  };

  const handleLogout = () => {
    localStorage.removeItem("bms_token");
    localStorage.removeItem("bms_user");
    setIsLoggedIn(false);
    setUserRole(null);
    setCurrentUser({});
    setSelectedProject(null);
    setActiveTab("about");
    window.history.replaceState(null, "", window.location.pathname);
  };

  const handleProfileUpdate = (updatedUser) => {
    setCurrentUser(updatedUser);
  };

  const handleProjectsUpdate = () => {
    fetchProjects();
  };
 
  const handleTabChange = (tab) => {
    const proj = tab === "about" ? null : selectedProject;
    if (tab === "about") setSelectedProject(null);
    setActiveTab(tab);
    pushUrl(tab, proj);
    if (isMobile) setMobileOpen(false);
  };

  const handleSetSelectedProject = (project) => {
    setSelectedProject(project);
    pushUrl(activeTab, project);
  };

  // Browser back / forward button support
  useEffect(() => {
    const onPopState = () => {
      const { tab, project, isReset } = parseHash();
      if (isReset) return;
      setActiveTab(tab);
      setSelectedProject(project);
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
 
  useEffect(() => {
    const checkScreen = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) setMobileOpen(false);
    };
    checkScreen();
    window.addEventListener("resize", checkScreen);
    return () => window.removeEventListener("resize", checkScreen);
  }, []);
 
  const renderPage = () => {
    if (activeTab === "about") return <About />;
    if (activeTab === "profile") return <Profile onProfileUpdate={handleProfileUpdate} onProjectsUpdate={handleProjectsUpdate} />;

    // Global Create tabs
    if (activeTab === "create__intake") return <IntakeList />;
    if (activeTab === "create__order")  return <GlobalCreateOrder editOrderId={editingOrderId} onEditComplete={() => setEditingOrderId(null)} />;

    // Global procurement setup tabs — no project needed
    if (activeTab === "proc_setup__item_list") return <ItemList />;
    if (activeTab === "proc_setup__vendor_list") return <VendorList />;
    if (activeTab === "proc_setup__company_list") return <CompanyList />;
    if (activeTab === "proc_setup__term_condition") return <TermCondition />;
    if (activeTab === "proc_setup__payment_terms") return <PaymentTerms />;
    if (activeTab === "proc_setup__government_laws") return <GovernmentLaws />;
    if (activeTab === "proc_setup__site_list") return <SiteList />;
    if (activeTab === "proc_setup__uom") return <UOMList />;
    if (activeTab === "proc_setup__category_list") return <CategoryList />;
    if (activeTab === "proc_setup__contact_list") return <ContactList />;
    if (activeTab === "proc_setup__annexure") return <AnnexureMaster />;
    if (activeTab === "approvals__config") return <ApprovalConfig showToast={(msg, type) => alert(`${type?.toUpperCase()}: ${msg}`)} />;
 
    if (!selectedProject) {
      return (
        <div className="flex min-h-screen items-center justify-center p-4 md:p-10 bg-[#f8fafc]">
          <div className="bg-white p-8 md:p-20 rounded-2xl md:rounded-[3rem] shadow-sm border border-slate-100 flex items-center justify-center w-full max-w-4xl">
            <p className="text-slate-400 font-bold uppercase tracking-wider md:tracking-[0.3em] text-center text-sm md:text-base">
              Please select a project first
            </p>
          </div>
        </div>
      );
    }
 
    switch (activeTab) {
      case "dashboard": return <Dashboard project={selectedProject} />;
      case "view_3d": return <View3D project={selectedProject} />;
      case "confidential_loa": return <LOA project={selectedProject} />;
      case "confidential_boq": return <BOQ project={selectedProject} />;
      case "confidential_drawings": return <Drawings project={selectedProject} />;
      case "confidential_ra_bills": return <RABills project={selectedProject} />;
      case "finance_site_expense": return <SiteExpense project={selectedProject} />;
      case "finance_petty_cash": return <PettyCash project={selectedProject} />;
      case "finance_bills_docs": return <BillsDocs project={selectedProject} />;
      case "work_execution_plan": return <ExecutionPlan project={selectedProject} />;
      case "work_msp_plan": return <MSPPlan project={selectedProject} />;
      case "manpower_daily_manpower": return <DailyManpower project={selectedProject} />;
      case "manpower_all_record": return <AllRecordManpower project={selectedProject} />;
      case "store_received_record": return <ReceivedRecord project={selectedProject} />;
      case "store_local_purchase": return <LocalPurchase project={selectedProject} />;
      case "store_consumption_record": return <ConsumptionRecord project={selectedProject} />;
      case "store_stock_available": return <StockAvailable project={selectedProject} />;
      case "store_grn_docs": return <GRNDocs project={selectedProject} />;
      case "procurement__create_order": return <CreateOrder project={selectedProject} />;
      case "procurement__order_record": return (
        <OrderRecord 
          project={selectedProject} 
          onEdit={(id) => { setEditingOrderId(id); setActiveTab("create__order"); }} 
        />
      );
      case "images_all_images": return <AllImages project={selectedProject} />;
      case "images_compare_images": return <CompareImages project={selectedProject} />;
      case "staff": return <Attendance selectedProject={selectedProject} />;
      default:
        return (
          <div className="flex min-h-screen items-center justify-center text-slate-400 font-bold text-xl uppercase tracking-widest">
            Page not created yet: {activeTab}
          </div>
        );
    }
  };
 
  if (isResetMode) return <ResetPassword isInvite={isInviteMode} onComplete={() => { setIsResetMode(false); setIsInviteMode(false); window.history.replaceState(null, "", "/"); }} />;
  if (!isLoggedIn) return <Login onLogin={handleLogin} />;
 
  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
 
      {/* ✅ HAMBURGER - sirf tab dikhega jab sidebar BAND ho */}
      {isMobile && !mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-3 left-3 z-50 bg-[#0b1022] text-white w-10 h-10 rounded-lg flex items-center justify-center shadow-lg text-lg"
        >
          ☰
        </button>
      )}
 
      {/* ✅ SIDEBAR */}
      <div
        className={`
          fixed top-0 left-0 h-full z-40 transition-transform duration-300
          ${isMobile
            ? mobileOpen ? "translate-x-0" : "-translate-x-full"
            : "translate-x-0"
          }
        `}
      >
        <Sidebar
          activeTab={activeTab}
          setActiveTab={handleTabChange}
          userRole={userRole}
          onLogout={handleLogout}
          selectedProject={selectedProject}
          setSelectedProject={handleSetSelectedProject}
          isCollapsed={isCollapsed}
          setIsCollapsed={handleSetIsCollapsed}
          isMobile={isMobile}
          onClose={() => setMobileOpen(false)}
          currentUser={currentUser}
          projects={projects}
          userTabPermissions={userTabPermissions}
        />
      </div>
 
      {/* ✅ BACKDROP */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setMobileOpen(false)}
        />
      )}
 
      {/* ✅ MAIN CONTENT */}
      <div
        className={`
          flex-1 flex flex-col transition-all duration-300 min-h-screen min-w-0
          ${!isMobile ? (isCollapsed ? "ml-[56px]" : "ml-[220px]") : "ml-0"}
        `}
      >
        <main className={`flex-1 min-w-0 min-h-screen overflow-y-auto relative
          ${isMobile ? "pt-14 px-3 pb-4" : "p-3 sm:p-4 lg:p-6"}
        `}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
 
export default App;