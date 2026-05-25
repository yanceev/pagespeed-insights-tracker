import type { SiteId } from "@/lib/sites";

export interface PageMetric {
  id: string;
  siteId: SiteId;
  url: string;
  device: "mobile" | "desktop";
  timestamp: string;
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
}

export interface PageHistory {
  url: string;
  metrics: PageMetric[];
}

export interface AnalysisResponse {
  trend: string;
  optimizations: string[];
  summary: string;
}
