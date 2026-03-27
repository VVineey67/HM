import React, { useState, useEffect } from "react";
import * as Icon from "lucide-react";

// --- CONSTANTS ---
const PROCESS_STEPS = [
  { id: 1, name: "Need Identified", icon: Icon.Target, color: "bg-blue-500", role: "Site Person", status: "pending", users: ["Site Engineers"] },
  { id: 2, name: "PR Created", icon: Icon.FileText, color: "bg-purple-500", role: "Site Person", status: "pending", users: ["Site Engineers"] },
  { id: 3, name: "PR Approval", icon: Icon.CheckCircle, color: "bg-indigo-500", role: "Procurement Team", status: "pending", users: ["Rashmi Soni", "Gaurav Yadav"] },
  { id: 4, name: "Vendor Selection", icon: Icon.Users, color: "bg-pink-500", role: "Procurement Manager", status: "pending", users: ["Abhishek Kumar", "Harshi Jain"] },
  { id: 5, name: "Quotation Received", icon: Icon.ClipboardList, color: "bg-rose-500", role: "Procurement Manager", status: "pending", users: ["Abhishek Kumar", "Harshi Jain"] },
  { id: 6, name: "Comparison", icon: Icon.Scale, color: "bg-orange-500", role: "Procurement Manager", status: "pending", users: ["Abhishek Kumar", "Harshi Jain"] },
  { id: 7, name: "PO Created", icon: Icon.FileCheck, color: "bg-yellow-500", role: "Procurement Manager", status: "pending", users: ["Abhishek Kumar", "Harshi Jain"] },
  { id: 8, name: "PO Approval", icon: Icon.CheckSquare, color: "bg-lime-500", role: "Procurement Manager", status: "pending", users: ["Abhishek Kumar", "Harshi Jain"] },
  { id: 9, name: "PO Sent", icon: Icon.Send, color: "bg-green-500", role: "Procurement Manager", status: "pending", users: ["Abhishek Kumar", "Harshi Jain"] },
  { id: 10, name: "Vendor Confirms", icon: Icon.MessageSquare, color: "bg-emerald-500", role: "Vendor", status: "pending", users: ["Vendor"] },
  { id: 11, name: "Delivery", icon: Icon.Truck, color: "bg-teal-500", role: "Vendor", status: "pending", users: ["Vendor"] },
  { id: 12, name: "GRN Created", icon: Icon.Package, color: "bg-cyan-500", role: "Store", status: "pending", users: ["Store Person"] },
  { id: 13, name: "Invoice Received", icon: Icon.Receipt, color: "bg-sky-500", role: "Accounts", status: "pending", users: ["Accounts Team"] },
  { id: 14, name: "3-Way Matching", icon: Icon.Link, color: "bg-violet-500", role: "Accounts", status: "pending", users: ["Accounts Team"] },
  { id: 15, name: "Payment Processed", icon: Icon.IndianRupee, color: "bg-fuchsia-500", role: "Accounts", status: "pending", users: ["Accounts Team"] },
  { id: 16, name: "PO Closed", icon: Icon.Lock, color: "bg-gray-700", role: "System", status: "pending", users: ["System"] }
];

const USERS = {
  "Site Engineers": ["Rajesh Kumar", "Mohit Sharma", "Anjali Singh", "Vikram Patel"],
  "Procurement Team": ["Rashmi Soni", "Gaurav Yadav", "Neha Verma"],
  "Procurement Manager": ["Abhishek Kumar", "Harshi Jain", "Rohan Mehta"],
  "Store Person": ["Sanjay Gupta", "Priya Tiwari"],
  "Accounts Team": ["Amit Shah", "Kavita Reddy", "Rahul Desai"],
  "Vendor": ["Steel Suppliers Pvt Ltd", "Cement Corporation", "Electrical Equipment Co"]
};

const VENDORS = [
  { id: 1, name: "Steel Suppliers Pvt Ltd", category: "Steel", rating: 4.5, contact: "9876543210" },
  { id: 2, name: "Cement Corporation", category: "Cement", rating: 4.2, contact: "9876543211" },
  { id: 3, name: "Electrical Equipment Co", category: "Electrical", rating: 4.7, contact: "9876543212" },
  { id: 4, name: "Hardware Solutions", category: "Hardware", rating: 4.0, contact: "9876543213" },
  { id: 5, name: "Paint & Coatings", category: "Paints", rating: 4.3, contact: "9876543214" }
];

// --- STYLING ---
const cardStyle = "bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300";
const buttonStyle = "px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300";

// --- MAIN COMPONENT ---
const POProcessManagement = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [activePO, setActivePO] = useState(null);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [formData, setFormData] = useState({
    site: "B-47",
    material: "",
    quantity: "",
    unit: "Bags",
    urgency: "Normal",
    description: ""
  });

  // Initialize with empty data
  useEffect(() => {
    const sampleQuotations = [
      { id: 1, vendor: "Steel Suppliers Pvt Ltd", material: "Steel Bars", rate: "₹175/pc", total: "₹8,75,000", validity: "30 days" },
      { id: 2, vendor: "Metal Works Ltd", material: "Steel Bars", rate: "₹180/pc", total: "₹9,00,000", validity: "15 days" },
      { id: 3, vendor: "National Steel", material: "Steel Bars", rate: "₹170/pc", total: "₹8,50,000", validity: "45 days" }
    ];
    setQuotations(sampleQuotations);
  }, []);

  const handleCreatePO = () => {
    // Validation: Check if all required fields are filled
    if (!formData.material || !formData.quantity) {
      alert("Please fill all required fields (Material and Quantity)");
      return;
    }
    
    const newPO = {
      id: purchaseOrders.length + 1,
      poNumber: `PO-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
      site: formData.site,
      material: formData.material,
      quantity: `${formData.quantity} ${formData.unit}`,
      vendor: "Not Selected",
      amount: "₹0",
      createdDate: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
      status: "active",
      currentStep: 1,
      steps: PROCESS_STEPS.map(step => ({ 
        ...step, 
        status: step.id <= 1 ? "completed" : "pending"
      }))
    };
    
    setPurchaseOrders([...purchaseOrders, newPO]);
    setActivePO(newPO);
    setCurrentStep(1);
    setShowCreateForm(false);
    
    // Reset form data
    setFormData({
      site: "B-47",
      material: "",
      quantity: "",
      unit: "Bags",
      urgency: "Normal",
      description: ""
    });
  };

  // ✅ AUTOMATIC APPROVAL FLOW
  const handleApprove = (stepId) => {
    if (activePO) {
      // Mark current step as completed
      const updatedSteps = activePO.steps.map(step => 
        step.id === stepId ? { ...step, status: "completed", approved: true } : step
      );
      
      // Move to next step automatically
      const nextStepId = stepId + 1;
      const updatedPO = { 
        ...activePO, 
        steps: updatedSteps,
        currentStep: nextStepId
      };
      
      setActivePO(updatedPO);
      setPurchaseOrders(purchaseOrders.map(po => 
        po.id === activePO.id ? updatedPO : po
      ));
      setCurrentStep(nextStepId);
    }
  };

  // ❌ REJECT FLOW WITH EDIT OPTION
  const handleReject = (stepId) => {
    if (activePO) {
      // If PR Approval is rejected, go back to PR Created step
      const targetStep = 2;
      
      // Reset all steps from targetStep onwards
      const updatedSteps = activePO.steps.map(step => 
        step.id >= targetStep ? { ...step, status: "pending" } : step
      );
      
      const updatedPO = { 
        ...activePO, 
        steps: updatedSteps, 
        currentStep: targetStep 
      };
      
      setActivePO(updatedPO);
      setPurchaseOrders(purchaseOrders.map(po => 
        po.id === activePO.id ? updatedPO : po
      ));
      setCurrentStep(targetStep);
      
      // Show edit form
      setShowEditForm(true);
    }
  };

  // ✅ SAVE EDITED PR AND RESTART FLOW
  const handleSaveEdit = () => {
    if (activePO) {
      // Reset flow from beginning
      const updatedSteps = activePO.steps.map(step => 
        step.id >= 2 ? { ...step, status: "pending" } : step
      );
      
      const updatedPO = { 
        ...activePO, 
        steps: updatedSteps,
        currentStep: 2,
        material: formData.material || activePO.material,
        quantity: `${formData.quantity || activePO.quantity.split(' ')[0]} ${formData.unit || 'Bags'}`,
        site: formData.site || activePO.site
      };
      
      setActivePO(updatedPO);
      setPurchaseOrders(purchaseOrders.map(po => 
        po.id === activePO.id ? updatedPO : po
      ));
      setCurrentStep(2);
      setShowEditForm(false);
      
      // Reset form data
      setFormData({
        site: activePO.site,
        material: activePO.material,
        quantity: activePO.quantity.split(' ')[0],
        unit: activePO.quantity.split(' ')[1] || 'Bags',
        urgency: "Normal",
        description: ""
      });
    }
  };

  const handleVendorSelect = (vendor) => {
    setSelectedVendor(vendor);
    if (activePO) {
      const updatedPO = { ...activePO, vendor: vendor.name };
      setActivePO(updatedPO);
      setPurchaseOrders(purchaseOrders.map(po => 
        po.id === activePO.id ? updatedPO : po
      ));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 text-gray-800 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <Icon.FileCheck className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PO Process Management</h1>
              <p className="text-sm text-gray-600">End-to-end Purchase Order Workflow System</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              className={`${buttonStyle} bg-blue-600 text-white hover:bg-blue-700 shadow-lg hover:shadow-xl`}
              onClick={() => setShowCreateForm(true)}
            >
              <Icon.Plus className="inline mr-2" size={16} /> Create New PO
            </button>
            <button className={`${buttonStyle} bg-white text-gray-700 border border-gray-300 hover:bg-gray-50`}>
              <Icon.Download className="inline mr-2" size={16} /> Export Report
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - PO List */}
          <div className="lg:col-span-1">
            <div className={`${cardStyle} p-6 mb-6`}>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Active Purchase Orders</h2>
              <div className="space-y-4">
                {purchaseOrders.length === 0 ? (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Icon.FileText className="text-gray-400" size={24} />
                    </div>
                    <p className="text-gray-600 mb-2">No Purchase Orders created yet</p>
                    <p className="text-sm text-gray-500 mb-4">Click "Create New PR" to start</p>
                    <button 
                      onClick={() => setShowCreateForm(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all"
                    >
                      Create First PR
                    </button>
                  </div>
                ) : (
                  purchaseOrders.map(po => (
                    <div
                      key={po.id}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${activePO?.id === po.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}
                      onClick={() => {
                        setActivePO(po);
                        setCurrentStep(po.currentStep);
                      }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <span className="text-lg font-bold text-gray-900">{po.poNumber}</span>
                          <span className={`ml-3 px-2 py-1 rounded-full text-xs font-semibold ${po.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                            {po.status === 'active' ? 'Active' : 'Completed'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">{po.createdDate}</span>
                      </div>
                      <p className="text-gray-700 font-medium mb-2">{po.material} - {po.quantity}</p>
                      <p className="text-sm text-gray-600 mb-3">{po.site}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-blue-600">{po.amount}</span>
                        <div className="flex items-center">
                          <div className="h-2 w-24 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${po.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`}
                              style={{ width: `${(po.currentStep / 16) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-semibold text-gray-600 ml-2">{po.currentStep}/16</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Statistics */}
            <div className={`${cardStyle} p-6`}>
              <h2 className="text-xl font-bold text-gray-900 mb-6">Process Statistics</h2>
              <div className="space-y-4">
                <StatCard 
                  icon={<Icon.FileText className="text-blue-600" size={20} />}
                  label="Total PO Created"
                  value={purchaseOrders.length}
                  color="blue"
                />
                <StatCard 
                  icon={<Icon.Clock className="text-orange-600" size={20} />}
                  label="In Progress"
                  value={purchaseOrders.filter(po => po.status === 'active').length}
                  color="orange"
                />
                <StatCard 
                  icon={<Icon.CheckCircle className="text-green-600" size={20} />}
                  label="Completed"
                  value={purchaseOrders.filter(po => po.status === 'completed').length}
                  color="green"
                />
                <StatCard 
                  icon={<Icon.Users className="text-purple-600" size={20} />}
                  label="Active Vendors"
                  value={VENDORS.length}
                  color="purple"
                />
              </div>
            </div>
          </div>

          {/* Middle Column - Process Flow */}
          <div className="lg:col-span-2">
            {activePO ? (
              <>
                {/* Process Header */}
                <div className={`${cardStyle} p-6 mb-6`}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        {activePO.poNumber} - {activePO.material}
                      </h2>
                      <p className="text-gray-600">
                        Current Status: <span className="font-semibold text-blue-600">
                          {PROCESS_STEPS.find(s => s.id === currentStep)?.name || 'Need Identified'}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Site</p>
                      <p className="text-lg font-bold text-gray-900">{activePO.site}</p>
                    </div>
                  </div>

                  {/* Process Timeline */}
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Process Timeline</h3>
                      <div className="flex gap-2">
                        <span className="text-sm text-gray-600">
                          Automatic workflow - No manual next step required
                        </span>
                      </div>
                    </div>
                    
                    {/* Process Steps */}
                    <div className="overflow-x-auto">
                      <div className="flex space-x-4 pb-4 min-w-max">
                        {PROCESS_STEPS.map((step, index) => {
                          const stepStatus = activePO.steps?.find(s => s.id === step.id)?.status || 'pending';
                          const isCurrent = step.id === currentStep;
                          const isCompleted = stepStatus === 'completed';
                          
                          return (
                            <div key={step.id} className="flex flex-col items-center">
                              {/* Step Circle */}
                              <div className="relative">
                                <div
                                  className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all duration-300 ${isCurrent ? 'ring-4 ring-opacity-50 transform scale-110' : ''} ${isCompleted ? step.color : 'bg-gray-300'}`}
                                >
                                  {isCompleted ? (
                                    <Icon.Check size={20} />
                                  ) : (
                                    React.createElement(step.icon, { size: 20 })
                                  )}
                                </div>
                                
                                {/* Connector Line */}
                                {index < PROCESS_STEPS.length - 1 && (
                                  <div className={`absolute top-7 left-full w-8 h-1 ${isCompleted ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-300'}`}></div>
                                )}
                                
                                {/* Step Number */}
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-blue-600">
                                  {step.id}
                                </div>
                              </div>
                              
                              {/* Step Label */}
                              <div className="mt-3 text-center">
                                <p className="text-xs font-semibold text-gray-700 whitespace-nowrap">{step.name}</p>
                                <p className="text-xs text-gray-500">{step.role}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Current Step Actions */}
                  <CurrentStepActions
                    currentStep={currentStep}
                    stepData={PROCESS_STEPS.find(s => s.id === currentStep)}
                    activePO={activePO}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onVendorSelect={handleVendorSelect}
                    selectedVendor={selectedVendor}
                    vendors={VENDORS}
                    quotations={quotations}
                    users={USERS}
                    setActivePO={setActivePO}
                    setPurchaseOrders={setPurchaseOrders}
                    purchaseOrders={purchaseOrders}
                    setShowEditForm={setShowEditForm}
                  />
                </div>

                {/* Process Details */}
                <div className={`${cardStyle} p-6`}>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">Current Step Information</h4>
                      <div className="space-y-3">
                        <DetailItem label="Step" value={PROCESS_STEPS.find(s => s.id === currentStep)?.name} />
                        <DetailItem label="Responsible" value={PROCESS_STEPS.find(s => s.id === currentStep)?.role} />
                        <DetailItem label="Assigned Users" value={
                          <span className="text-blue-600 font-medium">
                            {USERS[PROCESS_STEPS.find(s => s.id === currentStep)?.role]?.join(', ')}
                          </span>
                        } />
                        <DetailItem label="Status" value={
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            activePO.steps?.find(s => s.id === currentStep)?.status === 'completed' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {activePO.steps?.find(s => s.id === currentStep)?.status === 'completed' ? 'Completed' : 'Pending'}
                          </span>
                        } />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-3">PO Information</h4>
                      <div className="space-y-3">
                        <DetailItem label="PO Number" value={activePO.poNumber} />
                        <DetailItem label="Material" value={activePO.material} />
                        <DetailItem label="Quantity" value={activePO.quantity} />
                        <DetailItem label="Vendor" value={activePO.vendor} />
                        <DetailItem label="Amount" value={activePO.amount} />
                        <DetailItem label="Site" value={activePO.site} />
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className={`${cardStyle} p-8 text-center`}>
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Icon.FileText className="text-gray-400" size={32} />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">No Active Purchase Order</h2>
                <p className="text-gray-600 mb-6">Create your first purchase order to start the workflow process</p>
                <button 
                  onClick={() => setShowCreateForm(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
                >
                  <Icon.Plus className="inline mr-2" size={18} /> Create New PR
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Create PO Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Create New Purchase Requisition</h3>
              <button onClick={() => setShowCreateForm(false)} className="text-gray-500 hover:text-gray-700">
                <Icon.X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Site</label>
                <select 
                  value={formData.site}
                  onChange={e => setFormData({...formData, site: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="B-47">B-47 Tower</option>
                  <option value="Skyline">Skyline Mall</option>
                  <option value="Tech Park">Tech Park</option>
                  <option value="JEX">JEX Site</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Material Description</label>
                <input 
                  type="text"
                  value={formData.material}
                  onChange={e => setFormData({...formData, material: e.target.value})}
                  placeholder="e.g., Cement, Steel Bars, Electrical Wires"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                  <input 
                    type="number"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                    placeholder="e.g., 100"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
                  <select 
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="Bags">Bags</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Kg">Kg</option>
                    <option value="Mtr">Mtr</option>
                    <option value="Ltr">Ltr</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Urgency Level</label>
                <select 
                  value={formData.urgency}
                  onChange={e => setFormData({...formData, urgency: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter any additional information or requirements"
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowCreateForm(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreatePO}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
              >
                Create PR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit PR Modal */}
      {showEditForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Edit Purchase Requisition</h3>
              <button onClick={() => setShowEditForm(false)} className="text-gray-500 hover:text-gray-700">
                <Icon.X size={24} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Site</label>
                <select 
                  value={formData.site}
                  onChange={e => setFormData({...formData, site: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="B-47">B-47 Tower</option>
                  <option value="Skyline">Skyline Mall</option>
                  <option value="Tech Park">Tech Park</option>
                  <option value="JEX">JEX Site</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Material Description</label>
                <input 
                  type="text"
                  value={formData.material}
                  onChange={e => setFormData({...formData, material: e.target.value})}
                  placeholder="Enter material description"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                  <input 
                    type="number"
                    value={formData.quantity}
                    onChange={e => setFormData({...formData, quantity: e.target.value})}
                    placeholder="0"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Unit</label>
                  <select 
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Kg">Kg</option>
                    <option value="Mtr">Mtr</option>
                    <option value="Bags">Bags</option>
                    <option value="Ltr">Ltr</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Urgency Level</label>
                <select 
                  value={formData.urgency}
                  onChange={e => setFormData({...formData, urgency: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                >
                  <option value="Normal">Normal</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Additional Notes</label>
                <textarea 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter any additional information"
                  rows="3"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
              </div>
            </div>
            
            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setShowEditForm(false)}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleSaveEdit}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Icon.Save className="inline mr-2" size={18} /> Save & Resubmit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- Current Step Actions Component ---
const CurrentStepActions = ({ 
  currentStep, 
  stepData, 
  activePO, 
  onApprove, 
  onReject, 
  onVendorSelect, 
  selectedVendor, 
  vendors, 
  quotations, 
  users, 
  setActivePO, 
  setPurchaseOrders, 
  purchaseOrders,
  setShowEditForm 
}) => {
  const [showVendors, setShowVendors] = useState(false);
  const [showQuotations, setShowQuotations] = useState(false);
  const [comparisonData, setComparisonData] = useState([]);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [poDetails, setPODetails] = useState({
    poNumber: activePO.poNumber,
    vendor: activePO.vendor,
    terms: "30 days",
    delivery: "15 days",
    payment: "After delivery"
  });

  const handleComparison = () => {
    setComparisonData(quotations);
    setShowQuotations(true);
  };

  const handleGeneratePO = () => {
    if (selectedQuotation) {
      const updatedPO = {
        ...activePO,
        vendor: selectedQuotation.vendor,
        amount: selectedQuotation.total
      };
      setActivePO(updatedPO);
      setPurchaseOrders(purchaseOrders.map(po => 
        po.id === activePO.id ? updatedPO : po
      ));
      onApprove(currentStep);
    }
  };

  const handleSendPO = () => {
    // Simulate sending PO to vendor
    alert(`PO ${activePO.poNumber} sent to ${activePO.vendor}`);
    onApprove(currentStep);
  };

  const handleGRNCreation = () => {
    const updatedPO = {
      ...activePO,
      grnNumber: `GRN-${activePO.poNumber.split('-')[1]}`,
      grnDate: new Date().toLocaleDateString('en-IN')
    };
    setActivePO(updatedPO);
    setPurchaseOrders(purchaseOrders.map(po => 
      po.id === activePO.id ? updatedPO : po
    ));
    onApprove(currentStep);
  };

  const handlePayment = () => {
    const updatedPO = {
      ...activePO,
      paymentDate: new Date().toLocaleDateString('en-IN'),
      paymentRef: `PAY-${Date.now()}`
    };
    setActivePO(updatedPO);
    setPurchaseOrders(purchaseOrders.map(po => 
      po.id === activePO.id ? updatedPO : po
    ));
    onApprove(currentStep);
  };

  const handleClosePO = () => {
    const updatedPO = {
      ...activePO,
      status: "completed",
      closedDate: new Date().toLocaleDateString('en-IN')
    };
    setActivePO(updatedPO);
    setPurchaseOrders(purchaseOrders.map(po => 
      po.id === activePO.id ? updatedPO : po
    ));
    onApprove(currentStep);
  };

  switch(currentStep) {
    case 1: // Need Identified
      return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-blue-900 mb-4">Need Identification</h4>
          <p className="text-blue-800 mb-6">Site person has identified the need for material. Click "Create PR" to proceed.</p>
          <button 
            onClick={() => onApprove(currentStep)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Icon.FileText className="inline mr-2" size={18} /> Create Purchase Requisition
          </button>
        </div>
      );

    case 2: // PR Created
      return (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-purple-900 mb-4">PR Created Successfully</h4>
          <p className="text-purple-800 mb-6">Purchase Requisition has been created. Ready for approval by Procurement Team.</p>
          <div className="flex gap-4">
            <button 
              onClick={() => onApprove(currentStep)}
              className="px-6 py-3 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transition-all shadow-lg hover:shadow-xl"
            >
              Submit for Approval
            </button>
            <button 
              onClick={() => setShowEditForm(true)}
              className="px-6 py-3 bg-white text-purple-700 border border-purple-300 rounded-xl font-semibold hover:bg-purple-50 transition-all"
            >
              <Icon.Edit className="inline mr-2" size={18} /> Edit PR
            </button>
          </div>
        </div>
      );

    case 3: // PR Approval
      return (
        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-indigo-900 mb-4">PR Approval Required</h4>
          <p className="text-indigo-800 mb-4">
            Awaiting approval from Procurement Team: {users["Procurement Team"]?.join(', ')}
          </p>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-indigo-100">
              <h5 className="font-semibold text-gray-900 mb-2">PR Details</h5>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Material" value={activePO.material} small />
                <DetailItem label="Quantity" value={activePO.quantity} small />
                <DetailItem label="Site" value={activePO.site} small />
                <DetailItem label="Urgency" value="Normal" small />
              </div>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => onApprove(currentStep)}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Icon.Check className="inline mr-2" size={18} /> Approve PR
              </button>
              <button 
                onClick={() => onReject(currentStep)}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Icon.X className="inline mr-2" size={18} /> Reject PR
              </button>
            </div>
            <div className="text-sm text-gray-600">
              <Icon.Info className="inline mr-2" size={16} />
              If rejected, PR will be returned to Site Person for modifications.
            </div>
          </div>
        </div>
      );

    case 4: // Vendor Selection
      return (
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-pink-900 mb-4">Vendor Selection</h4>
          <p className="text-pink-800 mb-6">
            Procurement Manager ({users["Procurement Manager"]?.join(', ')}) needs to select vendor.
          </p>
          
          {!selectedVendor ? (
            <>
              <button 
                onClick={() => setShowVendors(true)}
                className="px-6 py-3 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 transition-all shadow-lg hover:shadow-xl mb-4"
              >
                <Icon.Users className="inline mr-2" size={18} /> Select Vendor
              </button>
              
              {showVendors && (
                <div className="bg-white rounded-xl border border-pink-200 p-4">
                  <h5 className="font-semibold text-gray-900 mb-4">Available Vendors</h5>
                  <div className="space-y-3">
                    {vendors.map(vendor => (
                      <div 
                        key={vendor.id}
                        className="p-3 border border-gray-200 rounded-lg hover:border-pink-300 hover:bg-pink-50 cursor-pointer transition-all"
                        onClick={() => {
                          onVendorSelect(vendor);
                          setShowVendors(false);
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-gray-900">{vendor.name}</p>
                            <p className="text-sm text-gray-600">{vendor.category}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center">
                              <Icon.Star className="text-yellow-500 mr-1" size={16} />
                              <span className="font-semibold">{vendor.rating}</span>
                            </div>
                            <p className="text-sm text-gray-600">{vendor.contact}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-xl border border-green-200 p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h5 className="font-semibold text-gray-900">Selected Vendor</h5>
                  <p className="text-green-600 font-semibold">{selectedVendor.name}</p>
                </div>
                <button 
                  onClick={() => onApprove(currentStep)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all"
                >
                  Confirm Selection
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Category" value={selectedVendor.category} small />
                <DetailItem label="Rating" value={selectedVendor.rating} small />
                <DetailItem label="Contact" value={selectedVendor.contact} small />
                <DetailItem label="Status" value="Selected" small />
              </div>
            </div>
          )}
        </div>
      );

    case 5: // Quotation Received
      return (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-rose-900 mb-4">Request Quotations</h4>
          <p className="text-rose-800 mb-6">
            Request quotations from selected vendor: {activePO.vendor}
          </p>
          
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-rose-100">
              <h5 className="font-semibold text-gray-900 mb-2">Quotation Request</h5>
              <p className="text-gray-700 mb-3">Please send quotation request to vendor with the following details:</p>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Material" value={activePO.material} small />
                <DetailItem label="Quantity" value={activePO.quantity} small />
                <DetailItem label="Delivery" value="Site Location" small />
                <DetailItem label="Deadline" value="7 days" small />
              </div>
            </div>
            
            <button 
              onClick={() => {
                alert(`Quotation request sent to ${activePO.vendor}`);
                onApprove(currentStep);
              }}
              className="px-6 py-3 bg-rose-600 text-white rounded-xl font-semibold hover:bg-rose-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Icon.Send className="inline mr-2" size={18} /> Send Quotation Request
            </button>
          </div>
        </div>
      );

    case 6: // Comparison
      return (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-orange-900 mb-4">Quotation Comparison</h4>
          <p className="text-orange-800 mb-6">
            Compare quotations received from multiple vendors.
          </p>
          
          {!showQuotations ? (
            <button 
              onClick={handleComparison}
              className="px-6 py-3 bg-orange-600 text-white rounded-xl font-semibold hover:bg-orange-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Icon.Scale className="inline mr-2" size={18} /> View & Compare Quotations
            </button>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-orange-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-orange-50">
                    <tr>
                      <th className="p-3 text-left font-semibold text-gray-700">Vendor</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Rate</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Total</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Validity</th>
                      <th className="p-3 text-left font-semibold text-gray-700">Select</th>
                    </tr>
                  </thead>
                  <tbody>
                    {quotations.map((quote, index) => (
                      <tr key={quote.id} className={`border-t border-gray-200 ${selectedQuotation?.id === quote.id ? 'bg-blue-50' : ''}`}>
                        <td className="p-3">
                          <div className="font-medium text-gray-900">{quote.vendor}</div>
                          <div className="text-sm text-gray-600">{quote.material}</div>
                        </td>
                        <td className="p-3 font-semibold">{quote.rate}</td>
                        <td className="p-3 font-bold text-blue-600">{quote.total}</td>
                        <td className="p-3">{quote.validity}</td>
                        <td className="p-3">
                          <button 
                            onClick={() => setSelectedQuotation(quote)}
                            className={`px-3 py-1 rounded-lg ${selectedQuotation?.id === quote.id ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                          >
                            {selectedQuotation?.id === quote.id ? 'Selected' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="flex gap-4">
                <button 
                  onClick={handleGeneratePO}
                  disabled={!selectedQuotation}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${selectedQuotation ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg hover:shadow-xl' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                >
                  Generate Purchase Order
                </button>
                <button 
                  onClick={() => setShowQuotations(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      );

    case 7: // PO Created
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-yellow-900 mb-4">PO Details</h4>
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-yellow-100">
              <h5 className="font-semibold text-gray-900 mb-4">Purchase Order Information</h5>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="PO Number" value={poDetails.poNumber} small />
                <DetailItem label="Vendor" value={poDetails.vendor} small />
                <DetailItem label="Material" value={activePO.material} small />
                <DetailItem label="Quantity" value={activePO.quantity} small />
                <DetailItem label="Amount" value={activePO.amount} small />
                <DetailItem label="Payment Terms" value={poDetails.terms} small />
                <DetailItem label="Delivery" value={poDetails.delivery} small />
                <DetailItem label="Site" value={activePO.site} small />
              </div>
            </div>
            
            <button 
              onClick={() => {
                const updatedPO = { ...activePO, ...poDetails };
                setActivePO(updatedPO);
                onApprove(currentStep);
              }}
              className="px-6 py-3 bg-yellow-600 text-white rounded-xl font-semibold hover:bg-yellow-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Icon.FileCheck className="inline mr-2" size={18} /> Save PO Details & Continue
            </button>
          </div>
        </div>
      );

    case 8: // PO Approval
      return (
        <div className="bg-lime-50 border border-lime-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-lime-900 mb-4">PO Approval Required</h4>
          <p className="text-lime-800 mb-6">
            Final approval required from Procurement Manager before sending to vendor.
          </p>
          
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-lime-100">
              <h5 className="font-semibold text-gray-900 mb-2">PO Summary</h5>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-2xl font-bold text-blue-600">{activePO.amount}</p>
                  <p className="text-gray-600">{activePO.material}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{activePO.vendor}</p>
                  <p className="text-sm text-gray-600">{activePO.poNumber}</p>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => onApprove(currentStep)}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Icon.Check className="inline mr-2" size={18} /> Approve PO
              </button>
              <button 
                onClick={() => onReject(currentStep)}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all shadow-lg hover:shadow-xl"
              >
                <Icon.X className="inline mr-2" size={18} /> Reject PO
              </button>
            </div>
          </div>
        </div>
      );

    case 9: // PO Sent
      return (
        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-green-900 mb-4">Send PO to Vendor</h4>
          <p className="text-green-800 mb-6">
            Ready to send Purchase Order to vendor: {activePO.vendor}
          </p>
          
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-green-100">
              <h5 className="font-semibold text-gray-900 mb-2">Delivery Information</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Delivery Address</label>
                  <input 
                    type="text"
                    defaultValue={activePO.site}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Delivery Date</label>
                  <input 
                    type="date"
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-green-500 outline-none"
                  />
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleSendPO}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Icon.Send className="inline mr-2" size={18} /> Send PO to Vendor
            </button>
          </div>
        </div>
      );

    case 12: // GRN Created
      return (
        <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-cyan-900 mb-4">Goods Receipt Note</h4>
          <p className="text-cyan-800 mb-6">
            Store person needs to create GRN for received materials.
          </p>
          
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-cyan-100">
              <h5 className="font-semibold text-gray-900 mb-2">Received Materials</h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Quantity Received</label>
                  <input 
                    type="text"
                    defaultValue={activePO.quantity}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-cyan-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Quality Check</label>
                  <select className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-cyan-500 outline-none">
                    <option value="passed">Passed</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handleGRNCreation}
              className="px-6 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Icon.Check className="inline mr-2" size={18} /> Create GRN
            </button>
          </div>
        </div>
      );

    case 15: // Payment Processed
      return (
        <div className="bg-fuchsia-50 border border-fuchsia-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-fuchsia-900 mb-4">Payment Processing</h4>
          <p className="text-fuchsia-800 mb-6">
            Accounts team needs to process payment to vendor.
          </p>
          
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-fuchsia-100">
              <h5 className="font-semibold text-gray-900 mb-2">Payment Details</h5>
              <div className="grid grid-cols-2 gap-4">
                <DetailItem label="Amount Payable" value={activePO.amount} small />
                <DetailItem label="Vendor" value={activePO.vendor} small />
                <DetailItem label="Payment Mode" value="Bank Transfer" small />
                <DetailItem label="Account Number" value="XXXXXX7890" small />
              </div>
            </div>
            
            <button 
              onClick={handlePayment}
              className="px-6 py-3 bg-fuchsia-600 text-white rounded-xl font-semibold hover:bg-fuchsia-700 transition-all shadow-lg hover:shadow-xl"
            >
              <Icon.IndianRupee className="inline mr-2" size={18} /> Process Payment
            </button>
          </div>
        </div>
      );

    case 16: // PO Closed
      return (
        <div className="bg-gray-100 border border-gray-300 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Close Purchase Order</h4>
          <p className="text-gray-700 mb-6">
            All processes completed. Ready to close this Purchase Order.
          </p>
          
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <h5 className="font-semibold text-gray-900 mb-2">Process Summary</h5>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">PR Created:</span>
                  <span className="font-semibold">✓ Completed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Vendor Selection:</span>
                  <span className="font-semibold">✓ Completed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">PO Generated:</span>
                  <span className="font-semibold">✓ Completed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Material Delivered:</span>
                  <span className="font-semibold">✓ Completed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Processed:</span>
                  <span className="font-semibold">✓ Completed</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={() => {
                handleClosePO();
                alert(`PO ${activePO.poNumber} has been successfully completed!`);
                // Reset to create new PO
                setActivePO(null);
              }}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
            >
              Mark as Complete
            </button>
          </div>
        </div>
      );

    default:
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">{stepData?.name}</h4>
          <p className="text-gray-700 mb-6">
            This step is currently in progress. Click "Mark as Complete" to continue the workflow.
          </p>
          <button 
            onClick={() => onApprove(currentStep)}
            className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            Mark as Complete
          </button>
        </div>
      );
  }
};

// --- Helper Components ---
const StatCard = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-800',
    orange: 'bg-orange-100 text-orange-800',
    green: 'bg-green-100 text-green-800',
    purple: 'bg-purple-100 text-purple-800'
  };

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colorClasses[color].split(' ')[0]}`}>
          {icon}
        </div>
        <span className="font-medium text-gray-700">{label}</span>
      </div>
      <span className={`text-xl font-bold ${colorClasses[color].split(' ')[1]}`}>{value}</span>
    </div>
  );
};

const DetailItem = ({ label, value, small = false }) => (
  <div>
    <p className={`${small ? 'text-xs' : 'text-sm'} text-gray-600 mb-1`}>{label}</p>
    <p className={`${small ? 'text-sm' : 'text-base'} font-semibold text-gray-900`}>{value}</p>
  </div>
);

export default POProcessManagement;