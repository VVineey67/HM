import React, { useState, useEffect } from "react";
import { List, Search, Trash2, Download, Eye, FileText, ChevronRight, Calculator } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function OrderRecord({ project }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

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
      
      // Load Images
      const logoB64 = await getBase64Image(order.companies?.logo_url);
      const signB64 = await getBase64Image(order.companies?.sign_url);
      
      let cursorY = 15;

      /* ── HEADER SECTION ── */
      if (logoB64) {
        // Adjust width/height as per typical logos
        doc.addImage(logoB64, "PNG", 15, cursorY, 30, 20, "", "FAST");
      }
      
      // Company Details (Right aligned)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(order.companies?.company_name?.toUpperCase() || "", pageWidth - 15, cursorY + 5, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(order.companies?.address || "", pageWidth - 15, cursorY + 10, { align: "right" });
      doc.text(`GSTIN: ${order.companies?.gstin || "N/A"}`, pageWidth - 15, cursorY + 14, { align: "right" });
      
      cursorY += 25;
      
      // Separator
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(15, cursorY, pageWidth - 15, cursorY);
      cursorY += 8;

      /* ── ORDER TITLE & METADATA ── */
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
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
      doc.setDrawColor(0);
      doc.setLineWidth(0.2);
      
      // left box: VENDOR (Bill to)
      doc.rect(15, cursorY, 85, 35);
      doc.setFont("helvetica", "bold");
      doc.text("VENDOR / BILL TO:", 18, cursorY + 5);
      doc.setFont("helvetica", "normal");
      doc.text(order.vendors?.vendor_name || "", 18, cursorY + 11);
      doc.setFontSize(8);
      const vendorAddr = doc.splitTextToSize(order.vendors?.address || "", 80);
      doc.text(vendorAddr, 18, cursorY + 16);
      doc.text(`GSTIN: ${order.vendors?.gstin || "N/A"}`, 18, cursorY + 31);
      
      // right box: SITE (Ship to)
      doc.rect(105, cursorY, 90, 35);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("SHIP TO / DELIVERY SITE:", 108, cursorY + 5);
      doc.setFont("helvetica", "normal");
      doc.text(order.sites?.site_name || "", 108, cursorY + 11);
      doc.setFontSize(8);
      const siteAddr = doc.splitTextToSize(order.sites?.site_address || "", 85);
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

      /* ── CLAUSES ── */
      // Check if page break needed
      if (cursorY > pageHeight - 80) {
        doc.addPage();
        cursorY = 20;
      }
      
      const tc = order.terms_conditions || [];
      const pt = order.payment_terms || [];
      const gl = order.governing_laws || [];
      
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

  const filtered = orders.filter(o => 
    o.order_number?.toLowerCase().includes(search.toLowerCase()) || 
    o.subject?.toLowerCase().includes(search.toLowerCase()) ||
    o.vendors?.vendor_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 md:p-6 w-full max-w-[1400px] mx-auto pb-32">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg
          ${toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
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

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
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
        
        {loading ? (
           <div className="p-10 text-center text-slate-400 text-sm">Loading orders...</div>
        ) : filtered.length === 0 ? (
           <div className="p-16 text-center text-slate-400 text-sm font-bold uppercase tracking-widest">No orders found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead>
                <tr className="bg-slate-800 text-white font-semibold">
                  <th className="px-4 py-3 uppercase tracking-wider text-xs">Date</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-xs">Order No</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-xs">Type</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-xs">Vendor</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-xs text-right">Grand Total (₹)</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-xs text-center">Docs</th>
                  <th className="px-4 py-3 uppercase tracking-wider text-xs text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 text-slate-500 font-medium">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">{o.order_number}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider 
                        ${o.order_type === "Supply" ? "bg-indigo-50 text-indigo-700" : "bg-orange-50 text-orange-700"}`}>
                        {o.order_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium truncate max-w-[200px]" title={o.vendors?.vendor_name}>{o.vendors?.vendor_name}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-green-700 bg-green-50/30">
                      {o.totals?.grandTotal?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {o.quotation_url ? <a href={o.quotation_url} target="_blank" rel="noreferrer" className="text-sky-500 hover:scale-110 transition-transform" title="Quotation"><FileText size={16}/></a> : <span className="text-slate-300"><FileText size={16}/></span>}
                        {o.comparative_sheet_url ? <a href={o.comparative_sheet_url} target="_blank" rel="noreferrer" className="text-purple-500 hover:scale-110 transition-transform" title="Comparative"><Calculator size={16}/></a> : <span className="text-slate-300"><Calculator size={16}/></span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <button onClick={() => exportPDF(o.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all font-semibold flex items-center gap-1.5 text-xs">
                          <Download size={14}/> PDF
                        </button>
                        <div className="w-px h-4 bg-slate-200 mx-1"/>
                        <button onClick={() => handleDelete(o.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                          <Trash2 size={15}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
