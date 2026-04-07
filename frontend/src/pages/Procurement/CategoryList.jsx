import React, { useState, useEffect, useRef } from "react";
import { Plus, Search, Pencil, Trash2, X, Tag, Upload, Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
const PER_PAGE = 10;
const emptyForm = { categoryName: "", description: "", status: "Active" };

const Field = ({ label, value, onChange, placeholder, textarea }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
    {textarea ? (
      <textarea value={value} onChange={onChange} placeholder={placeholder} rows={3}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700 resize-none" />
    ) : (
      <input value={value} onChange={onChange} placeholder={placeholder}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700" />
    )}
  </div>
);

export default function CategoryList() {
  const [categories, setCategories]     = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showModal, setShowModal]       = useState(false);
  const [form, setForm]                 = useState(emptyForm);
  const [editId, setEditId]             = useState(null);
  const [search, setSearch]             = useState("");
  const [saving, setSaving]             = useState(false);
  const [toast, setToast]               = useState(null);
  const [page, setPage]                 = useState(1);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showBulkMenu, setShowBulkMenu]     = useState(false);
  const [bulking, setBulking]               = useState(false);
  const exportMenuRef = useRef();
  const bulkMenuRef   = useRef();
  const csvRef        = useRef();

  useEffect(() => { fetchCategories(); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target)) setShowExportMenu(false);
      if (bulkMenuRef.current  && !bulkMenuRef.current.contains(e.target))   setShowBulkMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/procurement/categories`);
      const data = await res.json();
      setCategories(data.categories || []);
    } catch { setCategories([]); }
    setLoading(false);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd  = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };
  const openEdit = (c) => { setForm({ categoryName: c.categoryName, description: c.description, status: c.status, categoryCode: c.categoryCode }); setEditId(c.id); setShowModal(true); };

  const handleSave = async () => {
    if (!form.categoryName.trim()) return showToast("Category Name required", "error");
    setSaving(true);
    try {
      const url    = editId ? `${API}/api/procurement/categories/${editId}` : `${API}/api/procurement/categories`;
      const method = editId ? "PUT" : "POST";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      showToast(editId ? "Category updated" : "Category added");
      setShowModal(false);
      fetchCategories();
    } catch { showToast("Failed to save", "error"); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category?")) return;
    try {
      await fetch(`${API}/api/procurement/categories/${id}`, { method: "DELETE" });
      showToast("Category deleted");
      fetchCategories();
    } catch { showToast("Failed to delete", "error"); }
  };

  /* ── Export Excel ── */
  const exportExcel = () => {
    const data = filtered.map((c, i) => ({
      "S.No": i + 1,
      "Category Code": c.categoryCode,
      "Category Name": c.categoryName,
      "Description": c.description,
      "Status": c.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = [{ wch: 6 }, { wch: 14 }, { wch: 22 }, { wch: 50 }, { wch: 10 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Categories");
    XLSX.writeFile(wb, "category_list.xlsx");
    setShowExportMenu(false);
  };

  /* ── Export PDF ── */
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(30, 41, 59);
    doc.text("Category Master — Procurement Setup", 14, 16);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(100, 116, 139);
    doc.text(`Total: ${filtered.length} categories   |   Exported: ${new Date().toLocaleDateString("en-IN")}`, 14, 23);
    doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.4);
    doc.line(14, 26, pageW - 14, 26);
    autoTable(doc, {
      startY: 30,
      head: [["#", "Category Code", "Category Name", "Description", "Status"]],
      body: filtered.map((c, i) => [i + 1, c.categoryCode, c.categoryName, c.description, c.status]),
      styles: { fontSize: 8.5, cellPadding: 4, lineColor: [203, 213, 225], lineWidth: 0.3, textColor: [51, 65, 85] },
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: 30 },
        2: { cellWidth: 40 },
        3: { cellWidth: 130 },
        4: { cellWidth: 22, halign: "center" },
      },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(7); doc.setTextColor(148, 163, 184);
        doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageW - 14, doc.internal.pageSize.getHeight() - 8, { align: "right" });
        doc.text("Bootes BMS — Category Master", 14, doc.internal.pageSize.getHeight() - 8);
      },
    });
    doc.save("category_list.pdf");
    setShowExportMenu(false);
  };

  /* ── Download CSV Template ── */
  const downloadTemplate = () => {
    const csv = [
      "Category Code,Category Name,Description,Status",
      '"CAT-001","Civil","Foundation, structure, concrete, masonry, plastering, flooring, roads","Active"',
      '"CAT-002","Structural Steel","Steel fabrication, structural members, trusses, purlins","Active"',
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = "category_template.csv"; a.click();
    setShowBulkMenu(false);
  };

  /* ── Bulk CSV Upload ── */
  const handleBulkCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBulking(true); setShowBulkMenu(false);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const lines = ev.target.result.trim().split("\n").slice(1);
        const rows = lines
          .filter(l => l.trim())
          .map(l => {
            const cols = l.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
            const clean = cols.map(c => c.replace(/^"|"$/g, "").trim());
            return {
              categoryCode: clean[0] || "",
              categoryName: clean[1] || "",
              description:  clean[2] || "",
              status:       clean[3] || "Active",
            };
          })
          .filter(r => r.categoryName);
        if (!rows.length) { showToast("No valid rows found", "error"); setBulking(false); return; }
        const res = await fetch(`${API}/api/procurement/categories/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows }),
        });
        const result = await res.json();
        const added   = result.count   || 0;
        const skipped = result.skipped || 0;
        if (added === 0) showToast(`All ${skipped} rows already exist — nothing added`, "error");
        else if (skipped > 0) showToast(`${added} added, ${skipped} duplicate${skipped !== 1 ? "s" : ""} skipped`);
        else showToast(`${added} categor${added !== 1 ? "ies" : "y"} added`);
        fetchCategories();
      } catch { showToast("Bulk upload failed", "error"); }
      setBulking(false);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const filtered = categories.filter(c =>
    c.categoryName?.toLowerCase().includes(search.toLowerCase()) ||
    c.categoryCode?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="p-6 w-full">

      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg
          ${toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
            <Tag size={20} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Category Master</h1>
            <p className="text-sm text-slate-400">Procurement Setup — item categories for Item List</p>
          </div>
        </div>

        <div className="flex items-center gap-2">

          {/* Export dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button onClick={() => setShowExportMenu(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
              <Download size={15} /> Export <ChevronDown size={13} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-slate-100 z-30 overflow-hidden">
                <button onClick={exportExcel}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-emerald-700 hover:bg-emerald-50 transition-colors text-left">
                  <FileSpreadsheet size={14} /> Excel (.xlsx)
                </button>
                <div className="border-t border-slate-100" />
                <button onClick={exportPDF}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors text-left">
                  <FileText size={14} /> PDF
                </button>
              </div>
            )}
          </div>

          {/* Bulk Upload dropdown */}
          <div className="relative" ref={bulkMenuRef}>
            <button onClick={() => setShowBulkMenu(v => !v)} disabled={bulking}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all disabled:opacity-50">
              <Upload size={15} /> {bulking ? "Uploading…" : "Bulk Upload"} <ChevronDown size={13} />
            </button>
            {showBulkMenu && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white rounded-xl shadow-xl border border-slate-100 z-30 overflow-hidden">
                <button onClick={downloadTemplate}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left">
                  <Download size={14} className="text-slate-400" /> Download Template
                </button>
                <div className="border-t border-slate-100" />
                <button onClick={() => { setShowBulkMenu(false); csvRef.current.click(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors text-left">
                  <Upload size={14} className="text-slate-400" /> Upload CSV
                </button>
              </div>
            )}
          </div>
          <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleBulkCSV} />

          {/* Add Category */}
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-all">
            <Plus size={15} /> Add Category
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name, code or description…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-400 bg-white text-slate-700" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 flex items-center justify-center">
          <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">No categories found</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm border-collapse table-fixed">
            <colgroup>
              <col style={{width:56}} />
              <col style={{width:120}} />
              <col style={{width:200}} />
              <col />
              <col style={{width:100}} />
              <col style={{width:80}} />
            </colgroup>
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wide border-r border-slate-700">S.No</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide border-r border-slate-700">Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide border-r border-slate-700">Category Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide border-r border-slate-700">Description</th>
                <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wide border-r border-slate-700">Status</th>
                <th className="text-center px-3 py-3 text-xs font-semibold uppercase tracking-wide">Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((c, idx) => (
                <tr key={c.id} className={`transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-teal-50/40`}>
                  <td className="px-3 py-3 text-slate-400 text-xs text-center border border-slate-200 font-medium">{(page - 1) * PER_PAGE + idx + 1}</td>
                  <td className="px-4 py-3 border border-slate-200">
                    <span className="inline-block px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-mono font-semibold">{c.categoryCode}</span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-800 text-sm border border-slate-200 wrap-break-word">{c.categoryName}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs border border-slate-200 leading-relaxed wrap-break-word whitespace-normal">{c.description}</td>
                  <td className="px-3 py-3 border border-slate-200 text-center">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold
                      ${c.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-3 py-3 border border-slate-200">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">{filtered.length} categor{filtered.length !== 1 ? "ies" : "y"} · Page {page} of {totalPages}</p>
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                    className="px-2 py-1 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all">‹</button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let n;
                    if (totalPages <= 5) n = i + 1;
                    else if (page <= 3) n = i + 1;
                    else if (page >= totalPages - 2) n = totalPages - 4 + i;
                    else n = page - 2 + i;
                    return (
                      <button key={n} onClick={() => setPage(n)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${page === n ? "bg-slate-900 text-white border-slate-900" : "text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                        {n}
                      </button>
                    );
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                    className="px-2 py-1 rounded-lg text-xs font-medium text-slate-600 border border-slate-200 hover:bg-slate-50 disabled:opacity-30 transition-all">›</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">{editId ? "Edit Category" : "Add Category"}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              {editId && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Category Code</label>
                  <div className="w-full border border-slate-100 rounded-xl px-3 py-2.5 text-sm text-teal-700 font-mono font-semibold bg-slate-50">
                    {form.categoryCode}
                  </div>
                </div>
              )}
              {!editId && (
                <div className="flex items-center gap-2 px-3 py-2.5 bg-teal-50 border border-teal-100 rounded-xl text-xs text-teal-700 font-medium">
                  <Tag size={13} /> Code will be auto-generated (CAT-001, CAT-002…)
                </div>
              )}
              <div className="flex items-end gap-4">
                <div className="flex-1">
                  <Field label="Category Name *" value={form.categoryName}
                    onChange={e => setForm(f => ({ ...f, categoryName: e.target.value }))}
                    placeholder="e.g. Civil" />
                </div>
                <div style={{width:130}}>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700 bg-white">
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </div>
              <Field label="Description" value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="e.g. Foundation, structure, concrete, masonry…"
                textarea />
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700 transition-all disabled:opacity-50">
                {saving ? "Saving…" : editId ? "Update" : "Add Category"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
