export type ProjectStatus = "Production" | "Active" | "Prototype" | "Open Source";

export interface Project {
  slug: string;
  name: string;
  description: string;
  tags: string[];
  status: ProjectStatus;
  github?: string;
  demo?: string;
  docs?: string;
  /** Which generated schematic-style visual to render on the card */
  visual: "twin" | "rack" | "cell" | "calculator" | "incubator" | "can" | "dashboard";
}

export const projects: Project[] = [
  {
    slug: "battery-digital-twin",
    name: "Battery Digital Twin",
    description:
      "Physics-informed digital twin of a lithium-ion pack. Runs an equivalent-circuit model in real time against live telemetry to predict SoC drift, thermal behavior, and degradation.",
    tags: ["Python", "ECM Modeling", "MQTT", "TimescaleDB", "Grafana"],
    status: "Active",
    github: "https://github.com/prabhagaran/battery-digital-twin",
    docs: "/blog/soc-estimation-kalman",
    visual: "twin",
  },
  {
    slug: "battery-rack-monitoring",
    name: "Battery Rack Monitoring",
    description:
      "Rack-level BESS monitoring hardware: isolated voltage/temperature acquisition across 416 cells, CAN-FD backbone, and a hardened STM32 supervisor with hardware interlocks.",
    tags: ["STM32", "CAN-FD", "Altium", "Isolated ADC", "IEC 61508"],
    status: "Production",
    github: "https://github.com/prabhagaran/battery-rack-monitor",
    docs: "/blog/hv-pcb-creepage",
    visual: "rack",
  },
  {
    slug: "battery-cell-monitoring-board",
    name: "Battery Cell Monitoring Board",
    description:
      "16-cell monitoring PCB built around a battery monitor AFE with passive balancing, daisy-chained isoSPI, and ±2 mV measurement accuracy across the automotive temperature range.",
    tags: ["Altium", "AFE", "isoSPI", "Passive Balancing", "4-layer PCB"],
    status: "Production",
    github: "https://github.com/prabhagaran/cell-monitor-board",
    docs: "/blog/cell-balancing-strategies",
    visual: "cell",
  },
  {
    slug: "battery-pack-calculator",
    name: "Battery Pack Calculator",
    description:
      "Interactive tool for sizing series/parallel pack configurations — energy, C-rate, busbar current, cable gauge, and BMS channel count from a cell datasheet input.",
    tags: ["TypeScript", "Next.js", "React", "Engineering Tools"],
    status: "Open Source",
    github: "https://github.com/prabhagaran/battery-pack-calculator",
    visual: "calculator",
  },
  {
    slug: "open-source-incubator",
    name: "Open Source Incubator",
    description:
      "A curated launchpad for open hardware projects: reference schematics, firmware templates, and CI pipelines that take a board from idea to fab-ready release.",
    tags: ["KiCad", "GitHub Actions", "Firmware Templates", "Docs"],
    status: "Open Source",
    github: "https://github.com/prabhagaran/open-source-incubator",
    visual: "incubator",
  },
  {
    slug: "can-data-analyzer",
    name: "CAN Data Analyzer",
    description:
      "Desktop-grade CAN/CAN-FD analysis in the browser: DBC decoding, signal plotting, bus-load statistics, and anomaly flagging for multi-megabyte log files.",
    tags: ["Python", "DBC", "CAN-FD", "Signal Processing"],
    status: "Active",
    github: "https://github.com/prabhagaran/can-data-analyzer",
    docs: "/blog/can-bus-debugging",
    visual: "can",
  },
  {
    slug: "battery-testing-dashboard",
    name: "Battery Testing Dashboard",
    description:
      "Full-stack dashboard for cell cycling labs: live charge/discharge curves, capacity fade tracking, and automated test-report generation across parallel channels.",
    tags: ["Node.js", "Fastify", "PostgreSQL", "Redis", "Grafana"],
    status: "Prototype",
    github: "https://github.com/prabhagaran/battery-testing-dashboard",
    visual: "dashboard",
  },
];
