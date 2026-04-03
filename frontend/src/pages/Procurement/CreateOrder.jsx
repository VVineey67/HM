import React from "react";
import { FilePlus } from "lucide-react";

const CreateOrder = ({ project }) => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-orange-50 rounded-xl flex items-center justify-center">
          <FilePlus size={20} className="text-orange-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Create Order</h1>
          <p className="text-sm text-slate-400">{project} — Generate new Purchase Order</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 flex items-center justify-center">
        <p className="text-slate-300 font-bold uppercase tracking-widest text-sm">Coming Soon</p>
      </div>
    </div>
  );
};

export default CreateOrder;
