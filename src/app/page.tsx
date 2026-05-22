"use client";

import React, { useState, useEffect, useMemo } from "react";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, Cell
} from "recharts";
import { 
  Plus, History, BarChart3, Globe, Activity, Zap, ShieldCheck, Search, 
  ChevronRight, BrainCircuit, Loader2, Trash2, Smartphone, Monitor
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PageMetric } from "@/types/tracker";

/** Utility for tailwind classes */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const STORAGE_KEY = "psi-tracker-data";

export default function PSITracker() {
  const [metrics, setMetrics] = useState<PageMetric[]>([]);
  const [activeTab, setActiveTab] = useState<string>("overall");
  const [activeDevice, setActiveDevice] = useState<"mobile" | "desktop">("mobile");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    trend: string;
    optimizations: (string | { area: string; recommendation: string })[];
    summary: string;
  } | null>(null);
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  // Form state
  const [form, setForm] = useState({
    url: "",
    device: "mobile" as "mobile" | "desktop",
    performance: "" as string | number,
    accessibility: "" as string | number,
    bestPractices: "" as string | number,
    seo: "" as string | number
  });

  // Load data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Migration: Add device field to old entries if missing
        const migrated = parsed.map((m: any) => ({
          ...m,
          device: m.device || "mobile"
        }));
        setMetrics(migrated);
      } catch (e) {
        console.error("Failed to load metrics", e);
      }
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
  }, [metrics]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const newErrors: Record<string, boolean> = {};
    if (!form.url) newErrors.url = true;
    if (form.performance === "") newErrors.performance = true;
    if (form.accessibility === "") newErrors.accessibility = true;
    if (form.bestPractices === "") newErrors.bestPractices = true;
    if (form.seo === "") newErrors.seo = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const newMetric: PageMetric = {
      url: form.url,
      device: form.device,
      performance: Number(form.performance),
      accessibility: Number(form.accessibility),
      bestPractices: Number(form.bestPractices),
      seo: Number(form.seo),
      timestamp: new Date().toISOString()
    };
    setMetrics([...metrics, newMetric]);
    setForm({ ...form, performance: "", accessibility: "", bestPractices: "", seo: "" });
    setErrors({});
  };

  const deleteMetric = (timestamp: string) => {
    setMetrics(metrics.filter(m => m.timestamp !== timestamp));
  };

  const filteredMetrics = useMemo(() => {
    return metrics.filter(m => m.device === activeDevice);
  }, [metrics, activeDevice]);

  const groupedMetrics = useMemo(() => {
    const groups: Record<string, PageMetric[]> = {};
    filteredMetrics.forEach(m => {
      if (!groups[m.url]) groups[m.url] = [];
      groups[m.url].push(m);
    });
    // Sort each group by timestamp
    Object.keys(groups).forEach(url => {
      groups[url].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    });
    return groups;
  }, [filteredMetrics]);

  const uniqueUrls = Object.keys(groupedMetrics);

  const getAverageMetrics = (data: PageMetric[]) => {
    if (data.length === 0) return { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 };
    const sum = data.reduce((acc, curr) => ({
      performance: acc.performance + curr.performance,
      accessibility: acc.accessibility + curr.accessibility,
      bestPractices: acc.bestPractices + curr.bestPractices,
      seo: acc.seo + curr.seo
    }), { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 });
    return {
      performance: Math.round(sum.performance / data.length),
      accessibility: Math.round(sum.accessibility / data.length),
      bestPractices: Math.round(sum.bestPractices / data.length),
      seo: Math.round(sum.seo / data.length)
    };
  };

  const runAnalysis = async (url: string) => {
    setIsAnalyzing(true);
    setAnalysisResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metrics: groupedMetrics[url] })
      });
      const data = await res.json();
      setAnalysisResult(data);
    } catch (error) {
      console.error("Analysis failed", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const overallAverages = getAverageMetrics(filteredMetrics);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans p-6 md:p-12">
      <header className="max-w-7xl mx-auto mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <Activity className="w-10 h-10 text-indigo-600" />
            PSI Tracker
          </h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="text-slate-500 text-lg">Chronological velocity dashboard.</p>
            <div className="flex bg-slate-200 p-1 rounded-lg">
              <button 
                onClick={() => setActiveDevice("mobile")}
                className={cn("p-1.5 rounded-md transition-all", activeDevice === "mobile" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
              >
                <Smartphone className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setActiveDevice("desktop")}
                className={cn("p-1.5 rounded-md transition-all", activeDevice === "desktop" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
              >
                <Monitor className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto no-scrollbar max-w-full">
          <button 
            onClick={() => setActiveTab("overall")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap",
              activeTab === "overall" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:text-slate-700"
            )}
          >
            <BarChart3 className="w-4 h-4" />
            Overall ({activeDevice})
          </button>
          {uniqueUrls.map(url => (
            <button 
              key={url}
              onClick={() => { setActiveTab(url); setAnalysisResult(null); }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 max-w-[150px] truncate whitespace-nowrap",
                activeTab === url ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:text-slate-700"
              )}
            >
              <Globe className="w-4 h-4" />
              {url.replace(/https?:\/\/(www\.)?/, "")}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & Stats */}
        <div className="lg:col-span-4 space-y-8">
          {/* Entry Form */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              Log PSI Metrics
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Device & URL</label>
                <div className="flex gap-2">
                  <select 
                    className="px-2 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-bold outline-none"
                    value={form.device}
                    onChange={e => setForm({ ...form, device: e.target.value as any })}
                  >
                    <option value="mobile">M</option>
                    <option value="desktop">D</option>
                  </select>
                  <input 
                    type="url" 
                    placeholder="https://example.com"
                    className={cn(
                      "flex-1 px-4 py-2 rounded-lg border outline-none transition-all",
                      errors.url ? "border-red-500 ring-1 ring-red-500" : "border-slate-200 focus:ring-2 focus:ring-indigo-500"
                    )}
                    value={form.url}
                    onChange={e => {
                      setForm({ ...form, url: e.target.value });
                      if (errors.url) setErrors({ ...errors, url: false });
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "performance", label: "Perf", icon: Zap, color: "text-orange-500" },
                  { key: "accessibility", label: "Acc", icon: Activity, color: "text-blue-500" },
                  { key: "bestPractices", label: "BP", icon: ShieldCheck, color: "text-emerald-500" },
                  { key: "seo", label: "SEO", icon: Search, color: "text-purple-500" }
                ].map(({ key, label, icon: Icon, color }) => (
                  <div key={key}>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
                      <Icon className={cn("w-3 h-3", color)} />
                      {label}
                    </label>
                    <input 
                      type="number" 
                      min="0" max="100"
                      placeholder="0"
                      className={cn(
                        "w-full px-4 py-2 rounded-lg border outline-none transition-all",
                        errors[key] ? "border-red-500 ring-1 ring-red-500" : "border-slate-200 focus:ring-2 focus:ring-indigo-500"
                      )}
                      value={(form as any)[key]}
                      onChange={e => {
                        const val = e.target.value === "" ? "" : parseInt(e.target.value);
                        setForm({ ...form, [key]: val });
                        if (errors[key]) setErrors({ ...errors, [key]: false });
                      }}
                    />
                  </div>
                ))}
              </div>
              <button 
                type="submit"
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-slate-200"
              >
                Log {form.device.charAt(0).toUpperCase() + form.device.slice(1)} Entry
              </button>
            </form>
          </section>

          {/* Quick Summary Card */}
          <section className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl">
            <h3 className="text-lg font-bold mb-4 opacity-80 uppercase text-xs tracking-widest">Global {activeDevice} Snapshot</h3>
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: "Performance", val: overallAverages.performance },
                { label: "Accessibility", val: overallAverages.accessibility },
                { label: "Best Practices", val: overallAverages.bestPractices },
                { label: "SEO", val: overallAverages.seo }
              ].map(stat => (
                <div key={stat.label}>
                  <p className="text-3xl font-black">{stat.val}<span className="text-sm opacity-50 font-normal ml-1">avg</span></p>
                  <p className="text-xs font-bold opacity-60 uppercase">{stat.label}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Right Column: Dashboard Content */}
        <div className="lg:col-span-8">
          {activeTab === "overall" ? (
            <div className="space-y-8">
              {/* Overall Chart */}
              <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[400px]">
                <h2 className="text-2xl font-black mb-6">Velocity Overview ({activeDevice})</h2>
                {uniqueUrls.length > 0 ? (
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                      <BarChart data={uniqueUrls.map(url => ({ 
                        url: url.replace(/https?:\/\/(www\.)?/, ""),
                        ...getAverageMetrics(groupedMetrics[url])
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="url" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="top" height={36}/>
                        <Bar dataKey="performance" fill="#f97316" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="accessibility" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="bestPractices" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="seo" fill="#a855f7" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400">
                    <History className="w-12 h-12 mb-4 opacity-20" />
                    <p>No {activeDevice} data logged yet.</p>
                  </div>
                )}
              </section>

              {/* Recent Activity List */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                  <h3 className="font-bold">Recent Logs ({activeDevice})</h3>
                  <span className="text-xs bg-slate-100 px-2 py-1 rounded-full font-bold">{filteredMetrics.length} Total</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-[400px] overflow-y-auto">
                  {filteredMetrics.slice().reverse().map(m => (
                    <div key={m.timestamp} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                          {m.device === "mobile" ? <Smartphone className="w-5 h-5 text-slate-400" /> : <Monitor className="w-5 h-5 text-slate-400" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm truncate max-w-[200px]">{m.url}</p>
                          <p className="text-xs text-slate-400">{new Date(m.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex gap-2 text-xs font-black">
                          <span className="text-orange-500">P:{m.performance}</span>
                          <span className="text-blue-500">A:{m.accessibility}</span>
                          <span className="text-emerald-500">BP:{m.bestPractices}</span>
                          <span className="text-purple-500">S:{m.seo}</span>
                        </div>
                        <button 
                          onClick={() => deleteMetric(m.timestamp)}
                          className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Per Page History Chart */}
              <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="text-2xl font-black mb-1">Timeline for {activeTab.replace(/https?:\/\/(www\.)?/, "")} ({activeDevice})</h2>
                    <p className="text-sm text-slate-500">{groupedMetrics[activeTab].length} data points captured</p>
                  </div>
                  <button 
                    onClick={() => runAnalysis(activeTab)}
                    disabled={isAnalyzing}
                    className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-bold hover:bg-indigo-100 transition-all disabled:opacity-50"
                  >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                    Analyze with AI
                  </button>
                </div>

                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%" minHeight={300}>
                    <LineChart data={groupedMetrics[activeTab]}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis 
                        dataKey="timestamp" 
                        tickFormatter={(t) => new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        axisLine={false} tickLine={false} 
                      />
                      <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                      <Tooltip 
                        labelFormatter={(l) => new Date(l).toLocaleString()}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Line type="monotone" dataKey="performance" stroke="#f97316" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="accessibility" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="bestPractices" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      <Line type="monotone" dataKey="seo" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* AI Analysis Console */}
              {analysisResult && (
                <section className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl border border-indigo-500/30 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[100px] rounded-full -mr-20 -mt-20 group-hover:bg-indigo-600/30 transition-all duration-500"></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="bg-indigo-600 p-2 rounded-lg">
                        <BrainCircuit className="w-5 h-5" />
                      </div>
                      <h3 className="text-xl font-bold tracking-tight">AI Performance Insight</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <div className="mb-6">
                          <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-2">Trend Analysis</p>
                          <p className="text-lg font-medium leading-relaxed">{analysisResult.trend}</p>
                        </div>
                        <div>
                          <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-2">Executive Summary</p>
                          <p className="text-slate-300 leading-relaxed">{analysisResult.summary}</p>
                        </div>
                      </div>

                      <div className="bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <p className="text-indigo-400 text-xs font-black uppercase tracking-widest mb-4">Optimization Roadmap</p>
                        <ul className="space-y-4">
                          {analysisResult.optimizations?.map((opt, i) => (
                            <li key={i} className="flex gap-3 text-sm">
                              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600/40 flex items-center justify-center text-[10px] font-bold">
                                0{i + 1}
                              </span>
                              <span className="text-slate-200">
                                {typeof opt === "string" ? opt : (
                                  <>
                                    <strong className="text-indigo-300 mr-1">{opt.area}:</strong>
                                    {opt.recommendation}
                                  </>
                                )}
                              </span>
                            </li>
                          )) || <li className="text-slate-400">No optimizations found.</li>}
                        </ul>
                      </div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
