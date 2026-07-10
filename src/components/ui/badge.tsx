import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Tone = "neutral" | "blue" | "emerald" | "amber";

const tones: Record<Tone, string> = {
  neutral: "border-line bg-surface-2 text-muted",
  blue: "border-accent/30 bg-accent-soft text-blue-300",
  emerald: "border-emerald/30 bg-emerald-soft text-emerald-300",
  amber: "border-amber-400/30 bg-amber-400/10 text-amber-300",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px] leading-5 tracking-wide",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
