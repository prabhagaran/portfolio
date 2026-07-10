"use client";

import { useEffect, useState } from "react";
import { Star, GitFork, ExternalLink } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { Section } from "@/components/section";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { site } from "@/data/site";
import { cn } from "@/lib/utils";

interface Repo {
  id: number;
  name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
}

interface ContributionDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

const langColor: Record<string, string> = {
  C: "#555555",
  "C++": "#f34b7d",
  Python: "#3572A5",
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  HTML: "#e34c26",
  Shell: "#89e051",
  Rust: "#dea584",
};

const cellColor = [
  "rgba(148,163,184,0.08)",
  "rgba(59,130,246,0.25)",
  "rgba(59,130,246,0.45)",
  "rgba(59,130,246,0.7)",
  "#3b82f6",
];

function timeAgo(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days < 1) return "today";
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

export function GitHub() {
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [days, setDays] = useState<ContributionDay[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch(
      `https://api.github.com/users/${site.github}/repos?sort=updated&per_page=6&type=owner`,
      { signal: controller.signal, headers: { Accept: "application/vnd.github+json" } }
    )
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: Repo[]) => setRepos(data))
      .catch(() => setFailed(true));

    fetch(`https://github-contributions-api.jogruber.de/v4/${site.github}?y=last`, {
      signal: controller.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data: { total: Record<string, number>; contributions: ContributionDay[] }) => {
        setDays(data.contributions.slice(-364));
        setTotal(Object.values(data.total).reduce((a, b) => a + b, 0));
      })
      .catch(() => {
        /* graph simply not shown */
      });

    return () => controller.abort();
  }, []);

  const weeks: ContributionDay[][] = [];
  if (days) {
    for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  }

  return (
    <Section
      id="github"
      eyebrow="05 · GitHub"
      title="Open source activity"
      description="Live from the GitHub API — repositories, languages, and contribution history."
    >
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-card border border-line bg-surface p-5 shadow-card">
          <div className="flex items-center gap-4">
            <FaGithub className="h-9 w-9 text-slate-200" aria-hidden="true" />
            <div>
              <p className="font-mono text-sm text-slate-100">@{site.github}</p>
              <p className="text-sm text-muted">
                {total !== null
                  ? `${total.toLocaleString()} contributions in the last year`
                  : "Hardware · Firmware · Battery tooling"}
              </p>
            </div>
          </div>
          <a
            href={site.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-line px-4 text-sm text-slate-200 transition-colors duration-200 hover:border-accent/60 hover:text-white"
          >
            View Profile
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </Reveal>

      {/* Contribution graph */}
      {weeks.length > 0 && (
        <Reveal className="mt-6">
          <div className="overflow-x-auto rounded-card border border-line bg-surface p-5 shadow-card">
            <div className="flex gap-[3px]" aria-label="GitHub contribution graph">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((d) => (
                    <div
                      key={d.date}
                      title={`${d.date}: ${d.count} contributions`}
                      className="h-[10px] w-[10px] rounded-[2px]"
                      style={{ background: cellColor[d.level] }}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 font-mono text-[10px] text-faint">
              <span>Less</span>
              {cellColor.map((c) => (
                <span key={c} className="h-[10px] w-[10px] rounded-[2px]" style={{ background: c }} />
              ))}
              <span>More</span>
            </div>
          </div>
        </Reveal>
      )}

      {/* Repos */}
      <div className="mt-6">
        {repos && repos.length > 0 ? (
          <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {repos.map((r) => (
              <StaggerItem key={r.id} className="h-full">
                <a
                  href={r.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-full flex-col rounded-card border border-line bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-hover"
                >
                  <p className="truncate font-mono text-sm text-accent">{r.name}</p>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                    {r.description ?? "No description provided."}
                  </p>
                  <div className="mt-4 flex items-center gap-4 font-mono text-xs text-faint">
                    {r.language && (
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: langColor[r.language] ?? "#64748b" }}
                          aria-hidden="true"
                        />
                        {r.language}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" aria-hidden="true" />
                      {r.stargazers_count}
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="h-3 w-3" aria-hidden="true" />
                      {r.forks_count}
                    </span>
                    <span className="ml-auto">{timeAgo(r.updated_at)}</span>
                  </div>
                </a>
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <div
            className={cn(
              "rounded-card border border-dashed border-line p-8 text-center text-sm text-muted",
              !failed && repos === null && "animate-pulse"
            )}
          >
            {failed
              ? "Couldn't reach the GitHub API right now — visit the profile directly instead."
              : "Loading repositories…"}
          </div>
        )}
      </div>
    </Section>
  );
}
