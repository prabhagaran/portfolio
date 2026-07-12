export interface SkillEvidence {
  label: string;
  href: string;
}

export interface Skill {
  name: string;
  description: string;
  /** Projects/articles that demonstrate this skill — no self-assigned scores. */
  evidence: SkillEvidence[];
}

export const skills: Skill[] = [
  {
    name: "Hardware Design",
    description:
      "Mixed-signal board design from concept to production — power stages, sensing chains, protection circuits.",
    evidence: [
      { label: "Egg Incubator", href: "https://github.com/prabhagaran/egg-incubator-esp32-rtos" },
      { label: "RC Truck", href: "https://github.com/prabhagaran/rc-receiver-arduino" },
    ],
  },
  {
    name: "PCB Design",
    description:
      "Multi-layer layouts with controlled impedance, creepage/clearance for HV, EMC-driven stackups and routing.",
    evidence: [
      { label: "HV creepage article", href: "/blog/hv-pcb-creepage" },
    ],
  },
  {
    name: "Embedded Systems",
    description:
      "Bare-metal and RTOS firmware on ARM Cortex-M — drivers, bootloaders, fault handlers, OTA pipelines.",
    evidence: [
      { label: "Fault handling article", href: "/blog/firmware-fault-handling" },
      { label: "Egg Incubator", href: "https://github.com/prabhagaran/egg-incubator-esp32-rtos" },
    ],
  },
  {
    name: "Battery Management",
    description:
      "Cell monitoring AFEs, balancing strategies, SoC/SoH estimation, and safety architectures for Li-ion packs.",
    evidence: [
      { label: "Battery Digital Twin", href: "https://github.com/prabhagaran/battery-rack-digital-twin" },
      { label: "Cell balancing article", href: "/blog/cell-balancing-strategies" },
      { label: "SoC estimation article", href: "/blog/soc-estimation-kalman" },
    ],
  },
  {
    name: "Power Electronics",
    description:
      "DC-DC converters, gate-drive design, precharge circuits, and contactor control for high-voltage systems.",
    evidence: [
      { label: "Precharge design article", href: "/blog/precharge-circuit-design" },
    ],
  },
  {
    name: "System Architecture",
    description:
      "Partitioning cell-to-cloud systems: bus topologies, redundancy, isolation boundaries, failure domains.",
    evidence: [
      { label: "Invento", href: "https://github.com/prabhagaran/invento" },
      { label: "Battery Digital Twin", href: "https://github.com/prabhagaran/battery-rack-digital-twin" },
    ],
  },
  {
    name: "Debugging",
    description:
      "Oscilloscope, logic analyzer, thermal camera, CAN sniffer — root-causing issues across HW/FW boundaries.",
    evidence: [
      { label: "CAN debugging field guide", href: "/blog/can-bus-debugging" },
    ],
  },
  {
    name: "Python Automation",
    description:
      "Test-bench automation, HIL scripts, data pipelines, and report generation for validation campaigns.",
    evidence: [
      { label: "Modtool", href: "https://github.com/prabhagaran/modtool_py" },
      { label: "Invento", href: "https://github.com/prabhagaran/invento" },
    ],
  },
  {
    name: "Documentation",
    description:
      "Design review packages, test reports, interface control documents, and maintainable engineering wikis.",
    evidence: [
      { label: "Technical articles", href: "/#blog" },
    ],
  },
];
