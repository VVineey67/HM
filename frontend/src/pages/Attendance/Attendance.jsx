// Attendance.jsx
// MASTER CONTROLLER (Modern UI with Analytics + Filters + CRUD + Tabs + Table Routing)

import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Coffee,
  Calendar,
  Download,
  Filter,
  Search,
  X,
  ChevronLeft,
  BarChart3,
  PieChart,
  Activity,
  PlusCircle,
  FileText,
  Shield,
  Phone
} from "lucide-react";

// TABLE UI COMPONENTS
import StaffTable from "./StaffTable";
import GuardTable from "./GuardTable";
import TodayTable from "./TodayTable";
import ContactsTable from "./ContactsTable";

// UI HELPERS
import StatusBadge from "./StatusBadge";
import Pagination from "./Pagination";

// MODAL COMPONENTS
import AddStaffModal from "./AddStaffModal";
import AddGuardModal from "./AddGuardModal";
import AddContactModal from "./AddContactModal";

// UTILITIES
import {
  excelToJSDate,
  excelTimeToDisplay,
  filterByName,
  filterByDate,
  filterByDateRange,
  globalSearch,
  totalWorkingHrs,
  totalOTHrs,
  exportExcel,
  exportPDF,
} from "./utils";

/* ============================================================
    CONSTANTS
============================================================ */
const PAGE_SIZE = 20;

/* ============================================================
    ANIMATION STYLES
============================================================ */
const styles = {
  cardHover: "transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
  gradientBg: "bg-gradient-to-br from-blue-600 to-blue-700",
  glassMorphism: "backdrop-blur-lg bg-white/30 border border-white/20",
  neonGlow: "shadow-[0_0_15px_rgba(59,130,246,0.5)]",
};

/* ============================================================
    MAIN COMPONENT
============================================================ */
const Attendance = ({ selectedProject }) => {

  /* ------------------------------------------------------------
      1) STATE MANAGEMENT
  ------------------------------------------------------------ */
  const [activeTab, setActiveTab] = useState("Today");
  const [staffData, setStaffData] = useState([]);
  const [guardData, setGuardData] = useState([]);
  const [contactData, setContactData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChart, setSelectedChart] = useState("bar");
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [showAddGuardModal, setShowAddGuardModal] = useState(false);
  const [showAddContactModal, setShowAddContactModal] = useState(false);

  // FILTER STATES
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedName, setSelectedName] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedDesignation, setSelectedDesignation] = useState("All");
  const [selectedDate, setSelectedDate] = useState("");
  const [range, setRange] = useState({ 
    start: "", 
    end: "" 
  });

  // PAGINATION STATES
  const [page, setPage] = useState(1);

  /* ------------------------------------------------------------
      2) FETCH DATA FROM BACKEND
  ------------------------------------------------------------ */
  useEffect(() => {
    if (selectedProject) {
      fetchData();
    }
  }, [selectedProject]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `http://localhost:4000/api/attendance/read/${selectedProject}`
      );

      // Staff Parsing Logic
      const staffParsed = (res.data.staff || []).slice(1).map((r, i) => ({
        id: i,
        date: excelToJSDate(r[0]),
        name: r[1],
        designation: r[2],
        status: r[3],
        inTime: r[4],
        outTime: r[5],
        workingHrs: r[6],
        otHrs: r[7],
        remarks: r[8] || "",
        type: "staff",
      }));

      // Guards Parsing Logic
      const guardParsed = (res.data.guards || []).slice(1).map((r, i) => ({
        id: i,
        date: excelToJSDate(r[0]),
        name: r[1],
        designation: r[2],
        status: r[3],
        inTime: r[4],
        outTime: r[5],
        shift: r[6],
        remarks: r[7] || "",
        type: "guard",
      }));

      // Contacts Parsing Logic
      const contactParsed = (res.data.contacts || []).slice(1).map((r, i) => ({
        sNo: r[0] || i + 1,
        site: r[1],
        name: r[5] || r[2],
        designation: r[6] || r[3],
        manager: r[7] || "",
        contact: r[8] || r[4],
        email: r[4] || "",
      }));

      setStaffData(staffParsed);
      setGuardData(guardParsed);
      setContactData(contactParsed);
    } catch (err) {
      console.error(err);
      alert("Failed to load attendance data from server.");
    }
    setLoading(false);
  };

  /* ------------------------------------------------------------
      3) FILTER FUNCTION (UPDATED WITH STATUS AND DESIGNATION)
  ------------------------------------------------------------ */
  const filterData = (data) => {
    let filtered = [...data];

    if (selectedName !== "All") {
      filtered = filtered.filter(item => item.name === selectedName);
    }

    if (selectedStatus !== "All") {
      filtered = filtered.filter(item => item.status === selectedStatus);
    }

    if (selectedDesignation !== "All") {
      filtered = filtered.filter(item => item.designation === selectedDesignation);
    }

    if (selectedDate) {
      filtered = filtered.filter(item => item.date === selectedDate);
    }

    if (range.start && range.end) {
      filtered = filtered.filter(item => 
        item.date >= range.start && item.date <= range.end
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.name?.toLowerCase().includes(query) ||
        item.designation?.toLowerCase().includes(query) ||
        item.status?.toLowerCase().includes(query) ||
        item.remarks?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  /* ------------------------------------------------------------
      4) TODAY'S DATE
  ------------------------------------------------------------ */
  const todaysDate = new Date().toISOString().split("T")[0];

  /* ------------------------------------------------------------
      5) TAB-SPECIFIC BASE DATA
  ------------------------------------------------------------ */
  const todayBaseData = useMemo(() => {
    const staffToday = staffData.filter((r) => r.date === todaysDate);
    const guardToday = guardData.filter((r) => r.date === todaysDate);
    return [
      ...staffToday.map((r) => ({ ...r, type: "staff" })),
      ...guardToday.map((r) => ({ ...r, type: "guard" })),
    ];
  }, [staffData, guardData, todaysDate]);

  const staffBaseData = useMemo(() => {
    return staffData.map(r => ({ ...r, type: "staff" }));
  }, [staffData]);

  const guardBaseData = useMemo(() => {
    return guardData.map(r => ({ ...r, type: "guard" }));
  }, [guardData]);

  /* ------------------------------------------------------------
      6) CURRENT TAB FILTERED DATA
  ------------------------------------------------------------ */
  const currentTabData = useMemo(() => {
    if (activeTab === "Today") {
      return filterData(todayBaseData);
    } else if (activeTab === "Staff") {
      return filterData(staffBaseData);
    } else if (activeTab === "Guard") {
      return filterData(guardBaseData);
    } else {
      return [];
    }
  }, [activeTab, todayBaseData, staffBaseData, guardBaseData, selectedName, selectedStatus, selectedDesignation, selectedDate, range, searchQuery]);

  /* ------------------------------------------------------------
      7) ANALYTICS CALCULATION
  ------------------------------------------------------------ */
  const analytics = useMemo(() => {
    if (activeTab === "Contacts") {
      return {
        total: 0,
        present: 0,
        absent: 0,
        leave: 0,
        holiday: 0,
        weekOff: 0,
        totalWorking: "0Hrs 0Min",
        totalOT: "0Hrs 0Min",
        offHoliday: 0
      };
    }

    const data = currentTabData;
    
    const totalCount = data.length;
    const presentCount = data.filter((r) => r.status === "Present").length;
    const absentCount = data.filter((r) => r.status === "Absent").length;
    const leaveCount = data.filter((r) => r.status === "Leave").length;
    const holidayCount = data.filter((r) => r.status === "Holiday").length;
    const weekOffCount = data.filter((r) => r.status === "Week Off").length;

    // Working hours calculate
    let totalMinutes = 0;
    data.forEach(record => {
      if (record.workingHrs) {
        const hrsMatch = record.workingHrs.toString().match(/(\d+)Hrs?/);
        const minMatch = record.workingHrs.toString().match(/(\d+)Min/);
        const hrs = hrsMatch ? parseInt(hrsMatch[1]) : 0;
        const mins = minMatch ? parseInt(minMatch[1]) : 0;
        totalMinutes += (hrs * 60) + mins;
      }
    });
    const workingHours = Math.floor(totalMinutes / 60) + "Hrs " + (totalMinutes % 60) + "Min";

    // OT hours calculate
    let totalOTMinutes = 0;
    data.forEach(record => {
      if (record.otHrs) {
        const hrsMatch = record.otHrs.toString().match(/(\d+)Hrs?/);
        const minMatch = record.otHrs.toString().match(/(\d+)Min/);
        const hrs = hrsMatch ? parseInt(hrsMatch[1]) : 0;
        const mins = minMatch ? parseInt(minMatch[1]) : 0;
        totalOTMinutes += (hrs * 60) + mins;
      }
    });
    const otHours = Math.floor(totalOTMinutes / 60) + "Hrs " + (totalOTMinutes % 60) + "Min";

    return {
      total: totalCount,
      present: presentCount,
      absent: absentCount,
      leave: leaveCount,
      holiday: holidayCount,
      weekOff: weekOffCount,
      totalWorking: workingHours,
      totalOT: otHours,
      offHoliday: holidayCount + weekOffCount,
    };
  }, [currentTabData, activeTab]);

  /* ------------------------------------------------------------
      8) LISTS FOR FILTERS (TAB SPECIFIC)
  ------------------------------------------------------------ */
  const staffNameList = ["All", ...new Set(staffData.map(s => s.name))];
  const guardNameList = ["All", ...new Set(guardData.map(g => g.name))];
  const allNameList = ["All", ...new Set([...staffData.map(s => s.name), ...guardData.map(g => g.name)])];

  // Status options
  const statusOptions = ["All", "Present", "Absent", "Leave", "Holiday", "Week Off"];

  // Designation lists (tab specific)
  const staffDesignationList = ["All", ...new Set(staffData.map(s => s.designation))];
  const guardDesignationList = ["All", ...new Set(guardData.map(g => g.designation))];
  const allDesignationList = ["All", ...new Set([...staffData.map(s => s.designation), ...guardData.map(g => g.designation)])];

  // Get current tab's name list
  const currentNameList = useMemo(() => {
    if (activeTab === "Staff") return staffNameList;
    if (activeTab === "Guard") return guardNameList;
    return allNameList; // For Today tab which shows both
  }, [activeTab, staffNameList, guardNameList, allNameList]);

  // Get current tab's designation list
  const currentDesignationList = useMemo(() => {
    if (activeTab === "Staff") return staffDesignationList;
    if (activeTab === "Guard") return guardDesignationList;
    return allDesignationList; // For Today tab which shows both
  }, [activeTab, staffDesignationList, guardDesignationList, allDesignationList]);

  // Reset filters when switching tabs
  useEffect(() => {
    setSelectedName("All");
    setSelectedStatus("All");
    setSelectedDesignation("All");
  }, [activeTab]);

  /* ------------------------------------------------------------
      9) PAGINATION
  ------------------------------------------------------------ */
  const paginate = (data) => {
    const totalPages = Math.ceil(data.length / PAGE_SIZE) || 1;
    const startIndex = (page - 1) * PAGE_SIZE;
    const paginatedRows = data.slice(startIndex, startIndex + PAGE_SIZE);
    return { totalPages, paginatedRows };
  };

  const currentPag = useMemo(() => paginate(currentTabData), [currentTabData, page]);
  const contactPag = useMemo(() => paginate(contactData), [contactData, page]);

  /* ------------------------------------------------------------
      10) CRUD OPERATIONS
  ------------------------------------------------------------ */
  const updateRecord = async (sheet, rowIndex, payload) => {
    try {
      await axios.patch(
        `http://localhost:4000/api/attendance/update/${selectedProject}/${sheet}/${rowIndex}`,
        payload
      );
      fetchData();
    } catch (err) {
      alert("Update failed. Please check backend connection.");
    }
  };

  const deleteRecord = async (sheet, rowIndex) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this record?");
    if (!confirmDelete) return;
    try {
      await axios.delete(
        `http://localhost:4000/api/attendance/delete/${selectedProject}/${sheet}/${rowIndex}`
      );
      fetchData();
    } catch (err) {
      alert("Delete failed.");
    }
  };

  const addStaffRecord = async (newRecord) => {
    try {
      await axios.post(
        `http://localhost:4000/api/attendance/add/${selectedProject}/Staff`,
        newRecord
      );
      fetchData();
      setShowAddStaffModal(false);
      alert("Staff attendance record added successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add staff attendance record.");
    }
  };

  const addGuardRecord = async (newRecord) => {
    try {
      await axios.post(
        `http://localhost:4000/api/attendance/add/${selectedProject}/Guard`,
        newRecord
      );
      fetchData();
      setShowAddGuardModal(false);
      alert("Guard attendance record added successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add guard attendance record.");
    }
  };

  const addContactRecord = async (newRecord) => {
    try {
      await axios.post(
        `http://localhost:4000/api/attendance/add/${selectedProject}/Contact`,
        newRecord
      );
      fetchData();
      setShowAddContactModal(false);
      alert("Contact record added successfully!");
    } catch (err) {
      console.error(err);
      alert("Failed to add contact record.");
    }
  };

  /* ------------------------------------------------------------
      11) MODERN ANALYTICS CARDS (ARROWS REMOVED)
  ------------------------------------------------------------ */
  const ModernAnalyticsCards = () => {
    if (activeTab === "Contacts") return null;

    const cards = [
      { 
        label: "TOTAL RECORDS", 
        value: analytics.total, 
        icon: Users,  
        color: "from-blue-500 to-blue-600",
        bgLight: "bg-blue-50",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600"
      },
      { 
        label: "PRESENT", 
        value: analytics.present, 
        icon: UserCheck,     
        color: "from-green-500 to-green-600",
        bgLight: "bg-green-50",
        iconBg: "bg-green-100",
        iconColor: "text-green-600"
      },
      { 
        label: "ABSENT", 
        value: analytics.absent, 
        icon: UserX,
        color: "from-red-500 to-red-600",
        bgLight: "bg-red-50",
        iconBg: "bg-red-100",
        iconColor: "text-red-600"
      },
      { 
        label: "ON LEAVE", 
        value: analytics.leave, 
        icon: Coffee,     
        color: "from-yellow-500 to-yellow-600",
        bgLight: "bg-yellow-50",
        iconBg: "bg-yellow-100",
        iconColor: "text-yellow-600"
      },
      { 
        label: "WORKING HRS", 
        value: analytics.totalWorking, 
        icon: Clock,      
        color: "from-indigo-500 to-indigo-600",
        bgLight: "bg-indigo-50",
        iconBg: "bg-indigo-100",
        iconColor: "text-indigo-600"
      },
      { 
        label: "OFF/HOLIDAY", 
        value: analytics.offHoliday, 
        icon: Calendar,       
        color: "from-gray-500 to-gray-600",
        bgLight: "bg-gray-50",
        iconBg: "bg-gray-100",
        iconColor: "text-gray-600"
      },
    ];

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-4 mb-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`group relative overflow-hidden rounded-2xl ${card.bgLight} p-5 ${styles.cardHover} animate-fadeInUp`}
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {/* Animated Background Gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              
              {/* Decorative Circles */}
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl" />
              <div className="absolute -left-4 -bottom-4 w-16 h-16 bg-gradient-to-tr from-white/20 to-transparent rounded-full blur-xl" />

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${card.iconBg} ${card.iconColor} transition-transform group-hover:scale-110 duration-300`}>
                    <Icon size={20} strokeWidth={2.5} />
                  </div>
                  {/* Arrow indicators completely removed */}
                </div>
                
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  {card.label}
                </p>
                <p className="text-2xl font-black text-gray-800 group-hover:scale-105 transition-transform origin-left">
                  {card.value}
                </p>
                
                {/* Mini Progress Bar */}
                <div className="mt-3 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full bg-gradient-to-r ${card.color} rounded-full transition-all duration-1000`}
                    style={{ 
                      width: `${Math.min(100, (typeof card.value === 'number' ? card.value : 0) / 100 * 100)}%`,
                      opacity: 0.7
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /* ------------------------------------------------------------
      12) MODERN FILTER UI (WITH STATUS AND DESIGNATION FILTERS)
  ------------------------------------------------------------ */
  const ModernFilterUI = () => {
    if (activeTab === "Contacts") return null;

    return (
      <div className="bg-white rounded-2xl shadow-lg mb-6 border border-gray-100 overflow-hidden">
        {/* Filter Header */}
        <div 
          className="p-4 flex items-center justify-between cursor-pointer bg-gradient-to-r from-gray-50 to-white"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Filter size={18} className="text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-700">Advanced Filters</h3>
          </div>
          <div className={`transform transition-transform duration-300 ${showFilters ? 'rotate-180' : ''}`}>
            <ChevronLeft size={20} className="text-gray-400" />
          </div>
        </div>

        {/* Filter Content */}
        <div className={`transition-all duration-500 ease-in-out ${showFilters ? 'max-h-[800px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
          <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
              {/* Search Input */}
              <div className="group">
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                  Search Anything
                </label>
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Type to search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPage(1);
                    }}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2"
                    >
                      <X size={14} className="text-gray-400 hover:text-gray-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Name Filter */}
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                  Filter by Name {activeTab === "Staff" ? "(Staff Only)" : activeTab === "Guard" ? "(Guard Only)" : ""}
                </label>
                <select
                  value={selectedName}
                  onChange={(e) => {
                    setSelectedName(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                >
                  {currentNameList.map((n, i) => (
                    <option key={i} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter - NEW */}
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                  Filter by Status
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                >
                  {statusOptions.map((status, i) => (
                    <option key={i} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Designation Filter - NEW */}
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                  Filter by Designation {activeTab === "Staff" ? "(Staff Only)" : activeTab === "Guard" ? "(Guard Only)" : ""}
                </label>
                <select
                  value={selectedDesignation}
                  onChange={(e) => {
                    setSelectedDesignation(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                >
                  {currentDesignationList.map((des, i) => (
                    <option key={i} value={des}>{des}</option>
                  ))}
                </select>
              </div>

              {/* Date Input */}
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                  Specific Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => {
                    setSelectedDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                />
              </div>

              {/* Range Start */}
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                  Start Date
                </label>
                <input
                  type="date"
                  value={range.start}
                  onChange={(e) => {
                    setRange({ ...range, start: e.target.value });
                    setPage(1);
                  }}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                />
              </div>

              {/* Range End */}
              <div>
                <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                  End Date
                </label>
                <input
                  type="date"
                  value={range.end}
                  onChange={(e) => {
                    setRange({ ...range, end: e.target.value });
                    setPage(1);
                  }}
                  className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all bg-white"
                />
              </div>
            </div>

            {/* Export Buttons - Excel and PDF */}
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => exportPDF(currentTabData, `${activeTab}_Report`)}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                <FileText size={18} className="group-hover:scale-110 transition-transform" />
                Export PDF
              </button>
              <button
                onClick={() => exportExcel(currentTabData, `${activeTab}_Report`)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-2.5 rounded-xl font-bold transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                <Download size={18} className="group-hover:scale-110 transition-transform" />
                Export Excel
              </button>
            </div>

            {/* Active Filters Tags - UPDATED with new filters */}
            {(searchQuery || selectedName !== "All" || selectedStatus !== "All" || selectedDesignation !== "All" || selectedDate || range.start) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-xs font-semibold text-gray-500 mb-2">Active Filters:</p>
                <div className="flex flex-wrap gap-2">
                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                      Search: {searchQuery}
                      <button onClick={() => setSearchQuery("")}>
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {selectedName !== "All" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-xs font-semibold">
                      Name: {selectedName}
                      <button onClick={() => setSelectedName("All")}>
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {selectedStatus !== "All" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-xs font-semibold">
                      Status: {selectedStatus}
                      <button onClick={() => setSelectedStatus("All")}>
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {selectedDesignation !== "All" && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold">
                      Designation: {selectedDesignation}
                      <button onClick={() => setSelectedDesignation("All")}>
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {selectedDate && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg text-xs font-semibold">
                      Date: {selectedDate}
                      <button onClick={() => setSelectedDate("")}>
                        <X size={12} />
                      </button>
                    </span>
                  )}
                  {range.start && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-xs font-semibold">
                      Range: {range.start} to {range.end}
                      <button onClick={() => setRange({ start: "", end: "" })}>
                        <X size={12} />
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------
      13) MODERN TAB DESIGN (UPDATED WITH ADD BUTTONS)
  ------------------------------------------------------------ */
  const ModernTabs = () => {
    const tabs = [
      { id: "Today", label: "Today", icon: Clock },
      { id: "Staff", label: "Staff", icon: Users },
      { id: "Guard", label: "Guard", icon: Shield },
      { id: "Contacts", label: "Contacts", icon: Phone },
    ];

    return (
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-1.5 border border-gray-100 flex-1">
          <div className="flex gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTab(t.id);
                    setPage(1);
                  }}
                  className={`relative flex-1 px-4 py-3 rounded-xl font-bold transition-all duration-300 overflow-hidden group ${
                    isActive 
                      ? "text-white" 
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-700 animate-gradientMove" />
                  )}
                  <div className="relative z-10 flex items-center justify-center gap-2">
                    <Icon size={18} className={`transition-transform ${isActive ? 'animate-bounce' : 'group-hover:scale-110'}`} />
                    <span>{t.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Add Buttons for Staff, Guard, and Contacts Tabs */}
        <div className="flex gap-3">
          {activeTab === "Staff" && (
            <button
              onClick={() => setShowAddStaffModal(true)}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2 group whitespace-nowrap"
            >
              <PlusCircle size={20} className="group-hover:scale-110 transition-transform" />
              Add Staff Record
            </button>
          )}
          
          {activeTab === "Guard" && (
            <button
              onClick={() => setShowAddGuardModal(true)}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2 group whitespace-nowrap"
            >
              <PlusCircle size={20} className="group-hover:scale-110 transition-transform" />
              Add Guard Record
            </button>
          )}

          {activeTab === "Contacts" && (
            <button
              onClick={() => setShowAddContactModal(true)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-bold transition-all duration-300 shadow-md hover:shadow-xl flex items-center justify-center gap-2 group whitespace-nowrap"
            >
              <PlusCircle size={20} className="group-hover:scale-110 transition-transform" />
              Add Contact
            </button>
          )}
        </div>
      </div>
    );
  };

  /* ------------------------------------------------------------
      14) LOADING SCREEN
  ------------------------------------------------------------ */
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-blue-600 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="mt-6 text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
          Loading attendance data...
        </div>
        <div className="mt-2 text-sm text-gray-500">Please wait while we fetch your records</div>
      </div>
    );
  }

  /* ------------------------------------------------------------
      15) MAIN RENDER
  ------------------------------------------------------------ */
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-[1920px] mx-auto p-4 lg:p-6">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg">
              <Calendar size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-black bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                ATTENDANCE MANAGEMENT
              </h1>
              <p className="text-xs text-gray-500 mt-1">Real-time attendance tracking system</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-sm border border-gray-200">
              <span className="text-xs text-gray-500 block">Current Time</span>
              <span className="font-bold text-gray-800">{new Date().toLocaleTimeString()}</span>
            </div>
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
              <Users size={16} />
              <span className="font-bold">Project: {selectedProject}</span>
            </div>
          </div>
        </div>

        {/* MODERN TABS WITH ADD BUTTONS */}
        <ModernTabs />

        {/* ANALYTICS CARDS */}
        <ModernAnalyticsCards />
        
        {/* FILTERS WITH STATUS AND DESIGNATION FILTERS */}
        <ModernFilterUI />

        {/* DYNAMIC TABLE RENDERING */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-300">
          {activeTab === "Today" && (
            <TodayTable
              rows={currentPag.paginatedRows}
              page={page}
              totalPages={currentPag.totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(currentPag.totalPages, p + 1))}
            />
          )}

          {activeTab === "Staff" && (
            <StaffTable
              rows={currentPag.paginatedRows}
              page={page}
              totalPages={currentPag.totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(currentPag.totalPages, p + 1))}
              onEdit={(row) => updateRecord("Staff", row.id + 1, row)}
              onDelete={(row) => deleteRecord("Staff", row.id + 1)}
            />
          )}

          {activeTab === "Guard" && (
            <GuardTable
              rows={currentPag.paginatedRows}
              page={page}
              totalPages={currentPag.totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(currentPag.totalPages, p + 1))}
              onEdit={(row) => updateRecord("Guard", row.id + 1, row)}
              onDelete={(row) => deleteRecord("Guard", row.id + 1)}
            />
          )}

          {activeTab === "Contacts" && (
            <ContactsTable
              rows={contactPag.paginatedRows}
              page={page}
              totalPages={contactPag.totalPages}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(contactPag.totalPages, p + 1))}
              onEdit={(row) => updateRecord("Contact", row.sNo, row)}
              onDelete={(row) => deleteRecord("Contact", row.sNo)}
            />
          )}
        </div>

        {/* FOOTER */}
        <div className="mt-8 flex justify-between items-center text-xs text-gray-400">
          <div className="flex items-center gap-4">
            <span className="font-medium">Attendance Master Controller v2.0</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span className="flex items-center gap-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Real-time Data Sync Enabled
            </span>
          </div>
          <div className="flex gap-4">
            <span>Last updated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Add Staff Modal */}
      <AddStaffModal
        isOpen={showAddStaffModal}
        onClose={() => setShowAddStaffModal(false)}
        onSave={addStaffRecord}
        staffNames={staffData.map(s => s.name)}
      />

      {/* Add Guard Modal */}
      <AddGuardModal
        isOpen={showAddGuardModal}
        onClose={() => setShowAddGuardModal(false)}
        onSave={addGuardRecord}
        guardNames={guardData.map(g => g.name)}
      />

      {/* Add Contact Modal */}
      <AddContactModal
        isOpen={showAddContactModal}
        onClose={() => setShowAddContactModal(false)}
        onSave={addContactRecord}
      />

      {/* Add global styles for animations */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes gradientMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .animate-gradientMove {
          background-size: 200% 200%;
          animation: gradientMove 3s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Attendance;