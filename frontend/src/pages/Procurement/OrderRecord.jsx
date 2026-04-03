import React from "react";
import { ClipboardList } from "lucide-react";

const OrderRecord = ({ project }) => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center">
          <ClipboardList size={20} className="text-slate-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Order Record</h1>
          <p className="text-sm text-slate-400">{project} — All POs history</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 flex items-center justify-center">
        <p className="text-slate-300 font-bold uppercase tracking-widest text-sm">Coming Soon</p>
      </div>
    </div>
  );
};

export default OrderRecord;
