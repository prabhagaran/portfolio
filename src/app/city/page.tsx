import type { Metadata } from "next";
import { CityGate } from "@/components/city/city-gate";
import { site } from "@/data/site";

export const metadata: Metadata = {
  title: `Electronic City · ${site.name}`,
  description:
    "Explore an interactive 3D city where every building is an engineering project.",
  // Classic mode is the crawlable source of truth; keep the 3D view out of the index.
  robots: { index: false, follow: true },
};

export default function CityPage() {
  return <CityGate />;
}
