"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpRight,
  BookText,
  ChevronDown,
  Compass,
  Download,
  Eye,
  Home,
  List,
  Mail,
  MapPin,
  Moon,
  PlaneTakeoff,
  RotateCw,
  Route,
  Satellite,
  Sun,
  Volume2,
  VolumeX,
  X,
  type LucideIcon,
} from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa6";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { setStoredMode } from "@/lib/mode";
import { site, stats } from "@/data/site";
import { skills } from "@/data/skills";
import type { ProjectStatus } from "@/data/projects";
import { LEVEL_COLORS } from "./github-data";
import { useCity } from "./city-context";
import type { ViewMode } from "./city-context";
import {
  buildings,
  kiosks,
  type KioskDef,
  EXTENT,
  GITHUB_BUILDING,
  INNOVATION_DISTRICT_LABEL,
  NILA_POS,
  PARK_POS,
  STREET_HALF,
} from "./layout-data";

const statusTone: Record<ProjectStatus, "blue" | "emerald" | "amber" | "neutral"> = {
  Production: "emerald",
  Active: "blue",
  Prototype: "amber",
  "Open Source": "neutral",
};

/* ---------------- minimap ---------------- */

const MAP = 148; // px
const WORLD = EXTENT + 6;
const toMap = (v: number) => ((v + WORLD) / (WORLD * 2)) * MAP;

function Minimap() {
  const { playerPos } = useCity();
  const dot = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let raf: number;
    const tick = () => {
      if (dot.current) {
        dot.current.style.transform = `translate(${toMap(playerPos.current.x) - 4}px, ${
          toMap(playerPos.current.z) - 4
        }px)`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playerPos]);

  const streetW = (STREET_HALF * 2 * MAP) / (WORLD * 2);

  return (
    <div
      className="pointer-events-none relative hidden overflow-hidden rounded-card border border-line bg-surface/85 shadow-card backdrop-blur-sm sm:block"
      style={{ width: MAP, height: MAP }}
      role="img"
      aria-label="City minimap"
    >
      {/* streets */}
      <div
        className="absolute bg-[#1d2735]"
        style={{ left: 0, right: 0, top: MAP / 2 - streetW / 2, height: streetW }}
      />
      <div
        className="absolute bg-[#1d2735]"
        style={{ top: 0, bottom: 0, left: MAP / 2 - streetW / 2, width: streetW }}
      />
      {/* buildings */}
      {buildings.map((b) => (
        <div
          key={b.project.slug}
          title={b.project.name}
          className="absolute rounded-[2px]"
          style={{
            left: toMap(b.position[0] - b.size[0] / 2),
            top: toMap(b.position[1] - b.size[2] / 2),
            width: (b.size[0] * MAP) / (WORLD * 2),
            height: (b.size[2] * MAP) / (WORLD * 2),
            background: b.accent,
            opacity: 0.75,
          }}
        />
      ))}
      {/* kiosks */}
      {kiosks.map((k) => (
        <div
          key={k.id}
          className="absolute h-[5px] w-[5px] rounded-full"
          style={{
            left: toMap(k.position[0]) - 2.5,
            top: toMap(k.position[1]) - 2.5,
            background: k.accent,
          }}
        />
      ))}
      {/* Nila */}
      <div
        className="absolute h-[5px] w-[5px] rounded-full bg-slate-200"
        style={{ left: toMap(NILA_POS[0]) - 2.5, top: toMap(NILA_POS[1]) - 2.5 }}
      />
      {/* park */}
      <div
        className="absolute h-[6px] w-[6px] rounded-full bg-[#2f6f4f]"
        style={{ left: toMap(PARK_POS[0]) - 3, top: toMap(PARK_POS[1]) - 3 }}
      />
      {/* GitHub tower */}
      <div
        title="GitHub"
        className="absolute rounded-[2px]"
        style={{
          left: toMap(GITHUB_BUILDING.position[0] - GITHUB_BUILDING.size[0] / 2),
          top: toMap(GITHUB_BUILDING.position[1] - GITHUB_BUILDING.size[2] / 2),
          width: (GITHUB_BUILDING.size[0] * MAP) / (WORLD * 2),
          height: (GITHUB_BUILDING.size[2] * MAP) / (WORLD * 2),
          background: "#63a9ff",
          opacity: 0.9,
        }}
      />
      {/* player */}
      <div
        ref={dot}
        className="absolute left-0 top-0 h-2 w-2 rounded-full bg-white shadow-[0_0_6px_2px_rgba(59,130,246,0.8)]"
      />
      <span className="absolute bottom-1 left-2 font-mono text-[9px] text-faint">
        ELECTRONIC CITY
      </span>
    </div>
  );
}

/* ---------------- panels ---------------- */

function Panel({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.aside
      initial={{ opacity: 0, x: 48 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 48 }}
      transition={{ duration: 0.25, ease: [0.21, 0.47, 0.32, 0.98] }}
      className="pointer-events-auto fixed inset-y-0 right-0 z-30 flex w-full max-w-md flex-col overflow-y-auto border-l border-line bg-surface/95 p-6 shadow-card-hover backdrop-blur-md sm:my-4 sm:mr-4 sm:rounded-card sm:border sm:[inset-block:auto] sm:max-h-[calc(100vh-2rem)]"
      role="dialog"
      aria-label={title}
    >
      <div className="flex items-start justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-slate-50">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="rounded-md p-1.5 text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-slate-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </motion.aside>
  );
}

function ProjectPanel() {
  const { selected, setSelected } = useCity();
  if (!selected) return null;
  return (
    <Panel title={selected.name} onClose={() => setSelected(null)}>
      <Badge tone={statusTone[selected.status]}>{selected.status}</Badge>
      <p className="mt-4 text-sm leading-relaxed text-muted">{selected.description}</p>
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {selected.tags.map((t) => (
          <li key={t}>
            <Badge>{t}</Badge>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap gap-2 border-t border-line pt-5">
        {selected.github && (
          <a
            href={selected.github}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-line px-4 text-sm text-slate-200 transition-colors duration-200 hover:border-line-strong hover:text-white"
          >
            <FaGithub className="h-4 w-4" aria-hidden="true" /> GitHub
          </a>
        )}
        {selected.demo && (
          <a
            href={selected.demo}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-accent/40 bg-accent-soft px-4 text-sm text-blue-300 transition-colors duration-200 hover:border-accent/70"
          >
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" /> Live Demo
          </a>
        )}
        {selected.docs && (
          <Link
            href={selected.docs}
            className="inline-flex h-9 items-center gap-2 rounded-[10px] border border-line px-4 text-sm text-slate-200 transition-colors duration-200 hover:border-line-strong hover:text-white"
          >
            <BookText className="h-4 w-4" aria-hidden="true" /> Docs
          </Link>
        )}
      </div>
      <button
        type="button"
        onClick={() => setSelected(null)}
        className="mt-6 inline-flex items-center gap-2 text-sm text-muted transition-colors duration-200 hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to the street
      </button>
    </Panel>
  );
}

function GithubPanel({ onClose }: { onClose: () => void }) {
  const { githubData } = useCity();
  return (
    <Panel title="GitHub — Data Tower" onClose={onClose}>
      <p className="text-sm leading-relaxed text-muted">
        Every window on this tower is a real day from my GitHub contribution
        history — brighter windows near the roofline mean more recent
        activity, dim ones near the base are further back in the year.
      </p>
      {githubData ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-card border border-line bg-surface-2 p-3 text-center">
            <p className="text-xl font-semibold text-slate-50">
              {githubData.total.toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-muted">Contributions / year</p>
          </div>
          <div className="rounded-card border border-line bg-surface-2 p-3 text-center">
            <p className="text-xl font-semibold text-slate-50">{githubData.days.length}</p>
            <p className="mt-0.5 text-xs text-muted">Days tracked</p>
          </div>
        </div>
      ) : (
        <p className="mt-5 text-xs text-faint">Loading live contribution data…</p>
      )}
      <div className="mt-5 flex items-center gap-2 border-t border-line pt-4 font-mono text-[10px] text-faint">
        <span>Less</span>
        {LEVEL_COLORS.map((c) => (
          <span key={c} className="h-[10px] w-[10px] rounded-[2px]" style={{ background: c }} />
        ))}
        <span>More</span>
      </div>
      <a
        href={site.githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex h-9 items-center gap-2 rounded-[10px] border border-line px-4 text-sm text-slate-200 transition-colors duration-200 hover:border-accent/60 hover:text-white"
      >
        <FaGithub className="h-4 w-4" aria-hidden="true" />
        View full profile
        <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </Panel>
  );
}

function DirectoryPanel({ onClose }: { onClose: () => void }) {
  const { setSelected, setPanel, moveCommand } = useCity();

  const rowClass =
    "flex w-full items-center justify-between gap-3 rounded-card border border-line bg-surface-2 px-3.5 py-2.5 text-left text-sm text-slate-200 transition-colors duration-200 hover:border-line-strong hover:text-white";

  function goProject(slug: string) {
    const b = buildings.find((x) => x.project.slug === slug);
    if (!b) return;
    moveCommand.current = b.doorstep;
    setSelected(b.project);
  }
  function goKiosk(id: KioskDef["id"]) {
    const k = kiosks.find((x) => x.id === id);
    if (!k) return;
    moveCommand.current = k.position;
    setPanel(id);
  }
  function goGithub() {
    moveCommand.current = GITHUB_BUILDING.doorstep;
    setPanel("github");
  }

  return (
    <Panel title="Directory" onClose={onClose}>
      <p className="text-sm leading-relaxed text-muted">
        Every destination in the city — pick one and the rover drives there.
      </p>
      <div className="mt-5 space-y-5">
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.15em] text-faint">
            {INNOVATION_DISTRICT_LABEL}
          </p>
          <div className="space-y-1.5">
            {buildings.map((b) => (
              <button
                key={b.project.slug}
                type="button"
                onClick={() => goProject(b.project.slug)}
                className={rowClass}
              >
                {b.project.name}
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-faint" aria-hidden="true" />
              </button>
            ))}
            <button type="button" onClick={goGithub} className={rowClass}>
              GitHub Data Tower
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-faint" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.15em] text-faint">
            Destinations
          </p>
          <div className="space-y-1.5">
            {kiosks.map((k) => (
              <button key={k.id} type="button" onClick={() => goKiosk(k.id)} className={rowClass}>
                {k.label}
                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-faint" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  );
}

function InfoPanels() {
  const { panel, setPanel } = useCity();
  const close = () => setPanel(null);

  return (
    <>
      {panel === "about" && (
        <Panel title={`About ${site.name.split(" ")[0]}`} onClose={close}>
          <p className="text-sm leading-relaxed text-muted">{site.tagline}</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-card border border-line bg-surface-2 p-3 text-center">
                <p className="text-xl font-semibold text-slate-50">
                  {s.value}
                  {s.suffix}
                </p>
                <p className="mt-0.5 text-xs text-muted">{s.label}</p>
              </div>
            ))}
          </div>
          <Link
            href="/?mode=classic#about"
            onClick={() => setStoredMode("classic")}
            className="mt-6 inline-flex items-center gap-2 text-sm text-accent transition-colors duration-200 hover:text-blue-300"
          >
            Full story in the classic portfolio
            <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Panel>
      )}
      {panel === "contact" && (
        <Panel title="Communication Hub" onClose={close}>
          <div className="space-y-3">
            <a
              href={`mailto:${site.email}`}
              className="flex items-center gap-3 rounded-card border border-line bg-surface-2 p-3 text-sm text-slate-200 transition-colors duration-200 hover:border-line-strong"
            >
              <Mail className="h-4 w-4 text-accent" aria-hidden="true" /> {site.email}
            </a>
            <a
              href={site.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-card border border-line bg-surface-2 p-3 text-sm text-slate-200 transition-colors duration-200 hover:border-line-strong"
            >
              <FaGithub className="h-4 w-4 text-accent" aria-hidden="true" /> @{site.github}
            </a>
            <a
              href={site.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-card border border-line bg-surface-2 p-3 text-sm text-slate-200 transition-colors duration-200 hover:border-line-strong"
            >
              <FaLinkedin className="h-4 w-4 text-accent" aria-hidden="true" /> LinkedIn
            </a>
            <p className="flex items-center gap-3 rounded-card border border-line bg-surface-2 p-3 text-sm text-slate-200">
              <MapPin className="h-4 w-4 text-emerald" aria-hidden="true" /> {site.location}
            </p>
          </div>
        </Panel>
      )}
      {panel === "resume" && (
        <Panel title="Documentation Center" onClose={close}>
          <p className="text-sm leading-relaxed text-muted">
            {site.role} — {site.keywords.slice(0, 4).join(", ")}.
          </p>
          <a
            href={site.resumeUrl}
            download
            className="mt-5 inline-flex h-10 items-center gap-2 rounded-[10px] bg-accent px-5 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-500"
          >
            <Download className="h-4 w-4" aria-hidden="true" /> Download Resume (PDF)
          </a>
        </Panel>
      )}
      {panel === "skills" && (
        <Panel title="Tech District" onClose={close}>
          <p className="text-sm leading-relaxed text-muted">
            Competencies, each linked to the project or article that
            demonstrates it — no self-assigned scores.
          </p>
          <div className="mt-4 space-y-3">
            {skills.map((s) => (
              <div key={s.name} className="rounded-card border border-line bg-surface-2 p-3">
                <p className="text-sm font-medium text-slate-100">{s.name}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">{s.description}</p>
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {s.evidence.map((e) => {
                    const external = e.href.startsWith("http");
                    const linkClass =
                      "inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-soft px-2 py-0.5 font-mono text-[10px] text-blue-300 transition-colors duration-200 hover:border-accent/60";
                    return (
                      <li key={e.href + e.label}>
                        {external ? (
                          <a href={e.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                            {e.label}
                          </a>
                        ) : (
                          <Link href={e.href} className={linkClass}>
                            {e.label}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Panel>
      )}
      {panel === "github" && <GithubPanel onClose={close} />}
      {panel === "directory" && <DirectoryPanel onClose={close} />}
      {panel === "park" && (
        <Panel title="Off the clock" onClose={close}>
          <p className="text-sm leading-relaxed text-muted">
            You found the park — nice detour. The trees are electrolytic
            capacitors, because of course they are.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            When I&apos;m not routing boards: long walks where I debug firmware
            in my head, filter coffee strong enough to reflow solder, and
            lo-fi playlists that pair suspiciously well with PCB layout. My
            most productive engineering happens on benches like this one —
            the hard problems usually crack somewhere between the lab and
            the walk home.
          </p>
          <p className="mt-4 border-t border-line pt-4 font-mono text-xs text-faint">
            easter egg 1 of 1 · thanks for exploring the whole map
          </p>
        </Panel>
      )}
      {panel === "nila" && (
        <Panel title="Nila — your guide" onClose={close}>
          <p className="text-sm leading-relaxed text-muted">
            Welcome to Electronic City! Every building here is one of{" "}
            {site.name.split(" ")[0]}&apos;s engineering projects.
          </p>
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-muted">
            <li className="flex gap-2.5">
              <span className="mt-[9px] h-1 w-3 shrink-0 rounded-full bg-accent" />
              Click (or tap) anywhere on the street and the rover drives there.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-[9px] h-1 w-3 shrink-0 rounded-full bg-accent" />
              Or drive it like a car: ↑/W throttle, ↓/S reverse, ←→/AD steer.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-[9px] h-1 w-3 shrink-0 rounded-full bg-accent" />
              Click a glowing building to open its project details.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-[9px] h-1 w-3 shrink-0 rounded-full bg-accent" />
              Scroll the mouse wheel to zoom the camera in and out.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-[9px] h-1 w-3 shrink-0 rounded-full bg-accent" />
              Press V, or open the camera menu, for Navigate, Street View,
              Orbit (drag to spin), Drone View, or Satellite View.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-[9px] h-1 w-3 shrink-0 rounded-full bg-accent" />
              The Directory (list icon) jumps straight to any destination.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-[9px] h-1 w-3 shrink-0 rounded-full bg-accent" />
              Try Guided Tour (route icon) for a hands-free flythrough.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-[9px] h-1 w-3 shrink-0 rounded-full bg-accent" />
              The plaza kiosks cover About, Communication Hub, Documentation
              Center, and Tech District.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-[9px] h-1 w-3 shrink-0 rounded-full bg-accent" />
              The tall tower is my real GitHub activity — each window is a day.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-[9px] h-1 w-3 shrink-0 rounded-full bg-accent" />
              Use the sun/moon button to switch day and night.
            </li>
          </ul>
          <p className="mt-5 border-t border-line pt-4 text-xs text-faint">
            Prefer a quieter read? The classic portfolio is one click away, top left.
          </p>
        </Panel>
      )}
    </>
  );
}

/* ---------------- performance prompt ---------------- */

function PerfPrompt({ show, onDismiss }: { show: boolean; onDismiss: () => void }) {
  if (!show) return null;
  return (
    <div
      role="alertdialog"
      aria-label="Performance suggestion"
      className="pointer-events-auto fixed inset-x-0 bottom-6 z-40 mx-auto flex w-fit max-w-[92vw] flex-wrap items-center gap-3 rounded-card border border-line bg-surface/95 px-4 py-3 text-sm text-slate-200 shadow-card-hover backdrop-blur-md"
    >
      <span>This device is struggling with 3D — the classic view will be much smoother.</span>
      <Link
        href="/?mode=classic&reason=perf"
        onClick={() => setStoredMode("classic")}
        className="rounded-[8px] bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors duration-200 hover:bg-blue-500"
      >
        Switch to classic
      </Link>
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs text-muted transition-colors duration-200 hover:text-slate-100"
      >
        Keep exploring
      </button>
    </div>
  );
}

/* ---------------- camera mode menu ---------------- */

const CAMERA_MODES: { id: ViewMode; label: string; icon: LucideIcon }[] = [
  { id: "follow", label: "Navigate", icon: Compass },
  { id: "pov", label: "Street View", icon: Eye },
  { id: "orbit", label: "Orbit", icon: RotateCw },
  { id: "drone", label: "Drone View", icon: PlaneTakeoff },
  { id: "satellite", label: "Satellite View", icon: Satellite },
];

function CameraMenu() {
  const { viewMode, setViewMode, resetCamera } = useCity();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", onDoc);
    return () => window.removeEventListener("mousedown", onDoc);
  }, [open]);

  const current = CAMERA_MODES.find((m) => m.id === viewMode) ?? CAMERA_MODES[0];
  const CurrentIcon = current.icon;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        title="Camera mode (V toggles Navigate / Street View)"
        className="pointer-events-auto inline-flex h-9 items-center gap-2 rounded-[10px] border border-line bg-surface/90 px-3 text-sm text-slate-200 shadow-card backdrop-blur-sm transition-colors duration-200 hover:border-accent/60"
      >
        <CurrentIcon className="h-4 w-4 text-emerald-300" aria-hidden="true" />
        <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown className="h-3.5 w-3.5 text-faint" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="menu"
          aria-label="Camera mode"
          className="pointer-events-auto absolute right-0 top-11 w-56 overflow-hidden rounded-[10px] border border-line bg-surface/95 py-1.5 shadow-card-hover backdrop-blur-md"
        >
          {CAMERA_MODES.map((m) => (
            <button
              key={m.id}
              role="menuitemradio"
              aria-checked={viewMode === m.id}
              type="button"
              onClick={() => {
                setViewMode(m.id);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors duration-150",
                viewMode === m.id
                  ? "bg-accent-soft text-blue-300"
                  : "text-slate-200 hover:bg-surface-2"
              )}
            >
              <m.icon className="h-4 w-4" aria-hidden="true" />
              {m.label}
            </button>
          ))}
          <div className="my-1 border-t border-line" />
          <button
            type="button"
            onClick={() => {
              resetCamera();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-200 transition-colors duration-150 hover:bg-surface-2"
          >
            <Home className="h-4 w-4 text-amber-300" aria-hidden="true" />
            Return to Base
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------- guided tour banner ---------------- */

function TourBanner() {
  const { viewMode, setViewMode, tourStopName } = useCity();
  if (viewMode !== "tour" || !tourStopName) return null;
  return (
    <div className="pointer-events-auto absolute left-1/2 top-4 z-30 flex -translate-x-1/2 items-center gap-3 whitespace-nowrap rounded-full border border-line bg-surface/90 px-4 py-2 text-sm text-slate-100 shadow-card backdrop-blur-sm">
      <Route className="h-4 w-4 text-emerald-300" aria-hidden="true" />
      <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-faint">
        Guided Tour
      </span>
      <span className="font-medium">{tourStopName}</span>
      <button
        type="button"
        onClick={() => setViewMode("follow")}
        className="ml-1 rounded-full border border-line px-2.5 py-0.5 text-xs text-muted transition-colors duration-200 hover:text-slate-100"
      >
        Stop
      </button>
    </div>
  );
}

/* ---------------- HUD root ---------------- */

export function CityHud({
  perfWarn,
  onDismissPerf,
}: {
  perfWarn: boolean;
  onDismissPerf: () => void;
}) {
  const { night, toggleNight, audioOn, toggleAudio, viewMode, setViewMode, setPanel } =
    useCity();

  return (
    <div className="pointer-events-none fixed inset-0 z-20">
      {/* top bar: skip link (always, one click) + navigation + audio/day-night */}
      <div className="flex items-start justify-between p-4">
        <Link
          href="/?mode=classic"
          onClick={() => setStoredMode("classic")}
          className="pointer-events-auto inline-flex h-9 items-center gap-2 rounded-[10px] border border-line bg-surface/90 px-4 text-sm text-slate-200 shadow-card backdrop-blur-sm transition-colors duration-200 hover:border-accent/60 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Skip to classic portfolio
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPanel("directory")}
            aria-label="Open directory"
            title="Directory"
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-surface/90 text-slate-200 shadow-card backdrop-blur-sm transition-colors duration-200 hover:border-accent/60"
          >
            <List className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode(viewMode === "tour" ? "follow" : "tour")}
            aria-label={viewMode === "tour" ? "Stop guided tour" : "Start guided tour"}
            aria-pressed={viewMode === "tour"}
            title="Guided Tour"
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-surface/90 text-slate-200 shadow-card backdrop-blur-sm transition-colors duration-200 hover:border-accent/60"
          >
            <Route
              className={cn("h-4 w-4", viewMode === "tour" ? "text-emerald-300" : "text-slate-300")}
              aria-hidden="true"
            />
          </button>
          <CameraMenu />
          <button
            type="button"
            onClick={toggleAudio}
            aria-label={audioOn ? "Mute city sounds" : "Enable city sounds"}
            aria-pressed={audioOn}
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-surface/90 text-slate-200 shadow-card backdrop-blur-sm transition-colors duration-200 hover:border-accent/60"
          >
            {audioOn ? (
              <Volume2 className="h-4 w-4 text-emerald-300" aria-hidden="true" />
            ) : (
              <VolumeX className="h-4 w-4 text-muted" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            onClick={toggleNight}
            aria-label={night ? "Switch to day" : "Switch to night"}
            aria-pressed={night}
            className="pointer-events-auto inline-flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-surface/90 text-slate-200 shadow-card backdrop-blur-sm transition-colors duration-200 hover:border-accent/60"
          >
            {night ? (
              <Sun className="h-4 w-4 text-amber-300" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 text-blue-300" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      <TourBanner />

      {/* bottom-left hint / bottom-right minimap */}
      <div className="absolute bottom-4 left-4 hidden max-w-[280px] space-y-1 rounded-card border border-line bg-surface/85 px-3.5 py-2.5 font-mono text-[11px] leading-relaxed text-muted shadow-card backdrop-blur-sm sm:block">
        <p>Click the street to move · or drive it like a car (WASD/arrows)</p>
        <p>Scroll to zoom/altitude · drag to Orbit · V toggles Street View</p>
      </div>
      <div className="absolute bottom-4 right-4">
        <Minimap />
      </div>

      <AnimatePresence>
        <ProjectPanel key="project" />
        <InfoPanels key="info" />
      </AnimatePresence>

      <PerfPrompt show={perfWarn} onDismiss={onDismissPerf} />
    </div>
  );
}
