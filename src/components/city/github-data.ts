export interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

export interface ContribData {
  days: ContributionDay[];
  total: number;
}

/**
 * Shared 5-level contribution color scale (matching the app's electric-
 * blue accent rather than GitHub's green) — used by both the data
 * tower's facade texture and the info panel's legend.
 */
export const LEVEL_COLORS = ["#141c2b", "#1f3a5c", "#2c5c8c", "#3b82c9", "#63a9ff"];

/**
 * Client-side fetch — the city bundle is dynamically imported (ssr:false)
 * and /city is marked noindex, so there's no SEO cost to fetching here
 * instead of at build time like the classic mode's GitHub section.
 */
export async function fetchContributions(username: string): Promise<ContribData | null> {
  try {
    const res = await fetch(
      `https://github-contributions-api.jogruber.de/v4/${username}?y=last`
    );
    if (!res.ok) return null;
    const data: { total: Record<string, number>; contributions: ContributionDay[] } =
      await res.json();
    const total = Object.values(data.total).reduce((a, b) => a + b, 0);
    return { days: data.contributions, total };
  } catch {
    return null;
  }
}
