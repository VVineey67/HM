import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, Building2, User, Landmark, MapPin, Receipt, ShieldQuestion, FileText, CheckCircle2, Phone, Printer, FileDown, Download, Eye, X } from "lucide-react";
import OrderPDFTemplate from "./OrderPDFTemplate";
import html2pdf from "html2pdf.js";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ViewOrder = ({ orderId, onBack, onEdit, currentUser = {} }) => {
  const [data, setData] = useState({ order: null, items: [] });
  const [approvalData, setApprovalData] = useState({ request: null, timeline: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Purchase Details");

  // Approval Action state
  const [actionModal, setActionModal] = useState({ open: false, type: "" });
  const [actionComment, setActionComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const { subtotal, discAmt, netItems, fright, totalGst, grandTotal, frightTax, discountPct } = React.useMemo(() => {
    if (!data || !data.order) return { subtotal: 0, discAmt: 0, netItems: 0, fright: 0, totalGst: 0, grandTotal: 0, frightTax: 0, discountPct: 0 };
    const order = data.order;
    const dbT = order.totals || {};

    const fright = Number(dbT.frightCharges ?? dbT.fright) || 0;
    const frightTax = Number(dbT.frightTax ?? 18);
    const subtotal = Number(dbT.subtotal) || 0;
    const totalGst = Number(dbT.gst) || 0;
    const discAmt = Number(dbT.totalDiscountAmt) || 0;
    const discountPct = Number(dbT.txDiscountPct || dbT.discount_pct) || 0;
    const grandTotal = Number(dbT.grandTotal) || (subtotal - discAmt + fright + totalGst);

    return { 
      subtotal,
      discAmt,
      discountPct,
      netItems: subtotal - discAmt, 
      fright, 
      totalGst, 
      grandTotal, 
      frightTax 
    };
  }, [data]);

  const groupedItems = React.useMemo(() => {
    const raw = data.items || [];
    const results = [];
    let currentHead = null;

    for (let i = 0; i < raw.length; i++) {
      const it = raw[i];
      const itemName = it.material_name || it.items?.material_name || it.item?.material_name || "Unknown Item";
      const unit = it.unit || "";
      
      if (currentHead && currentHead._itemName === itemName && currentHead.unit === unit) {
        results.push({ ...it, _itemName: itemName, _isSubRow: true });
        currentHead._rowSpan++;
      } else {
        const newItem = { 
          ...it, 
          _itemName: itemName, 
          _isSubRow: false, 
          _rowSpan: 1, 
          _groupSrNo: results.filter(r => !r._isSubRow).length + 1 
        };
        results.push(newItem);
        currentHead = newItem;
      }
    }
    return results;
  }, [data.items]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/orders/${orderId}`);
      if (!res.ok) throw new Error("Failed to fetch order");
      const json = await res.json();
      setData(json);

      // Fetch workflow request
      const wRes = await fetch(`${API}/api/approvals/requests/${orderId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem("bms_token") || ""}` }
      });
      if (wRes.ok) {
        const wJson = await wRes.json();
        setApprovalData({ request: wJson.request || null, timeline: wJson.timeline || [] });
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const handleApprovalAction = async (actionType) => {
    if ((actionType === 'Rejected' || actionType === 'Reverted') && !actionComment.trim()) {
      alert("Comment is required for Revert/Reject.");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`${API}/api/approvals/action`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem("bms_token") || ""}` },
        body: JSON.stringify({
          request_id: approvalData.request.id,
          action: actionType,
          comments: actionComment
        })
      });
      const data = await res.json();
      if (data.success) {
        // If the order status was tied to this, you might need an additional call to update purchase_orders status 
        // or rely on backend sync
        setActionModal({ open: false, type: "" });
        setActionComment("");
        fetchOrderDetails(); // refresh
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error("Action error", e);
    }
    setActionLoading(false);
  };

  const updateStatus = async (newStatus, initApproval = false) => {
    setActionLoading(true);
    try {
      showToast(`Moving to ${newStatus}...`);
      // 1. Update Status
      const res = await fetch(`${API}/api/orders/${orderId}`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: JSON.stringify({ mainData: { status: newStatus } }) })
      });
      if (!res.ok) throw new Error("Update failed");

      // 2. Init Approval if needed
      if (initApproval) {
        const appRes = await fetch(`${API}/api/approvals/requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem("bms_token") || ""}` },
          body: JSON.stringify({
            module_key: "create_order",
            document_id: orderId,
            requestor_id: JSON.parse(localStorage.getItem("bms_user") || "{}").id
          })
        });
        if (!appRes.ok) throw new Error("Approval init failed");
      }

      showToast(`Order status updated to ${newStatus}`);
      fetchOrderDetails();
    } catch (err) {
      showToast(err.message, "error");
    }
    setActionLoading(false);
  };

  const handleDownload = async () => {
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      const element = document.getElementById("view-order-print-area");
      if (!element) return;
      
      const options = {
        margin: [0, 0, 0, 0],
        filename: `PO_${data.order.order_number || "Order"}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true, 
          letterRendering: true,
          logging: false,
          scrollY: 0
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
      };
      
      await html2pdf().from(element).set(options).save();
    } catch (err) {
      console.error("PDF Download error:", err);
      showToast("Download failed. Please try 'Print PDF' instead.", "error");
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 h-64">
        <div className="h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium">Loading Order Details...</p>
      </div>
    );
  }

  const { order, items } = data;
  if (!order) return <div className="p-10 text-center">Order not found.</div>;

  const getVal = (v) => Array.isArray(v) ? v[0] : v;

  // Status-based logic: Draft & Review show LIVE latest data. Others show Frozen Snapshot.
  const isKacha = ["Draft", "Review"].includes(order.status);
  const snap = order.snapshot || {};

  const comp = isKacha
    ? (getVal(order.companies) || snap.company || {})
    : (snap.company || getVal(order.companies) || {});

  const vend = isKacha
    ? (getVal(order.vendors) || snap.vendor || {})
    : (snap.vendor || getVal(order.vendors) || {});

  const site = isKacha
    ? (getVal(order.sites) || snap.site || {})
    : (snap.site || getVal(order.sites) || {});

  const liveContact = getVal(order.contact_person);
  const contacts = isKacha
    ? (snap.contacts || (liveContact ? [liveContact] : [])) // For Drafts, we still use the IDs from snapshot but ideally we'd want latest.
    : (snap.contacts || (liveContact ? [liveContact] : []));
  const totals = order.totals || {};

  const TABS = ["Purchase Details", "Approvals", "Order Documents", "PDF View", "Goods receipts", "Vendor Invoices", "Payments"];

  return (
    <div className="bg-slate-50 min-h-screen text-sm w-full mx-auto pb-20">
      {/* Final Print Logic: Perfect Centering & No Clipping */}
      <style>{`
        @media print {
          @page { margin: 0; size: auto; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          
          .no-print, aside, nav, header, .sidebar, .print\\:hidden, [class*="Tabs"], [class*="Header"] { 
            display: none !important; 
          }

          #root > div, main, .bg-slate-50, .bg-slate-200 { 
            background: transparent !important; 
            padding: 0 !important; 
            margin: 0 !important; 
            display: block !important;
            overflow: visible !important;
            height: auto !important;
          }

          #view-order-print-area {
            position: absolute !important;
            left: 10mm !important;
            right: 10mm !important;
            top: 10mm !important;
            width: 190mm !important;
            background: white !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 auto !important;
          }

          /* Force backgrounds to show */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-30 print:hidden">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 hover:bg-slate-100 rounded-md transition-colors text-slate-500">
              <ArrowLeft size={18} />
            </button>
            <div className="text-slate-400 text-xs font-semibold flex items-center gap-2">
              Purchase Orders <span className="text-slate-300">&gt;</span> <span className="text-slate-700">View</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              {order.status === 'Draft' && (
                <>
                  <button disabled={actionLoading} onClick={() => updateStatus('Review')}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-sm text-xs transition-all">
                    Submit to Review
                  </button>
                  <button onClick={() => onEdit && onEdit(orderId)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg shadow-sm text-xs hover:bg-slate-50 transition-all">
                    Edit Order
                  </button>
                </>
              )}

              {order.status === 'Review' && (
                <>
                  <button disabled={actionLoading} onClick={() => updateStatus('Pending Issue', true)}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-sm text-xs transition-all">
                    Submit for Approval
                  </button>
                  <button onClick={() => onEdit && onEdit(orderId)}
                    className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg shadow-sm text-xs hover:bg-slate-50 transition-all">
                    Edit Order
                  </button>
                </>
              )}


              <button className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 ml-2">
                <Search size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="px-14 pb-4">
          {/* Delayed numbering logic */}
          {(() => {
            const displayNo = order.order_number?.startsWith("PENDING-") ? "DRAFT" : order.order_number;
            const isDraftNo = displayNo === "DRAFT";
            return (
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                  {order.order_type === 'Supply' ? 'Purchase Order' : 'Work Order'}
                  <span className="text-slate-400 font-medium">#</span>
                  <span className={isDraftNo ? "text-amber-500 italic bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 uppercase" : "text-indigo-600 font-black tracking-tight"}>
                    {displayNo}
                  </span>
                </h1>
                
                {/* Subject highlight bar */}
                <div className="mt-3 flex items-center gap-4 bg-indigo-50/50 px-5 py-3 rounded-r-xl border-l-4 border-[#1b3e8a] shadow-sm max-w-4xl">
                  <span className="text-[10px] font-black text-[#1b3e8a] uppercase tracking-[0.2em] shrink-0">Subject :</span>
                  <span className="text-[13px] font-bold text-slate-700 uppercase tracking-tight leading-none">{order.subject || order.order_name || 'N/A'}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Tabs */}
        <div className="px-14 flex gap-6 overflow-x-auto no-scrollbar border-t border-slate-100 pt-3">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`pb-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap 
                ${activeTab === t ? "text-indigo-600 border-indigo-600" : "text-slate-500 border-transparent hover:text-slate-700"}`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "Purchase Details" && (
        <div className="px-14 py-6 max-w-[1400px]">
          {/* Top Info Block */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-lg font-bold text-slate-800">
                {order.order_type === 'Supply' ? 'Purchase Order' : 'Work Order'}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${order.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                order.status === 'Issued' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                  order.status === 'Review' ? 'bg-sky-50 text-sky-600 border border-sky-100' :
                    order.status === 'Draft' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                      'bg-amber-50 text-amber-600 border border-amber-100'
                }`}>
                {order.status || 'Pending'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-slate-400 mb-1">Reference No.</p>
                <p className="font-semibold text-slate-800">{order.ref_number || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">{order.order_type === 'Supply' ? 'Purchase' : 'Work'} Order No.</p>
                <p className={`font-semibold ${order.order_number?.startsWith("PENDING-") ? "text-amber-600 italic" : "text-slate-800"}`}>
                  {order.order_number?.startsWith("PENDING-") ? "DRAFT (Assigned on Issue)" : order.order_number}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1">Date</p>
                <p className="font-semibold text-slate-800">{new Date(order.date_of_creation || order.created_at).toLocaleDateString("en-IN")}</p>
              </div>
              <div><p className="text-xs text-slate-400 mb-1">Created By</p><p className="font-semibold text-slate-800">{order.made_by || "N/A"}</p></div>
              <div className="col-span-2">
                <p className="text-xs text-slate-400 mb-1">Subject</p>
                <p className="font-semibold text-slate-800">{order.subject || order.order_name || '—'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-400 mb-1">Requisition by</p>
                <p className="font-semibold text-slate-800">{order.request_by || '—'}</p>
              </div>
            </div>
          </div>

          {/* Vendors & Company grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Vendor Block */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                <User size={16} className="text-slate-400" /> Vendor Details
              </h3>
              <p className="font-bold text-slate-900 mb-3 uppercase">{vend.vendorName || vend.vendor_name || 'N/A'}</p>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-slate-400 mb-0.5">Address</p>
                  <p className="text-slate-700 leading-relaxed">{vend.address || 'N/A'}</p>
                </div>

                {/* Bank Details */}
                <div className="pt-1">
                  <p className="text-slate-400 mb-1.5 font-semibold uppercase tracking-wide text-[10px]">Bank Details</p>
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-28 shrink-0">Beneficiary Name</span>
                      <span className="text-slate-700 font-medium">{vend.accountHolder || vend.account_holder || 'N/A'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-28 shrink-0">Bank Name</span>
                      <span className="text-slate-700 font-medium">{vend.bankName || vend.bank_name || 'N/A'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-28 shrink-0">IFSC Code</span>
                      <span className="text-slate-700 font-medium font-mono">{vend.ifscCode || vend.ifsc_code || 'N/A'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-28 shrink-0">Account No</span>
                      <span className="text-slate-700 font-medium font-mono">{vend.accountNumber || vend.account_number || 'N/A'}</span>
                    </div>
                  </div>
                </div>

                {/* Tax Docs */}
                <div className="pt-1">
                  <p className="text-slate-400 mb-1.5 font-semibold uppercase tracking-wide text-[10px]">Tax Docs</p>
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-28 shrink-0">GST No</span>
                      <span className={`font-medium font-mono uppercase ${vend.gstin ? 'text-slate-700' : 'text-slate-400 italic'}`}>{vend.gstin || 'NA'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-28 shrink-0">Pan No</span>
                      <span className={`font-medium font-mono uppercase ${vend.pan ? 'text-slate-700' : 'text-slate-400 italic'}`}>{vend.pan || 'NA'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-28 shrink-0">Aadhar No</span>
                      <span className={`font-medium font-mono ${vend.aadharNo || vend.aadhar_no ? 'text-slate-700' : 'text-slate-400 italic'}`}>{vend.aadharNo || vend.aadhar_no || 'NA'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-28 shrink-0">MSME No</span>
                      <span className={`font-medium ${vend.msmeNumber || vend.msme_number ? 'text-slate-700' : 'text-slate-400 italic'}`}>{vend.msmeNumber || vend.msme_number || 'NA'}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Details */}
                <div className="pt-1">
                  <p className="text-slate-400 mb-1.5 font-semibold uppercase tracking-wide text-[10px]">Contact Details</p>
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-28 shrink-0">Person Name</span>
                      <span className="text-slate-700 font-medium">{vend.contactPerson || vend.contact_person || 'N/A'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-28 shrink-0">Contact No</span>
                      <span className="text-slate-700 font-medium">{vend.mobile || vend.phone || 'N/A'}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-slate-400 w-28 shrink-0">Email</span>
                      <span className="text-slate-700 font-medium">{vend.email || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Company Block */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                <Building2 size={16} className="text-slate-400" /> Company Details
              </h3>
              <p className="font-bold text-slate-900 mb-3 uppercase">{comp.companyName || comp.company_name || 'N/A'}</p>

              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-slate-400 mb-0.5">Site Address</p>
                  <p className="text-slate-700 leading-relaxed">{site.siteAddress || site.site_address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-slate-400 mb-0.5 mt-2">Contact Person</p>
                  <div className="space-y-2 mt-1">
                    {contacts.length > 0 ? (
                      contacts.map((c, i) => (
                        <div key={i} className="bg-slate-50/50 rounded-lg p-2 border border-slate-100/50 flex flex-col gap-1">
                          <div className="flex items-center gap-2 text-slate-800 font-bold uppercase tracking-tight">
                            <User size={12} className="text-slate-400" />
                            {c.personName || c.person_name}
                          </div>
                          {(c.contactNumber || c.contact_number) && (
                            <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
                              <Phone size={10} className="text-slate-300" />
                              {c.contactNumber || c.contact_number}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-slate-800 font-bold uppercase tracking-tight">
                          <User size={12} className="text-slate-400" />
                          {site.contactName || site.contact_name || 'N/A'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-slate-400 mb-0.5 mt-2">Billing Address</p>
                  <p className="text-slate-700 leading-relaxed">
                    {site.billingAddress || site.billing_address || comp.address || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 mb-0.5 mt-2">GSTIN</p>
                  <p className="text-slate-700 uppercase">{comp.gstin || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-xl border border-slate-200 mb-6 overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-slate-400" /> Items
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-slate-100/30 border-b border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-4 text-center w-12 border-r border-slate-200/50">Sr.</th>
                    <th className="px-5 py-4 text-left min-w-[160px] border-r border-slate-200/50">Item Name</th>
                    {/* Specification */}
                    <th className="px-5 py-4 text-left min-w-[200px] border-r border-slate-200/50">Specification</th>
                    {/* Model Number */}
                    {(totals.showModel !== false || groupedItems.some(it => it.model_number)) && (
                      <th className="px-4 py-4 text-left border-r border-slate-200/50">Model No.</th>
                    )}
                    {(totals.showBrand !== false || groupedItems.some(it => it.brand || it.make || it.item?.make)) && (
                      <th className="px-4 py-4 text-left border-r border-slate-200/50">Brand</th>
                    )}
                    <th className="px-4 py-4 text-center border-r border-slate-200/50">Unit</th>
                    <th className="px-4 py-4 text-right border-r border-slate-200/50">Qty</th>
                    <th className="px-4 py-4 text-right border-r border-slate-200/50">Rate</th>
                    {/* Discount - Only if Line Mode */}
                    {totals.discount_mode === 'line' && (
                      <th className="px-4 py-4 text-center border-r border-slate-200/50">Disc%</th>
                    )}
                    <th className="px-4 py-4 text-right border-r border-slate-200/50">Tax%</th>
                    <th className="px-6 py-4 text-right font-black text-indigo-900 bg-indigo-50/30">Amount</th>
                    {(totals.showRemarks || groupedItems.some(it => it.remarks)) && <th className="px-5 py-4 text-left">Remarks</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupedItems.map((it, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      {/* Sr No & Item Name Merged */}
                      {!it._isSubRow && (
                        <>
                          <td rowSpan={it._rowSpan} className="px-5 py-6 text-center text-slate-400 font-bold border-r border-slate-200/40 bg-slate-50/30 text-[11px] align-top">
                            {it._groupSrNo < 10 ? `0${it._groupSrNo}` : it._groupSrNo}
                          </td>
                          <td rowSpan={it._rowSpan} className="px-5 py-6 text-slate-800 font-bold uppercase whitespace-normal leading-tight border-r border-slate-200/40 bg-slate-50/30 text-[11px] align-top min-w-[160px]">
                            {it._itemName}
                          </td>
                        </>
                      )}

                      {/* Specification */}
                      <td className="px-5 py-6 text-slate-600 font-medium whitespace-normal leading-relaxed text-[11px] border-r border-slate-100/60">
                        {it.description || "—"}
                      </td>
                      {/* Model Number */}
                      {(totals.showModel !== false || groupedItems.some(it => it.model_number)) && (
                        <td className="px-4 py-6 text-slate-500 font-semibold text-[10px] uppercase tracking-tight border-r border-slate-100/60">
                          {it.model_number || "—"}
                        </td>
                      )}
                      {(totals.showBrand !== false || groupedItems.some(it => it.brand || it.make || it.item?.make)) && (
                        <td className="px-4 py-6 text-slate-600 font-bold uppercase tracking-tight text-[10px] border-r border-slate-100/60">
                          {(() => {
                             const bValue = it.make || it.items?.make || it.brand || "";
                             if (!bValue || bValue === "[]" || bValue === "null") return "—";
                             try {
                               const parsed = JSON.parse(bValue);
                               return Array.isArray(parsed) ? (parsed.join(", ") || "—") : parsed;
                             } catch { return bValue; }
                          })()}
                        </td>
                      )}
                      <td className="px-4 py-6 text-center text-slate-400 font-bold uppercase text-[9px] border-r border-slate-100/60">{it.unit || "nos"}</td>
                      <td className="px-4 py-6 text-right text-slate-800 font-bold text-[12px] border-r border-slate-100/60">{Number(it.qty).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-6 text-right text-slate-600 font-medium text-[11px] border-r border-slate-100/60">₹{Number(it.unit_rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      
                      {/* Discount Mapping - Only if Line Mode */}
                      {totals.discount_mode === 'line' && (
                        <td className="px-4 py-6 text-center text-rose-500 font-bold text-[11px] border-r border-slate-100/60">
                          {Number(it.discount_pct)}%
                        </td>
                      )}
                      
                      <td className="px-4 py-6 text-right text-slate-400 font-bold text-[11px] border-r border-slate-100/60">{Number(it.tax_pct)}%</td>
                      <td className="px-6 py-6 text-right text-indigo-900 font-bold bg-indigo-50/20 text-[13px]">₹{Number(it.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      {(totals.showRemarks || groupedItems.some(it => it.remarks)) && (
                        <td className="px-5 py-6 text-left text-slate-400 font-medium text-[10px] max-w-[140px] truncate leading-tight border-l border-slate-100/60" title={it.remarks}>
                          {it.remarks || "—"}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Section */}
            <div className="border-t border-slate-200 bg-slate-50 p-6 flex justify-end">
              <div className="w-full max-w-sm space-y-3 text-sm">
                <div className="flex justify-between items-center text-slate-500 font-medium">
                  <span className="text-[11px] uppercase tracking-wider">SubTotal:</span>
                  <span className="text-slate-800 font-mono font-bold">₹{subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                {discAmt > 0 && (
                  <div className="flex justify-between items-center text-rose-500 font-medium border-rose-50 border-y py-1 bg-rose-50/20 px-3">
                    <span className="text-[11px] uppercase tracking-wider font-extrabold">
                      TOTAL DISCOUNT {discountPct > 0 ? `(${discountPct}%)` : ""} :
                    </span>
                    <span className="font-mono font-black animate-pulse">- ₹{discAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                {fright > 0 && (
                  <div className="flex justify-between items-center text-slate-500 font-medium">
                    <span className="text-[11px] uppercase tracking-wider">Freight & Packing ({frightTax}%):</span>
                    <span className="text-slate-800 font-mono">₹{fright.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-slate-400 font-medium border-b border-slate-100 pb-3">
                  <span className="text-[11px] uppercase tracking-wider">GST Tax Amount:</span>
                  <span className="text-slate-700 font-mono">₹{totalGst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-slate-900 font-black py-2 text-xl">
                  <span className="text-[10px] uppercase tracking-[0.3em] opacity-30">Grand Total:</span>
                  <span className="font-mono tracking-tighter bg-slate-900 text-white px-4 py-2 rounded-xl shadow-xl shadow-slate-200">₹{grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Clause Boxes */}
          <div className="space-y-6">

            {/* Order Notes */}
            {(order.notes || snap.notes) && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-slate-400" /> Order Notes
                </h3>
                <div className="text-sm text-slate-600 prose prose-slate max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: order.notes || snap.notes }} />
                </div>
              </div>
            )}

            {/* Terms & Conditions */}
            {order.terms_conditions && order.terms_conditions.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 overflow-hidden">
                <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-slate-400" /> Terms & Conditions
                </h3>
                <ul className="text-sm text-slate-600 space-y-3">
                  {order.terms_conditions.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 min-w-0">
                      <span className="text-slate-400 shrink-0 w-5 text-right">{i + 1}.</span>
                      <div className="min-w-0 break-words leading-relaxed" dangerouslySetInnerHTML={{ __html: point }} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Payment Terms */}
            {order.payment_terms && order.payment_terms.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 overflow-hidden">
                <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-slate-400" /> Payment Terms
                </h3>
                <ul className="text-sm text-slate-600 space-y-3">
                  {order.payment_terms.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 min-w-0"><span className="text-slate-400 shrink-0 w-5 text-right">{i + 1}.</span><div className="min-w-0 break-words leading-relaxed" dangerouslySetInnerHTML={{ __html: point }} /></li>
                  ))}
                </ul>
              </div>
            )}

            {/* Governing Laws */}
            {order.governing_laws && order.governing_laws.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 overflow-hidden">
                <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-slate-400" /> Governing Laws
                </h3>
                <div className="text-sm text-slate-600 break-words">
                  {order.governing_laws.map((point, i) => (
                    <div key={i} dangerouslySetInnerHTML={{ __html: point }} className="mb-2 leading-relaxed" />
                  ))}
                </div>
              </div>
            )}

            {/* Annexures */}
            {order.annexures && order.annexures.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6 overflow-hidden">
                <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-slate-400" /> Annexures
                </h3>
                <div className="text-sm text-slate-600 break-words">
                  {order.annexures.map((point, i) => (
                    <div key={i} dangerouslySetInnerHTML={{ __html: point }} className="mb-2 leading-relaxed" />
                  ))}
                </div>
              </div>
            )}

            {/* Authorized Signatures */}
            <div className="bg-white rounded-xl border border-slate-200 p-8 pb-10">
              <h3 className="font-bold text-sm text-slate-700 mb-8 flex items-center gap-2 border-b border-slate-100 pb-3">
                <User size={16} className="text-slate-400" /> Authorized Signatures
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                {/* ── Company Side ── */}
                <div>
                  <p className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wide">
                    For {comp.companyName || comp.company_name || 'Company'}
                  </p>

                  {/* Stamp + Signature overlay area — sign overlaps stamp */}
                  <div className="relative h-28 mb-6">
                    {/* Stamp — base layer */}
                    {(comp.stampUrl || comp.stamp_url) && (
                      <img
                        src={comp.stampUrl || comp.stamp_url}
                        alt="Company Stamp"
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-[100px] w-auto max-w-[110px] object-contain opacity-70"
                      />
                    )}
                    {(comp.signUrl || comp.sign_url) && (
                      <img
                        src={comp.signUrl || comp.sign_url}
                        alt="Signature"
                        className="absolute left-6 top-1/2 -translate-y-1/2 h-14 w-auto max-w-[150px] object-contain z-10 mix-blend-multiply drop-shadow-md brightness-90 contrast-125"
                      />
                    )}
                    {/* Fallback if both missing */}
                    {!(comp.stampUrl || comp.stamp_url) && !(comp.signUrl || comp.sign_url) && (
                      <div className="absolute bottom-0 left-0">
                        <div className="border-b-2 border-slate-300 w-48" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="font-bold text-slate-800 text-xs mb-1">Authorized Signatory</p>
                    <p className="text-slate-700"><span className="font-bold text-slate-800">Name:</span> {comp.personName || comp.person_name || order.made_by || '—'}</p>
                    <p className="text-slate-700"><span className="font-bold text-slate-800">Designation:</span> {comp.designation || 'Procurement'}</p>
                    <p className="text-slate-700 flex items-center gap-2">
                      <span className="font-bold text-slate-800">Date:</span>
                      <span className="border-b border-slate-800 min-w-[80px] inline-block text-center font-medium">
                        {new Date(order.created_at).toLocaleDateString("en-IN")}
                      </span>
                    </p>
                  </div>
                </div>

                {/* ── Vendor Side (manual) ── */}
                <div>
                  <p className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wide">
                    For {vend.vendorName || vend.vendor_name || 'Vendor'}
                  </p>

                  {/* Blank stamp/sign area */}
                  <div className="h-24 mb-6 flex items-end">
                    <div className="border-b-2 border-slate-300 w-48" />
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="font-bold text-slate-800 text-xs mb-1">Authorized Signatory</p>
                    <p className="text-slate-700"><span className="font-bold text-slate-800">Name:</span> {vend.contactPerson || vend.contact_person || vend.vendorName || vend.vendor_name || '—'}</p>
                    <p className="text-slate-700"><span className="font-bold text-slate-800">Designation:</span></p>
                    <p className="text-slate-700 flex items-center gap-2">
                      <span className="font-bold text-slate-800">Date:</span>
                      <span className="border-b border-slate-800 min-w-[80px] inline-block"></span>
                    </p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {activeTab === "Approvals" && (
        <div className="px-14 py-6 max-w-[1400px]">
          {/* Approvals Header */}
          <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-200">
            <div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                {approvalData.request?.workflow?.flow_name || (order.order_type === 'Supply' ? 'Purchase Order Flow' : 'Work Order Flow')}
              </h2>
              <div className="flex items-center gap-8 text-sm">
                <div>
                  <p className="text-slate-400 text-xs mb-1">Priority</p>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs font-bold uppercase">Low</span>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Date</p>
                  <p className="font-semibold text-slate-800">{new Date(order.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs mb-1">Requisition by</p>
                  <p className="font-semibold text-slate-800">{order.request_by || order.made_by || '—'}</p>
                </div>
              </div>
            </div>
            <div>
              <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-sm flex items-center gap-2 text-sm transition-colors">
                <FileText size={16} /> Comments
              </button>
            </div>
          </div>

          {/* Approvals Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative">
            {/* Subtle grid background */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, black 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>

            {/* Left Column: Timeline */}
            <div className="lg:col-span-2 relative z-10 pl-4 py-4 space-y-8">

              {approvalData.timeline.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl shadow-sm border border-slate-200">
                  <p className="text-slate-500 font-medium">No approval workflow configured or attached.</p>
                  <p className="text-xs text-slate-400 mt-2">Order current status: {order.status}</p>
                </div>
              ) : (
                approvalData.timeline.map((step, idx) => {
                  const isApproved = step.status === 'Approved';
                  const isPending = step.status === 'Pending';
                  const isInProgress = step.status === 'In Progress' || step.status === 'Reverted' || step.status === 'Rejected';

                  const bgGradient = isApproved ? "from-green-600 to-emerald-500" :
                    isInProgress ? "from-purple-700 to-indigo-600" :
                      "from-amber-600 to-orange-500";

                  const textAccent1 = isApproved ? "text-green-100" : isInProgress ? "text-indigo-100" : "text-amber-100";
                  const textAccent2 = isApproved ? "text-green-200" : isInProgress ? "text-indigo-200" : "text-amber-200";

                  return (
                    <div key={idx} className="relative">
                      {idx > 0 && <div className="absolute left-8 -top-8 h-8 w-px bg-slate-300"></div>}
                      {idx < approvalData.timeline.length - 1 && <div className="absolute left-8 top-full h-8 w-px bg-slate-300"></div>}
                      <div className={`bg-gradient-to-r ${bgGradient} rounded-xl text-white shadow-md overflow-hidden max-w-md`}>
                        <div className="p-4 flex justify-between items-start">
                          <div>
                            <h3 className="font-bold text-lg mb-1">{step.step_number}. {step.action ? step.action : 'Pending Action'}</h3>
                            <p className={`${textAccent1} text-xs mb-0.5`}><span className="opacity-70">Approver :</span> {step.approver_name}</p>
                            <p className={`${textAccent2} text-xs`}>{step.approver_designation}</p>
                          </div>
                          <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold border border-white/30">
                            {step.status}
                          </span>
                        </div>
                        <div className="bg-white px-4 py-2 text-xs flex justify-between text-slate-500 font-medium">
                          <span>
                            {step.action
                              ? `${step.action} on ${new Date(step.acted_at).toLocaleDateString("en-IN")}`
                              : 'Waiting for review...'}
                          </span>
                        </div>
                        {step.comments && (
                          <div className="bg-slate-50 px-4 py-2 text-xs border-t border-slate-100 text-slate-600 italic">
                            "{step.comments}"
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            {/* Right Column: Details Card */}
            <div className="relative z-10 py-4">
              <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden sticky top-32">
                <div className="bg-[#1e3a8a] px-5 py-3 text-white font-bold text-sm">
                  Review & Approve
                </div>
                <div className="p-5 text-sm space-y-4">
                  <div className="grid grid-cols-[100px_1fr] gap-4">
                    <span className="text-slate-500 font-medium">Status</span>
                    <span className="font-bold text-slate-800">{order.status || 'Pending'}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-4">
                    <span className="text-slate-500 font-medium">Vendor</span>
                    <span className="font-bold text-slate-800 uppercase">{vend.vendorName || vend.vendor_name || '—'}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-4">
                    <span className="text-slate-500 font-medium">Bill To</span>
                    <span className="font-bold text-slate-800 uppercase">{comp.companyName || comp.company_name || '—'}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-4">
                    <span className="text-slate-500 font-medium">Order Value</span>
                    <span className="font-bold text-slate-800">₹{(totals.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-4">
                    <span className="text-slate-500 font-medium">Site</span>
                    <span className="font-bold text-slate-800 uppercase">{comp.companyName || comp.company_name || '—'}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-4">
                    <span className="text-slate-500 font-medium h-full flex items-start">Stage</span>
                    <div className="font-bold text-slate-800">
                      Procurement
                      <span className="block font-normal text-slate-500 text-xs mt-0.5">(Senior Manager Procurement)</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-4">
                    <span className="text-slate-500 font-medium h-full flex items-start">Stage</span>
                    <div className="font-bold text-slate-800">
                      {approvalData.request?.status || 'No workflow'}
                      <span className="block font-normal text-slate-500 text-xs mt-0.5">
                        {approvalData.timeline?.find(t => t.status === 'In Progress' || t.status === 'Pending' || t.status === 'Reverted')?.approver_designation || ''}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-4">
                    <span className="text-slate-500 font-medium h-full flex items-start">Requestor</span>
                    <span className="font-bold text-slate-800">{order.request_by || order.made_by || '—'}</span>
                  </div>
                </div>

                {/* Action Panel for Active Approver */}
                {approvalData.request && (
                  <div className="p-5 bg-slate-50 border-t border-slate-200 space-y-3">
                    {['Pending', 'In Progress', 'Reverted'].includes(approvalData.request.status) ? (
                      <>
                        <p className="text-xs font-bold uppercase text-slate-500 mb-2">Approver Actions</p>
                        {(() => {
                          const currentStep = approvalData.timeline?.find(t => t.status === 'In Progress' || t.status === 'Pending' || t.status === 'Reverted');
                          const perms = currentStep?.permissions || {};

                          return (
                            <div className="flex flex-col gap-2">
                              {perms.approve && (
                                <button onClick={() => setActionModal({ open: true, type: 'Approved' })} className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-sm shadow-sm transition-colors">
                                  Approve Request
                                </button>
                              )}
                              {perms.issue && (
                                <button onClick={() => setActionModal({ open: true, type: 'Issued' })} className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-sm shadow-sm transition-colors">
                                  Confirm & Issue
                                </button>
                              )}
                              <div className="flex gap-2">
                                {perms.revert && (
                                  <button onClick={() => setActionModal({ open: true, type: 'Reverted' })} className="flex-1 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-lg font-bold text-sm transition-colors">
                                    Revert
                                  </button>
                                )}
                                {perms.reject && (
                                  <button onClick={() => setActionModal({ open: true, type: 'Rejected' })} className="flex-1 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-lg font-bold text-sm transition-colors">
                                    Reject
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </>
                    ) : (
                      approvalData.request.status === 'Approved' && (
                        <>
                          <p className="text-xs font-bold uppercase text-slate-500 mb-2">Order Management</p>
                          {approvalData.timeline?.some(t => t.permissions?.recall) && (
                            <button onClick={() => setActionModal({ open: true, type: 'Recalled' })} className="w-full py-2 bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2">
                              <ArrowLeft size={16} /> Recall Issued Order
                            </button>
                          )}
                        </>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">
                Confirm Action: {actionModal.type === 'Approved' ? 'Approve' : actionModal.type}
              </h3>
              <button onClick={() => setActionModal({ open: false, type: "" })} className="text-slate-400 hover:text-rose-500">✖</button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-600">
                {actionModal.type === 'Approved'
                  ? "Are you sure you want to approve this request? It will move to the next stage."
                  : `You are about to ${actionModal.type === 'Reverted' ? 'revert' : 'reject'} this order.`}
              </p>
              <div>
                <label className="text-xs font-bold text-slate-500 mb-1 block">Add Comments (Optional)</label>
                <textarea
                  value={actionComment}
                  onChange={e => setActionComment(e.target.value)}
                  placeholder="Write your review comments here..."
                  className="w-full border border-slate-300 rounded-xl p-3 text-sm focus:border-indigo-400 outline-none h-24"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button disabled={actionLoading} onClick={() => setActionModal({ open: false, type: "" })} className="px-5 py-2 rounded-xl text-slate-600 font-semibold hover:bg-slate-200">Cancel</button>
              <button disabled={actionLoading} onClick={() => handleApprovalAction(actionModal.type)}
                className={`px-6 py-2 rounded-xl text-white font-bold shadow-md flex items-center gap-2 ${actionModal.type === 'Approved' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' :
                  actionModal.type === 'Reverted' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' :
                    'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
                  }`}>
                {actionLoading ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "PDF View" && (
        <div className="px-4 py-8 bg-slate-200 min-h-[calc(100vh-200px)] flex flex-col items-center custom-scrollbar overflow-y-auto">
          {/* Action Buttons */}
          <div className="w-full max-w-[210mm] mb-6 flex justify-end gap-3 print:hidden">
            <button 
              onClick={() => window.print()}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 text-xs uppercase tracking-wider"
            >
              <Printer size={18} /> Print PDF
            </button>
            <button 
              disabled={pdfLoading}
              onClick={handleDownload}
              className={`flex items-center gap-2 px-6 py-2.5 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 text-xs uppercase tracking-wider ${pdfLoading ? 'bg-slate-400 cursor-not-allowed' : 'bg-[#1b3e8a] hover:bg-[#16326d]'}`}
            >
              {pdfLoading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : <FileDown size={18} />}
              {pdfLoading ? "Generating..." : "Download PDF"}
            </button>
          </div>

          <div id="view-order-print-area" className="w-full max-w-[210mm] print:w-full">
            <OrderPDFTemplate 
              order={order} 
              items={items} 
              comp={comp} 
              vend={vend} 
              site={site} 
              contacts={contacts} 
            />
          </div>
          
          <div className="h-20 w-full shrink-0" />
        </div>
      )}

      {activeTab !== "Purchase Details" && activeTab !== "Approvals" && activeTab !== "PDF View" && (
        <div className="p-14 text-center">
          <h2 className="text-lg font-bold text-slate-400 mb-2">{activeTab}</h2>
          <p className="text-sm text-slate-300">Feature not yet implemented in this view.</p>
        </div>
      )}
    </div>
  );
};

export default ViewOrder;

