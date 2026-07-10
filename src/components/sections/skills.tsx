"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Section } from "@/components/section";
import { Stagger, StaggerItem } from "@/components/motion";
import { skills } from "@/data/skills";

export function Skills() {
  const reduce = useReducedMotion();

  return (
    <Section
      id="skills"
      eyebrow="04 · Skills"
      title="Engineering competencies"
      description="Self-assessed against what production actually demands: boards that pass EMC, firmware that survives brownouts, and reports people can act on."
    >
      <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {skills.map((s) => (
          <StaggerItem key={s.name} className="h-full">
            <div className="flex h-full flex-col rounded-card border border-line bg-surface p-5 shadow-card transition-colors duration-200 hover:border-line-strong">
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-100">{s.name}</h3>
                <span className="font-mono text-xs tabular-nums text-accent">
                  {s.level}%
                </span>
              </div>
              <div
                className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2"
                role="meter"
                aria-valuenow={s.level}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${s.name} proficiency`}
              >
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-accent to-emerald"
                  initial={reduce ? { width: `${s.level}%` } : { width: 0 }}
                  whileInView={{ width: `${s.level}%` }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.9, ease: [0.21, 0.47, 0.32, 0.98] }}
                />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">{s.description}</p>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
