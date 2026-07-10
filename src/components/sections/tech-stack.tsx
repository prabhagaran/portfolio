"use client";

import { Cpu, CircuitBoard, Code2, Server, Network, Cloud } from "lucide-react";
import { Section } from "@/components/section";
import { Stagger, StaggerItem } from "@/components/motion";
import { techStack, type ExperienceLevel } from "@/data/tech";
import { cn } from "@/lib/utils";

const icons: Record<string, React.ReactNode> = {
  cpu: <Cpu className="h-4 w-4" aria-hidden="true" />,
  circuit: <CircuitBoard className="h-4 w-4" aria-hidden="true" />,
  code: <Code2 className="h-4 w-4" aria-hidden="true" />,
  server: <Server className="h-4 w-4" aria-hidden="true" />,
  network: <Network className="h-4 w-4" aria-hidden="true" />,
  cloud: <Cloud className="h-4 w-4" aria-hidden="true" />,
};

const levelColor: Record<ExperienceLevel, string> = {
  Expert: "text-emerald",
  Advanced: "text-blue-300",
  Proficient: "text-slate-300",
  Familiar: "text-muted",
};

const levelWidth: Record<ExperienceLevel, string> = {
  Expert: "w-full",
  Advanced: "w-3/4",
  Proficient: "w-1/2",
  Familiar: "w-1/4",
};

export function TechStack() {
  return (
    <Section
      id="stack"
      eyebrow="03 · Tech Stack"
      title="Tools of the trade"
      description="Hover any item to see depth of experience. The stack runs from silicon to cloud — because battery systems do too."
    >
      <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {techStack.map((cat) => (
          <StaggerItem key={cat.name} className="h-full">
            <div className="h-full rounded-card border border-line bg-surface p-5 shadow-card">
              <div className="flex items-center gap-2.5 text-accent">
                {icons[cat.icon]}
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                  {cat.name}
                </h3>
              </div>
              <ul className="mt-4 space-y-1">
                {cat.items.map((item) => (
                  <li key={item.name} className="group/item relative">
                    <div
                      className="flex cursor-default items-center justify-between rounded-[8px] px-2.5 py-2 transition-colors duration-200 group-hover/item:bg-surface-2"
                      tabIndex={0}
                    >
                      <span className="text-sm text-slate-300">{item.name}</span>
                      {/* level reveal on hover/focus */}
                      <span
                        className={cn(
                          "flex items-center gap-2 opacity-0 transition-opacity duration-200 group-hover/item:opacity-100 group-focus-within/item:opacity-100"
                        )}
                      >
                        <span className="relative h-1 w-14 overflow-hidden rounded-full bg-line">
                          <span
                            className={cn(
                              "absolute inset-y-0 left-0 rounded-full",
                              levelWidth[item.level],
                              item.level === "Expert" ? "bg-emerald" : "bg-accent"
                            )}
                          />
                        </span>
                        <span
                          className={cn(
                            "font-mono text-[10px] uppercase tracking-wide",
                            levelColor[item.level]
                          )}
                        >
                          {item.level} · {item.years}
                        </span>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
