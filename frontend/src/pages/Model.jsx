import React, { useEffect, useState } from "react";

function Model({ project }) {
  const [modelUrl, setModelUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!project) return;

    // Load model-viewer once
    if (!document.getElementById("model-viewer-script")) {
      const script = document.createElement("script");
      script.id = "model-viewer-script";
      script.type = "module";
      script.src =
        "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
      document.head.appendChild(script);
    }

    setLoading(true);
    setError(null);
    setModelUrl(null);

    // 🔥 Fetch correct GLTF URL from backend
    fetch(`http://localhost:4000/api/view/model/${project}`)
      .then(res => {
        if (!res.ok) throw new Error("Model API failed");
        return res.json();
      })
      .then(data => {
        console.log("MODEL API RESPONSE:", data);
        setModelUrl(`http://localhost:4000${data.gltf}`);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError("3D Model load nahi ho paaya");
        setLoading(false);
      });
  }, [project]);

  if (!project) {
    return <div style={{ textAlign: "center" }}>Project select karo</div>;
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "40px" }}>
        Loading 3D Model…
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
    <div style={{ width: "100%", height: "100%", background: "#ffffff" }}>
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
        />
      )}
    </div>
  );
}

export default Model;
