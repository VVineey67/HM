const express = require("express");
const router = express.Router();
const axios = require("axios");
const graphHelper = require("../helpers/graphHelper");

console.log("✅ VIEW ROUTE LOADED");

/* =========================================
   1) GET MAIN GLTF (PROJECT BASED)
========================================= */
router.get("/model/:project", async (req, res) => {
  try {
    const { project } = req.params;

    const folderPath = `/Autox/${project}/3D View/GT_gltf`;
    const files = await graphHelper.getDriveFolderFiles(folderPath);

    if (!files || files.length === 0) {
      return res.status(404).json({ message: "No files found" });
    }

    const gltfFile = files.find(f =>
      f.name.toLowerCase().endsWith(".gltf")
    );

    if (!gltfFile) {
      return res.status(404).json({ message: "GLTF not found" });
    }

    return res.json({
      project,
      gltf: `/api/view/file/${project}/${gltfFile.name}`,
      fileName: gltfFile.name
    });

  } catch (err) {
    console.error("GLTF ERROR:", err.message);
    res.status(500).json({ message: "GLTF load error" });
  }
});

/* =========================================
   2) FILE PROXY (NODE 24 SAFE)
========================================= */
router.use("/file/:project", async (req, res) => {
  try {
    const { project } = req.params;

    // full requested URL
    const fullUrl = decodeURIComponent(req.originalUrl);
    const prefix = `/api/view/file/${project}/`;
    const innerPath = fullUrl.replace(prefix, "");

    console.log("📦 Requested file:", innerPath);

    let drivePath = `/Autox/${project}/3D View/GT_gltf/${innerPath}`;
    let fileMeta = await graphHelper.getDriveFile(drivePath);

    // fallback for Textures
    if (!fileMeta?.["@microsoft.graph.downloadUrl"]) {
      drivePath = `/Autox/${project}/3D View/GT_gltf/Textures/${innerPath}`;
      fileMeta = await graphHelper.getDriveFile(drivePath);
    }

    if (!fileMeta?.["@microsoft.graph.downloadUrl"]) {
      return res.status(404).json({ message: "File not found" });
    }

    /* ===== MIME TYPES (VERY IMPORTANT) ===== */
    if (innerPath.endsWith(".gltf")) {
      res.setHeader("Content-Type", "model/gltf+json");
    } else if (innerPath.endsWith(".bin")) {
      res.setHeader("Content-Type", "application/octet-stream");
    } else if (innerPath.endsWith(".png")) {
      res.setHeader("Content-Type", "image/png");
    } else if (
      innerPath.endsWith(".jpg") ||
      innerPath.endsWith(".jpeg")
    ) {
      res.setHeader("Content-Type", "image/jpeg");
    }

    /* ===== CACHE (SPEED FIX) ===== */
    res.setHeader("Cache-Control", "public, max-age=86400");

    const stream = await axios.get(
      fileMeta["@microsoft.graph.downloadUrl"],
      { responseType: "stream" }
    );

    stream.data.pipe(res);

  } catch (err) {
    console.error("PROXY ERROR:", err.message);
    res.status(500).json({ message: "Proxy failed" });
  }
});

module.exports = router;
