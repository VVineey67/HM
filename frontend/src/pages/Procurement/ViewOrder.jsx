import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, Search, Building2, User, Landmark, MapPin, Receipt, ShieldQuestion, FileText, CheckCircle2, Phone, FileDown, Download, Eye, X } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const amountToWords = (amount) => {
  if (!amount || isNaN(amount) || amount === 0) return "Zero Rupees Only";
  const a = ["", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const numToWords = (n) => {
    let numStr = n.toString();
    if (numStr.length > 9) return "Overflow";
    const nArray = ("000000000" + numStr).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!nArray) return "";
    let str = "";
    str += nArray[1] != 0 ? (a[Number(nArray[1])] || b[nArray[1][0]] + " " + a[nArray[1][1]]) + "Crore " : "";
    str += nArray[2] != 0 ? (a[Number(nArray[2])] || b[nArray[2][0]] + " " + a[nArray[2][1]]) + "Lakh " : "";
    str += nArray[3] != 0 ? (a[Number(nArray[3])] || b[nArray[3][0]] + " " + a[nArray[3][1]]) + "Thousand " : "";
    str += nArray[4] != 0 ? (a[Number(nArray[4])] || b[nArray[4][0]] + " " + a[nArray[4][1]]) + "Hundred " : "";
    str += nArray[5] != 0 ? ((str != "") ? "and " : "") + (a[Number(nArray[5])] || b[nArray[5][0]] + " " + a[nArray[5][1]]) : "";
    return str.trim();
  };
  const parts = Number(amount).toFixed(2).split(".");
  const rs = parseInt(parts[0], 10);
  const ps = parseInt(parts[1], 10);
  let res = numToWords(rs) + " Rupees";
  if (ps > 0) res += " and " + numToWords(ps) + " Paise";
  return res + " Only";
};


const ViewOrder = ({ orderId, onBack, onEdit, currentUser = {} }) => {
  const [data, setData] = useState({ order: null, items: [] });
  const [approvalData, setApprovalData] = useState({ request: null, timeline: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("Order Details");

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
    const normalizeGroupText = (value) =>
      String(value || "")
        .trim()
        .replace(/\s+/g, " ")
        .toLowerCase();
    const groups = [];
    const groupIndexByKey = new Map();

    for (let i = 0; i < raw.length; i++) {
      const it = raw[i];
      const itemNameRaw = it.material_name || it.items?.material_name || it.item?.material_name || "Unknown Item";
      const itemName = String(itemNameRaw || "").trim() || "Unknown Item";
      const unit = String(it.unit || "").trim();
      const itemGroupKey = normalizeGroupText(itemName);
      const unitGroupKey = normalizeGroupText(unit);
      const groupKey = `${itemGroupKey}__${unitGroupKey}`;

      if (groupIndexByKey.has(groupKey)) {
        const group = groups[groupIndexByKey.get(groupKey)];
        const subIdx = group.head._rowSpan + 1;
        group.rows.push({ ...it, _itemName: group.head._itemName, _isSubRow: true, _subIdx: subIdx });
        group.head._rowSpan++;
      } else {
        const head = {
          ...it,
          _itemName: itemName,
          _isSubRow: false,
          _rowSpan: 1,
          _subIdx: 1,
          _itemGroupKey: itemGroupKey,
          _unitGroupKey: unitGroupKey,
          _groupSrNo: groups.length + 1
        };
        groups.push({ head, rows: [head] });
        groupIndexByKey.set(groupKey, groups.length - 1);
      }
    }

    return groups.flatMap((group) => group.rows);
  }, [data.items]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
      // Prime the server-side preview HTML cache so clicking "PDF View" is instant
      fetch(`${API}/api/orders/${orderId}/preview`, { method: "GET" }).catch(() => {});
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
        setActionModal({ open: false, type: "" });
        setActionComment("");
        fetchOrderDetails();
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
      const res = await fetch(`${API}/api/orders/${orderId}`, {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: JSON.stringify({ mainData: { status: newStatus } }) })
      });
      if (!res.ok) throw new Error("Update failed");

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

  const handleSafeDownload = async (download = true) => {
    const orderId = data?.order?.id;
    if (!orderId) { showToast("Order not ready", "error"); return; }
    if (pdfLoading) return;
    setPdfLoading(true);
    try {
      const url = `${API}/api/orders/${orderId}/pdf${download ? "?download=1" : ""}`;
      if (download) {
        const res = await fetch(url);
        if (!res.ok) throw new Error("PDF generation failed");
        const blob = await res.blob();
        const href = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = href;
        a.download = `PO_${data.order?.order_number || "Order"}.pdf`;
        document.body.appendChild(a); a.click(); a.remove();
        URL.revokeObjectURL(href);
      } else {
        window.open(url, "_blank");
      }
    } catch (err) {
      console.error("PDF error:", err);
      showToast("PDF failed. Please try again.", "error");
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
  const normalizeRichTextHtml = (html) =>
    typeof html === "string"
      ? html.replace(/&nbsp;|\u00A0/g, " ")
      : html;
  const cleanQuillHtml = (html) => {
    if (!html) return "";
    return html
      .replace(/<span class="ql-ui"><\/span>/gi, "")
      .replace(/<span class="ql-ui"\/>/gi, "")
      .replace(/\s*data-list="[^"]*"/gi, "");
  };
  const renderRichHtml = (html) => cleanQuillHtml(normalizeRichTextHtml(html));
  const formatSignatureDate = (value) => {
    if (!value) return "--";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "--";

    const parts = new Intl.DateTimeFormat("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).formatToParts(date);

    const day = parts.find((part) => part.type === "day")?.value;
    const month = parts.find((part) => part.type === "month")?.value;
    const year = parts.find((part) => part.type === "year")?.value;

    return [day, month, year].filter(Boolean).join(" - ");
  };

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
    ? (snap.contacts || (liveContact ? [liveContact] : []))
    : (snap.contacts || (liveContact ? [liveContact] : []));
  const totals = order.totals || {};
  const isSupply = order.order_type === "Supply";
  const showModel = (totals.showModel === true || (totals.showModel !== false && groupedItems.some(it => it.model_number)));
  const showBrand = (totals.showBrand === true || (totals.showBrand !== false && groupedItems.some(it => it.make || it.brand)));
  const showDiscount = totals.discount_mode === "line";
  const showRemarks = (totals.showRemarks === true || (totals.showRemarks !== false && groupedItems.some(it => it.remarks)));




  const FALLBACK = "--";
  const RUPEE = "\u20B9";
  const vendorDisplayName = vend.vendorName || vend.vendor_name || "Vendor";
  const vendorSignatoryName = vend.contactPerson || vend.contact_person || vendorDisplayName || FALLBACK;
  const poDate = formatSignatureDate(order.purchase_order_date || order.created_at);
  const TABS = ["Order Details", "Approvals", "Order Documents", "PDF View", "Goods receipts", "Vendor Invoices", "Payments"];

  return (
    <div className="bg-slate-50 min-h-screen text-sm w-full mx-auto pb-20">
      <style>{`
        .pdf-fit-nowrap {
          min-width: 0;
          max-width: 100%;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .quill-content ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin: 4px 0 !important; }
        .quill-content ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin: 4px 0 !important; }
        .quill-content li { display: list-item !important; text-align: justify !important; margin-bottom: 0.2rem !important; }
        .quill-content p { margin-bottom: 2px !important; text-align: justify !important; }
        .quill-content strong { font-weight: 700 !important; }
        .quill-content em { font-style: italic !important; }
        .quill-content u { text-decoration: underline !important; }

        .order-rich-text,
        .order-rich-text * {
          max-width: 100%;
          white-space: normal !important;
          word-break: normal !important;
          overflow-wrap: break-word !important;
          word-wrap: break-word !important;
          hyphens: none !important;
        }

        .order-rich-text p,
        .order-rich-text div,
        .order-rich-text span,
        .order-rich-text li {
          margin: 0;
        }

        .order-rich-text ol,
        .order-rich-text ul {
          margin: 0;
          padding-left: 1.25rem;
        }

        .ql-align-center { text-align: center !important; }
        .ql-align-right { text-align: right !important; }
        .ql-align-justify { text-align: justify !important; }
        .quill-content { text-align: justify !important; }
        .quill-content p, .quill-content div { text-align: justify; }

        @media print {
          @page { margin: 0; size: A4 portrait; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { background: white !important; margin: 0 !important; padding: 0 !important; }

          /* Hide everything, show only print area */
          body * { visibility: hidden !important; }
          #view-order-print-area,
          #view-order-print-area * { visibility: visible !important; }
          #view-order-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 210mm !important;
            max-width: 210mm !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .page-container {
            width: 210mm !important;
            height: 297mm !important;
            overflow: hidden !important;
            box-shadow: none !important;
            border: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            page-break-after: always !important;
            break-after: page !important;
          }
          .page-container:last-child {
            page-break-after: auto !important;
            break-after: auto !important;
          }
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
          {(() => {
            const isPending = order.order_number?.startsWith("PENDING-");
            const displayNo = isPending ? (order.status || "DRAFT").toUpperCase() : order.order_number;
            return (
              <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                  {order.order_type === 'Supply' ? 'Purchase Order' : 'Work Order'}
                  <span className="text-slate-400 font-medium">#</span>
                  <span className={isPending ? "text-amber-500 italic bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 uppercase" : "text-indigo-600 font-black tracking-tight"}>
                    {displayNo}
                  </span>
                </h1>
                <div className="mt-3 flex items-center gap-4 bg-indigo-50/50 px-5 py-3 rounded-r-xl border-l-4 border-[#1b3e8a] shadow-sm max-w-4xl">
                  <span className="text-[10px] font-black text-[#1b3e8a] uppercase tracking-[0.2em] shrink-0">Subject :</span>
                  <span className="text-[13px] font-bold text-slate-700 uppercase tracking-tight leading-none">{order.subject || order.order_name || 'N/A'}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Tabs */}
        <div className="px-14 flex gap-6 overflow-x-auto no-scrollbar border-t border-slate-100 pt-3 print:hidden">
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

      {activeTab === "Order Details" && (
        <div className="px-14 py-3 max-w-[1400px] print:hidden">
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
                <p className="font-semibold text-slate-800">{order.ref_number || FALLBACK}</p>
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
                <p className="font-semibold text-slate-800">{order.subject || order.order_name || FALLBACK}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-400 mb-1">Requisition by</p>
                <p className="font-semibold text-slate-800">{order.request_by || FALLBACK}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                <User size={16} className="text-slate-400" /> Vendor Details
              </h3>
              <p className="font-bold text-slate-900 mb-3 uppercase">{vend.vendorName || vend.vendor_name || 'N/A'}</p>
              <div className="space-y-3 text-xs">
                <div><p className="text-slate-400 mb-0.5">Address</p><p className="text-slate-700 leading-relaxed">{vend.address || 'N/A'}</p></div>
                <div className="pt-1">
                  <p className="text-slate-400 mb-1.5 font-semibold uppercase tracking-wide text-[10px]">BANK DETAILS</p>
                  <div className="space-y-1.5">
                    <div className="flex gap-2"><span className="text-slate-400 w-32 shrink-0">Beneficiary Name</span><span className="text-slate-900 font-medium">{vend.beneficiaryName || vend.accountName || vend.vendorName || "N/A"}</span></div>
                    <div className="flex gap-2"><span className="text-slate-400 w-32 shrink-0">Bank Name</span><span className="text-slate-700 font-medium">{vend.bankName || "N/A"}</span></div>
                    <div className="flex gap-2"><span className="text-slate-400 w-32 shrink-0">IFSC Code</span><span className="text-slate-700 font-medium font-mono">{vend.ifscCode || vend.ifsc_code || 'N/A'}</span></div>
                    <div className="flex gap-2"><span className="text-slate-400 w-32 shrink-0">Account No</span><span className="text-slate-700 font-medium font-mono">{vend.accountNumber || vend.account_number || 'N/A'}</span></div>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-slate-400 mb-2 font-bold uppercase tracking-widest text-[10px] border-b border-slate-50 pb-1">TAX DOCS</p>
                  <div className="space-y-1">
                    <div className="flex gap-3"><span className="text-slate-400 w-32 shrink-0">GST No</span><span className="font-bold font-mono uppercase text-slate-900 text-[11px]">{vend.gstin || 'NA'}</span></div>
                    <div className="flex gap-3"><span className="text-slate-400 w-32 shrink-0">Pan No</span><span className="font-bold font-mono uppercase text-slate-900 text-[11px]">{vend.pan || 'NA'}</span></div>
                    <div className="flex gap-3"><span className="text-slate-400 w-32 shrink-0">Aadhar No</span><span className="font-bold font-mono uppercase text-sky-600 text-[11px] italic">{vend.aadhar || vend.aadhar_no || 'NA'}</span></div>
                    <div className="flex gap-3"><span className="text-slate-400 w-32 shrink-0">MSME No</span><span className="font-bold font-mono uppercase text-sky-600 text-[11px] italic">{vend.msme_number || vend.msme || vend.msme_no || 'NA'}</span></div>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-slate-400 mb-2 font-bold uppercase tracking-widest text-[10px] border-b border-slate-50 pb-1">CONTACT DETAILS</p>
                  <div className="space-y-1.5">
                    <div className="flex gap-2"><span className="text-slate-400 w-32 shrink-0">Person Name</span><span className="text-slate-900 font-bold">{vend.contactPerson || vend.contact_person || 'N/A'}</span></div>
                    <div className="flex gap-2"><span className="text-slate-400 w-32 shrink-0">Contact No</span><span className="text-slate-700 font-medium">{vend.mobile || vend.phone || 'N/A'}</span></div>
                    <div className="flex gap-2"><span className="text-slate-400 w-32 shrink-0">Email</span><span className="text-slate-700 font-medium lowercase">{vend.email || 'N/A'}</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                <Building2 size={16} className="text-slate-400" /> Company Details
              </h3>
              <p className="font-bold text-slate-900 mb-3 uppercase">{comp.companyName || comp.company_name || 'N/A'}</p>
              <div className="space-y-3 text-xs">
                <div><p className="text-slate-400 mb-0.5">Site Address</p><p className="text-slate-700 leading-relaxed">{site.siteAddress || site.site_address || 'N/A'}</p></div>
                <div>
                  <p className="text-slate-400 mb-0.5 mt-2">Billing Address</p>
                  <p className="text-slate-700 leading-relaxed">{site.billingAddress || site.billing_address || comp.address || 'N/A'}</p>
                </div>
                <div><p className="text-slate-400 mb-0.5 mt-2">GSTIN</p><p className="text-slate-700 uppercase">{comp.gstin || 'N/A'}</p></div>
                {contacts.length > 0 && (
                  <div className="pt-2">
                    <p className="text-slate-400 mb-2 font-bold uppercase tracking-widest text-[9px] border-b border-slate-50 pb-1 text-[10px]">Contact Persons</p>
                    <div className="space-y-2">
                      {contacts.map((c, i) => (
                        <div key={i} className="flex flex-col gap-0.5">
                          <p className="text-slate-900 font-bold text-[11px]">{c.personName || c.person_name}</p>
                          <div className="flex gap-2 text-[10px] text-slate-500">
                            <span>{c.designation}</span>
                            <span>�</span>
                            <span>{c.contactNumber || c.contact_number}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                    <th className="px-3 py-4 text-center w-[35px] border-r border-slate-200/50 sticky left-0 bg-white z-10">S.No</th>
                    {isSupply ? (
                      <>
                        <th className="px-5 py-4 text-left w-[240px] border-r border-slate-200/50">Item Name</th>
                        <th className="px-5 py-4 text-left w-[360px] border-r border-slate-200/50">Specification</th>
                      </>
                    ) : (
                      <th className="px-5 py-4 text-left border-r border-slate-200/50" style={{ minWidth: '380px' }}>Item Name & Description</th>
                    )}
                    <th className="px-4 py-4 text-center w-[60px] border-r border-slate-200/50">Unit</th>
                    <th className="px-4 py-4 text-right w-[80px] border-r border-slate-200/50">Qty</th>
                    <th className="px-4 py-4 text-right w-[100px] border-r border-slate-200/50">Rate</th>
                    {showDiscount && (
                      <th className="px-3 py-4 text-right w-[60px] border-r border-slate-200/50 tracking-tighter">Disc%</th>
                    )}
                    <th className="px-4 py-4 text-right w-[60px] border-r border-slate-200/50">Tax%</th>

                    {showRemarks && (
                      <th className="px-4 py-4 text-left w-[120px] border-r border-slate-200/50">Remarks</th>
                    )}

                    <th className="px-6 py-4 text-right font-black text-indigo-900 bg-indigo-50/30">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {groupedItems.map((it, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      {!it._isSubRow && (
                        <td rowSpan={it._rowSpan} className="px-4 py-3 text-center text-slate-600 font-bold text-[10px] border-r border-slate-200/40 sticky left-0 bg-white z-10 align-top">
                          {it._groupSrNo < 10 ? `0${it._groupSrNo}` : it._groupSrNo}
                        </td>
                      )}

                      {isSupply ? (
                        /* Supply: separate Item Name (rowspan) + Specification columns */
                        <>
                          {!it._isSubRow && (
                            <td rowSpan={it._rowSpan} className="px-5 py-3 text-slate-800 font-bold uppercase whitespace-normal leading-tight border-r border-slate-200/40 text-[11px] min-w-[200px] align-top">
                              {it._itemName}
                            </td>
                          )}
                          <td className="px-5 py-3 border-r border-slate-100/60 min-w-[280px]">
                            <div className="space-y-1">
                              {(() => {
                                const desc = it.description || it.specification || it.items?.description;
                                if (!desc) return <span className="text-slate-300 font-bold">---</span>;
                                let points = [];
                                try { points = typeof desc === 'string' && (desc.startsWith('[') || desc.startsWith('{')) ? JSON.parse(desc) : (Array.isArray(desc) ? desc : [desc]); } catch (e) { points = [desc]; }
                                return points.map((p, i) => (
                                  <div key={i} className="text-[11px] text-slate-600 leading-snug mb-1 last:mb-0">
                                    <span className="font-medium tracking-tight whitespace-normal">{p.replace(/<[^>]*>/g, '')}</span>
                                  </div>
                                ));
                              })()}
                              {showModel && it.model_number && (
                                <div className="text-[10px] mt-0.5"><span className="font-bold text-slate-800">Model No.:</span> <span className="font-semibold text-slate-700">{it.model_number}</span></div>
                              )}
                              {showBrand && (() => { const raw = it.make || ""; if (!raw || raw === "[]" || raw === "null") return null; let b = raw; try { const p = JSON.parse(raw); if (Array.isArray(p)) { if (p.length !== 1) return null; b = p[0]; } } catch {} return b ? <div className="text-[10px]"><span className="font-bold text-slate-800">Brand:</span> <span className="font-semibold text-slate-700">{b}</span></div> : null; })()}
                            </div>
                          </td>
                        </>
                      ) : (
                        /* SITC/ITC: combined Item Name + Description in one column */
                        <td className="px-5 py-3 border-r border-slate-100/60 align-top" style={{ minWidth: '380px' }}>
                          {!it._isSubRow && (
                            <p className="text-[11px] font-black text-slate-800 uppercase tracking-wide leading-tight mb-2 whitespace-normal">
                              {it._itemName}
                            </p>
                          )}
                          {it._rowSpan > 1 && !it._isSubRow && (
                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">Point 1</p>
                          )}
                          {it._isSubRow && (
                            <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">Point {it._subIdx}</p>
                          )}
                          <div className="space-y-1 whitespace-normal">
                            {(() => {
                              const desc = it.description || it.specification || it.items?.description;
                              if (!desc) return null;
                              let points = [];
                              try { points = typeof desc === 'string' && (desc.startsWith('[') || desc.startsWith('{')) ? JSON.parse(desc) : (Array.isArray(desc) ? desc : [desc]); } catch (e) { points = [desc]; }
                              return points.map((p, i) => (
                                <div key={i} className="order-rich-text text-[11px] text-slate-600 leading-relaxed whitespace-normal" dangerouslySetInnerHTML={{ __html: p }} />
                              ));
                            })()}
                            {showModel && it.model_number && (
                              <div className="text-[10px] text-slate-500 mt-1">Model No.: <span className="font-semibold text-slate-700">{it.model_number}</span></div>
                            )}
                            {showBrand && (() => { const raw = it.make || ""; if (!raw || raw === "[]" || raw === "null") return null; let b = raw; try { const p = JSON.parse(raw); if (Array.isArray(p)) { if (p.length !== 1) return null; b = p[0]; } } catch {} return b ? <div className="text-[10px]"><span className="font-bold text-slate-800">Brand:</span> <span className="font-semibold text-slate-700">{b}</span></div> : null; })()}
                          </div>
                        </td>
                      )}

                      <td className="px-4 py-3 text-center text-slate-400 font-bold uppercase text-[9px] border-r border-slate-100/60">{it.unit || "nos"}</td>
                      <td className="px-4 py-3 text-right text-slate-800 font-bold text-[12px] border-r border-slate-100/60">{Number(it.qty).toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3 text-right text-slate-600 font-medium text-[11px] border-r border-slate-100/60">{RUPEE}{Number(it.unit_rate).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      {showDiscount && (
                        <td className="px-3 py-3 text-right text-rose-500 font-bold text-[11px] border-r border-slate-100/60">{Number(it.discount_pct)}%</td>
                      )}
                      <td className="px-4 py-3 text-right text-slate-400 font-bold text-[11px] border-r border-slate-100/60">{Number(it.tax_pct)}%</td>

                      {showRemarks && (
                        <td className="px-4 py-3 text-left text-slate-500 font-medium text-[10px] border-r border-slate-100/60 whitespace-normal leading-tight">
                          {it.remarks || FALLBACK}
                        </td>
                      )}

                      <td className="px-6 py-3 text-right text-indigo-900 font-bold bg-indigo-50/20 text-[13px]">{RUPEE}{Number(it.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-200 bg-slate-50 p-6 flex justify-end">
              <div className="w-full max-w-sm space-y-3 text-sm">
                <div className="flex justify-between items-center text-slate-500 font-medium pb-2 border-b border-slate-100 italic">
                  <span className="text-[10px] uppercase tracking-wider">SubTotal:</span>
                  <span className="text-slate-800 font-mono font-bold">{RUPEE} {subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>

                {discAmt > 0 && (
                  <div className="flex justify-between items-center text-rose-500 font-medium">
                    <span className="text-[10px] uppercase tracking-wider">Discount ({discountPct}%):</span>
                    <span className="font-mono font-bold">- {RUPEE} {discAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {fright > 0 && (
                  <div className="flex justify-between items-center text-slate-500 font-medium pb-1">
                    <span className="text-[10px] uppercase tracking-wider">Freight & Packing ({frightTax}%):</span>
                    <span className="text-slate-800 font-mono font-bold">{RUPEE} {fright.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                {totalGst > 0 && (
                  <div className="flex justify-between items-center text-slate-500 font-medium pb-1">
                    <span className="text-[10px] uppercase tracking-wider">GST (Summary):</span>
                    <span className="text-slate-800 font-mono font-bold">{RUPEE} {totalGst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-slate-900 font-black py-4 border-t border-slate-200 mt-2">
                  <span className="text-[11px] uppercase tracking-[0.3em] opacity-40">Grand Total:</span>
                  <div className="flex flex-col items-end">
                    <span className="text-2xl font-mono tracking-tighter bg-slate-900 text-white px-5 py-2.5 rounded-2xl shadow-2xl shadow-slate-200">{RUPEE} {grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                    <p className="mt-2 text-[10px] text-slate-400 font-bold uppercase tracking-tight italic">{amountToWords(grandTotal)}</p>
                  </div>
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
                <div className="quill-content order-rich-text text-sm text-slate-600 leading-relaxed">
                  <div dangerouslySetInnerHTML={{ __html: renderRichHtml(order.notes || snap.notes) }} />
                </div>
              </div>
            )}
            {/* Terms & Conditions */}
            {(order.terms_conditions?.length > 0 || order.terms?.length > 0 || snap.terms?.length > 0) && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                  <ShieldQuestion size={16} className="text-slate-400" /> Terms & Conditions
                </h3>
                <div className="space-y-3">
                  {(() => {
                    const arr = Array.isArray(order.terms_conditions) ? order.terms_conditions : Array.isArray(order.terms) ? order.terms : Array.isArray(snap.terms) ? snap.terms : null;
                    if (arr && arr.length === 1) return <div className="quill-content order-rich-text text-sm text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderRichHtml(arr[0]) }} />;
                    if (arr && arr.length > 1) return arr.map((term, i) => (
                      <div key={i} className="flex gap-3 text-sm text-slate-600">
                        <span className="text-slate-300 font-bold shrink-0">{String(i + 1).padStart(2, '0')}.</span>
                        <div className="quill-content order-rich-text flex-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderRichHtml(term) }} />
                      </div>
                    ));
                    const single = order.terms_conditions || order.terms || snap.terms;
                    if (single && !Array.isArray(single)) return <div className="quill-content order-rich-text text-sm text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderRichHtml(single) }} />;
                    return null;
                  })()}
                </div>
              </div>
            )}

            {/* Payment Terms */}
            {(order.payment_terms?.length > 0 || order.paymentTerms?.length > 0 || snap.payment_terms?.length > 0) && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-slate-400" /> Payment Terms
                </h3>
                <div className="space-y-3">
                  {(() => {
                    const arr = Array.isArray(order.payment_terms) ? order.payment_terms : Array.isArray(order.paymentTerms) ? order.paymentTerms : Array.isArray(snap.payment_terms) ? snap.payment_terms : null;
                    if (arr && arr.length === 1) return <div className="quill-content order-rich-text text-sm text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderRichHtml(arr[0]) }} />;
                    if (arr && arr.length > 1) return arr.map((term, i) => (
                      <div key={i} className="flex gap-3 text-sm text-slate-600">
                        <span className="text-slate-300 font-bold shrink-0">{String(i + 1).padStart(2, '0')}.</span>
                        <div className="quill-content order-rich-text flex-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderRichHtml(term) }} />
                      </div>
                    ));
                    const single = order.payment_terms || order.paymentTerms || snap.payment_terms;
                    if (single && !Array.isArray(single)) return <div className="quill-content order-rich-text text-sm text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderRichHtml(single) }} />;
                    return null;
                  })()}
                </div>
              </div>
            )}

            {/* Governing Laws */}
            {(order.governing_laws?.length > 0 || order.governingLaws?.length > 0 || snap.governing_laws?.length > 0) && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                  <Landmark size={16} className="text-slate-400" /> Governing Laws
                </h3>
                <div className="space-y-4">
                  {(() => {
                    const arr = order.governing_laws || order.governingLaws || snap.governing_laws;
                    const items = Array.isArray(arr) ? arr : arr ? [arr] : [];
                    if (items.length === 1) return <div className="quill-content order-rich-text text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-lg border border-slate-100" dangerouslySetInnerHTML={{ __html: renderRichHtml(items[0]) }} />;
                    return items.map((law, i) => (
                      <div key={i} className="quill-content order-rich-text text-sm text-slate-600 leading-relaxed bg-slate-50/50 p-4 rounded-lg border border-slate-100"
                        dangerouslySetInnerHTML={{ __html: renderRichHtml(law) }} />
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Annexures */}
            {(order.annexures?.length > 0 || snap.annexures?.length > 0) && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h3 className="font-bold text-sm text-slate-800 mb-4 flex items-center gap-2">
                  <FileText size={16} className="text-slate-400" /> Annexures
                </h3>
                <div className="space-y-3">
                  {(() => {
                    const arr = Array.isArray(order.annexures) ? order.annexures : Array.isArray(snap.annexures) ? snap.annexures : [];
                    if (arr.length === 1) return <div className="quill-content order-rich-text text-sm text-slate-600 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderRichHtml(arr[0]) }} />;
                    return arr.map((anx, i) => (
                      <div key={i} className="flex gap-3 text-sm text-slate-600">
                        <span className="text-slate-300 font-bold shrink-0">{String(i + 1).padStart(2, '0')}.</span>
                        <div className="quill-content order-rich-text flex-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: renderRichHtml(anx) }} />
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Acceptance Section */}
            <div className="bg-white rounded-xl border border-slate-200 p-8 pt-6">
              <h3 className="font-bold text-sm text-slate-800 mb-8 pb-4 border-b border-slate-100 flex items-center gap-2">
                <User size={16} className="text-slate-400" /> Authorized Signatures
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                {/* Authorized Side */}
                <div className="relative">
                  <p className="font-black text-slate-900 text-[13px] mb-8 uppercase tracking-widest">{comp.companyName || comp.company_name || FALLBACK}</p>

                  <div className="relative h-28 mb-8">
                    {(comp.stampUrl || comp.stamp_url) && (
                      <img src={comp.stampUrl || comp.stamp_url} alt="Stamp"
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-24 w-auto object-contain opacity-70 mix-blend-multiply" />
                    )}
                    {(comp.signUrl || comp.sign_url) && (
                      <img src={comp.signUrl || comp.sign_url} alt="Signature"
                        className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-auto object-contain z-10" />
                    )}

                  </div>

                  <p className="text-[12px] font-bold text-slate-400 italic mb-4 tracking-tight">(Authorized Signature)</p>
                  <div className="space-y-1.5 text-sm text-slate-900">
                    <p><span className="font-bold text-slate-800">Name:</span> {comp.personName || comp.person_name || order.made_by || FALLBACK} ({comp.designation || "Procurement"})</p>
                    <p><span className="font-bold text-slate-800 transition-colors">Date:</span> {poDate}</p>
                  </div>
                </div>

                <div className="flex flex-col items-start md:items-end relative">
                  <div className="w-full max-w-sm">
                    <p className="font-black text-slate-900 text-[13px] mb-8 uppercase tracking-widest">{vendorDisplayName}</p>
                    <div className="h-24 mb-8" />
                    <p className="text-[12px] font-bold text-slate-400 italic mb-4 tracking-tight">(Agreed & Accepted by)</p>
                    <div className="space-y-1.5 text-sm text-slate-900">
                      <p><span className="font-bold text-slate-800">Name:</span> {vendorSignatoryName}</p>
                      <p><span className="font-bold text-slate-800 transition-colors">Date:</span> </p>
                    </div>
                  </div>
                </div>


              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Approvals" && (() => {
        const user = JSON.parse(localStorage.getItem("bms_user") || "{}");
        const isGlobalAdmin = user.role === "global_admin";
        const currentStep = approvalData.timeline.find(s => s.status === 'In Progress');
        const isCurrentApprover = currentStep && String(currentStep.approver_id) === String(user.id);
        const canActOnApproval = order.status === 'Pending Issue' && (
          (approvalData.request && (isGlobalAdmin || isCurrentApprover)) ||
          (!approvalData.request && isGlobalAdmin)
        );

        const runApprovalAction = (actionType) => {
          if (approvalData.request) {
            handleApprovalAction(actionType);
          } else {
            // Fallback: no approval request — update order status directly (global admin only)
            const nextStatus = actionType === 'Issued' ? 'Issued' : actionType === 'Reverted' ? 'Reverted' : 'Rejected';
            updateStatus(nextStatus);
          }
        };

        return (
          <div className="px-14 py-3 max-w-[1400px]">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Approval Workflow</h2>

            {canActOnApproval && (
              <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 flex items-center justify-between shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Take Action</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {approvalData.request ? "Issue, revert, or reject this order." : "No approval workflow found — global admin override."}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button disabled={actionLoading}
                    onClick={() => { setActionComment(""); runApprovalAction('Issued'); }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-sm text-xs transition-all disabled:opacity-60">
                    Issued
                  </button>
                  <button disabled={actionLoading}
                    onClick={() => setActionModal({ open: true, type: 'Reverted' })}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg shadow-sm text-xs transition-all disabled:opacity-60">
                    Revert
                  </button>
                  <button disabled={actionLoading}
                    onClick={() => setActionModal({ open: true, type: 'Rejected' })}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg shadow-sm text-xs transition-all disabled:opacity-60">
                    Reject
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-8">
              {approvalData.timeline.length === 0 ? (
                <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400">No approvals found</div>
              ) : (
                approvalData.timeline.map((step, idx) => (
                  <div key={idx} className="relative flex gap-4">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0 z-10">{idx + 1}</div>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 flex-1">
                      <h3 className="font-bold text-slate-800">{step.approver_name}</h3>
                      <p className="text-xs text-slate-500">{step.approver_designation}</p>
                      <div className="mt-2 text-sm">{step.status}</div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {actionModal.open && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                  <h3 className="font-bold text-slate-800 text-base mb-1">
                    {actionModal.type === 'Reverted' ? 'Revert Order' : 'Reject Order'}
                  </h3>
                  <p className="text-xs text-slate-500 mb-4">Please provide a comment. This is required.</p>
                  <textarea value={actionComment} onChange={(e) => setActionComment(e.target.value)}
                    rows={4} placeholder="Enter reason..."
                    className="w-full border border-slate-200 rounded-lg p-3 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50" />
                  <div className="flex items-center justify-end gap-2 mt-4">
                    <button onClick={() => { setActionModal({ open: false, type: '' }); setActionComment(''); }}
                      className="px-4 py-2 text-xs font-bold text-slate-600 rounded-lg hover:bg-slate-100">
                      Cancel
                    </button>
                    <button disabled={actionLoading}
                      onClick={() => {
                        if (!approvalData.request && (actionModal.type === 'Reverted' || actionModal.type === 'Rejected') && !actionComment.trim()) {
                          alert("Comment is required.");
                          return;
                        }
                        runApprovalAction(actionModal.type);
                        setActionModal({ open: false, type: '' });
                        setActionComment('');
                      }}
                      className={`px-4 py-2 text-xs font-bold text-white rounded-lg shadow-sm disabled:opacity-60 ${actionModal.type === 'Reverted' ? 'bg-orange-500 hover:bg-orange-600' : 'bg-red-600 hover:bg-red-700'}`}>
                      Confirm {actionModal.type === 'Reverted' ? 'Revert' : 'Reject'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {activeTab === "PDF View" && (
        <div className="bg-slate-200">
          <div className="px-4 py-3 flex justify-end print:hidden">
            <button disabled={pdfLoading} onClick={() => handleSafeDownload(true)} className={`flex items-center gap-2 px-6 py-2.5 text-white font-bold rounded-xl shadow-lg transition-all text-xs uppercase ${pdfLoading ? 'bg-slate-400' : 'bg-[#1b3e8a] hover:bg-[#16326d]'}`}>
              <Download size={14} /> {pdfLoading ? "Working..." : "Download PDF"}
            </button>
          </div>
          {data?.order?.id && (
            <div className="flex justify-center px-4 pb-8 bg-slate-300">
              <iframe
                title="Order PDF"
                src={`${API}/api/orders/${data.order.id}/preview?t=${Date.now()}`}
                className="bg-white shadow-xl"
                style={{ border: 0, width: "210mm", maxWidth: "100%", height: "297mm" }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ViewOrder;
