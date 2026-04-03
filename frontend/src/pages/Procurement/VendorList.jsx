import React, { useState, useEffect, useRef } from "react";
import { Plus, Search, Pencil, Trash2, X, Building2, Upload, FileText, Phone, Mail, CreditCard, BadgeCheck } from "lucide-react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

const emptyForm = {
  vendorName: "", address: "",
  bankName: "", accountNumber: "", ifscCode: "",
  gstin: "", msmeNumber: "", pan: "",
  contactPerson: "", mobile: "", email: "",
  logo: null, logoPreview: "",
  docGst: null, docPan: null, docAadhaar: null, docCoi: null, docMsme: null, docOther: null,
};

const DocUpload = ({ label, fieldKey, form, setForm }) => {
  const ref = useRef();
  const file = form[fieldKey];
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">{label}</p>
      <div onClick={() => ref.current.click()}
        className="flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl px-4 py-3 cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-all">
        <FileText size={16} className={file ? "text-blue-500" : "text-slate-300"} />
        <span className={`text-xs truncate ${file ? "text-blue-600 font-medium" : "text-slate-400"}`}>
          {file ? file.name : "Click to upload"}
        </span>
        {file && <button type="button" onClick={e => { e.stopPropagation(); setForm(f => ({ ...f, [fieldKey]: null })); }}
          className="ml-auto text-slate-400 hover:text-red-400"><X size={13} /></button>}
      </div>
      <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
        onChange={e => { const f = e.target.files[0]; if (f) setForm(prev => ({ ...prev, [fieldKey]: f })); e.target.value = ""; }} />
    </div>
  );
};

export default function VendorList() {
  const [vendors, setVendors]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(emptyForm);
  const [editIdx, setEditIdx]   = useState(null);
  const [search, setSearch]     = useState("");
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [tab, setTab]           = useState("basic"); // basic | bank | docs
  const logoRef                 = useRef();

  useEffect(() => { fetchVendors(); }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/procurement/vendors`);
      const data = await res.json();
      setVendors(data.vendors || []);
    } catch { setVendors([]); }
    setLoading(false);
  };

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  const openAdd = () => { setForm(emptyForm); setEditIdx(null); setTab("basic"); setShowModal(true); };

  const openEdit = (v, idx) => {
    setForm({ ...emptyForm, ...v, logo: null, logoPreview: v.logoUrl || "" });
    setEditIdx(idx); setTab("basic"); setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.vendorName.trim()) return showToast("Vendor Name required", "error");
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === "logoPreview") return;
        if (v instanceof File) fd.append(k, v);
        else if (v) fd.append(k, v);
      });
      const url    = editIdx !== null ? `${API}/api/procurement/vendors/${editIdx}` : `${API}/api/procurement/vendors`;
      const method = editIdx !== null ? "PUT" : "POST";
      await fetch(url, { method, body: fd });
      showToast(editIdx !== null ? "Vendor updated" : "Vendor added");
      setShowModal(false); fetchVendors();
    } catch { showToast("Failed to save", "error"); }
    setSaving(false);
  };

  const handleDelete = async (idx) => {
    if (!confirm("Delete this vendor?")) return;
    try {
      await fetch(`${API}/api/procurement/vendors/${idx}`, { method: "DELETE" });
      showToast("Vendor deleted"); fetchVendors();
    } catch { showToast("Failed to delete", "error"); }
  };

  const filtered = vendors.filter(v => v.vendorName?.toLowerCase().includes(search.toLowerCase()) || v.gstin?.toLowerCase().includes(search.toLowerCase()));

  const TABS = [
    { key: "basic", label: "Basic Info"   },
    { key: "bank",  label: "Bank Details" },
    { key: "docs",  label: "Documents"    },
  ];

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
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
            <Building2 size={20} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Vendor List</h1>
            <p className="text-sm text-slate-400">Global master — registered vendors for PO</p>
          </div>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm font-medium hover:bg-slate-700 transition-all">
          <Plus size={15} /> Add Vendor
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or GSTIN…"
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-400 bg-white text-slate-700" />
      </div>

      {/* Cards */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 flex items-center justify-center">
          <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">No vendors found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((v, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {v.logoUrl
                    ? <img src={v.logoUrl} alt="" className="w-12 h-12 rounded-xl object-contain border border-slate-100 bg-slate-50 p-1" />
                    : <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Building2 size={20} className="text-purple-400" />
                      </div>
                  }
                  <div className="min-w-0">
                    <p className="font-bold text-slate-800 text-sm leading-tight truncate">{v.vendorName}</p>
                    {v.gstin && <p className="text-[11px] text-slate-400 font-mono mt-0.5">{v.gstin}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => openEdit(v, idx)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"><Pencil size={13} /></button>
                  <button onClick={() => handleDelete(idx)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={13} /></button>
                </div>
              </div>

              <div className="space-y-1.5">
                {v.mobile && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Phone size={12} className="text-slate-400 shrink-0" />
                    <span>{v.mobile}</span>
                  </div>
                )}
                {v.email && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 truncate">
                    <Mail size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{v.email}</span>
                  </div>
                )}
                {v.pan && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <BadgeCheck size={12} className="text-slate-400 shrink-0" />
                    <span className="font-mono">PAN: {v.pan}</span>
                  </div>
                )}
                {v.bankName && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <CreditCard size={12} className="text-slate-400 shrink-0" />
                    <span className="truncate">{v.bankName} — {v.accountNumber}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
              <h2 className="text-base font-bold text-slate-800">{editIdx !== null ? "Edit Vendor" : "Add Vendor"}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 px-6 shrink-0">
              {TABS.map(t => (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-all border-b-2 -mb-px
                    ${tab === t.key ? "border-slate-900 text-slate-900" : "border-transparent text-slate-400 hover:text-slate-600"}`}>
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
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Vendor Logo</label>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center bg-slate-50 overflow-hidden shrink-0">
                        {form.logoPreview
                          ? <img src={form.logoPreview} alt="" className="w-full h-full object-contain p-1" />
                          : <Building2 size={22} className="text-slate-300" />}
                      </div>
                      <button type="button" onClick={() => logoRef.current.click()}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-all">
                        <Upload size={13} /> Upload Logo
                      </button>
                      <input ref={logoRef} type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files[0]; if (f) setForm(prev => ({ ...prev, logo: f, logoPreview: URL.createObjectURL(f) })); }} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Vendor Name <span className="text-red-400">*</span></label>
                    <input value={form.vendorName} onChange={e => setForm(f => ({ ...f, vendorName: e.target.value }))}
                      placeholder="e.g. Ojo Technologies Pvt Ltd"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700" />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Address</label>
                    <textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      rows={2} placeholder="Full address"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700 resize-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Contact Person</label>
                      <input value={form.contactPerson} onChange={e => setForm(f => ({ ...f, contactPerson: e.target.value }))}
                        placeholder="Name"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Mobile</label>
                      <input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
                        placeholder="10-digit number"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Email</label>
                      <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        placeholder="vendor@email.com"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">GSTIN</label>
                      <input value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))}
                        placeholder="15-digit GST No."
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700 font-mono" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">PAN</label>
                      <input value={form.pan} onChange={e => setForm(f => ({ ...f, pan: e.target.value.toUpperCase() }))}
                        placeholder="10-char PAN"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700 font-mono" />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">MSME Number</label>
                      <input value={form.msmeNumber} onChange={e => setForm(f => ({ ...f, msmeNumber: e.target.value }))}
                        placeholder="MSME Reg. No. (if any)"
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700" />
                    </div>
                  </div>
                </div>
              )}

              {/* BANK TAB */}
              {tab === "bank" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Bank Name</label>
                    <input value={form.bankName} onChange={e => setForm(f => ({ ...f, bankName: e.target.value }))}
                      placeholder="e.g. HDFC Bank"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Account Number</label>
                    <input value={form.accountNumber} onChange={e => setForm(f => ({ ...f, accountNumber: e.target.value }))}
                      placeholder="Account number"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700 font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">IFSC Code</label>
                    <input value={form.ifscCode} onChange={e => setForm(f => ({ ...f, ifscCode: e.target.value.toUpperCase() }))}
                      placeholder="e.g. HDFC0002649"
                      className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700 font-mono" />
                  </div>
                </div>
              )}

              {/* DOCS TAB */}
              {tab === "docs" && (
                <div className="grid grid-cols-2 gap-4">
                  <DocUpload label="GST Document"              fieldKey="docGst"     form={form} setForm={setForm} />
                  <DocUpload label="PAN Document"              fieldKey="docPan"     form={form} setForm={setForm} />
                  <DocUpload label="Aadhaar Document"          fieldKey="docAadhaar" form={form} setForm={setForm} />
                  <DocUpload label="Certificate of Incorporation" fieldKey="docCoi"  form={form} setForm={setForm} />
                  <DocUpload label="MSME Document"             fieldKey="docMsme"    form={form} setForm={setForm} />
                  <DocUpload label="Other Documents"           fieldKey="docOther"   form={form} setForm={setForm} />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50 shrink-0">
              <div className="flex gap-1">
                {TABS.map((t, i) => (
                  <span key={t.key} className={`w-2 h-2 rounded-full transition-all ${tab === t.key ? "bg-slate-800 w-4" : "bg-slate-200"}`} />
                ))}
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-200 transition-all">Cancel</button>
                <button onClick={handleSave} disabled={saving}
                  className="px-5 py-2 rounded-xl text-sm font-semibold bg-slate-900 text-white hover:bg-slate-700 transition-all disabled:opacity-50">
                  {saving ? "Saving…" : editIdx !== null ? "Update" : "Add Vendor"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
