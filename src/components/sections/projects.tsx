import { ArrowUpRight, BookText } from "lucide-react";
import { FaGithub } from "react-icons/fa6";
import { Section } from "@/components/section";
import { Stagger, StaggerItem } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { ProjectVisual } from "@/components/project-visual";
import { projects, type ProjectStatus } from "@/data/projects";

const statusTone: Record<ProjectStatus, "blue" | "emerald" | "amber" | "neutral"> = {
  Production: "emerald",
  Active: "blue",
  Prototype: "amber",
  "Open Source": "neutral",
};

export function Projects() {
  return (
    <Section
      id="projects"
      eyebrow="02 · Featured Projects"
      title="Selected work"
      description="Hardware, firmware, and tooling built for real battery systems — from cell-level measurement boards to fleet-scale analytics."
    >
      <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <StaggerItem key={p.slug} className="h-full">
            <article className="group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-card-hover">
              {/* Visual */}
              <div className="relative aspect-[2/1] border-b border-line bg-background/60">
                <ProjectVisual variant={p.visual} />
                <div className="absolute right-3 top-3">
                  <Badge tone={statusTone[p.status]}>{p.status}</Badge>
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="text-base font-semibold tracking-tight text-slate-50">
                  {p.name}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {p.description}
                </p>
                <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
                  {p.tags.map((t) => (
                    <li key={t}>
                      <Badge>{t}</Badge>
                    </li>
                  ))}
                </ul>

                {/* Actions */}
                <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
                  {p.github && (
                    <a
                      href={p.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-line px-3 text-xs font-medium text-slate-300 transition-colors duration-200 hover:border-line-strong hover:text-white"
                      aria-label={`${p.name} on GitHub`}
                    >
                      <FaGithub className="h-3.5 w-3.5" aria-hidden="true" />
                      GitHub
                    </a>
                  )}
                  {p.demo && (
                    <a
                      href={p.demo}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-accent/40 bg-accent-soft px-3 text-xs font-medium text-blue-300 transition-colors duration-200 hover:border-accent/70 hover:text-blue-200"
                      aria-label={`${p.name} live demo`}
                    >
                      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                      Live Demo
                    </a>
                  )}
                  {p.docs && (
                    <a
                      href={p.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-xs font-medium text-muted transition-colors duration-200 hover:text-slate-100"
                      aria-label={`${p.name} documentation`}
                    >
                      <BookText className="h-3.5 w-3.5" aria-hidden="true" />
                      Docs
                    </a>
                  )}
                </div>
              </div>
            </article>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
