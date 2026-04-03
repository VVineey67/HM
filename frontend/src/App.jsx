import React, { useState, useEffect } from "react";
import Login from "./pages/Login";
import Sidebar from "./components/Sidebar";
 
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

// Images
import AllImages from "./pages/Images/AllImages";
import CompareImages from "./pages/Images/CompareImages";
 
// Attendance
import Attendance from "./pages/Attendance/Attendance";
 
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => !!localStorage.getItem("bms_role"));
  const [userRole, setUserRole] = useState(() => localStorage.getItem("bms_role") || null);
  const [activeTab, setActiveTab] = useState("about");
  const [selectedProject, setSelectedProject] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogin = (role) => {
    localStorage.setItem("bms_role", role);
    setUserRole(role);
    setIsLoggedIn(true);
    setActiveTab("about");
  };

  const handleLogout = () => {
    localStorage.removeItem("bms_role");
    setIsLoggedIn(false);
    setUserRole(null);
    setSelectedProject(null);
    setActiveTab("about");
  };
 
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (isMobile) setMobileOpen(false);
  };
 
  useEffect(() => {
    if (activeTab === "about") setSelectedProject(null);
  }, [activeTab]);
 
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
    if (activeTab === "profile") return <Profile />;

    // Global procurement setup tabs — no project needed
    if (activeTab === "proc_setup__item_list") return <ItemList />;
    if (activeTab === "proc_setup__vendor_list") return <VendorList />;
    if (activeTab === "proc_setup__company_list") return <CompanyList />;
    if (activeTab === "proc_setup__term_condition") return <TermCondition />;
    if (activeTab === "proc_setup__payment_terms") return <PaymentTerms />;
    if (activeTab === "proc_setup__government_laws") return <GovernmentLaws />;
    if (activeTab === "proc_setup__site_list") return <SiteList />;
    if (activeTab === "proc_setup__uom") return <UOMList />;
 
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
      case "procurement__order_record": return <OrderRecord project={selectedProject} />;
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
          setSelectedProject={setSelectedProject}
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isMobile={isMobile}
          onClose={() => setMobileOpen(false)}
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
          flex-1 flex flex-col transition-all duration-300 min-h-screen w-full
          ${!isMobile ? (isCollapsed ? "ml-[80px]" : "ml-[260px]") : "ml-0"}
        `}
      >
        <main className={`flex-1 w-full min-h-screen overflow-auto relative
          ${isMobile ? "pt-14 px-3 pb-4" : "p-4"}
        `}>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
 
export default App;