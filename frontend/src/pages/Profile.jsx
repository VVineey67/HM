import React, { useState } from "react";
import * as Icon from "lucide-react";

// --- CONSTANTS & DATA ---
const ALL_TABS_DATA = [
  { name: "Team Bootes", icon: <Icon.Layout size={14} /> },
  { name: "3D View", icon: <Icon.Layout size={14} /> },
  { name: "Dashboard", icon: <Icon.Layout size={14} /> },
  { name: "Finance", icon: <Icon.CreditCard size={14} />, hasSubTabs: true },
  { name: "Manpower", icon: <Icon.Users size={14} /> },
  { name: "Staff Attendance", icon: <Icon.Layout size={14} /> },
  { name: "Store", icon: <Icon.Package size={14} /> },
  { name: "Procurement", icon: <Icon.Download size={14} /> },
  { name: "Images", icon: <Icon.Image size={14} /> },
  { name: "Work Activity", icon: <Icon.Activity size={14} />, hasSubTabs: true },
  { name: "Confidential", icon: <Icon.ShieldCheck size={14} />, hasSubTabs: true }
];

const SUB_TABS_MAP = {
  "Finance": ["Site Expense", "Petty Cash", "Bill Docs"],
  "Work Activity": ["Execution Plan", "MSP Plan Docs"],
  "Confidential": ["LOA", "BOQ", "RA-BILL", "DRAWING"]
};

const ALL_SITES = ["B-47", "JEX", "RSTF", "GDLV", "VRINDAVAN", "BHA", "SLH ", "HIH", "RWH", "HKD", "SBMG", "JANPURA"];

const SPECIAL_PERMS = [
  { id: "add_user", label: "Can Add Users" },
  { id: "manage_user", label: "Can Manage Users" },
  { id: "add_project", label: "Can Add Project" },
  { id: "manage_project", label: "Can Manage Projects" },
];

const SECTIONS = [
  { id: "overview", label: "Profile Overview", icon: Icon.Eye, sub: "Account Summary" },
  { id: "personal", label: "Edit Profile", icon: Icon.UserCircle, sub: "Personal Information" },
  { id: "reset", label: "Security", icon: Icon.ShieldCheck, sub: "Auth Settings" },
  { id: "add", label: "Add Member", icon: Icon.UserPlus, sub: "Team Invitation & Permissions" },
  { id: "manage", label: "Team Directory", icon: Icon.Users, sub: "Manage Members" },
  { id: "add-project", label: "New Project", icon: Icon.Plus, sub: "Deployment" },
  { id: "manage-project", label: "Manage Projects", icon: Icon.Layout, sub: "Active Sites" },
];

// --- ULTRA ATTRACTIVE STYLING ---
const glassStyle = "bg-white/90 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl shadow-blue-900/5 hover:shadow-blue-900/10 transition-all duration-500";
const inputStyle = "w-full rounded-2xl border border-blue-100 bg-white/80 px-5 py-4 text-sm text-gray-800 focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 outline-none transition-all placeholder:text-gray-400";

// --- REUSABLE UI COMPONENTS ---
const ModernToggle = ({ enabled, onChange }) => (
  <button 
    onClick={() => onChange(!enabled)}
    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all duration-500 ${enabled ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 shadow-lg shadow-blue-500/30' : 'bg-gradient-to-r from-gray-300 to-gray-400'}`}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all duration-500 shadow-lg ${enabled ? 'translate-x-8 shadow-blue-500/40' : 'translate-x-1 shadow-gray-400/40'}`} />
  </button>
);

const RoundCheckbox = ({ label, checked, onChange }) => (
  <label className="flex items-center space-x-3 cursor-pointer group">
    <div className={`relative h-6 w-6 rounded-xl border-2 transition-all duration-300 ${checked ? 'border-transparent bg-gradient-to-r from-blue-500 to-purple-500 shadow-lg shadow-blue-500/30' : 'border-blue-100 bg-white/80 group-hover:border-blue-300'}`}>
      {checked && <Icon.Check size={14} className="absolute inset-0 m-auto text-white" strokeWidth={4} />}
    </div>
    <span className={`text-sm ${checked ? 'text-gray-900 font-bold' : 'text-gray-600 group-hover:text-gray-900'}`}>{label}</span>
  </label>
);

const InputField = ({ label, icon: IconComp, ...props }) => (
  <div className="space-y-3">
    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider">{label}</label>
    <div className="relative">
      {IconComp && <IconComp size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />}
      <input {...props} className={`${inputStyle} ${IconComp ? 'pl-14' : ''}`} />
    </div>
  </div>
);

const Card = ({ children, title, subtitle, className = "", action }) => (
  <div className={`${glassStyle} ${className}`}>
    {(title || subtitle) && (
      <div className="px-8 py-6 border-b border-white/20 bg-gradient-to-r from-white/40 to-white/10 flex justify-between items-center rounded-t-3xl">
        <div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600">{subtitle}</p>
        </div>
        {action}
      </div>
    )}
    <div className="p-8">{children}</div>
  </div>
);

// --- MAIN PROFILE COMPONENT ---
const Profile = () => {
  const [activeSection, setActiveSection] = useState("overview");
  const [editing, setEditing] = useState(false);
  const [profilePic, setProfilePic] = useState(null);
  const [projects, setProjects] = useState([
    { id: 1, name: "B-47 Tower", location: "Delhi", code: "B47", address: "Sector 62, Noida", tabs: ["Dashboard", "Finance", "Store"], status: "Active", progress: 85, teamSize: 12, budget: "₹45.2 Cr" },
    { id: 2, name: "Skyline Mall", location: "Noida", code: "SL-2024", address: "Sector 128, Noida", tabs: ["Dashboard", "Finance", "Manpower", "Store"], status: "Active", progress: 72, teamSize: 8, budget: "₹68.5 Cr" },
    { id: 3, name: "Tech Park", location: "Bangalore", code: "TP-2024", address: "Electronic City Phase 1", tabs: ["Dashboard", "Procurement", "Images"], status: "In Progress", progress: 45, teamSize: 6, budget: "₹32.8 Cr" }
  ]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 text-gray-800 font-sans">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full opacity-20 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-pink-200 to-blue-200 rounded-full opacity-20 animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg">
        <div className="w-full px-10 h-24 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-xl animate-gradient-x">
                <Icon.User className="text-white" size={28} />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-4 border-white shadow-lg"></div>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-x">Profile Dashboard</h1>
              <p className="text-sm text-gray-600 font-semibold">Enterprise Management System</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              className="px-7 py-3.5 text-sm font-bold text-gray-700 bg-white border border-blue-100 rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl group"
              onClick={() => setActiveSection("personal")}
            >
              <Icon.Edit3 size={18} className="text-blue-500 group-hover:scale-110 transition-transform" /> Edit Profile
            </button>
            <button className="px-7 py-3.5 text-sm font-bold text-white bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3 hover:scale-105 animate-gradient-x">
              <Icon.Share2 size={18} /> Share Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* Navigation Tabs - Attractive Design */}
      <div className="sticky top-24 z-40 bg-white/60 backdrop-blur-lg border-b border-white/20">
        <div className="w-full px-10 flex space-x-1">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => { setActiveSection(s.id); setEditing(false); }}
              className={`py-5 px-6 text-sm font-bold whitespace-nowrap transition-all duration-300 relative group ${activeSection === s.id ? "text-blue-600" : "text-gray-500 hover:text-gray-700"}`}
            >
              {s.label}
              {activeSection === s.id ? (
                <>
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-full"></div>
                  <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-lg shadow-blue-500/50 animate-pulse"></div>
                </>
              ) : (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-blue-300 to-purple-300 rounded-t-full group-hover:w-full transition-all duration-300"></div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="relative w-full px-10 py-10">
        <div className="mb-10">
          <h2 className="text-4xl font-bold text-gray-900 mb-3">
            {SECTIONS.find(s => s.id === activeSection)?.label}
          </h2>
          <p className="text-gray-600 text-lg font-semibold">
            {SECTIONS.find(s => s.id === activeSection)?.sub}
          </p>
        </div>

        {activeSection === "overview" && <OverviewSection profilePic={profilePic} />}
        {activeSection === "personal" && <PersonalInfoSection editing={editing} setEditing={setEditing} profilePic={profilePic} setProfilePic={setProfilePic} />}
        {activeSection === "reset" && <SecuritySection />}
        {activeSection === "add" && <AddMemberSection />}
        {activeSection === "manage" && <UserDirectorySection />}
        {activeSection === "add-project" && <AddProjectSection onAdd={(p) => setProjects([...projects, p])} />}
        {activeSection === "manage-project" && <ManageProjectSection projects={projects} />}
      </main>
    </div>
  );
};

// --- ULTRA ATTRACTIVE OVERVIEW SECTION ---
const OverviewSection = ({ profilePic }) => (
  <div className="space-y-10">
    {/* Hero Profile Card */}
    <div className="bg-white/90 backdrop-blur-xl border border-white/20 rounded-3xl p-10 shadow-2xl">
      <div className="flex flex-col lg:flex-row items-start gap-12">
        {/* Profile Image Section */}
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="w-48 h-48 rounded-full border-8 border-white/50 p-3 shadow-2xl bg-gradient-to-br from-blue-100 to-purple-100 animate-float">
              <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden border-4 border-white shadow-inner">
                {profilePic ? (
                  <img src={profilePic} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <span className="text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-x">JG</span>
                )}
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-gradient-to-r from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-2xl border-4 border-white animate-bounce">
              <Icon.Check size={24} strokeWidth={4} />
            </div>
            <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-pink-400 to-rose-500 rounded-xl flex items-center justify-center text-white shadow-xl">
              <Icon.Crown size={20} />
            </div>
          </div>
          <p className="text-sm text-gray-600 font-bold mt-6 bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">SENIOR LEAD</p>
        </div>

        {/* Profile Info */}
        <div className="flex-1">
          <h3 className="text-5xl font-bold text-gray-900 mb-6">Jitendar Goyal</h3>
          
          <div className="flex flex-wrap items-center gap-4 mb-10">
            <span className="px-5 py-2.5 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 rounded-xl text-sm font-bold uppercase tracking-wide border-2 border-white shadow-lg hover:scale-105 transition-transform cursor-pointer">SENIOR LEAD ENGINEERING</span>
            <span className="px-5 py-2.5 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 rounded-xl text-sm font-bold uppercase border-2 border-white shadow-lg hover:scale-105 transition-transform cursor-pointer">LEVEL 4</span>
            <span className="flex items-center text-sm text-gray-600 font-bold px-4 py-2.5 bg-white rounded-xl border-2 border-white shadow-lg">
              <Icon.MapPin size={18} className="mr-3 text-blue-500" /> San Francisco, CA
            </span>
            <span className="flex items-center px-5 py-2.5 bg-gradient-to-r from-green-100 to-emerald-100 text-emerald-800 rounded-full text-sm font-bold uppercase border-2 border-white shadow-lg hover:scale-105 transition-transform cursor-pointer">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 mr-3 animate-pulse"></div> ACTIVE
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <MiniStat val="12" label="PROJECTS" progress={85} color="from-blue-400 to-blue-600" />
            <MiniStat val="8" label="TEAM" progress={67} color="from-purple-400 to-purple-600" />
            <MiniStat val="85%" label="ACTIVITY" progress={85} color="from-pink-400 to-pink-600" />
            <MiniStat val="24" label="MONTHS" progress={100} color="from-emerald-400 to-emerald-600" />
          </div>
        </div>
      </div>
    </div>

    {/* Stats Section */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
      <MainStat 
        icon={<Icon.Layers size={28} />} 
        val="12" 
        label="Total Projects" 
        sub="+2 this month" 
        color="text-blue-600"
        bg="bg-gradient-to-br from-blue-100 to-blue-200"
        shadow="shadow-lg shadow-blue-200"
      />
      <MainStat 
        icon={<Icon.MapPin size={28} />} 
        val="8" 
        label="Active Sites" 
        sub="Currently managing" 
        color="text-purple-600"
        bg="bg-gradient-to-br from-purple-100 to-purple-200"
        shadow="shadow-lg shadow-purple-200"
      />
      <MainStat 
        icon={<Icon.Users size={28} />} 
        val="42" 
        label="Team Size" 
        sub="Across all sites" 
        color="text-pink-600"
        bg="bg-gradient-to-br from-pink-100 to-pink-200"
        shadow="shadow-lg shadow-pink-200"
      />
      <MainStat 
        icon={<Icon.IndianRupee size={28} />} 
        val="₹126 Cr" 
        label="Budget Managed" 
        sub="Total allocation" 
        color="text-emerald-600"
        bg="bg-gradient-to-br from-emerald-100 to-emerald-200"
        shadow="shadow-lg shadow-emerald-200"
      />
    </div>

    {/* Bottom Section */}
    <div className="grid lg:grid-cols-3 gap-10">
      <div className="lg:col-span-2">
        <Card title="Project Summary" subtitle="Execution status overview">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <SummaryStat icon={<Icon.Building2 />} label="ACTIVE PROJECTS" val="8" color="text-blue-600" />
            <SummaryStat icon={<Icon.CheckCircle2 />} label="COMPLETED" val="4" color="text-emerald-600" />
            <SummaryStat icon={<Icon.Users />} label="TEAM MEMBERS" val="42" color="text-purple-600" />
            <SummaryStat icon={<Icon.Activity />} label="TASKS COMPLETED" val="156" color="text-pink-600" />
          </div>
          
          {/* Budget Section */}
          <div className="bg-gradient-to-r from-blue-50/50 to-purple-50/50 p-8 rounded-3xl border border-white/20">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h4 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-3">
                  <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl">
                    <Icon.PieChart size={22} className="text-blue-600"/>
                  </div>
                  Budget Utilization
                </h4>
                <p className="text-gray-600 text-sm">Total Budget: ₹126 Cr</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-2">Progress</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient-x">78%</p>
              </div>
            </div>
            <div className="h-4 bg-white/80 rounded-full overflow-hidden mb-6 shadow-inner">
              <div className="h-full bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 relative animate-gradient-x" style={{width: '78%'}}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30"></div>
              </div>
            </div>
            <div className="flex justify-between text-base font-bold">
              <div className="text-center p-4 bg-white/60 rounded-2xl min-w-32">
                <p className="text-gray-500 text-sm">Allocated</p>
                <p className="text-2xl text-gray-900">₹126 Cr</p>
              </div>
              <div className="text-center p-4 bg-white/60 rounded-2xl min-w-32">
                <p className="text-gray-500 text-sm">Utilized</p>
                <p className="text-2xl text-blue-600">₹98.28 Cr</p>
              </div>
              <div className="text-center p-4 bg-white/60 rounded-2xl min-w-32">
                <p className="text-gray-500 text-sm">Remaining</p>
                <p className="text-2xl text-emerald-600">₹27.72 Cr</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <Card title="Personal Info" subtitle="Official contact data">
        <div className="space-y-5">
          <InfoItem icon={<Icon.User />} label="Full Name" val="Jitendar Goyal" color="blue" />
          <InfoItem icon={<Icon.Mail />} label="Email Address" val="jitendar@bootes.com" color="purple" />
          <InfoItem icon={<Icon.Phone />} label="Phone Number" val="+91 98765 43210" color="pink" />
          <InfoItem icon={<Icon.Calendar />} label="Join Date" val="15 March 2022" color="emerald" />
          <InfoItem icon={<Icon.IdCard />} label="Employee ID" val="BOOTES-001" color="blue" />
          <InfoItem icon={<Icon.Shield />} label="Department" val="Engineering & Projects" color="purple" />
        </div>
      </Card>
    </div>
  </div>
);

const PersonalInfoSection = ({ editing, setEditing, profilePic, setProfilePic }) => {
  const [formData, setFormData] = useState({ 
    name: "Jitendar Goyal", 
    email: "jitendar@bootes.com", 
    location: "San Francisco, CA", 
    designation: "Senior Lead Engineering", 
    phone: "+91 98765 43210", 
    employeeId: "BOOTES-001" 
  });
  
  return (
    <Card title="Account Settings" subtitle="Personal details and preferences">
      <div className="flex flex-col md:flex-row items-center gap-10 mb-12 pb-12 border-b border-white/20">
        <div className="relative group">
          <div className="w-40 h-40 rounded-3xl bg-gradient-to-br from-blue-100 to-purple-100 p-3 shadow-2xl">
            <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center overflow-hidden border-4 border-white">
              {profilePic ? (
                <img src={profilePic} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-gradient-x">JG</span>
              )}
            </div>
          </div>
          {editing && (
            <label className="absolute -bottom-4 -right-4 w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center cursor-pointer border-4 border-white text-white shadow-2xl hover:shadow-3xl transition-all hover:scale-110 animate-pulse">
              <Icon.Camera size={24} />
              <input type="file" className="hidden" onChange={(e) => {
                const file = e.target.files[0];
                if(file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => setProfilePic(ev.target.result);
                  reader.readAsDataURL(file);
                }
              }} />
            </label>
          )}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h4 className="text-4xl font-bold text-gray-900 mb-3">{formData.name}</h4>
          <p className="text-gray-600 font-bold text-sm uppercase tracking-wide bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">{formData.designation}</p>
          <p className="text-gray-500 text-sm mt-3">Employee ID: <span className="font-bold text-blue-600">{formData.employeeId}</span></p>
        </div>
        <button 
          onClick={() => setEditing(!editing)} 
          className={`px-10 py-4 rounded-2xl font-bold text-sm uppercase tracking-wide transition-all duration-300 ${editing ? 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-2xl hover:shadow-3xl hover:scale-105 animate-gradient-x' : 'bg-white text-gray-700 hover:bg-blue-50 border-2 border-blue-100 shadow-lg hover:shadow-xl'}`}
        >
          {editing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        <InputField label="Full Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} disabled={!editing} icon={Icon.User} />
        <InputField label="Email Address" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} disabled={!editing} icon={Icon.Mail} />
        <InputField label="Location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} disabled={!editing} icon={Icon.MapPin} />
        <InputField label="Designation" value={formData.designation} onChange={e => setFormData({...formData, designation: e.target.value})} disabled={!editing} icon={Icon.Briefcase} />
        <InputField label="Phone Number" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} disabled={!editing} icon={Icon.Phone} />
        <InputField label="Employee ID" value={formData.employeeId} disabled icon={Icon.IdCard} />
      </div>
    </Card>
  );
};

const SecuritySection = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({ 
    email: "jitendar@bootes.com", 
    otp: "", 
    password: "", 
    confirmPassword: "" 
  });
  
  return (
    <div className="max-w-lg mx-auto">
      <Card title="Security Settings" subtitle="Authentication & Verification">
        <div className="text-center mb-12">
          <div className="h-28 w-28 bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl border-4 border-white animate-float">
            <Icon.ShieldCheck size={56} />
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            {step === 0 ? "Email Verification" : "Update Password"}
          </h3>
          <p className="text-gray-600 text-base">
            {step === 0 ? "Confirm your corporate email address" : "Enter your new secure password"}
          </p>
        </div>
        
        <div className="space-y-8">
          {step === 0 ? (
            <>
              <InputField 
                label="Email Address" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                icon={Icon.Mail} 
              />
              <button 
                onClick={() => setStep(1)} 
                className="w-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-5 rounded-2xl font-bold text-base shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 animate-gradient-x"
              >
                Send Verification Code
              </button>
            </>
          ) : (
            <>
              <InputField 
                label="Verification Code" 
                value={formData.otp} 
                onChange={e => setFormData({...formData, otp: e.target.value})}
                placeholder="Enter 6-digit code" 
                icon={Icon.Key} 
              />
              <InputField 
                label="New Password" 
                type="password" 
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
                icon={Icon.Lock} 
                placeholder="Minimum 8 characters" 
              />
              <InputField 
                label="Confirm Password" 
                type="password" 
                value={formData.confirmPassword}
                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                icon={Icon.Lock} 
                placeholder="Re-enter password" 
              />
              <div className="flex gap-5">
                <button 
                  onClick={() => setStep(0)} 
                  className="flex-1 bg-white text-gray-700 py-4 rounded-2xl text-sm font-bold hover:bg-blue-50 transition-all duration-300 border-2 border-blue-100 shadow-lg hover:shadow-xl"
                >
                  Back
                </button>
                <button 
                  className="flex-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-2xl text-sm font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 animate-gradient-x"
                >
                  Update Password
                </button>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

const AddMemberSection = () => {
  const [siteStrategy, setSiteStrategy] = useState("All Sites");
  const [tabStrategy, setTabStrategy] = useState("Specific Tabs");
  const [selectedTabs, setSelectedTabs] = useState([]);
  const [selectedSubTabs, setSelectedSubTabs] = useState([]);
  const [formData, setFormData] = useState({ name: "", email: "", designation: "" });
  const [selectedSites, setSelectedSites] = useState([]);
  
  const toggleItem = (list, setList, item) => setList(list.includes(item) ? list.filter(i => i !== item) : [...list, item]);
  const toggleSite = (site) => toggleItem(selectedSites, setSelectedSites, site);

  return (
    <div className="space-y-10">
      <Card title="Basic Information" subtitle="Member role and identity">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <InputField 
            label="Full Name" 
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            placeholder="Enter full name" 
            icon={Icon.User} 
          />
          <InputField 
            label="Email Address" 
            value={formData.email}
            onChange={e => setFormData({...formData, email: e.target.value})}
            placeholder="official@bootes.com" 
            icon={Icon.Mail} 
          />
          <InputField 
            label="Designation" 
            value={formData.designation}
            onChange={e => setFormData({...formData, designation: e.target.value})}
            placeholder="Project Lead" 
            icon={Icon.Briefcase} 
          />
        </div>
      </Card>
      
      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <Card 
            title="Module Permissions" 
            subtitle="Select accessible cloud modules"
            action={
              <select 
                value={tabStrategy} 
                onChange={e => setTabStrategy(e.target.value)} 
                className="bg-white/80 border-2 border-blue-100 rounded-2xl px-5 py-3 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 shadow-lg"
              >
                <option value="Specific Tabs">Manual Configuration</option>
                <option value="All Tabs">Grant Full Access</option>
              </select>
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {ALL_TABS_DATA.map(tab => (
                <div 
                  key={tab.name} 
                  className={`p-7 rounded-3xl border-2 transition-all duration-300 cursor-pointer hover:scale-105 ${selectedTabs.includes(tab.name) ? 'bg-gradient-to-br from-blue-50/80 to-purple-50/80 border-blue-300 shadow-xl' : 'bg-white/80 border-blue-100 hover:border-blue-300 shadow-lg hover:shadow-xl'}`}
                  onClick={() => toggleItem(selectedTabs, setSelectedTabs, tab.name)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                      <div className={`${selectedTabs.includes(tab.name) ? 'text-blue-700 bg-gradient-to-br from-blue-100 to-purple-100 shadow-lg' : 'text-gray-500 bg-blue-50/80'} w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${selectedTabs.includes(tab.name) ? 'border-blue-200' : 'border-blue-100'}`}>
                        {tab.icon}
                      </div>
                      <span className="text-base font-bold text-gray-800">{tab.name}</span>
                    </div>
                    <ModernToggle 
                      enabled={selectedTabs.includes(tab.name)} 
                      onChange={() => toggleItem(selectedTabs, setSelectedTabs, tab.name)}
                    />
                  </div>
                  {selectedTabs.includes(tab.name) && tab.hasSubTabs && (
                    <div className="mt-8 pl-14 space-y-5 border-l-2 border-blue-300">
                      {SUB_TABS_MAP[tab.name]?.map(sub => (
                        <RoundCheckbox 
                          key={sub} 
                          label={sub} 
                          checked={selectedSubTabs.includes(sub)} 
                          onChange={() => toggleItem(selectedSubTabs, setSelectedSubTabs, sub)} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
        
        <Card 
          title="Site Authorization" 
          subtitle="Geographic access permissions"
          action={
            <select 
              value={siteStrategy} 
              onChange={e => setSiteStrategy(e.target.value)} 
              className="bg-white/80 border-2 border-blue-100 rounded-2xl px-5 py-3 text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100/50 shadow-lg"
            >
              <option value="All Sites">All Sites</option>
              <option value="Specific Sites">Specific Sites</option>
            </select>
          }
        >
          <div className={`space-y-4 max-h-[400px] overflow-y-auto pr-4 ${siteStrategy === "All Sites" ? "opacity-50 pointer-events-none" : ""}`}>
            {ALL_SITES.map(site => (
              <div 
                key={site} 
                className={`flex items-center justify-between p-5 border-2 rounded-2xl transition-all duration-300 cursor-pointer hover:scale-105 ${selectedSites.includes(site) ? 'bg-gradient-to-br from-blue-50/80 to-purple-50/80 border-blue-300 shadow-lg' : 'bg-white/80 border-blue-100 hover:border-blue-300 shadow-md hover:shadow-lg'}`}
                onClick={() => toggleSite(site)}
              >
                <div className="flex items-center gap-4">
                  <Icon.MapPin size={18} className="text-blue-500"/>
                  <span className="text-sm font-bold text-gray-700">{site} Site</span>
                </div>
                {selectedSites.includes(site) ? (
                  <Icon.CheckCircle size={20} className="text-emerald-500" />
                ) : (
                  <Icon.PlusCircle size={20} className="text-blue-400" />
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-10 pt-10 border-t border-white/20">
            <div className="space-y-7">
              <h4 className="text-base font-bold text-gray-900">Special Permissions</h4>
              {SPECIAL_PERMS.map(perm => (
                <div key={perm.id} className="flex items-center justify-between p-4 bg-white/60 rounded-2xl border-2 border-blue-100">
                  <span className="text-sm font-semibold text-gray-700">{perm.label}</span>
                  <ModernToggle enabled={false} onChange={() => {}} />
                </div>
              ))}
            </div>
            
            <button className="w-full mt-12 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-5 rounded-2xl font-bold text-base shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 animate-gradient-x">
              Create User Account
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

const UserDirectorySection = () => {
  const members = [
    { name: "Rohan Srivastava", email: "rohan.srivastava@bootes.in", role: "Super Admin", initials: "RS", status: "Active", color: "from-red-400 to-rose-500" },
    { name: "Kashif Mansoorie", email: "kashif.mansoories@bootes.com", role: "Manager", initials: "KM", status: "Active", color: "from-blue-400 to-cyan-500" },
    { name: "Priya Sharma", email: "priya.sharma@bootes.com", role: "Project Lead", initials: "PS", status: "Inactive", color: "from-purple-400 to-pink-500" },
    { name: "Arun Kumar", email: "arun.kumar@bootes.com", role: "Engineer", initials: "AK", status: "Active", color: "from-emerald-400 to-teal-500" }
  ];

  return (
    <Card title="Team Directory" subtitle="Organizational member management">
      <div className="overflow-x-auto rounded-3xl border-2 border-white/20 shadow-xl">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gradient-to-r from-blue-50/50 to-purple-50/50">
              <th className="py-6 px-8 text-xs font-bold text-gray-600 uppercase tracking-wider border-b-2 border-white/20">Profile</th>
              <th className="py-6 px-8 text-xs font-bold text-gray-600 uppercase tracking-wider border-b-2 border-white/20">Access Role</th>
              <th className="py-6 px-8 text-xs font-bold text-gray-600 uppercase tracking-wider border-b-2 border-white/20">Status</th>
              <th className="py-6 px-8 text-xs font-bold text-gray-600 uppercase tracking-wider border-b-2 border-white/20 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-white/20">
            {members.map(m => (
              <tr key={m.email} className="hover:bg-white/40 transition-all duration-300">
                <td className="py-6 px-8">
                  <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 bg-gradient-to-br ${m.color} rounded-2xl flex items-center justify-center font-bold text-xl text-white shadow-lg`}>
                      {m.initials}
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-900">{m.name}</p>
                      <p className="text-sm text-gray-500">{m.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-6 px-8">
                  <span className={`text-xs font-bold px-4 py-2.5 rounded-xl ${m.role === "Super Admin" ? 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border-2 border-red-100' : 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-2 border-blue-100'}`}>
                    {m.role}
                  </span>
                </td>
                <td className="py-6 px-8">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3 ${m.status === "Active" ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-lg shadow-green-400/40' : 'bg-gradient-to-r from-gray-400 to-gray-500'}`} />
                    <span className="text-sm font-semibold text-gray-700">{m.status}</span>
                  </div>
                </td>
                <td className="py-6 px-8 text-right">
                  <div className="flex justify-end gap-3">
                    <button className="p-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-300 border-2 border-transparent hover:border-blue-100 shadow-md hover:shadow-lg">
                      <Icon.Edit2 size={20}/>
                    </button>
                    <button className="p-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 border-2 border-transparent hover:border-red-100 shadow-md hover:shadow-lg">
                      <Icon.Trash2 size={20}/>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-10 pt-10 border-t-2 border-white/20 flex justify-between items-center">
        <span className="text-sm text-gray-500 font-semibold">Showing {members.length} members</span>
        <button className="px-6 py-3 bg-gradient-to-r from-blue-50 to-purple-50 text-gray-700 rounded-xl text-sm font-bold hover:from-blue-100 hover:to-purple-100 transition-all duration-300 flex items-center gap-3 border-2 border-white shadow-lg hover:shadow-xl">
          <Icon.UserPlus size={18} /> Add New Member
        </button>
      </div>
    </Card>
  );
};

const AddProjectSection = ({ onAdd }) => {
  const [formData, setFormData] = useState({ 
    name: "", 
    code: "", 
    location: "", 
    budget: "", 
    address: "",
    startDate: "",
    manager: ""
  });

  const handleSubmit = () => {
    const newProject = {
      ...formData,
      id: Date.now(),
      progress: 0,
      status: "Active",
      teamSize: 0
    };
    onAdd(newProject);
    alert("Project initialized successfully!");
    setFormData({ name: "", code: "", location: "", budget: "", address: "", startDate: "", manager: "" });
  };

  return (
    <Card title="Deploy New Project" subtitle="Add new project infrastructure">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-12">
        <InputField 
          label="Project Name" 
          value={formData.name}
          onChange={e => setFormData({...formData, name: e.target.value})}
          placeholder="Enter project name" 
          icon={Icon.Building} 
        />
        <InputField 
          label="Project Code" 
          value={formData.code}
          onChange={e => setFormData({...formData, code: e.target.value})}
          placeholder="Internal code" 
          icon={Icon.Hash} 
        />
        <InputField 
          label="Location" 
          value={formData.location}
          onChange={e => setFormData({...formData, location: e.target.value})}
          placeholder="City, State" 
          icon={Icon.MapPin} 
        />
        <InputField 
          label="Budget Allocation" 
          value={formData.budget}
          onChange={e => setFormData({...formData, budget: e.target.value})}
          placeholder="₹0.00 Cr" 
          icon={Icon.IndianRupee} 
        />
        <InputField 
          label="Project Manager" 
          value={formData.manager}
          onChange={e => setFormData({...formData, manager: e.target.value})}
          placeholder="Assigned manager" 
          icon={Icon.User} 
        />
        <InputField 
          label="Start Date" 
          type="date"
          value={formData.startDate}
          onChange={e => setFormData({...formData, startDate: e.target.value})}
          icon={Icon.Calendar} 
        />
        <div className="md:col-span-2">
          <InputField 
            label="Site Address" 
            value={formData.address}
            onChange={e => setFormData({...formData, address: e.target.value})}
            placeholder="Complete site address" 
            icon={Icon.Home} 
          />
        </div>
      </div>
      <div className="flex gap-5">
        <button className="flex-1 bg-white text-gray-700 py-4 rounded-2xl text-sm font-bold hover:bg-blue-50 transition-all duration-300 border-2 border-blue-100 shadow-lg hover:shadow-xl">
          Cancel
        </button>
        <button 
          onClick={handleSubmit}
          className="flex-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white py-4 rounded-2xl text-sm font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-3 animate-gradient-x"
        >
          <Icon.Plus size={22} /> Deploy Project
        </button>
      </div>
    </Card>
  );
};

const ManageProjectSection = ({ projects }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
    {projects.map(p => (
      <Card key={p.id} className="hover:shadow-3xl transition-all duration-500 group hover:scale-105">
        <div className="flex justify-between items-start mb-8">
          <div className="p-5 bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl text-blue-600 shadow-lg">
            <Icon.Layout size={32} />
          </div>
          <span className={`text-xs font-bold px-4 py-2 rounded-full ${p.status === "Active" ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-emerald-700 border-2 border-emerald-100' : 'bg-gradient-to-r from-yellow-50 to-amber-50 text-amber-700 border-2 border-amber-100'}`}>
            {p.status}
          </span>
        </div>
        <h4 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">{p.name}</h4>
        <p className="text-sm text-gray-500 mb-8 pb-8 border-b-2 border-white/20">
          {p.code} • {p.location}
        </p>
        <div className="space-y-8">
          <div>
            <div className="flex justify-between text-sm font-bold text-gray-700 mb-3">
              <span>Progress</span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient-x">{p.progress}%</span>
            </div>
            <div className="h-3 bg-white/80 rounded-full overflow-hidden shadow-inner">
              <div className={`h-full rounded-full ${p.progress > 70 ? 'bg-gradient-to-r from-green-400 to-emerald-500' : p.progress > 40 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' : 'bg-gradient-to-r from-blue-400 to-purple-500'} animate-gradient-x`} style={{width: `${p.progress}%`}} />
            </div>
          </div>
          <div className="flex justify-between pt-8 border-t-2 border-white/20">
            <div className="text-left">
              <p className="text-xs text-gray-500 font-bold mb-2">Team Size</p>
              <p className="text-2xl font-bold text-gray-900">{p.teamSize}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-bold mb-2">Budget</p>
              <p className="text-2xl font-bold text-gray-900">{p.budget}</p>
            </div>
          </div>
          <div className="flex gap-4 pt-8 border-t-2 border-white/20">
            <button className="flex-1 p-3.5 bg-white text-gray-700 rounded-xl text-sm font-bold hover:bg-blue-50 transition-all duration-300 flex items-center justify-center gap-2 border-2 border-blue-100 shadow-md hover:shadow-lg">
              <Icon.Eye size={18} /> View
            </button>
            <button className="flex-1 p-3.5 bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 rounded-xl text-sm font-bold hover:from-blue-100 hover:to-purple-100 transition-all duration-300 flex items-center justify-center gap-2 border-2 border-blue-100 shadow-md hover:shadow-lg">
              <Icon.Edit2 size={18} /> Edit
            </button>
          </div>
        </div>
      </Card>
    ))}
    
    <div className="border-4 border-dashed border-blue-200 rounded-3xl flex flex-col items-center justify-center p-10 hover:border-blue-400 hover:bg-gradient-to-br from-blue-50/50 to-purple-50/50 transition-all duration-300 cursor-pointer group hover:scale-105">
      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 text-blue-400 rounded-3xl flex items-center justify-center mb-8 group-hover:bg-gradient-to-br group-hover:from-blue-200 group-hover:to-purple-200 group-hover:text-blue-600 border-4 border-dashed border-blue-200 group-hover:border-blue-400">
        <Icon.Plus size={48} />
      </div>
      <h4 className="text-xl font-bold text-gray-700 mb-3 group-hover:text-gray-900">Add New Project</h4>
      <p className="text-sm text-gray-500 text-center group-hover:text-gray-600">Click to deploy new project infrastructure</p>
    </div>
  </div>
);

// --- HELPER COMPONENTS ---
const MiniStat = ({ val, label, progress, color }) => (
  <div className="bg-white/80 border-2 border-white/20 rounded-2xl p-6 hover:border-blue-300 hover:shadow-xl transition-all duration-500">
    <div className={`text-4xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent animate-gradient-x`}>{val}</div>
    <div className="text-xs font-bold text-gray-600 uppercase tracking-wide mt-3 mb-6">{label}</div>
    <div className="h-2 bg-white/80 rounded-full shadow-inner">
      <div className={`h-full bg-gradient-to-r ${color} rounded-full transition-all duration-1000 animate-gradient-x`} style={{width: `${progress}%`}} />
    </div>
  </div>
);

const MainStat = ({ icon, val, label, sub, color, bg, shadow }) => (
  <div className={`bg-white/80 border-2 border-white/20 rounded-2xl p-7 hover:shadow-xl transition-all duration-500 ${shadow}`}>
    <div className={`${bg} ${color} p-5 rounded-2xl inline-block mb-7 shadow-lg`}>
      {icon}
    </div>
    <div className="text-3xl font-bold text-gray-900 mb-2">{val}</div>
    <div className="text-base font-bold text-gray-700 mb-2">{label}</div>
    <p className="text-sm text-gray-500">{sub}</p>
  </div>
);

const SummaryStat = ({ icon, label, val, color }) => (
  <div className="text-center">
    <div className={`${color} inline-flex p-5 rounded-2xl bg-gradient-to-br from-white to-white/80 mb-6 border-2 border-white/20 shadow-lg`}>
      {React.cloneElement(icon, { size: 28 })}
    </div>
    <div className="text-xs font-bold text-gray-600 uppercase tracking-wide">{label}</div>
    <div className="text-3xl font-bold text-gray-900 mt-3">{val}</div>
  </div>
);

const InfoItem = ({ icon, label, val, color }) => {
  const colorClasses = {
    blue: 'bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200',
    purple: 'bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200',
    pink: 'bg-gradient-to-r from-pink-50 to-pink-100 border-pink-200',
    emerald: 'bg-gradient-to-r from-emerald-50 to-emerald-100 border-emerald-200'
  };
  
  const iconColors = {
    blue: 'text-blue-600',
    purple: 'text-purple-600',
    pink: 'text-pink-600',
    emerald: 'text-emerald-600'
  };
  
  return (
    <div className={`flex items-start gap-5 p-5 ${colorClasses[color]} rounded-2xl border-2 hover:scale-105 transition-all duration-300`}>
      <div className={`p-3.5 bg-white rounded-xl border-2 ${iconColors[color]}`}>
        {React.cloneElement(icon, { size: 20 })}
      </div>
      <div>
        <p className="text-xs font-bold text-gray-500 mb-1">{label}</p>
        <p className="text-base font-bold text-gray-900">{val}</p>
      </div>
    </div>
  );
};

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes gradient-x {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  .animate-gradient-x {
    background-size: 200% 200%;
    animation: gradient-x 3s ease infinite;
  }
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`;
document.head.appendChild(style);

export default Profile;