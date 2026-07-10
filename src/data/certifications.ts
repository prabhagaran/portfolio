export interface Certification {
  name: string;
  organization: string;
  credentialId: string;
  date: string;
  url?: string;
}

export const certifications: Certification[] = [
  {
    name: "Battery Technologies & Management Systems",
    organization: "Coursera · Arizona State University",
    credentialId: "CRSA-BTMS-2024",
    date: "Mar 2024",
  },
  {
    name: "Advanced PCB Design with Altium Designer",
    organization: "Altium Education",
    credentialId: "ALT-APD-1187",
    date: "Nov 2023",
  },
  {
    name: "Embedded Systems Essentials with ARM",
    organization: "edX · ARM Education",
    credentialId: "ARM-ESE-0842",
    date: "Jun 2023",
  },
  {
    name: "Functional Safety for Industrial Systems (IEC 61508)",
    organization: "TÜV Rheinland",
    credentialId: "TUV-FS-3391",
    date: "Feb 2024",
  },
  {
    name: "CAN & CAN-FD Protocol Fundamentals",
    organization: "Vector Academy",
    credentialId: "VEC-CAN-5520",
    date: "Aug 2022",
  },
  {
    name: "Python for Data Analysis",
    organization: "DataCamp",
    credentialId: "DC-PDA-77410",
    date: "Jan 2023",
  },
];
