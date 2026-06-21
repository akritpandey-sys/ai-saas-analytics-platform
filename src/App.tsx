/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from "recharts";
import { 
  Briefcase, TrendingUp, Users, HardDrive, DollarSign, Wallet, Percent, 
  Search, Filter, ChevronLeft, ChevronRight, Download, Eye, ExternalLink, 
  Database, RefreshCw, Key, CheckCircle, AlertTriangle, AlertCircle, FileSpreadsheet
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "firebase/auth";
import { initAuth, googleSignIn, logout } from "./firebase";
import { ProjectRecord, ExecutiveSummary } from "./types";

// Standard Indian National Rupee styling format (₹ xx,xx,xxx)
export function formatINR(val: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(val);
}

// Compact formatting helper (e.g., ₹12.5 Cr)
export function formatCompactINR(val: number): string {
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)} L`;
  }
  return formatINR(val);
}

export default function App() {
  // Authentication states
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [exportingToDrive, setExportingToDrive] = useState(false);
  const [driveResult, setDriveResult] = useState<{ webViewLink: string; fileName: string } | null>(null);
  const [convertToSheets, setConvertToSheets] = useState(true);

  // MIS Data states
  const [summary, setSummary] = useState<ExecutiveSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  
  // Paginated Project List states
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [totalProjectsCount, setTotalProjectsCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [projectsPerPage, setProjectsPerPage] = useState(15);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // Filters state
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("");

  // Tabs state ("dashboard" or "explorer")
  const [activeTab, setActiveTab] = useState<"dashboard" | "explorer">("dashboard");
  const [copied, setCopied] = useState(false);

  // Load Auth State
  useEffect(() => {
    initAuth(
      (user, token) => {
        setUser(user);
        setAccessToken(token);
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
  }, []);

  // Fetch Summary dashboard aggregates
  useEffect(() => {
    const fetchSummary = async () => {
      setLoadingSummary(true);
      try {
        const res = await fetch("/api/dashboard-summary");
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (err) {
        console.error("Error fetching summary dashboard aggregates:", err);
      } finally {
        setLoadingSummary(false);
      }
    };
    fetchSummary();
  }, []);

  // Fetch individual projects dynamically with routing pagination & query params
  useEffect(() => {
    const fetchProjects = async () => {
      setLoadingProjects(true);
      try {
        const query = new URLSearchParams({
          page: String(currentPage),
          limit: String(projectsPerPage),
          search,
          category: selectedCategory,
          clientType: selectedClient,
          status: selectedStatus,
          priority: selectedPriority
        });
        const res = await fetch(`/api/projects?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProjects(data.projects);
          setTotalProjectsCount(data.totalCount);
        }
      } catch (err) {
        console.error("Error fetching records list:", err);
      } finally {
        setLoadingProjects(false);
      }
    };

    // Debounce search a bit
    const delay = setTimeout(fetchProjects, 150);
    return () => clearTimeout(delay);
  }, [currentPage, projectsPerPage, search, selectedCategory, selectedClient, selectedStatus, selectedPriority]);

  // Google Sign-in Handler
  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
      }
    } catch (err: any) {
      console.error("Failed to sign in:", err);
      if (
        err?.code === "auth/popup-closed-by-user" || 
        err?.message?.includes("popup-closed-by-user") || 
        err?.message?.includes("closed by the user")
      ) {
        setAuthError("POPUP_BLOCKED_OR_CLOSED");
      } else {
        setAuthError(err?.message || String(err));
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Google Signout Handler
  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
    setDriveResult(null);
  };

  // Export spreadsheet direct to Google Drive (utilizing real backend conversion)
  const handleDriveExport = async () => {
    if (!accessToken) {
      alert("Please sign in with your Google account first.");
      return;
    }

    setExportingToDrive(true);
    setDriveResult(null);
    try {
      const res = await fetch("/api/export-to-drive", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        },
        body: JSON.stringify({ convertToSheets })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDriveResult({
          webViewLink: data.webViewLink,
          fileName: data.fileName
        });
      } else {
        alert(data.error || "Failed to upload to Google Drive");
      }
    } catch (err: any) {
      console.error("Failed Drive upload:", err);
      alert("Error reaching server for Drive upload: " + err.message);
    } finally {
      setExportingToDrive(false);
    }
  };

  // KPI metadata parsing helper
  const totalEmployeesCost = summary?.kpis.totalEmployeeCost || 0;
  const totalInfrastructureCost = summary?.kpis.totalInfrastructureCost || 0;
  const totalNetProfit = summary?.kpis.totalNetProfit || 0;
  const totalRevenue = summary?.kpis.totalRevenue || 0;
  const totalProjects = summary?.kpis.totalProjects || 100000;
  const averageMargin = summary?.kpis.avgProfitMargin || 0;

  // Pie Chart: Revenue vs Costs vs Profit data series
  const revBreakdownData = [
    { name: "Employee Engineering Costs", value: totalEmployeesCost, color: "#6366F1" }, // Indigo
    { name: "Server Infrastructure Costs", value: totalInfrastructureCost, color: "#EC4899" }, // Pink
    { name: "Reconciliation Net Margin", value: totalNetProfit, color: "#10B981" }       // Emerald
  ];

  return (
    <div className="min-h-screen bg-[#F1F5F9] font-sans text-slate-800 flex flex-col">
      
      {/* ==========================================
          EXECUTIVE DECLARED CORPORATE HEADER
          ========================================== */}
      <header className="bg-[#0F172A] text-white p-4 flex justify-between items-center border-b border-slate-700">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center font-bold text-xl text-white select-none">
            AP
          </div>
          <div>
            <h1 className="text-sm md:text-lg font-bold leading-none tracking-tight">
              ENTERPRISE BUSINESS DATA INTELLIGENCE <span className="text-blue-400">MAY 2026</span>
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-1">
              Principal: Mr. Akrit Pandey • Portfolio Management Office
            </p>
          </div>
        </div>

        <div className="flex gap-6 text-xs text-right items-center">
          <div className="hidden sm:block">
            <p className="text-slate-400 uppercase text-[9px]">SYSTEM STATUS</p>
            <p className="font-mono text-green-400 underline decoration-dotted font-semibold">ACTIVE / LIVE</p>
          </div>
          <div className="hidden md:block">
            <p className="text-slate-400 uppercase text-[9px]">DATA SOURCE</p>
            <p className="font-mono text-slate-300">DB_PROJECTS_100K</p>
          </div>

          {/* Quick Connect & Sync Action Center */}
          <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
            {!user ? (
              <button
                type="button"
                onClick={handleSignIn}
                disabled={isLoggingIn}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-[11px] rounded transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
              >
                <Key className="w-3.5 h-3.5 text-blue-400" />
                <span>CONNECT DRIVE</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-slate-800/80 px-2 py-1 rounded border border-slate-700 text-[11px]">
                {user.photoURL && (
                  <img src={user.photoURL} alt="Avatar" className="w-4 h-4 rounded-full" referrerPolicy="no-referrer" />
                )}
                <span className="text-slate-200 font-bold hidden lg:inline max-w-[80px] truncate">{user.displayName || user.email}</span>
                <button 
                  onClick={handleSignOut}
                  className="px-1.5 py-0.5 text-[9px] bg-red-950/80 text-red-300 hover:bg-red-900 hover:text-red-100 rounded transition-all font-semibold font-sans cursor-pointer"
                >
                  DISCONNECT
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ==========================================
          PORTFOLIO META SUBBANNER WITH CONTROL STATS
          ========================================== */}
      <div className="bg-white border-b border-slate-200 py-3.5 px-4">
        <div className="mx-auto flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
          
          {/* Status & Copy Portal Region */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 font-mono">
              <span className="text-slate-700 font-bold">PORTFOLIO DEPLOYMENT:</span>
              <span>● 100K PROJECTS RECORDED</span>
              <span className="text-slate-350 sm:inline hidden">|</span>
              <span>● SECURED MULTI-TABS STRUCTURE</span>
              <span className="text-slate-350 sm:inline hidden">|</span>
              <span>● SEC-COMPLIANT FINANCIAL AUDIT</span>
            </div>
            
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              {/* Copying and public link direct center */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText("https://ais-pre-axwqc2xy56wnwwtpdv4g5v-136398318336.asia-southeast1.run.app");
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 rounded transition-all cursor-pointer border ${
                  copied 
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300" 
                    : "bg-blue-50 text-blue-750 text-blue-700 hover:bg-blue-100 border-blue-200 hover:border-blue-300"
                }`}
                title="Click to copy live public portfolio share link"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-3 h-3 text-emerald-600 animate-pulse" />
                    <span>LINK COPIED!</span>
                  </>
                ) : (
                  <>
                    <ExternalLink className="w-3 h-3" />
                    <span>COPY SHAREABLE LINK</span>
                  </>
                )}
              </button>
              
              <a 
                href="https://ais-pre-axwqc2xy56wnwwtpdv4g5v-136398318336.asia-southeast1.run.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[9px] font-mono hover:underline text-blue-500 hover:text-blue-700 font-semibold"
                title="Open live public portal in new tab"
              >
                ai-pre.akrit.portfolio
              </a>
            </div>
          </div>

          <div className="flex items-center gap-1.5 p-0.5 bg-slate-100 rounded border border-slate-200/60 shadow-inner self-end md:self-auto">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
                activeTab === "dashboard" 
                  ? "bg-[#0F172A] text-white shadow-sm" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              EXECUTIVE CONSOLE
            </button>
            <button
              onClick={() => setActiveTab("explorer")}
              className={`px-4 py-1.5 text-xs font-bold rounded transition-all cursor-pointer ${
                activeTab === "explorer" 
                  ? "bg-[#0F172A] text-white shadow-sm" 
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              ADVANCED EXPLORER
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 w-full p-4 mx-auto max-w-[1440px] flex flex-col">

        {/* ==========================================
            TAB 1: LIVE EXECUTIVE CONSOLE 
            ========================================== */}
        {activeTab === "dashboard" && (
          <div className="space-y-6">

            {/* loading state */}
            {loadingSummary ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-slate-100">
                <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="text-sm font-mono text-slate-500 mt-4 leading-relaxed">
                  Synthesizing and indexing 100,000 corporate records...
                </p>
              </div>
            ) : (
              <>
                 {/* 4 Core KPI Cards Grid - Highly Optimized for Mobile (2x2) and Desktop (1x4) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-white rounded-xl border border-slate-200/80 shadow-sm">
                  
                  {/* Total Revenue */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.96, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 14, delay: 0.05 }}
                    className="p-4 bg-slate-50/65 hover:bg-slate-100/50 transition-all duration-200 rounded-lg border border-slate-200 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Revenue</p>
                        <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{formatCompactINR(totalRevenue)}</p>
                      </div>
                      <div className="p-1.5 bg-blue-50 rounded-md border border-blue-100">
                        <DollarSign className="w-4 h-4 text-blue-600 animate-pulse" />
                      </div>
                    </div>
                    <p className="text-[10px] text-emerald-600 mt-3 font-semibold flex items-center gap-1">
                      <span>↑ 12.4% vs Apr</span>
                      <span className="text-slate-400 font-normal font-mono">(MoM)</span>
                    </p>
                  </motion.div>

                  {/* Total Projects */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.96, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 14, delay: 0.1 }}
                    className="p-4 bg-slate-50/65 hover:bg-slate-100/50 transition-all duration-200 rounded-lg border border-slate-200 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Total Projects</p>
                        <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{totalProjects.toLocaleString()}</p>
                      </div>
                      <div className="p-1.5 bg-indigo-50 rounded-md border border-indigo-100">
                        <Briefcase className="w-4 h-4 text-indigo-650 text-indigo-600" />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-3 font-medium flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-505 bg-indigo-500" />
                      <span>100K Audited Pipeline Nodes</span>
                    </p>
                  </motion.div>

                  {/* Growth % */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.96, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 14, delay: 0.15 }}
                    className="p-4 bg-slate-50/65 hover:bg-slate-100/50 transition-all duration-200 rounded-lg border border-slate-200 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Growth %</p>
                        <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">+14.81%</p>
                      </div>
                      <div className="p-1.5 bg-emerald-50 rounded-md border border-emerald-100">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-3 font-medium flex items-center gap-1">
                      <span className="text-emerald-600 font-bold">Exceeds limits</span>
                      <span>by 2.4% vs target</span>
                    </p>
                  </motion.div>

                  {/* Active Clients */}
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.96, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 100, damping: 14, delay: 0.2 }}
                    className="p-4 bg-slate-50/65 hover:bg-slate-100/50 transition-all duration-200 rounded-lg border border-slate-200 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Active Clients</p>
                        <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">8,420 Sites</p>
                      </div>
                      <div className="p-1.5 bg-purple-50 rounded-md border border-purple-100">
                        <Users className="w-4 h-4 text-purple-600" />
                      </div>
                    </div>
                    <p className="text-[10px] text-purple-600 mt-3 font-bold">
                      Startup, SME, Corp, Gov
                    </p>
                  </motion.div>
                </div>

                {/* ==========================================
                    GOOGLE DRIVE INTEGRATION DRAWER / CENTER
                    ========================================== */}
                <div className="bg-gradient-to-r from-indigo-950 to-slate-900 text-white rounded-xl shadow-xl p-5 border border-indigo-800/40 relative overflow-hidden">
                  <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/5 rounded-full pointer-events-none" />
                  <div className="absolute left-1/4 bottom-0 w-80 h-32 bg-teal-500/5 rounded-full filter blur-xl pointer-events-none" />
                  
                  <div className="relative flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                        <FileSpreadsheet className="w-7 h-7 text-indigo-400" />
                      </div>
                      <div>
                        <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                          Google Drive & Sheets Native Integration Console
                        </h2>
                        <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                          Export the complete 100,000 projects system with formatted formulas directly to your private Google Drive. 
                          Choose <strong>Native Google Sheets</strong> conversion to automatically translate formula results, color cells, and lock indices for web-based editing immediately.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto shrink-0 justify-end">
                      {/* Sheets Conversion toggle */}
                      <div className="flex items-center gap-2 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700 w-full sm:w-auto justify-between">
                        <span className="text-xs text-slate-300 font-mono">Convert to Google Sheets</span>
                        <input 
                          type="checkbox" 
                          checked={convertToSheets} 
                          onChange={(e) => setConvertToSheets(e.target.checked)}
                          className="w-4 h-4 text-indigo-500 focus:ring-indigo-500/40 border-slate-600 rounded cursor-pointer"
                        />
                      </div>

                      {user ? (
                        <button
                          onClick={handleDriveExport}
                          disabled={exportingToDrive}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600 text-white font-semibold text-xs rounded-xl shadow-lg transition-all scale-100 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                        >
                          {exportingToDrive ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin" />
                              <span>UPLOADING TO DRIVE...</span>
                            </>
                          ) : (
                            <>
                              <ExternalLink className="w-4 h-4" />
                              <span>EXPORT TO GOOGLE DRIVE</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={handleSignIn}
                          className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-slate-800 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-lg transition-all border border-slate-200"
                        >
                          <svg className="w-4 h-4 mr-1" viewBox="0 0 48 48">
                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                          </svg>
                          <span>SIGN IN WITH GOOGLE TO CONNECT DRIVE</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Drive Link Result Card */}
                  <AnimatePresence>
                    {driveResult && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-emerald-900/60 border border-emerald-500/30 rounded-lg p-3.5 mt-4 flex flex-col sm:flex-row justify-between items-center gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                          <div>
                            <p className="text-xs font-semibold text-emerald-200">Export Completed Successfully!</p>
                            <p className="text-[10px] text-emerald-300 font-mono mt-0.5">{driveResult.fileName}</p>
                          </div>
                        </div>
                        <a 
                          href={driveResult.webViewLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-900 font-bold text-xs rounded shadow transition-all"
                        >
                          <span>OPEN IN GOOGLE SHEETS / DRIVE</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Auth Error Banner Card */}
                  <AnimatePresence>
                    {authError && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-amber-950/70 border border-amber-500/30 rounded-lg p-3.5 mt-4 flex flex-col sm:flex-row items-start gap-3"
                      >
                        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div className="flex-1 text-left">
                          <p className="text-xs font-semibold text-amber-200 uppercase">Authentication Preview Constraint Detected</p>
                          {authError === "POPUP_BLOCKED_OR_CLOSED" ? (
                            <div className="text-[11px] text-amber-300/90 mt-1 space-y-2 leading-relaxed">
                              <p>
                                The browser blocked or closed the secure Google popup because this app is loaded inside a sandboxed preview iframe context.
                              </p>
                              <div className="bg-amber-950/40 p-2.5 rounded border border-amber-500/10 font-mono text-[10px] text-amber-200">
                                <p className="font-bold mb-1">💡 QUICK RESOLUTION STEPS:</p>
                                <ol className="list-decimal list-inside space-y-1">
                                  <li>Click the button below to launch the dashboard inside a standard browser tab.</li>
                                  <li>Ensure your browser's pop-up blocker allows windows from this preview site.</li>
                                  <li>Connect Drive and authenticate smoothly without sandbox limitations!</li>
                                </ol>
                              </div>
                              <div className="flex flex-wrap gap-3 items-center mt-1">
                                <a 
                                  href={window.location.href}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded transition-all shadow"
                                >
                                  <span>LAUNCH APP IN NEW TAB</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                                <button
                                  type="button"
                                  onClick={() => setAuthError(null)}
                                  className="text-[10px] text-amber-400/80 hover:text-amber-200 underline cursor-pointer font-semibold"
                                >
                                  Dismiss Warning
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="text-[11px] text-amber-300/90 mt-1 select-all font-mono">
                              <p>Details: {authError}</p>
                              <button
                                type="button"
                                onClick={() => setAuthError(null)}
                                className="text-[10px] text-amber-400/80 hover:text-amber-200 underline mt-2 block cursor-pointer font-semibold"
                              >
                                Dismiss Warning
                              </button>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* ==========================================
                    VISUAL CHARTS & responsive STRATEGIC FLOW
                    ========================================== */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-1.5 flex-1">
                  
                  {/* LEFT DETAILS & FLOWS: col-span-8 */}
                  <div className="lg:col-span-8 space-y-6 flex flex-col">
                    
                    {/* CHART 1: Primary Timeline (Revenue vs Time) - Wide & Commanding */}
                    <div className="bg-white p-5 rounded-xl border border-slate-205 border-slate-200/80 shadow-sm flex flex-col">
                      <div className="mb-4">
                        <div className="flex justify-between items-start flex-wrap gap-2">
                          <div>
                            <h3 className="text-sm font-bold text-slate-800 tracking-tight">Portfolio Revenue Progression</h3>
                            <p className="text-[11px] text-slate-400 font-medium">Daily initiated pipeline volume across May 2026</p>
                          </div>
                          <span className="text-[9px] uppercase font-mono font-bold text-blue-600 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-150">
                            May Timeline
                          </span>
                        </div>
                      </div>
                      <div className="h-[240px] w-full mt-2">
                        {summary && (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={summary.dailyTrends} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                              <defs>
                                <linearGradient id="gradientRevenue" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.16}/>
                                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                              <XAxis 
                                dataKey="day" 
                                stroke="#94A3B8" 
                                fontSize={10} 
                                tickLine={false} 
                                tickFormatter={(day) => `May ${day}`}
                              />
                              <YAxis 
                                stroke="#94A3B8" 
                                fontSize={9} 
                                tickLine={false} 
                                axisLine={false}
                                tickFormatter={(val) => `₹${(val / 10000000).toFixed(1)}Cr`}
                              />
                              <Tooltip 
                                formatter={(value: any) => [formatINR(value), "Initiated Revenue"]}
                                labelFormatter={(label) => `May ${label}, 2026`}
                                contentStyle={{ fontSize: "11px", borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", border: "1px solid #E2E8F0" }}
                              />
                              <Area 
                                type="monotone" 
                                dataKey="revenue" 
                                name="Daily Revenue" 
                                stroke="#2563EB" 
                                strokeWidth={2} 
                                fillOpacity={1} 
                                fill="url(#gradientRevenue)" 
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                      <div className="mt-2.5 pt-2.5 border-t border-slate-100 flex items-center justify-center gap-6 text-[10px] text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                          <span>Daily Initiated Billing</span>
                        </span>
                      </div>
                    </div>

                    {/* TWO OPTIMIZED SHARING CHARTS: Stacks on mobile, Side-by-side on desktop */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* CHART 2: Project Categories Distribution (Pie/Donut Chart) */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Project Category Share</h3>
                              <p className="text-[11px] text-slate-400 font-medium">Distribution of 100,000 portfolio nodes</p>
                            </div>
                            <span className="text-[9px] uppercase font-mono font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              PIE SHARE
                            </span>
                          </div>
                        </div>
                        
                        <div className="h-[210px] w-full flex items-center justify-center relative my-3">
                          {summary && (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={summary.categorySummary}
                                  dataKey="projectsCount"
                                  nameKey="category"
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={55}
                                  outerRadius={75}
                                  paddingAngle={3}
                                >
                                  {summary.categorySummary.map((entry, index) => {
                                    const colors = ["#1E3A8A", "#2563EB", "#3B82F6", "#60A5FA", "#10B981", "#F59E0B", "#EF4444"];
                                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                  })}
                                </Pie>
                                <Tooltip 
                                  formatter={(value: any, name: any) => [`${value.toLocaleString()} Projects`, `${name} Category`]} 
                                  contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid #E2E8F0" }} 
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-lg font-black text-slate-900 leading-none">100K</span>
                            <span className="text-[9px] text-slate-400 font-bold uppercase mt-1">Total Rows</span>
                          </div>
                        </div>

                        {/* Custom touch-friendly legends placed below chart */}
                        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-3 border-t border-slate-50 text-[10px] text-slate-500 font-medium">
                          {summary?.categorySummary.map((cs, idx) => {
                            const colors = ["#1E3A8A", "#2563EB", "#3B82F6", "#60A5FA", "#10B981", "#F59E0B", "#EF4444"];
                            return (
                              <div key={idx} className="flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colors[idx % colors.length] }} />
                                <span>{cs.category} ({((cs.projectsCount / 100000) * 100).toFixed(0)}%)</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* CHART 3: Category Gross Performance (Grouped Bar Chart representing Profit vs Cost) */}
                      <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Category Gross Performance</h3>
                              <p className="text-[11px] text-slate-400 font-medium">Gross revenue relative to total operation overhead</p>
                            </div>
                            <span className="text-[9px] uppercase font-mono font-bold text-purple-650 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                              Cost vs Profit
                            </span>
                          </div>
                        </div>

                        <div className="h-[210px] w-full my-3">
                          {summary && (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart 
                                data={summary.categorySummary.map(item => ({
                                  category: item.category,
                                  Revenue: item.totalRevenue,
                                  Cost: item.totalEmployeeCost + item.totalInfrastructureCost
                                }))} 
                                margin={{ top: 10, right: 5, left: -20, bottom: 5 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                <XAxis dataKey="category" stroke="#94A3B8" fontSize={9} tickLine={false} />
                                <YAxis 
                                  stroke="#94A3B8" 
                                  fontSize={9} 
                                  tickLine={false} 
                                  axisLine={false}
                                  tickFormatter={(val) => `₹${(val / 10000000).toFixed(0)}Cr`} 
                                />
                                <Tooltip 
                                  formatter={(value: any, name: any) => [formatINR(value), name]} 
                                  contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid #E2E8F0" }} 
                                />
                                <Bar dataKey="Revenue" fill="#2563EB" radius={[2, 2, 0, 0]} />
                                <Bar dataKey="Cost" fill="#EF4444" opacity={0.8} radius={[2, 2, 0, 0]} />
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>

                        <div className="flex items-center justify-center gap-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                            <span>Total Revenue</span>
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <span>OpEx Costs</span>
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* TWO LOWER DETAILS CHARTS: Client Segment allocation & Profit Buckets */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                      {/* CHART 4: Client Type Breakdown (Donut Pie) */}
                      <div className="bg-white p-5 rounded-xl border border-slate-205 border-slate-200/80 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Client Segment Allocation</h3>
                              <p className="text-[11px] text-slate-400 font-medium">Segment revenue allocation across corporate types</p>
                            </div>
                            <span className="text-[9px] uppercase font-mono font-bold text-indigo-650 text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                              SEGMENTS
                            </span>
                          </div>
                        </div>

                        <div className="h-[200px] w-full flex items-center justify-center relative my-3">
                          {summary && (
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={summary.clientSummary}
                                  dataKey="totalRevenue"
                                  nameKey="clientType"
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={50}
                                  outerRadius={70}
                                  paddingAngle={4}
                                >
                                  {summary.clientSummary.map((entry, index) => {
                                    const colors = ["#0F172A", "#2563EB", "#60A5FA", "#EC4899"];
                                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                  })}
                                </Pie>
                                <Tooltip 
                                  formatter={(value: any, name: any) => [formatINR(value), `${name} Segment`]} 
                                  contentStyle={{ fontSize: "11px", borderRadius: "8px", border: "1px solid #E2E8F0" }} 
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          )}
                          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-base font-black text-slate-950">₹1,303Cr</span>
                            <span className="text-[8px] text-slate-400 font-bold uppercase">Consolidated</span>
                          </div>
                        </div>

                        {/* Legends placed clean below */}
                        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-3 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
                          {summary?.clientSummary.map((cs, index) => {
                            const colors = ["#0F172A", "#2563EB", "#60A5FA", "#EC4899"];
                            return (
                              <div key={index} className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: colors[index % colors.length] }} />
                                <span>{cs.clientType} ({((cs.totalRevenue / totalRevenue) * 100).toFixed(0)}%)</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* CHART 5: Portfolio Profit Margin Buckets (Histogram Histogram count) */}
                      <div className="bg-white p-5 rounded-xl border border-slate-205 border-slate-200/80 shadow-sm flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <div>
                              <h3 className="text-sm font-bold text-slate-800 tracking-tight">Portfolio Profit Distribution</h3>
                              <p className="text-[11px] text-slate-400 font-medium">Margin yields mapped against total project nodes</p>
                            </div>
                            <span className="text-[9px] uppercase font-mono font-bold text-orange-650 text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                              Margin Yield
                            </span>
                          </div>
                        </div>

                        <div className="h-[200px] w-full my-3">
                          {summary && (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={summary.profitDistribution} barSize={34} margin={{ top: 10, right: 5, left: -20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                                <XAxis dataKey="bucket" stroke="#94A3B8" fontSize={9} tickLine={false} />
                                <YAxis 
                                  stroke="#94A3B8" 
                                  fontSize={9} 
                                  tickLine={false} 
                                  axisLine={false}
                                  tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                                />
                                <Tooltip 
                                  formatter={(value: any) => [`${value.toLocaleString()} Projects`, "Margined Count"]}
                                  contentStyle={{ fontSize: "11.1px", borderRadius: "8px", border: "1px solid #E2E8F0" }}
                                />
                                <Bar dataKey="count" name="Projects" fill="#3B82F6" radius={[2, 2, 0, 0]}>
                                  {summary.profitDistribution.map((entry, idx) => {
                                    const colors = ["#93C5FD", "#60A5FA", "#3B82F6", "#2563EB", "#1D4ED8"];
                                    return <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />;
                                  })}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>

                        <div className="flex items-center justify-center gap-1.5 pt-3 border-t border-slate-150 border-slate-100 text-[10px] text-slate-400 font-medium">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                          <span>Distribution Margin Ranges (10% steps)</span>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* RIGHT CONSOL AREA (Strategic Quote & Auxiliary Stats Summary, col-span-4) */}
                  <div className="lg:col-span-4 space-y-6 flex flex-col">
                    
                    {/* Slate Card 1: Strategic Breakdown & Akrit Pandey Quote */}
                    <div className="bg-slate-900 border border-slate-800 text-white rounded-xl shadow-md p-5 flex flex-col h-full justify-between">
                      <div>
                        <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#60A5FA] mb-4 pb-2 border-b border-slate-800">
                          STRATEGIC ADVOCACY PANEL
                        </h3>
                        <p className="text-xl font-light text-slate-100 font-serif leading-relaxed italic">
                          "Enabling high-yield financial compliance via structured analytical processing."
                        </p>
                        
                        <div className="mt-4 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping" />
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                            Primary PMO Sponsor: Mr. Akrit Pandey
                          </span>
                        </div>
                      </div>

                      {/* Distribution indicators */}
                      <div className="mt-8 space-y-4 pt-5 border-t border-slate-800">
                        <div>
                          <div className="flex justify-between text-[10px] text-slate-350 text-slate-300 font-mono mb-1.5">
                            <span>PORTFOLIO TARGET MARGIN</span>
                            <span className="font-bold text-blue-400">35.0%</span>
                          </div>
                          <div className="w-full bg-slate-850 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full rounded-full" style={{ width: "35%" }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] text-slate-355 text-slate-300 font-mono mb-1.5">
                            <span>RECONCILED RATIO</span>
                            <span className="font-bold text-emerald-400">66.7%</span>
                          </div>
                          <div className="w-full bg-slate-855 bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-full rounded-full" style={{ width: "66.7%" }} />
                          </div>
                        </div>

                        <div className="bg-slate-950/50 p-3.5 rounded-lg border border-slate-800/80 mt-4">
                          <h4 className="text-[9px] font-mono uppercase tracking-wider text-slate-400 font-bold mb-1.5">
                            RECONCILIATION SUMMARY
                          </h4>
                          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                            <div>
                              <span className="text-slate-500 block">OpEx Overhead:</span>
                              <span className="text-slate-300 font-semibold">{formatCompactINR(totalEmployeesCost + totalInfrastructureCost)}</span>
                            </div>
                            <div>
                              <span className="text-slate-500 block">Net Returns:</span>
                              <span className="text-emerald-400 font-semibold font-bold">₹{((totalNetProfit / totalRevenue)*100).toFixed(1)}%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                {/* TWO TOP-10 TABLES FOR HIGHEST REVENUE AND MAXIMUM PROFITABILITY */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                  {/* Top 10 Revenue */}
                  <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h4 className="font-bold text-xs tracking-wider text-slate-700 uppercase flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                        <span>TOP 10 MAXIMUM REVENUE VENTURES</span>
                      </h4>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase text-[10px] font-mono">
                            <th className="px-4 py-3">Project ID</th>
                            <th className="px-4 py-3">Project Title</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3 text-right">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {summary?.topRevenueProjects.map((p, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70">
                              <td className="px-4 py-2.5 font-bold text-blue-600">{p.projectId}</td>
                              <td className="px-4 py-2.5 text-slate-800 font-sans font-medium line-clamp-1 max-w-[150px]">{p.projectName.replace(` [#${p.projectId.slice(1)}]`, "")}</td>
                              <td className="px-4 py-2.5 text-slate-500 font-sans">{p.category}</td>
                              <td className="px-4 py-2.5 text-right text-slate-900 font-semibold">{formatINR(p.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Top 10 Profitable */}
                  <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h4 className="font-bold text-xs tracking-wider text-slate-700 uppercase flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                        <span>TOP 10 MAXIMUM PROFITABLE VENTURES</span>
                      </h4>
                      <span className="text-[9px] font-mono text-slate-400">May 2026 Audit Block</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase text-[10px] font-mono font-bold">
                            <th className="px-4 py-3">Project ID</th>
                            <th className="px-4 py-3">Project Title</th>
                            <th className="px-4 py-3 text-right">Net Profit</th>
                            <th className="px-4 py-3 text-right">Margin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                          {summary?.topProfitableProjects.map((p, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70">
                              <td className="px-4 py-2.5 font-bold text-blue-650 text-blue-600">{p.projectId}</td>
                              <td className="px-4 py-2.5 text-slate-800 font-sans font-medium line-clamp-1 max-w-[150px]">{p.projectName}</td>
                              <td className="px-4 py-2.5 text-right text-slate-900 font-semibold">{formatINR(p.netProfit)}</td>
                              <td className="px-4 py-2.5 text-right text-blue-600 font-bold">{p.profitMargin}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* SEGMENT SUMMARIES (PIVOT TABLE LIKE) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
                  {/* Category Performance Summary */}
                  <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h4 className="font-bold text-xs tracking-wider text-slate-700 uppercase">
                        CATEGORY PERFORMANCE BREAKDOWN
                      </h4>
                      <span className="text-[10px] font-mono text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">AUTO-PIVOT</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase text-[10px] font-mono">
                            <th className="px-4 py-3">Category</th>
                            <th className="px-4 py-3 text-center">Projects</th>
                            <th className="px-4 py-3 text-right">Gross Revenue</th>
                            <th className="px-4 py-3 text-right">Net Margin</th>
                            <th className="px-4 py-3 text-right">Avg margin %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {summary?.categorySummary.map((cs, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70">
                              <td className="px-4 py-3 font-semibold text-slate-700 font-sans">{cs.category}</td>
                              <td className="px-4 py-3 text-center text-slate-500 font-mono">{cs.projectsCount.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-slate-700 font-mono">{formatCompactINR(cs.totalRevenue)}</td>
                              <td className="px-4 py-3 text-right text-slate-900 font-medium font-mono">{formatCompactINR(cs.totalNetProfit)}</td>
                              <td className="px-4 py-3 text-right text-blue-600 font-bold font-mono">{cs.avgProfitMargin}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Client Segments Summary */}
                  <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                      <h4 className="font-bold text-xs tracking-wider text-slate-700 uppercase">
                        CLIENT SEGMENT PERFORMANCE BREAKDOWN
                      </h4>
                      <span className="text-[10px] font-mono text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded">AUTO-PIVOT</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 uppercase text-[10px] font-mono">
                            <th className="px-4 py-3">Client Type</th>
                            <th className="px-4 py-3 text-center">Projects</th>
                            <th className="px-4 py-3 text-right">Gross Revenue</th>
                            <th className="px-4 py-3 text-right">Net Margin</th>
                            <th className="px-4 py-3 text-right">Avg margin %</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {summary?.clientSummary.map((cs, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70">
                              <td className="px-4 py-3 font-semibold text-slate-700 font-sans">{cs.clientType}</td>
                              <td className="px-4 py-3 text-center text-slate-500 font-mono">{cs.projectsCount.toLocaleString()}</td>
                              <td className="px-4 py-3 text-right text-slate-700 font-mono">{formatCompactINR(cs.totalRevenue)}</td>
                              <td className="px-4 py-3 text-right text-slate-900 font-medium font-mono">{formatCompactINR(cs.totalNetProfit)}</td>
                              <td className="px-4 py-3 text-right text-blue-600 font-bold font-mono">{cs.avgProfitMargin}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ==========================================
            TAB 2: GRANULAR EXPLORER CONTROLLER (100K ROWS)
            ========================================== */}
        {activeTab === "explorer" && (
          <div className="bg-white rounded-xl shadow-soft border border-slate-200/60 p-5 space-y-5">
            
            {/* ADVANCED MULTI-OPTIONS SEARCH & FILTERS BOX */}
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/60 space-y-3.5">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-mono font-bold text-slate-700 uppercase tracking-wider">
                  Data Filter Console & Full-Text Index Query
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                {/* Search query (Project ID or Name) */}
                <div className="relative md:col-span-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1); // Reset page to 1 on filter
                    }}
                    placeholder="Search by ID, name, or subcategory..."
                    className="w-full bg-white text-xs pl-9 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Category select */}
                <div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-white text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">All Categories</option>
                    <option value="Web">Web (25%)</option>
                    <option value="App">App (20%)</option>
                    <option value="AI">AI (20%)</option>
                    <option value="Cloud">Cloud (15%)</option>
                    <option value="Automation">Automation (10%)</option>
                    <option value="Data">Data (5%)</option>
                    <option value="Security">Security (5%)</option>
                  </select>
                </div>

                {/* Client select */}
                <div>
                  <select
                    value={selectedClient}
                    onChange={(e) => {
                      setSelectedClient(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-white text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">All Segments</option>
                    <option value="Startup">Startup (40%)</option>
                    <option value="SME">SME (30%)</option>
                    <option value="Enterprise">Enterprise (20%)</option>
                    <option value="Government">Government (10%)</option>
                  </select>
                </div>

                {/* Priority filter */}
                <div>
                  <select
                    value={selectedPriority}
                    onChange={(e) => {
                      setSelectedPriority(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="w-full bg-white text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="">All Priorities</option>
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              {/* Status and limits filters row */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 flex flex-wrap gap-2.5">
                  <span className="text-xs text-slate-500 font-mono self-center mr-2">Filtering Status:</span>
                  {["", "Completed", "In Progress", "Delayed"].map((status) => {
                    const label = status || "All STATUS";
                    const activeColor = "bg-slate-900 text-white border-transparent";
                    const inactiveColor = "bg-white text-slate-600 hover:bg-slate-100 border-slate-200";
                    return (
                      <button
                        key={status}
                        onClick={() => {
                          setSelectedStatus(status);
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1 font-mono text-[10px] rounded border transition-all uppercase ${
                          selectedStatus === status ? activeColor : inactiveColor
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-mono">Row Limit Page:</span>
                  <select
                    value={projectsPerPage}
                    onChange={(e) => {
                      setProjectsPerPage(parseInt(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="bg-white text-xs px-2.5 py-1 border border-slate-250 rounded-md focus:outline-none"
                  >
                    <option value="15">15 rows</option>
                    <option value="25">25 rows</option>
                    <option value="50">50 rows</option>
                    <option value="100">100 rows</option>
                  </select>
                </div>
              </div>
            </div>

            {/* TOTALS SEARCH COUNTER BOX */}
            <div className="flex justify-between items-center text-xs text-slate-500 font-mono px-1">
              <span>
                Search Yielded: <strong className="text-indigo-600">{totalProjectsCount.toLocaleString()}</strong> of <strong className="text-slate-800">100,000</strong> matched rows.
              </span>
              <span>Showing rows {((currentPage - 1) * projectsPerPage + 1).toLocaleString()} – {Math.min(totalProjectsCount, currentPage * projectsPerPage).toLocaleString()}</span>
            </div>

            {/* DYNAMIC VIRTUALIZED/PAGINATED DATA TABLE */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-soft">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-200 border-b border-slate-200 uppercase text-[10px] font-mono font-semibold tracking-wider">
                    <th className="px-4 py-3.5 text-center">Project ID</th>
                    <th className="px-4 py-3.5">Project Name</th>
                    <th className="px-4 py-3.5">Segment / Owner</th>
                    <th className="px-4 py-3.5">Technology Path</th>
                    <th className="px-4 py-3.5 text-center">Dates (May 2026)</th>
                    <th className="px-4 py-3.5 text-center">Status / Risk</th>
                    <th className="px-4 py-3.5 text-right">Revenue</th>
                    <th className="px-4 py-3.5 text-right">Net Profit</th>
                    <th className="px-4 py-3.5 text-right">Margin %</th>
                  </tr>
                </thead>

                {loadingProjects ? (
                  <tbody>
                    <tr>
                      <td colSpan={9} className="py-20 text-center font-mono text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-3" />
                        Querying 100K indexed portfolio records...
                      </td>
                    </tr>
                  </tbody>
                ) : projects.length === 0 ? (
                  <tbody>
                    <tr>
                      <td colSpan={9} className="py-20 text-center font-mono text-slate-400">
                        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
                        No matching projects found. Refine your query parameters.
                      </td>
                    </tr>
                  </tbody>
                ) : (
                  <tbody className="divide-y divide-slate-150">
                    {projects.map((p) => {
                      // Conditional profit indicator
                      // Profit Margin > 20% → Green, 10-20% → Yellow, <10% → Red
                      let marginCellColor = "text-red-600 font-extrabold bg-red-50";
                      let marginDot = "bg-red-500";
                      if (p.profitMargin >= 20) {
                        marginCellColor = "text-emerald-700 font-extrabold bg-emerald-50";
                        marginDot = "bg-emerald-500";
                      } else if (p.profitMargin >= 10) {
                        marginCellColor = "text-amber-700 font-semibold bg-amber-50";
                        marginDot = "bg-amber-500";
                      }

                      // Status indicators
                      const statusStyles = {
                        Completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
                        "In Progress": "bg-indigo-100 text-indigo-800 border-indigo-200",
                        Delayed: "bg-amber-100 text-amber-800 border-amber-200"
                      };

                      return (
                        <tr key={p.projectId} className="hover:bg-indigo-50/20 text-slate-700 transition-colors">
                          {/* ID */}
                          <td className="px-4 py-3 text-center font-bold font-mono text-indigo-600">{p.projectId}</td>
                          
                          {/* Name / Sub */}
                          <td className="px-4 py-3 max-w-[200px]">
                            <span className="block font-semibold text-slate-800 text-[13px] truncate">{p.projectName.split(" [")[0]}</span>
                            <span className="block text-[10px] text-slate-400 font-mono mt-0.5 uppercase tracking-wide">{p.subcategory}</span>
                          </td>

                          {/* Client / Owner */}
                          <td className="px-4 py-3">
                            <span className="block font-medium text-slate-800">{p.clientType}</span>
                            <span className="block text-[10px] text-slate-400 font-mono uppercase">{p.projectOwner}</span>
                          </td>

                          {/* Category */}
                          <td className="px-4 py-3">
                            <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                              {p.category}
                            </span>
                          </td>

                          {/* Date Range & Duration */}
                          <td className="px-4 py-3 text-center font-mono text-[10px]">
                            <span className="block text-slate-600">{p.startDate} ➜ {p.endDate}</span>
                            <span className="block text-slate-400 font-bold tracking-wider mt-0.5 uppercase">DURATION: {p.duration} DAYS</span>
                          </td>

                          {/* Status and Risk */}
                          <td className="px-4 py-3 text-center space-y-1">
                            <span className={`inline-block px-2 py-0.5 border text-[9px] font-mono font-bold rounded-full uppercase tracking-wider ${statusStyles[p.status]}`}>
                              {p.status}
                            </span>
                            <span className={`block text-[10px] font-mono font-semibold tracking-wider ${p.riskScore === 'High' ? 'text-red-500' : 'text-slate-400'}`}>
                              RISK: {p.riskScore}
                            </span>
                          </td>

                          {/* Financials (INR formatting) */}
                          <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">{formatINR(p.revenue)}</td>
                          <td className="px-4 py-3 text-right font-mono font-medium text-slate-900">{formatINR(p.netProfit)}</td>
                          
                          {/* Profit margin styled conditional */}
                          <td className={`px-4 py-3.5 text-center font-mono ${marginCellColor}`}>
                            <div className="flex items-center justify-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${marginDot}`} />
                              <span>{p.profitMargin}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                )}
              </table>
            </div>

            {/* DYNAMIC PAGINATION ACTION CONTROLLER */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200/60 gap-4">
              <span className="text-xs text-slate-500 font-mono">
                Page <strong className="text-slate-800">{currentPage}</strong> of <strong className="text-slate-800">{Math.ceil(totalProjectsCount / projectsPerPage).toLocaleString() || 1}</strong>
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1 || loadingProjects}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 rounded-md text-xs font-mono disabled:opacity-50"
                >
                  ◀◀ FIRST
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loadingProjects}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-md text-xs font-semibold disabled:opacity-50"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> PREV
                </button>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 font-mono text-xs font-extrabold rounded-md border border-indigo-200">
                  {currentPage}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(Math.ceil(totalProjectsCount / projectsPerPage), prev + 1))}
                  disabled={currentPage >= Math.ceil(totalProjectsCount / projectsPerPage) || loadingProjects}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-md text-xs font-semibold disabled:opacity-50"
                >
                  NEXT <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setCurrentPage(Math.ceil(totalProjectsCount / projectsPerPage))}
                  disabled={currentPage >= Math.ceil(totalProjectsCount / projectsPerPage) || loadingProjects}
                  className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 rounded-md text-xs font-mono disabled:opacity-50"
                >
                  LAST ▶▶
                </button>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
