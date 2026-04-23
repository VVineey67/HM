import React, { useState, useEffect } from "react";
import { List, Search, Trash2, Eye, Pencil, FileDown, Rocket, X } from "lucide-react";
import ViewOrder from "./ViewOrder";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function OrderRecord(props) {
  const { project } = props;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [viewOrderId, setViewOrderId] = useState(() => sessionStorage.getItem("bms_view_order_id") || null);
  const [activeTab, setActiveTab] = useState("All");
  const [pdfPreviewId, setPdfPreviewId] = useState(null);
  const [pdfPreviewNonce, setPdfPreviewNonce] = useState(0);
  const [pdfDownloading, setPdfDownloading] = useState(false);

  const TABS = ["All", "Draft", "Review", "Pending Issue", "Issued", "Rejected", "Revert", "Recall"];

  // Persist viewOrderId so browser refresh stays on the same order
  useEffect(() => {
    if (viewOrderId) sessionStorage.setItem("bms_view_order_id", viewOrderId);
    else sessionStorage.removeItem("bms_view_order_id");
  }, [viewOrderId]);

  useEffect(() => { fetchOrders(); }, []);


  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/orders`);
      const data = await res.json();
      setOrders(data.orders || []);
    } catch {
      showToast("Failed to fetch orders", "error");
    }
    setLoading(false);
  };

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const handleSendToApproval = async (id) => {
    try {
      showToast("Initializing approval flow...");
      // 1. Update Order Status to Pending Issue
      const updRes = await fetch(`${API}/api/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: JSON.stringify({ mainData: { status: 'Pending Issue' } }) })
      });
      if (!updRes.ok) throw new Error("Failed to update status");

      // 2. Initialize Approval Engine
      const appRes = await fetch(`${API}/api/approvals/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem("bms_token") || ""}` },
        body: JSON.stringify({
          module_key: "create_order",
          document_id: id,
          requestor_id: JSON.parse(localStorage.getItem("bms_user") || "{}").id
        })
      });
      if (!appRes.ok) throw new Error("Approval init failed");

      showToast("Order submitted for approval!");
      fetchOrders();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this order?")) return;
    try {
      await fetch(`${API}/api/orders/${id}`, { method: "DELETE" });
      showToast("Order deleted successfully");
      fetchOrders();
    } catch { showToast("Failed to delete", "error"); }
  };

  const openPDFPreview = (orderId) => {
    setPdfPreviewNonce(Date.now());
    setPdfPreviewId(orderId);
  };

  const handlePDFDownload = async () => {
    if (!pdfPreviewId || pdfDownloading) return;
    setPdfDownloading(true);
    try {
      const res = await fetch(`${API}/api/orders/${pdfPreviewId}/pdf?download=1&t=${pdfPreviewNonce || Date.now()}`);
      if (!res.ok) throw new Error("PDF failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PO_${pdfPreviewId}.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
    } catch {
      showToast("Download failed", "error");
    }
    setPdfDownloading(false);
  };


  const filtered = orders.filter(o => {
    const matchesSearch = 
      o.order_number?.toLowerCase().includes(search.toLowerCase()) || 
      o.subject?.toLowerCase().includes(search.toLowerCase()) ||
      o.vendors?.vendor_name?.toLowerCase().includes(search.toLowerCase());
    
    const matchesTab = activeTab === "All" || o.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="p-3 sm:p-4 lg:p-6 w-full pb-32">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg
          ${toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 bg-white p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 bg-sky-50 rounded-xl flex items-center justify-center border border-sky-100">
            <List size={24} className="text-sky-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Order Records</h1>
            <p className="text-sm text-slate-400">View and Export generated PO/WO</p>
          </div>
        </div>
      </div>

      {viewOrderId ? (
        <ViewOrder 
          orderId={viewOrderId} 
          onBack={() => setViewOrderId(null)} 
          onEdit={(id) => { setViewOrderId(null); props.onEdit && props.onEdit(id); }}
        />
      ) : (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <div className="border-b border-slate-100 px-4 pt-4 flex flex-col gap-4">
           {/* Tabs */}
           <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
             {TABS.map(t => (
               <button key={t} onClick={() => setActiveTab(t)}
                 className={`pb-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap
                   ${activeTab === t ? "text-sky-600 border-sky-600" : "text-slate-400 border-transparent hover:text-slate-600"}`}>
                 {t}
               </button>
             ))}
           </div>

           <div className="pb-4 flex items-center justify-between gap-4">
              <div className="relative w-full max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                 placeholder="Search by PO number, subject, vendor..."
                 className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-50 bg-white" />
              </div>
              <div className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
                Total Orders: {filtered.length}
              </div>
           </div>
        </div>
        
        {loading ? (
           <div className="p-10 text-center text-slate-400 text-sm">Loading orders...</div>
        ) : filtered.length === 0 ? (
           <div className="p-16 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">No orders found</div>
        ) : (
          <div className="overflow-x-auto w-full rounded-b-2xl">
            <table className="w-full text-sm text-left border-collapse" style={{minWidth:'700px'}}>
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  <th style={{width:'75px', whiteSpace:'nowrap'}} className="px-3 py-3 uppercase tracking-wider text-[10px] font-bold border-b border-r border-slate-200 bg-slate-50">Company</th>
                  <th style={{width:'60px', whiteSpace:'nowrap'}} className="px-3 py-3 uppercase tracking-wider text-[10px] font-bold border-b border-r border-slate-200 bg-slate-50">Site</th>
                  <th style={{width:'110px', whiteSpace:'nowrap'}} className="px-3 py-3 uppercase tracking-wider text-[10px] font-bold border-b border-r border-slate-200 bg-slate-50">Order No</th>
                  <th style={{width:'70px', whiteSpace:'nowrap'}} className="px-3 py-3 uppercase tracking-wider text-[10px] font-bold border-b border-r border-slate-200">Type</th>
                  <th style={{width:'80px', whiteSpace:'nowrap'}} className="px-3 py-3 uppercase tracking-wider text-[10px] font-bold border-b border-r border-slate-200">Made By</th>
                  <th style={{width:'85px', whiteSpace:'nowrap'}} className="px-3 py-3 uppercase tracking-wider text-[10px] font-bold border-b border-r border-slate-200">Date</th>
                  <th style={{whiteSpace:'nowrap'}} className="px-3 py-3 uppercase tracking-wider text-[10px] font-bold border-b border-r border-slate-200">Subject</th>
                  <th style={{whiteSpace:'nowrap'}} className="px-3 py-3 uppercase tracking-wider text-[10px] font-bold border-b border-r border-slate-200">Vendor</th>
                  <th style={{width:'75px', whiteSpace:'nowrap'}} className="px-3 py-3 uppercase tracking-wider text-[10px] font-bold border-b border-r border-slate-200 text-center">Status</th>
                  <th style={{width:'155px', whiteSpace:'nowrap'}} className="px-3 py-3 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200 text-center bg-slate-50">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {filtered.map(o => {
                  const snap = o.snapshot || {};
                  const vName = snap.vendor?.vendorName || snap.vendor?.vendor_name || o.vendors?.vendor_name || "—";
                  const sCode = snap.site?.siteCode || snap.site?.site_code || o.sites?.site_code || "—";
                  const cCode = snap.company?.companyCode || snap.company?.company_code || o.companies?.company_code || "—";
                  
                  const typeCode = o.order_type === "Supply" ? "PO" : "WO";
                  const prefix = `${cCode}/${sCode}/${typeCode}/`;
                  const displayNo = o.order_number?.startsWith("PENDING-") ? prefix : o.order_number;

                  return (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-3 py-3.5 border-b border-r border-slate-100 font-bold text-slate-700 text-xs" style={{maxWidth:'80px', overflow:'hidden'}}>
                        <span style={{display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}} title={cCode}>{cCode}</span>
                      </td>
                      <td className="px-3 py-3.5 border-b border-r border-slate-100 font-bold text-indigo-600 text-xs" style={{maxWidth:'65px', overflow:'hidden'}}>
                        <span style={{display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}} title={sCode}>{sCode}</span>
                      </td>
                      <td className="px-3 py-3.5 border-b border-r border-slate-200 font-mono font-bold text-xs" style={{maxWidth:'110px', overflow:'hidden'}} title={displayNo || '—'}>
                        <span style={{display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}} className={displayNo ? "text-slate-800" : "text-slate-300"}>
                          {displayNo || "—"}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 border-b border-r border-slate-100">
                        <span style={{whiteSpace:'nowrap', background: o.order_type === "Supply" ? "#eef2ff" : "#fff7ed", color: o.order_type === "Supply" ? "#4338ca" : "#c2410c", border: o.order_type === "Supply" ? "1px solid #e0e7ff" : "1px solid #fed7aa"}} className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
                          {o.order_type || "Supply"}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 border-b border-r border-slate-100 text-slate-600 text-[11px] font-medium" style={{maxWidth:'80px', overflow:'hidden'}}>
                        <span style={{display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}} title={o.made_by || "System"}>{o.made_by || "System"}</span>
                      </td>
                      <td className="px-3 py-3.5 border-b border-r border-slate-100 text-slate-500 text-[11px] font-medium" style={{whiteSpace:'nowrap'}}>{new Date(o.date_of_creation || o.created_at).toLocaleDateString("en-IN")}</td>
                      <td className="px-3 py-3.5 border-b border-r border-slate-100 text-slate-700 text-xs font-semibold" style={{overflow:'hidden'}}>
                        <span style={{display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}} title={o.subject}>{o.subject || "—"}</span>
                      </td>
                      <td className="px-3 py-3.5 border-b border-r border-slate-100 text-slate-700 text-xs font-medium" style={{overflow:'hidden'}}>
                        <span style={{display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}} title={vName}>{vName}</span>
                      </td>
                      <td className="px-3 py-3.5 border-b border-r border-slate-100 text-center">
                        <span style={{whiteSpace:'nowrap', display:'inline-flex'}} className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest
                          ${o.status === "Approved" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : 
                            o.status === "Issued" ? "bg-emerald-100 text-emerald-800 border border-emerald-200" :
                            o.status === "Review" ? "bg-sky-50 text-sky-600 border border-sky-100" :
                            o.status === "Draft" ? "bg-slate-100 text-slate-600" : "bg-amber-50 text-amber-600 border border-amber-100"}`}>
                          {o.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 border-b border-slate-200 bg-white group-hover:bg-slate-50 transition-colors">
                        <div className="flex items-center justify-center gap-1.5">
                          <button onClick={() => setViewOrderId(o.id)} 
                            className="h-7 w-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 transition-all shadow-sm"
                            title="View Full Order">
                            <Eye size={14} />
                          </button>
                          {o.status === 'Review' && (
                            <button onClick={() => handleSendToApproval(o.id)} 
                              className="h-7 w-7 rounded-full border border-sky-200 bg-sky-50 flex items-center justify-center text-sky-600 hover:text-sky-700 hover:bg-sky-100 transition-all shadow-sm"
                              title="Send for Approval">
                              <Rocket size={13} />
                            </button>
                          )}
                          <button onClick={() => props.onEdit && props.onEdit(o.id)} 
                            className="h-7 w-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:text-sky-600 hover:border-sky-200 hover:bg-sky-50 transition-all shadow-sm"
                            title="Edit Order">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => handleDelete(o.id)} 
                            className="h-7 w-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm"
                            title="Delete Order">
                            <Trash2 size={13} />
                          </button>
                          <button onClick={() => openPDFPreview(o.id)}
                            className="h-7 w-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-800 hover:text-slate-900 border-slate-300 hover:bg-slate-100 transition-all shadow-sm"
                            title="PDF Preview">
                            <FileDown size={14} strokeWidth={2.5}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {pdfPreviewId && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/50" onClick={() => setPdfPreviewId(null)} />
          <div className="w-full max-w-[860px] bg-slate-200 flex flex-col h-full shadow-2xl">
            <div className="bg-white border-b border-slate-200 px-5 py-3 flex items-center justify-between shrink-0">
              <span className="font-bold text-slate-700 text-sm">PDF Preview</span>
              <div className="flex items-center gap-2">
                <button disabled={pdfDownloading} onClick={handlePDFDownload}
                  className={`flex items-center gap-2 px-4 py-2 text-white font-bold rounded-lg text-xs uppercase tracking-wider transition-all ${pdfDownloading ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#1b3e8a] hover:bg-[#16326d]'}`}>
                  {pdfDownloading
                    ? <div className="h-3 w-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <FileDown size={14} />}
                  {pdfDownloading ? "Downloading..." : "Download PDF"}
                </button>
                <button onClick={() => setPdfPreviewId(null)}
                  className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-all">
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="flex-1 bg-slate-300">
              <iframe
                title="Order PDF"
                src={`${API}/api/orders/${pdfPreviewId}/pdf?t=${pdfPreviewNonce}#toolbar=0&navpanes=0&statusbar=0&messages=0&view=FitH`}
                className="w-full h-full border-0 bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
