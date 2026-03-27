// AddGuardModal.jsx
import React, { useState, useRef, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";

const AddGuardModal = ({ isOpen, onClose, onSave, guardNames }) => {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    name: "",
    designation: "",
    status: "Present",
    inTime: "09:00",
    outTime: "18:00",
    shift: "Day",
    remarks: ""
  });

  // For Name dropdown
  const [showNameDropdown, setShowNameDropdown] = useState(false);
  const [filteredNames, setFilteredNames] = useState([]);
  const nameDropdownRef = useRef(null);
  const nameInputRef = useRef(null);

  // For Designation dropdown
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  const [filteredDesignations, setFilteredDesignations] = useState([]);
  const designationDropdownRef = useRef(null);
  const designationInputRef = useRef(null);

  // Pre-defined designations for guards
  const [designationOptions] = useState([
    "Security Guard",
    "Senior Security Guard",
    "Security Supervisor",
    "Security Officer",
    "Security Manager",
    "Watchman"
  ]);

  // Shift options
  const shiftOptions = ["Day", "Night", "Morning", "Evening", "General"];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (nameDropdownRef.current && !nameDropdownRef.current.contains(event.target)) {
        setShowNameDropdown(false);
      }
      if (designationDropdownRef.current && !designationDropdownRef.current.contains(event.target)) {
        setShowDesignationDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter names based on input
  useEffect(() => {
    if (formData.name) {
      const filtered = guardNames.filter(name => 
        name.toLowerCase().includes(formData.name.toLowerCase())
      );
      setFilteredNames(filtered);
    } else {
      setFilteredNames(guardNames);
    }
  }, [formData.name, guardNames]);

  // Filter designations based on input
  useEffect(() => {
    if (formData.designation) {
      const filtered = designationOptions.filter(opt => 
        opt.toLowerCase().includes(formData.designation.toLowerCase())
      );
      setFilteredDesignations(filtered);
    } else {
      setFilteredDesignations(designationOptions);
    }
  }, [formData.designation, designationOptions]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Show respective dropdown when typing
    if (name === 'name') {
      setShowNameDropdown(true);
    }
    if (name === 'designation') {
      setShowDesignationDropdown(true);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const selectName = (name) => {
    setFormData(prev => ({ ...prev, name }));
    setShowNameDropdown(false);
  };

  const selectDesignation = (designation) => {
    setFormData(prev => ({ ...prev, designation }));
    setShowDesignationDropdown(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Add Guard Attendance Record
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
              />
            </div>

            {/* Name - COMBOBOX (Type + Dropdown) */}
            <div className="relative" ref={nameDropdownRef}>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                Name * <span className="text-purple-500 font-normal">(Type or select)</span>
              </label>
              <div className="relative">
                <input
                  ref={nameInputRef}
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  onFocus={() => setShowNameDropdown(true)}
                  required
                  placeholder="Type name or select from dropdown"
                  className="w-full p-2.5 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNameDropdown(!showNameDropdown)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronDown size={18} className={`text-gray-500 transition-transform ${showNameDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Name Dropdown Suggestions */}
              {showNameDropdown && filteredNames.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredNames.map((name, idx) => (
                    <div
                      key={idx}
                      onClick={() => selectName(name)}
                      className="px-4 py-2 hover:bg-purple-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      {name}
                    </div>
                  ))}
                  {formData.name && !guardNames.includes(formData.name) && (
                    <div className="px-4 py-2 bg-green-50 text-green-700 border-t border-green-200">
                      ✨ New: "{formData.name}" (will be saved)
                    </div>
                  )}
                </div>
              )}
              {showNameDropdown && filteredNames.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg">
                  <div className="px-4 py-3 text-gray-500">
                    {formData.name ? (
                      <span>✨ New name: "{formData.name}"</span>
                    ) : (
                      <span>No matching names</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Designation - COMBOBOX (Type + Dropdown) */}
            <div className="relative" ref={designationDropdownRef}>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                Designation * <span className="text-purple-500 font-normal">(Type or select)</span>
              </label>
              <div className="relative">
                <input
                  ref={designationInputRef}
                  type="text"
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  onFocus={() => setShowDesignationDropdown(true)}
                  required
                  placeholder="Type designation or select from dropdown"
                  className="w-full p-2.5 pr-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowDesignationDropdown(!showDesignationDropdown)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronDown size={18} className={`text-gray-500 transition-transform ${showDesignationDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Designation Dropdown Suggestions */}
              {showDesignationDropdown && filteredDesignations.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {filteredDesignations.map((designation, idx) => (
                    <div
                      key={idx}
                      onClick={() => selectDesignation(designation)}
                      className="px-4 py-2 hover:bg-purple-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                    >
                      {designation}
                    </div>
                  ))}
                  {formData.designation && !designationOptions.includes(formData.designation) && (
                    <div className="px-4 py-2 bg-green-50 text-green-700 border-t border-green-200">
                      ✨ New: "{formData.designation}" (will be saved)
                    </div>
                  )}
                </div>
              )}
              {showDesignationDropdown && filteredDesignations.length === 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg">
                  <div className="px-4 py-3 text-gray-500">
                    {formData.designation ? (
                      <span>✨ New designation: "{formData.designation}"</span>
                    ) : (
                      <span>No matching designations</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Status */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
              >
                <option value="Present">Present</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
                <option value="Holiday">Holiday</option>
                <option value="Week Off">Week Off</option>
              </select>
            </div>

            {/* Shift */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                Shift *
              </label>
              <select
                name="shift"
                value={formData.shift}
                onChange={handleChange}
                required
                className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
              >
                {shiftOptions.map((shift, idx) => (
                  <option key={idx} value={shift}>{shift}</option>
                ))}
              </select>
            </div>

            {/* In Time */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                In Time
              </label>
              <input
                type="time"
                name="inTime"
                value={formData.inTime}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
              />
            </div>

            {/* Out Time */}
            <div>
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                Out Time
              </label>
              <input
                type="time"
                name="outTime"
                value={formData.outTime}
                onChange={handleChange}
                className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
              />
            </div>

            {/* Remarks - Full Width */}
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500 mb-1.5 block">
                Remarks
              </label>
              <textarea
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                rows="3"
                placeholder="Any additional notes..."
                className="w-full p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="sticky bottom-0 bg-white pt-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-xl"
            >
              Add Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGuardModal;