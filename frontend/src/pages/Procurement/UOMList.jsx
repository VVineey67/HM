import React, { useState, useEffect } from "react";
import { Plus, Search, Pencil, Trash2, X, Ruler } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const emptyForm = { uomName: "", uomCode: "" };

const Field = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</label>
    <input value={value} onChange={onChange} placeholder={placeholder}
      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700" />
  </div>
);

export default function UOMList() {
  const [uoms, setUoms]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(emptyForm);
  const [editIdx, setEditIdx]     = useState(null);
  const [search, setSearch]       = useState("");
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState(null);

  useEffect(() => { fetchUoms(); }, []);

  const fetchUoms = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/procurement/uom`);
      const data = await res.json();
      setUoms(data.uoms || []);
    } catch { setUoms([]); }
    setLoading(false);
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd  = () => { setForm(emptyForm); setEditIdx(null); setShowModal(true); };
  const openEdit = (u, idx) => { setForm({ ...u }); setEditIdx(idx); setShowModal(true); };

  const handleSave = async () => {
    if (!form.uomName.trim()) return showToast("UOM Name required", "error");
    setSaving(true);
    try {
      const url    = editIdx !== null ? `${API}/api/procurement/uom/${editIdx}` : `${API}/api/procurement/uom`;
      const method = editIdx !== null ? "PUT" : "POST";
      await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      showToast(editIdx !== null ? "UOM updated" : "UOM added");
      setShowModal(false);
      fetchUoms();
    } catch { showToast("Failed to save", "error"); }
    setSaving(false);
  };

  const handleDelete = async (idx) => {
    if (!confirm("Delete this UOM?")) return;
    try {
      await fetch(`${API}/api/procurement/uom/${idx}`, { method: "DELETE" });
      showToast("UOM deleted");
      fetchUoms();
    } catch { showToast("Failed to delete", "error"); }
  };

  const filtered = uoms.filter(u =>
    u.uomName?.toLowerCase().includes(search.toLowerCase()) ||
    u.uomCode?.toLowerCase().includes(search.toLowerCase())
  );

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
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Ruler size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">UOM List</h1>
            <p className="text-sm text-slate-400">Units of Measurement — used in Item List</p>
          </div>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-all">
          <Plus size={15} /> Add UOM
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or code…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-400 bg-white text-slate-700" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 flex items-center justify-center">
          <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">No UOMs found</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 shadow-sm overflow-hidden inline-block min-w-[480px]">
          <table className="text-sm border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white">
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide border-r border-slate-700" style={{width:60}}>S.No</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide border-r border-slate-700" style={{width:220}}>UOM Name</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide border-r border-slate-700" style={{width:140}}>UOM Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide" style={{width:80}}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, idx) => (
                <tr key={idx} className={`transition-colors ${idx % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-blue-50/50`}>
                  <td className="px-4 py-3 text-slate-400 text-xs border border-slate-200">{idx + 1}</td>
                  <td className="px-4 py-3 font-semibold text-slate-800 text-sm border border-slate-200">{u.uomName}</td>
                  <td className="px-4 py-3 border border-slate-200">
                    <span className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-mono font-semibold">{u.uomCode}</span>
                  </td>
                  <td className="px-4 py-3 border border-slate-200">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u, idx)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(idx)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
            <p className="text-xs text-slate-400">{filtered.length} unit{filtered.length !== 1 ? "s" : ""}</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">{editIdx !== null ? "Edit UOM" : "Add UOM"}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <Field label="UOM Name *" value={form.uomName} onChange={e => setForm(f => ({ ...f, uomName: e.target.value }))} placeholder="e.g. Kilogram" />
              <Field label="UOM Code" value={form.uomCode} onChange={e => setForm(f => ({ ...f, uomCode: e.target.value.toLowerCase() }))} placeholder="e.g. kg" />
            </div>
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 transition-all">Cancel</button>
              <button onClick={handleSave} disabled={saving}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700 transition-all disabled:opacity-50">
                {saving ? "Saving…" : editIdx !== null ? "Update" : "Add UOM"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
