/**
 * Subtle animated PCB-trace background. Pure SVG/CSS — deterministic paths,
 * no runtime randomness, masked so it fades toward the edges.
 */
const TRACES = [
  "M -20 120 H 180 L 240 180 H 460 L 520 120 H 780",
  "M -20 260 H 120 L 200 340 H 520 L 600 260 H 900 L 960 320 H 1220",
  "M 60 -20 V 80 L 140 160 V 400 L 60 480 V 720",
  "M 1000 -20 V 140 L 920 220 V 460",
  "M 300 720 V 560 L 380 480 H 640 L 720 400 V 200",
  "M 1440 200 H 1240 L 1180 260 H 980",
  "M 1440 480 H 1300 L 1220 560 H 1000 L 940 620 H 700",
  "M 480 -20 V 60 L 560 140 H 840 L 900 80 V -20",
  "M 160 600 H 340 L 420 680 H 660",
  "M 1100 720 V 600 L 1160 540 H 1360",
];

const VIAS: Array<[number, number]> = [
  [180, 120], [460, 180], [780, 120], [120, 260], [600, 260], [960, 320],
  [140, 160], [920, 220], [380, 480], [720, 400], [1240, 200], [980, 260],
  [1300, 480], [700, 620], [560, 140], [900, 80], [340, 600], [660, 680],
  [1160, 540], [240, 180], [520, 120], [200, 340], [1220, 320],
];

// Traces that carry an animated "signal" pulse
const ACTIVE = [1, 4, 6];

export function CircuitBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
      style={{
        maskImage:
          "radial-gradient(ellipse 90% 80% at 50% 35%, black 30%, transparent 75%)",
        WebkitMaskImage:
          "radial-gradient(ellipse 90% 80% at 50% 35%, black 30%, transparent 75%)",
      }}
    >
      {/* fine grid */}
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(148,163,184,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.05) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 720"
        preserveAspectRatio="xMidYMid slice"
        fill="none"
      >
        {TRACES.map((d, i) => (
          <path
            key={i}
            d={d}
            stroke="rgba(148,163,184,0.10)"
            strokeWidth="1.5"
            strokeLinecap="square"
          />
        ))}
        {ACTIVE.map((i) => (
          <path
            key={`pulse-${i}`}
            d={TRACES[i]}
            stroke="rgba(59,130,246,0.35)"
            strokeWidth="1.5"
            strokeLinecap="square"
            strokeDasharray="6 18"
            className="animate-flow"
          />
        ))}
        {VIAS.map(([cx, cy], i) => (
          <circle
            key={i}
            cx={cx}
            cy={cy}
            r="3.5"
            fill="#0b0f14"
            stroke="rgba(148,163,184,0.18)"
            strokeWidth="1.5"
          />
        ))}
        {/* a few "powered" vias */}
        <circle cx={600} cy={260} r="3" fill="rgba(59,130,246,0.5)" className="animate-pulse-soft" />
        <circle cx={720} cy={400} r="3" fill="rgba(16,185,129,0.5)" className="animate-pulse-soft" />
        <circle cx={1220} cy={560} r="3" fill="rgba(59,130,246,0.5)" className="animate-pulse-soft" />
      </svg>
    </div>
  );
}
