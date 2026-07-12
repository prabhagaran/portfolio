import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Section } from "@/components/section";
import { Stagger, StaggerItem } from "@/components/motion";
import { skills } from "@/data/skills";

export function Skills() {
  return (
    <Section
      id="skills"
      eyebrow="05 · Skills"
      title="Engineering competencies"
      description="Each competency links to the project or write-up that demonstrates it — judge the work, not a self-assigned score."
    >
      <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((s) => (
          <StaggerItem key={s.name} className="h-full">
            <div className="flex h-full flex-col rounded-card border border-line bg-surface p-5 shadow-card transition-colors duration-200 hover:border-line-strong">
              <h3 className="text-sm font-semibold text-slate-100">{s.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                {s.description}
              </p>
              <ul
                className="mt-4 flex flex-wrap gap-1.5 border-t border-line pt-4"
                aria-label={`Evidence for ${s.name}`}
              >
                {s.evidence.map((e) => {
                  const external = e.href.startsWith("http");
                  const className =
                    "inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent-soft px-2.5 py-0.5 font-mono text-[11px] leading-5 text-blue-300 transition-colors duration-200 hover:border-accent/60 hover:text-blue-200";
                  return (
                    <li key={e.href + e.label}>
                      {external ? (
                        <a
                          href={e.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={className}
                        >
                          {e.label}
                          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                        </a>
                      ) : (
                        <Link href={e.href} className={className}>
                          {e.label}
                          <ArrowUpRight className="h-3 w-3" aria-hidden="true" />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
