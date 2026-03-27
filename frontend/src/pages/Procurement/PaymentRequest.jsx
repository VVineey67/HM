import React, { useState } from "react";
import * as Icon from "lucide-react";

// --- PAYMENT REQUEST DATA ---
const PAYMENT_STEPS = [
  { 
    id: "invoice_submission", 
    name: "Invoice Submission", 
    description: "Vendor submits invoice with supporting documents",
    icon: Icon.FileText,
    color: "from-blue-500 to-blue-700",
    role: "Vendor"
  },
  { 
    id: "invoice_verification", 
    name: "Invoice Verification", 
    description: "Store/Procurement verifies invoice against GRN",
    icon: Icon.ClipboardCheck,
    color: "from-purple-500 to-purple-700",
    role: "Store Team"
  },
  { 
    id: "quality_check", 
    name: "Quality Check", 
    description: "Quality team verifies material quality",
    icon: Icon.CheckSquare,
    color: "from-green-500 to-green-700",
    role: "Quality Team"
  },
  { 
    id: "technical_approval", 
    name: "Technical Approval", 
    description: "Engineer/Technical head approves",
    icon: Icon.Cpu,
    color: "from-yellow-500 to-yellow-700",
    role: "Technical Head"
  },
  { 
    id: "procurement_review", 
    name: "Procurement Review", 
    description: "Procurement team reviews payment terms",
    icon: Icon.Search,
    color: "from-orange-500 to-orange-700",
    role: "Procurement Team"
  },
  { 
    id: "accounts_verification", 
    name: "Accounts Verification", 
    description: "Accounts team verifies TDS and other deductions",
    icon: Icon.Calculator,
    color: "from-red-500 to-red-700",
    role: "Accounts Team"
  },
  { 
    id: "manager_approval", 
    name: "Manager Approval", 
    description: "Finance/Project Manager approves payment",
    icon: Icon.ShieldCheck,
    color: "from-indigo-500 to-indigo-700",
    role: "Finance Manager"
  },
  { 
    id: "payment_processing", 
    name: "Payment Processing", 
    description: "Payment initiated through bank",
    icon: Icon.CreditCard,
    color: "from-teal-500 to-teal-700",
    role: "Accounts Team"
  },
  { 
    id: "payment_confirmation", 
    name: "Payment Confirmation", 
    description: "Vendor confirms payment receipt",
    icon: Icon.CheckCircle,
    color: "from-emerald-500 to-emerald-700",
    role: "Vendor"
  },
  { 
    id: "document_archiving", 
    name: "Document Archiving", 
    description: "All documents archived for audit",
    icon: Icon.Archive,
    color: "from-gray-600 to-gray-800",
    role: "Admin Team"
  }
];

// --- SAMPLE DATA ---
const SAMPLE_PAYMENT_REQUESTS = [
  { 
    id: "PR-2024-001", 
    poNumber: "PO-2024-001",
    vendor: "ABC Construction Supplies",
    invoiceNumber: "INV-001-2024",
    invoiceDate: "2024-01-20",
    invoiceAmount: "₹4,85,000",
    tdsDeducted: "₹24,250",
    netAmount: "₹4,60,750",
    status: "Invoice Submitted",
    currentStep: 1,
    paymentMethod: "Bank Transfer",
    dueDate: "2024-02-10",
    site: "B-47 Tower",
    materialReceived: "Cement, Steel Bars, Tiles",
    grnNumber: "GRN-001-2024",
    timeline: [
      { step: "Invoice Submitted", date: "2024-01-20", by: "ABC Construction" }
    ]
  },
  { 
    id: "PR-2024-002", 
    poNumber: "PO-2024-002",
    vendor: "XYZ Steel Works",
    invoiceNumber: "INV-002-2024",
    invoiceDate: "2024-01-18",
    invoiceAmount: "₹2,30,000",
    tdsDeducted: "₹11,500",
    netAmount: "₹2,18,500",
    status: "Accounts Verification",
    currentStep: 6,
    paymentMethod: "Cheque",
    dueDate: "2024-02-05",
    site: "Skyline Mall",
    materialReceived: "Electrical Wires, Switches",
    grnNumber: "GRN-002-2024",
    timeline: [
      { step: "Invoice Submitted", date: "2024-01-18", by: "XYZ Steel Works" },
      { step: "Invoice Verified", date: "2024-01-19", by: "Store Team" },
      { step: "Quality Checked", date: "2024-01-20", by: "Quality Team" },
      { step: "Technical Approved", date: "2024-01-21", by: "Rajesh Kumar" },
      { step: "Procurement Reviewed", date: "2024-01-22", by: "Rashmi Verma" }
    ]
  },
  { 
    id: "PR-2024-003", 
    poNumber: "PO-2024-003",
    vendor: "MNO Cement Corp",
    invoiceNumber: "INV-003-2024",
    invoiceDate: "2024-01-15",
    invoiceAmount: "₹8,20,000",
    tdsDeducted: "₹41,000",
    netAmount: "₹7,79,000",
    status: "Payment Processed",
    currentStep: 8,
    paymentMethod: "Bank Transfer",
    dueDate: "2024-02-01",
    site: "Tech Park",
    materialReceived: "Glass Panels, Aluminum",
    grnNumber: "GRN-003-2024",
    timeline: [
      { step: "Invoice Submitted", date: "2024-01-15", by: "MNO Cement Corp" },
      { step: "Invoice Verified", date: "2024-01-16", by: "Store Team" },
      { step: "Quality Checked", date: "2024-01-17", by: "Quality Team" },
      { step: "Technical Approved", date: "2024-01-18", by: "Priya Singh" },
      { step: "Procurement Reviewed", date: "2024-01-19", by: "Gaurav Patel" },
      { step: "Accounts Verified", date: "2024-01-20", by: "Accounts Team" },
      { step: "Manager Approved", date: "2024-01-21", by: "Abhishek Sharma" }
    ]
  }
];

const VENDORS = [
  { id: 1, name: "ABC Construction Supplies", accountNumber: "1234567890", bank: "HDFC Bank", ifsc: "HDFC0001234" },
  { id: 2, name: "XYZ Steel Works", accountNumber: "9876543210", bank: "ICICI Bank", ifsc: "ICIC0005678" },
  { id: 3, name: "MNO Cement Corp", accountNumber: "4567890123", bank: "SBI", ifsc: "SBIN0009012" }
];

const PAYMENT_METHODS = [
  { id: 1, name: "Bank Transfer", processingTime: "1-2 days" },
  { id: 2, name: "Cheque", processingTime: "3-5 days" },
  { id: 3, name: "NEFT", processingTime: "1 day" },
  { id: 4, name: "RTGS", processingTime: "Same day" }
];

// --- STYLING ---
const glassStyle = "bg-white/80 backdrop-blur-lg border border-gray-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300";
const inputStyle = "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-400";

// --- MAIN COMPONENT ---
const PaymentRequestDashboard = () => {
  const [activeTab, setActiveTab] = useState("process");
  const [selectedPayment, setSelectedPayment] = useState(SAMPLE_PAYMENT_REQUESTS[0]);
  const [newPayment, setNewPayment] = useState({
    poNumber: "",
    vendor: "",
    invoiceNumber: "",
    invoiceDate: "",
    invoiceAmount: "",
    tdsPercentage: "5",
    paymentMethod: "",
    dueDate: "",
    remarks: ""
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-100 text-gray-800 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-600 to-green-800 rounded-xl flex items-center justify-center shadow-lg">
              <Icon.CreditCard className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Payment Request Management</h1>
              <p className="text-sm text-gray-600">Bootes Construction - Payment Workflow</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-800 rounded-xl hover:from-green-700 hover:to-green-900 transition-all flex items-center gap-2 shadow-lg">
              <Icon.Plus size={18} /> New Payment Request
            </button>
            <div className="w-10 h-10 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
              <Icon.User size={20} className="text-gray-700" />
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-20 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200">
        <div className="w-full px-8 flex space-x-1">
          {["process", "dashboard", "new_request", "tracking", "reports"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-6 text-sm font-semibold capitalize whitespace-nowrap transition-all border-b-2 ${activeTab === tab ? "text-green-600 border-green-600" : "text-gray-500 hover:text-gray-700 border-transparent"}`}
            >
              {tab.split('_').join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full px-8 py-8">
        {activeTab === "process" && <PaymentProcessFlow selectedPayment={selectedPayment} />}
        {activeTab === "dashboard" && <PaymentDashboard />}
        {activeTab === "new_request" && <NewPaymentForm newPayment={newPayment} setNewPayment={setNewPayment} />}
        {activeTab === "tracking" && <PaymentTrackingTable selectedPayment={selectedPayment} setSelectedPayment={setSelectedPayment} />}
        {activeTab === "reports" && <PaymentReportsSection />}
      </main>
    </div>
  );
};

// --- PAYMENT PROCESS FLOW COMPONENT ---
const PaymentProcessFlow = ({ selectedPayment }) => {
  const [activeStep, setActiveStep] = useState(selectedPayment.currentStep);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Process Flow</h2>
          <p className="text-gray-600">Complete workflow from Invoice to Payment Confirmation</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Selected Payment</p>
            <p className="text-lg font-bold text-gray-900">{selectedPayment.id}</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        </div>
      </div>

      {/* Payment Summary Card */}
      <div className={`${glassStyle} p-6`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="p-4 bg-blue-50 rounded-xl">
            <p className="text-sm text-gray-500">Invoice Amount</p>
            <p className="text-2xl font-bold text-gray-900">{selectedPayment.invoiceAmount}</p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-xl">
            <p className="text-sm text-gray-500">TDS Deducted</p>
            <p className="text-2xl font-bold text-gray-900">{selectedPayment.tdsDeducted}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <p className="text-sm text-gray-500">Net Amount</p>
            <p className="text-2xl font-bold text-gray-900">{selectedPayment.netAmount}</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-xl">
            <p className="text-sm text-gray-500">Due Date</p>
            <p className="text-2xl font-bold text-gray-900">{selectedPayment.dueDate}</p>
          </div>
        </div>
      </div>

      {/* Process Timeline */}
      <div className="relative">
        {/* Connector Line */}
        <div className="absolute left-16 top-16 bottom-16 w-0.5 bg-gradient-to-b from-blue-500 via-green-500 to-gray-500"></div>

        <div className="space-y-8">
          {PAYMENT_STEPS.map((step, index) => (
            <div key={step.id} className="relative">
              <div className="flex items-start gap-8">
                {/* Step Number */}
                <div className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl ${index + 1 <= activeStep ? `bg-gradient-to-br ${step.color} text-white` : 'bg-white border-2 border-gray-300 text-gray-400'}`}>
                  {index + 1 <= activeStep ? (
                    <step.icon size={24} />
                  ) : (
                    <span className="text-lg font-bold">{index + 1}</span>
                  )}
                </div>

                {/* Step Card */}
                <div className={`flex-1 ${glassStyle} p-6 ${index + 1 <= activeStep ? 'opacity-100' : 'opacity-70'}`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{step.name}</h3>
                      <p className="text-gray-600">{step.description}</p>
                    </div>
                    <div className="px-3 py-1 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg">
                      <span className="text-xs font-semibold text-gray-700">{step.role}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className={`flex gap-4 ${index + 1 === activeStep ? 'opacity-100' : 'opacity-0'}`}>
                    <button className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-green-500 to-green-700 rounded-lg hover:from-green-600 hover:to-green-800 transition-all flex items-center gap-2">
                      <Icon.Check size={16} /> Approve
                    </button>
                    <button className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-red-500 to-red-700 rounded-lg hover:from-red-600 hover:to-red-800 transition-all flex items-center gap-2">
                      <Icon.X size={16} /> Reject
                    </button>
                    <button className="px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg hover:from-blue-600 hover:to-blue-800 transition-all flex items-center gap-2">
                      <Icon.Upload size={16} /> Upload
                    </button>
                  </div>

                  {/* Sample Data for Current Step */}
                  {index + 1 === activeStep && (
                    <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-200">
                      <h4 className="text-sm font-semibold text-green-800 mb-2">Current Step Details</h4>
                      {index === 0 && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-700">Invoice Number: <span className="font-semibold">{selectedPayment.invoiceNumber}</span></p>
                          <p className="text-sm text-gray-700">Vendor: <span className="font-semibold">{selectedPayment.vendor}</span></p>
                        </div>
                      )}
                      {index === 1 && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-700">GRN Number: <span className="font-semibold">{selectedPayment.grnNumber}</span></p>
                          <p className="text-sm text-gray-700">Material: <span className="font-semibold">{selectedPayment.materialReceived}</span></p>
                        </div>
                      )}
                      {index === 5 && (
                        <div className="space-y-2">
                          <p className="text-sm text-gray-700">TDS Deducted: <span className="font-semibold">{selectedPayment.tdsDeducted}</span></p>
                          <p className="text-sm text-gray-700">Net Payable: <span className="font-semibold">{selectedPayment.netAmount}</span></p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- PAYMENT DASHBOARD COMPONENT ---
const PaymentDashboard = () => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Dashboard</h2>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className={`${glassStyle} p-6`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
              <Icon.FileText size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Payments</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-full bg-yellow-600 rounded-full w-3/4"></div>
          </div>
        </div>

        <div className={`${glassStyle} p-6`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
              <Icon.CheckCircle size={24} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Approved Payments</p>
              <p className="text-2xl font-bold text-gray-900">28</p>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-full bg-green-600 rounded-full w-85%"></div>
          </div>
        </div>

        <div className={`${glassStyle} p-6`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-red-200 rounded-xl flex items-center justify-center">
              <Icon.AlertCircle size={24} className="text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Overdue Payments</p>
              <p className="text-2xl font-bold text-gray-900">3</p>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-full bg-red-600 rounded-full w-1/4"></div>
          </div>
        </div>

        <div className={`${glassStyle} p-6`}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-xl flex items-center justify-center">
              <Icon.CreditCard size={24} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Processed</p>
              <p className="text-2xl font-bold text-gray-900">₹1.2Cr</p>
            </div>
          </div>
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-full bg-purple-600 rounded-full w-2/3"></div>
          </div>
        </div>
      </div>

      {/* Payment Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className={`${glassStyle} p-6`}>
          <h3 className="text-xl font-bold text-gray-900 mb-6">Payment Status Distribution</h3>
          <div className="space-y-4">
            {[
              { status: "Invoice Submitted", count: 5, color: "bg-blue-500" },
              { status: "Under Verification", count: 4, color: "bg-yellow-500" },
              { status: "Approved", count: 2, color: "bg-green-500" },
              { status: "Payment Processing", count: 1, color: "bg-purple-500" },
              { status: "Completed", count: 28, color: "bg-gray-500" }
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.status}</span>
                  <span className="font-semibold">{item.count}</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full">
                  <div className={`h-full ${item.color} rounded-full`} style={{ width: `${(item.count / 40) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Payment Activity */}
        <div className={`${glassStyle} p-6`}>
          <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Payment Activity</h3>
          <div className="space-y-4">
            {[
              { action: "Payment processed for INV-003-2024", amount: "₹7,79,000", vendor: "MNO Cement Corp", time: "2 hours ago" },
              { action: "Manager approved payment", user: "Abhishek Sharma", amount: "₹2,18,500", time: "4 hours ago" },
              { action: "TDS verified and calculated", user: "Accounts Team", invoice: "INV-002-2024", time: "1 day ago" },
              { action: "Quality check completed", user: "Quality Team", vendor: "XYZ Steel Works", time: "2 days ago" }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div>
                  <p className="font-semibold text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">
                    {activity.user ? `by ${activity.user}` : ''}
                    {activity.vendor ? `for ${activity.vendor}` : ''}
                    {activity.amount ? ` • ${activity.amount}` : ''}
                  </p>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// --- NEW PAYMENT FORM COMPONENT ---
const NewPaymentForm = ({ newPayment, setNewPayment }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert("Payment Request Created Successfully!");
    setNewPayment({
      poNumber: "",
      vendor: "",
      invoiceNumber: "",
      invoiceDate: "",
      invoiceAmount: "",
      tdsPercentage: "5",
      paymentMethod: "",
      dueDate: "",
      remarks: ""
    });
  };

  const calculateNetAmount = () => {
    if (!newPayment.invoiceAmount) return "0";
    const amount = parseFloat(newPayment.invoiceAmount.replace(/[^0-9]/g, ''));
    const tds = (amount * parseFloat(newPayment.tdsPercentage)) / 100;
    return `₹${(amount - tds).toLocaleString('en-IN')}`;
  };

  return (
    <div className={`${glassStyle} p-8 max-w-4xl mx-auto`}>
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Create New Payment Request</h2>
      <p className="text-gray-600 mb-8">Submit invoice for payment processing</p>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PO Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">PO Number *</label>
            <input 
              type="text"
              value={newPayment.poNumber}
              onChange={(e) => setNewPayment({...newPayment, poNumber: e.target.value})}
              className={`${inputStyle} w-full`}
              placeholder="Enter PO Number"
              required
            />
          </div>

          {/* Vendor Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Vendor *</label>
            <select 
              value={newPayment.vendor}
              onChange={(e) => setNewPayment({...newPayment, vendor: e.target.value})}
              className={`${inputStyle} w-full`}
              required
            >
              <option value="">Select Vendor</option>
              {VENDORS.map(vendor => (
                <option key={vendor.id} value={vendor.name}>{vendor.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Invoice Number */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Invoice Number *</label>
            <input 
              type="text"
              value={newPayment.invoiceNumber}
              onChange={(e) => setNewPayment({...newPayment, invoiceNumber: e.target.value})}
              className={`${inputStyle} w-full`}
              placeholder="INV-XXX-YYYY"
              required
            />
          </div>

          {/* Invoice Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Invoice Date *</label>
            <input 
              type="date"
              value={newPayment.invoiceDate}
              onChange={(e) => setNewPayment({...newPayment, invoiceDate: e.target.value})}
              className={`${inputStyle} w-full`}
              required
            />
          </div>

          {/* Invoice Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Invoice Amount (₹) *</label>
            <input 
              type="text"
              value={newPayment.invoiceAmount}
              onChange={(e) => setNewPayment({...newPayment, invoiceAmount: e.target.value})}
              className={`${inputStyle} w-full`}
              placeholder="Enter amount"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* TDS Percentage */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">TDS Percentage *</label>
            <select 
              value={newPayment.tdsPercentage}
              onChange={(e) => setNewPayment({...newPayment, tdsPercentage: e.target.value})}
              className={`${inputStyle} w-full`}
              required
            >
              <option value="1">1%</option>
              <option value="2">2%</option>
              <option value="5">5%</option>
              <option value="10">10%</option>
              <option value="0">No TDS</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Method *</label>
            <select 
              value={newPayment.paymentMethod}
              onChange={(e) => setNewPayment({...newPayment, paymentMethod: e.target.value})}
              className={`${inputStyle} w-full`}
              required
            >
              <option value="">Select Method</option>
              {PAYMENT_METHODS.map(method => (
                <option key={method.id} value={method.name}>{method.name} ({method.processingTime})</option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Due Date *</label>
            <input 
              type="date"
              value={newPayment.dueDate}
              onChange={(e) => setNewPayment({...newPayment, dueDate: e.target.value})}
              className={`${inputStyle} w-full`}
              required
            />
          </div>
        </div>

        {/* Amount Calculation Preview */}
        <div className="p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Amount Calculation</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Invoice Amount</p>
              <p className="text-2xl font-bold text-gray-900">{newPayment.invoiceAmount || "₹0"}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">TDS Deduction ({newPayment.tdsPercentage}%)</p>
              <p className="text-2xl font-bold text-yellow-600">
                {newPayment.invoiceAmount ? `₹${(parseFloat(newPayment.invoiceAmount.replace(/[^0-9]/g, '')) * parseFloat(newPayment.tdsPercentage) / 100).toLocaleString('en-IN')}` : "₹0"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Net Payable Amount</p>
              <p className="text-2xl font-bold text-green-600">{calculateNetAmount()}</p>
            </div>
          </div>
        </div>

        {/* Remarks */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Remarks (Optional)</label>
          <textarea 
            value={newPayment.remarks}
            onChange={(e) => setNewPayment({...newPayment, remarks: e.target.value})}
            className={`${inputStyle} w-full h-24`}
            placeholder="Add any special instructions or remarks..."
          />
        </div>

        {/* Document Upload */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Attach Documents *</label>
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
            <Icon.Upload className="mx-auto text-gray-400 mb-2" size={32} />
            <p className="text-gray-600 mb-2">Upload invoice, GRN copy, and other supporting documents</p>
            <p className="text-sm text-gray-500 mb-4">Support files: PDF, JPG, PNG (Max 10MB each)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <Icon.FileText size={20} className="text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-semibold">Invoice Copy</p>
                <p className="text-xs text-gray-500">Required</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <Icon.ClipboardCheck size={20} className="text-green-600 mx-auto mb-2" />
                <p className="text-sm font-semibold">GRN Copy</p>
                <p className="text-xs text-gray-500">Required</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <Icon.FileCheck size={20} className="text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-semibold">Other Docs</p>
                <p className="text-xs text-gray-500">Optional</p>
              </div>
            </div>
            <input type="file" className="hidden" multiple />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4 pt-6">
          <button type="button" className="px-8 py-3 text-sm font-semibold text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-all">
            Save Draft
          </button>
          <button type="submit" className="px-8 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-800 rounded-xl hover:from-green-700 hover:to-green-900 transition-all flex items-center gap-2">
            <Icon.Send size={18} /> Submit Payment Request
          </button>
        </div>
      </form>
    </div>
  );
};

// --- PAYMENT TRACKING TABLE COMPONENT ---
const PaymentTrackingTable = ({ selectedPayment, setSelectedPayment }) => {
  const getStatusColor = (status) => {
    switch(status) {
      case "Invoice Submitted": return "bg-blue-100 text-blue-800";
      case "Under Verification": return "bg-yellow-100 text-yellow-800";
      case "Accounts Verification": return "bg-orange-100 text-orange-800";
      case "Manager Approval": return "bg-purple-100 text-purple-800";
      case "Payment Processed": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Request Tracking</h2>
          <p className="text-gray-600">Track and manage all payment requests</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2">
            <Icon.Filter size={18} /> Filter
          </button>
          <button className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-800 rounded-xl hover:from-green-700 hover:to-green-900 transition-all flex items-center gap-2">
            <Icon.Download size={18} /> Export
          </button>
        </div>
      </div>

      {/* Payment Request Table */}
      <div className={`${glassStyle} overflow-hidden`}>
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
            <tr>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Payment ID</th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Vendor</th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Invoice No.</th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Amount</th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Due Date</th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Current Step</th>
              <th className="py-4 px-6 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {SAMPLE_PAYMENT_REQUESTS.map(payment => (
              <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                <td className="py-4 px-6">
                  <div className="font-bold text-gray-900">{payment.id}</div>
                  <div className="text-sm text-gray-500">PO: {payment.poNumber}</div>
                </td>
                <td className="py-4 px-6">
                  <div className="font-semibold">{payment.vendor}</div>
                </td>
                <td className="py-4 px-6">
                  <div className="font-semibold">{payment.invoiceNumber}</div>
                  <div className="text-sm text-gray-500">{payment.invoiceDate}</div>
                </td>
                <td className="py-4 px-6">
                  <div className="space-y-1">
                    <div className="font-bold text-gray-900">{payment.netAmount}</div>
                    <div className="text-xs text-gray-500">Gross: {payment.invoiceAmount}</div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className={`font-semibold ${new Date(payment.dueDate) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                    {payment.dueDate}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(payment.status)}`}>
                    {payment.status}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span className="text-sm font-semibold">{PAYMENT_STEPS[payment.currentStep - 1]?.name}</span>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setSelectedPayment(payment)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Track Process"
                    >
                      <Icon.Eye size={18} />
                    </button>
                    <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Update Status">
                      <Icon.Edit size={18} />
                    </button>
                    <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors" title="View Documents">
                      <Icon.FileText size={18} />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Urgent">
                      <Icon.AlertCircle size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Timeline for Selected Payment */}
      {selectedPayment.timeline && selectedPayment.timeline.length > 0 && (
        <div className={`${glassStyle} p-6`}>
          <h3 className="text-xl font-bold text-gray-900 mb-6">Timeline for {selectedPayment.id}</h3>
          <div className="space-y-4">
            {selectedPayment.timeline.map((event, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center">
                  <Icon.CheckCircle size={20} className="text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{event.step}</p>
                  <p className="text-sm text-gray-500">by {event.by} on {event.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// --- PAYMENT REPORTS COMPONENT ---
const PaymentReportsSection = () => {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Reports & Analytics</h2>
      
      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`${glassStyle} p-6`}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Payment Processing Time</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Average Processing Time</span>
                <span className="font-semibold">7.2 days</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-full bg-blue-600 rounded-full w-60%"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Quickest Payment</span>
                <span className="font-semibold">3.5 days</span>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div className="h-full bg-green-600 rounded-full w-30%"></div>
              </div>
            </div>
          </div>
        </div>

        <div className={`${glassStyle} p-6`}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">Vendor Payment Summary</h3>
          <div className="space-y-3">
            {[
              { vendor: "ABC Construction", paid: "₹24.5L", pending: "₹4.8L" },
              { vendor: "XYZ Steel Works", paid: "₹18.2L", pending: "₹2.2L" },
              { vendor: "MNO Cement Corp", paid: "₹32.1L", pending: "₹7.8L" }
            ].map((item, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">{item.vendor}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-600">{item.paid}</p>
                  <p className="text-xs text-gray-500">Pending: {item.pending}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${glassStyle} p-6`}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">TDS Summary</h3>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-xl">
              <p className="text-sm text-gray-500">Total TDS Deducted (This Month)</p>
              <p className="text-2xl font-bold text-gray-900">₹2,45,800</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-gray-500">5% TDS</p>
                <p className="font-bold">₹1,85,000</p>
              </div>
              <div className="p-3 bg-yellow-50 rounded-lg">
                <p className="text-xs text-gray-500">2% TDS</p>
                <p className="font-bold">₹60,800</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Reports */}
      <div className={`${glassStyle} p-6`}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">Generate Payment Reports</h3>
          <button className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-green-800 rounded-xl hover:from-green-700 hover:to-green-900 transition-all flex items-center gap-2">
            <Icon.Download size={18} /> Download All Reports
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Monthly Payment Report", icon: Icon.Calendar, desc: "All payments processed this month" },
            { title: "Vendor Payment History", icon: Icon.History, desc: "Complete vendor payment records" },
            { title: "TDS Certificate Report", icon: Icon.FileCheck, desc: "Generate TDS certificates" },
            { title: "Pending Payments Report", icon: Icon.AlertTriangle, desc: "List of all pending payments" },
            { title: "Overdue Payments", icon: Icon.Clock, desc: "Payments past due date" },
            { title: "Payment Efficiency", icon: Icon.TrendingUp, desc: "Processing time analysis" },
            { title: "Bank Reconciliation", icon: Icon.Banknote, desc: "Bank statement reconciliation" },
            { title: "Audit Trail Report", icon: Icon.Shield, desc: "Complete payment audit trail" }
          ].map((report, index) => (
            <div key={index} className="p-6 bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl hover:border-green-300 transition-colors cursor-pointer">
              <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-xl flex items-center justify-center mb-4">
                <report.icon size={24} className="text-green-600" />
              </div>
              <h4 className="font-bold text-gray-900 mb-2">{report.title}</h4>
              <p className="text-sm text-gray-600 mb-4">{report.desc}</p>
              <button className="text-sm font-semibold text-green-600 hover:text-green-800 flex items-center gap-2">
                Generate <Icon.ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PaymentRequestDashboard;