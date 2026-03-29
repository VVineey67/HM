import React, { useState } from "react";

const BulkUpload = ({ onUpload, columns, visible }) => {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState(null);
  if (!visible) return null;

  const handleDrop = (e) => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files[0]) setFile(e.dataTransfer.files[0]); };

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
        <><p className="upload-text">Drop your Excel/CSV file here</p><span className="upload-hint">Columns: {columns}</span>
          <label className="upload-browse-btn">Browse files<input type="file" accept=".xlsx,.csv,.xls" onChange={(e) => { if (e.target.files[0]) setFile(e.target.files[0]); }} hidden /></label></>
      )}
    </div>
  );
};

export default BulkUpload;