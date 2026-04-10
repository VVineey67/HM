import React, { useState, useEffect } from "react";
import { List, Search, Trash2, Download, Eye, FileText, ChevronRight, Calculator, Pencil, FileDown, Rocket } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import ViewOrder from "./ViewOrder";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function OrderRecord(props) {
  const { project } = props;
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [viewOrderId, setViewOrderId] = useState(null);
  const [activeTab, setActiveTab] = useState("All");

  const TABS = ["All", "Draft", "Review", "Pending Issue", "Issued", "Rejected", "Revert", "Recall"];

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

  // Convert image URL to Base64 to embed in PDF
  const getBase64Image = async (url) => {
    if (!url) return null;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch {
      return null;
    }
  };

  /* ════════════════════════════════════════════════════════
     PROFESSIONAL PDF EXPORT
     ════════════════════════════════════════════════════════ */
  const exportPDF = async (orderId) => {
    try {
      showToast("Generating PDF... Please wait.");
      const res = await fetch(`${API}/api/orders/${orderId}`);
      const { order, items } = await res.json();
      
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const snap = order.snapshot || {};
      const sComp = snap.company || order.companies || {};
      const sVend = snap.vendor || order.vendors || {};
      const sSite = snap.site || order.sites || {};

      // Load Images
      const logoB64 = await getBase64Image(sComp.logoUrl || sComp.logo_url);
      const signB64 = await getBase64Image(sComp.signUrl || sComp.sign_url);
      
      let cursorY = 15;

      /* ── HEADER SECTION ── */
      if (logoB64) {
        doc.addImage(logoB64, "PNG", 15, cursorY, 30, 20, "", "FAST");
      }
      
      // Company Details (Right aligned)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(sComp.companyName?.toUpperCase() || sComp.company_name?.toUpperCase() || "", pageWidth - 15, cursorY + 5, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(sComp.address || "", pageWidth - 15, cursorY + 10, { align: "right" });
      doc.text(`GSTIN: ${sComp.gstin || "N/A"}`, pageWidth - 15, cursorY + 14, { align: "right" });
      
      cursorY += 25;
      
      // Separator
      doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.5); doc.line(15, cursorY, pageWidth - 15, cursorY);
      cursorY += 8;

      /* ── ORDER TITLE & METADATA ── */
      doc.setFont("helvetica", "bold"); doc.setFontSize(16);
      doc.text(order.order_type === "Supply" ? "PURCHASE ORDER" : "WORK ORDER", pageWidth / 2, cursorY, { align: "center" });
      cursorY += 10;
      
      doc.setFontSize(10);
      
      // Meta Grid
      doc.text("Order No:", 15, cursorY);
      doc.setFont("helvetica", "normal");
      doc.text(order.order_number, 40, cursorY);
      
      doc.setFont("helvetica", "bold");
      doc.text("Date:", pageWidth / 2 + 10, cursorY);
      doc.setFont("helvetica", "normal");
      doc.text(new Date(order.created_at).toLocaleDateString("en-IN"), pageWidth / 2 + 30, cursorY);
      
      cursorY += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Subject:", 15, cursorY);
      doc.setFont("helvetica", "normal");
      doc.text(order.subject || "N/A", 40, cursorY);
      
      cursorY += 6;
      doc.setFont("helvetica", "bold");
      doc.text("Ref No:", 15, cursorY);
      doc.setFont("helvetica", "normal");
      doc.text(order.ref_number || "N/A", 40, cursorY);

      cursorY += 12;

      /* ── ADDRESSES ── */
      doc.setDrawColor(0); doc.setLineWidth(0.2);
      
      // left box: VENDOR (Bill to)
      doc.rect(15, cursorY, 85, 35);
      doc.setFont("helvetica", "bold");
      doc.text("VENDOR / BILL TO:", 18, cursorY + 5);
      doc.setFont("helvetica", "normal");
      doc.text(sVend.vendorName || sVend.vendor_name || "", 18, cursorY + 11);
      doc.setFontSize(8);
      const vendorAddr = doc.splitTextToSize(sVend.address || "", 80);
      doc.text(vendorAddr, 18, cursorY + 16);
      doc.text(`GSTIN: ${sVend.gstin || "N/A"}`, 18, cursorY + 31);
      
      // right box: SITE (Ship to)
      doc.rect(105, cursorY, 90, 35);
      doc.setFont("helvetica", "bold"); doc.setFontSize(10);
      doc.text("SHIP TO / DELIVERY SITE:", 108, cursorY + 5);
      doc.setFont("helvetica", "normal");
      doc.text(sSite.siteName || sSite.site_name || "", 108, cursorY + 11);
      doc.setFontSize(8);
      const siteAddr = doc.splitTextToSize(sSite.siteAddress || sSite.site_address || "", 85);
      doc.text(siteAddr, 108, cursorY + 16);

      cursorY += 45;

      /* ── ITEMS TABLE ── */
      const tableHead = [["S.No", "Description", "UOM", "Qty", "Rate (Rs)", "Tax %", "Amount (Rs)"]];
      const tableBody = items.map((it, i) => [
        i + 1,
        // Include scope of work if WO
        it.description + (it.scope_of_work ? `\nScope: ${it.scope_of_work}` : ""),
        it.unit?.toUpperCase() || "",
        it.qty || 0,
        Number(it.unit_rate).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
        it.tax_pct || "0",
        Number(it.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      ]);

      autoTable(doc, {
        startY: cursorY,
        head: tableHead,
        body: tableBody,
        theme: "grid",
        styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [40, 50, 70], textColor: 255, fontStyle: "bold" },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" },
          1: { cellWidth: "auto" },
          2: { cellWidth: 15, halign: "center" },
          3: { cellWidth: 15, halign: "center" },
          4: { cellWidth: 25, halign: "right" },
          5: { cellWidth: 15, halign: "center" },
          6: { cellWidth: 30, halign: "right" },
        },
      });

      cursorY = doc.lastAutoTable.finalY + 10;

      /* ── TOTALS ── */
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      const totalsObj = order.totals || {};
      const tY = cursorY;
      doc.text("Subtotal:", 145, tY, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.text((totalsObj.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }), 190, tY, { align: "right" });
      
      doc.setFont("helvetica", "bold");
      doc.text("GST:", 145, tY + 6, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.text((totalsObj.gst || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }), 190, tY + 6, { align: "right" });
      
      doc.setFont("helvetica", "bold");
      doc.text("Grand Total:", 145, tY + 12, { align: "right" });
      doc.text((totalsObj.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }), 190, tY + 12, { align: "right" });

      doc.setFontSize(9);
      doc.text(`Amount in Words:`, 15, tY);
      doc.setFont("helvetica", "italic");
      doc.text(totalsObj.words || "", 15, tY + 6);
      
      cursorY += 25;

      /* ── NOTES ── */
      if (order.notes && order.notes.trim() !== "" && order.notes !== "<p><br></p>") {
        if (cursorY > pageHeight - 60) { doc.addPage(); cursorY = 20; }
        doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("ORDER NOTES:", 15, cursorY);
        cursorY += 6;
        doc.setFont("helvetica", "normal"); doc.setFontSize(9);
        
        // Basic HTML to text conversion for PDF
        const cleanNotes = order.notes
          .replace(/<br\s*\/?>/gi, "\n")
          .replace(/<\/p>/gi, "\n")
          .replace(/<li>/gi, "• ")
          .replace(/<\/li>/gi, "\n")
          .replace(/<[^>]+>/g, ""); // strip remaining tags
          
        const noteLines = doc.splitTextToSize(cleanNotes.trim(), 180);
        doc.text(noteLines, 15, cursorY);
        cursorY += (noteLines.length * 5) + 8;
      }

      /* ── CLAUSES ── */
      // Check if page break needed
      if (cursorY > pageHeight - 80) {
        doc.addPage();
        cursorY = 20;
      }
      
      const tc = order.terms_conditions || [];
      const pt = order.payment_terms || [];
      const gl = order.governing_laws || [];
      const anx = order.annexures || [];
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      
      if (tc.length) {
        doc.text("Terms & Conditions:", 15, cursorY);
        cursorY += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        tc.forEach((t, i) => {
          const lines = doc.splitTextToSize(`${i+1}. ${t}`, 180);
          doc.text(lines, 15, cursorY);
          cursorY += (lines.length * 4) + 1;
        });
        cursorY += 5;
      }

      if (pt.length) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Payment Terms:", 15, cursorY);
        cursorY += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        pt.forEach((t, i) => {
          const lines = doc.splitTextToSize(`${i+1}. ${t}`, 180);
          doc.text(lines, 15, cursorY);
          cursorY += (lines.length * 4) + 1;
        });
        cursorY += 5;
      }

      if (gl.length) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Governing Laws:", 15, cursorY);
        cursorY += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        gl.forEach((t, i) => {
          const lines = doc.splitTextToSize(`${i+1}. ${t}`, 180);
          doc.text(lines, 15, cursorY);
          cursorY += (lines.length * 4) + 1;
        });
        cursorY += 5;
      }

      if (anx.length) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Annexures:", 15, cursorY);
        cursorY += 5;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        anx.forEach((t, i) => {
          const lines = doc.splitTextToSize(`${i+1}. ${t}`, 180);
          doc.text(lines, 15, cursorY);
          cursorY += (lines.length * 4) + 1;
        });
        cursorY += 5;
      }

      /* ── FOOTER & SIGNATORY ── */
      const footerY = pageHeight - 45;
      if (cursorY > footerY) {
         doc.addPage();
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`For ${order.companies?.company_name || ""}`, pageWidth - 15, footerY, { align: "right" });
      
      if (signB64) {
        doc.addImage(signB64, "PNG", pageWidth - 55, footerY + 2, 40, 15, "", "FAST");
      }
      
      doc.setFont("helvetica", "normal");
      doc.text("Authorised Signatory", pageWidth - 15, footerY + 20, { align: "right" });
      
      // Footer borders
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text("This is a computer generated document.", pageWidth / 2, pageHeight - 10, { align: "center" });

      doc.save(`Order_${order.order_number.replace(/\//g, "_")}.pdf`);
      showToast("PDF exported successfully!");

    } catch (err) {
      console.error(err);
      showToast("Error generating PDF", "error");
    }
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
                          <button onClick={() => exportPDF(o.id)} 
                            className="h-7 w-7 rounded-full border border-slate-200 flex items-center justify-center text-slate-800 hover:text-slate-900 border-slate-300 hover:bg-slate-100 transition-all shadow-sm"
                            title="Download PDF">
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
    </div>
  );
}
