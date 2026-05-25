"use client";

import { Activity, ChevronRight } from "lucide-react";
import { SITES, type SiteId } from "@/lib/sites";

interface SitePickerProps {
  onSelect: (siteId: SiteId) => void;
}

export function SitePicker({ onSelect }: SitePickerProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center mb-12">
        <h1 className="text-4xl font-black tracking-tight flex items-center justify-center gap-3 mb-4">
          <Activity className="w-10 h-10 text-indigo-600" />
          PSI Tracker
        </h1>
        <p className="text-slate-500 text-lg">
          Choose a product to track Page Speed Insights over time.
        </p>
      </div>

      <div className="max-w-2xl w-full grid gap-4">
        {SITES.map((site) => (
          <button
            key={site.id}
            type="button"
            onClick={() => onSelect(site.id)}
            className="group flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all text-left"
          >
            <div>
              <p className="text-xl font-black text-slate-900">{site.name}</p>
              <p className="text-sm text-slate-500 mt-1">{site.description}</p>
              <p className="text-xs text-slate-400 mt-2 font-mono">
                {site.defaultUrl}
              </p>
            </div>
            <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}
