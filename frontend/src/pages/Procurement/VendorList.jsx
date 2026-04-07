import React, { useState, useEffect, useRef } from "react";
import { Plus, Search, Pencil, Trash2, X, Building2, Upload, FileText, ChevronLeft, ChevronRight, Download, FileSpreadsheet, ChevronDown, Eye } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
const PER_PAGE = 15;

const emptyForm = {
  vendorName: "", email: "", contactPerson: "", mobile: "",
  gstin: "", pan: "", aadharNo: "", msmeNumber: "",
  bankName: "", accountHolder: "", accountNumber: "", ifscCode: "",
  bankBranch: "", bankCity: "", bankState: "", address: "",
  logo: null, logoPreview: "",
  docGst: null, docPan: null, docAadhaar: null, docCoi: null,
  docMsme: null, docCancelCheque: null, docOther: null, docOther2: null,
};

const inp = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50 text-slate-700 transition-all";
const lbl = "block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider";

const DocUpload = ({ label, fieldKey, form, setForm }) => {
  const ref = useRef();
  const file = form[fieldKey];
  const urlKey = `${fieldKey}Url`;
  const existingUrl = form[urlKey];
  const hasDoc = !!file || !!existingUrl;

  const handleRemove = (e) => {
    e.stopPropagation();
    setForm(f => ({ ...f, [fieldKey]: null, [urlKey]: "" })); // "" ensures backend wipes the DB field if untouched
  };

  return (
    <div>
      <p className={lbl}>{label}</p>
      <div onClick={() => ref.current.click()}
        className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition-all ${
          hasDoc ? "border-indigo-200 bg-indigo-50/50 hover:border-indigo-300" : "border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40"
        }`}>
        <FileText size={15} className={hasDoc ? "text-indigo-500" : "text-slate-300"} />
        <span className={`text-xs truncate ${hasDoc ? "text-indigo-600 font-medium" : "text-slate-400"}`}>
          {file ? file.name : (existingUrl ? "Uploaded Document" : "Click to upload")}
        </span>
        {hasDoc && (
          <button type="button" onClick={handleRemove}
            className="ml-auto text-slate-400 hover:text-red-500 transition-colors" title="Remove Document">
            <X size={14} />
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
        onChange={e => { const f = e.target.files[0]; if (f) setForm(prev => ({ ...prev, [fieldKey]: f })); e.target.value = ""; }} />
    </div>
  );
};

const COLS = [
  { label: "Vendor Firm Name",       key: "vendorName",     w: "w-[30%] min-w-[180px]" },
  { label: "Email",                  key: "email",          w: "w-[25%] min-w-[150px]" },
  { label: "Contact Number",         key: "mobile",         w: "w-[20%] min-w-[120px]" },
  { label: "GST No",                 key: "gstin",          w: "w-[25%] min-w-[140px]", mono: true },
];

const MODAL_TABS = [
  { key: "basic", label: "Basic Info"   },
  { key: "bank",  label: "Bank Details" },
  { key: "docs",  label: "Documents"    },
];

export default function VendorList() {
  const [vendors, setVendors]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [viewVendor, setViewVendor] = useState(null);
  const [form, setForm]           = useState(emptyForm);
  const [editId, setEditId]       = useState(null);
  const [search, setSearch]       = useState("");
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);
  const [tab, setTab]             = useState("basic");
  const [page, setPage]           = useState(1);
  const [showBulk, setShowBulk]   = useState(false);
  const [bulkRows, setBulkRows]   = useState([]);
  const [bulkFile, setBulkFile]   = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const logoRef                   = useRef();
  const bulkRef                   = useRef();

  useEffect(() => { fetchVendors(); }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/procurement/vendors`);
      const data = await res.json();
      setVendors(data.vendors || []);
    } catch { setVendors([]); }
    setLoading(false);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd = () => { setForm(emptyForm); setEditId(null); setTab("basic"); setShowModal(true); };

  const openEdit = (v) => {
    setForm({
      ...emptyForm, ...v,
      logo: null, logoPreview: v.logoUrl || "",
      docGst: null, docPan: null, docAadhaar: null, docCoi: null,
      docMsme: null, docCancelCheque: null, docOther: null, docOther2: null,
    });
    setEditId(v.id); setTab("basic"); setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.vendorName.trim()) return showToast("Vendor Name required", "error");
    setSaving(true);
    try {
      const fd = new FormData();
      const currentUser = JSON.parse(localStorage.getItem("bms_user") || "{}");
      fd.append("createdById", currentUser.id || "");
      fd.append("createdByName", currentUser.name || "");
      Object.entries(form).forEach(([k, v]) => {
        if (k === "logoPreview") return;
        if (v instanceof File) fd.append(k, v);
        else if (v) fd.append(k, v);
      });
      const url    = editId ? `${API}/api/procurement/vendors/${editId}` : `${API}/api/procurement/vendors`;
      const method = editId ? "PUT" : "POST";
      const res    = await fetch(url, { method, body: fd });
      if (!res.ok) throw new Error("Save failed");
      showToast(editId ? "Vendor updated" : "Vendor added");
      setShowModal(false);
      fetchVendors();
    } catch { showToast("Failed to save", "error"); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this vendor?")) return;
    try {
      await fetch(`${API}/api/procurement/vendors/${id}`, { method: "DELETE" });
      showToast("Vendor deleted");
      fetchVendors();
    } catch { showToast("Failed to delete", "error"); }
  };

  const forceDownload = async (url, filename) => {
    try {
      showToast("Starting download…");
      const resp = await fetch(url);
      const blob = await resp.blob();
      const objUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = `${filename || "Document"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(objUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  /* ── Export helpers ── */
  const EXPORT_COLS = [
    ["Vendor Firm Name", "vendorName"], ["Email", "email"],
    ["Contact Person Name", "contactPerson"], ["Contact Person Number", "mobile"],
    ["GST No", "gstin"], ["PAN No", "pan"], ["Aadhar No", "aadharNo"],
    ["MSME Number", "msmeNumber"], ["Bank Name", "bankName"],
    ["Account Holder", "accountHolder"], ["Account Number", "accountNumber"],
    ["Bank IFSC", "ifscCode"], ["Bank Branch", "bankBranch"],
    ["Bank City", "bankCity"], ["Bank State", "bankState"], ["Address", "address"],
  ];

  const exportExcel = () => {
    const rows = filtered.map(v => Object.fromEntries(EXPORT_COLS.map(([h, k]) => [h, v[k] || ""])));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendors");
    XLSX.writeFile(wb, "vendor_list.xlsx");
    setShowExport(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    doc.setFontSize(13); doc.setFont(undefined, "bold");
    doc.text("Vendor List", 14, 14);
    doc.setFontSize(8); doc.setFont(undefined, "normal");
    doc.text(`Exported: ${new Date().toLocaleDateString("en-IN")} · ${filtered.length} vendors`, 14, 20);
    autoTable(doc, {
      startY: 25,
      head: [EXPORT_COLS.map(([h]) => h)],
      body: filtered.map(v => EXPORT_COLS.map(([, k]) => v[k] || "")),
      styles: { fontSize: 6.5, cellPadding: 2 },
      headStyles: { fillColor: [30, 27, 75], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 249, 255] },
    });
    doc.save("vendor_list.pdf");
    setShowExport(false);
  };

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([Object.fromEntries(EXPORT_COLS.map(([h]) => [h, ""]))]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Vendors");
    XLSX.writeFile(wb, "vendor_bulk_template.xlsx");
  };

  const handleBulkFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBulkFile(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const wb   = XLSX.read(ev.target.result, { type: "array" });
      const ws   = wb.Sheets[wb.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(ws);
      const valid = data.filter(r => r["Vendor Firm Name"]);
      setBulkRows(valid);
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  const handleBulkSave = async () => {
    if (!bulkRows.length) return showToast("No valid rows to upload", "error");
    setBulkSaving(true);
    try {
      const currentUser = JSON.parse(localStorage.getItem("bms_user") || "{}");
      const res = await fetch(`${API}/api/procurement/vendors/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          rows: bulkRows,
          createdById: currentUser.id || "",
          createdByName: currentUser.name || ""
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      showToast(`${data.inserted} vendors uploaded`);
      setShowBulk(false); setBulkRows([]); setBulkFile("");
      fetchVendors();
    } catch (err) { showToast(err.message, "error"); }
    setBulkSaving(false);
  };

  const filtered   = vendors.filter(v =>
    v.vendorName?.toLowerCase().includes(search.toLowerCase()) ||
    v.gstin?.toLowerCase().includes(search.toLowerCase()) ||
    v.email?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="p-4 md:p-6 w-full">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg
          ${toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
            <Building2 size={18} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800">Vendor List</h1>
            <p className="text-xs text-slate-400">{vendors.length} vendors registered</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Export dropdown */}
          <div className="relative">
            <button onClick={() => { setShowExport(s => !s); setShowBulk(false); }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
              <Download size={14} /> Export <ChevronDown size={12} />
            </button>
            {showExport && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-slate-100 py-1 min-w-35">
                <button onClick={exportExcel}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <FileSpreadsheet size={14} className="text-green-600" /> Excel (.xlsx)
                </button>
                <button onClick={exportPDF}
                  className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors">
                  <FileText size={14} className="text-red-500" /> PDF
                </button>
              </div>
            )}
          </div>

          {/* Bulk Upload */}
          <button onClick={() => { setShowBulk(s => !s); setShowExport(false); }}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
            <Upload size={14} /> Bulk Upload
          </button>

          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-all">
            <Plus size={14} /> Add Vendor
          </button>
        </div>
      </div>

      {/* Bulk Upload Panel */}
      {showBulk && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-700">Bulk Upload Vendors</h3>
            <button onClick={() => { setShowBulk(false); setBulkRows([]); setBulkFile(""); }}
              className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Step 1: Template */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-indigo-600">1</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700">Download Template</p>
                <p className="text-xs text-slate-500 mt-0.5 mb-3">Fill in vendor details using the Excel template</p>
                <button onClick={downloadTemplate}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all">
                  <FileSpreadsheet size={13} className="text-green-600" /> Download Template
                </button>
              </div>
            </div>
            {/* Step 2: Upload */}
            <div className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                <span className="text-xs font-black text-indigo-600">2</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-700">Upload Filled File</p>
                <p className="text-xs text-slate-500 mt-0.5 mb-3">Select your filled Excel file to preview</p>
                <button onClick={() => bulkRef.current.click()}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all truncate max-w-full">
                  <Upload size={13} /> {bulkFile || "Choose .xlsx file"}
                </button>
                <input ref={bulkRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleBulkFile} />
              </div>
            </div>
          </div>

          {/* Preview */}
          {bulkRows.length > 0 && (
            <div className="mt-4">
              <p className="text-xs font-bold text-slate-600 mb-2">{bulkRows.length} vendors ready to upload</p>
              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-100 divide-y divide-slate-50">
                {bulkRows.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 text-xs">
                    <span className="text-slate-300 font-mono w-5 shrink-0">{i + 1}</span>
                    <span className="font-semibold text-slate-700 truncate">{r["Vendor Firm Name"]}</span>
                    {r["GST No"] && <span className="text-slate-400 font-mono">{r["GST No"]}</span>}
                    {r["Email"] && <span className="text-slate-400 truncate">{r["Email"]}</span>}
                  </div>
                ))}
              </div>
              <button onClick={handleBulkSave} disabled={bulkSaving}
                className="mt-3 flex items-center gap-2 px-5 py-2 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 transition-all">
                <Upload size={14} />
                {bulkSaving ? "Uploading…" : `Upload ${bulkRows.length} Vendors`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, GSTIN or email…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 bg-white text-slate-700" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-300 font-bold uppercase tracking-widest text-xs">No vendors found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 divide-x divide-slate-200">
                  <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 sticky left-0 bg-slate-50 min-w-12">
                    S.NO
                  </th>
                  {COLS.map(c => (
                    <th key={c.key} className={`px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap ${c.w}`}>
                      {c.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-500 w-[100px] sticky right-0 bg-slate-50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginated.map((v, idx) => (
                  <tr key={v.id} className="hover:bg-slate-50/60 transition-colors divide-x divide-slate-200">
                    <td className="px-4 py-3 text-xs font-medium text-slate-400 sticky left-0 bg-white">
                      {(page - 1) * PER_PAGE + idx + 1}
                    </td>
                    {COLS.map(c => (
                      <td key={c.key} className={`px-4 py-3 text-slate-700 whitespace-nowrap ${c.w}`}>
                        {c.key === "vendorName" ? (
                            <div className="flex items-center gap-3">
                              {v.logoUrl
                                ? <img src={v.logoUrl} alt="" className="w-8 h-8 rounded-lg object-contain border border-slate-100 bg-slate-50 p-0.5 shrink-0 shadow-sm" />
                                : <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100/50 flex items-center justify-center shrink-0 shadow-sm">
                                    <Building2 size={14} className="text-indigo-500" />
                                  </div>
                              }
                              <span className="font-semibold text-slate-800 break-words whitespace-normal">{v[c.key] || "—"}</span>
                            </div>
                        ) : (
                          <span className={`${c.mono ? "font-mono text-xs" : "text-sm"} ${!v[c.key] ? "text-slate-300" : ""} break-words whitespace-normal`}>
                            {v[c.key] || "—"}
                          </span>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 sticky right-0 bg-white">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setViewVendor(v)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all" title="View Details">
                          <Eye size={13} />
                        </button>
                        <button onClick={() => openEdit(v)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(v.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-400">{filtered.length} vendors · Page {page} of {totalPages}</p>
            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30 transition-all">
                  <ChevronLeft size={14} />
                </button>
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let n;
                  if (totalPages <= 5) n = i + 1;
                  else if (page <= 3) n = i + 1;
                  else if (page >= totalPages - 2) n = totalPages - 4 + i;
                  else n = page - 2 + i;
                  return (
                    <button key={n} onClick={() => setPage(n)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all
                        ${page === n ? "bg-slate-900 text-white border-slate-900" : "text-slate-600 border-slate-200 hover:bg-white"}`}>
                      {n}
                    </button>
                  );
                })}
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-white disabled:opacity-30 transition-all">
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h2 className="text-base font-bold text-slate-800">{editId ? "Edit Vendor" : "Add Vendor"}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-6 shrink-0">
              {MODAL_TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-px
                    ${tab === t.key ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">

              {/* BASIC TAB */}
              {tab === "basic" && (
                <div className="space-y-4">
                  {/* Logo */}
                  <div>
                    <label className={lbl}>Vendor Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden shrink-0">
                        {form.logoPreview
                          ? <img src={form.logoPreview} alt="" className="w-full h-full object-contain p-1" />
                          : <Building2 size={20} className="text-slate-300" />}
                      </div>
                      <button type="button" onClick={() => logoRef.current.click()}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all">
                        <Upload size={12} /> Upload Logo
                      </button>
                      <input ref={logoRef} type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files[0]; if (f) setForm(p => ({ ...p, logo: f, logoPreview: URL.createObjectURL(f) })); }} />
                    </div>
                  </div>

                  <div>
                    <label className={lbl}>Vendor Firm Name <span className="text-red-400 normal-case">*</span></label>
                    <input className={inp} value={form.vendorName}
                      onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))}
                      placeholder="e.g. Ojo Technologies Pvt Ltd" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={lbl}>Contact Person Name</label>
                      <input className={inp} value={form.contactPerson}
                        onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))}
                        placeholder="Full name" />
                    </div>
                    <div>
                      <label className={lbl}>Contact Person Number</label>
                      <input className={inp} value={form.mobile}
                        onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                        placeholder="10-digit number" />
                    </div>
                    <div className="col-span-2">
                      <label className={lbl}>Email</label>
                      <input className={inp} type="email" value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="vendor@email.com" />
                    </div>
                    <div>
                      <label className={lbl}>GST No</label>
                      <input className={`${inp} font-mono`} value={form.gstin}
                        onChange={e => setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))}
                        placeholder="15-digit GSTIN" />
                    </div>
                    <div>
                      <label className={lbl}>PAN No</label>
                      <input className={`${inp} font-mono`} value={form.pan}
                        onChange={e => setForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))}
                        placeholder="ABCDE1234F" />
                    </div>
                    <div>
                      <label className={lbl}>Aadhar No</label>
                      <input className={`${inp} font-mono`} value={form.aadharNo}
                        onChange={e => setForm(f => ({ ...f, aadharNo: e.target.value.replace(/\D/g, "") }))}
                        placeholder="12-digit Aadhar" maxLength={12} />
                    </div>
                    <div>
                      <label className={lbl}>MSME Number</label>
                      <input className={inp} value={form.msmeNumber}
                        onChange={e => setForm(f => ({ ...f, msmeNumber: e.target.value }))}
                        placeholder="MSME Reg. No. (if any)" />
                    </div>
                    <div className="col-span-2">
                      <label className={lbl}>Address</label>
                      <textarea className={`${inp} resize-none`} rows={2} value={form.address}
                        onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                        placeholder="Full address" />
                    </div>
                  </div>
                </div>
              )}

              {/* BANK TAB */}
              {tab === "bank" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className={lbl}>Bank Name</label>
                    <input className={inp} value={form.bankName}
                      onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
                      placeholder="e.g. HDFC Bank" />
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Account Holder Name</label>
                    <input className={inp} value={form.accountHolder}
                      onChange={e => setForm(f => ({ ...f, accountHolder: e.target.value }))}
                      placeholder="Name as per bank records" />
                  </div>
                  <div className="col-span-2">
                    <label className={lbl}>Account Number</label>
                    <input className={`${inp} font-mono`} value={form.accountNumber}
                      onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))}
                      placeholder="Account number" />
                  </div>
                  <div>
                    <label className={lbl}>IFSC Code</label>
                    <input className={`${inp} font-mono`} value={form.ifscCode}
                      onChange={e => setForm(f => ({ ...f, ifscCode: e.target.value.toUpperCase() }))}
                      placeholder="e.g. HDFC0002649" />
                  </div>
                  <div>
                    <label className={lbl}>Bank Branch</label>
                    <input className={inp} value={form.bankBranch}
                      onChange={e => setForm(f => ({ ...f, bankBranch: e.target.value }))}
                      placeholder="Branch name" />
                  </div>
                  <div>
                    <label className={lbl}>Bank City</label>
                    <input className={inp} value={form.bankCity}
                      onChange={e => setForm(f => ({ ...f, bankCity: e.target.value }))}
                      placeholder="City" />
                  </div>
                  <div>
                    <label className={lbl}>Bank State</label>
                    <input className={inp} value={form.bankState}
                      onChange={e => setForm(f => ({ ...f, bankState: e.target.value }))}
                      placeholder="State" />
                  </div>
                </div>
              )}

              {/* DOCS TAB */}
              {tab === "docs" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <DocUpload label="Aadhar Card"                  fieldKey="docAadhaar"      form={form} setForm={setForm} />
                    <DocUpload label="PAN Card"                     fieldKey="docPan"          form={form} setForm={setForm} />
                    <DocUpload label="GST Certificate"              fieldKey="docGst"          form={form} setForm={setForm} />
                    <DocUpload label="MSME Certificate"             fieldKey="docMsme"         form={form} setForm={setForm} />
                    <DocUpload label="Cancel Cheque"                fieldKey="docCancelCheque" form={form} setForm={setForm} />
                    <DocUpload label="Certificate of Incorporation" fieldKey="docCoi"          form={form} setForm={setForm} />
                  </div>

                  {/* Other Documents — max 2 */}
                    <div className="border-t border-slate-100 pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className={lbl + " mb-0"}>Other Documents <span className="text-slate-300 normal-case font-normal">(max 2)</span></p>
                        {(!(form.docOther || form.docOtherUrl) || !(form.docOther2 || form.docOther2Url)) && (
                          <button type="button"
                            onClick={() => {
                              const ref = document.getElementById("otherDocInput");
                              if (ref) ref.click();
                            }}
                            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 px-2.5 py-1 rounded-lg hover:bg-indigo-50 transition-all border border-indigo-200">
                            <Plus size={12} /> Add File
                          </button>
                        )}
                        <input id="otherDocInput" type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
                          onChange={e => {
                            const f = e.target.files[0];
                            if (!f) return;
                            e.target.value = "";
                            if (!form.docOther && !form.docOtherUrl) setForm(p => ({ ...p, docOther: f }));
                            else if (!form.docOther2 && !form.docOther2Url) setForm(p => ({ ...p, docOther2: f }));
                          }} />
                      </div>
                      <div className="space-y-2">
                        {[{ key: "docOther", label: "Doc 1" }, { key: "docOther2", label: "Doc 2" }].map(({ key, label }) => {
                          const file = form[key];
                          const url = form[`${key}Url`];
                          if (!file && !url) return null;
                          return (
                            <div key={key} className="flex items-center gap-3 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5">
                              <FileText size={14} className="text-indigo-500 shrink-0" />
                              <span className="text-xs font-medium text-indigo-700 truncate flex-1">
                                {file ? file.name : "Uploaded Document"}
                              </span>
                              <button type="button" onClick={() => setForm(p => ({ ...p, [key]: null, [`${key}Url`]: "" }))}
                                className="text-slate-400 hover:text-red-400 shrink-0"><X size={13} /></button>
                            </div>
                          );
                        })}
                        {!(form.docOther || form.docOtherUrl) && !(form.docOther2 || form.docOther2Url) && (
                          <p className="text-xs text-slate-300 text-center py-3">No files added yet</p>
                        )}
                      </div>
                    </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <div className="flex gap-1.5">
                {MODAL_TABS.map(t => (
                  <span key={t.key} className={`h-1.5 rounded-full transition-all ${tab === t.key ? "w-5 bg-indigo-600" : "w-1.5 bg-slate-200"}`} />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 transition-all">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700 transition-all disabled:opacity-50">
                  {saving ? "Saving…" : editId ? "Update" : "Add Vendor"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── VIEW MODAL ── */}
      {viewVendor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Building2 size={18} className="text-indigo-600" />
                {viewVendor.vendorName}
              </h2>
              <button onClick={() => setViewVendor(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={18} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 bg-slate-50">
              
              {/* Basic Details */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-50">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                    <Building2 size={16} className="text-indigo-500" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">Basic Information</h3>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Contact Person</p>
                    <p className="text-sm font-semibold text-slate-700 break-words">{viewVendor.contactPerson || "—"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Mobile</p>
                    <p className="text-sm font-semibold text-slate-700 break-words">{viewVendor.mobile || "—"}</p>
                  </div>
                  <div className="col-span-2 bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Email</p>
                    <p className="text-sm font-semibold text-slate-700 break-words">{viewVendor.email || "—"}</p>
                  </div>
                  <div className="col-span-full bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Address</p>
                    <p className="text-sm font-semibold text-slate-700">{viewVendor.address || "—"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">GST NO</p>
                    <p className="text-sm font-bold text-indigo-700 font-mono break-all sm:break-words">{viewVendor.gstin || "—"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">PAN NO</p>
                    <p className="text-sm font-bold text-indigo-700 font-mono break-all sm:break-words">{viewVendor.pan || "—"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Aadhar NO</p>
                    <p className="text-sm font-semibold text-slate-700 font-mono break-words">{viewVendor.aadharNo || "—"}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">MSME NO</p>
                    <p className="text-sm font-semibold text-slate-700 break-words">{viewVendor.msmeNumber || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-50">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <span className="text-emerald-500 font-serif font-bold text-sm">₹</span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-700">Bank Details</h3>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="col-span-2 bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Bank Name</p>
                    <p className="text-sm font-semibold text-slate-700 break-words">{viewVendor.bankName || "—"}</p>
                  </div>
                  <div className="col-span-2 bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account Holder</p>
                    <p className="text-sm font-semibold text-slate-700 break-words">{viewVendor.accountHolder || "—"}</p>
                  </div>
                  <div className="col-span-2 bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Account No</p>
                    <p className="text-sm font-bold text-emerald-700 font-mono break-all sm:break-words">{viewVendor.accountNumber || "—"}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1 bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">IFSC Code</p>
                    <p className="text-sm font-bold text-emerald-700 font-mono break-all sm:break-words">{viewVendor.ifscCode || "—"}</p>
                  </div>
                  <div className="col-span-2 sm:col-span-1 bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Branch</p>
                    <p className="text-sm font-semibold text-slate-700 break-words">{viewVendor.bankBranch || "—"}</p>
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-50">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                      <FileText size={16} className="text-orange-500" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-700">Documents Attached</h3>
                  </div>
                  
                  {/* Download All Button */}
                  <button onClick={() => {
                    const docs = [
                      { label: "Aadhar", url: viewVendor.docAadhaarUrl },
                      { label: "PAN Card", url: viewVendor.docPanUrl },
                      { label: "GST Certificate", url: viewVendor.docGstUrl },
                      { label: "MSME", url: viewVendor.docMsmeUrl },
                      { label: "Cancel Cheque", url: viewVendor.docCancelChequeUrl },
                      { label: "COI", url: viewVendor.docCoiUrl },
                      { label: "Other Doc 1", url: viewVendor.docOtherUrl },
                      { label: "Other Doc 2", url: viewVendor.docOther2Url },
                    ].filter(d => d.url);
                    if (docs.length > 0) {
                      docs.forEach((doc, idx) => {
                        setTimeout(() => forceDownload(doc.url, doc.label), idx * 800);
                      });
                    }
                  }} className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-100 text-slate-600 rounded-lg text-xs font-bold transition-all">
                    <Download size={13} className="text-indigo-500" /> Download All
                  </button>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Aadhar", url: viewVendor.docAadhaarUrl },
                    { label: "PAN Card", url: viewVendor.docPanUrl },
                    { label: "GST Certificate", url: viewVendor.docGstUrl },
                    { label: "MSME", url: viewVendor.docMsmeUrl },
                    { label: "Cancel Cheque", url: viewVendor.docCancelChequeUrl },
                    { label: "COI", url: viewVendor.docCoiUrl },
                    { label: "Other Doc 1", url: viewVendor.docOtherUrl },
                    { label: "Other Doc 2", url: viewVendor.docOther2Url },
                  ].map((doc, idx) => doc.url ? (
                    <div key={idx} onClick={() => window.open(doc.url, "_blank")}
                       className="flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer group">
                       
                       <div className="h-28 w-full bg-slate-50 border-b border-slate-100 relative overflow-hidden pointer-events-none">
                         {doc.url.match(/\.(jpeg|jpg|png|gif|webp)$/i) ? (
                           <img src={doc.url} alt="" className="w-full h-full object-cover" />
                         ) : (
                           <div className="absolute inset-0 right-[-30px] bottom-[-30px]">
                             <iframe src={`${doc.url}#toolbar=0&navpanes=0&scrollbar=0&view=Fit`} 
                               scrolling="no" 
                               className="w-[150%] h-[150%] scale-[0.66] origin-top-left border-none pointer-events-none" />
                           </div>
                         )}
                         <div className="absolute inset-0 bg-transparent group-hover:bg-indigo-50/10 z-10 transition-colors" />
                       </div>

                       <div className="flex items-center justify-between p-2.5 bg-white">
                         <div className="flex items-center gap-2 pr-2 min-w-0">
                           <FileText size={14} className="text-indigo-500 shrink-0" />
                           <span className="text-[11px] font-bold text-slate-700 truncate">{doc.label}</span>
                         </div>
                         <button onClick={(e) => { e.stopPropagation(); forceDownload(doc.url, doc.label); }} 
                           className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors shrink-0" title="Download Document">
                           <Download size={14} />
                         </button>
                       </div>
                    </div>
                  ) : null)}
                  
                  {![viewVendor.docAadhaarUrl, viewVendor.docPanUrl, viewVendor.docGstUrl, viewVendor.docMsmeUrl, viewVendor.docCancelChequeUrl, viewVendor.docCoiUrl, viewVendor.docOtherUrl, viewVendor.docOther2Url].some(u => !!u) && (
                    <p className="text-sm text-slate-400 italic col-span-2">No documents uploaded.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
