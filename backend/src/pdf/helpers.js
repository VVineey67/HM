const escapeHtml = (value) => {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
};

const formatDate = (value) => {
  if (!value) return "--";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "--";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d).replace(/ /g, " - ");
};

const formatINR = (n) => {
  const num = Number(n) || 0;
  return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const amountToWords = (amount) => {
  if (!amount || isNaN(amount) || amount === 0) return "Zero Rupees Only";
  const a = ["", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ", "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen "];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const numToWords = (n) => {
    const numStr = n.toString();
    if (numStr.length > 9) return "Overflow";
    const m = (`000000000${numStr}`).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!m) return "";
    let str = "";
    str += m[1] !== "00" ? (a[Number(m[1])] || `${b[m[1][0]]} ${a[m[1][1]]}`) + "Crore " : "";
    str += m[2] !== "00" ? (a[Number(m[2])] || `${b[m[2][0]]} ${a[m[2][1]]}`) + "Lakh " : "";
    str += m[3] !== "00" ? (a[Number(m[3])] || `${b[m[3][0]]} ${a[m[3][1]]}`) + "Thousand " : "";
    str += m[4] !== "0" ? (a[Number(m[4])] || `${b[m[4][0]]} ${a[m[4][1]]}`) + "Hundred " : "";
    str += m[5] !== "00" ? (str !== "" ? "and " : "") + (a[Number(m[5])] || `${b[m[5][0]]} ${a[m[5][1]]}`) : "";
    return str.trim();
  };
  const parts = Number(amount).toFixed(2).split(".");
  const rs = parseInt(parts[0], 10);
  const ps = parseInt(parts[1], 10);
  let result = `${numToWords(rs)} Rupees`;
  if (ps > 0) result += ` and ${numToWords(ps)} Paise`;
  return `${result} Only`;
};

const sanitizeHtml = (html) => {
  if (!html) return "";
  return String(html).replace(/&nbsp;|&#160;|\u00A0/g, " ");
};

const parseDescription = (desc) => {
  if (!desc) return [];
  try {
    if (typeof desc === "string" && (desc.trim().startsWith("[") || desc.trim().startsWith("{"))) {
      const parsed = JSON.parse(desc);
      return Array.isArray(parsed) ? parsed : [parsed];
    }
  } catch {}
  return Array.isArray(desc) ? desc : [desc];
};

const parseMake = (make) => {
  if (!make || make === "[]" || make === "null") return [];
  try {
    const parsed = JSON.parse(make);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return [make];
  }
};

const groupItems = (items = []) => {
  const norm = (v) => String(v || "").trim().replace(/\s+/g, " ").toLowerCase();
  const groups = [];
  const keyMap = new Map();
  items.forEach((item) => {
    const name = String(item.material_name || item.items?.material_name || item.item?.material_name || "N/A").trim() || "N/A";
    const unit = String(item.unit || "").trim();
    const key = `${norm(name)}__${norm(unit)}`;
    if (keyMap.has(key)) {
      const g = groups[keyMap.get(key)];
      g.rows.push({ ...item, _itemName: name, _isSubRow: true, _subIdx: g.rows.length + 1, _srNo: g.srNo });
    } else {
      const srNo = groups.length + 1;
      const head = { ...item, _itemName: name, _isSubRow: false, _subIdx: 1, _srNo: srNo };
      groups.push({ srNo, itemName: name, unit, rows: [head] });
      keyMap.set(key, groups.length - 1);
    }
  });
  return groups;
};

module.exports = {
  escapeHtml,
  formatDate,
  formatINR,
  amountToWords,
  sanitizeHtml,
  parseDescription,
  parseMake,
  groupItems,
};
