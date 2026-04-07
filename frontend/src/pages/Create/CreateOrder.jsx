import React, { useState, useEffect, useMemo, useRef } from "react";
import { Plus, X, Upload, Save, FileText, ChevronDown, ChevronRight, Check, Building2, MapPin, Truck, Landmark, ShieldCheck, FilePlus, Eye, Loader2 } from "lucide-react";
import { FullSiteModal, FullCompanyModal, FullVendorModal, FullViewSiteModal, FullViewCompanyModal, FullViewVendorModal, FullContactModal, FullViewContactModal } from "./FullMasterModals";

const SCROLLBAR_STYLE = `
  .premium-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
  .premium-scroll::-webkit-scrollbar-track { background: transparent; }
  .premium-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; transition: all 0.2s; }
  .premium-scroll::-webkit-scrollbar-thumb:hover { background: #6366f1; }
  .table-fixed-header th { position: sticky; top: 0; z-index: 10; }
`;

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";

/* ── helper: INR to Words ── */
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

const Input = ({ label, value, onChange, placeholder, type = "text", required, mono, span2, readOnly, className }) => (
  <div className={span2 ? "col-span-2" : ""}>
    {label && <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">{label} {required && <span className="text-red-400 normal-case">*</span>}</label>}
    <input type={type} value={value || ""} onChange={onChange} placeholder={placeholder} readOnly={readOnly}
      className={`w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10 ${readOnly ? "bg-slate-50 text-slate-500 font-medium cursor-not-allowed" : "bg-white text-slate-800 shadow-sm"} ${mono ? "font-mono" : ""} ${className}`} />
  </div>
);

const InlineSelect = ({ value, onChange, options, placeholder, className, disabled }) => {
  const [open, setOpen] = useState(false);
  const [pos, setPos]   = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);

  const openDropdown = () => {
    if (disabled) return;
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      const dropW = Math.max(rect.width, 220);
      const left  = rect.left + dropW > window.innerWidth - 8 ? window.innerWidth - dropW - 8 : rect.left;
      setPos({ top: rect.bottom + 4, left, width: dropW });
    }
    setOpen(true);
  };

  const label = options.find(o => o.id === value || o === value);
  const displayLabel = typeof label === "string" ? label : (label?.materialName || label?.itemCode || label?.name || value || "");

  return (
    <div className="relative w-full" ref={triggerRef}>
      <div onClick={openDropdown}
        className={`w-full min-h-[30px] px-2 py-1.5 rounded-md text-xs cursor-pointer border flex items-center gap-1.5 transition-all
          ${disabled ? "opacity-40 cursor-not-allowed bg-slate-50 border-slate-100" : "bg-white border-slate-200 hover:border-indigo-300"}
          ${open ? "border-indigo-400 ring-1 ring-indigo-200" : ""} ${className}`}>
        <span className={`flex-1 text-xs leading-snug ${!value ? "text-slate-300 italic" : "text-slate-800 font-medium"}`}>
          {displayLabel || placeholder}
        </span>
        <ChevronDown size={10} className={`text-slate-400 shrink-0 transition-transform ${open ? "rotate-180 text-indigo-500" : ""}`} />
      </div>

      {open && (
        <>
          <div className="fixed inset-0 z-[999]" onClick={() => setOpen(false)} />
          <div style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, zIndex: 1000 }}
            className="bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden">
            <div className="px-3 py-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 border-b border-slate-100">{placeholder}</div>
            <div className="overflow-y-auto max-h-48 premium-scroll">
              {options.length === 0
                ? <div className="px-3 py-3 text-center text-xs text-slate-400 italic">No options</div>
                : options.map((opt, i) => {
                    const id  = typeof opt === "string" ? opt : opt.id;
                    const lbl = typeof opt === "string" ? opt : (opt.materialName || opt.itemCode || opt.name || "");
                    const isSel = value === id;
                    return (
                      <div key={i} onClick={(e) => { e.stopPropagation(); onChange({ target: { value: id } }); setOpen(false); }}
                        className={`px-3 py-2 text-xs cursor-pointer flex items-center justify-between hover:bg-indigo-50 transition-colors border-b border-slate-50 last:border-0
                          ${isSel ? "bg-indigo-50 text-indigo-700 font-semibold" : "text-slate-700"}`}>
                        <span className="truncate">{lbl}</span>
                        {isSel && <Check size={11} className="text-indigo-600 shrink-0 ml-2" strokeWidth={3}/>}
                      </div>
                    );
                  })
              }
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const Select = ({ label, value, onChange, options, valueKey = "id", labelKey = "name", subLabelKey, placeholder, required, span2, onAdd, addLabel, onView, isMulti }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const selectedOptions = isMulti 
    ? options.filter(o => (value || []).includes(o[valueKey]))
    : options.filter(o => o[valueKey] === value);

  const filteredOptions = options.filter(o => {
    const text = (o[labelKey] || "").toLowerCase() + " " + (subLabelKey ? (o[subLabelKey] || "").toLowerCase() : "");
    return text.includes(search.toLowerCase());
  });

  const handleToggle = (id) => {
    if (isMulti) {
      const current = Array.isArray(value) ? value : [];
      const next = current.includes(id) ? current.filter(x => x !== id) : [...current, id];
      onChange({ target: { value: next } });
    } else {
      onChange({ target: { value: id } });
      setOpen(false);
      setSearch("");
    }
  };

  return (
    <div className={`relative ${span2 ? "col-span-2" : ""}`} ref={containerRef}>
      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
        {label} {required && <span className="text-red-400 normal-case">*</span>}
      </label>
      <div 
        onClick={() => setOpen(!open)}
        className={`w-full border rounded-xl px-3 py-2 text-sm outline-none transition-all cursor-pointer flex justify-between items-center bg-white min-h-[42px]
          ${open ? "border-indigo-400 ring-2 ring-indigo-50" : "border-slate-200 hover:border-slate-300"}`}
      >
        <div className="flex flex-wrap gap-1.5 py-1 flex-1 min-w-0">
          {selectedOptions.length > 0 ? (
            selectedOptions.map(o => (
              <span key={o[valueKey]} className={`${isMulti ? "bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded-lg text-[10px] font-bold flex items-center gap-1 max-w-full" : "text-slate-700 truncate"}`}>
                <span className="truncate">{o[labelKey]}</span>
                {isMulti && (
                  <X size={10} className="hover:text-red-500 cursor-pointer shrink-0" onClick={(e) => { e.stopPropagation(); handleToggle(o[valueKey]); }} />
                )}
              </span>
            ))
          ) : (
            <span className="text-slate-400 italic">{placeholder || "— Select —"}</span>
          )}
        </div>
        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : "ml-2"}`} />
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl flex flex-col overflow-hidden min-w-[240px]">
          <div className="p-2 border-b border-slate-100 bg-slate-50">
             <input type="text" autoFocus value={search} onChange={e => setSearch(e.target.value)} 
               className="w-full px-2 py-1.5 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-400" 
               placeholder="Search here..." />
          </div>
          <div className="overflow-y-auto max-h-56 w-full p-1 scrollbar-thin">
            {!required && !isMulti && (
              <div onClick={() => { onChange({ target: { value: "" } }); setOpen(false); setSearch(""); }}
                   className={`px-3 py-2 text-sm cursor-pointer rounded-lg hover:bg-slate-50 transition-colors ${!value ? "text-slate-400 font-bold" : "text-slate-400"}`}>
                {placeholder || "— Clear Selection —"}
              </div>
            )}
            {filteredOptions.length > 0 && <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-50 mb-1">{filteredOptions.length} results found</div>}
            {filteredOptions.map(o => {
              const isSelected = isMulti ? (value || []).includes(o[valueKey]) : value === o[valueKey];
              return (
                <div key={o[valueKey]} 
                  className={`flex items-center justify-between px-3 py-2 cursor-pointer rounded-lg hover:bg-indigo-50 transition-colors group ${isSelected ? "bg-indigo-50" : ""}`}>
                  <div className="flex-1 min-w-0" onClick={() => handleToggle(o[valueKey])}>
                    <p className={`text-sm truncate ${isSelected ? "text-indigo-700 font-bold" : "text-slate-700 font-semibold"}`}>{o[labelKey]}</p>
                    {subLabelKey && o[subLabelKey] && <p className="text-[11px] text-slate-500 truncate">{o[subLabelKey]}</p>}
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    {onView && (
                      <button onClick={(e) => { e.stopPropagation(); setOpen(false); onView(o); }} className="p-1 rounded-md text-slate-400 hover:text-indigo-600 hover:bg-indigo-100 transition-colors shrink-0">
                        <Eye size={14} />
                      </button>
                    )}
                    {isMulti && isSelected && <Check size={14} className="text-indigo-600" />}
                  </div>
                </div>
              );
            })}
            {filteredOptions.length === 0 && <div className="px-3 py-4 text-center text-xs text-slate-400">No results found</div>}
          </div>
          {onAdd && (
            <div onClick={() => { setOpen(false); onAdd(); }}
              className="bg-indigo-50/50 hover:bg-indigo-100 text-indigo-600 border-t border-slate-100 font-medium text-sm px-3 py-3 text-center cursor-pointer transition-colors flex items-center justify-center gap-1.5">
              <Plus size={14} /> {addLabel || "Add New"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DocUpload = ({ label, file, onChange, required }) => (
  <div>
    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
      {label} {required && <span className="text-red-400 normal-case">*</span>}
    </label>
    <label className={`w-full flex items-center justify-between border rounded-xl px-3 py-2.5 text-sm cursor-pointer transition-all
      ${file ? "border-green-200 bg-green-50/50" : "border-slate-200 hover:border-indigo-300"}`}>
      <div className="flex items-center gap-2 truncate">
        <FileText size={15} className={file ? "text-green-500" : "text-slate-400"} />
        <span className={`truncate ${file ? "text-green-700 font-medium" : "text-slate-400"}`}>
          {file ? file.name : "Choose file..."}
        </span>
      </div>
      {file && <Check size={14} className="text-green-500 shrink-0" />}
      <input type="file" accept=".pdf,.doc,.docx,.jpg,.png" className="hidden" onChange={onChange} />
    </label>
  </div>
);

const MultiDocUpload = ({ label, files, onAdd, onRemove, max = 6, required }) => (
  <div className="space-y-2">
    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
      {label} {required && <span className="text-red-400 normal-case">*</span>}
      {files.length > 0 && <span className="ml-2 text-indigo-500 lowercase">({files.length}/{max})</span>}
    </label>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {files.map((f, i) => (
        <div key={i} className="flex items-center justify-between bg-white border border-emerald-100 rounded-xl px-3 py-2 shadow-sm animate-in fade-in slide-in-from-left-2 transition-all">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
               <FileText size={14} className="text-emerald-500" />
            </div>
            <span className="text-xs font-medium text-slate-700 truncate">{f.name}</span>
          </div>
          <button onClick={() => onRemove(i)} className="p-1 hover:text-red-500 text-slate-400 transition-colors">
            <X size={14} />
          </button>
        </div>
      ))}
      {files.length < max && (
        <label className="flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 rounded-xl p-2.5 cursor-pointer transition-all text-slate-400 hover:text-indigo-600 group">
          <Plus size={16} className="group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold uppercase tracking-wider">Add Document</span>
          <input type="file" className="hidden" multiple={false} onChange={onAdd} />
        </label>
      )}
    </div>
  </div>
);


function makeSubRow() {
  return { id: Date.now() + Math.random(), specification: "", scopeOfWork: "", modelNumber: "", make: "", qty: 0, unitRate: 0, discountPct: 0, taxPct: 18, grossAmount: 0, discountAmount: 0, baseAmount: 0, gstAmount: 0, totalAmount: 0, remarks: "" };
}
function makeGroup() {
  return { id: Date.now(), itemId: "", unit: "", subRows: [makeSubRow()] };
}

function OrderForm({ project, onCancel }) {
  const user = JSON.parse(localStorage.getItem("bms_user") || "{}");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState(null);
  const [actionModal, setActionModal] = useState({ type: null, data: null });

  // Master Data
  const [sites, setSites]         = useState([]);
  const [companies, setCompanies] = useState([]);
  const [vendors, setVendors]     = useState([]);
  const [contacts, setContacts]   = useState([]);
  const [itemsList, setItemsList] = useState([]);
  const [clauses, setClauses]     = useState([]);

  // Form State - Header
  const [header, setHeader] = useState({
    orderType: "Supply", orderNumber: "", refNumber: "", subject: "", orderName: "",
    siteId: "", companyId: "", vendorId: "", contactPersonIds: [],
    requestBy: "", madeBy: user.name || "", priority: "Medium", deliveryDate: "",
    creationDate: new Date().toISOString().split('T')[0]
  });
  const [nextSerial, setNextSerial] = useState(1);

  // Read-only populated details
  const [siteDetails, setSiteDetails]     = useState(null);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [vendorDetails, setVendorDetails] = useState(null);

  // Form State - Items Table (grouped: each group = one item, multiple spec sub-rows)
  const [items, setItems] = useState([makeGroup()]);
  
  // Settings / Toggles
  const [settings, setSettings] = useState({
    model: false, brand: true, remarks: false,
    discountMode: 'none',
    frightMode: 'none'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [settingsPos, setSettingsPos] = useState({ top: 0, right: 0 });
  const settingsBtnRef = useRef(null);
  const [transactionDiscount, setTransactionDiscount] = useState(0);
  const [frightCharges, setFrightCharges] = useState(0);
  const [frightTax, setFrightTax]           = useState(18);

  // Form State - Clauses
  const [tcPoints, setTcPoints]   = useState([]);
  const [payPoints, setPayPoints] = useState([]);
  const [govPoints, setGovPoints] = useState([]);

  // Documents
  const [files, setFiles] = useState({
    quotations: [],
    proof: { type: "", files: [] },
    others: []
  });

  useEffect(() => { fetchMasterData(); }, []);

  const fetchMasterData = async () => {
    setLoading(true);
    try {
      const [sRes, cRes, vRes, coRes, iRes, clRes] = await Promise.all([
        fetch(`${API}/api/procurement/sites`),
        fetch(`${API}/api/procurement/companies`),
        fetch(`${API}/api/procurement/vendors`),
        fetch(`${API}/api/procurement/contacts`),
        fetch(`${API}/api/procurement/items`),
        fetch(`${API}/api/procurement/clauses`)
      ]);
      const s = await sRes.json(); setSites(s.sites || []);
      const c = await cRes.json(); setCompanies(c.companies || []);
      const v = await vRes.json(); setVendors(v.vendors || []);
      const co = await coRes.json(); setContacts(co.contacts || []);
      const i = await iRes.json(); setItemsList(i.items || []);
      
      const cl = await clRes.json();
      setClauses(cl.clauses || []);
    } catch {
      showToast("Failed to load master data.", "error");
    }
    setLoading(false);
  };

  const showToast = (msg, type = "success") => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  // Dynamic Order Numbering Logic
  const computedOrderNumber = useMemo(() => {
    // If order number already exists and is properly formatted (edit mode or already fetched), use it
    if (header.orderNumber && header.orderNumber.includes('/')) return header.orderNumber;
    
    // During creation: Show Draft Pattern
    if (!header.siteId || !header.companyId || !header.orderType) return "Draft/Comp/Site/Type";
    
    const c = companies.find(x => x.id === header.companyId);
    const s = sites.find(x => x.id === header.siteId);
    const type = header.orderType === "Supply" ? "PO" : "WO";
    
    return `${c?.companyCode || "COMP"} / ${s?.siteCode || "SITE"} / ${type}`;
  }, [header.orderNumber, header.siteId, header.companyId, header.orderType, companies, sites]);


  // Reset items + brand setting when order type changes
  useEffect(() => {
    setItems([makeGroup()]);
    setSettings(s => ({ ...s, brand: header.orderType === "SITC" }));
  }, [header.orderType]);

  // Recalculate all rows when discount mode changes so amounts update instantly
  useEffect(() => {
    setItems(prev => prev.map(g => ({
      ...g,
      subRows: g.subRows.map(s => {
        const q = Number(s.qty) || 0;
        const r = Number(s.unitRate) || 0;
        const d = settings.discountMode === "line" ? (Number(s.discountPct) || 0) : 0;
        const t = Number(s.taxPct) || 0;
        const gross = q * r;
        const discAmt = gross * d / 100;
        const base = gross - discAmt;
        const gst = base * (t / 100);
        return { ...s, grossAmount: gross, discountAmount: discAmt, baseAmount: base, gstAmount: gst, totalAmount: base + gst };
      })
    })));
  }, [settings.discountMode]);

  // Generate Order Number
  useEffect(() => {
    if (!header.siteId || !header.companyId || !header.orderType) {
      setHeader(h => ({ ...h, orderNumber: "" }));
      return;
    }
    const c = companies.find(x => x.id === header.companyId);
    if (!c?.companyCode) return;

    fetch(`${API}/api/orders/next-number?siteId=${header.siteId}&companyCode=${c.companyCode}&orderType=${header.orderType}`)
      .then(r => r.json())
      .then(d => {
        if (d.orderNumber) {
          setHeader(h => ({ ...h, orderNumber: d.orderNumber }));
          setNextSerial(d.nextSerial);
        }
      })
      .catch(console.error);
  }, [header.siteId, header.companyId, header.orderType, companies]);

  // Handle master selection changes
  const handleSiteChange = (e) => {
    const id = e.target.value;
    setHeader(h => ({ ...h, siteId: id }));
    setSiteDetails(sites.find(s => s.id === id) || null);
  };
  const handleCompanyChange = (e) => {
    const id = e.target.value;
    setHeader(h => ({ ...h, companyId: id }));
    setCompanyDetails(companies.find(c => c.id === id) || null);
  };
  const handleVendorChange = (e) => {
    const id = e.target.value;
    setHeader(h => ({ ...h, vendorId: id }));
    setVendorDetails(vendors.find(v => v.id === id) || null);
  };

  // Items handling
  const recalcSubRow = (s) => {
    const q = Number(s.qty) || 0;
    const r = Number(s.unitRate) || 0;
    const d = settings.discountMode === "line" ? (Number(s.discountPct) || 0) : 0;
    const t = Number(s.taxPct) || 0;
    const gross = q * r;
    const discAmt = gross * d / 100;
    const base = gross - discAmt;
    const gst = base * (t / 100);
    return { ...s, grossAmount: gross, discountAmount: discAmt, baseAmount: base, gstAmount: gst, totalAmount: base + gst };
  };

  const addItem = () => setItems(prev => [...prev, makeGroup()]);

  const removeGroup = (gid) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter(g => g.id !== gid));
  };

  const addSubRow = (gid) => {
    setItems(prev => prev.map(g => g.id !== gid ? g : { ...g, subRows: [...g.subRows, makeSubRow()] }));
  };

  const removeSubRow = (gid, sid) => {
    setItems(prev => prev.map(g => {
      if (g.id !== gid) return g;
      if (g.subRows.length === 1) return g;
      return { ...g, subRows: g.subRows.filter(s => s.id !== sid) };
    }));
  };

  const handleGroupChange = (gid, val) => {
    setItems(prev => prev.map(g => {
      if (g.id !== gid) return g;
      const found = itemsList.find(i => i.id === val);
      return {
        ...g, itemId: val, unit: found?.unit || "",
        subRows: g.subRows.map(s => ({
          ...s, specification: "", make: "",
          scopeOfWork: found?.scopeOfWork || ""
        }))
      };
    }));
  };

  const handleSubRowChange = (gid, sid, key, val) => {
    setItems(prev => prev.map(g => {
      if (g.id !== gid) return g;
      return { ...g, subRows: g.subRows.map(s => s.id !== sid ? s : recalcSubRow({ ...s, [key]: val })) };
    }));
  };

  // Totals Calculation
  const totals = useMemo(() => {
    let subtotal = 0;      // always gross (qty × rate), before any discount
    let lineDiscountSum = 0;
    let gstSum = 0;

    const txPct = settings.discountMode === "total" ? (Number(transactionDiscount) || 0) : 0;

    items.forEach(g => g.subRows.forEach(s => {
      const gross = s.grossAmount > 0 ? s.grossAmount : (Number(s.qty) * Number(s.unitRate));
      subtotal += gross;
      lineDiscountSum += s.discountAmount || 0;

      if (settings.discountMode === "total") {
        // GST on post-discount base: each row discounted proportionally
        const discountedBase = gross * (1 - txPct / 100);
        gstSum += discountedBase * ((Number(s.taxPct) || 0) / 100);
      } else {
        // For "line" mode, gstAmount is already computed on post-discount base per row
        gstSum += s.gstAmount;
      }
    }));

    const txDiscountAmt = subtotal * txPct / 100;
    const totalDiscountAmt = settings.discountMode === "line" ? lineDiscountSum : txDiscountAmt;

    let grandTotal = (subtotal - totalDiscountAmt) + gstSum;
    
    // Freight logic
    const fAmt = (Number(frightCharges) || 0);
    const fGst = fAmt * (Number(frightTax) / 100);
    
    if (settings.frightMode === "before") {
       grandTotal += (fAmt + fGst);
    } else if (settings.frightMode === "after") {
       grandTotal += fAmt;
    }
    
    grandTotal = Math.round(grandTotal);
    
    return {
      subtotal,
      lineDiscountSum,
      txDiscountAmt,
      totalDiscountAmt,
      gst: gstSum,
      frightGst: (settings.frightMode === "before") ? fGst : 0,
      grandTotal,
      words: amountToWords(grandTotal)
    };
  }, [items, settings, transactionDiscount, frightCharges, frightTax]);

  // Handle Save
  const handleSave = async (submitStatus) => {
    const finalOrderNumber = header.orderNumber || computedOrderNumber;
    if (!header.siteId || !header.companyId || !header.vendorId || !finalOrderNumber) {
      return showToast("Site, Company, Vendor and Order Type are required.", "error");
    }
    if (files.quotations.length === 0) {
      return showToast("At least 1 Quotation Document is mandatory.", "error");
    }
    if (!files.proof.type) {
      return showToast("Please select the Proof Type (Comparative or Mail).", "error");
    }
    if (files.proof.files.length === 0) {
      return showToast(`At least 1 ${files.proof.type} Document is mandatory.`, "error");
    }
    if (items.some(g => !g.itemId) || items.some(g => g.subRows.some(s => s.qty <= 0))) {
      return showToast("All line items must have an item selected and Qty > 0.", "error");
    }

    setSaving(true);
    try {
      const fd = new FormData();
      // Append Quotations
      files.quotations.forEach(f => fd.append("quotations", f));
      // Append Proof Files
      files.proof.files.forEach(f => fd.append("proofFiles", f));
      // Append Other Docs
      files.others.forEach(f => fd.append("otherDocs", f));

      const payload = {
        mainData: {
            ...header,
            orderNumber: finalOrderNumber,
            status: submitStatus,
            terms_conditions: tcPoints,
            payment_terms: payPoints,
            governing_laws: govPoints,
            totals,
            created_by_id: user.id,
            proofType: files.proof.type
        },
        items: items.flatMap(g => g.subRows.map(({ id, ...s }) => ({ itemId: g.itemId, unit: g.unit, ...s }))),
        nextSerial
      };
      
      fd.append("data", JSON.stringify(payload));
      
      const res = await fetch(`${API}/api/orders`, { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Save failed");

      showToast(`Order saved successfully as ${submitStatus}! Check 'Order Records'.`);
      setTimeout(() => onCancel(), 1500); // Optional redirect
    } catch (err) {
      showToast(err.message, "error");
    }
    setSaving(false);
  };

  /* ── Clause Component ── */
  const renderClauses = (title, type, ptsState, setPtsState) => {
    const list = clauses.filter(c => c.type === type);
    return (
      <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
        <h3 className="text-sm font-bold text-slate-700">{title}</h3>
        <select onChange={e => {
            if(!e.target.value) return;
            const c = list.find(x => x.id === e.target.value);
            if(c) {
              const unique = c.points.filter(p => !ptsState.includes(p));
              setPtsState([...ptsState, ...unique]);
            }
            e.target.value = "";
          }}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white">
          <option value="">— Select from Template —</option>
          {list.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        {ptsState.length > 0 && (
          <div className="space-y-2 mt-2">
            {ptsState.map((pt, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-sm font-bold text-slate-400 w-5 mt-1 shrink-0">{i+1}.</span>
                <textarea rows={2} value={pt} onChange={e => {
                  const arr = [...ptsState];
                  arr[i] = e.target.value;
                  setPtsState(arr);
                }} className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-indigo-400 text-slate-700 resize-none outline-none" />
                <button onClick={() => setPtsState(ptsState.filter((_, idx) => idx !== i))} className="p-2 text-slate-400 hover:text-red-500"><X size={15}/></button>
              </div>
            ))}
          </div>
        )}
        <button onClick={() => setPtsState([...ptsState, ""])} className="text-indigo-600 hover:text-indigo-800 text-xs font-semibold flex items-center gap-1 mt-2 px-2">
          <Plus size={12}/> Add Point Manually
        </button>
      </div>
    );
  };

  if (loading) return <div className="p-6 text-slate-400 text-center py-20">Loading master data...</div>;

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
          <div className="h-12 w-12 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-100">
            <FilePlus size={24} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Create Order</h1>
            <p className="text-sm text-slate-400">Generate Purchase (PO) or Work (WO) Order</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onCancel} className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-all text-sm">Cancel</button>
          <button onClick={() => handleSave("Draft")} disabled={saving || !header.companyId || !header.siteId || !header.vendorId}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-semibold flex items-center gap-2 hover:bg-slate-100 transition-all disabled:opacity-50 text-sm">
            <Save size={16} /> {saving ? "..." : "Save as Draft"}
          </button>
          <button onClick={() => handleSave("Pending Issue")} disabled={saving || !header.companyId || !header.siteId || !header.vendorId}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold flex items-center gap-2 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 text-sm">
            <Check size={16} /> {saving ? "..." : "Submit Order"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* TOP SECTION - Settings & Details */}
        <div className="grid grid-cols-1 gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2">Order Setup</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Select label="Order Type" value={header.orderType} onChange={e => setHeader(h => ({ ...h, orderType: e.target.value }))}
                options={[{id:"Supply",name:"Supply (PO)"}, {id:"SITC",name:"SITC (WO)"}]} required />
              <Input label={header.orderType === "Supply" ? "PO Number" : "WO Number"} value={computedOrderNumber} readOnly mono />
              <Select label="Select Site" value={header.siteId} onChange={handleSiteChange} options={sites} valueKey="id" labelKey="siteName" subLabelKey="siteCode" required 
                onAdd={() => setActionModal({ type: "addSite" })} addLabel="Add New Site" onView={(s) => setActionModal({ type: "viewSite", data: s })} />
              <Select label="Select Company" value={header.companyId} onChange={handleCompanyChange} options={companies} valueKey="id" labelKey="companyName" subLabelKey="companyCode" required 
                onAdd={() => setActionModal({ type: "addCompany" })} addLabel="Add New Company" onView={(c) => setActionModal({ type: "viewCompany", data: c })} />
              <Select label="Select Vendor" value={header.vendorId} onChange={handleVendorChange} options={vendors} valueKey="id" labelKey="vendorName" subLabelKey="address" required 
                onAdd={() => setActionModal({ type: "addVendor" })} addLabel="Add New Vendor" onView={(v) => setActionModal({ type: "viewVendor", data: v })} />
              <Input label="Date of Creation" type="date" value={header.creationDate} onChange={e => setHeader(h => ({ ...h, creationDate: e.target.value }))} required />
              <Input label="Order Made By" value={header.madeBy} readOnly />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-6">
            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
               <div className="w-5 h-5 bg-indigo-50 rounded-md flex items-center justify-center"><FileText size={12} className="text-indigo-600" /></div>
               Order Meta
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="col-span-full">
                <Input label="Subject" value={header.subject} onChange={e => setHeader(h => ({ ...h, subject: e.target.value }))} placeholder="Enter full order subject (e.g. Supply of IT Equipment for Varanasi Site)..." 
                  className="text-lg font-bold" />
              </div>
              <div className="lg:col-span-2">
                 <Input label="Reference No" value={header.refNumber} onChange={e => setHeader(h => ({ ...h, refNumber: e.target.value }))} placeholder="e.g. BOOTES/PRO/2026/001" 
                   className="font-bold text-slate-800" />
              </div>
              <Input label="Date of Delivery" type="date" value={header.deliveryDate} onChange={e => setHeader(h => ({ ...h, deliveryDate: e.target.value }))} />
              <Select label="Priority" value={header.priority} onChange={e => setHeader(h => ({ ...h, priority: e.target.value }))}
                options={[{id:"Low",name:"Low"}, {id:"Medium",name:"Medium"}, {id:"High",name:"High"}, {id:"Urgent",name:"Urgent"}]} />
              <div className="lg:col-span-2">
                <Select label="Contact Person(s)" value={header.contactPersonIds} isMulti
                  onChange={e => setHeader(h => ({ ...h, contactPersonIds: e.target.value }))} 
                  options={contacts} valueKey="id" labelKey="personName" subLabelKey="designation" 
                  onAdd={() => setActionModal({ type: "addContact" })} addLabel="Add New Contact" 
                  onView={(c) => setActionModal({ type: "viewContact", data: c })} />
              </div>
              <div className="lg:col-span-2">
                <Input label="Requested By" value={header.requestBy} onChange={e => setHeader(h => ({ ...h, requestBy: e.target.value }))} placeholder="Name of person requesting order" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-6">
            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
               <div className="w-5 h-5 bg-indigo-50 rounded-md flex items-center justify-center"><FilePlus size={12} className="text-indigo-600" /></div>
               Order Documentation
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* QUOTATIONS */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <MultiDocUpload label="Quotation(s) * (Min 1, Max 6)" files={files.quotations} max={6} required
                  onAdd={e => {
                    const f = e.target.files[0];
                    if(f) setFiles(prev => ({ ...prev, quotations: [...prev.quotations, f] }));
                  }}
                  onRemove={i => setFiles(prev => ({ ...prev, quotations: prev.quotations.filter((_, idx) => idx !== i) }))} />
              </div>

              {/* COMPARATIVE / PROOF */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 uppercase tracking-wider">Proof Type *</label>
                  <select value={files.proof.type} onChange={e => setFiles(prev => ({ ...prev, proof: { ...prev.proof, type: e.target.value } }))}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-400 bg-white">
                    <option value="">— Select Type —</option>
                    <option value="Comparative Docs">Comparative Docs</option>
                    <option value="Mail Proof Doc">Mail Proof Doc</option>
                  </select>
                </div>
                {files.proof.type && (
                  <MultiDocUpload label={`${files.proof.type} *`} files={files.proof.files} max={3} required
                    onAdd={e => {
                      const f = e.target.files[0];
                      if(f) setFiles(prev => ({ ...prev, proof: { ...prev.proof, files: [...prev.proof.files, f] } }));
                    }}
                    onRemove={i => setFiles(prev => ({ ...prev, proof: { ...prev.proof, files: prev.proof.files.filter((_, idx) => idx !== i) } }))} />
                )}
              </div>

              {/* OTHERS */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                <MultiDocUpload label="Other Documents (Max 2)" files={files.others} max={2}
                  onAdd={e => {
                    const f = e.target.files[0];
                    if(f) setFiles(prev => ({ ...prev, others: [...prev.others, f] }));
                  }}
                  onRemove={i => setFiles(prev => ({ ...prev, others: prev.others.filter((_, idx) => idx !== i) }))} />
              </div>
            </div>
          </div>


        </div>

        {/* MIDDLE COLUMN - Table */}
        <div className="w-full space-y-6 min-w-0 flex-1">
          
          {/* ITEMS TABLE */}
          <div className="bg-white rounded-[2rem] border border-slate-200 shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col border-b-0">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
              <h2 className="text-base font-black text-slate-800 flex items-center gap-3">
                 <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                    <ShieldCheck size={20} strokeWidth={2.5} />
                 </div>
                 <div className="flex flex-col">
                    <span className="leading-tight text-sm font-black">Table of Content</span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order Items & Specifications</span>
                 </div>
              </h2>
              <div className="flex items-center gap-6">
                 {/* COLUMN SETTINGS DROPDOWN */}
                 <div className="relative">
                    <button ref={settingsBtnRef} onClick={() => {
                      const rect = settingsBtnRef.current?.getBoundingClientRect();
                      if (rect) setSettingsPos({ top: rect.bottom + 6, right: window.innerWidth - rect.right });
                      setShowSettings(!showSettings);
                    }}
                      className={`flex items-center gap-2 px-5 py-2.5 text-xs font-black rounded-2xl transition-all border ${showSettings ? "bg-indigo-600 border-indigo-600 text-white shadow-2xl -translate-y-1" : "bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600 hover:shadow-xl"}`}>
                       <Plus size={18} strokeWidth={3} /> Add Columns / Settings
                    </button>
                    {showSettings && (
                      <>
                        <div style={{ position: "fixed", top: settingsPos.top, right: settingsPos.right, zIndex: 1000 }}
                          className="w-72 bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-y-auto max-h-[80vh]">
                          {/* Columns */}
                          <div className="p-4 border-b border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Add Columns</p>
                            <div className="space-y-1.5">
                              {[
                                { key: 'model',   label: 'Model Number' },
                                { key: 'remarks', label: 'Remarks' },
                                ...(header.orderType === "SITC" && !settings.brand ? [{ key: 'brand', label: 'Make / Brand' }] : [])
                              ].filter(({ key }) => !settings[key]).map(({ key, label }) => (
                                <button key={key} onClick={() => setSettings(s => ({ ...s, [key]: true }))}
                                  className="flex items-center gap-2.5 px-3 py-2 w-full text-left rounded-lg border border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 hover:border-indigo-400 transition-all group">
                                  <Plus size={13} strokeWidth={3} className="text-indigo-500 shrink-0"/>
                                  <span className="text-xs font-medium text-slate-700">{label}</span>
                                </button>
                              ))}
                              {['model','remarks'].every(k => settings[k]) && !(header.orderType==="SITC" && !settings.brand) && (
                                <p className="text-xs text-slate-400 italic text-center py-1">All columns added</p>
                              )}
                            </div>
                          </div>

                          {/* Discount */}
                          <div className="p-4 border-b border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Discount</p>
                            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                              {[['none','None'],['line','Per Line'],['total','Total']].map(([m,lbl]) => (
                                <button key={m} onClick={() => setSettings(s => ({ ...s, discountMode: m }))}
                                  className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${settings.discountMode===m ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                                  {lbl}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Freight */}
                          <div className="p-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Freight</p>
                            <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
                              {[['none','Off'],['before','+ GST'],['after','No GST']].map(([m,lbl]) => (
                                <button key={m} onClick={() => setSettings(s => ({ ...s, frightMode: m }))}
                                  className={`flex-1 py-1.5 rounded-md text-[10px] font-bold transition-all ${settings.frightMode===m ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                                  {lbl}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="fixed inset-0 z-[999]" onClick={() => setShowSettings(false)} />
                      </>
                    )}
                 </div>
              </div>
            </div>

            <div className="w-full premium-scroll" style={{overflowX:"auto"}}>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-700 border-b border-slate-600">
                    <th className="px-2 py-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider text-center whitespace-nowrap w-9">S.No</th>
                    <th className="px-2 py-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider text-left">Item Name</th>
                    <th className="px-2 py-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider text-left">Specification</th>
                    {header.orderType === "SITC" && <th className="px-2 py-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider text-left">Scope of Work</th>}
                    {settings.model && (
                      <th className="px-2 py-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider text-left group/th whitespace-nowrap">
                        <div className="flex items-center gap-1">Model No
                          <button onClick={() => setSettings(s=>({...s,model:false}))} className="opacity-0 group-hover/th:opacity-100 ml-1 w-4 h-4 rounded bg-rose-500/80 text-white flex items-center justify-center transition-opacity hover:bg-rose-600" title="Remove column"><X size={8} strokeWidth={3}/></button>
                        </div>
                      </th>
                    )}
                    {(header.orderType === "Supply" || settings.brand) && (
                      <th className="px-2 py-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider text-left group/th whitespace-nowrap">
                        <div className="flex items-center gap-1">Make / Brand
                          {header.orderType === "SITC" && <button onClick={() => setSettings(s=>({...s,brand:false}))} className="opacity-0 group-hover/th:opacity-100 ml-1 w-4 h-4 rounded bg-rose-500/80 text-white flex items-center justify-center transition-opacity hover:bg-rose-600" title="Remove column"><X size={8} strokeWidth={3}/></button>}
                        </div>
                      </th>
                    )}
                    <th className="px-2 py-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider text-center whitespace-nowrap w-12">Unit</th>
                    <th className="px-2 py-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider text-center whitespace-nowrap w-14">Qty</th>
                    <th className="px-2 py-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider text-right whitespace-nowrap w-24">Rate (₹)</th>
                    {settings.discountMode === "line" && <th className="px-2 py-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider text-center whitespace-nowrap w-12">Disc%</th>}
                    <th className="px-2 py-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider text-center whitespace-nowrap w-14">GST%</th>
                    <th className="px-2 py-2.5 text-[10px] font-bold text-indigo-300 uppercase tracking-wider text-right whitespace-nowrap w-24">Amount (₹)</th>
                    {settings.remarks && (
                      <th className="px-2 py-2.5 text-[10px] font-bold text-slate-300 uppercase tracking-wider text-left group/th">
                        <div className="flex items-center gap-1">Remarks
                          <button onClick={() => setSettings(s=>({...s,remarks:false}))} className="opacity-0 group-hover/th:opacity-100 ml-1 w-4 h-4 rounded bg-rose-500/80 text-white flex items-center justify-center transition-opacity hover:bg-rose-600" title="Remove column"><X size={8} strokeWidth={3}/></button>
                        </div>
                      </th>
                    )}
                    <th className="sticky right-0 bg-slate-700"></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {items.map((group, gIdx) => {
                    const itemData = itemsList.find(i => i.id === group.itemId);
                    return group.subRows.map((sub, sIdx) => {
                      const isFirst = sIdx === 0;
                      return (
                        <tr key={sub.id} className={`transition-colors border-b border-slate-100
                          ${isFirst && gIdx > 0 ? "border-t-2 border-slate-300" : ""}
                          ${!isFirst ? "bg-slate-50/60 hover:bg-slate-100/60" : "bg-white hover:bg-indigo-50/30"}`}>

                          {/* S.No — rowspan */}
                          {isFirst && (
                            <td rowSpan={group.subRows.length} className="px-1 py-2 text-center align-middle border-r border-slate-100">
                              <span className="text-[11px] font-bold text-slate-400">{(gIdx+1).toString().padStart(2,"0")}</span>
                            </td>
                          )}

                          {/* Item — rowspan */}
                          {isFirst && (
                            <td rowSpan={group.subRows.length} className="px-2 py-2 align-middle border-r border-slate-100">
                              <div className="border-l-2 border-indigo-300 pl-1.5">
                                <InlineSelect value={group.itemId} onChange={e => handleGroupChange(group.id, e.target.value)}
                                  options={itemsList.filter(i => i.itemType === header.orderType)} placeholder="Select Item..." />
                                {group.itemId && (
                                  <button onClick={() => addSubRow(group.id)}
                                    className="mt-1 flex items-center gap-0.5 text-[9px] font-bold text-indigo-400 hover:text-indigo-600 px-1 rounded hover:bg-indigo-50 transition-colors">
                                    <Plus size={9} strokeWidth={3}/> Add Spec
                                  </button>
                                )}
                              </div>
                            </td>
                          )}

                          {/* Spec */}
                          <td className="px-2 py-2">
                            <InlineSelect value={sub.specification} onChange={e => handleSubRowChange(group.id, sub.id, "specification", e.target.value)}
                              options={itemData?.specifications || []} placeholder="— Spec —" disabled={!group.itemId} />
                          </td>

                          {/* Scope of Work — SITC only, read-only auto-picked from item master */}
                          {header.orderType === "SITC" && (
                            <td className="px-2 py-2 align-top">
                              {sub.scopeOfWork
                                ? <p className="text-xs text-slate-700 leading-relaxed break-words">{sub.scopeOfWork}</p>
                                : <span className="text-[11px] text-slate-300 italic">—</span>}
                            </td>
                          )}

                          {/* Model */}
                          {settings.model && (
                            <td className="px-2 py-2">
                              <input type="text" value={sub.modelNumber} onChange={e => handleSubRowChange(group.id, sub.id, "modelNumber", e.target.value)}
                                className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-md px-2 py-1.5 outline-none focus:border-indigo-400 placeholder:text-slate-300 placeholder:italic" placeholder="Model #" />
                            </td>
                          )}

                          {/* Brand */}
                          {(header.orderType === "Supply" || settings.brand) && (
                            <td className="px-2 py-2">
                              <InlineSelect value={sub.make} onChange={e => handleSubRowChange(group.id, sub.id, "make", e.target.value)}
                                options={itemData?.brands || []} placeholder="Brand" disabled={!group.itemId} />
                            </td>
                          )}

                          {/* Unit — rowspan */}
                          {isFirst && (
                            <td rowSpan={group.subRows.length} className="px-1 py-2 text-center align-middle bg-slate-50 border-x border-slate-100">
                              <span className="text-[11px] font-semibold text-slate-500">{group.unit || "—"}</span>
                            </td>
                          )}

                          {/* Qty */}
                          <td className="px-1 py-2">
                            <input type="number" value={sub.qty || ""} onChange={e => handleSubRowChange(group.id, sub.id, "qty", Number(e.target.value))}
                              className="w-full text-center text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-md px-1 py-1.5 outline-none focus:border-indigo-400" placeholder="0" />
                          </td>

                          {/* Rate */}
                          <td className="px-1 py-2">
                            <div className="relative">
                              <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-300">₹</span>
                              <input type="number" value={sub.unitRate || ""} onChange={e => handleSubRowChange(group.id, sub.id, "unitRate", Number(e.target.value))}
                                className="w-full text-right text-xs font-bold text-slate-800 bg-white border border-slate-200 rounded-md pl-4 pr-1 py-1.5 outline-none focus:border-indigo-400" placeholder="0.00" />
                            </div>
                          </td>

                          {/* Disc */}
                          {settings.discountMode === "line" && (
                            <td className="px-1 py-2">
                              <input type="number" value={sub.discountPct || ""} onChange={e => handleSubRowChange(group.id, sub.id, "discountPct", Number(e.target.value))}
                                className="w-full text-center text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-md py-1.5 outline-none focus:border-indigo-400" placeholder="%" />
                            </td>
                          )}

                          {/* GST % */}
                          <td className="px-1 py-2">
                            <div className="relative">
                              <select value={sub.taxPct} onChange={e => handleSubRowChange(group.id, sub.id, "taxPct", Number(e.target.value))}
                                className="w-full appearance-none text-center text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-md px-1 py-1.5 outline-none focus:border-indigo-400 cursor-pointer">
                                <option value="0">0%</option><option value="5">5%</option><option value="12">12%</option><option value="18">18%</option><option value="28">28%</option>
                              </select>
                              <ChevronDown size={9} className="absolute right-1 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"/>
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="px-2 py-2 text-right text-xs font-bold text-indigo-600 bg-indigo-50/50 font-mono border-l border-indigo-100">
                            {sub.totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                          </td>

                          {/* Remarks */}
                          {settings.remarks && (
                            <td className="px-2 py-2">
                              <input type="text" value={sub.remarks} onChange={e => handleSubRowChange(group.id, sub.id, "remarks", e.target.value)}
                                className="w-full text-xs text-slate-500 bg-slate-50 border border-transparent rounded-md px-2 py-1.5 focus:bg-white focus:border-indigo-300 outline-none italic" placeholder="Remarks..." />
                            </td>
                          )}

                          {/* Action */}
                          <td className="px-1 py-2 text-center sticky right-0 border-l border-slate-100 bg-inherit">
                            <button onClick={() => group.subRows.length > 1 ? removeSubRow(group.id, sub.id) : removeGroup(group.id)}
                              disabled={group.subRows.length === 1 && items.length === 1}
                              className="w-6 h-6 flex items-center justify-center mx-auto text-slate-300 hover:text-white hover:bg-rose-400 rounded transition-all disabled:opacity-0">
                              <X size={11} strokeWidth={2.5}/>
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
                </table>
            </div>

            {/* Footer: Add Item + Summary */}
            <div className="border-t-2 border-slate-100 grid grid-cols-1 md:grid-cols-2">
              {/* Add Item */}
              <div className="p-5 flex items-center border-r border-slate-100">
                <button onClick={addItem}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200">
                  <Plus size={16} strokeWidth={2.5} /> Add New Item
                </button>
              </div>

              {/* Summary */}
              <div className="p-5 space-y-2.5">
                <div className="flex justify-between text-xs font-medium text-slate-500 pb-2 border-b border-slate-100">
                  <span>Subtotal</span>
                  <span className="font-mono font-semibold text-slate-700">₹ {totals.subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>

                {settings.discountMode === "line" && totals.lineDiscountSum > 0 && (
                  <div className="flex justify-between items-center text-xs font-medium text-rose-500">
                    <span>Discount (Line)</span>
                    <span className="font-mono font-semibold">
                      − ₹ {totals.lineDiscountSum.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {settings.discountMode === "total" && (
                  <div className="flex justify-between items-center text-xs font-medium text-rose-500">
                    <span>Discount</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border border-rose-200 rounded-md bg-rose-50 overflow-hidden">
                        <input type="number" value={transactionDiscount} onChange={e => setTransactionDiscount(e.target.value)}
                          className="w-10 text-right outline-none font-mono text-xs bg-transparent text-rose-600 px-1.5 py-1 placeholder:text-rose-300" placeholder="0" />
                        <span className="text-[11px] text-rose-400 font-bold pr-1.5">%</span>
                      </div>
                      <span className="font-mono font-semibold text-rose-500 w-[90px] text-right">
                        − ₹ {totals.txDiscountAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex justify-between text-xs font-medium text-slate-500">
                  <span>GST</span>
                  <span className="font-mono font-semibold text-slate-700">₹ {totals.gst.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                </div>

                {settings.frightMode !== "none" && (
                  <div className="flex justify-between items-center text-xs font-medium text-slate-500 border-t border-slate-100 pt-2">
                    <div className="flex items-center gap-2">
                      <span>Freight</span>
                      {settings.frightMode === "before" && (
                        <select value={frightTax} onChange={e => setFrightTax(e.target.value)}
                          className="text-[10px] border border-slate-200 rounded-md px-1.5 py-0.5 outline-none bg-white text-slate-600">
                          <option value="0">0% GST</option><option value="5">5% GST</option>
                          <option value="12">12% GST</option><option value="18">18% GST</option>
                        </select>
                      )}
                    </div>
                    <input type="number" value={frightCharges} onChange={e => setFrightCharges(e.target.value)}
                      className="w-28 text-right border border-slate-200 rounded-lg px-2 py-1 outline-none font-mono text-xs focus:border-indigo-400 bg-white" placeholder="0.00" />
                  </div>
                )}

                <div className="pt-3 border-t-2 border-slate-200 mt-1 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Grand Total</p>
                    <p className="text-2xl font-black text-indigo-600 font-mono">₹ {totals.grandTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                  </div>
                  <p className="text-[11px] text-slate-400 italic leading-snug">
                    {header.orderType === "Supply" ? "Total Purchase Order Value: " : "Total Work Order Value: "}
                    {totals.words}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CLAUSES */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-5">
            <h2 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2"><ShieldCheck size={16} className="text-slate-400"/> Order Clauses & Terms</h2>
            <div className="grid grid-cols-1 gap-6">
              {renderClauses("Terms & Conditions", "TC", tcPoints, setTcPoints)}
              {renderClauses("Payment Terms", "PAY", payPoints, setPayPoints)}
              {renderClauses("Governing Laws", "GOV", govPoints, setGovPoints)}
            </div>
          </div>

        </div>
      </div>
      
      {/* Master Data Interactivity Modals */}
      {actionModal.type === "addSite" && <FullSiteModal onClose={() => setActionModal({ type: null })} onSuccess={(id) => { fetchMasterData(); setHeader(h => ({ ...h, siteId: id })); handleSiteChange({ target: { value: id } }); }} />}
      {actionModal.type === "addCompany" && <FullCompanyModal onClose={() => setActionModal({ type: null })} onSuccess={(id) => { fetchMasterData(); setHeader(h => ({ ...h, companyId: id })); handleCompanyChange({ target: { value: id } }); }} />}
      {actionModal.type === "addVendor" && <FullVendorModal onClose={() => setActionModal({ type: null })} onSuccess={(id) => { fetchMasterData(); setHeader(h => ({ ...h, vendorId: id })); handleVendorChange({ target: { value: id } }); }} />}
      
      {actionModal.type === "editSite" && <FullSiteModal editData={actionModal.data} onClose={() => setActionModal({ type: null })} onSuccess={() => fetchMasterData()} />}
      {actionModal.type === "editCompany" && <FullCompanyModal editData={actionModal.data} onClose={() => setActionModal({ type: null })} onSuccess={() => fetchMasterData()} />}
      {actionModal.type === "editVendor" && <FullVendorModal editData={actionModal.data} onClose={() => setActionModal({ type: null })} onSuccess={() => fetchMasterData()} />}

      {actionModal.type === "viewSite" && <FullViewSiteModal site={actionModal.data} onClose={() => setActionModal({ type: null })} onEdit={(d) => setActionModal({ type: "editSite", data: d })} />}
      {actionModal.type === "viewCompany" && <FullViewCompanyModal company={actionModal.data} onClose={() => setActionModal({ type: null })} onEdit={(d) => setActionModal({ type: "editCompany", data: d })} />}
      {actionModal.type === "viewVendor" && <FullViewVendorModal vendor={actionModal.data} onClose={() => setActionModal({ type: null })} onEdit={(d) => setActionModal({ type: "editVendor", data: d })} />}

      {/* CONTACTS */}
      {actionModal.type === "addContact" && <FullContactModal companies={companies} onClose={() => setActionModal({ type: null })} onSuccess={fetchMasterData} />}
      {actionModal.type === "editContact" && <FullContactModal companies={companies} editData={actionModal.data} onClose={() => setActionModal({ type: null })} onSuccess={fetchMasterData} />}
      {actionModal.type === "viewContact" && <FullViewContactModal contact={actionModal.data} onClose={() => setActionModal({ type: null })} onEdit={(d) => setActionModal({ type: "editContact", data: d })} />}
    </div>
  );
}

// ============== ORDER LIST COMPONENT ==============
function OrderList({ project, onCreateClick }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("All");

  const TABS = ["All", "Draft", "Pending Issue", "Issued", "Rejected", "Revert", "Recall"];

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
    } catch { return null; }
  };

  const exportPDF = async (orderId) => {
    try {
      showToast("Generating PDF... Please wait.");
      
      // Dynamic import to avoid main bundle bloat
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"), import("jspdf-autotable")
      ]);

      const res = await fetch(`${API}/api/orders/${orderId}`);
      const { order, items } = await res.json();
      
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      const logoB64 = await getBase64Image(order.companies?.logo_url);
      const signB64 = await getBase64Image(order.companies?.sign_url);
      
      let cursorY = 15;

      /* ── HEADER ── */
      if (logoB64) doc.addImage(logoB64, "PNG", 15, cursorY, 30, 20, "", "FAST");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text(order.companies?.company_name?.toUpperCase() || "", pageWidth - 15, cursorY + 5, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(order.companies?.address || "", pageWidth - 15, cursorY + 10, { align: "right" });
      doc.text(`GSTIN: ${order.companies?.gstin || "N/A"}`, pageWidth - 15, cursorY + 14, { align: "right" });
      
      cursorY += 25;
      doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.5);
      doc.line(15, cursorY, pageWidth - 15, cursorY);
      cursorY += 8;

      /* ── TITLE & META ── */
      doc.setFont("helvetica", "bold"); doc.setFontSize(16);
      doc.text(order.order_type === "Supply" ? "PURCHASE ORDER" : "WORK ORDER", pageWidth / 2, cursorY, { align: "center" });
      cursorY += 10;
      
      doc.setFontSize(10);
      doc.text("Order No:", 15, cursorY); doc.setFont("helvetica", "normal"); doc.text(order.order_number, 40, cursorY);
      doc.setFont("helvetica", "bold"); doc.text("Date:", pageWidth / 2 + 10, cursorY); doc.setFont("helvetica", "normal");
      doc.text(new Date(order.created_at).toLocaleDateString("en-IN"), pageWidth / 2 + 30, cursorY);
      
      cursorY += 6;
      doc.setFont("helvetica", "bold"); doc.text("Subject:", 15, cursorY); doc.setFont("helvetica", "normal"); doc.text(order.subject || "N/A", 40, cursorY);
      cursorY += 6;
      doc.setFont("helvetica", "bold"); doc.text("Ref No:", 15, cursorY); doc.setFont("helvetica", "normal"); doc.text(order.ref_number || "N/A", 40, cursorY);
      cursorY += 12;

      /* ── BOXES ── */
      doc.setDrawColor(0); doc.setLineWidth(0.2);
      // VENDOR
      doc.rect(15, cursorY, 85, 35); doc.setFont("helvetica", "bold"); doc.text("VENDOR / BILL TO:", 18, cursorY + 5);
      doc.setFont("helvetica", "normal"); doc.text(order.vendors?.vendor_name || "", 18, cursorY + 11);
      doc.setFontSize(8); doc.text(doc.splitTextToSize(order.vendors?.address || "", 80), 18, cursorY + 16);
      doc.text(`GSTIN: ${order.vendors?.gstin || "N/A"}`, 18, cursorY + 31);
      
      // SITE
      doc.rect(105, cursorY, 90, 35); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("SHIP TO / DELIVERY SITE:", 108, cursorY + 5);
      doc.setFont("helvetica", "normal"); doc.text(order.sites?.site_name || "", 108, cursorY + 11);
      doc.setFontSize(8); doc.text(doc.splitTextToSize(order.sites?.site_address || "", 85), 108, cursorY + 16);
      cursorY += 45;

      /* ── TABLE ── */
      const tableHead = [["S.No", "Description", "UOM", "Qty", "Rate (Rs)", "Tax %", "Amount (Rs)"]];
      const tableBody = items.map((it, i) => [
        i + 1, it.description + (it.scope_of_work ? `\nScope: ${it.scope_of_work}` : ""),
        it.unit?.toUpperCase() || "", it.qty || 0, Number(it.unit_rate).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
        it.tax_pct || "0", Number(it.amount).toLocaleString("en-IN", { minimumFractionDigits: 2 }),
      ]);

      autoTable(doc, {
        startY: cursorY, head: tableHead, body: tableBody, theme: "grid", styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [40, 50, 70], textColor: 255, fontStyle: "bold" },
        columnStyles: { 0: { cellWidth: 10, halign: "center" }, 1: { cellWidth: "auto" }, 2: { cellWidth: 15, halign: "center" }, 3: { cellWidth: 15, halign: "center" }, 4: { cellWidth: 25, halign: "right" }, 5: { cellWidth: 15, halign: "center" }, 6: { cellWidth: 30, halign: "right" } },
      });
      cursorY = doc.lastAutoTable.finalY + 10;

      /* ── TOTALS ── */
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); const totalsObj = order.totals || {}; const tY = cursorY;
      doc.text("Subtotal:", 145, tY, { align: "right" }); doc.setFont("helvetica", "normal"); doc.text((totalsObj.subtotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }), 190, tY, { align: "right" });
      doc.setFont("helvetica", "bold"); doc.text("GST:", 145, tY + 6, { align: "right" }); doc.setFont("helvetica", "normal"); doc.text((totalsObj.gst || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }), 190, tY + 6, { align: "right" });
      doc.setFont("helvetica", "bold"); doc.text("Grand Total:", 145, tY + 12, { align: "right" }); doc.text((totalsObj.grandTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 }), 190, tY + 12, { align: "right" });
      doc.setFontSize(9); doc.text(`Amount in Words:`, 15, tY); doc.setFont("helvetica", "italic"); doc.text(totalsObj.words || "", 15, tY + 6);
      cursorY += 25;

      /* ── CLAUSES ── */
      if (cursorY > pageHeight - 80) { doc.addPage(); cursorY = 20; }
      
      const tc = order.terms_conditions || []; const pt = order.payment_terms || []; const gl = order.governing_laws || [];
      const printClauses = (title, arr) => {
        if (!arr.length) return;
        doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text(title, 15, cursorY); cursorY += 5;
        doc.setFont("helvetica", "normal"); doc.setFontSize(8);
        arr.forEach((t, i) => { const lines = doc.splitTextToSize(`${i+1}. ${t}`, 180); doc.text(lines, 15, cursorY); cursorY += (lines.length * 4) + 1; });
        cursorY += 5;
      };
      printClauses("Terms & Conditions:", tc); printClauses("Payment Terms:", pt); printClauses("Governing Laws:", gl);

      /* ── FOOTER ── */
      const footerY = pageHeight - 45; if (cursorY > footerY) { doc.addPage(); }
      doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text(`For ${order.companies?.company_name || ""}`, pageWidth - 15, footerY, { align: "right" });
      if (signB64) doc.addImage(signB64, "PNG", pageWidth - 55, footerY + 2, 40, 15, "", "FAST");
      doc.setFont("helvetica", "normal"); doc.text("Authorised Signatory", pageWidth - 15, footerY + 20, { align: "right" });
      doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.5); doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);
      doc.setFontSize(8); doc.setTextColor(150, 150, 150); doc.text("This is a computer generated document.", pageWidth / 2, pageHeight - 10, { align: "center" });

      doc.save(`Order_${order.order_number.replace(/\//g, "_")}.pdf`);
      showToast("PDF exported successfully!");
    } catch (err) { console.error(err); showToast("Error generating PDF", "error"); }
  };

  const getTabCount = (tabName) => {
    if (tabName === "All") return orders.length;
    return orders.filter(o => o.status === tabName).length;
  };

  const filtered = orders.filter(o => {
    const ms = search.toLowerCase();
    const matchSearch = o.order_number?.toLowerCase().includes(ms) || o.subject?.toLowerCase().includes(ms) || o.vendors?.vendor_name?.toLowerCase().includes(ms);
    const matchTab = activeTab === "All" ? true : o.status === activeTab;
    return matchSearch && matchTab;
  });

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
            <span className="text-sky-600 font-bold text-xl">#</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-800">Order Master</h1>
            <p className="text-sm text-slate-400">View logs and dispatch PO/WO orders</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={onCreateClick}
            className="px-6 py-2.5 rounded-xl bg-slate-900 text-white font-semibold flex items-center gap-2 hover:bg-slate-700 transition-all text-sm">
            <Plus size={16} /> Create Order
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        
        {/* TABS */}
        <div className="flex px-4 pt-4 pb-0 border-b border-slate-100 bg-slate-50 gap-6 overflow-x-auto no-scrollbar">
          {TABS.map(t => {
            const count = getTabCount(t);
            return (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`pb-3 text-sm font-semibold transition-all whitespace-nowrap border-b-2 flex items-center gap-2
                  ${activeTab === t ? "text-slate-800 border-slate-800" : "text-slate-400 border-transparent hover:text-slate-600"}`}>
                {t}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  activeTab === t ? "bg-slate-800 text-white" : "bg-slate-200 text-slate-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-b border-slate-100 bg-white flex items-center justify-between gap-4">
           <div className="relative w-full max-w-sm">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">?</span>
             <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by PO number, subject, vendor..."
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-50 bg-white" />
           </div>
           <div className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
             Total: {filtered.length}
           </div>
        </div>
        
        {loading ? (
           <div className="p-10 text-center text-slate-400 text-sm">Loading orders...</div>
        ) : filtered.length === 0 ? (
           <div className="p-16 flex flex-col items-center justify-center">
             <p className="text-slate-300 font-bold uppercase tracking-widest text-sm mb-2">{search || activeTab !== "All" ? "No matches found" : "No orders found"}</p>
             {(search || activeTab !== "All") && <button onClick={() => { setSearch(""); setActiveTab("All"); }} className="text-sky-500 hover:text-sky-600 text-sm font-medium">Clear filters</button>}
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <th className="px-5 py-3 uppercase tracking-wider text-xs">Date</th>
                  <th className="px-5 py-3 uppercase tracking-wider text-xs">Order No</th>
                  <th className="px-5 py-3 uppercase tracking-wider text-xs">Status</th>
                  <th className="px-5 py-3 uppercase tracking-wider text-xs">Vendor</th>
                  <th className="px-5 py-3 uppercase tracking-wider text-xs text-right">Grand Total (₹)</th>
                  <th className="px-5 py-3 uppercase tracking-wider text-xs text-center">Docs</th>
                  <th className="px-5 py-3 uppercase tracking-wider text-xs text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-500 font-medium">{new Date(o.created_at).toLocaleDateString("en-IN")}</td>
                    <td className="px-5 py-3 font-mono font-bold text-slate-800">{o.order_number}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider 
                        ${o.status === "Draft" ? "bg-slate-100 text-slate-600" : 
                          o.status === "Pending Issue" ? "bg-amber-50 text-amber-600" :
                          o.status === "Issued" ? "bg-emerald-50 text-emerald-600" :
                          o.status === "Rejected" ? "bg-red-50 text-red-600" :
                          o.status === "Recall" || o.status === "Revert" ? "bg-orange-50 text-orange-600" :
                          "bg-sky-50 text-sky-600"}`}>
                        {o.status || "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-700 font-medium truncate max-w-[200px]" title={o.vendors?.vendor_name}>{o.vendors?.vendor_name}</td>
                    <td className="px-5 py-3 text-right font-mono font-bold text-slate-700 bg-slate-50/50">
                      {o.totals?.grandTotal?.toLocaleString("en-IN", { minimumFractionDigits: 2 }) || "-"}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {o.quotation_url ? <a href={o.quotation_url} target="_blank" rel="noreferrer" className="text-sky-500 hover:scale-110 transition-transform" title="Quotation">Docs</a> : <span className="text-slate-300">N/A</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center">
                        <button onClick={() => exportPDF(o.id)} className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all font-semibold flex items-center gap-1.5 text-xs">
                          PDF Export
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

// ============== MAIN CONTROLLER ==============
export default function CreateOrderWrapper({ project }) {
  const [view, setView] = useState("list"); // "list" | "create"

  if (view === "create") {
    return <OrderForm project={project} onCancel={() => setView("list")} />;
  }
  return <OrderList project={project} onCreateClick={() => setView("create")} />;
}
