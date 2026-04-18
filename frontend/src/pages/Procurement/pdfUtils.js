import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_WIDTH_PX = 794;
const A4_HEIGHT_PX = 1123;

// ─────────────────────────────────────────────────────────────────────────────
// WHY IFRAME APPROACH:
//
// The previous onclone approach still failed because html2canvas captures
// relative to the LIVE document. If the browser is zoomed, or the element
// is inside a scrollable container, or devicePixelRatio != 1, the capture
// is offset/scaled incorrectly and content gets squished.
//
// Fix: render each page into an isolated off-screen iframe that is exactly
// 794×1123px with no scroll, no zoom, no DPR interference. html2canvas then
// captures a perfectly clean A4 document every time.
// ─────────────────────────────────────────────────────────────────────────────

const capturePageCanvas = (pageEl) => {
  return new Promise((resolve, reject) => {
    // 1. Create an off-screen iframe at exact A4 pixel size
    const iframe = document.createElement("iframe");
    iframe.style.cssText = `
      position:       fixed;
      top:            0;
      left:           0;
      width:          ${A4_WIDTH_PX}px;
      height:         ${A4_HEIGHT_PX}px;
      border:         none;
      opacity:        0;
      pointer-events: none;
      z-index:        -9999;
    `;
    document.body.appendChild(iframe);

    const iDoc = iframe.contentDocument || iframe.contentWindow.document;
    const iWin = iframe.contentWindow;

    // 2. Copy all stylesheets from the parent page into the iframe
    const styles = Array.from(
      document.querySelectorAll('style, link[rel="stylesheet"]')
    )
      .map((n) => n.outerHTML)
      .join("\n");

    // 3. Clone the target page element
    const clone = pageEl.cloneNode(true);

    // 4. Write a clean isolated document into the iframe
    iDoc.open();
    iDoc.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8"/>
          ${styles}
          <style>
            *, *::before, *::after {
              box-sizing: border-box;
            }
            html, body {
              margin:   0 !important;
              padding:  0 !important;
              width:    ${A4_WIDTH_PX}px  !important;
              height:   ${A4_HEIGHT_PX}px !important;
              overflow: hidden !important;
              background: #ffffff !important;
            }

            /*
              Force the page container to exact A4 pixels with the same
              padding as the screen view so content sits identically:
                top:    10mm = 38px
                right:  12mm = 45px
                bottom: 28mm = 107px  ← this is the key spacing fix
                left:   12mm = 45px
            */
            .page-container {
              position:   relative  !important;
              width:      ${A4_WIDTH_PX}px  !important;
              min-width:  ${A4_WIDTH_PX}px  !important;
              max-width:  ${A4_WIDTH_PX}px  !important;
              height:     ${A4_HEIGHT_PX}px !important;
              min-height: ${A4_HEIGHT_PX}px !important;
              max-height: ${A4_HEIGHT_PX}px !important;
              padding:    38px 45px 107px 45px !important;
              margin:     0    !important;
              border:     none !important;
              box-shadow: none !important;
              overflow:   hidden   !important;
              background: #ffffff  !important;
            }

            /* Footer pinned at 10mm (38px) from the bottom of the A4 box */
            .doc-footer {
              position:    absolute !important;
              bottom:      38px    !important;
              left:        45px    !important;
              right:       45px    !important;
              border-top:  1.5px solid #000000 !important;
              text-align:  center  !important;
              padding-top: 6px     !important;
              background:  #ffffff !important;
            }
          </style>
        </head>
        <body></body>
      </html>
    `);
    iDoc.close();

    // 5. Append clone after document close so styles apply correctly
    iDoc.body.appendChild(clone);

    // 6. Wait for fonts and images inside iframe to fully load
    const waitForLoad = () =>
      new Promise((res) => {
        if (iDoc.readyState === "complete") {
          setTimeout(res, 350);
        } else {
          iWin.addEventListener("load", () => setTimeout(res, 350));
        }
      });

    waitForLoad()
      .then(() => {
        const target = iDoc.querySelector(".page-container") || iDoc.body;
        return html2canvas(target, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: "#ffffff",
          logging: false,
          width: A4_WIDTH_PX,
          height: A4_HEIGHT_PX,
          windowWidth: A4_WIDTH_PX,
          windowHeight: A4_HEIGHT_PX,
          scrollX: 0,
          scrollY: 0,
        });
      })
      .then((canvas) => {
        document.body.removeChild(iframe);
        resolve(canvas);
      })
      .catch((err) => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
        reject(err);
      });
  });
};

// ═══════════════════════════════════════════════════════════════════════════════
// CREATE PDF BLOB
// ═══════════════════════════════════════════════════════════════════════════════
export const createPdfBlobFromElement = async ({ element }) => {
  if (!element) throw new Error("PDF element not found");

  const pages = Array.from(element.querySelectorAll(".page-container"));
  const pageNodes = pages.length > 0 ? pages : [element];

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
    compress: true,
  });

  for (let i = 0; i < pageNodes.length; i++) {
    const canvas = await capturePageCanvas(pageNodes[i]);
    const imgData = canvas.toDataURL("image/jpeg", 0.95);

    if (i > 0) doc.addPage("a4", "portrait");
    // Canvas is exactly A4_WIDTH_PX × A4_HEIGHT_PX at scale 2
    // → maps perfectly onto 210mm × 297mm, no stretching
    doc.addImage(imgData, "JPEG", 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM);
  }

  return doc.output("blob");
};

// ═══════════════════════════════════════════════════════════════════════════════
// DOWNLOAD PDF
// ═══════════════════════════════════════════════════════════════════════════════
export const downloadElementAsPdf = async ({ element, filename }) => {
  const blob = await createPdfBlobFromElement({ element });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename || "document.pdf";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// ═══════════════════════════════════════════════════════════════════════════════
// PRINT — uses browser native print dialog for perfect rendering
// ═══════════════════════════════════════════════════════════════════════════════
export const printElement = async ({ element, title = "Order PDF" }) => {
  if (!element) throw new Error("Print element not found");

  const styles = Array.from(
    document.querySelectorAll('style, link[rel="stylesheet"]')
  )
    .map((node) => node.outerHTML)
    .join("\n");

  const pw = window.open("", "_blank");
  if (!pw) throw new Error("Popup blocked — allow popups for this site");

  pw.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8"/>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
        ${styles}
        <style>
          *, *::before, *::after { box-sizing: border-box; }

          @page {
            margin: 0;
            size: A4 portrait;
          }

          html, body {
            margin:   0;
            padding:  0;
            background: #ffffff;
            font-family: 'Inter', sans-serif;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .page-container {
            width:            210mm !important;
            height:           297mm !important;
            overflow:         hidden !important;
            margin:           0 !important;
            padding:          10mm 12mm 28mm 12mm !important;
            box-shadow:       none !important;
            border:           none !important;
            page-break-after: always !important;
            break-after:      page !important;
            position:         relative !important;
            box-sizing:       border-box !important;
            background:       #ffffff !important;
          }

          .page-container:last-child {
            page-break-after: auto !important;
            break-after:      auto !important;
          }

          .doc-footer {
            position:    absolute !important;
            bottom:      10mm !important;
            left:        12mm !important;
            right:       12mm !important;
            border-top:  1.5px solid #000000 !important;
            text-align:  center !important;
            padding-top: 6px !important;
            background:  #ffffff !important;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* Fix rowspan bottom border — template sets border-bottom:none on td[rowspan]
               which hides the dividing line between item groups (e.g. 01→02) in print */
            table tbody tr td[rowspan] {
              border-bottom: 1px solid #000000 !important;
            }

            /* Ensure all cell borders are uniform 1px in print */
            table tbody td {
              border-bottom: 1px solid #000000 !important;
              border-right:  1px solid #000000 !important;
            }
            table tbody td:last-child {
              border-right: none !important;
            }
            table thead th:last-child {
              border-right: none !important;
            }

            /* Force background images (gradient dividers) to print */
            table tbody td[rowspan] {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
        </style>
      </head>
      <body>${element.outerHTML}</body>
    </html>
  `);
  pw.document.close();

  await new Promise((resolve) => {
    if (pw.document.readyState === "complete") {
      setTimeout(resolve, 900);
    } else {
      pw.addEventListener("load", () => setTimeout(resolve, 900));
    }
  });

  pw.focus();
  pw.print();
};