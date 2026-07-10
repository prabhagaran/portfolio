import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { BlogCategory, PostMeta } from "./blog-types";

export type { BlogCategory, PostMeta };

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

function toMeta(slug: string, data: Record<string, unknown>, content: string): PostMeta {
  const words = content.split(/\s+/).length;
  return {
    slug,
    title: data.title as string,
    excerpt: data.excerpt as string,
    date: data.date as string,
    readingTime: `${Math.max(1, Math.round(words / 220))} min read`,
    categories: (data.categories ?? []) as BlogCategory[],
  };
}

export function getAllPosts(): PostMeta[] {
  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx"));
  return files
    .map((file) => {
      const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
      const { data, content } = matter(raw);
      return toMeta(file.replace(/\.mdx$/, ""), data, content);
    })
    .sort((a, b) => +new Date(b.date) - +new Date(a.date));
}

export function getPost(slug: string) {
  const file = path.join(CONTENT_DIR, `${slug}.mdx`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf-8");
  const { data, content } = matter(raw);
  return { meta: toMeta(slug, data, content), content };
}
