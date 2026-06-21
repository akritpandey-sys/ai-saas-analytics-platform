/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { generateProjectRecords, generateExecutiveSummary } from "./src/dataGenerator.js";
import { createEnterpriseWorkbook } from "./src/excelGenerator.js";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser for APIs
  app.use(express.json({ limit: "50mb" }));

  // Pre-generate the 100,000 projects in background memory so first request is blazing fast
  console.log("Pre-seeding 100,000 enterprise projects and compiling executive aggregates...");
  const startTimer = Date.now();
  generateProjectRecords();
  generateExecutiveSummary();
  console.log(`Database ready in ${((Date.now() - startTimer) / 1000).toFixed(2)} seconds.`);

  // ==========================================
  // REST API: GET EXECUTIVE DASHBOARD CONSOLE
  // ==========================================
  app.get("/api/dashboard-summary", (req, res) => {
    try {
      const summary = generateExecutiveSummary();
      return res.json(summary);
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({ error: "Failed to compile financial summaries." });
    }
  });

  // ==========================================
  // REST API: ADVANCED PAGINATED PROJECTS EXTRALIST
  // ==========================================
  app.get("/api/projects", (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const search = (req.query.search as string || "").toLowerCase().trim();
      const category = req.query.category as string || "";
      const clientType = req.query.clientType as string || "";
      const status = req.query.status as string || "";
      const priority = req.query.priority as string || "";

      let list = generateProjectRecords();

      // Advanced selective filtering
      if (search) {
        list = list.filter(
          p =>
            p.projectId.toLowerCase().includes(search) ||
            p.projectName.toLowerCase().includes(search) ||
            p.subcategory.toLowerCase().includes(search)
        );
      }
      if (category) {
        list = list.filter(p => p.category === category);
      }
      if (clientType) {
        list = list.filter(p => p.clientType === clientType);
      }
      if (status) {
        list = list.filter(p => p.status === status);
      }
      if (priority) {
        list = list.filter(p => p.priority === priority);
      }

      const totalCount = list.length;
      const paginatedList = list.slice((page - 1) * limit, page * limit);

      return res.json({
        projects: paginatedList,
        totalCount,
        page,
        limit
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to retrieve projects inventory." });
    }
  });

  // ==========================================
  // REST API: DOWNLOAD EXCEL FILE DIRECTLY
  // ==========================================
  app.get("/api/download-xlsx", async (req, res) => {
    try {
      console.log("Generating styled Excel MIS workbook (100,000 projects) for download...");
      const wbStart = Date.now();
      const workbook = await createEnterpriseWorkbook();
      
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=Enterprise_MIS_May_2026.xlsx"
      );

      await workbook.xlsx.write(res);
      console.log(`Excel downloaded successfully in ${((Date.now() - wbStart) / 1000).toFixed(2)}s.`);
    } catch (err) {
      console.error("Error sending workbook:", err);
      return res.status(500).send("Error generating Excel file.");
    }
  });

  // ==========================================
  // REST API: EXPORT DIRECTLY TO GOOGLE DRIVE (WITH ACCESS TOKEN)
  // ==========================================
  app.post("/api/export-to-drive", async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Unauthorized. Missing Google OAuth access token." });
      }
      const accessToken = authHeader.split(" ")[1];
      const { convertToSheets } = req.body;

      console.log(`Generating styled Excel MIS workbook to upload to Google Drive (convert: ${convertToSheets})...`);
      const workbook = await createEnterpriseWorkbook();
      const buffer = await workbook.xlsx.writeBuffer() as Buffer;

      // Google Drive Metadata
      const filename = `Enterprise_MIS_May_2026_${Date.now()}`;
      const metadata = {
        name: convertToSheets ? `${filename}` : `${filename}.xlsx`,
        mimeType: convertToSheets 
          ? "application/vnd.google-apps.spreadsheet" 
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      };

      // RFC 2387 Multipart Related Body construction for efficient file upload
      const boundary = "enterprise_mis_upload_boundary";
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelim = `\r\n--${boundary}--`;

      const multipartBody = Buffer.concat([
        Buffer.from(delimiter + "Content-Type: application/json; charset=UTF-8\r\n\r\n" + JSON.stringify(metadata) + delimiter),
        Buffer.from("Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\nContent-Transfer-Encoding: base64\r\n\r\n"),
        Buffer.from(buffer.toString("base64"), "base64"),
        Buffer.from(closeDelim)
      ]);

      console.log("Contacting Google Drive API...");
      const driveRes = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": `multipart/related; boundary=${boundary}`
        },
        body: multipartBody
      });

      if (!driveRes.ok) {
        const errorText = await driveRes.text();
        console.error("Google Drive upload failure:", errorText);
        return res.status(driveRes.status).json({ error: "Google Drive API upload failed.", details: errorText });
      }

      const driveData = await driveRes.json();
      console.log("Successfully exported to Google Drive:", driveData);

      return res.json({
        success: true,
        fileId: driveData.id,
        fileName: driveData.name,
        webViewLink: driveData.webViewLink
      });

    } catch (err: any) {
      console.error("Error exporting to Google Drive:", err);
      return res.status(500).json({ error: "Failed to upload to Google Drive.", details: err.message });
    }
  });


  // ==========================================
  // VITE DEV SERVER / PRODUCTION SERVE MIDDLEWARE
  // ==========================================
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Serve client SPA fallback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Enterprise MIS App running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
