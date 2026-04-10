import React from "react";
import { User, Phone, MapPin, Building2, Globe, Mail, Landmark, FileText, CheckCircle } from "lucide-react";

/* ── INR to Words Helper ── */
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

const OrderPDFTemplate = ({ order, items = [], comp = {}, vend = {}, site = {}, contacts = [] }) => {
  if (!order) return null;

  const totals = order.totals || {};
  const isSupply = order.order_type === "Supply";

  const fright = Number(totals.frightCharges ?? totals.fright) || 0;
  const frightTax = Number(totals.frightTax ?? 18);
  const subtotal = Number(totals.subtotal) || 0;
  const totalGst = Number(totals.gst) || 0;
  const discAmt = Number(totals.totalDiscountAmt) || 0;
  const discountPct = Number(totals.txDiscountPct || totals.discount_pct) || 0;
  const netItems = subtotal - discAmt;
  const grandTotal = Number(totals.grandTotal) || (netItems + fright + totalGst);

  const groupedItems = React.useMemo(() => {
    const raw = items || [];
    const results = [];
    let currentHead = null;

    for (let i = 0; i < raw.length; i++) {
      const it = raw[i];
      const itemName = it.material_name || it.item_name || it.items?.material_name || it.item?.material_name || "N/A";
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
  }, [items]);

  return (
    <div className="bg-transparent font-inter p-0 w-full max-w-[210mm] mx-auto relative antialiased" style={{ color: '#1e293b' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        
        .pdf-hex-bg-blue { background-color: #1b3e8a !important; }
        .pdf-hex-text-blue { color: #1b3e8a !important; }
        .pdf-hex-border-blue { border-color: #1b3e8a !important; }

        @media print {
          body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; background: #ffffff !important; }
          .page-container {
             margin: 0 !important;
             box-shadow: none !important;
             padding: 10mm 15mm 20mm 15mm !important;
             width: 210mm !important;
             min-height: 297mm !important;
             page-break-after: always !important;
          }
          .no-print { display: none !important; }
        }

        @media screen {
          .page-container {
            background: #ffffff !important;
            width: 210mm;
            min-height: 297mm;
            margin: 10px auto;
            padding: 10mm 12mm 20mm 12mm;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            position: relative;
            border: 1px solid #e2e8f0;
            overflow: visible !important;
          }
          .doc-footer {
             position: absolute;
             bottom: 10mm;
             left: 12mm;
             right: 12mm;
             border-top: 1.5px solid #1b3e8a;
             text-align: center;
             padding-top: 6px;
          }
        }

        .slanted-header-box {
           clip-path: polygon(10% 0, 100% 0, 100% 100%, 0% 100%);
           background-color: #1b3e8a !important;
           color: #ffffff !important;
           padding: 8px 22px 8px 32px;
           min-width: 165px;
           display: flex;
           align-items: center;
           justify-content: center;
        }

        .details-tab {
           clip-path: polygon(0 0, 100% 0, 85% 100%, 0% 100%);
           background-color: #1e3a8a !important;
           color: #ffffff !important;
           padding: 3px 20px 3px 8px;
           font-weight: 800;
           font-size: 9.5px;
           display: inline-block;
           width: fit-content;
           text-transform: uppercase;
           letter-spacing: 0.1em;
           margin-bottom: 8px;
        }

        /* HEADING WITH LINE ON THE RIGHT */
        .item-category-header {
           display: flex;
           align-items: center;
           gap: 10px;
           color: #1b3e8a;
           font-weight: 800;
           font-size: 9px;
           text-transform: uppercase;
           margin: 4px 0 3px 0; /* Minimized vertical gap */
        }
        .item-category-header::after {
          content: "";
          flex-grow: 1;
          height: 1.5px;
          background-color: #cbd5e1;
        }

        .grid-detail-row {
           display: grid;
           grid-template-columns: 75px 1fr;
           gap: 5px;
           font-size: 9.5px;
           line-height: 1.3;
           margin-bottom: 3px;
        }
        .grid-detail-label {
           color: #64748b;
           font-weight: 600;
           text-transform: uppercase;
           font-size: 8.5px;
        }
        .grid-detail-value {
          color: #0f172a;
          font-weight: 700;
          text-transform: uppercase;
        }
      `}</style>

      {/* REUSABLE HEADER COMPONENT */}
      {(() => {
        const renderHeader = () => (
          <>
            <div className="flex justify-between items-center mb-2">
              <div className="shrink-0">
                {(comp.logoUrl || comp.logo_url) && (
                  <img src={comp.logoUrl || comp.logo_url} className="h-16 w-auto object-contain" alt="Logo" />
                )}
              </div>
              <div className="slanted-header-box">
                <h2 className="text-[15px] font-black uppercase tracking-[0.15em] leading-none m-0" style={{ color: '#ffffff' }}>PURCHASE ORDER</h2>
              </div>
            </div>
            <div className="w-full h-0.5 bg-[#1b3e8a] mb-4"></div>
          </>
        );

        return (
          <>
            {/* PAGE 1 */}
            <div className="page-container" style={{ backgroundColor: '#ffffff' }}>
              {renderHeader()}

              {/* PO METADATA GRID */}
              <div className="grid grid-cols-2 border border-[#e2e8f0] mb-4 overflow-hidden rounded-sm">
                {[
                  { label: "PO No. :", val: order.order_number },
                  { label: "PO Date :", val: order.date_of_creation ? new Date(order.date_of_creation).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' }) : "--" },
                  { label: "Ref.No. :", val: order.ref_number },
                  { label: "Created By :", val: order.creator_name || order.made_by },
                  { label: "Project :", val: site.siteName || site.site_name || order.project_name },
                  { label: "Requisition By :", val: order.request_by || order.requested_by }
                ].map((item, i) => (
                  <div key={i} className={`flex p-1.5 items-center ${i % 2 === 0 ? 'border-r border-[#e2e8f0]' : ''} ${i < 4 ? 'border-b border-[#e2e8f0]' : ''}`}>
                    <span className="w-28 text-[9px] font-black text-[#64748b] tracking-wider uppercase">{item.label}</span>
                    <span className="text-[11px] font-bold text-[#1e293b] uppercase ml-1">{item.val || "--"}</span>
                  </div>
                ))}
              </div>

              {/* DETAILS SECTION (ITEMS-STRETCH) */}
              <div className="grid grid-cols-2 gap-5 mb-4 items-stretch">
                {/* Vendor Details */}
                <div className="border border-[#e2e8f0] p-4 rounded-sm bg-white flex flex-col items-start h-full shadow-sm">
                  <div className="details-tab self-start">Vendor Details</div>
                  <h4 className="text-[11px] font-black text-[#0f172a] uppercase mb-1 tracking-tight">{vend.vendorName || vend.vendor_name || "N/A"}</h4>

                  <div className="item-category-header w-full">Address</div>
                  <p className="text-[9.5px] text-[#475569] uppercase leading-tight mb-2 font-medium">{vend.address || "N/A"}</p>

                  <div className="item-category-header w-full">Bank Details</div>
                  <div className="space-y-0.5 mb-2 px-1">
                    <div className="grid-detail-row">
                      <span className="grid-detail-label">Bank Name:</span>
                      <span className="grid-detail-value">{vend.bankName || vend.bank_name || "N/A"}</span>
                    </div>
                    <div className="grid-detail-row">
                      <span className="grid-detail-label">Acc No.:</span>
                      <span className="grid-detail-value font-black">{vend.accountNo || vend.account_number || "N/A"}</span>
                    </div>
                    <div className="grid-detail-row">
                      <span className="grid-detail-label">IFSC Code:</span>
                      <span className="grid-detail-value">{vend.ifsc || vend.ifsc_code || "N/A"}</span>
                    </div>
                  </div>

                  <div className="item-category-header w-full">Tax / GST Details</div>
                  <div className="grid grid-cols-2 gap-x-4 mb-2 px-1">
                    <div className="grid-detail-row" style={{ gridTemplateColumns: '55px 1fr' }}>
                      <span className="grid-detail-label">GST No:</span>
                      <span className="grid-detail-value">{vend.gstin || "N/A"}</span>
                    </div>
                    <div className="grid-detail-row" style={{ gridTemplateColumns: '55px 1fr' }}>
                      <span className="grid-detail-label">Pan No:</span>
                      <span className="grid-detail-value">{vend.pan || "N/A"}</span>
                    </div>
                    <div className="grid-detail-row" style={{ gridTemplateColumns: '55px 1fr' }}>
                      <span className="grid-detail-label">MSME No:</span>
                      <span className="grid-detail-value">{vend.msme || vend.msme_no || "N/A"}</span>
                    </div>
                    <div className="grid-detail-row" style={{ gridTemplateColumns: '55px 1fr' }}>
                      <span className="grid-detail-label">Aadhar No:</span>
                      <span className="grid-detail-value">{vend.aadhar || vend.aadhar_no || "N/A"}</span>
                    </div>
                  </div>

                  <div className="item-category-header w-full mt-auto">Contact Details</div>
                  <div className="space-y-0.5 px-1 font-inter">
                    <div className="grid-detail-row" style={{ gridTemplateColumns: '85px 1fr' }}>
                      <span className="grid-detail-label">Person Name:</span>
                      <span className="grid-detail-value font-black">{vend.contactPerson || vend.contact_person || "N/A"}</span>
                    </div>
                    <div className="grid-detail-row" style={{ gridTemplateColumns: '85px 1fr' }}>
                      <span className="grid-detail-label">Phone No:</span>
                      <span className="grid-detail-value">{vend.mobile || vend.phone || "N/A"}</span>
                    </div>
                    <div className="grid-detail-row" style={{ gridTemplateColumns: '85px 1fr' }}>
                      <span className="grid-detail-label">Email ID:</span>
                      <span className="grid-detail-value normal-case font-medium lowercase text-[8.5px]" style={{ textTransform: 'none' }}>{vend.email || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Company Details */}
                <div className="border border-[#e2e8f0] p-4 rounded-sm bg-white flex flex-col items-start h-full shadow-sm">
                  <div className="details-tab self-start" style={{ backgroundColor: '#334155' }}>Company Details</div>
                  <h4 className="text-[11px] font-black text-[#0f172a] uppercase mb-1 tracking-tight">{comp.companyName || comp.company_name || "N/A"}</h4>

                  <div className="item-category-header w-full">Site Address</div>
                  <p className="text-[9px] text-[#475569] uppercase font-medium leading-tight mb-2 px-1">{site.siteAddress || site.site_address || "N/A"}</p>

                  <div className="item-category-header w-full">Billing Address</div>
                  <div className="mb-2 px-1">
                    <p className="text-[8.5px] text-[#475569] font-medium uppercase whitespace-pre-wrap leading-tight">
                      {site.billingAddress || site.billing_address || "N/A"}
                    </p>
                  </div>

                  <div className="item-category-header w-full">Tax / GST Details</div>
                  <div className="space-y-0.5 mb-2 px-1">
                    <div className="grid-detail-row" style={{ gridTemplateColumns: '55px 1fr' }}>
                      <span className="grid-detail-label">GST No:</span>
                      <span className="grid-detail-value font-black">{comp.gstin || comp.gst_no || "N/A"}</span>
                    </div>
                    <div className="grid-detail-row opacity-0 leading-none h-2"><span>-</span></div>
                  </div>

                  <div className="item-category-header w-full mt-6 mb-3 text-[11px]">Contact Persons</div>
                  <div className="space-y-3 px-1 pt-2">
                    {contacts.length > 0 ? contacts.map((c, i) => (
                      <div key={i} className="flex flex-col border-l-2 border-[#1b3e8a] pl-2.5 py-0.5">
                        <span className="text-[10px] font-black text-[#000000] uppercase tracking-tight leading-none mb-1.5">
                          {c.personName || c.person_name || "N/A"}
                        </span>
                        <div className="flex items-center gap-1.5 text-[#475569]">
                          <Phone className="w-2.5 h-2.5 text-[#1b3e8a]" />
                          <span className="text-[9.5px] font-bold leading-none">
                            {c.contactNumber || c.contact_number || "N/A"}
                          </span>
                        </div>
                      </div>
                    )) : <p className="text-[9px] italic text-slate-400">--- NA ---</p>}
                  </div>
                </div>
              </div>

              {/* SUBJECT */}
              <div className="px-4 py-2 border-y border-[#18181b] mb-3 bg-[#e4e4e7] flex justify-center items-center gap-3">
                <span className="text-[11px] font-black text-[#18181b] uppercase tracking-[2px] shrink-0">Subject :</span>
                <span className="text-[13px] font-black uppercase tracking-wide text-[#000000]">{order.subject || order.order_name || "--"}</span>
              </div>

              <div className="overflow-hidden border border-[#e2e8f0] rounded-sm mb-4">
                <table className="w-full text-left border-collapse table-auto">
                  <thead className="bg-[#e4e4e7] border-b-2 border-[#18181b]">
                    <tr className="text-[#000000] text-[10px] font-black uppercase tracking-widest leading-none">
                      <th className="px-2 py-3 border-r border-[#cbd5e1] text-center whitespace-nowrap" style={{ width: '1%' }}>Sr.</th>
                      <th className="px-3 py-3 border-r border-[#cbd5e1]" style={{ width: 'auto' }}>Item Name</th>
                      <th className="px-3 py-3 border-r border-[#cbd5e1]" style={{ width: 'auto' }}>Specification</th>
                      {groupedItems.some(it => it.model_number) && (
                        <th className="px-2 py-3 border-r border-[#cbd5e1] whitespace-nowrap" style={{ width: '1%' }}>Model No.</th>
                      )}
                      {groupedItems.some(it => it.make || it.brand) && (
                        <th className="px-2 py-3 border-r border-[#cbd5e1] text-center whitespace-nowrap" style={{ width: '1%' }}>Brand</th>
                      )}
                      <th className="px-2 py-3 border-r border-[#cbd5e1] text-center whitespace-nowrap" style={{ width: '1%' }}>Unit</th>
                      <th className="px-2 py-3 border-r border-[#cbd5e1] text-center whitespace-nowrap" style={{ width: '1%' }}>Qty</th>
                      <th className="px-3 py-3 border-r border-[#cbd5e1] text-right whitespace-nowrap" style={{ width: '1%' }}>Rate</th>
                      {totals.discount_mode === 'line' && (
                        <th className="px-2 py-3 border-r border-[#cbd5e1] text-center whitespace-nowrap" style={{ width: '1%' }}>Disc%</th>
                      )}
                      <th className="px-2 py-3 border-r border-[#cbd5e1] text-center whitespace-nowrap" style={{ width: '1%' }}>GST%</th>
                      <th className="px-4 py-3 text-right bg-slate-200/50 whitespace-nowrap" style={{ width: '1%' }}>Amount</th>
                      {groupedItems.some(it => it.remarks) && (
                        <th className="px-2 py-3 text-left whitespace-nowrap" style={{ width: '1%' }}>Remarks</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#cbd5e1] text-[11px]">
                    {groupedItems.map((it, idx) => (
                      <tr key={idx} className="bg-white border-b border-[#cbd5e1]">
                        {/* Sr No & Item Name Merged */}
                        {!it._isSubRow && (
                          <>
                            <td rowSpan={it._rowSpan} className="px-2 py-4 border-r border-[#cbd5e1] text-center text-[#000000] font-bold bg-[#fcfcfc] align-top text-[11px] whitespace-nowrap">
                              {it._groupSrNo < 10 ? `0${it._groupSrNo}` : it._groupSrNo}
                            </td>
                            <td rowSpan={it._rowSpan} className="px-3 py-4 border-r border-[#cbd5e1] font-bold text-[#000000] uppercase leading-tight bg-[#fcfcfc] text-[11px] align-top">
                              {it._itemName}
                            </td>
                          </>
                        )}

                        {/* Specification */}
                        <td className="px-3 py-4 border-r border-[#cbd5e1] text-[11px] text-[#000000] font-bold leading-relaxed">
                          {it.description || "--"}
                        </td>
                        {/* Model Number */}
                        {groupedItems.some(it2 => it2.model_number) && (
                          <td className="px-3 py-4 border-r border-[#cbd5e1] text-center text-[#000000] font-bold uppercase text-[12px]">
                            {it.model_number || "--"}
                          </td>
                        )}
                        {groupedItems.some(it2 => it2.make || it2.brand) && (
                          <td className="px-3 py-4 border-r border-[#cbd5e1] text-center text-[#000000] font-bold uppercase text-[12px]">
                            {(() => {
                              const bVal = it.make || it.brand || "";
                              if (!bVal || bVal === "[]" || bVal === "null") return "--";
                              try {
                                const parsed = JSON.parse(bVal);
                                return Array.isArray(parsed) ? (parsed[0] || "--") : parsed;
                              } catch { return bVal; }
                            })()}
                          </td>
                        )}
                        <td className="px-3 py-4 border-r border-[#cbd5e1] text-center text-[#000000] uppercase font-bold text-[11px] whitespace-nowrap">{it.unit || "NOS"}</td>
                        <td className="px-3 py-4 border-r border-[#cbd5e1] text-center font-black text-[#000000] text-[11px] whitespace-nowrap">{it.qty}</td>
                        <td className="px-3 py-4 border-r border-[#cbd5e1] text-right font-bold text-[#000000] text-[11px] whitespace-nowrap">₹ {Number(it.unit_rate).toLocaleString("en-IN")}</td>

                        {/* Discount mapping - Only if Line Mode */}
                        {totals.discount_mode === 'line' && (
                          <td className="px-3 py-4 border-r border-[#cbd5e1] text-center font-bold text-rose-600 text-[12px]">{Number(it.discount_pct)}%</td>
                        )}

                        <td className="px-3 py-4 border-r border-[#cbd5e1] text-center font-bold text-[#000000] text-[11px] whitespace-nowrap">{it.tax_pct}%</td>
                        <td className="px-4 py-4 text-right font-black text-[#1b3e8a] text-[11px] bg-indigo-50/10 whitespace-nowrap">₹ {Number(it.amount).toLocaleString("en-IN")}</td>
                        {groupedItems.some(it2 => it2.remarks) && (
                          <td className="px-3 py-4 text-left text-[#000000] font-bold text-[12px] whitespace-normal leading-tight">
                            {it.remarks || "--"}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TOTALS & AMOUNT IN WORDS SECTION */}
              <div className="flex gap-6 items-end mb-6">
                <div className="flex-grow pb-1">
                  <div className="px-4 py-2 border-y border-[#44403c] bg-[#fafaf9] flex justify-center items-center gap-3 mb-1">
                    <span className="text-[10px] font-black text-[#18181b] uppercase tracking-[2px] shrink-0">Rupees (in words) :</span>
                    <span className="text-[12px] font-black text-[#000000] uppercase tracking-wide leading-tight">
                      {amountToWords(grandTotal)}
                    </span>
                  </div>
                </div>

                <div className="w-56 border border-[#e2e8f0] rounded-sm overflow-hidden shadow-sm shrink-0">
                  <div className="flex justify-between p-2.5 px-4 bg-white border-b border-[#f1f5f9]">
                    <span className="text-[10px] font-black text-[#475569] uppercase">Sub Total</span>
                    <span className="text-[12px] font-black text-[#000000]">₹ {subtotal.toLocaleString("en-IN")}</span>
                  </div>
                  {discAmt > 0 && (
                    <div className="flex justify-between p-2.5 px-4 bg-white border-b border-[#f1f5f9]">
                      <span className="text-[9px] font-black text-rose-700 uppercase">TOTAL DISCOUNT {discountPct > 0 ? `(${discountPct}%)` : ""} :</span>
                      <span className="text-[11px] font-black text-rose-700">- ₹ {discAmt.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {fright > 0 && (
                    <div className="flex justify-between p-2 px-4 bg-white border-b border-[#f1f5f9]">
                      <span className="text-[9.5px] font-black text-[#64748b] uppercase">Freight ({frightTax}%)</span>
                      <span className="text-[11px] font-bold text-[#0f172a]">₹ {fright.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  <div className="flex justify-between p-2.5 px-4 bg-white border-b border-[#f1f5f9]">
                    <span className="text-[10px] font-black text-[#475569] uppercase">GST Total</span>
                    <span className="text-[12px] font-black text-[#000000]">₹ {totalGst.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between p-3 px-4 bg-[#1b3e8a] text-white">
                    <span className="text-[11px] font-black uppercase tracking-widest">Grand Total</span>
                    <span className="text-[15px] font-black font-mono">₹ {grandTotal.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </div>

              <div className="no-print doc-footer text-[9px]">
                <h5 className="font-black text-[#1b3e8a] uppercase tracking-widest mb-1">{comp.companyName || comp.company_name}</h5>
                <p className="text-[#64748b] font-medium leading-relaxed uppercase">{comp.address || "N/A"}</p>
              </div>
            </div>

            {/* PAGE 2 / SUPPLEMENTARY DETAILS */}
            {(order.notes || order.terms_conditions?.length > 0 || order.payment_terms?.length > 0 || order.governing_laws?.length > 0) && (
              <div className="page-container" style={{ backgroundColor: '#ffffff' }}>
                {/* Header repeat on Page 2 */}
                {renderHeader()}

                <div className="space-y-6 text-[11px]">
                  
                  {/* Order Notes */}
                  {order.notes && (
                    <div className="overflow-hidden">
                      <div className="details-tab mb-3 shadow-sm">Order Notes</div>
                      <div className="text-[#475569] px-2 leading-relaxed font-medium mt-2 whitespace-normal break-normal" dangerouslySetInnerHTML={{ __html: order.notes }} />
                    </div>
                  )}

                  {/* Terms & Conditions */}
                  {order.terms_conditions?.length > 0 && (
                    <div className="overflow-hidden">
                      <div className="details-tab mb-3 shadow-sm">Terms & Conditions</div>
                      <ul className="space-y-2 text-[#475569] px-2 list-none mt-2">
                        {order.terms_conditions.map((tc, idx) => (
                          <li key={idx} className="flex gap-3 items-start border-b border-slate-50 pb-1.5" style={{ minWidth: 0 }}>
                            <span className="bg-slate-100 text-slate-500 font-black w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[8px]">{idx + 1}</span>
                            <div style={{ flex: 1, minWidth: 0, wordWrap: 'break-word', overflowWrap: 'break-word', lineHeight: '1.6', fontWeight: '500' }} dangerouslySetInnerHTML={{ __html: tc }} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Payment Schedule */}
                  {order.payment_terms?.length > 0 && (
                    <div className="overflow-hidden">
                      <div className="details-tab mb-3 shadow-sm">Payment Terms</div>
                      <ul className="space-y-2 text-[#475569] px-2 list-none mt-2">
                        {order.payment_terms.map((pt, idx) => (
                          <li key={idx} className="flex gap-3 items-start border-b border-slate-50 pb-1.5" style={{ minWidth: 0 }}>
                            <span className="bg-slate-100 text-slate-500 font-black w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[8px]">{idx + 1}</span>
                            <div style={{ flex: 1, minWidth: 0, wordWrap: 'break-word', overflowWrap: 'break-word', lineHeight: '1.6', fontWeight: '500' }} dangerouslySetInnerHTML={{ __html: pt }} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Governing Laws */}
                  {order.governing_laws?.length > 0 && (
                    <div className="overflow-hidden">
                      <div className="details-tab mb-3 shadow-sm">Governing Laws</div>
                      <div className="text-[#475569] px-2 mt-2 break-words whitespace-normal min-w-0 w-full">
                        {order.governing_laws.map((law, idx) => (
                          <div key={idx} className="leading-relaxed font-medium mb-2 w-full min-w-0" dangerouslySetInnerHTML={{ __html: law }} />
                        ))}
                      </div>
                    </div>
                  )}
                  
                </div>
                <div className="no-print doc-footer text-[9px]">
                  <h5 className="font-black text-[#1b3e8a] uppercase tracking-widest mb-1">{comp.companyName || comp.company_name}</h5>
                  <p className="text-[#64748b] font-medium leading-relaxed uppercase">{comp.address || "N/A"}</p>
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
};

export default OrderPDFTemplate;
