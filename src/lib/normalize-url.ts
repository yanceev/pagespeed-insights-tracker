/** Canonical URL for grouping and storage (https, no www, no trailing slash). */
export function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;

  try {
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const parsed = new URL(withProtocol);

    parsed.protocol = "https:";
    parsed.hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    parsed.hash = "";

    let pathname = parsed.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }
    parsed.pathname = pathname;

    const port =
      parsed.port && parsed.port !== "443" ? `:${parsed.port}` : "";
    const path = pathname === "/" ? "" : pathname;

    return `${parsed.protocol}//${parsed.hostname}${port}${path}${parsed.search}`;
  } catch {
    return trimmed.toLowerCase();
  }
}

/** Short label for charts and tabs. */
export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/i, "");
}
