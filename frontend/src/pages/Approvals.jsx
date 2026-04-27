import React, { useEffect, useMemo, useState } from "react";
import { CircleCheck, ClipboardList, Clock, FileText, IndianRupee, RefreshCw, Search } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const cardCls = "rounded-lg border border-slate-200 bg-white shadow-sm";
const statusCls = {
  Review: "bg-amber-50 text-amber-700 border-amber-200",
  "Pending Issue": "bg-orange-50 text-orange-700 border-orange-200",
  submitted: "bg-blue-50 text-blue-700 border-blue-200",
  in_review: "bg-purple-50 text-purple-700 border-purple-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const orderTitle = (order) => order.order_number || order.snapshot?.orderNumber || `Order ${order.id?.slice?.(0, 8) || ""}`;
const intakeTitle = (intake) => intake.intake_number || `Intake ${intake.id?.slice?.(0, 8) || ""}`;
const money = (value) => Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

export default function Approvals() {
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [intakes, setIntakes] = useState([]);
  const [amendments, setAmendments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // request_id being processed
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const [ordersRes, intakesRes, amendRes] = await Promise.all([
        fetch(`${API}/api/orders`),
        fetch(`${API}/api/intakes`),
        fetch(`${API}/api/amendments/requests`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem("bms_token") || ""}` }
        }),
      ]);
      const [ordersData, intakesData, amendData] = await Promise.all([
        ordersRes.json().catch(() => ({})),
        intakesRes.json().catch(() => ({})),
        amendRes.json().catch(() => ({})),
      ]);
      setOrders(ordersData.orders || []);
      setIntakes(intakesData.intakes || []);
      setAmendments(amendData.requests || []);
    } catch {
      setOrders([]);
      setIntakes([]);
      setAmendments([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAmendAction = async (request_id, action) => {
    setActionLoading(request_id);
    try {
      const res = await fetch(`${API}/api/amendments/action`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem("bms_token") || ""}` },
        body: JSON.stringify({ request_id, action })
      });
      const data = await res.json();
      if (data.success) {
        load(); // Refresh list
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  };

  const pendingOrders = useMemo(() => (
    orders.filter((o) => ["Review", "Pending Issue"].includes(o.status))
  ), [orders]);

  const pendingIntakes = useMemo(() => (
    intakes.filter((i) => ["submitted", "in_review"].includes(i.status))
  ), [intakes]);

  const tabs = [
    { key: "orders", label: "Orders", icon: ClipboardList, count: pendingOrders.length },
    { key: "intake", label: "Intake", icon: FileText, count: pendingIntakes.length },
    { key: "amendments", label: "Amendments", icon: RefreshCw, count: amendments.length },
    { key: "payments", label: "Payments", icon: IndianRupee, count: 0 },
  ];

  const query = search.trim().toLowerCase();
  const filteredOrders = pendingOrders.filter((o) => {
    const text = [
      orderTitle(o),
      o.status,
      o.snapshot?.vendor?.vendorName,
      o.vendors?.vendor_name,
      o.snapshot?.site?.siteCode,
      o.sites?.site_code,
      o.made_by,
    ].filter(Boolean).join(" ").toLowerCase();
    return !query || text.includes(query);
  });
  const filteredIntakes = pendingIntakes.filter((i) => {
    const text = [intakeTitle(i), i.name, i.site_name, i.requisition_by, i.status].filter(Boolean).join(" ").toLowerCase();
    return !query || text.includes(query);
  });

  return (
    <div className="min-h-screen bg-[#f8fafc] p-3 sm:p-4 lg:p-6">
      <div className={`${cardCls} mb-4 p-4 sm:p-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 ring-1 ring-cyan-100">
              <CircleCheck size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Approvals</h1>
              <p className="text-sm text-slate-500">Pending requests from orders, intake, and payments.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={load}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-cyan-300 hover:text-cyan-700"
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      <div className={`${cardCls} mb-4 p-2`}>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const on = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-colors ${on ? "bg-cyan-600 text-white" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  <Icon size={15} />
                  {tab.label}
                  <span className={`rounded-full px-2 py-0.5 text-[11px] ${on ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"}`}>{tab.count}</span>
                </button>
              );
            })}
          </div>
          <div className="relative min-w-0 md:w-80">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search requests..."
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className={`${cardCls} p-8 text-center text-sm font-semibold text-slate-400`}>Loading approvals...</div>
      ) : activeTab === "orders" ? (
        <ApprovalTable
          emptyText="No pending order approval requests."
          rows={filteredOrders.map((o) => ({
            id: o.id,
            number: orderTitle(o),
            title: o.subject || o.snapshot?.subject || "Order approval",
            source: o.snapshot?.site?.siteCode || o.sites?.site_code || "-",
            owner: o.made_by || o.snapshot?.madeBy || "-",
            amount: o.totals?.grandTotal ? `Rs ${money(o.totals.grandTotal)}` : "-",
            status: o.status,
          }))}
        />
      ) : activeTab === "amendments" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {amendments.length === 0 ? (
            <div className={`${cardCls} col-span-full p-8 text-center text-sm font-semibold text-slate-400`}>No pending amendment requests.</div>
          ) : amendments.map((req) => (
            <div key={req.id} className={`${cardCls} p-5 flex flex-col`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 bg-amber-50 rounded flex items-center justify-center text-amber-600">
                    <RefreshCw size={16} />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-tight">{req.original_order?.order_number}</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Requested by {req.requestor?.name}</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reason</p>
                  <p className="text-xs text-slate-700 leading-relaxed font-medium">{req.reason}</p>
                </div>
                
                {req.attachment_url && (
                  <a href={req.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 hover:underline">
                    <FileText size={12} /> VIEW ATTACHED PROOF
                  </a>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
                <button
                  disabled={actionLoading === req.id}
                  onClick={() => handleAmendAction(req.id, "Rejected")}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 text-slate-600 font-bold rounded-lg text-[11px] hover:bg-slate-50"
                >
                  REJECT
                </button>
                <button
                  disabled={actionLoading === req.id}
                  onClick={() => handleAmendAction(req.id, "Approved")}
                  className="flex-1 px-3 py-2 bg-amber-500 text-white font-bold rounded-lg text-[11px] hover:bg-amber-600 shadow-sm"
                >
                  {actionLoading === req.id ? "..." : "APPROVE"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={`${cardCls} p-8 text-center`}>
          <Clock size={24} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm font-semibold text-slate-500">Payment approvals will appear here once payment request workflow is connected.</p>
        </div>
      )}
    </div>
  );
}

function ApprovalTable({ rows, emptyText }) {
  if (!rows.length) {
    return <div className={`${cardCls} p-8 text-center text-sm font-semibold text-slate-400`}>{emptyText}</div>;
  }

  return (
    <div className={`${cardCls} overflow-hidden`}>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3 font-bold">Request No.</th>
              <th className="px-4 py-3 font-bold">Title</th>
              <th className="px-4 py-3 font-bold">Project / Site</th>
              <th className="px-4 py-3 font-bold">Requested By</th>
              <th className="px-4 py-3 font-bold">Value</th>
              <th className="px-4 py-3 font-bold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3 font-mono text-xs font-bold text-cyan-700">{row.number}</td>
                <td className="px-4 py-3 font-semibold text-slate-800">{row.title}</td>
                <td className="px-4 py-3 text-slate-500">{row.source}</td>
                <td className="px-4 py-3 text-slate-500">{row.owner}</td>
                <td className="px-4 py-3 text-slate-600">{row.amount}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${statusCls[row.status] || "border-slate-200 bg-slate-50 text-slate-600"}`}>
                    {String(row.status).replace("_", " ")}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
