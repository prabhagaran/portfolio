import type { Metadata } from "next";
import { F1Gate } from "@/components/f1/f1-gate";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: `F1 Track · ${site.name}`,
  description:
    "Drive an F1 car around a 3D circuit where each pit stop is a portfolio section.",
  // Classic mode is the crawlable source of truth; keep the 3D view out of the index.
  robots: { index: false, follow: true },
};

export default function F1Page() {
  return <F1Gate />;
}
