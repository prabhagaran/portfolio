import { Award, ArrowUpRight } from "lucide-react";
import { Section } from "@/components/section";
import { Stagger, StaggerItem } from "@/components/motion";
import { certifications } from "@/data/certifications";

export function Certifications() {
  return (
    <Section
      id="certifications"
      eyebrow="07 · Certifications"
      title="Credentials"
      description="Formal training that backs the field experience."
    >
      <Stagger className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {certifications.map((c) => {
          const inner = (
            <>
              <div className="flex items-start justify-between gap-3">
                <Award className="h-5 w-5 shrink-0 text-emerald" aria-hidden="true" />
                {c.url && (
                  <ArrowUpRight
                    className="h-4 w-4 text-faint opacity-0 transition-opacity duration-200 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                )}
              </div>
              <h3 className="mt-3 flex-1 text-sm font-semibold leading-snug text-slate-100">
                {c.name}
              </h3>
              <p className="mt-2 text-xs text-muted">{c.organization}</p>
              <div className="mt-3 flex items-center justify-between border-t border-line pt-3 font-mono text-[11px] text-faint">
                <span>{c.credentialId}</span>
                <span>{c.date}</span>
              </div>
            </>
          );
          const cardClass =
            "group flex h-full flex-col rounded-card border border-line bg-surface p-5 shadow-card";

          return (
            <StaggerItem key={c.credentialId} className="h-full">
              {c.url ? (
                <a
                  href={c.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${cardClass} transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-hover`}
                >
                  {inner}
                </a>
              ) : (
                <div className={cardClass}>{inner}</div>
              )}
            </StaggerItem>
          );
        })}
      </Stagger>
    </Section>
  );
}
