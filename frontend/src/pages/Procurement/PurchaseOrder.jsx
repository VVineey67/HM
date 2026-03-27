import React, { useState } from 'react';

const PurchaseOrder = ({ project }) => {
  const [formData, setFormData] = useState({
    // Header
    poRefNo: '',
    poNo: '',
    date: '',
    
    // Left Box - Vendor Details
    vendorCompany: '',
    vendorAddress: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    vendorGSTIN: '',
    vendorPAN: '',
    vendorContactPerson: '',
    vendorMobile: '',
    vendorEmail: '',
    
    // Right Box - Company Details
    companyName: '',
    siteAddress: '',
    companyContactPerson: '',
    companyContactPhone: '',
    billingAddress: '',
    companyGSTIN: '',
    
    // Requisition
    requisitionBy: '',
    subject: '',
    
    // Items Table
    items: [
      {
        srNo: '1',
        description: '',
        unit: '',
        qty: '',
        unitPrice: '',
        discount: '',
        tax: '',
        amount: '',
      },
    ],
    
    // Additional Charges
    freightCharges: '',
    
    // Totals
    subtotal: '',
    taxAmount: '',
    grandTotal: '',
    totalInWords: '',
    
    // Notes
    notes: '',
    
    // Manual Entry Sections
    termsConditions: '',
    invoiceDetails: '',
    termination: '',
    paymentTerms: '',
    governingLaws: '',
  });

  const handleChange = (e, index, field) => {
    if (index !== undefined) {
      const newItems = [...formData.items];
      newItems[index][field] = e.target.value;
      
      // Calculate amount if qty or unitPrice changes
      if (field === 'qty' || field === 'unitPrice' || field === 'discount' || field === 'tax') {
        const qty = parseFloat(newItems[index].qty) || 0;
        const unitPrice = parseFloat(newItems[index].unitPrice) || 0;
        const discount = parseFloat(newItems[index].discount) || 0;
        const tax = parseFloat(newItems[index].tax) || 0;
        
        const amountBeforeTax = qty * unitPrice;
        const discountAmount = amountBeforeTax * (discount / 100);
        const amountAfterDiscount = amountBeforeTax - discountAmount;
        const taxAmount = amountAfterDiscount * (tax / 100);
        const totalAmount = amountAfterDiscount + taxAmount;
        
        newItems[index].amount = totalAmount.toFixed(2);
      }
      
      setFormData({ ...formData, items: newItems });
      calculateTotals(newItems);
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const calculateTotals = (items) => {
    let itemsTotal = 0;
    items.forEach(item => {
      itemsTotal += parseFloat(item.amount) || 0;
    });
    
    const freight = parseFloat(formData.freightCharges) || 0;
    const subtotal = itemsTotal + freight;
    
    setFormData(prev => ({
      ...prev,
      subtotal: subtotal.toFixed(2),
      grandTotal: subtotal.toFixed(2),
    }));
  };

  const handleAddItem = () => {
    const newItem = {
      srNo: `${formData.items.length + 1}`,
      description: '',
      unit: '',
      qty: '',
      unitPrice: '',
      discount: '',
      tax: '',
      amount: '',
    };
    
    setFormData({
      ...formData,
      items: [...formData.items, newItem]
    });
  };

  const handleRemoveItem = (index) => {
    if (formData.items.length <= 1) return;
    
    const newItems = formData.items.filter((_, i) => i !== index);
    
    // Update serial numbers
    newItems.forEach((item, idx) => {
      item.srNo = `${idx + 1}`;
    });
    
    setFormData({ ...formData, items: newItems });
    calculateTotals(newItems);
  };

  const handleExportPDF = () => {
    try {
      const printWindow = window.open('', '_blank');
      
      if (!printWindow) {
        alert('Please allow pop-ups for this site to generate PDF');
        return;
      }

      const htmlContent = generatePDFHTML();
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Purchase Order - ${formData.poRefNo || 'Draft'}</title>
          <style>
            @page {
              size: A4;
              margin: 15mm;
            }
            
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              color: #000;
              font-size: 11px;
              line-height: 1.3;
            }
            
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
              padding-top: 10px;
            }
            
            .header-title {
              flex: 2;
              text-align: center;
            }
            
            .header-image {
              flex: 1;
              text-align: right;
            }
            
            .header-image img {
              max-height: 60px;
              max-width: 150px;
              height: auto;
            }
            
            .ref-details {
              margin-bottom: 15px;
            }
            
            .ref-line {
              margin-bottom: 5px;
            }
            
            .two-boxes {
              display: flex;
              gap: 15px;
              margin-bottom: 15px;
            }
            
            .box {
              flex: 1;
              border: 1px solid #000;
              padding: 10px;
            }
            
            .inner-box {
              border: 1px solid #666;
              padding: 8px;
              margin-bottom: 10px;
              background-color: #f9f9f9;
            }
            
            .inner-box-line {
              margin-bottom: 3px;
            }
            
            .box-title {
              font-weight: bold;
              margin-bottom: 10px;
              font-size: 12px;
            }
            
            .detail-line {
              margin-bottom: 6px;
              display: flex;
            }
            
            .label {
              font-weight: bold;
              width: 120px;
              flex-shrink: 0;
            }
            
            .value {
              flex: 1;
            }
            
            .address-block {
              margin-bottom: 8px;
            }
            
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 15px 0;
              font-size: 10px;
              page-break-inside: avoid;
            }
            
            .items-table th, .items-table td {
              border: 1px solid #000;
              padding: 5px 6px;
              text-align: left;
            }
            
            .items-table th {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            
            .items-table .text-center {
              text-align: center;
            }
            
            .items-table .text-right {
              text-align: right;
            }
            
            .divider {
              border-top: 1px solid #000;
              margin: 10px 0;
            }
            
            .bold {
              font-weight: bold;
            }
            
            .requisition-line {
              margin-bottom: 8px;
            }
            
            .subject-line {
              margin-bottom: 12px;
            }
            
            .manual-section {
              margin-bottom: 15px;
              page-break-inside: avoid;
            }
            
            .manual-title {
              font-weight: bold;
              margin-bottom: 5px;
              font-size: 12px;
            }
            
            .manual-content {
              min-height: 40px;
              padding-bottom: 5px;
            }
            
            .terms-content {
              line-height: 1.5;
            }
            
            .terms-content div {
              margin-bottom: 8px;
            }
            
            .signature-section {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
              page-break-inside: avoid;
            }
            
            .signature-box {
              width: 45%;
              text-align: center;
            }
            
            .signature-line {
              border-top: 1px solid #000;
              margin-top: 60px;
              padding-top: 5px;
            }
            
            .signature-details {
              text-align: left;
              margin-top: 10px;
              margin-left: 10px;
            }
            
            .signature-detail {
              margin-bottom: 5px;
              padding: 0 10px;
            }
            
            .page-footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              font-size: 9px;
              color: #666;
              padding: 8px 0;
              border-top: 1px solid #ccc;
              background-color: white;
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 20px;
            }
            
            .company-footer {
              text-align: left;
            }
            
            .page-info {
              text-align: right;
            }
            
            @media print {
              body {
                margin: 0;
                padding: 0;
              }
              
              .page-footer {
                position: fixed;
                bottom: 0;
              }
            }
          </style>
        </head>
        <body>
          ${htmlContent}
          
          <div class="page-footer">
            <div class="company-footer">
              <strong>${formData.companyName || ''}</strong>
            </div>
            <div class="page-info">
              Page <span class="page-number">1</span>
            </div>
          </div>
          
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            }
          </script>
        </body>
        </html>
      `);
      
      printWindow.document.close();
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Error generating PDF. Please try printing the page instead (Ctrl+P).');
    }
  };

  const generatePDFHTML = () => {
    const formatIndianNumber = (num) => {
      if (!num || num === '' || num === '0') return '0.00';
      const numStr = parseFloat(num).toFixed(2);
      const [whole, decimal] = numStr.split('.');
      if (whole.length <= 3) return numStr;
      
      const lastThree = whole.substring(whole.length - 3);
      const otherNumbers = whole.substring(0, whole.length - 3);
      const formatted = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + "," + lastThree;
      return formatted + (decimal ? '.' + decimal : '.00');
    };

    const formattedSubtotal = formatIndianNumber(formData.subtotal);
    const formattedGrandTotal = formatIndianNumber(formData.grandTotal);
    const formattedFreight = formData.freightCharges ? formatIndianNumber(formData.freightCharges) : '0.00';

    const formatTermsConditions = (terms) => {
      if (!terms) return '';
      
      const lines = terms.split('\n');
      
      return lines
        .filter(line => line.trim() !== '')
        .map(line => {
          return `<div style="margin-bottom: 8px;">${line.trim()}</div>`;
        })
        .join('');
    };

    return `
      <div style="font-family: Arial, sans-serif; padding: 10px; padding-bottom: 40px;">
        <!-- Header with Image on Right Side -->
        <div class="header-container">
          <div style="flex: 1;"></div>
          <div class="header-title">
            <h1 style="font-size: 18px; font-weight: bold; margin: 0 0 10px 0; text-transform: uppercase;">PURCHASE ORDER</h1>
          </div>
          <div class="header-image">
            <img src="/LogoBootes.png" alt="Company Logo" />
          </div>
        </div>
        
        <div class="two-boxes">
          <div class="box">
            <!-- Inner box for Ref No and WO No -->
            <div class="inner-box">
              <div class="inner-box-line">
                <strong>Ref. No:</strong> ${formData.poRefNo || ''}
              </div>
              <div class="inner-box-line">
                <strong>PO. No:</strong> ${formData.poNo || ''}
              </div>
            </div>
            
            <div class="box-title">Vendor Details</div>
            <div style="font-weight: bold; margin-bottom: 8px;">${formData.vendorCompany || ''}</div>
            
            <div class="address-block">
              <div class="label">Address:</div>
              <div class="value">${formData.vendorAddress ? formData.vendorAddress.replace(/\n/g, '<br>') : ''}</div>
            </div>
            
            <div class="box-title" style="margin-top: 10px;">Bank Details</div>
            
            <div class="detail-line">
              <div class="label">Bank Name:</div>
              <div class="value">${formData.bankName || ''}</div>
            </div>
            
            <div class="detail-line">
              <div class="label">Account Number:</div>
              <div class="value">${formData.accountNumber || ''}</div>
            </div>
            
            <div class="detail-line">
              <div class="label">IFSC Code:</div>
              <div class="value">${formData.ifscCode || ''}</div>
            </div>
            
            <div class="detail-line">
              <div class="label">GSTIN:</div>
              <div class="value">${formData.vendorGSTIN || ''}</div>
            </div>
            
            <div class="detail-line">
              <div class="label">PAN:</div>
              <div class="value">${formData.vendorPAN || ''}</div>
            </div>
            
            <div class="detail-line">
              <div class="label">Contact Person:</div>
              <div class="value">${formData.vendorContactPerson || ''}</div>
            </div>
            
            <div class="detail-line">
              <div class="label">Mobile Number:</div>
              <div class="value">${formData.vendorMobile || ''}</div>
            </div>
            
            <div class="detail-line">
              <div class="label">Email:</div>
              <div class="value">${formData.vendorEmail || ''}</div>
            </div>
          </div>
          
          <div class="box">
            <!-- Inner box for Date -->
            <div class="inner-box">
              <div class="inner-box-line">
                <strong>Date:</strong> ${formData.date || ''}
              </div>
            </div>
            
            <div class="box-title">Company Details</div>
            <div style="font-weight: bold; margin-bottom: 8px;">${formData.companyName || ''}</div>
            
            <div class="address-block">
              <div class="label">Site Address:</div>
              <div class="value">${formData.siteAddress ? formData.siteAddress.replace(/\n/g, '<br>') : ''}</div>
            </div>
            
            <div class="detail-line">
              <div class="label">Contact Person:</div>
              <div class="value">${formData.companyContactPerson || ''}</div>
            </div>
            
            <div class="detail-line">
              <div class="label">Contact Number:</div>
              <div class="value">${formData.companyContactPhone || ''}</div>
            </div>
            
            <div class="address-block">
              <div class="label">Billing Address:</div>
              <div class="value">${formData.billingAddress ? formData.billingAddress.replace(/\n/g, '<br>') : ''}</div>
            </div>
            
            <div class="detail-line">
              <div class="label">GSTIN:</div>
              <div class="value">${formData.companyGSTIN || ''}</div>
            </div>
          </div>
        </div>
        
        <div class="requisition-line">
          <strong>Requisition by:</strong> ${formData.requisitionBy || ''}
        </div>
        
        <div class="subject-line">
          <strong>Subject:</strong> ${formData.subject || ''}
        </div>
        
        <div style="margin-bottom: 15px;">
          <div>Dear Sir/Madam,</div>
          <div>With reference to our discussion and mutual agreement, we are hereby ordering following item given in item description to our above-mentioned site.</div>
        </div>
        
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 5%;" class="text-center">Sr. No.</th>
              <th style="width: 35%;">Item & Description</th>
              <th style="width: 8%;" class="text-center">Unit</th>
              <th style="width: 8%;" class="text-center">Qty.</th>
              <th style="width: 12%;" class="text-right">Unit Price(₹)</th>
              <th style="width: 10%;" class="text-center">Discount(%)</th>
              <th style="width: 8%;" class="text-center">Tax(%)</th>
              <th style="width: 14%;" class="text-right">Amount(₹)</th>
            </tr>
          </thead>
          <tbody>
            ${formData.items.map((item, index) => {
              const formattedUnitPrice = item.unitPrice ? formatIndianNumber(item.unitPrice) : '0.00';
              const formattedAmount = item.amount ? formatIndianNumber(item.amount) : '0.00';
              return `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>${item.description || ''}</td>
                  <td class="text-center">${item.unit || ''}</td>
                  <td class="text-center">${item.qty || ''}</td>
                  <td class="text-right">${formattedUnitPrice}</td>
                  <td class="text-center">${item.discount || ''}</td>
                  <td class="text-center">${item.tax || ''}</td>
                  <td class="text-right">${formattedAmount}</td>
                </tr>
              `;
            }).join('')}
            
            <tr>
              <td class="text-center">${formData.items.length + 1}</td>
              <td>Freight and Forwarding Charges</td>
              <td class="text-center">Lot</td>
              <td class="text-center">1.00</td>
              <td class="text-right">${formattedFreight}</td>
              <td class="text-center"></td>
              <td class="text-center"></td>
              <td class="text-right">${formattedFreight}</td>
            </tr>
          </tbody>
        </table>
        
        <div style="margin: 15px 0; font-size: 11px; text-align: right;">
          <div style="margin: 5px 0;"><strong>Subtotal:</strong> ₹${formattedSubtotal}</div>
          <div style="margin: 5px 0;"><strong>Tax Amount:</strong> ₹${formData.taxAmount || ''}</div>
          <div style="margin: 5px 0;"><strong>Grand Total:</strong> ₹${formattedGrandTotal}</div>
          <div style="margin-top: 10px;">
            Total Value of purchase order ₹${formattedGrandTotal} (${formData.totalInWords || ''})
          </div>
        </div>
        
        <div class="divider"></div>
        
        <div style="margin-bottom: 15px;">
          <div class="box-title">Notes:</div>
          <div>${formData.notes ? formData.notes.replace(/\n/g, '<br>') : ''}</div>
        </div>
        
        <div class="divider"></div>
        
        <div class="manual-section">
          <div class="manual-title">Terms & Conditions:</div>
          <div class="terms-content">
            ${formatTermsConditions(formData.termsConditions) || ''}
          </div>
        </div>
        
        <div class="manual-section">
          <div class="manual-title">Invoice Details:</div>
          <div class="manual-content">${formData.invoiceDetails ? formData.invoiceDetails.replace(/\n/g, '<br>') : ''}</div>
        </div>
        
        <div class="manual-section">
          <div class="manual-title">Termination:</div>
          <div class="manual-content">${formData.termination ? formData.termination.replace(/\n/g, '<br>') : ''}</div>
        </div>
        
        <div class="manual-section">
          <div class="manual-title">Payment Terms:</div>
          <div class="manual-content">${formData.paymentTerms ? formData.paymentTerms.replace(/\n/g, '<br>') : ''}</div>
        </div>
        
        <div class="manual-section">
          <div class="manual-title">Governing Laws:</div>
          <div class="manual-content">${formData.governingLaws ? formData.governingLaws.replace(/\n/g, '<br>') : ''}</div>
        </div>
        
        <div class="signature-section">
          <div class="signature-box">
            <div class="bold">For ${formData.companyName || ''}</div>
            <div class="signature-line"></div>
            <div>Authorized Signatory</div>
            <div class="signature-details">
              <div class="signature-detail">
                Name:
              </div>
              <div class="signature-detail">
                Designation:
              </div>
              <div class="signature-detail">
                Date:
              </div>
            </div>
          </div>
          
          <div class="signature-box">
            <div class="bold">For ${formData.vendorCompany || ''}</div>
            <div class="signature-line"></div>
            <div>Authorized Signatory</div>
            <div class="signature-details">
              <div class="signature-detail">
                Name:
              </div>
              <div class="signature-detail">
                Designation:
              </div>
              <div class="signature-detail">
                Date:
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  const handleSave = () => {
    if (!formData.poRefNo) {
      alert('Please enter PO Reference Number');
      return;
    }
    alert('Purchase Order saved successfully!');
  };

  const handleClearForm = () => {
    if (window.confirm('Are you sure you want to clear all data?')) {
      setFormData({
        poRefNo: '',
        poNo: '',
        date: '',
        vendorCompany: '',
        vendorAddress: '',
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        vendorGSTIN: '',
        vendorPAN: '',
        vendorContactPerson: '',
        vendorMobile: '',
        vendorEmail: '',
        companyName: '',
        siteAddress: '',
        companyContactPerson: '',
        companyContactPhone: '',
        billingAddress: '',
        companyGSTIN: '',
        requisitionBy: '',
        subject: '',
        items: [{
          srNo: '1',
          description: '',
          unit: '',
          qty: '',
          unitPrice: '',
          discount: '',
          tax: '',
          amount: '',
        }],
        freightCharges: '',
        subtotal: '',
        taxAmount: '',
        grandTotal: '',
        totalInWords: '',
        notes: '',
        termsConditions: '',
        invoiceDetails: '',
        termination: '',
        paymentTerms: '',
        governingLaws: '',
      });
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Purchase Order Form</h2>
        <div className="flex items-center">
          <span className="text-gray-600 mr-2">Project:</span>
          <span className="font-medium text-gray-800">{project?.name || 'No project selected'}</span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="border border-gray-200 p-4 rounded-lg bg-white">
          <h3 className="font-bold mb-4 text-lg border-b pb-2 text-gray-700">PO Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PO Ref. No:*</label>
              <input 
                type="text" 
                name="poRefNo" 
                value={formData.poRefNo} 
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter PO Reference Number"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">PO No:</label>
              <input 
                type="text" 
                name="poNo" 
                value={formData.poNo} 
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter PO Number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date:</label>
              <input 
                type="text" 
                name="date" 
                value={formData.date} 
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter date"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 p-4 rounded-lg bg-white">
            <h3 className="font-bold mb-4 text-lg border-b pb-2 text-gray-700">Vendor Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name:</label>
                <input 
                  type="text" 
                  name="vendorCompany" 
                  value={formData.vendorCompany} 
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter vendor company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address:</label>
                <textarea 
                  name="vendorAddress" 
                  value={formData.vendorAddress} 
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter vendor address"
                />
              </div>
              
              <h4 className="font-bold mt-6 mb-3 text-gray-700 border-b pb-2">Bank Details</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name:</label>
                <input 
                  type="text" 
                  name="bankName" 
                  value={formData.bankName} 
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter bank name"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Account Number:</label>
                  <input 
                    type="text" 
                    name="accountNumber" 
                    value={formData.accountNumber} 
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter account number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IFSC Code:</label>
                  <input 
                    type="text" 
                    name="ifscCode" 
                    value={formData.ifscCode} 
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter IFSC code"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GSTIN:</label>
                  <input 
                    type="text" 
                    name="vendorGSTIN" 
                    value={formData.vendorGSTIN} 
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter GSTIN"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PAN:</label>
                  <input 
                    type="text" 
                    name="vendorPAN" 
                    value={formData.vendorPAN} 
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter PAN"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person:</label>
                  <input 
                    type="text" 
                    name="vendorContactPerson" 
                    value={formData.vendorContactPerson} 
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter contact person"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number:</label>
                  <input 
                    type="text" 
                    name="vendorMobile" 
                    value={formData.vendorMobile} 
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter mobile number"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
                <input 
                  type="text" 
                  name="vendorEmail" 
                  value={formData.vendorEmail} 
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email"
                />
              </div>
            </div>
          </div>

          <div className="border border-gray-200 p-4 rounded-lg bg-white">
            <h3 className="font-bold mb-4 text-lg border-b pb-2 text-gray-700">Company Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name:</label>
                <input 
                  type="text" 
                  name="companyName" 
                  value={formData.companyName} 
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter company name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Site Address:</label>
                <textarea 
                  name="siteAddress" 
                  value={formData.siteAddress} 
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter site address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person:</label>
                <input 
                  type="text" 
                  name="companyContactPerson" 
                  value={formData.companyContactPerson} 
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter contact person"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Number:</label>
                <input 
                  type="text" 
                  name="companyContactPhone" 
                  value={formData.companyContactPhone} 
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter contact number"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Billing Address:</label>
                <textarea 
                  name="billingAddress" 
                  value={formData.billingAddress} 
                  onChange={handleChange}
                  rows="3"
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter billing address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company GSTIN:</label>
                <input 
                  type="text" 
                  name="companyGSTIN" 
                  value={formData.companyGSTIN} 
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter company GSTIN"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 p-4 rounded-lg bg-white">
            <h3 className="font-bold mb-4 text-lg border-b pb-2 text-gray-700">Requisition Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requisition By:</label>
                <input 
                  type="text" 
                  name="requisitionBy" 
                  value={formData.requisitionBy} 
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter requester name"
                />
              </div>
            </div>
          </div>
          <div className="border border-gray-200 p-4 rounded-lg bg-white">
            <h3 className="font-bold mb-4 text-lg border-b pb-2 text-gray-700">Subject</h3>
            <div>
              <input 
                type="text" 
                name="subject" 
                value={formData.subject} 
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter subject"
              />
            </div>
          </div>
        </div>

        <div className="border border-gray-200 p-4 rounded-lg mb-6 bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-700">Items Details</h3>
            <button
              onClick={handleAddItem}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:ring-2 focus:ring-blue-300"
            >
              + Add Item
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 p-3 text-left text-sm font-medium text-gray-700">Sr. No.</th>
                  <th className="border border-gray-300 p-3 text-left text-sm font-medium text-gray-700">Item & Description</th>
                  <th className="border border-gray-300 p-3 text-left text-sm font-medium text-gray-700">Unit</th>
                  <th className="border border-gray-300 p-3 text-left text-sm font-medium text-gray-700">Qty</th>
                  <th className="border border-gray-300 p-3 text-left text-sm font-medium text-gray-700">Unit Price (₹)</th>
                  <th className="border border-gray-300 p-3 text-left text-sm font-medium text-gray-700">Discount (%)</th>
                  <th className="border border-gray-300 p-3 text-left text-sm font-medium text-gray-700">Tax (%)</th>
                  <th className="border border-gray-300 p-3 text-left text-sm font-medium text-gray-700">Amount (₹)</th>
                  <th className="border border-gray-300 p-3 text-left text-sm font-medium text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {formData.items.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-2">
                      <input 
                        value={item.srNo} 
                        className="w-full p-2 text-center bg-transparent"
                        readOnly
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input 
                        value={item.description} 
                        onChange={(e) => handleChange(e, index, 'description')}
                        className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter item description"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input 
                        value={item.unit} 
                        onChange={(e) => handleChange(e, index, 'unit')}
                        className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                        placeholder="Unit"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input 
                        type="number"
                        value={item.qty} 
                        onChange={(e) => handleChange(e, index, 'qty')}
                        className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                        placeholder="0"
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input 
                        type="number"
                        value={item.unitPrice} 
                        onChange={(e) => handleChange(e, index, 'unitPrice')}
                        className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input 
                        type="number"
                        value={item.discount} 
                        onChange={(e) => handleChange(e, index, 'discount')}
                        className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                        placeholder="0"
                        step="0.01"
                        min="0"
                        max="100"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input 
                        type="number"
                        value={item.tax} 
                        onChange={(e) => handleChange(e, index, 'tax')}
                        className="w-full p-2 border-0 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                        placeholder="0"
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <input 
                        value={item.amount} 
                        readOnly
                        className="w-full p-2 border-0 bg-gray-50 text-center"
                      />
                    </td>
                    <td className="border border-gray-300 p-2 text-center">
                      {formData.items.length > 1 && (
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm focus:ring-2 focus:ring-red-300"
                        >
                          Remove
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="border border-gray-200 p-4 rounded-lg bg-white">
            <h3 className="font-bold mb-4 text-lg border-b pb-2 text-gray-700">Freight Charges</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹):</label>
              <input 
                type="number"
                name="freightCharges" 
                value={formData.freightCharges} 
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div className="border border-gray-200 p-4 rounded-lg bg-white">
            <h3 className="font-bold mb-4 text-lg border-b pb-2 text-gray-700">Notes</h3>
            <div>
              <textarea 
                name="notes" 
                value={formData.notes} 
                onChange={handleChange}
                rows="4"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter any notes or instructions"
              />
            </div>
          </div>
        </div>

        <div className="border border-gray-200 p-4 rounded-lg bg-white mb-8">
          <h3 className="font-bold mb-4 text-lg border-b pb-2 text-gray-700">Totals</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subtotal:</label>
                <input 
                  type="text" 
                  value={`₹${formData.subtotal || '0.00'}`} 
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grand Total:</label>
                <input 
                  type="text" 
                  value={`₹${formData.grandTotal || '0.00'}`} 
                  readOnly
                  className="w-full p-2 border border-gray-300 rounded bg-gray-50 font-bold text-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount in Words:</label>
              <textarea 
                name="totalInWords" 
                value={formData.totalInWords} 
                onChange={handleChange}
                rows="2"
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter amount in words"
              />
            </div>
          </div>
        </div>

        <div className="border border-gray-200 p-4 rounded-lg bg-white mb-8">
          <h3 className="font-bold mb-6 text-lg border-b pb-2 text-gray-700">Additional Details</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Terms & Conditions:
              </label>
              <textarea 
                name="termsConditions" 
                value={formData.termsConditions} 
                onChange={handleChange}
                rows="8"
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter Terms & Conditions"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Invoice Details:</label>
              <textarea 
                name="invoiceDetails" 
                value={formData.invoiceDetails} 
                onChange={handleChange}
                rows="2"
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter Invoice Details"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Termination:</label>
              <textarea 
                name="termination" 
                value={formData.termination} 
                onChange={handleChange}
                rows="2"
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter Termination terms"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Payment Terms:</label>
              <textarea 
                name="paymentTerms" 
                value={formData.paymentTerms} 
                onChange={handleChange}
                rows="2"
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter Payment Terms"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Governing Laws:</label>
              <textarea 
                name="governingLaws" 
                value={formData.governingLaws} 
                onChange={handleChange}
                rows="2"
                className="w-full p-3 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter Governing Laws"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 justify-center">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 font-medium"
          >
            Save Form
          </button>
          <button
            onClick={handleExportPDF}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 font-medium"
          >
            Export as PDF
          </button>
          <button
            onClick={handleClearForm}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:ring-4 focus:ring-gray-300 font-medium"
          >
            Clear Form
          </button>
          <button
            onClick={handleAddItem}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 focus:ring-4 focus:ring-purple-300 font-medium"
          >
            + Add Item
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrder;