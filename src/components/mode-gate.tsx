"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { FileText, Boxes, X } from "lucide-react";
import { getStoredMode, setStoredMode } from "@/lib/mode";

/**
 * First-visit entry choice between Classic and Electronic City.
 * - No auto-selection into 3D; no artificial delay.
 * - Persists via localStorage; `?mode=classic|city` overrides and re-saves.
 * - Returning visitors skip the prompt (city users are sent to /city).
 */
export function ModeGate() {
  const router = useRouter();
  const params = useSearchParams();
  const [showChoice, setShowChoice] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const urlMode = params.get("mode");
    const reason = params.get("reason");

    if (reason === "webgl") {
      setNotice("3D mode isn't supported on this device — here's the classic view.");
    } else if (reason === "perf") {
      setNotice("Switched to the classic view for smoother performance.");
    }

    if (urlMode === "classic") {
      setStoredMode("classic");
      return;
    }
    if (urlMode === "city") {
      setStoredMode("city");
      router.replace("/city");
      return;
    }

    const stored = getStoredMode();
    if (stored === "city" && !reason) {
      router.replace("/city");
      return;
    }
    if (stored === null) setShowChoice(true);
  }, [params, router]);

  function choose(mode: "classic" | "city") {
    setStoredMode(mode);
    setShowChoice(false);
    if (mode === "city") router.push("/city");
  }

  return (
    <>
      {notice && (
        <div
          role="status"
          className="fixed inset-x-0 top-16 z-40 mx-auto flex w-fit max-w-[90vw] items-center gap-3 rounded-full border border-line bg-surface px-4 py-2 text-sm text-slate-200 shadow-card"
        >
          {notice}
          <button
            type="button"
            aria-label="Dismiss notice"
            className="text-faint transition-colors duration-200 hover:text-slate-100"
            onClick={() => setNotice(null)}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {showChoice && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mode-choice-title"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-background/90 p-6 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full max-w-2xl"
          >
            <p className="text-center font-mono text-xs uppercase tracking-[0.2em] text-accent">
              Choose your experience
            </p>
            <h2
              id="mode-choice-title"
              className="mt-3 text-center text-2xl font-semibold tracking-tight text-slate-50"
            >
              How would you like to explore?
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => choose("classic")}
                className="group flex flex-col items-start rounded-card border border-line bg-surface p-6 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-hover"
              >
                <FileText className="h-6 w-6 text-accent" aria-hidden="true" />
                <span className="mt-4 text-base font-semibold text-slate-50">
                  Classic Portfolio
                </span>
                <span className="mt-1.5 text-sm leading-relaxed text-muted">
                  Fast, readable, works everywhere. Projects, experience, and
                  articles in a traditional layout.
                </span>
                <span className="mt-4 font-mono text-xs text-faint">
                  No WebGL · instant load
                </span>
              </button>
              <button
                type="button"
                onClick={() => choose("city")}
                className="group flex flex-col items-start rounded-card border border-line bg-surface p-6 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald/50 hover:shadow-card-hover"
              >
                <Boxes className="h-6 w-6 text-emerald" aria-hidden="true" />
                <span className="mt-4 text-base font-semibold text-slate-50">
                  Explore Electronic City
                </span>
                <span className="mt-1.5 text-sm leading-relaxed text-muted">
                  A 3D interactive city where each building is a project. Click
                  the streets to walk around.
                </span>
                <span className="mt-4 font-mono text-xs text-faint">
                  WebGL · ~mid-range device recommended
                </span>
              </button>
            </div>
            <p className="mt-6 text-center text-xs text-faint">
              You can switch modes anytime from the navigation bar.
            </p>
          </motion.div>
        </div>
      )}
    </>
  );
}
