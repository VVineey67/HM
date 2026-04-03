import React from "react";
import { Landmark } from "lucide-react";

const CompanyList = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-green-50 rounded-xl flex items-center justify-center">
          <Landmark size={20} className="text-green-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Company List</h1>
          <p className="text-sm text-slate-400">Global — Buyer company details for PO</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 flex items-center justify-center">
        <p className="text-slate-300 font-bold uppercase tracking-widest text-sm">Coming Soon</p>
      </div>
    </div>
  );
};

export default CompanyList;
