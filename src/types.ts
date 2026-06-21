/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProjectRecord {
  projectId: string; // P000001 -> P100000
  projectName: string;
  projectOwner: string; // Mr. Akrit Pandey
  clientType: "Startup" | "SME" | "Enterprise" | "Government";
  category: "AI" | "Cloud" | "Web" | "App" | "Security" | "Automation" | "Data";
  subcategory: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  duration: number; // End Date - Start Date in days
  status: "Completed" | "In Progress" | "Delayed";
  priority: "Low" | "Medium" | "High" | "Critical";
  revenue: number; // ₹1,00,000 to ₹25,00,000
  employeeCost: number; // 30% - 50% of revenue
  infrastructureCost: number; // 5% - 15% of revenue
  netProfit: number; // Revenue - EmployeeCost - InfraCost
  profitMargin: number; // (NetProfit / Revenue) * 100
  roiScore: number; // 0 - 100
  riskScore: "Low" | "Medium" | "High";
  efficiencyRating: number; // 1 - 10
  successProbability: number; // 0 - 100
  costEfficiencyIndex: number; // Revenue / Total costs
}

export interface CategorySummaryItem {
  category: string;
  projectsCount: number;
  totalRevenue: number;
  totalEmployeeCost: number;
  totalInfrastructureCost: number;
  totalNetProfit: number;
  avgProfitMargin: number;
}

export interface ClientSummaryItem {
  clientType: string;
  projectsCount: number;
  totalRevenue: number;
  totalEmployeeCost: number;
  totalInfrastructureCost: number;
  totalNetProfit: number;
  avgProfitMargin: number;
}

export interface DailyRevenueTrendItem {
  date: string; // YYYY-MM-DD (raw date of May 2026)
  day: number; // 1 to 31
  revenue: number;
  projectsCount: number;
}

export interface ExecutiveSummary {
  kpis: {
    totalRevenue: number;
    totalEmployeeCost: number;
    totalInfrastructureCost: number;
    totalNetProfit: number;
    totalProjects: number;
    avgProfitMargin: number;
  };
  categorySummary: CategorySummaryItem[];
  clientSummary: ClientSummaryItem[];
  dailyTrends: DailyRevenueTrendItem[];
  topRevenueProjects: ProjectRecord[];
  topProfitableProjects: ProjectRecord[];
  profitDistribution: { bucket: string; count: number }[];
}
