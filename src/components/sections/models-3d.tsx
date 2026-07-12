"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Box, X } from "lucide-react";
import { Section } from "@/components/section";
import { Stagger, StaggerItem } from "@/components/motion";
import { models3d } from "@/data/models";

const STLModelViewer = dynamic(
  () => import("@/components/stl-model-viewer").then((m) => m.STLModelViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex aspect-square w-full items-center justify-center rounded-card border border-line bg-background/60 sm:aspect-video">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-accent" />
      </div>
    ),
  }
);

export function Models3D() {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const active = models3d.find((m) => m.slug === openSlug);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpenSlug(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  if (models3d.length === 0) return null;

  return (
    <Section
      id="models"
      eyebrow="03 · 3D Design Files"
      title="CAD models"
      description="Interactive STL previews of the physical hardware — drag to orbit, scroll to zoom."
    >
      <Stagger className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {models3d.map((m) => (
          <StaggerItem key={m.slug} className="h-full">
            <article className="flex h-full flex-col rounded-card border border-line bg-surface p-5 shadow-card transition-colors duration-200 hover:border-line-strong">
              <Box className="h-5 w-5 text-accent" aria-hidden="true" />
              <h3 className="mt-3 text-base font-semibold tracking-tight text-slate-50">
                {m.name}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                {m.description}
              </p>
              <div className="mt-5 flex items-center gap-2 border-t border-line pt-4">
                <button
                  type="button"
                  onClick={() => setOpenSlug(m.slug)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-[8px] border border-accent/40 bg-accent-soft px-3 text-xs font-medium text-blue-300 transition-colors duration-200 hover:border-accent/70 hover:text-blue-200"
                >
                  <Box className="h-3.5 w-3.5" aria-hidden="true" />
                  View 3D Model
                </button>
                {m.sourceUrl && (
                  <a
                    href={m.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-[8px] px-3 text-xs font-medium text-muted transition-colors duration-200 hover:text-slate-100"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                    Source
                  </a>
                )}
              </div>
            </article>
          </StaggerItem>
        ))}
      </Stagger>

      <AnimatePresence>
        {active && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={active.name}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-background/90 p-6 backdrop-blur-sm"
            onClick={() => setOpenSlug(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold tracking-tight text-slate-50">
                  {active.name}
                </h3>
                <button
                  type="button"
                  onClick={() => setOpenSlug(null)}
                  aria-label="Close model viewer"
                  className="rounded-md p-1.5 text-muted transition-colors duration-200 hover:bg-surface-2 hover:text-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4">
                <STLModelViewer url={active.stlUrl} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </Section>
  );
}
