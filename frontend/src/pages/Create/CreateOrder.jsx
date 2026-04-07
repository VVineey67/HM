import React from "react";
import { PackagePlus } from "lucide-react";

export default function CreateOrder() {
  return (
    <div className="p-6 w-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
          <PackagePlus size={18} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-800">Create Order</h1>
          <p className="text-xs text-slate-400">Create a new purchase / work order</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-16 flex items-center justify-center">
        <p className="text-slate-300 font-bold uppercase tracking-widest text-xs">Coming soon</p>
      </div>
    </div>
  );
}
