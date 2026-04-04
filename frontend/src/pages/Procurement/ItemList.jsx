import React, { useState, useEffect, useRef } from "react";
import { Plus, Upload, Search, Pencil, Trash2, X, Package, ChevronDown, Image as ImageIcon } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const PER_PAGE = 10;

const CATEGORIES = ["Civil", "Electrical", "Plumbing", "HVAC", "Finishing", "Structural", "Safety", "Tools", "Other"];

const emptyForm = { materialName: "", make: "", description: "", category: "", unit: "", qty: "", image: null, imagePreview: "" };

export default function ItemList() {
  const [items, setItems]       = useState([]);
  const [uoms, setUoms]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [editId, setEditId]     = useState(null);
  const [search, setSearch]     = useState("");
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [page, setPage]         = useState(1);
  const fileRef                 = useRef();
  const csvRef                  = useRef();

  useEffect(() => { fetchItems(); fetchUoms(); }, []);

  const fetchUoms = async () => {
    try {
      const res  = await fetch(`${API}/api/procurement/uom`);
      const data = await res.json();
      setUoms(data.uoms || []);
    } catch { setUoms([]); }
  };

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/procurement/items`);
      const data = await res.json();
      setItems(data.items || []);
    } catch { setItems([]); }
    setLoading(false);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd = () => { setForm(emptyForm); setEditId(null); setShowModal(true); };

  const openEdit = (item) => {
    setForm({ ...item, image: null, imagePreview: item.imageUrl || "" });
    setEditId(item.id);
    setShowModal(true);
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setForm(f => ({ ...f, image: file, imagePreview: URL.createObjectURL(file) }));
  };

  const handleSave = async () => {
    if (!form.materialName.trim()) return showToast("Material Name required", "error");
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (k !== "image" && k !== "imagePreview" && v) fd.append(k, v); });
      if (form.image) fd.append("image", form.image);

      const url    = editId ? `${API}/api/procurement/items/${editId}` : `${API}/api/procurement/items`;
      const method = editId ? "PUT" : "POST";
      await fetch(url, { method, body: fd });
      showToast(editId ? "Item updated" : "Item added");
      setShowModal(false);
      fetchItems();
    } catch { showToast("Failed to save", "error"); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this item?")) return;
    try {
      await fetch(`${API}/api/procurement/items/${id}`, { method: "DELETE" });
      showToast("Item deleted");
      fetchItems();
    } catch { showToast("Failed to delete", "error"); }
  };

  const handleBulkCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const lines = ev.target.result.trim().split("\n").slice(1);
      const rows  = lines.map(l => { const c = l.split(","); return { materialName: c[0], make: c[1], description: c[2], category: c[3], unit: c[4], qty: c[5] }; });
      try {
        await fetch(`${API}/api/procurement/items/bulk`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }) });
        showToast(`${rows.length} items added`);
        fetchItems();
      } catch { showToast("Bulk upload failed", "error"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const filtered = items.filter(i => i.materialName?.toLowerCase().includes(search.toLowerCase()) || i.category?.toLowerCase().includes(search.toLowerCase()));
  const totalPages = Math.ceil(filtered.length / PER_PAGE) || 1;
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  return (
    <div className="p-6 w-full">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl text-sm font-medium shadow-lg transition-all
          ${toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Package size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Item List</h1>
            <p className="text-sm text-slate-400">Global master — used across all POs</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => csvRef.current.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-all">
            <Upload size={15} /> Bulk Upload
          </button>
          <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleBulkCSV} />
          <button onClick={openAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-all">
            <Plus size={15} /> Add Item
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search by name or category…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-400 bg-white text-slate-700" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">#</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Image</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Material Name</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Make</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Category</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Unit</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Qty</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-16 text-slate-400 text-sm">Loading…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-16 text-slate-300 font-semibold uppercase tracking-widest text-xs">No items found</td></tr>
            ) : paginated.map((item, idx) => (
              <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm text-slate-400">{(page - 1) * PER_PAGE + idx + 1}</td>
                <td className="px-4 py-3">
                  {item.imageUrl
                    ? <img src={item.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-100" />
                    : <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center"><ImageIcon size={14} className="text-slate-400" /></div>
                  }
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-slate-700">{item.materialName}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{item.make || "—"}</td>
                <td className="px-4 py-3">
                  {item.category && <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">{item.category}</span>}
                </td>
                <td className="px-4 py-3 text-sm text-slate-500">{item.unit || "—"}</td>
                <td className="px-4 py-3 text-sm text-slate-500">{item.qty || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"><Pencil size={14} /></button>
                    <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">{filtered.length} item{filtered.length !== 1 ? "s" : ""} · Page {page} of {totalPages}</p>
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

      {/* CSV hint */}
      <p className="mt-3 text-xs text-slate-400">Bulk CSV format: <span className="font-mono">Material Name, Make, Description, Category, Unit, Qty</span></p>

      {/* ── MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">{editId ? "Edit Item" : "Add Item"}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
            </div>

            <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">

              {/* Image upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Material Image</label>
                <div onClick={() => fileRef.current.click()}
                  className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl p-5 cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all">
                  {form.imagePreview
                    ? <img src={form.imagePreview} alt="" className="h-24 object-contain rounded-lg" />
                    : <><ImageIcon size={28} className="text-slate-300" /><p className="text-xs text-slate-400">Click to upload image</p></>
                  }
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Material Name <span className="text-red-400">*</span></label>
                  <input value={form.materialName} onChange={e => setForm(f => ({ ...f, materialName: e.target.value }))}
                    placeholder="e.g. Cement OPC 53 Grade"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Make / Brand</label>
                  <input value={form.make} onChange={e => setForm(f => ({ ...f, make: e.target.value }))}
                    placeholder="e.g. Ultratech"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Category</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-600 bg-white">
                    <option value="">Select…</option>
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Unit</label>
                  <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-600 bg-white">
                    <option value="">Select…</option>
                    {uoms.map(u => <option key={u.uomCode || u.uomName} value={u.uomCode}>{u.uomName} ({u.uomCode})</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Qty</label>
                  <input type="number" value={form.qty} onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
                    placeholder="0"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700" />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3} placeholder="Optional description…"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700 resize-none" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700 transition-all disabled:opacity-50">
                {saving ? "Saving…" : editId ? "Update Item" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
