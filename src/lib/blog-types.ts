export type BlogCategory =
  | "BMS"
  | "PCB"
  | "Embedded"
  | "Battery"
  | "Power Electronics"
  | "CAN";

export const blogCategories: BlogCategory[] = [
  "BMS",
  "PCB",
  "Embedded",
  "Battery",
  "Power Electronics",
  "CAN",
];

export interface PostMeta {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readingTime: string;
  categories: BlogCategory[];
}
