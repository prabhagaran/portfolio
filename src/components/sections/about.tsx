"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";
import { Section } from "@/components/section";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { stats, philosophy, careerTimeline } from "@/data/site";

function CountUp({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const duration = 1100;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {reduce ? value : display}
      {suffix}
    </span>
  );
}

export function About() {
  return (
    <Section
      id="about"
      eyebrow="01 · About"
      title="Engineering, end to end"
      description="From the first requirement to the last unit off the line — I own the full lifecycle of battery and embedded hardware."
    >
      <div className="grid gap-12 lg:grid-cols-5">
        {/* Summary + philosophy */}
        <div className="space-y-10 lg:col-span-3">
          <Reveal>
            <div className="space-y-4 text-base leading-relaxed text-muted">
              <p>
                I&apos;m a hardware design engineer focused on{" "}
                <strong className="font-medium text-slate-200">
                  Battery Management Systems
                </strong>{" "}
                and{" "}
                <strong className="font-medium text-slate-200">
                  Battery Energy Storage Systems
                </strong>
                . My work spans the whole stack of a battery product: analog
                front-ends that read cells to the millivolt, firmware that never
                loses a fault, and the CAN and cloud plumbing that turns raw
                telemetry into engineering decisions.
              </p>
              <p>
                I&apos;ve taken boards from a blank schematic sheet through EMC
                pre-compliance, safety reviews, and production test — and I care as
                much about the documentation package as the copper.
              </p>
            </div>
          </Reveal>

          <div>
            <Reveal>
              <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-faint">
                Core engineering philosophy
              </h3>
            </Reveal>
            <Stagger className="mt-5 space-y-4">
              {philosophy.map((p) => (
                <StaggerItem key={p.title}>
                  <div className="rounded-card border border-line bg-surface p-5 transition-colors duration-200 hover:border-line-strong">
                    <h4 className="font-medium text-slate-100">{p.title}</h4>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.body}</p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        </div>

        {/* Timeline + stats */}
        <div className="space-y-10 lg:col-span-2">
          <div>
            <Reveal>
              <h3 className="font-mono text-xs uppercase tracking-[0.2em] text-faint">
                Career timeline
              </h3>
            </Reveal>
            <ol className="relative mt-5 space-y-6 border-l border-line pl-6">
              {careerTimeline.map((item, i) => (
                <Reveal as="li" key={item.year} delay={i * 0.05}>
                  <div className="relative">
                    <span
                      className="absolute -left-[30.5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-accent bg-background"
                      aria-hidden="true"
                    />
                    <p className="font-mono text-xs text-accent">{item.year}</p>
                    <p className="mt-1 text-sm font-medium text-slate-100">{item.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{item.detail}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
          </div>

          <Stagger className="grid grid-cols-2 gap-4">
            {stats.map((s) => (
              <StaggerItem key={s.label}>
                <div className="rounded-card border border-line bg-surface p-5 text-center shadow-card">
                  <p className="text-3xl font-semibold tracking-tight text-slate-50">
                    <CountUp value={s.value} suffix={s.suffix} />
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{s.label}</p>
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </div>
    </Section>
  );
}
