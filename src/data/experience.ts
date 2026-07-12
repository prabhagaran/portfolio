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
    company: "Igraph Technologies Pvt. Ltd",
    role: "Hardware Engineer",
    duration: "Sep 2023 — Present",
    location: "Kollapally, India",
    achievements: [
      "Led hardware design for advanced electronic products, specializing in multilayer and high-speed PCB layouts for Battery Management Systems (BMS) and Hardware-in-the-Loop (HIL) systems.",
      "Designed, maintained, and updated PCB documentation — Gerber files and assembly drawings — supporting fabrication and assembly.",
      "Managed end-to-end product development from initial concept through production, owning technical delivery and timelines.",
      "Planned and maintained detailed Bills of Materials (BOM) across all hardware projects, optimizing cost and component sourcing.",
    ],
    technologies: ["STM32", "Altium Designer", "CAN", "EtherCAT", "BMS", "HIL"],
  },
  {
    company: "Vingyan Innovations Pvt. Ltd",
    role: "Research Engineer",
    duration: "Oct 2018 — Sep 2023",
    location: "Chennai, India",
    achievements: [
      "Spearheaded R&D and embedded development projects — quick-turnaround lab prototypes and proof-of-concepts.",
      "Developed cost-effective methods to automate hardware testing, improving test efficiency.",
      "Developed sample code and reusable software libraries adopted across projects.",
      "Managed PCB documentation, including fabrication drawings, assembly drawings, and Gerber files.",
    ],
    technologies: ["C", "C++", "STM32", "AVR", "KiCad", "Python"],
  },
];
