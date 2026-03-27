import React, { useEffect, useState } from "react";
import API from "../api"; // Aapka Axios instance

function Model({ project }) {
  const [modelUrl, setModelUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!project) return;

    // 1. Load model-viewer script (sirf ek baar)
    if (!document.getElementById("model-viewer-script")) {
      const script = document.createElement("script");
      script.id = "model-viewer-script";
      script.type = "module";
      script.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
      document.head.appendChild(script);
    }

    setLoading(true);
    setError(null);
    setModelUrl(null);

    // 2. Fetch GLTF Path from backend using our API instance
    API.get(`/api/view/model/${project}`)
      .then((res) => {
        // .env se base URL uthayenge (localhost ya Railway link)
        const baseUrl = import.meta.env.VITE_API_URL;
        
        // Backend se milne wala path (e.g., /uploads/model.gltf) joड़ rahe hain
        const fullUrl = `${baseUrl}${res.data.gltf}`;
        
        console.log("3D Model URL:", fullUrl);
        setModelUrl(fullUrl);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Model fetch error:", err);
        setError("3D Model load nahi ho paaya. Check backend connection.");
        setLoading(false);
      });
  }, [project]);

  // UI Handlers
  if (!project) {
    return <div style={{ textAlign: "center", padding: "20px" }}>Project select karo</div>;
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <div className="spinner"></div> {/* Agar aapke paas CSS spinner hai */}
        Loading 3D Model...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: "center", color: "red", marginTop: "40px" }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", background: "#ffffff", position: "relative" }}>
      {modelUrl && (
        <model-viewer
          src={modelUrl}
          alt={`3D Model - ${project}`}
          camera-controls
          auto-rotate
          preload
          loading="eager"
          exposure="1.2"
          shadow-intensity="1"
          environment-image="https://modelviewer.dev/shared-assets/environments/neutral.hdr"
          style={{ width: "100%", height: "100%" }}
        >
          {/* Optional: Add a poster/loading slot inside model-viewer */}
        </model-viewer>
      )}
    </div>
  );
}

export default Model;