/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { ProjectRecord, ExecutiveSummary, CategorySummaryItem, ClientSummaryItem, DailyRevenueTrendItem } from "./types.js";

// LCG Pseudo-Random Number Generator for consistent data generation
export function createPRNG(seed: number = 42) {
  let state = seed;
  return function() {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

const CATEGORIES = ["Web", "App", "AI", "Cloud", "Automation", "Data", "Security"] as const;

const SUBCATEGORIES: Record<string, string[]> = {
  Web: ["SaaS Core", "FinTech Ledger", "E-Commerce Gateway", "CMS Enterprise", "B2B Client Portal"],
  App: ["iOS Mobile Wallet", "Android Logistics App", "Cross-Platform POS", "AR Product Viewer", "Field Agent Mobile"],
  AI: ["ML Predictive Core", "Support Voice Agent", "LLM Pipeline", "Vision Quality Control", "Recommender System"],
  Cloud: ["DevOps CD/CI Pipeline", "AWS Migration Vault", "K8s Serverless Hub", "Multi-Region Cluster", "Microservices API Gateway"],
  Automation: ["Invoice RPA Script", "IoT Smart Sync Engine", "Task Orchestrator", "Regression Test Automator", "Logistic Sync Tool"],
  Data: ["BI Executive Lakehouse", "Pipeline ETL Monitor", "Cassandra Tuner Node", "Sales Flow Warehouse", "Real-time Metrics Cube"],
  Security: ["Zero-Trust IAM Vault", "Network Pentest Suite", "End-to-End Encryption Hub", "IDS Firewalls Console", "SOC2 Compliance Auditor"]
};

const PROJECT_NAME_TEMPLATES: Record<string, string[]> = {
  Web: [
    "SaaS Operations Hub", "Secured FinTech Ledger", "Unified Commerce Gateway",
    "B2B Portal Framework", "Enterprise Headless CMS", "Dynamic Client Hub"
  ],
  App: [
    "iOS Asset Tracker", "Android Delivery App", "Integrated POS Assistant",
    "AR Product Renderer", "Customer Self-Service App", "Cross-Platform Agent UI"
  ],
  AI: [
    "Predictive Insights Engine", "Customer Service Agent AI", "Enterprise Agent Pipeline",
    "Neural Image Defect Finder", "Personalized Recommendation Engine", "Deep Cognition Dashboard"
  ],
  Cloud: [
    "Standardized Devops Pipeline", "Automated Cloud Migration Suite", "Kubernetes Mesh Manager",
    "Distributed DB Cluster Admin", "Serverless Scale Controller", "Zero-Trust Cloud Firewall"
  ],
  Automation: [
    "RPA Billing Processor", "Sensors IoT Synchronization Engine", "Scheduled Task Runner",
    "Continuous Interoperability Tester", "Supply Chain Dispatch Automator", "Workflow Optimizer Core"
  ],
  Data: [
    "Analytics Lakehouse", "Real-time Streaming Platform", "DB Reliability Tuner",
    "Integrated BI Console", "Enterprise Analytics Warehouse", "ETL Processing Daemon"
  ],
  Security: [
    "Network Threat Monitor", "Advanced Threat Vault", "Dynamic IAM Controller",
    "Audit Log Validator", "Incident Response Registry", "Security Perimeter Console"
  ]
};

const PRIORITIES = ["Low", "Medium", "High", "Critical"] as const;
const STATUSES = ["Completed", "In Progress", "Delayed"] as const;

// Cached in-memory instances to prevent recreating 100,000 records on every REST API call
let cachedProjects: ProjectRecord[] | null = null;
let cachedSummary: ExecutiveSummary | null = null;

export function generateProjectRecords(): ProjectRecord[] {
  if (cachedProjects) return cachedProjects;

  const rand = createPRNG(42); // Consistent seed
  const projects: ProjectRecord[] = [];

  const rowCount = 100000;

  for (let i = 1; i <= rowCount; i++) {
    const projectId = `P${String(i).padStart(6, "0")}`;

    // 🏆 CATEGORY DISTRIBUTION
    // Web: 25%, App: 20%, AI: 20%, Cloud: 15%, Automation: 10%, Data: 5%, Security: 5%
    const catRoll = rand();
    let category: typeof CATEGORIES[number];
    if (catRoll < 0.25) {
      category = "Web";
    } else if (catRoll < 0.45) {
      category = "App";
    } else if (catRoll < 0.65) {
      category = "AI";
    } else if (catRoll < 0.80) {
      category = "Cloud";
    } else if (catRoll < 0.90) {
      category = "Automation";
    } else if (catRoll < 0.95) {
      category = "Data";
    } else {
      category = "Security";
    }

    // Subcategory mapping
    const subList = SUBCATEGORIES[category];
    const subcategory = subList[Math.floor(rand() * subList.length)];

    // Project Name matching template
    const templates = PROJECT_NAME_TEMPLATES[category];
    const template = templates[Math.floor(rand() * templates.length)];
    const projectName = `${template} [#${i}]`;

    // 🏢 BUSINESS DISTRIBUTION
    // Startup: 40%, SME: 30%, Enterprise: 20%, Government: 10%
    const clientRoll = rand();
    let clientType: ProjectRecord["clientType"];
    if (clientRoll < 0.40) {
      clientType = "Startup";
    } else if (clientRoll < 0.70) {
      clientType = "SME";
    } else if (clientRoll < 0.90) {
      clientType = "Enterprise";
    } else {
      clientType = "Government";
    }

    // 📅 TIME RULES (MAY 2026)
    // Projects strictly in May 2026
    const startDay = Math.floor(rand() * 25) + 1; // 1 to 25
    const duration = Math.floor(rand() * 43) + 3; // 3 to 45 days. Wait, if strictly in May 2026, let's cap endDay up to 31
    const endDay = Math.min(31, startDay + duration);
    const calculatedDuration = endDay - startDay;

    const startDate = `2026-05-${String(startDay).padStart(2, "0")}`;
    const endDate = `2026-05-${String(endDay).padStart(2, "0")}`;

    // Project Priority
    const priority = PRIORITIES[Math.floor(rand() * PRIORITIES.length)];

    // Project Status
    // Make Completed more likely for early starts, Delayed for critical/high workload
    const statusRoll = rand();
    let status: ProjectRecord["status"];
    if (statusRoll < 0.70) {
      status = "Completed";
    } else if (statusRoll < 0.90) {
      status = "In Progress";
    } else {
      status = "Delayed";
    }

    // 💰 FINANCIAL SYSTEM
    // Revenue: ₹1,00,000 to ₹25,00,000
    const revenue = Math.floor(rand() * 2400000) + 100000;

    // Employee Cost: 30% to 50% of revenue
    const empCostPct = rand() * 0.20 + 0.30;
    const employeeCost = Math.round(revenue * empCostPct);

    // Infra Cost: 5% to 15% of revenue
    const infraCostPct = rand() * 0.10 + 0.05;
    const infrastructureCost = Math.round(revenue * infraCostPct);

    // Net Profit
    const netProfit = revenue - employeeCost - infrastructureCost;

    // Profit Margin %
    const profitMargin = parseFloat(((netProfit / revenue) * 100).toFixed(2));

    // Success Probability (derived logically from status, risk & priority)
    let successProbability = Math.round(rand() * 40 + 50); // 50 to 90 by default
    if (status === "Completed") successProbability = 100;
    else if (status === "Delayed") successProbability = Math.round(rand() * 30 + 30); // 30 to 60

    // Risk Score
    let riskScore: ProjectRecord["riskScore"] = "Medium";
    if (profitMargin < 15 || status === "Delayed" || priority === "Critical") {
      riskScore = "High";
    } else if (profitMargin > 25 && status === "Completed") {
      riskScore = "Low";
    }

    // ROI Score (0 to 100)
    const roiScore = Math.min(100, Math.max(0, Math.round(profitMargin * 1.5 + successProbability * 0.4)));

    // Efficiency Rating (1 to 10)
    const efficiencyRating = Math.min(10, Math.max(1, Math.round((netProfit / (employeeCost + infrastructureCost)) * 5)));

    // Cost Efficiency Index (rev / total cost)
    const costEfficiencyIndex = parseFloat((revenue / (employeeCost + infrastructureCost)).toFixed(3));

    projects.push({
      projectId,
      projectName,
      projectOwner: "Mr. Akrit Pandey",
      clientType,
      category,
      subcategory,
      startDate,
      endDate,
      duration: calculatedDuration,
      status,
      priority,
      revenue,
      employeeCost,
      infrastructureCost,
      netProfit,
      profitMargin,
      roiScore,
      riskScore,
      efficiencyRating,
      successProbability,
      costEfficiencyIndex,
    });
  }

  cachedProjects = projects;
  return projects;
}

export function generateExecutiveSummary(): ExecutiveSummary {
  if (cachedSummary) return cachedSummary;

  const projects = generateProjectRecords();

  let totalRevenue = 0;
  let totalEmployeeCost = 0;
  let totalInfrastructureCost = 0;
  let totalNetProfit = 0;

  // Breakdown aggregators
  const categoryMap: Record<string, { count: number; rev: number; emp: number; infra: number; profit: number }> = {};
  const clientMap: Record<string, { count: number; rev: number; emp: number; infra: number; profit: number }> = {};
  const dailyTrendsMap: Record<number, { rev: number; count: number }> = {};

  // Initialize day trend map
  for (let d = 1; d <= 31; d++) {
    dailyTrendsMap[d] = { rev: 0, count: 0 };
  }

  // Profit Margin distribution buckets
  const bucketCounts = {
    "< 10%": 0,
    "10% - 20%": 0,
    "20% - 30%": 0,
    "30% - 40%": 0,
    "> 40%": 0
  };

  for (const p of projects) {
    totalRevenue += p.revenue;
    totalEmployeeCost += p.employeeCost;
    totalInfrastructureCost += p.infrastructureCost;
    totalNetProfit += p.netProfit;

    // Category aggregations
    if (!categoryMap[p.category]) {
      categoryMap[p.category] = { count: 0, rev: 0, emp: 0, infra: 0, profit: 0 };
    }
    categoryMap[p.category].count++;
    categoryMap[p.category].rev += p.revenue;
    categoryMap[p.category].emp += p.employeeCost;
    categoryMap[p.category].infra += p.infrastructureCost;
    categoryMap[p.category].profit += p.netProfit;

    // Client aggregations
    if (!clientMap[p.clientType]) {
      clientMap[p.clientType] = { count: 0, rev: 0, emp: 0, infra: 0, profit: 0 };
    }
    clientMap[p.clientType].count++;
    clientMap[p.clientType].rev += p.revenue;
    clientMap[p.clientType].emp += p.employeeCost;
    clientMap[p.clientType].infra += p.infrastructureCost;
    clientMap[p.clientType].profit += p.netProfit;

    // Daily revenue trends using start day
    const day = parseInt(p.startDate.split("-")[2]);
    if (dailyTrendsMap[day]) {
      dailyTrendsMap[day].rev += p.revenue;
      dailyTrendsMap[day].count++;
    }

    // Profit margin distribution histogram buckets
    const margin = p.profitMargin;
    if (margin < 10) {
      bucketCounts["< 10%"]++;
    } else if (margin < 20) {
      bucketCounts["10% - 20%"]++;
    } else if (margin < 30) {
      bucketCounts["20% - 30%"]++;
    } else if (margin < 40) {
      bucketCounts["30% - 40%"]++;
    } else {
      bucketCounts["> 40%"]++;
    }
  }

  const categorySummary: CategorySummaryItem[] = Object.keys(categoryMap).map(cat => {
    const data = categoryMap[cat];
    return {
      category: cat,
      projectsCount: data.count,
      totalRevenue: data.rev,
      totalEmployeeCost: data.emp,
      totalInfrastructureCost: data.infra,
      totalNetProfit: data.profit,
      avgProfitMargin: parseFloat(((data.profit / data.rev) * 100).toFixed(2))
    };
  });

  const clientSummary: ClientSummaryItem[] = Object.keys(clientMap).map(client => {
    const data = clientMap[client];
    return {
      clientType: client,
      projectsCount: data.count,
      totalRevenue: data.rev,
      totalEmployeeCost: data.emp,
      totalInfrastructureCost: data.infra,
      totalNetProfit: data.profit,
      avgProfitMargin: parseFloat(((data.profit / data.rev) * 100).toFixed(2))
    };
  });

  const dailyTrends: DailyRevenueTrendItem[] = Object.keys(dailyTrendsMap).map(key => {
    const day = parseInt(key);
    const data = dailyTrendsMap[day];
    return {
      date: `2026-05-${String(day).padStart(2, "0")}`,
      day,
      revenue: data.rev,
      projectsCount: data.count
    };
  }).sort((a, b) => a.day - b.day);

  // Top 10 High revenue
  // Since sorting 100,000 items on every run can take 20ms, we can optimize: filter and capture
  const topRevenueProjects = [...projects]
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Top 10 Profit
  const topProfitableProjects = [...projects]
    .sort((a, b) => b.netProfit - a.netProfit)
    .slice(0, 10);

  const profitDistribution = Object.keys(bucketCounts).map(bucket => ({
    bucket,
    count: bucketCounts[bucket as keyof typeof bucketCounts]
  }));

  const avgProfitMargin = parseFloat(((totalNetProfit / totalRevenue) * 100).toFixed(2));

  cachedSummary = {
    kpis: {
      totalRevenue,
      totalEmployeeCost,
      totalInfrastructureCost,
      totalNetProfit,
      totalProjects: projects.length,
      avgProfitMargin
    },
    categorySummary,
    clientSummary,
    dailyTrends,
    topRevenueProjects,
    topProfitableProjects,
    profitDistribution
  };

  return cachedSummary;
}
