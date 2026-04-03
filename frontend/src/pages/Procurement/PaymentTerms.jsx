import React from "react";
import { CreditCard } from "lucide-react";

const PaymentTerms = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 bg-teal-50 rounded-xl flex items-center justify-center">
          <CreditCard size={20} className="text-teal-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Payment Terms</h1>
          <p className="text-sm text-slate-400">Global — Payment term templates used in PO</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 flex items-center justify-center">
        <p className="text-slate-300 font-bold uppercase tracking-widest text-sm">Coming Soon</p>
      </div>
    </div>
  );
};

export default PaymentTerms;
