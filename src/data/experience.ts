export interface Experience {
  company: string;
  role: string;
  duration: string;
  location: string;
  achievements: string[];
  technologies: string[];
}

export const experience: Experience[] = [
  {
    company: "GridVolt Energy Systems",
    role: "Senior Hardware Design Engineer",
    duration: "2024 — Present",
    location: "Chennai, India",
    achievements: [
      "Own hardware architecture for a 1 MWh containerized BESS controller — cell sensing through cloud telemetry.",
      "Cut BMS board cost 23% through AFE consolidation and a DFM-driven relayout, with zero field returns to date.",
      "Introduced HIL regression rigs that reduced firmware validation cycles from 2 weeks to 3 days.",
    ],
    technologies: ["STM32H7", "CAN-FD", "Altium", "isoSPI", "MQTT", "Grafana"],
  },
  {
    company: "VoltCore Technologies",
    role: "Hardware Design Engineer",
    duration: "2022 — 2024",
    location: "Bengaluru, India",
    achievements: [
      "Designed rack-level monitoring hardware covering 416 cells per rack with isolated measurement chains.",
      "Led schematic and 6-layer PCB design for the master BMS: redundant MCUs, hardware interlocks, IEC 61508-informed safety paths.",
      "Brought up 5 board revisions to production; wrote EOL test procedures adopted across the product line.",
    ],
    technologies: ["STM32", "NXP", "Modbus", "KiCad", "LTSpice", "Python"],
  },
  {
    company: "Embedify Labs",
    role: "Embedded Systems Engineer",
    duration: "2021 — 2022",
    location: "Chennai, India",
    achievements: [
      "Shipped first production PCB — a multi-channel sensor interface for industrial condition monitoring.",
      "Built ESP32 firmware with OTA updates and MQTT telemetry deployed across 300+ field devices.",
      "Automated the production flashing/test station in Python, cutting per-unit test time by 60%.",
    ],
    technologies: ["ESP32", "Embedded C", "MQTT", "UART", "I2C", "Docker"],
  },
];
