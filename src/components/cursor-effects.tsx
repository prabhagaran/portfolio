"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { solderSpark } from "@/lib/solder-spark";

/** 3D modes render their own scene/cursor — skip the spark trail there. */
const EXCLUDED_PREFIXES = ["/city", "/f1"];

export function CursorEffects() {
  const pathname = usePathname();
  const excluded = EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (excluded) return;

    const { destroy } = solderSpark();

    return () => destroy();
  }, [excluded]);

  return null;
}
