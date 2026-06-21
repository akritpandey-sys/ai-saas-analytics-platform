/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import ExcelJS from "exceljs";
import { generateProjectRecords, generateExecutiveSummary } from "./dataGenerator.js";

export async function createEnterpriseWorkbook(): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Mr. Akrit Pandey";
  workbook.lastModifiedBy = "Mr. Akrit Pandey";
  workbook.created = new Date();
  workbook.modified = new Date();

  const projects = generateProjectRecords();
  const summary = generateExecutiveSummary();

  // Primary Theme Colors (Deep Corporate Navy Slate)
  const COL_HEADER_FILL = "FF0F172A"; // Slate 900
  const CARD_BG_FILL = "FF1E293B"; // Slate 800
  const CARD_LIGHT_FILL = "FDF8FAFC"; // Slate 50
  const TEXT_WHITE = "FFFFFFFF";
  const TEXT_DARK = "FF334155"; // Slate 700
  const BORDER_COLOR = "FFE2E8F0"; // Slate 200

  // ==========================================
  // SHEET 1: EXECUTIVE DASHBOARD
  // ==========================================
  const dashSheet = workbook.addWorksheet("EXECUTIVE_DASHBOARD", {
    views: [{ showGridLines: true }]
  });

  // Enable explicit column sizing
  dashSheet.columns = [
    { width: 15 }, { width: 18 }, { width: 18 }, { width: 18 }, 
    { width: 18 }, { width: 18 }, { width: 18 }, { width: 15 }
  ];

  // Header Title
  dashSheet.mergeCells("A1:H1");
  const mainTitleCell = dashSheet.getCell("A1");
  mainTitleCell.value = "ENTERPRISE BUSINESS INTELLIGENCE & FINANCIAL MIS – MAY 2026";
  mainTitleCell.font = { name: "Arial", size: 16, bold: true, color: { argb: TEXT_WHITE } };
  mainTitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COL_HEADER_FILL } };
  mainTitleCell.alignment = { vertical: "middle", horizontal: "center" };
  dashSheet.getRow(1).height = 45;

  // Subtitle (Registered Under Mr. Akrit Pandey)
  dashSheet.mergeCells("A2:H2");
  const subTitleCell = dashSheet.getCell("A2");
  subTitleCell.value = "Portfolio Registered and Managed Under: Mr. Akrit Pandey (Senior Analytics Director)";
  subTitleCell.font = { name: "Arial", size: 11, italic: true, bold: true, color: { argb: "FF64748B" } };
  subTitleCell.alignment = { vertical: "middle", horizontal: "center" };
  dashSheet.getRow(2).height = 24;

  // KPI Row Cards Setup (Total Revenue, Total Cost, Net Profit, Projects Count, Profit Margin)
  const kpis = [
    { title: "TOTAL REVENUE", cellRef: "A4:B4", valRef: "A5:B5", formula: "=SUM(Project_Data!L2:L100001)", format: '"₹"#,##,##0' },
    { title: "EMPLOYEE COST", cellRef: "C4:D4", valRef: "C5:D5", formula: "=SUM(Project_Data!M2:M100001)", format: '"₹"#,##,##0' },
    { title: "INFRASTRUCTURE COST", cellRef: "E4:F4", valRef: "E5:F5", formula: "=SUM(Project_Data!N2:N100001)", format: '"₹"#,##,##0' },
    { title: "NET PROFIT", cellRef: "G4:H4", valRef: "G5:H5", formula: "=SUM(Project_Data!O2:O100001)", format: '"₹"#,##,##0' }
  ];

  // Layout KPI Row 1
  kpis.forEach(kpi => {
    dashSheet.mergeCells(kpi.cellRef);
    const titleC = dashSheet.getCell(kpi.cellRef.split(":")[0]);
    titleC.value = kpi.title;
    titleC.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF94A3B8" } };
    titleC.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CARD_BG_FILL } };
    titleC.alignment = { horizontal: "center", vertical: "middle" };

    dashSheet.mergeCells(kpi.valRef);
    const valC = dashSheet.getCell(kpi.valRef.split(":")[0]);
    valC.value = { formula: kpi.formula, result: 0 }; // Initialize result as formula
    valC.font = { name: "Arial", size: 14, bold: true, color: { argb: TEXT_WHITE } };
    valC.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CARD_BG_FILL } };
    valC.alignment = { horizontal: "center", vertical: "middle" };
    valC.numFmt = kpi.format;
  });

  dashSheet.getRow(4).height = 20;
  dashSheet.getRow(5).height = 28;

  // KPI Row 2 Cards (Projects Count, Average Margin)
  dashSheet.mergeCells("A7:D7");
  const capProjCountTitle = dashSheet.getCell("A7");
  capProjCountTitle.value = "REPRESENTED PORTFOLIO PROJECTS";
  capProjCountTitle.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF475569" } };
  capProjCountTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  capProjCountTitle.alignment = { horizontal: "center", vertical: "middle" };

  dashSheet.mergeCells("A8:D8");
  const capProjCountVal = dashSheet.getCell("A8");
  capProjCountVal.value = { formula: "=COUNTA(Project_Data!A2:A100001)", result: 100000 };
  capProjCountVal.font = { name: "Arial", size: 15, bold: true, color: { argb: COL_HEADER_FILL } };
  capProjCountVal.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  capProjCountVal.alignment = { horizontal: "center", vertical: "middle" };
  capProjCountVal.numFmt = "#,##0";

  dashSheet.mergeCells("E7:H7");
  const capMarginTitle = dashSheet.getCell("E7");
  capMarginTitle.value = "AVERAGE DECLARED PROFIT MARGIN %";
  capMarginTitle.font = { name: "Arial", size: 9, bold: true, color: { argb: "FF475569" } };
  capMarginTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  capMarginTitle.alignment = { horizontal: "center", vertical: "middle" };

  dashSheet.mergeCells("E8:H8");
  const capMarginVal = dashSheet.getCell("E8");
  capMarginVal.value = { formula: "=AVERAGE(Project_Data!P2:P100001)/100", result: summary.kpis.avgProfitMargin / 100 };
  capMarginVal.font = { name: "Arial", size: 15, bold: true, color: { argb: "FF15803D" } }; // Green success
  capMarginVal.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
  capMarginVal.alignment = { horizontal: "center", vertical: "middle" };
  capMarginVal.numFmt = "0.0%";

  dashSheet.getRow(7).height = 20;
  dashSheet.getRow(8).height = 28;

  // Visual separation
  dashSheet.getRow(9).height = 15;

  // Category and Client Type Revenue Shares Layout
  dashSheet.mergeCells("A10:H10");
  const tablesHeader = dashSheet.getCell("A10");
  tablesHeader.value = "PORTFOLIO SEGMENTATION BREAKDOWN SUMMARIES";
  tablesHeader.font = { name: "Arial", size: 12, bold: true, color: { argb: "FFFFFFFF" } };
  tablesHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF475569" } };
  tablesHeader.alignment = { horizontal: "center", vertical: "middle" };
  dashSheet.getRow(10).height = 25;

  // Let's create two mini tables directly in dashboard for quick look
  // Row 11: Table Column titles
  const tRow1 = dashSheet.getRow(12);
  dashSheet.getCell("A12").value = "Project Category";
  dashSheet.getCell("B12").value = "Projects Count";
  dashSheet.getCell("C12").value = "Total Revenue";
  dashSheet.getCell("D12").value = "Avg Margin";

  dashSheet.getCell("F12").value = "Client Segment";
  dashSheet.getCell("G12").value = "Projects Count";
  dashSheet.getCell("H12").value = "Total Revenue";

  const headerCells = ["A12", "B12", "C12", "D12", "F12", "G12", "H12"];
  headerCells.forEach(ref => {
    const headerC = dashSheet.getCell(ref);
    headerC.font = { name: "Arial", size: 9, bold: true, color: { argb: TEXT_WHITE } };
    headerC.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COL_HEADER_FILL } };
    headerC.alignment = { horizontal: "center", vertical: "middle" };
  });
  tRow1.height = 22;

  // Now, populate Category summary statistics using formulas referencing Category_Summary sheet
  const cats = ["Web", "App", "AI", "Cloud", "Automation", "Data", "Security"];
  cats.forEach((cat, idx) => {
    const rowNum = 13 + idx;
    const sIdx = 5 + idx; // Category_Summary rows start at 5
    
    // Category mapping
    dashSheet.getCell(`A${rowNum}`).value = cat;
    dashSheet.getCell(`B${rowNum}`).value = { formula: `=Category_Summary!B${sIdx}` };
    dashSheet.getCell(`C${rowNum}`).value = { formula: `=Category_Summary!C${sIdx}` };
    dashSheet.getCell(`D${rowNum}`).value = { formula: `=Category_Summary!G${sIdx}` };

    // Format numbers
    dashSheet.getCell(`B${rowNum}`).numFmt = "#,##0";
    dashSheet.getCell(`C${rowNum}`).numFmt = '"₹"#,##,##0';
    dashSheet.getCell(`D${rowNum}`).numFmt = "0.0%";

    dashSheet.getCell(`A${rowNum}`).font = { name: "Arial", size: 9, bold: true };
    dashSheet.getCell(`A${rowNum}`).alignment = { horizontal: "left" };
  });

  // Client Summary statistics using formulas referencing Client_Summary sheet
  const clients = ["Startup", "SME", "Enterprise", "Government"];
  clients.forEach((cli, idx) => {
    const rowNum = 13 + idx;
    const sIdx = 5 + idx; // Client_Summary rows start at 5

    dashSheet.getCell(`F${rowNum}`).value = cli;
    dashSheet.getCell(`G${rowNum}`).value = { formula: `=Client_Summary!B${sIdx}` };
    dashSheet.getCell(`H${rowNum}`).value = { formula: `=Client_Summary!C${sIdx}` };

    dashSheet.getCell(`G${rowNum}`).numFmt = "#,##0";
    dashSheet.getCell(`H${rowNum}`).numFmt = '"₹"#,##,##0';

    dashSheet.getCell(`F${rowNum}`).font = { name: "Arial", size: 9, bold: true };
    dashSheet.getCell(`F${rowNum}`).alignment = { horizontal: "left" };
  });

  // visual borders and spacing
  for (let r = 12; r <= 20; r++) {
    const row = dashSheet.getRow(r);
    row.height = 20;
    ["A", "B", "C", "D", "F", "G", "H"].forEach(col => {
      const c = dashSheet.getCell(`${col}${r}`);
      c.border = {
        bottom: { style: "thin", color: { argb: BORDER_COLOR } },
        right: { style: "thin", color: { argb: BORDER_COLOR } }
      };
    });
  }

  // Row 21: visual spacer
  dashSheet.getRow(21).height = 15;

  // Top 10 High-Revenue Projects Highlighted
  dashSheet.mergeCells("A22:H22");
  const topProjectsHeader = dashSheet.getCell("A22");
  topProjectsHeader.value = "TOP 10 RECONCILED HIGH-REVENUE VENTURES";
  topProjectsHeader.font = { name: "Arial", size: 11, bold: true, color: { argb: TEXT_WHITE } };
  topProjectsHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
  topProjectsHeader.alignment = { horizontal: "center", vertical: "middle" };
  dashSheet.getRow(22).height = 24;

  const tProjHeader = dashSheet.getRow(23);
  const pHeaders = [
    { cell: "A23", val: "Project ID" },
    { cell: "B23", val: "Project Name" },
    { cell: "C23", val: "Client Segment" },
    { cell: "D23", val: "Category" },
    { cell: "E23", val: "Start Date" },
    { cell: "F23", val: "Revenue" },
    { cell: "G23", val: "Net Profit" },
    { cell: "H23", val: "Margin %" }
  ];
  pHeaders.forEach(ph => {
    const c = dashSheet.getCell(ph.cell);
    c.value = ph.val;
    c.font = { name: "Arial", size: 9, bold: true, color: { argb: TEXT_WHITE } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COL_HEADER_FILL } };
    c.alignment = { horizontal: "center", vertical: "middle" };
  });
  tProjHeader.height = 22;

  // Let's write formulas referencing the sorting results, or hardcode references to top revenue projects
  // Since we know exactly who the top 10 are (sorted statically), let's map them to Project_Data indices, 
  // or we can write the top 10 values statically with high fidelity or write formula links if we sorted Project_Data!
  // To keep the spreadsheet completely bulletproof and fully dynamic, we link to the actual rows we generated.
  // Wait, sorting 100k rows takes time, but writing static record formulas pointing to specific rows is extremely elegant!
  // Even better, we can inject the static top 10 values since they are pre-calculated on server, maintaining total accuracy and instant spreadsheet load!
  summary.topRevenueProjects.forEach((p, idx) => {
    const rNum = 24 + idx;
    dashSheet.getCell(`A${rNum}`).value = p.projectId;
    dashSheet.getCell(`B${rNum}`).value = p.projectName;
    dashSheet.getCell(`C${rNum}`).value = p.clientType;
    dashSheet.getCell(`D${rNum}`).value = p.category;
    dashSheet.getCell(`E${rNum}`).value = p.startDate;
    dashSheet.getCell(`F${rNum}`).value = p.revenue;
    dashSheet.getCell(`G${rNum}`).value = p.netProfit;
    dashSheet.getCell(`H${rNum}`).value = p.profitMargin / 100;

    dashSheet.getCell(`F${rNum}`).numFmt = '"₹"#,##,##0';
    dashSheet.getCell(`G${rNum}`).numFmt = '"₹"#,##,##0';
    dashSheet.getCell(`H${rNum}`).numFmt = "0.0%";

    pHeaders.forEach(ph => {
      const colLetter = ph.cell.charAt(0);
      const c = dashSheet.getCell(`${colLetter}${rNum}`);
      c.font = { name: "Arial", size: 9 };
      c.border = { bottom: { style: "thin", color: { argb: BORDER_COLOR } } };
      if (colLetter === "A" || colLetter === "E" || colLetter === "H") {
        c.alignment = { horizontal: "center" };
      } else if (colLetter === "F" || colLetter === "G") {
        c.alignment = { horizontal: "right" };
      } else {
        c.alignment = { horizontal: "left" };
      }
    });

    dashSheet.getRow(rNum).height = 19;
  });

  // ==========================================
  // SHEET 2: Category_Summary
  // ==========================================
  const catSheet = workbook.addWorksheet("Category_Summary", {views: [{showGridLines: true}]});
  catSheet.columns = [
    { header: "Project Category", key: "category", width: 18 },
    { header: "Projects Count", key: "count", width: 15 },
    { header: "Total Revenue", key: "rev", width: 22 },
    { header: "Employee Cost", key: "emp", width: 22 },
    { header: "Infra Cost", key: "infra", width: 22 },
    { header: "Net Profit", key: "profit", width: 22 },
    { header: "Avg Profit Margin %", key: "margin", width: 20 }
  ];

  // Stylized Headers
  catSheet.getRow(1).height = 30;
  catSheet.getRow(1).eachCell((cell) => {
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: TEXT_WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COL_HEADER_FILL } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  // Title Row for Akrit Portfolio
  catSheet.insertRow(1, ["Category Financial Performance Overview – Registered under Mr. Akrit Pandey"]);
  catSheet.mergeCells("A1:G1");
  catSheet.getRow(1).height = 35;
  catSheet.getCell("A1").font = { name: "Arial", size: 12, bold: true, color: { argb: TEXT_WHITE } };
  catSheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
  catSheet.getCell("A1").alignment = { vertical: "middle", horizontal: "center" };

  catSheet.getRow(2).height = 12; // spacer row

  // Let's populate the Categories row by row using EXCEL FORMULAS!
  // This satisfies "Pivot tables like summaries / Auto-refresh formulas" beautifully
  const catNames = ["AI", "Cloud", "Web", "App", "Security", "Automation", "Data"];
  catNames.forEach((catName, idx) => {
    const rowNum = 5 + idx;
    
    // Set static category name
    catSheet.getCell(`A${rowNum}`).value = catName;
    
    // Count of projects
    catSheet.getCell(`B${rowNum}`).value = {
      formula: `=COUNTIF(Project_Data!E2:E100001, "${catName}")`,
      result: summary.categorySummary.find(cs => cs.category === catName)?.projectsCount || 0
    };
    
    // Sum of revenue
    catSheet.getCell(`C${rowNum}`).value = {
      formula: `=SUMIF(Project_Data!E2:E100001, "${catName}", Project_Data!L2:L100001)`,
      result: summary.categorySummary.find(cs => cs.category === catName)?.totalRevenue || 0
    };

    // Sum of employee cost
    catSheet.getCell(`D${rowNum}`).value = {
      formula: `=SUMIF(Project_Data!E2:E100001, "${catName}", Project_Data!M2:M100001)`,
      result: summary.categorySummary.find(cs => cs.category === catName)?.totalEmployeeCost || 0
    };

    // Sum of infrastructure cost
    catSheet.getCell(`E${rowNum}`).value = {
      formula: `=SUMIF(Project_Data!E2:E100001, "${catName}", Project_Data!N2:N100001)`,
      result: summary.categorySummary.find(cs => cs.category === catName)?.totalInfrastructureCost || 0
    };

    // Net Profit formula
    catSheet.getCell(`F${rowNum}`).value = {
      formula: `=C${rowNum}-D${rowNum}-E${rowNum}`,
      result: summary.categorySummary.find(cs => cs.category === catName)?.totalNetProfit || 0
    };

    // Margin formula
    catSheet.getCell(`G${rowNum}`).value = {
      formula: `=F${rowNum}/C${rowNum}`,
      result: (summary.categorySummary.find(cs => cs.category === catName)?.avgProfitMargin || 0) / 100
    };

    // Formats
    catSheet.getCell(`B${rowNum}`).numFmt = "#,##0";
    catSheet.getCell(`C${rowNum}`).numFmt = '"₹"#,##,##0';
    catSheet.getCell(`D${rowNum}`).numFmt = '"₹"#,##,##0';
    catSheet.getCell(`E${rowNum}`).numFmt = '"₹"#,##,##0';
    catSheet.getCell(`F${rowNum}`).numFmt = '"₹"#,##,##0';
    catSheet.getCell(`G${rowNum}`).numFmt = "0.0%";

    catSheet.getRow(rowNum).height = 20;

    // Apply borders
    ["A", "B", "C", "D", "E", "F", "G"].forEach(col => {
      const cell = catSheet.getCell(`${col}${rowNum}`);
      cell.font = { name: "Arial", size: 10 };
      cell.border = {
        bottom: { style: "thin", color: { argb: BORDER_COLOR } },
        right: { style: "thin", color: { argb: BORDER_COLOR } }
      };
    });
  });

  // Total summary row
  const catTotalRow = 12;
  catSheet.getCell(`A${catTotalRow}`).value = "TOTALS / AVERAGE";
  catSheet.getCell(`A${catTotalRow}`).font = { name: "Arial", size: 10, bold: true };
  
  catSheet.getCell(`B${catTotalRow}`).value = { formula: `=SUM(B5:B11)`, result: 100000 };
  catSheet.getCell(`C${catTotalRow}`).value = { formula: `=SUM(C5:C11)`, result: summary.kpis.totalRevenue };
  catSheet.getCell(`D${catTotalRow}`).value = { formula: `=SUM(D5:D11)`, result: summary.kpis.totalEmployeeCost };
  catSheet.getCell(`E${catTotalRow}`).value = { formula: `=SUM(E5:E11)`, result: summary.kpis.totalInfrastructureCost };
  catSheet.getCell(`F${catTotalRow}`).value = { formula: `=SUM(F5:F11)`, result: summary.kpis.totalNetProfit };
  catSheet.getCell(`G${catTotalRow}`).value = { formula: `=F${catTotalRow}/C${catTotalRow}`, result: summary.kpis.avgProfitMargin / 100 };

  catSheet.getCell(`B${catTotalRow}`).numFmt = "#,##0";
  catSheet.getCell(`C${catTotalRow}`).numFmt = '"₹"#,##,##0';
  catSheet.getCell(`D${catTotalRow}`).numFmt = '"₹"#,##,##0';
  catSheet.getCell(`E${catTotalRow}`).numFmt = '"₹"#,##,##0';
  catSheet.getCell(`F${catTotalRow}`).numFmt = '"₹"#,##,##0';
  catSheet.getCell(`G${catTotalRow}`).numFmt = "0.0%";

  ["A", "B", "C", "D", "E", "F", "G"].forEach(col => {
    const c = catSheet.getCell(`${col}${catTotalRow}`);
    c.font = { name: "Arial", size: 10, bold: true };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    c.border = {
      top: { style: "double", color: { argb: COL_HEADER_FILL } },
      bottom: { style: "double", color: { argb: COL_HEADER_FILL } }
    };
  });
  catSheet.getRow(catTotalRow).height = 24;


  // ==========================================
  // SHEET 3: Client_Summary
  // ==========================================
  const cliSheet = workbook.addWorksheet("Client_Summary", {views: [{showGridLines: true}]});
  cliSheet.columns = [
    { header: "Client Segment", key: "clientType", width: 18 },
    { header: "Projects Count", key: "count", width: 15 },
    { header: "Total Revenue", key: "rev", width: 22 },
    { header: "Employee Cost", key: "emp", width: 22 },
    { header: "Infra Cost", key: "infra", width: 22 },
    { header: "Net Profit", key: "profit", width: 22 },
    { header: "Avg Profit Margin %", key: "margin", width: 20 }
  ];

  // Title Row for Akrit Portfolio
  cliSheet.insertRow(1, ["Client segments Performance Overview – Registered under Mr. Akrit Pandey"]);
  cliSheet.mergeCells("A1:G1");
  cliSheet.getRow(1).height = 35;
  cliSheet.getCell("A1").font = { name: "Arial", size: 12, bold: true, color: { argb: TEXT_WHITE } };
  cliSheet.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF334155" } };
  cliSheet.getCell("A1").alignment = { vertical: "middle", horizontal: "center" };

  cliSheet.getRow(2).height = 12; // spacer row

  // Headers set
  cliSheet.getRow(3).height = 30;
  cliSheet.getRow(3).eachCell((cell) => {
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: TEXT_WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COL_HEADER_FILL } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  const clientTypesArr = ["Startup", "SME", "Enterprise", "Government"];
  clientTypesArr.forEach((cType, idx) => {
    const rowNum = 5 + idx;

    cliSheet.getCell(`A${rowNum}`).value = cType;

    cliSheet.getCell(`B${rowNum}`).value = {
      formula: `=COUNTIF(Project_Data!D2:D100001, "${cType}")`,
      result: summary.clientSummary.find(cs => cs.clientType === cType)?.projectsCount || 0
    };

    cliSheet.getCell(`C${rowNum}`).value = {
      formula: `=SUMIF(Project_Data!D2:D100001, "${cType}", Project_Data!L2:L100001)`,
      result: summary.clientSummary.find(cs => cs.clientType === cType)?.totalRevenue || 0
    };

    cliSheet.getCell(`D${rowNum}`).value = {
      formula: `=SUMIF(Project_Data!D2:D100001, "${cType}", Project_Data!M2:M100001)`,
      result: summary.clientSummary.find(cs => cs.clientType === cType)?.totalEmployeeCost || 0
    };

    cliSheet.getCell(`E${rowNum}`).value = {
      formula: `=SUMIF(Project_Data!D2:D100001, "${cType}", Project_Data!N2:N100001)`,
      result: summary.clientSummary.find(cs => cs.clientType === cType)?.totalInfrastructureCost || 0
    };

    cliSheet.getCell(`F${rowNum}`).value = {
      formula: `=C${rowNum}-D${rowNum}-E${rowNum}`,
      result: summary.clientSummary.find(cs => cs.clientType === cType)?.totalNetProfit || 0
    };

    cliSheet.getCell(`G${rowNum}`).value = {
      formula: `=F${rowNum}/C${rowNum}`,
      result: (summary.clientSummary.find(cs => cs.clientType === cType)?.avgProfitMargin || 0) / 100
    };

    cliSheet.getCell(`B${rowNum}`).numFmt = "#,##0";
    cliSheet.getCell(`C${rowNum}`).numFmt = '"₹"#,##,##0';
    cliSheet.getCell(`D${rowNum}`).numFmt = '"₹"#,##,##0';
    cliSheet.getCell(`E${rowNum}`).numFmt = '"₹"#,##,##0';
    cliSheet.getCell(`F${rowNum}`).numFmt = '"₹"#,##,##0';
    cliSheet.getCell(`G${rowNum}`).numFmt = "0.0%";

    cliSheet.getRow(rowNum).height = 20;

    ["A", "B", "C", "D", "E", "F", "G"].forEach(col => {
      const cell = cliSheet.getCell(`${col}${rowNum}`);
      cell.font = { name: "Arial", size: 10 };
      cell.border = {
        bottom: { style: "thin", color: { argb: BORDER_COLOR } },
        right: { style: "thin", color: { argb: BORDER_COLOR } }
      };
    });
  });

  const cliTotalRow = 9;
  cliSheet.getCell(`A${cliTotalRow}`).value = "TOTALS / AVERAGE";
  cliSheet.getCell(`B${cliTotalRow}`).value = { formula: `=SUM(B5:B8)`, result: 100000 };
  cliSheet.getCell(`C${cliTotalRow}`).value = { formula: `=SUM(C5:C8)`, result: summary.kpis.totalRevenue };
  cliSheet.getCell(`D${cliTotalRow}`).value = { formula: `=SUM(D5:D8)`, result: summary.kpis.totalEmployeeCost };
  cliSheet.getCell(`E${cliTotalRow}`).value = { formula: `=SUM(E5:E8)`, result: summary.kpis.totalInfrastructureCost };
  cliSheet.getCell(`F${cliTotalRow}`).value = { formula: `=SUM(F5:F8)`, result: summary.kpis.totalNetProfit };
  cliSheet.getCell(`G${cliTotalRow}`).value = { formula: `=F${cliTotalRow}/C${cliTotalRow}`, result: summary.kpis.avgProfitMargin / 100 };

  cliSheet.getCell(`B${cliTotalRow}`).numFmt = "#,##0";
  cliSheet.getCell(`C${cliTotalRow}`).numFmt = '"₹"#,##,##0';
  cliSheet.getCell(`D${cliTotalRow}`).numFmt = '"₹"#,##,##0';
  cliSheet.getCell(`E${cliTotalRow}`).numFmt = '"₹"#,##,##0';
  cliSheet.getCell(`F${cliTotalRow}`).numFmt = '"₹"#,##,##0';
  cliSheet.getCell(`G${cliTotalRow}`).numFmt = "0.0%";

  ["A", "B", "C", "D", "E", "F", "G"].forEach(col => {
    const c = cliSheet.getCell(`${col}${cliTotalRow}`);
    c.font = { name: "Arial", size: 10, bold: true };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };
    c.border = {
      top: { style: "double", color: { argb: COL_HEADER_FILL } },
      bottom: { style: "double", color: { argb: COL_HEADER_FILL } }
    };
  });
  cliSheet.getRow(cliTotalRow).height = 24;


  // ==========================================
  // SHEET 4: CALCULATIONS (Meta specifications for dynamic charts and indices)
  // ==========================================
  const calcSheet = workbook.addWorksheet("Calculations", {views: [{showGridLines: true}]});
  calcSheet.columns = [
    { header: "Parameter", key: "param", width: 25 },
    { header: "Formula / Value", key: "val", width: 35 },
    { header: "Description", key: "desc", width: 45 }
  ];

  calcSheet.getRow(1).height = 25;
  calcSheet.getRow(1).eachCell((cell) => {
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: TEXT_WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF475569" } };
  });

  const metaRows = [
    ["System Version", "BI-MIS Engine v2026.1", "Enterprise intelligence specification version"],
    ["Total Records Ingested", 100000, "Official row counts confirmed in database engine"],
    ["Declared Principal Owner", "Mr. Akrit Pandey", "Senior analytics director and manager"],
    ["Active Reporting Period", "May 2026", "Month-long project simulation context"],
    ["Target Currency Focus", "INR (₹)", "Indian National Rupee reporting context"],
    ["Database Integrations", "Power BI / Tableau Ready", "Fully normalized schema structures suitable for ingestion"]
  ];
  metaRows.forEach((mr, idx) => {
    calcSheet.addRow(mr);
  });


  // ==========================================
  // SHEET 5: Project_Data (100,000 ROWS)
  // ==========================================
  const dataSheet = workbook.addWorksheet("Project_Data", {
    views: [{ showGridLines: true }]
  });

  // Columns definition (A to U)
  const columnsDef = [
    { header: "Project ID", key: "projectId", width: 14 },
    { header: "Project Name", key: "projectName", width: 30 },
    { header: "Project Owner", key: "projectOwner", width: 18 },
    { header: "Client Type", key: "clientType", width: 15 },
    { header: "Category", key: "category", width: 14 },
    { header: "Sub-category", key: "subcategory", width: 18 },
    { header: "Start Date", key: "startDate", width: 15 },
    { header: "End Date", key: "endDate", width: 15 },
    { header: "Project Duration", key: "duration", width: 16 },
    { header: "Project Status", key: "status", width: 15 },
    { header: "Project Priority", key: "priority", width: 15 },
    { header: "Revenue (₹)", key: "revenue", width: 18 },
    { header: "Employee Cost", key: "employeeCost", width: 18 },
    { header: "Infrastructure Cost", key: "infrastructureCost", width: 18 },
    { header: "Net Profit", key: "netProfit", width: 18 },
    { header: "Profit Margin %", key: "profitMargin", width: 16 },
    { header: "ROI Score", key: "roiScore", width: 13 },
    { header: "Risk Score", key: "riskScore", width: 13 },
    { header: "Efficiency Rating", key: "efficiencyRating", width: 16 },
    { header: "Success Prob %", key: "successProbability", width: 15 },
    { header: "Cost Efficiency Index", key: "costEfficiencyIndex", width: 22 }
  ];

  dataSheet.columns = columnsDef;

  // Header styling in Project_Data
  dataSheet.getRow(1).height = 28;
  dataSheet.getRow(1).eachCell((cell, colNum) => {
    cell.font = { name: "Arial", size: 10, bold: true, color: { argb: TEXT_WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COL_HEADER_FILL } };
    cell.alignment = { vertical: "middle", horizontal: "center" };
  });

  // Writing rows in batches for supreme high performance
  // In exceljs, we can write raw array of objects or values directly
  // We can write calculated fields as dynamic formulas or precomputed values.
  // To keep it standard, lightweight and interactive in Excel, we use actual Excel formulas for Duration, Net Profit, and Profit Margin!
  // Writing 100,000 rows with formulas in exceljs is fast.
  const rowValues: any[] = [];
  
  projects.forEach((p, idx) => {
    const rowNum = idx + 2; // Row numbers are 1-based, index starts at 0, row 1 is header
    
    // Values matching the columnsDef index:
    rowValues.push([
      p.projectId,
      p.projectName,
      p.projectOwner,
      p.clientType,
      p.category,
      p.subcategory,
      p.startDate,
      p.endDate,
      { formula: `=H${rowNum}-G${rowNum}`, result: p.duration }, // Duration (End Date - Start Date)
      p.status,
      p.priority,
      p.revenue,
      p.employeeCost,
      p.infrastructureCost,
      { formula: `=L${rowNum}-M${rowNum}-N${rowNum}`, result: p.netProfit }, // Net Profit (Revenue - EmpCost - InfraCost)
      { formula: `=O${rowNum}/L${rowNum}`, result: p.profitMargin / 100 }, // Profit Margin (NetProfit / Revenue) styled as percentage
      p.roiScore,
      p.riskScore,
      p.efficiencyRating,
      p.successProbability / 100, // styled as percentage
      p.costEfficiencyIndex
    ]);
  });

  dataSheet.addRows(rowValues);

  // Apply number formats to columns to avoid setting on each of 2,000,000 cells individually!
  // This is a huge performance trick! Setting format on the column level directly.
  dataSheet.getColumn("revenue").numFmt = '"₹"#,##,##0'; // Rev
  dataSheet.getColumn("employeeCost").numFmt = '"₹"#,##,##0'; // Emp
  dataSheet.getColumn("infrastructureCost").numFmt = '"₹"#,##,##0'; // Infra
  dataSheet.getColumn("netProfit").numFmt = '"₹"#,##,##0'; // Net Profit
  dataSheet.getColumn("profitMargin").numFmt = '0.0%'; // Profit Margin
  dataSheet.getColumn("successProbability").numFmt = '0%'; // Success prob

  return workbook;
}
