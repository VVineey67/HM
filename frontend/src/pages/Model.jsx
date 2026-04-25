import { useEffect, useState, useRef, useCallback } from "react";
import API from "../api";

const ENVIRONMENTS = [
  { label: "Neutral", value: "https://modelviewer.dev/shared-assets/environments/neutral.hdr" },
  { label: "Sunset", value: "https://modelviewer.dev/shared-assets/environments/aircraft_workshop_01_1k.hdr" },
  { label: "Studio", value: "https://modelviewer.dev/shared-assets/environments/spruit_sunrise_1k_HDR.hdr" },
];

function Model({ project }) {
  const [modelUrl, setModelUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [autoRotate, setAutoRotate] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [envIndex, setEnvIndex] = useState(0);
  const [exposure, setExposure] = useState(1.2);
  const [showControls, setShowControls] = useState(true);
  const viewerRef = useRef(null);
  const containerRef = useRef(null);
  const hideTimerRef = useRef(null);

  // Wheel zoom — intercept model-viewer's native scroll and control speed manually
  useEffect(() => {
    if (!modelUrl) return;
    const viewer = viewerRef.current;
    if (!viewer) return;

    const onWheel = (e) => {
      e.preventDefault();
      e.stopPropagation();
      try {
        const orbit = viewer.getCameraOrbit();
        if (!orbit || orbit.radius == null) return;

        // fixed 15% per scroll tick — consistent on mouse and trackpad
        // 8% per scroll tick — smooth, consistent, won't fly through in one scroll
        const delta = Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 120);
        const factor = delta > 0 ? 1.08 : 0.92;
        const newRadius = Math.max(Math.min(orbit.radius * factor, 500), 0.001);

        viewer.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${newRadius}m`;
      } catch (_) {}
    };

    viewer.addEventListener("wheel", onWheel, { passive: false, capture: true });
    return () => viewer.removeEventListener("wheel", onWheel, { capture: true });
  }, [modelUrl]);

  useEffect(() => {
    if (!document.getElementById("model-viewer-script")) {
      const script = document.createElement("script");
      script.id = "model-viewer-script";
      script.type = "module";
      script.src = "https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js";
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    if (!project) return;
    setLoading(true);
    setError(null);
    setModelUrl(null);

    API.get(`/api/view/model/${project}`)
      .then((res) => {
        // gltf is now a full Supabase Storage public URL
        setModelUrl(res.data.gltf);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load 3D model. Please check the backend connection.");
        setLoading(false);
      });
  }, [project]);

  const handleResetCamera = () => {
    if (viewerRef.current) {
      viewerRef.current.resetTurntableRotation();
      viewerRef.current.cameraOrbit = "0deg 75deg 105%";
      viewerRef.current.fieldOfView = "auto";
    }
  };

  const handleZoom = (direction) => {
    if (!viewerRef.current) return;
    try {
      const orbit = viewerRef.current.getCameraOrbit();
      if (!orbit || orbit.radius == null) return;
      // 10% step — smooth, not aggressive
      const factor = direction === "in" ? 0.9 : 1.1;
      const newRadius = Math.max(0.1, orbit.radius * factor);
      viewerRef.current.cameraOrbit = `${orbit.theta}rad ${orbit.phi}rad ${newRadius}m`;
    } catch (e) {
      console.warn("getCameraOrbit failed:", e);
    }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const scheduleHide = useCallback(() => {
    clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
  }, []);

  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    scheduleHide();
  }, [scheduleHide]);

  useEffect(() => {
    scheduleHide();
    return () => clearTimeout(hideTimerRef.current);
  }, [scheduleHide]);

  if (!project) {
    return (
      <div style={styles.center}>
        <div style={styles.emptyBox}>
          <span style={styles.emptyIcon}>🏗️</span>
          <p style={styles.emptyText}>No project selected</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner} />
          <p style={styles.loadingText}>3D Model Lodaing..</p>
          <p style={styles.loadingSubtext}>{project}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.center}>
        <div style={styles.errorBox}>
          <span style={{ fontSize: 40 }}>⚠️</span>
          <p style={styles.errorText}>{error}</p>
          <button style={styles.retryBtn} onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={styles.container}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
    >
      {/* Model Viewer */}
      {modelUrl && (
        <model-viewer
          ref={viewerRef}
          src={modelUrl}
          alt={`3D Model - ${project}`}
          camera-controls
          auto-rotate={autoRotate ? "" : undefined}
          preload
          loading="eager"
          exposure={exposure}
          shadow-intensity="1.5"
          shadow-softness="0.8"
          environment-image={ENVIRONMENTS[envIndex].value}
          camera-orbit="0deg 75deg 105%"
          min-camera-orbit="auto auto 0%"
          max-camera-orbit="auto auto 200%"
          interpolation-decay="60"
          style={styles.viewer}
        />
      )}

      {/* Top Bar */}
      <div style={{ ...styles.topBar, opacity: showControls ? 1 : 0, transition: "opacity 0.4s ease" }}>
        <div style={styles.projectBadge}>
          <span style={styles.projectDot} />
          <span style={styles.projectName}>{project} — 3D View</span>
        </div>
        <div style={styles.envSelector}>
          {ENVIRONMENTS.map((env, i) => (
            <button
              key={i}
              style={{ ...styles.envBtn, ...(envIndex === i ? styles.envBtnActive : {}) }}
              onClick={() => setEnvIndex(i)}
            >
              {env.label}
            </button>
          ))}
        </div>
      </div>

      {/* Right Controls */}
      <div style={{ ...styles.rightControls, opacity: showControls ? 1 : 0, transition: "opacity 0.4s ease" }}>
        <ControlBtn title="Zoom In" onClick={() => handleZoom("in")}>
          <ZoomInIcon />
        </ControlBtn>
        <ControlBtn title="Zoom Out" onClick={() => handleZoom("out")}>
          <ZoomOutIcon />
        </ControlBtn>
        <div style={styles.divider} />
        <ControlBtn
          title={autoRotate ? "Rotation Rok do" : "Auto Rotate"}
          onClick={() => setAutoRotate((v) => !v)}
          active={autoRotate}
        >
          <RotateIcon />
        </ControlBtn>
        <ControlBtn title="Reset Camera" onClick={handleResetCamera}>
          <ResetIcon />
        </ControlBtn>
        <div style={styles.divider} />
        <ControlBtn title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"} onClick={handleFullscreen}>
          {isFullscreen ? <ExitFsIcon /> : <FullscreenIcon />}
        </ControlBtn>
      </div>

      {/* Exposure Slider */}
      <div style={{ ...styles.bottomBar, opacity: showControls ? 1 : 0, transition: "opacity 0.4s ease" }}>
        <label style={styles.sliderLabel}>☀️ Brightness</label>
        <input
          type="range"
          min="0.5"
          max="2.5"
          step="0.1"
          value={exposure}
          onChange={(e) => setExposure(parseFloat(e.target.value))}
          style={styles.slider}
        />
        <span style={styles.sliderValue}>{exposure.toFixed(1)}</span>
      </div>

      {/* Hint */}
      <div style={{ ...styles.hint, opacity: showControls ? 1 : 0, transition: "opacity 0.4s ease" }}>
        Drag to rotate • Scroll to zoom • Right-click to pan
      </div>
    </div>
  );
}

/* ---- Small reusable control button ---- */
function ControlBtn({ title, onClick, active, children }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        ...styles.ctrlBtn,
        ...(active ? styles.ctrlBtnActive : {}),
        ...(hover ? styles.ctrlBtnHover : {}),
      }}
    >
      {children}
    </button>
  );
}

/* ---- SVG Icons ---- */
const ZoomInIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="11" y1="8" x2="11" y2="14" /><line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);
const ZoomOutIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    <line x1="8" y1="11" x2="14" y2="11" />
  </svg>
);
const RotateIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);
const ResetIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
    <polyline points="3 3 3 8 8 8" />
  </svg>
);
const FullscreenIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" />
    <line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" />
  </svg>
);
const ExitFsIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="8 3 3 3 3 8" /><polyline points="21 8 21 3 16 3" />
    <polyline points="3 16 3 21 8 21" /><polyline points="16 21 21 21 21 16" />
  </svg>
);

/* ---- Styles ---- */
const glassBase = {
  background: "rgba(15, 20, 30, 0.72)",
  backdropFilter: "blur(14px)",
  WebkitBackdropFilter: "blur(14px)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 12,
};

const styles = {
  container: {
    width: "100%",
    height: "100%",
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)",
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  viewer: {
    width: "100%",
    height: "100%",
    minHeight: "100vh",
    "--poster-color": "transparent",
  },
  center: {
    width: "100%",
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  },
  emptyBox: {
    ...glassBase,
    padding: "48px 56px",
    textAlign: "center",
  },
  emptyIcon: { fontSize: 48 },
  emptyText: { color: "#94a3b8", marginTop: 16, fontSize: 16 },
  loadingBox: {
    ...glassBase,
    padding: "48px 56px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },
  spinner: {
    width: 48,
    height: 48,
    border: "3px solid rgba(99,102,241,0.3)",
    borderTop: "3px solid #6366f1",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  loadingText: { color: "#e2e8f0", fontSize: 16, margin: 0 },
  loadingSubtext: { color: "#64748b", fontSize: 13, margin: 0 },
  errorBox: {
    ...glassBase,
    padding: "48px 56px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },
  errorText: { color: "#f87171", fontSize: 15, maxWidth: 320, margin: 0 },
  retryBtn: {
    padding: "8px 24px",
    background: "#6366f1",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
  },
  topBar: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    pointerEvents: "none",
    zIndex: 10,
  },
  projectBadge: {
    ...glassBase,
    padding: "8px 16px",
    display: "flex",
    alignItems: "center",
    gap: 8,
    pointerEvents: "auto",
  },
  projectDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "#22c55e",
    boxShadow: "0 0 8px #22c55e",
  },
  projectName: { color: "#e2e8f0", fontSize: 14, fontWeight: 600 },
  envSelector: {
    ...glassBase,
    padding: "6px 8px",
    display: "flex",
    gap: 4,
    pointerEvents: "auto",
  },
  envBtn: {
    padding: "5px 12px",
    background: "transparent",
    border: "none",
    borderRadius: 8,
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    transition: "all 0.2s",
  },
  envBtnActive: {
    background: "rgba(99,102,241,0.35)",
    color: "#a5b4fc",
  },
  rightControls: {
    position: "absolute",
    right: 20,
    top: "50%",
    transform: "translateY(-50%)",
    display: "flex",
    flexDirection: "column",
    gap: 8,
    zIndex: 10,
    ...glassBase,
    padding: "12px 10px",
  },
  ctrlBtn: {
    width: 40,
    height: 40,
    border: "none",
    borderRadius: 8,
    background: "transparent",
    color: "#94a3b8",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.2s",
  },
  ctrlBtnHover: {
    background: "rgba(99,102,241,0.2)",
    color: "#e2e8f0",
  },
  ctrlBtnActive: {
    background: "rgba(99,102,241,0.35)",
    color: "#a5b4fc",
  },
  divider: {
    height: 1,
    background: "rgba(255,255,255,0.08)",
    margin: "2px 0",
  },
  bottomBar: {
    position: "absolute",
    bottom: 24,
    left: "50%",
    transform: "translateX(-50%)",
    ...glassBase,
    padding: "10px 20px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    zIndex: 10,
    pointerEvents: "auto",
  },
  sliderLabel: { color: "#94a3b8", fontSize: 13, whiteSpace: "nowrap" },
  slider: {
    width: 140,
    accentColor: "#6366f1",
    cursor: "pointer",
  },
  sliderValue: { color: "#e2e8f0", fontSize: 13, minWidth: 28 },
  hint: {
    position: "absolute",
    bottom: 24,
    left: 20,
    color: "rgba(148,163,184,0.6)",
    fontSize: 11,
    letterSpacing: "0.03em",
    zIndex: 10,
    pointerEvents: "none",
  },
};

/* Inject keyframes once */
if (typeof document !== "undefined" && !document.getElementById("model-spinner-style")) {
  const style = document.createElement("style");
  style.id = "model-spinner-style";
  style.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`;
  document.head.appendChild(style);
}

export default Model;
