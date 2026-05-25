export const SITE_IDS = ["wizyvision", "wizyemm", "wizy"] as const;

export type SiteId = (typeof SITE_IDS)[number];

export interface SiteConfig {
  id: SiteId;
  name: string;
  defaultUrl: string;
  description: string;
}

export const SITES: SiteConfig[] = [
  {
    id: "wizyvision",
    name: "WizyVision",
    defaultUrl: "https://wizyvision.com",
    description: "WizyVision product pages",
  },
  {
    id: "wizyemm",
    name: "WizyEmm",
    defaultUrl: "https://wizyemm.com",
    description: "WizyEmm product pages",
  },
  {
    id: "wizy",
    name: "Wizy",
    defaultUrl: "https://wizy.io",
    description: "Wizy product pages",
  },
];

export function getSite(id: SiteId): SiteConfig {
  const site = SITES.find((s) => s.id === id);
  if (!site) throw new Error(`Unknown site: ${id}`);
  return site;
}

export function isSiteId(value: string): value is SiteId {
  return (SITE_IDS as readonly string[]).includes(value);
}
