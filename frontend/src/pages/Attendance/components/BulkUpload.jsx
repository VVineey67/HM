import React, { useState } from "react";

const BulkUpload = ({ onUpload, columns, visible }) => {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  if (!visible) return null;

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); };

  const downloadTemplate = () => {
    // columns is a comma-separated string like "Date,Name,Designation,..."
    const blob = new Blob(["\uFEFF" + columns + "\n"], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "attendance_template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Display-friendly column hint (add spaces around commas)
  const colHint = columns.split(",").join(", ");

  return (
    <div className={`bulk-upload-zone ${dragOver ? "drag-over" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>
      {file ? (
        <div className="upload-file-info">
          <div className="upload-file-name">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round"><path d="M3 2h7l3 3v9H3z" /><path d="M10 2v3h3" /></svg>
            {file.name}
          </div>
          <div className="upload-actions">
            <button className="upload-btn-cancel" onClick={() => setFile(null)}>Cancel</button>
            <button className="upload-btn-confirm" onClick={() => { onUpload?.(file); setFile(null); }}>Upload</button>
          </div>
        </div>
      ) : (
        <>
          <p className="upload-text">Drop your CSV file here</p>
          <span className="upload-hint">Required columns: <strong>{colHint}</strong></span>
          <span className="upload-hint" style={{ marginTop: "4px", fontSize: "11px" }}>Date: DD-MM-YYYY or YYYY-MM-DD &nbsp;|&nbsp; Time: HH:MM (24hr) &nbsp;|&nbsp; Shift: Day / Night</span>
          <div className="upload-btns-row">
            <label className="upload-browse-btn">
              Browse files
              <input type="file" accept=".csv" onChange={(e) => { if (e.target.files[0]) setFile(e.target.files[0]); }} hidden />
            </label>
            <button className="upload-template-btn" onClick={downloadTemplate}>
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M8 2v9M5 8l3 3 3-3M3 13h10"/></svg>
              Download template
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default BulkUpload;
