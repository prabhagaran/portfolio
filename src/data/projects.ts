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
  visual: "twin" | "rack" | "incubator" | "can" | "dashboard" | "rc" | "modbus";
}

export const projects: Project[] = [
  {
    slug: "battery-digital-twin",
    name: "Battery Digital Twin",
    description:
      "Physics-informed digital twin of a lithium-ion pack. Runs an equivalent-circuit model in real time against live telemetry to predict SoC drift, thermal behavior, and degradation.",
    tags: ["Python", "ECM Modeling", "MQTT", "TimescaleDB", "Grafana"],
    status: "Active",
    github: "https://github.com/prabhagaran/battery-rack-digital-twin",
    docs: "/blog/soc-estimation-kalman",
    visual: "twin",
  },
  {
    slug: "invento",
    name: "Invento",
    description:
      "BESS simulation tool for modeling rack-level battery behavior — configurable pack topology, load profiles, and electrical/thermal simulation for validating a design before hardware exists.",
    tags: ["Python", "Simulation", "BESS", "Modeling"],
    status: "Active",
    github: "https://github.com/prabhagaran/invento",
    visual: "rack",
  },
  {
    slug: "egg-incubator",
    name: "Egg Incubator",
    description:
      "ESP32 + FreeRTOS controlled egg incubator: closed-loop temperature and humidity regulation, automatic egg turning, and a task-based RTOS architecture for reliable multi-day operation.",
    tags: ["ESP32", "FreeRTOS", "Embedded C", "PID Control"],
    status: "Prototype",
    github: "https://github.com/prabhagaran/egg-incubator-esp32-rtos",
    visual: "incubator",
  },
  {
    slug: "rc-truck",
    name: "RC Truck",
    description:
      "Arduino-based RC receiver for a hobby truck build — PWM channel decoding, failsafe on signal loss, and throttle/steering mixing driving the motor and servo outputs.",
    tags: ["Arduino", "RC", "PWM", "Embedded C"],
    status: "Prototype",
    github: "https://github.com/prabhagaran/rc-receiver-arduino",
    visual: "rc",
  },
  {
    slug: "modtool",
    name: "Modtool",
    description:
      "Command-line tool for reading and writing Modbus registers — a lightweight utility for debugging and commissioning Modbus RTU/TCP devices in the field.",
    tags: ["Python", "Modbus", "RTU/TCP", "CLI Tool"],
    status: "Open Source",
    github: "https://github.com/prabhagaran/modtool_py",
    visual: "modbus",
  },
];
