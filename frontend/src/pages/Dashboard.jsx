import React, { useState, useEffect } from "react";

export default function Dashboard({ project }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, [activeTab]);

  return (
    <div className="p-3 md:p-6 space-y-6 md:space-y-8 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 min-h-screen relative overflow-hidden">
      
      {/* BACKGROUND ELEMENTS */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-indigo-200/20 to-cyan-200/10 rounded-full blur-3xl -translate-y-48 translate-x-48"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-emerald-200/20 to-blue-200/10 rounded-full blur-3xl -translate-x-48 translate-y-48"></div>

      {/* HEADER */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-cyan-500/5 rounded-3xl blur-xl"></div>
        <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-5 md:p-8 border border-white/50 shadow-2xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="relative">
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-16 bg-gradient-to-b from-blue-600 to-cyan-500 rounded-full"></div>
              <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent pl-6">
                Construction Dashboard
              </h1>
              <p className="text-slate-600 pl-6 mt-2">
                Monitor project performance and team activities
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-500"></div>
                <div className="relative px-5 py-3 bg-white/80 rounded-2xl border border-white/50 shadow-lg backdrop-blur-sm">
                  <div className="text-sm text-slate-500 font-medium">Active Project</div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    <div className="relative">
                      <div className="absolute w-3 h-3 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                      <div className="relative w-2 h-2 bg-emerald-500 rounded-full"></div>
                    </div>
                    {project?.name || "Site Alpha Construction"}
                  </div>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-500"></div>
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl group-hover:scale-105 transition-transform duration-300">
                  {activeTab.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-white/50 to-blue-50/30 rounded-2xl blur-xl"></div>
        <div className="relative flex flex-wrap gap-2 bg-white/60 backdrop-blur-sm rounded-2xl p-1.5 border border-white/50 shadow-xl">
          {["overview", "analytics", "team", "finance", "reports"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-6 py-3 rounded-xl text-sm font-medium transition-all duration-500 ${
                activeTab === tab
                  ? "text-white"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              {activeTab === tab && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl shadow-lg"></div>
              )}
              <span className="relative z-10 flex items-center gap-2">
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* LOADING */}
      {isLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
          </div>
        </div>
      )}

      {/* CONTENT */}
      <div className={isLoading ? "opacity-50" : "opacity-100 transition-opacity duration-300"}>
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "analytics" && <AnalyticsTab />}
        {activeTab === "team" && <TeamTab />}
        {activeTab === "finance" && <FinanceTab />}
        {activeTab === "reports" && <ReportsTab />}
      </div>
    </div>
  );
}

// ================== OVERVIEW TAB ==================

function OverviewTab() {
  const [hoveredCard, setHoveredCard] = useState(null);

  return (
    <div className="space-y-8">
      {/* MAIN STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { id: 1, title: "Total Employees", value: "120", change: "+2.4%", icon: "👥", color: "blue", progress: 85 },
          { id: 2, title: "Today Attendance", value: "98", change: "82% Rate", icon: "✅", color: "emerald", progress: 82 },
          { id: 3, title: "Pending Orders", value: "15", change: "3 Urgent", icon: "⏱️", color: "amber", progress: 30 },
          { id: 4, title: "Active Projects", value: "8", change: "+2 New", icon: "📊", color: "purple", progress: 75 }
        ].map((stat) => (
          <div 
            key={stat.id}
            className="relative group"
            onMouseEnter={() => setHoveredCard(stat.id)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${
              stat.color === 'blue' ? 'from-blue-500/20 to-cyan-500/20' :
              stat.color === 'emerald' ? 'from-emerald-500/20 to-green-500/20' :
              stat.color === 'amber' ? 'from-amber-500/20 to-orange-500/20' : 'from-purple-500/20 to-pink-500/20'
            } rounded-3xl blur-xl transition-opacity duration-500 ${hoveredCard === stat.id ? 'opacity-100' : 'opacity-0'}`}></div>
            <div className={`relative backdrop-blur-sm bg-white/70 rounded-3xl p-6 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-500 ${
              hoveredCard === stat.id ? 'scale-105' : ''
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                  <div className={`flex items-center mt-2 text-sm font-medium ${
                    stat.change.includes('+') ? 'text-emerald-600' : 'text-amber-600'
                  }`}>
                    {stat.change.includes('+') ? '↗' : '↘'} {stat.change}
                    <span className="text-slate-500 ml-2">this week</span>
                  </div>
                </div>
                <div className="relative group/icon">
                  <div className={`absolute inset-0 bg-gradient-to-br ${
                    stat.color === 'blue' ? 'from-blue-600 to-cyan-500' :
                    stat.color === 'emerald' ? 'from-emerald-600 to-green-500' :
                    stat.color === 'amber' ? 'from-amber-600 to-orange-500' : 'from-purple-600 to-pink-500'
                  } rounded-2xl blur opacity-0 group-hover/icon:opacity-30 transition-opacity duration-500`}></div>
                  <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${
                    stat.color === 'blue' ? 'from-blue-600 to-cyan-500' :
                    stat.color === 'emerald' ? 'from-emerald-600 to-green-500' :
                    stat.color === 'amber' ? 'from-amber-600 to-orange-500' : 'from-purple-600 to-pink-500'
                  } flex items-center justify-center text-white text-2xl shadow-lg group-hover/icon:scale-110 transition-transform duration-300`}>
                    {stat.icon}
                  </div>
                </div>
              </div>
              <div className="mt-6">
                <div className="flex justify-between text-sm text-slate-600 mb-1.5">
                  <span>Progress</span>
                  <span className="font-semibold">{stat.progress}%</span>
                </div>
                <div className="relative w-full h-2 bg-white/50 rounded-full overflow-hidden">
                  <div 
                    className={`absolute h-full bg-gradient-to-r ${
                      stat.color === 'blue' ? 'from-blue-600 to-cyan-500' :
                      stat.color === 'emerald' ? 'from-emerald-600 to-green-500' :
                      stat.color === 'amber' ? 'from-amber-600 to-orange-500' : 'from-purple-600 to-pink-500'
                    } rounded-full transition-all duration-1000`}
                    style={{ width: `${stat.progress}%` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30 animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN CONTENT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PROJECT SUMMARY */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-8 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-500">
            <div className="flex items-center justify-between mb-8">
              <div className="relative">
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-blue-600 to-cyan-500 rounded-full"></div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent pl-4">
                  Project Summary
                </h2>
                <div className="flex items-center gap-3 mt-3 pl-4">
                  <div className="px-4 py-2 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 backdrop-blur-sm rounded-full border border-emerald-500/30">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      <span className="text-emerald-800 font-semibold">Running</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative group/icon">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-cyan-500/30 rounded-2xl blur opacity-0 group-hover/icon:opacity-100 transition-opacity duration-500"></div>
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
                  <div className="text-3xl">📋</div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white/30 to-white/10 backdrop-blur-sm rounded-2xl border border-white/30">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📍</div>
                  <div>
                    <div className="font-medium text-slate-700">Location</div>
                    <div className="text-sm text-slate-500">Site A</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">Main Zone</div>
                  <div className="text-xs text-slate-500">Construction Site</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white/30 to-white/10 backdrop-blur-sm rounded-2xl border border-white/30">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">📅</div>
                  <div>
                    <div className="font-medium text-slate-700">Start Date</div>
                    <div className="text-sm text-slate-500">Jan 2026</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">On Schedule</div>
                  <div className="text-xs text-slate-500">Phase 1 Complete</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white/30 to-white/10 backdrop-blur-sm rounded-2xl border border-white/30">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">👷</div>
                  <div>
                    <div className="font-medium text-slate-700">Manpower Today</div>
                    <div className="text-sm text-slate-500">45 Workers</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">+5</div>
                  <div className="text-xs text-slate-500">From yesterday</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-white/30 to-white/10 backdrop-blur-sm rounded-2xl border border-white/30">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">💰</div>
                  <div>
                    <div className="font-medium text-slate-700">Budget Used</div>
                    <div className="text-sm text-slate-500">$155,000</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-900">62%</div>
                  <div className="text-xs text-slate-500">On Track</div>
                </div>
              </div>

              {/* BUDGET PROGRESS */}
              <div className="mt-6 pt-6 border-t border-white/30">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Budget Progress</span>
                  <span className="text-sm font-bold text-slate-900">62%</span>
                </div>
                <div className="relative h-3 bg-white/50 rounded-full overflow-hidden">
                  <div className="absolute h-full bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full w-[62%]">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30 animate-pulse"></div>
                  </div>
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-2">
                  <span>$0</span>
                  <span>$250,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div className="lg:col-span-2 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-8 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-500">
            <div className="flex items-center justify-between mb-8">
              <div className="relative">
                <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-blue-600 to-cyan-500 rounded-full"></div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent pl-4">
                  Recent Activity
                </h2>
                <p className="text-slate-500 pl-4 mt-2">Latest project updates and actions</p>
              </div>
              <div className="relative">
                <div className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                <div className="relative w-3 h-3 bg-red-500 rounded-full"></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-r from-white/30 to-white/10 backdrop-blur-sm rounded-2xl border border-white/30 hover:border-blue-300 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">🛒</div>
                    <div>
                      <div className="font-bold text-slate-900">Purchase Request</div>
                      <div className="text-sm text-slate-500">By Procurement Team • 2 hours ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold border border-amber-200">
                      Pending
                    </span>
                    <div className="text-slate-500">02 Feb 2026</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-white/30 to-white/10 backdrop-blur-sm rounded-2xl border border-white/30 hover:border-emerald-300 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">📊</div>
                    <div>
                      <div className="font-bold text-slate-900">Attendance Updated</div>
                      <div className="text-sm text-slate-500">By HR Department • 4 hours ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold border border-emerald-200">
                      Completed
                    </span>
                    <div className="text-slate-500">01 Feb 2026</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-white/30 to-white/10 backdrop-blur-sm rounded-2xl border border-white/30 hover:border-blue-300 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">💳</div>
                    <div>
                      <div className="font-bold text-slate-900">Site Expense Added</div>
                      <div className="text-sm text-slate-500">By Finance Team • 1 day ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold border border-blue-200">
                      Approved
                    </span>
                    <div className="text-slate-500">31 Jan 2026</div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gradient-to-r from-white/30 to-white/10 backdrop-blur-sm rounded-2xl border border-white/30 hover:border-purple-300 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl">✅</div>
                    <div>
                      <div className="font-bold text-slate-900">Safety Inspection</div>
                      <div className="text-sm text-slate-500">By Safety Officer • 2 days ago</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold border border-purple-200">
                      In Progress
                    </span>
                    <div className="text-slate-500">30 Jan 2026</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/30">
              <button className="group w-full py-4 bg-gradient-to-r from-white/50 to-white/30 backdrop-blur-sm rounded-xl border border-white/50 text-slate-700 font-medium hover:text-blue-700 hover:border-blue-300 transition-all duration-300 flex items-center justify-center gap-2 hover:gap-4">
                <span>View All Activities</span>
                <svg className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ADDITIONAL METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* TEAM DISTRIBUTION */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-6 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-500">
            <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-blue-900 bg-clip-text text-transparent mb-6">
              Team Distribution
            </h3>
            <div className="space-y-4">
              {[
                { label: "Skilled Workers", value: 45, color: "from-blue-500 to-cyan-500", percentage: 37.5 },
                { label: "Semi-Skilled", value: 35, color: "from-cyan-500 to-blue-500", percentage: 29.2 },
                { label: "Unskilled", value: 20, color: "from-purple-500 to-pink-500", percentage: 16.7 },
                { label: "Supervisors", value: 20, color: "from-emerald-500 to-green-500", percentage: 16.7 }
              ].map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="font-bold text-slate-900">{item.value} ({item.percentage}%)</span>
                  </div>
                  <div className="relative w-full h-2.5 bg-white/50 rounded-full overflow-hidden">
                    <div 
                      className={`absolute h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-1000`}
                      style={{ width: `${item.percentage}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* ATTENDANCE TREND */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-6 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-500">
            <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-emerald-900 bg-clip-text text-transparent mb-6">
              Attendance Trend
            </h3>
            <div className="h-48 flex items-end justify-between px-4">
              {[65, 70, 78, 82, 85, 88, 90, 92, 94, 98].map((value, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="w-6 bg-gradient-to-t from-blue-500 to-cyan-400 rounded-t-lg hover:from-blue-400 hover:to-cyan-300 transition-all duration-300 cursor-pointer group relative"
                    style={{ height: `${value * 1.5}px` }}
                    title={`Day ${index + 1}: ${value}%`}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg">
                      Day {index + 1}: {value}%
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">D{index + 1}</div>
                </div>
              ))}
            </div>
            <div className="text-center text-slate-600 text-sm mt-4">
              Last 10 days attendance percentage
            </div>
          </div>
        </div>
        
        {/* QUICK ACTIONS */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-indigo-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-6 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-500">
            <h3 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text text-transparent mb-6">
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <button className="group p-4 rounded-xl border border-white/50 bg-white/30 backdrop-blur-sm hover:border-blue-300 hover:bg-blue-50/50 text-blue-700 transition-all duration-300 hover:-translate-y-1 active:translate-y-0">
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">➕</div>
                <div className="font-medium">Add Task</div>
              </button>
              <button className="group p-4 rounded-xl border border-white/50 bg-white/30 backdrop-blur-sm hover:border-purple-300 hover:bg-purple-50/50 text-purple-700 transition-all duration-300 hover:-translate-y-1 active:translate-y-0">
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">📋</div>
                <div className="font-medium">Generate Report</div>
              </button>
              <button className="group p-4 rounded-xl border border-white/50 bg-white/30 backdrop-blur-sm hover:border-emerald-300 hover:bg-emerald-50/50 text-emerald-700 transition-all duration-300 hover:-translate-y-1 active:translate-y-0">
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">👥</div>
                <div className="font-medium">Team Update</div>
              </button>
              <button className="group p-4 rounded-xl border border-white/50 bg-white/30 backdrop-blur-sm hover:border-amber-300 hover:bg-amber-50/50 text-amber-700 transition-all duration-300 hover:-translate-y-1 active:translate-y-0">
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-300">🔔</div>
                <div className="font-medium">Notifications</div>
              </button>
            </div>
            <div className="mt-6 pt-6 border-t border-white/30">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-slate-600 text-sm">Last sync</div>
                  <div className="font-medium text-slate-900">2 minutes ago</div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-500/20 to-emerald-600/20 backdrop-blur-sm rounded-full border border-emerald-500/30">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-emerald-800 text-sm font-semibold">Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ================== ANALYTICS TAB ==================

function AnalyticsTab() {
  const [timeRange, setTimeRange] = useState("monthly");
  
  const metrics = [
    { id: 1, name: "Productivity", value: "78%", change: "+5.2%", icon: "🚀", color: "blue" },
    { id: 2, name: "Efficiency", value: "92%", change: "+3.1%", icon: "⚡", color: "emerald" },
    { id: 3, name: "Quality", value: "88%", change: "+1.8%", icon: "⭐", color: "amber" },
    { id: 4, name: "Safety", value: "94%", change: "+2.3%", icon: "🛡️", color: "purple" }
  ];

  const chartData = {
    monthly: [65, 70, 75, 78, 82, 85, 88, 90, 92, 94, 95, 96],
    weekly: [78, 80, 82, 85, 84, 86, 88, 90, 89, 92, 91, 94],
    daily: [85, 86, 88, 87, 89, 90, 92, 91, 93, 94, 95, 96]
  };

  return (
    <div className="space-y-8">
      {/* TIME RANGE SELECTOR */}
      <div className="flex justify-end">
        <div className="flex bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-white/50">
          {["daily", "weekly", "monthly"].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                timeRange === range
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ANALYTICS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metrics.map((metric) => (
          <div key={metric.id} className="relative group">
            <div className={`absolute inset-0 bg-gradient-to-r ${
              metric.color === 'blue' ? 'from-blue-500/20 to-cyan-500/20' :
              metric.color === 'emerald' ? 'from-emerald-500/20 to-green-500/20' :
              metric.color === 'amber' ? 'from-amber-500/20 to-orange-500/20' : 'from-purple-500/20 to-pink-500/20'
            } rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-6 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-600">{metric.name}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{metric.value}</p>
                  <div className="flex items-center mt-2 text-sm font-medium text-emerald-600">
                    ↗ {metric.change}
                  </div>
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                  metric.color === 'blue' ? 'from-blue-600 to-cyan-500' :
                  metric.color === 'emerald' ? 'from-emerald-600 to-green-500' :
                  metric.color === 'amber' ? 'from-amber-600 to-orange-500' : 'from-purple-600 to-pink-500'
                } flex items-center justify-center text-white text-2xl shadow-lg`}>
                  {metric.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MAIN CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PERFORMANCE CHART */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-8 border border-white/50 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900">Performance Trend</h3>
              <div className="text-sm text-slate-500">Last 12 periods</div>
            </div>
            <div className="h-64 flex items-end justify-between px-4">
              {chartData[timeRange].map((value, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="relative group/bar">
                    <div 
                      className="w-8 bg-gradient-to-t from-blue-600 to-cyan-400 rounded-t-lg transition-all duration-300 cursor-pointer group-hover/bar:from-blue-500 group-hover/bar:to-cyan-300"
                      style={{ height: `${value * 1.5}px` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover/bar:opacity-100 transition-opacity duration-300 shadow-lg">
                        Period {index + 1}: {value}%
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500 mt-2">P{index + 1}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* METRICS COMPARISON */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-8 border border-white/50 shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900 mb-8">Metrics Comparison</h3>
            <div className="space-y-6">
              {[
                { label: "Productivity", current: 78, target: 85, color: "blue" },
                { label: "Efficiency", current: 92, target: 90, color: "emerald" },
                { label: "Quality", current: 88, target: 90, color: "amber" },
                { label: "Safety", current: 94, target: 95, color: "purple" }
              ].map((metric, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium text-slate-700">{metric.label}</span>
                    <div className="flex gap-4">
                      <span className="font-bold text-slate-900">{metric.current}%</span>
                      <span className="text-slate-500">Target: {metric.target}%</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${
                          metric.color === 'blue' ? 'from-blue-500 to-cyan-500' :
                          metric.color === 'emerald' ? 'from-emerald-500 to-green-500' :
                          metric.color === 'amber' ? 'from-amber-500 to-orange-500' : 'from-purple-500 to-pink-500'
                        } rounded-full`}
                        style={{ width: `${metric.current}%` }}
                      ></div>
                    </div>
                    <div className="w-1 h-3 bg-slate-400 rounded-full" style={{ marginLeft: `${metric.target}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* INSIGHTS */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-8 border border-white/50 shadow-2xl">
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { 
                title: "Peak Productivity", 
                description: "Wednesday mornings show highest productivity rates", 
                icon: "📈",
                color: "blue"
              },
              { 
                title: "Quality Improvement", 
                description: "Quality scores increased by 12% this quarter", 
                icon: "⭐",
                color: "emerald"
              },
              { 
                title: "Safety Milestone", 
                description: "60 days without any safety incidents", 
                icon: "🛡️",
                color: "amber"
              }
            ].map((insight, index) => (
              <div key={index} className="p-6 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-2xl border border-white/30">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                  insight.color === 'blue' ? 'from-blue-500 to-cyan-500' :
                  insight.color === 'emerald' ? 'from-emerald-500 to-green-500' : 'from-amber-500 to-orange-500'
                } flex items-center justify-center text-white text-xl mb-4`}>
                  {insight.icon}
                </div>
                <h4 className="font-bold text-slate-900 mb-2">{insight.title}</h4>
                <p className="text-slate-600 text-sm">{insight.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ================== TEAM TAB ==================

function TeamTab() {
  const [activeTeam, setActiveTeam] = useState("all");
  
  const teams = [
    { id: 1, name: "Rajesh Kumar", role: "Site Manager", status: "active", projects: 3, avatar: "RK", department: "Management" },
    { id: 2, name: "Priya Sharma", role: "Civil Engineer", status: "active", projects: 2, avatar: "PS", department: "Engineering" },
    { id: 3, name: "Amit Patel", role: "Safety Officer", status: "on-leave", projects: 1, avatar: "AP", department: "Safety" },
    { id: 4, name: "Sneha Reddy", role: "Architect", status: "active", projects: 4, avatar: "SR", department: "Design" },
    { id: 5, name: "Vikram Singh", role: "Project Coordinator", status: "active", projects: 3, avatar: "VS", department: "Management" },
    { id: 6, name: "Anjali Mehta", role: "Quality Inspector", status: "training", projects: 2, avatar: "AM", department: "Quality" },
    { id: 7, name: "Rohan Verma", role: "Electrical Engineer", status: "active", projects: 3, avatar: "RV", department: "Engineering" },
    { id: 8, name: "Meera Joshi", role: "Plumbing Supervisor", status: "active", projects: 2, avatar: "MJ", department: "Engineering" }
  ];

  const departments = [
    { name: "Management", count: 3, color: "blue" },
    { name: "Engineering", count: 4, color: "emerald" },
    { name: "Safety", count: 2, color: "amber" },
    { name: "Design", count: 2, color: "purple" },
    { name: "Quality", count: 2, color: "cyan" }
  ];

  return (
    <div className="space-y-8">
      {/* TEAM STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Team", value: "45", change: "+3 New", icon: "👥", color: "blue", progress: 90 },
          { title: "Present Today", value: "42", change: "93%", icon: "✅", color: "emerald", progress: 93 },
          { title: "On Leave", value: "3", change: "2 Planned", icon: "🏖️", color: "amber", progress: 7 },
          { title: "In Training", value: "5", change: "Ongoing", icon: "🎓", color: "purple", progress: 11 }
        ].map((stat, index) => (
          <div key={index} className="relative group">
            <div className={`absolute inset-0 bg-gradient-to-r ${
              stat.color === 'blue' ? 'from-blue-500/20 to-cyan-500/20' :
              stat.color === 'emerald' ? 'from-emerald-500/20 to-green-500/20' :
              stat.color === 'amber' ? 'from-amber-500/20 to-orange-500/20' : 'from-purple-500/20 to-pink-500/20'
            } rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-6 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2 text-sm font-medium text-emerald-600">
                    {stat.change}
                  </div>
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                  stat.color === 'blue' ? 'from-blue-600 to-cyan-500' :
                  stat.color === 'emerald' ? 'from-emerald-600 to-green-500' :
                  stat.color === 'amber' ? 'from-amber-600 to-orange-500' : 'from-purple-600 to-pink-500'
                } flex items-center justify-center text-white text-2xl shadow-lg`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* TEAM FILTERS */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setActiveTeam("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTeam === "all"
              ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
              : "bg-white/60 text-slate-600 hover:text-slate-900"
          }`}
        >
          All Teams
        </button>
        {departments.map((dept) => (
          <button
            key={dept.name}
            onClick={() => setActiveTeam(dept.name.toLowerCase())}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTeam === dept.name.toLowerCase()
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
                : "bg-white/60 text-slate-600 hover:text-slate-900"
            }`}
          >
            {dept.name} ({dept.count})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* TEAM MEMBERS */}
        <div className="lg:col-span-2 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-8 border border-white/50 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900">Team Members</h3>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                + Add Member
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {teams
                .filter(member => activeTeam === "all" || member.department.toLowerCase() === activeTeam)
                .map((member) => (
                  <div key={member.id} className="p-4 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-2xl border border-white/30 hover:border-blue-300 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                        member.department === "Management" ? "from-blue-600 to-cyan-500" :
                        member.department === "Engineering" ? "from-emerald-600 to-green-500" :
                        member.department === "Safety" ? "from-amber-600 to-orange-500" :
                        member.department === "Design" ? "from-purple-600 to-pink-500" : "from-cyan-600 to-blue-500"
                      } flex items-center justify-center text-white font-bold text-lg`}>
                        {member.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-slate-900">{member.name}</div>
                        <div className="text-sm text-slate-600">{member.role}</div>
                        <div className="flex items-center gap-2 mt-2">
                          <div className={`w-2 h-2 rounded-full ${
                            member.status === 'active' ? 'bg-emerald-500' :
                            member.status === 'on-leave' ? 'bg-amber-500' : 'bg-purple-500'
                          }`}></div>
                          <span className="text-xs text-slate-500 capitalize">{member.status}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-slate-900">{member.projects}</div>
                        <div className="text-xs text-slate-500">Projects</div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* TEAM OVERVIEW */}
        <div className="space-y-6">
          
          {/* DEPARTMENT BREAKDOWN */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-6 border border-white/50 shadow-2xl">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Department Breakdown</h3>
              <div className="space-y-4">
                {departments.map((dept, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-slate-700">{dept.name}</span>
                      <span className="font-bold text-slate-900">{dept.count} members</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full bg-gradient-to-r ${
                          dept.color === 'blue' ? 'from-blue-500 to-cyan-500' :
                          dept.color === 'emerald' ? 'from-emerald-500 to-green-500' :
                          dept.color === 'amber' ? 'from-amber-500 to-orange-500' :
                          dept.color === 'purple' ? 'from-purple-500 to-pink-500' : 'from-cyan-500 to-blue-500'
                        } rounded-full`}
                        style={{ width: `${(dept.count / 13) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* UPCOMING BIRTHDAYS */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-6 border border-white/50 shadow-2xl">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Upcoming Birthdays</h3>
              <div className="space-y-4">
                {[
                  { name: "Rajesh Kumar", date: "Feb 15", avatar: "RK" },
                  { name: "Priya Sharma", date: "Feb 18", avatar: "PS" },
                  { name: "Vikram Singh", date: "Feb 22", avatar: "VS" }
                ].map((person, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 hover:bg-white/30 rounded-xl transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold">
                      {person.avatar}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-slate-900">{person.name}</div>
                      <div className="text-sm text-slate-500">Birthday: {person.date}</div>
                    </div>
                    <div className="text-2xl">🎂</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
// ================== FINANCE TAB ==================

function FinanceTab() {
  const [activePeriod, setActivePeriod] = useState("quarterly");
  
  const financialData = {
    quarterly: {
      revenue: "$850,000",
      expenses: "$620,000",
      profit: "$230,000",
      growth: "+12.5%"
    },
    monthly: {
      revenue: "$285,000",
      expenses: "$210,000",
      profit: "$75,000",
      growth: "+8.3%"
    },
    yearly: {
      revenue: "$3,200,000",
      expenses: "$2,450,000",
      profit: "$750,000",
      growth: "+15.2%"
    }
  };

  const expenseCategories = [
    { category: "Materials", amount: "$425,000", percentage: 55, color: "blue" },
    { category: "Labor", amount: "$225,000", percentage: 29, color: "emerald" },
    { category: "Equipment", amount: "$75,000", percentage: 10, color: "amber" },
    { category: "Miscellaneous", amount: "$50,000", percentage: 6, color: "purple" }
  ];

  return (
    <div className="space-y-8">
      {/* PERIOD SELECTOR */}
      <div className="flex justify-end">
        <div className="flex bg-white/60 backdrop-blur-sm rounded-xl p-1 border border-white/50">
          {["monthly", "quarterly", "yearly"].map((period) => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activePeriod === period
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* FINANCIAL SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            title: "Total Revenue", 
            value: financialData[activePeriod].revenue, 
            change: financialData[activePeriod].growth, 
            icon: "💰", 
            color: "emerald" 
          },
          { 
            title: "Total Expenses", 
            value: financialData[activePeriod].expenses, 
            change: "+5.2%", 
            icon: "📊", 
            color: "blue" 
          },
          { 
            title: "Net Profit", 
            value: financialData[activePeriod].profit, 
            change: "+18.3%", 
            icon: "📈", 
            color: "purple" 
          },
          { 
            title: "Profit Margin", 
            value: "27.1%", 
            change: "+2.4%", 
            icon: "🎯", 
            color: "amber" 
          }
        ].map((stat, index) => (
          <div key={index} className="relative group">
            <div className={`absolute inset-0 bg-gradient-to-r ${
              stat.color === 'blue' ? 'from-blue-500/20 to-cyan-500/20' :
              stat.color === 'emerald' ? 'from-emerald-500/20 to-green-500/20' :
              stat.color === 'amber' ? 'from-amber-500/20 to-orange-500/20' : 'from-purple-500/20 to-pink-500/20'
            } rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-6 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2 text-sm font-medium text-emerald-600">
                    ↗ {stat.change}
                  </div>
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                  stat.color === 'blue' ? 'from-blue-600 to-cyan-500' :
                  stat.color === 'emerald' ? 'from-emerald-600 to-green-500' :
                  stat.color === 'amber' ? 'from-amber-600 to-orange-500' : 'from-purple-600 to-pink-500'
                } flex items-center justify-center text-white text-2xl shadow-lg`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* EXPENSE BREAKDOWN */}
        <div className="lg:col-span-2 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-8 border border-white/50 shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900 mb-8">Expense Breakdown</h3>
            <div className="space-y-6">
              {expenseCategories.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                        category.color === 'blue' ? 'from-blue-500 to-cyan-500' :
                        category.color === 'emerald' ? 'from-emerald-500 to-green-500' :
                        category.color === 'amber' ? 'from-amber-500 to-orange-500' : 'from-purple-500 to-pink-500'
                      }`}></div>
                      <span className="font-medium text-slate-700">{category.category}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-bold text-slate-900">{category.amount}</span>
                      <span className="text-slate-600">{category.percentage}%</span>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${
                        category.color === 'blue' ? 'from-blue-500 to-cyan-500' :
                        category.color === 'emerald' ? 'from-emerald-500 to-green-500' :
                        category.color === 'amber' ? 'from-amber-500 to-orange-500' : 'from-purple-500 to-pink-500'
                      } rounded-full`}
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BUDGET STATUS */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-8 border border-white/50 shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900 mb-8">Budget Status</h3>
            <div className="text-center">
              <div className="relative w-48 h-48 mx-auto mb-6">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="20"/>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="20" 
                    strokeDasharray="251.2" strokeDashoffset="95.456" transform="rotate(-90 50 50)"/>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <div className="text-4xl font-bold text-slate-900">62%</div>
                  <div className="text-slate-600">Utilized</div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Total Budget</span>
                  <span className="font-bold text-slate-900">$250,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Amount Used</span>
                  <span className="font-bold text-slate-900">$155,000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Remaining</span>
                  <span className="font-bold text-slate-900">$95,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RECENT TRANSACTIONS */}
      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-8 border border-white/50 shadow-2xl">
          <h3 className="text-2xl font-bold text-slate-900 mb-8">Recent Transactions</h3>
          <div className="space-y-4">
            {[
              { description: "Construction Materials", amount: "$28,500", date: "Feb 5, 2026", type: "expense", status: "completed" },
              { description: "Equipment Rental", amount: "$15,200", date: "Feb 3, 2026", type: "expense", status: "completed" },
              { description: "Client Payment", amount: "$75,000", date: "Feb 1, 2026", type: "revenue", status: "completed" },
              { description: "Team Bonus", amount: "$12,000", date: "Jan 30, 2026", type: "expense", status: "pending" }
            ].map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-2xl border border-white/30">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    transaction.type === 'revenue' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {transaction.type === 'revenue' ? '💰' : '💳'}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">{transaction.description}</div>
                    <div className="text-sm text-slate-500">{transaction.date}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`font-bold ${transaction.type === 'revenue' ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {transaction.type === 'revenue' ? '+' : '-'}{transaction.amount}
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    transaction.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ================== REPORTS TAB ==================

function ReportsTab() {
  const [reportType, setReportType] = useState("all");
  
  const reports = [
    { 
      id: 1, 
      title: "Monthly Progress Report", 
      date: "01 Feb 2026", 
      status: "approved", 
      type: "progress", 
      size: "2.4 MB",
      icon: "📊"
    },
    { 
      id: 2, 
      title: "Safety Audit Report", 
      date: "28 Jan 2026", 
      status: "approved", 
      type: "safety", 
      size: "1.8 MB",
      icon: "🛡️"
    },
    { 
      id: 3, 
      title: "Financial Summary Q4", 
      date: "25 Jan 2026", 
      status: "pending", 
      type: "finance", 
      size: "3.2 MB",
      icon: "💰"
    },
    { 
      id: 4, 
      title: "Equipment Maintenance Log", 
      date: "20 Jan 2026", 
      status: "approved", 
      type: "equipment", 
      size: "1.5 MB",
      icon: "🔧"
    },
    { 
      id: 5, 
      title: "Quality Inspection Report", 
      date: "15 Jan 2026", 
      status: "approved", 
      type: "quality", 
      size: "2.1 MB",
      icon: "⭐"
    },
    { 
      id: 6, 
      title: "Environmental Compliance", 
      date: "10 Jan 2026", 
      status: "in-review", 
      type: "compliance", 
      size: "2.7 MB",
      icon: "🌿"
    }
  ];

  const reportStats = [
    { type: "progress", count: 15, color: "blue" },
    { type: "safety", count: 8, color: "emerald" },
    { type: "finance", count: 12, color: "amber" },
    { type: "quality", count: 6, color: "purple" },
    { type: "equipment", count: 4, color: "cyan" }
  ];

  return (
    <div className="space-y-8">
      {/* REPORTS STATS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: "Total Reports", value: "45", change: "+8 New", icon: "📋", color: "blue", progress: 89 },
          { title: "This Month", value: "12", change: "Generated", icon: "📅", color: "emerald", progress: 27 },
          { title: "Pending Review", value: "3", change: "Due soon", icon: "⏱️", color: "amber", progress: 7 },
          { title: "Approved", value: "40", change: "89%", icon: "✅", color: "purple", progress: 89 }
        ].map((stat, index) => (
          <div key={index} className="relative group">
            <div className={`absolute inset-0 bg-gradient-to-r ${
              stat.color === 'blue' ? 'from-blue-500/20 to-cyan-500/20' :
              stat.color === 'emerald' ? 'from-emerald-500/20 to-green-500/20' :
              stat.color === 'amber' ? 'from-amber-500/20 to-orange-500/20' : 'from-purple-500/20 to-pink-500/20'
            } rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
            <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-6 border border-white/50 shadow-2xl hover:shadow-3xl transition-all duration-500">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2 text-sm font-medium text-emerald-600">
                    {stat.change}
                  </div>
                </div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                  stat.color === 'blue' ? 'from-blue-600 to-cyan-500' :
                  stat.color === 'emerald' ? 'from-emerald-600 to-green-500' :
                  stat.color === 'amber' ? 'from-amber-600 to-orange-500' : 'from-purple-600 to-pink-500'
                } flex items-center justify-center text-white text-2xl shadow-lg`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* REPORT TYPE FILTERS */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setReportType("all")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            reportType === "all"
              ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
              : "bg-white/60 text-slate-600 hover:text-slate-900"
          }`}
        >
          All Reports
        </button>
        {reportStats.map((stat) => (
          <button
            key={stat.type}
            onClick={() => setReportType(stat.type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              reportType === stat.type
                ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg"
                : "bg-white/60 text-slate-600 hover:text-slate-900"
            }`}
          >
            {stat.type.charAt(0).toUpperCase() + stat.type.slice(1)} ({stat.count})
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* REPORTS LIST */}
        <div className="lg:col-span-2 relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-8 border border-white/50 shadow-2xl">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-bold text-slate-900">Recent Reports</h3>
              <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                Generate New Report
              </button>
            </div>
            <div className="space-y-4">
              {reports
                .filter(report => reportType === "all" || report.type === reportType)
                .map((report) => (
                  <div key={report.id} className="p-4 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-2xl border border-white/30 hover:border-blue-300 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{report.icon}</div>
                        <div>
                          <div className="font-bold text-slate-900">{report.title}</div>
                          <div className="text-sm text-slate-500">Created: {report.date} • Size: {report.size}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          report.status === 'approved' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          report.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                        </span>
                        <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow hover:shadow-lg transition-all duration-300">
                          Download
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* REPORTS OVERVIEW */}
        <div className="space-y-6">
          
          {/* REPORT TYPES */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-6 border border-white/50 shadow-2xl">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Report Types</h3>
              <div className="space-y-4">
                {reportStats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-white/30 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${
                        stat.color === 'blue' ? 'from-blue-500 to-cyan-500' :
                        stat.color === 'emerald' ? 'from-emerald-500 to-green-500' :
                        stat.color === 'amber' ? 'from-amber-500 to-orange-500' :
                        stat.color === 'purple' ? 'from-purple-500 to-pink-500' : 'from-cyan-500 to-blue-500'
                      }`}></div>
                      <div className="font-medium text-slate-700 capitalize">{stat.type} Reports</div>
                    </div>
                    <span className="font-bold text-slate-900">{stat.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* QUICK ACTIONS */}
          <div className="relative group">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative backdrop-blur-sm bg-white/70 rounded-3xl p-6 border border-white/50 shadow-2xl">
              <h3 className="text-xl font-bold text-slate-900 mb-6">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-xl border border-blue-200 text-blue-700 font-medium hover:bg-blue-50 transition-colors">
                  📊 Generate Progress Report
                </button>
                <button className="w-full p-3 bg-gradient-to-r from-emerald-500/10 to-green-500/10 backdrop-blur-sm rounded-xl border border-emerald-200 text-emerald-700 font-medium hover:bg-emerald-50 transition-colors">
                  📈 Export Analytics
                </button>
                <button className="w-full p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-xl border border-purple-200 text-purple-700 font-medium hover:bg-purple-50 transition-colors">
                  📋 Create Custom Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}