"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Download } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa6";
import { ButtonLink } from "@/components/ui/button";
import { CircuitBackground } from "@/components/circuit-background";
import { site } from "@/data/site";

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

export function Hero() {
  const reduce = useReducedMotion();
  const fadeUp = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: EASE },
  });

  return (
    <section
      id="top"
      className="relative flex min-h-[92vh] items-center overflow-hidden"
      aria-label="Introduction"
    >
      <CircuitBackground />
      <div className="relative mx-auto w-full max-w-6xl px-6 pb-24 pt-36">
        <motion.p
          {...fadeUp(0)}
          className="flex items-center gap-2.5 font-mono text-xs uppercase tracking-[0.2em] text-emerald"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald" />
          </span>
          Available for engineering roles
        </motion.p>

        <motion.h1
          {...fadeUp(0.08)}
          className="mt-6 text-5xl font-semibold leading-[1.05] tracking-tight text-slate-50 sm:text-6xl lg:text-7xl"
        >
          {site.name}
        </motion.h1>

        <motion.p
          {...fadeUp(0.16)}
          className="mt-4 text-xl font-medium tracking-tight text-accent sm:text-2xl"
        >
          {site.role}
        </motion.p>

        <motion.p
          {...fadeUp(0.24)}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-muted"
        >
          {site.tagline}
        </motion.p>

        <motion.div {...fadeUp(0.32)} className="mt-10 flex flex-wrap items-center gap-3">
          <ButtonLink href="/#projects" size="lg">
            View Projects
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </ButtonLink>
          <ButtonLink href={site.resumeUrl} download variant="secondary" size="lg">
            <Download className="h-4 w-4" aria-hidden="true" />
            Download Resume
          </ButtonLink>
          <ButtonLink
            href={site.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            size="lg"
            aria-label="GitHub profile"
          >
            <FaGithub className="h-4 w-4" aria-hidden="true" />
            GitHub
          </ButtonLink>
          <ButtonLink
            href={site.linkedinUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="outline"
            size="lg"
            aria-label="LinkedIn profile"
          >
            <FaLinkedin className="h-4 w-4" aria-hidden="true" />
            LinkedIn
          </ButtonLink>
        </motion.div>

        <motion.div
          {...fadeUp(0.44)}
          className="mt-16 flex flex-wrap gap-x-8 gap-y-2 font-mono text-xs text-faint"
        >
          <span>BMS · BESS</span>
          <span>Embedded Systems</span>
          <span>PCB Design</span>
        </motion.div>
      </div>
    </section>
  );
}
