import { MapPin } from "lucide-react";
import { Section } from "@/components/section";
import { Reveal } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { experience } from "@/data/experience";

export function ExperienceSection() {
  return (
    <Section
      id="experience"
      eyebrow="06 · Experience"
      title="Where I've built"
      description="Production hardware shipped, teams supported, and systems still running in the field."
    >
      <ol className="relative space-y-10 border-l border-line pl-8 sm:pl-10">
        {experience.map((job, i) => (
          <Reveal as="li" key={job.company} delay={i * 0.06}>
            <div className="relative">
              <span
                className="absolute -left-[41px] top-2 h-3 w-3 rounded-full border-2 border-accent bg-background sm:-left-[49px]"
                aria-hidden="true"
              />
              <div className="rounded-card border border-line bg-surface p-6 shadow-card transition-colors duration-200 hover:border-line-strong">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-slate-50">
                      {job.role}
                    </h3>
                    <p className="mt-0.5 text-sm font-medium text-accent">{job.company}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-xs text-slate-300">{job.duration}</p>
                    <p className="mt-0.5 flex items-center justify-end gap-1 text-xs text-faint">
                      <MapPin className="h-3 w-3" aria-hidden="true" />
                      {job.location}
                    </p>
                  </div>
                </div>
                <ul className="mt-4 space-y-2">
                  {job.achievements.map((a) => (
                    <li key={a} className="flex gap-2.5 text-sm leading-relaxed text-muted">
                      <span className="mt-[9px] h-1 w-3 shrink-0 rounded-full bg-emerald/60" aria-hidden="true" />
                      {a}
                    </li>
                  ))}
                </ul>
                <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="Technologies used">
                  {job.technologies.map((t) => (
                    <li key={t}>
                      <Badge>{t}</Badge>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        ))}
      </ol>
    </Section>
  );
}
