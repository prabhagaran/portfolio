export interface Skill {
  name: string;
  level: number; // 0–100
  description: string;
}

export const skills: Skill[] = [
  {
    name: "Hardware Design",
    level: 92,
    description:
      "Mixed-signal board design from concept to production — power stages, sensing chains, protection circuits.",
  },
  {
    name: "PCB Design",
    level: 90,
    description:
      "Multi-layer layouts with controlled impedance, creepage/clearance for HV, EMC-driven stackups and routing.",
  },
  {
    name: "Embedded Systems",
    level: 88,
    description:
      "Bare-metal and RTOS firmware on ARM Cortex-M — drivers, bootloaders, fault handlers, OTA pipelines.",
  },
  {
    name: "Battery Management",
    level: 90,
    description:
      "Cell monitoring AFEs, balancing strategies, SoC/SoH estimation, and safety architectures for Li-ion packs.",
  },
  {
    name: "Power Electronics",
    level: 78,
    description:
      "DC-DC converters, gate-drive design, precharge circuits, and contactor control for high-voltage systems.",
  },
  {
    name: "System Architecture",
    level: 82,
    description:
      "Partitioning cell-to-cloud systems: bus topologies, redundancy, isolation boundaries, failure domains.",
  },
  {
    name: "Debugging",
    level: 94,
    description:
      "Oscilloscope, logic analyzer, thermal camera, CAN sniffer — root-causing issues across HW/FW boundaries.",
  },
  {
    name: "Python Automation",
    level: 80,
    description:
      "Test-bench automation, HIL scripts, data pipelines, and report generation for validation campaigns.",
  },
  {
    name: "Documentation",
    level: 85,
    description:
      "Design review packages, test reports, interface control documents, and maintainable engineering wikis.",
  },
];
