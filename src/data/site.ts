/**
 * Central site configuration.
 * Update the values here — every section reads from this file.
 */
export const site = {
  name: "Prabhagaran Sundaralingam",
  role: "Hardware Design Engineer",
  tagline:
    "I design reliable hardware and embedded systems for Battery Energy Storage Systems, transforming engineering concepts into production-ready electronics.",
  location: "Chennai, India",
  email: "prabhasurya146@gmail.com",
  github: "prabhagaran",
  githubUrl: "https://github.com/prabhagaran",
  linkedinUrl: "https://www.linkedin.com/in/prabhagaran-sundaralingam",
  resumeUrl: "/resume.pdf",
  keywords: [
    "Battery Management Systems",
    "BESS",
    "Embedded Systems",
    "PCB Design",
    "Hardware Design Engineer",
  ],
};

export const stats = [
  { value: 7, suffix: "+", label: "Years Experience" },
  { value: 24, suffix: "+", label: "Projects Completed" },
  { value: 40, suffix: "+", label: "PCB Designs" },
  { value: 30, suffix: "+", label: "Technologies Used" },
];

export const philosophy = [
  {
    title: "Design for failure first",
    body: "Every cell, connector, and firmware path will eventually misbehave. I architect protection layers, watchdogs, and graceful degradation before the happy path.",
  },
  {
    title: "Measure, don't assume",
    body: "Scope traces beat intuition. Thermal images beat datasheet margins. Validation data drives every design revision I sign off on.",
  },
  {
    title: "Production is the finish line",
    body: "A prototype that works once is not a product. DFM, test coverage, traceability, and documentation are part of the design — not an afterthought.",
  },
];

export const careerTimeline = [
  {
    year: "2021",
    title: "Started in embedded hardware",
    detail: "First production PCB shipped — a sensor interface board for industrial monitoring.",
  },
  {
    year: "2022",
    title: "Moved into battery systems",
    detail: "Designed first BMS slave board: 16-cell monitoring with passive balancing.",
  },
  {
    year: "2023",
    title: "BESS at rack scale",
    detail: "Led hardware for a rack-level monitoring system — CAN backbone, isolated measurement, safety interlocks.",
  },
  {
    year: "2024",
    title: "System architecture",
    detail: "Owned architecture for a containerized BESS controller: from cell sensing to cloud telemetry.",
  },
  {
    year: "2025",
    title: "Digital twins & tooling",
    detail: "Building battery digital twins and internal engineering tools that shorten validation cycles.",
  },
];
