import type { Project } from "@/data/projects";

const BLUE = "#3b82f6";
const GREEN = "#10b981";
const LINE = "rgba(148,163,184,0.25)";
const DIM = "rgba(148,163,184,0.12)";

/**
 * Deterministic schematic-style line art for each project card —
 * no raster images, everything renders crisp at any size.
 */
export function ProjectVisual({ variant }: { variant: Project["visual"] }) {
  return (
    <svg
      viewBox="0 0 400 200"
      className="h-full w-full"
      role="img"
      aria-hidden="true"
      fill="none"
    >
      <rect width="400" height="200" fill="transparent" />
      {/* dot grid */}
      <defs>
        <pattern id={`grid-${variant}`} width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill={DIM} />
        </pattern>
      </defs>
      <rect width="400" height="200" fill={`url(#grid-${variant})`} />
      {visuals[variant]}
    </svg>
  );
}

const visuals: Record<Project["visual"], React.ReactNode> = {
  // Battery + mirrored wireframe model
  twin: (
    <g strokeWidth="1.5">
      <rect x="60" y="70" width="90" height="60" rx="6" stroke={BLUE} />
      <rect x="150" y="88" width="8" height="24" rx="2" stroke={BLUE} />
      <line x1="78" y1="70" x2="78" y2="130" stroke={LINE} />
      <line x1="96" y1="70" x2="96" y2="130" stroke={LINE} />
      <line x1="114" y1="70" x2="114" y2="130" stroke={LINE} />
      <line x1="132" y1="70" x2="132" y2="130" stroke={LINE} />
      <path d="M 170 100 H 220" stroke={GREEN} strokeDasharray="4 4" />
      <path d="M 195 88 L 205 100 L 195 112" stroke={GREEN} />
      <rect x="240" y="70" width="90" height="60" rx="6" stroke={LINE} strokeDasharray="5 4" />
      <line x1="258" y1="70" x2="258" y2="130" stroke={DIM} />
      <line x1="276" y1="70" x2="276" y2="130" stroke={DIM} />
      <line x1="294" y1="70" x2="294" y2="130" stroke={DIM} />
      <line x1="312" y1="70" x2="312" y2="130" stroke={DIM} />
      <path d="M 240 50 Q 285 30 330 50" stroke={GREEN} strokeDasharray="3 5" />
      <circle cx="285" cy="36" r="3" fill={GREEN} />
      <text x="60" y="160" fill={LINE} fontSize="10" fontFamily="monospace">PHYSICAL</text>
      <text x="240" y="160" fill={GREEN} fontSize="10" fontFamily="monospace" opacity="0.7">MODEL</text>
    </g>
  ),
  // Rack of modules with CAN bus spine
  rack: (
    <g strokeWidth="1.5">
      {[0, 1, 2, 3].map((r) => (
        <g key={r}>
          <rect x="90" y={38 + r * 34} width="160" height="24" rx="4" stroke={LINE} />
          <circle cx="104" cy={50 + r * 34} r="3" stroke={r === 2 ? GREEN : BLUE} fill="none" />
          <line x1="118" y1={50 + r * 34} x2="200" y2={50 + r * 34} stroke={DIM} />
          <line x1="250" y1={50 + r * 34} x2="290" y2={50 + r * 34} stroke={BLUE} />
        </g>
      ))}
      <line x1="290" y1="50" x2="290" y2="152" stroke={BLUE} />
      <rect x="290" y="86" width="52" height="28" rx="4" stroke={GREEN} transform="translate(14 0)" />
      <line x1="290" y1="100" x2="304" y2="100" stroke={BLUE} />
      <text x="310" y="104" fill={GREEN} fontSize="9" fontFamily="monospace">CAN</text>
      <text x="90" y="180" fill={LINE} fontSize="10" fontFamily="monospace">RACK 416S</text>
    </g>
  ),
  // Cell symbols into an AFE chip
  cell: (
    <g strokeWidth="1.5">
      {[0, 1, 2, 3].map((i) => (
        <g key={i} transform={`translate(70, ${45 + i * 30})`}>
          <line x1="0" y1="0" x2="0" y2="16" stroke={BLUE} />
          <line x1="-8" y1="16" x2="8" y2="16" stroke={BLUE} />
          <line x1="-4" y1="22" x2="4" y2="22" stroke={BLUE} />
          <line x1="0" y1="22" x2="0" y2="30" stroke={BLUE} opacity={i === 3 ? 0 : 1} />
          <line x1="8" y1="8" x2="60" y2="8" stroke={LINE} />
        </g>
      ))}
      <rect x="150" y="50" width="80" height="100" rx="6" stroke={GREEN} />
      <text x="163" y="105" fill={GREEN} fontSize="10" fontFamily="monospace">AFE</text>
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="230" y1={62 + i * 18} x2="260" y2={62 + i * 18} stroke={LINE} />
      ))}
      <path d="M 260 62 H 290 V 134 H 260" stroke={BLUE} />
      <text x="268" y="102" fill={BLUE} fontSize="9" fontFamily="monospace">isoSPI</text>
      <text x="70" y="180" fill={LINE} fontSize="10" fontFamily="monospace">16S MONITOR</text>
    </g>
  ),
  // Series/parallel grid with sum
  calculator: (
    <g strokeWidth="1.5">
      {[0, 1, 2].map((row) =>
        [0, 1, 2, 3].map((col) => (
          <rect
            key={`${row}-${col}`}
            x={70 + col * 44}
            y={45 + row * 36}
            width="30"
            height="22"
            rx="3"
            stroke={row === 1 && col === 2 ? GREEN : LINE}
          />
        ))
      )}
      <line x1="100" y1="56" x2="114" y2="56" stroke={DIM} />
      <line x1="144" y1="56" x2="158" y2="56" stroke={DIM} />
      <line x1="188" y1="56" x2="202" y2="56" stroke={DIM} />
      <path d="M 260 70 V 140 " stroke={DIM} />
      <text x="285" y="70" fill={BLUE} fontSize="11" fontFamily="monospace">4S3P</text>
      <text x="285" y="92" fill={LINE} fontSize="10" fontFamily="monospace">14.8 V</text>
      <text x="285" y="112" fill={LINE} fontSize="10" fontFamily="monospace">15 Ah</text>
      <text x="285" y="132" fill={GREEN} fontSize="10" fontFamily="monospace">222 Wh</text>
      <text x="70" y="180" fill={LINE} fontSize="10" fontFamily="monospace">PACK CONFIG</text>
    </g>
  ),
  // Branching commits into a board outline
  incubator: (
    <g strokeWidth="1.5">
      <path d="M 60 100 H 140" stroke={LINE} />
      <path d="M 100 100 Q 120 100 120 80 Q 120 60 140 60 H 180" stroke={BLUE} />
      <path d="M 100 100 Q 120 100 120 120 Q 120 140 140 140 H 180" stroke={GREEN} />
      <circle cx="60" cy="100" r="4" stroke={LINE} />
      <circle cx="100" cy="100" r="4" stroke={LINE} />
      <circle cx="180" cy="60" r="4" stroke={BLUE} />
      <circle cx="180" cy="140" r="4" stroke={GREEN} />
      <rect x="230" y="55" width="110" height="90" rx="8" stroke={BLUE} />
      <circle cx="245" cy="70" r="3" stroke={LINE} />
      <circle cx="325" cy="70" r="3" stroke={LINE} />
      <circle cx="245" cy="130" r="3" stroke={LINE} />
      <circle cx="325" cy="130" r="3" stroke={LINE} />
      <rect x="262" y="82" width="36" height="36" rx="2" stroke={GREEN} />
      <path d="M 200 60 H 230 M 200 140 H 230" stroke={DIM} />
      <text x="60" y="180" fill={LINE} fontSize="10" fontFamily="monospace">IDEA → FAB</text>
    </g>
  ),
  // Differential bus with frames
  can: (
    <g strokeWidth="1.5">
      <path d="M 50 80 H 120 V 60 H 180 V 80 H 230 V 60 H 270 V 80 H 350" stroke={BLUE} />
      <path d="M 50 110 H 120 V 130 H 180 V 110 H 230 V 130 H 270 V 110 H 350" stroke={GREEN} />
      <text x="52" y="70" fill={BLUE} fontSize="9" fontFamily="monospace">CAN_H</text>
      <text x="52" y="146" fill={GREEN} fontSize="9" fontFamily="monospace">CAN_L</text>
      <rect x="120" y="155" width="60" height="16" rx="3" stroke={LINE} />
      <rect x="230" y="155" width="40" height="16" rx="3" stroke={LINE} />
      <text x="128" y="167" fill={LINE} fontSize="8" fontFamily="monospace">0x18FF</text>
      <line x1="120" y1="130" x2="120" y2="155" stroke={DIM} strokeDasharray="3 3" />
      <line x1="230" y1="130" x2="230" y2="155" stroke={DIM} strokeDasharray="3 3" />
      <text x="50" y="40" fill={LINE} fontSize="10" fontFamily="monospace">500 kbit/s · 42% LOAD</text>
    </g>
  ),
  // Charge/discharge curves on axes
  dashboard: (
    <g strokeWidth="1.5">
      <path d="M 60 40 V 150 H 340" stroke={LINE} />
      <path d="M 60 130 Q 120 60 200 55 T 340 48" stroke={BLUE} />
      <path d="M 60 60 Q 140 130 220 138 T 340 145" stroke={GREEN} strokeDasharray="5 4" />
      {[100, 160, 220, 280].map((x) => (
        <line key={x} x1={x} y1="147" x2={x} y2="153" stroke={LINE} />
      ))}
      <circle cx="200" cy="55" r="3" fill={BLUE} />
      <text x="208" y="50" fill={BLUE} fontSize="9" fontFamily="monospace">4.12 V</text>
      <text x="60" y="175" fill={LINE} fontSize="10" fontFamily="monospace">CYCLE 412 · CH 3/8</text>
    </g>
  ),
};
