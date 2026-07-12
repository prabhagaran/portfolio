"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Clock } from "lucide-react";
import { Section } from "@/components/section";
import { Badge } from "@/components/ui/badge";
import { blogCategories, type BlogCategory, type PostMeta } from "@/lib/blog-types";
import { cn } from "@/lib/utils";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function Blog({ posts }: { posts: PostMeta[] }) {
  const [filter, setFilter] = useState<BlogCategory | "All">("All");
  const reduce = useReducedMotion();

  const visible =
    filter === "All" ? posts : posts.filter((p) => p.categories.includes(filter));

  return (
    <Section
      id="blog"
      eyebrow="10 · Technical Articles"
      title="Engineering notes"
      description="Writing about the problems I actually debug — battery systems, board design, and the firmware in between."
    >
      {/* Filters */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter articles by topic">
        {(["All", ...blogCategories] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setFilter(cat)}
            aria-pressed={filter === cat}
            className={cn(
              "h-8 rounded-full border px-3.5 font-mono text-xs transition-all duration-200",
              filter === cat
                ? "border-accent/60 bg-accent-soft text-blue-300"
                : "border-line text-muted hover:border-line-strong hover:text-slate-200"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {visible.map((post) => (
            <motion.div
              key={post.slug}
              layout={!reduce}
              initial={reduce ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="h-full"
            >
              <Link
                href={`/blog/${post.slug}`}
                className="group flex h-full flex-col rounded-card border border-line bg-surface p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-card-hover"
              >
                <div className="flex items-center justify-between gap-2 font-mono text-xs text-faint">
                  <span>{formatDate(post.date)}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" aria-hidden="true" />
                    {post.readingTime}
                  </span>
                </div>
                <h3 className="mt-3 text-base font-semibold leading-snug tracking-tight text-slate-50 transition-colors duration-200 group-hover:text-blue-200">
                  {post.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
                  {post.excerpt}
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                  <ul className="flex flex-wrap gap-1.5">
                    {post.categories.slice(0, 3).map((c) => (
                      <li key={c}>
                        <Badge>{c}</Badge>
                      </li>
                    ))}
                  </ul>
                  <ArrowUpRight
                    className="h-4 w-4 shrink-0 text-faint transition-all duration-200 group-hover:translate-x-0.5 group-hover:text-accent"
                    aria-hidden="true"
                  />
                </div>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {visible.length === 0 && (
        <p className="mt-8 rounded-card border border-dashed border-line p-8 text-center text-sm text-muted">
          No articles in this category yet.
        </p>
      )}
    </Section>
  );
}
