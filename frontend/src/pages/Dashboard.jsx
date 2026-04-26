import React, { useState } from "react";
import { ClipboardList, FileText, IndianRupee, Package } from "lucide-react";
import OrderDashboard from "./Procurement/OrderDashboard";
import IntakeList from "./Create/IntakeList";

const tabs = [
  { key: "orders", label: "Orders", icon: ClipboardList },
  { key: "intakes", label: "Intakes", icon: FileText },
  { key: "finance", label: "Finance", icon: IndianRupee },
  { key: "store", label: "Store", icon: Package },
];

export default function Dashboard({ project }) {
  const [activeTab, setActiveTab] = useState("orders");
  const projectName = typeof project === "string" ? project : project?.name;
  const isGlobalDashboard = !projectName || projectName === "All Project";

  if (isGlobalDashboard) {
    return (
      <div className="min-h-screen bg-[#f8fafc] p-4 sm:p-6">
        <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">Global Dashboard</h1>
          <p className="mt-2 text-sm text-slate-500">Global dashboard redesign pending.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] p-3 sm:p-4 lg:p-6">
      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-1">
          <h1 className="text-xl font-bold text-slate-900">Project Dashboard</h1>
          <p className="text-sm text-slate-500">
            {projectName} overview
          </p>
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-lg bg-slate-100 p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex min-w-max items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-white text-cyan-700 shadow-sm"
                    : "text-slate-600 hover:bg-white/70 hover:text-slate-900"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "orders" && <OrderDashboard project={projectName} />}
      {activeTab === "intakes" && <IntakeList project={projectName} />}
      {activeTab === "finance" && <DashboardPlaceholder title="Finance Dashboard" text="Finance dashboard redesign pending." />}
      {activeTab === "store" && <DashboardPlaceholder title="Store Dashboard" text="Store dashboard redesign pending." />}
    </div>
  );
}

function DashboardPlaceholder({ title, text }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h2 className="text-base font-bold text-slate-800">{title}</h2>
      <p className="mt-2 text-sm text-slate-500">{text}</p>
    </div>
  );
}
