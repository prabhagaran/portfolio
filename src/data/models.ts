export interface Model3D {
  slug: string;
  name: string;
  description: string;
  /** Direct link to the .stl file — must be served with permissive CORS (e.g. raw.githubusercontent.com). */
  stlUrl: string;
  /** Where the file lives — repo, CAD gallery, etc. */
  sourceUrl?: string;
}

// Sample parametric parts, served locally from public/models/ (same-origin,
// so the CORS constraint above doesn't apply to these). Swap in real
// project CAD whenever it's ready — see stlUrl's CORS note.
export const models3d: Model3D[] = [
  {
    slug: "hex-standoff",
    name: "Hex Standoff",
    description: "Parametric M3-style PCB standoff — the hardware every board in Selected Work mounts on.",
    stlUrl: "/models/hex-standoff.stl",
  },
  {
    slug: "heatsink",
    name: "Finned Heatsink",
    description: "Base plate with an 8-fin array, sized like what sits on a power stage in a BMS/BESS design.",
    stlUrl: "/models/heatsink.stl",
  },
  {
    slug: "din-bracket",
    name: "DIN Rail Bracket",
    description: "L-profile extrusion for rail-mounting an enclosure — a common BESS cabinet detail.",
    stlUrl: "/models/din-bracket.stl",
  },
  {
    slug: "truck-tyre",
    name: "RC Truck Tyre",
    description: "65 mm tyre design 3D-printed for the RC Truck build.",
    stlUrl: "/models/truck-tyre.stl",
    sourceUrl: "https://github.com/prabhagaran/rc-receiver-arduino",
  },
];
