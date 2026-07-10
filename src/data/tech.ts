export type ExperienceLevel = "Expert" | "Advanced" | "Proficient" | "Familiar";

export interface TechItem {
  name: string;
  level: ExperienceLevel;
  years: string;
}

export interface TechCategory {
  name: string;
  icon: string; // lucide icon key resolved in the component
  items: TechItem[];
}

export const techStack: TechCategory[] = [
  {
    name: "Hardware",
    icon: "cpu",
    items: [
      { name: "STM32", level: "Expert", years: "5 yrs" },
      { name: "Infineon", level: "Advanced", years: "3 yrs" },
      { name: "ESP32", level: "Expert", years: "4 yrs" },
      { name: "Raspberry Pi", level: "Advanced", years: "4 yrs" },
      { name: "Analog Devices", level: "Advanced", years: "3 yrs" },
      { name: "NXP", level: "Proficient", years: "2 yrs" },
    ],
  },
  {
    name: "PCB",
    icon: "circuit",
    items: [
      { name: "Altium Designer", level: "Expert", years: "5 yrs" },
      { name: "KiCad", level: "Advanced", years: "3 yrs" },
      { name: "LTSpice", level: "Advanced", years: "4 yrs" },
    ],
  },
  {
    name: "Programming",
    icon: "code",
    items: [
      { name: "C", level: "Expert", years: "5 yrs" },
      { name: "Embedded C", level: "Expert", years: "5 yrs" },
      { name: "Python", level: "Advanced", years: "4 yrs" },
      { name: "TypeScript", level: "Proficient", years: "2 yrs" },
      { name: "JavaScript", level: "Proficient", years: "2 yrs" },
    ],
  },
  {
    name: "Backend",
    icon: "server",
    items: [
      { name: "Node.js", level: "Proficient", years: "2 yrs" },
      { name: "Fastify", level: "Proficient", years: "2 yrs" },
      { name: "Prisma", level: "Familiar", years: "1 yr" },
      { name: "PostgreSQL", level: "Proficient", years: "2 yrs" },
      { name: "Redis", level: "Familiar", years: "1 yr" },
    ],
  },
  {
    name: "Communication",
    icon: "network",
    items: [
      { name: "CAN", level: "Expert", years: "5 yrs" },
      { name: "Modbus", level: "Advanced", years: "3 yrs" },
      { name: "SPI", level: "Expert", years: "5 yrs" },
      { name: "UART", level: "Expert", years: "5 yrs" },
      { name: "I2C", level: "Expert", years: "5 yrs" },
      { name: "Ethernet", level: "Advanced", years: "3 yrs" },
      { name: "MQTT", level: "Advanced", years: "3 yrs" },
    ],
  },
  {
    name: "Cloud & Tooling",
    icon: "cloud",
    items: [
      { name: "Grafana", level: "Advanced", years: "3 yrs" },
      { name: "Docker", level: "Proficient", years: "2 yrs" },
      { name: "Vercel", level: "Proficient", years: "2 yrs" },
      { name: "GitHub Actions", level: "Advanced", years: "3 yrs" },
    ],
  },
];
