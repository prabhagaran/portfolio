import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getAllPosts, getPost } from "@/lib/blog";
import { site } from "@/data/site";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: `${post.meta.title} · ${site.name}`,
    description: post.meta.excerpt,
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-24 pt-32">
      <Link
        href="/#blog"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors duration-200 hover:text-slate-100"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        All articles
      </Link>

      <header className="mt-8">
        <ul className="flex flex-wrap gap-1.5">
          {post.meta.categories.map((c) => (
            <li key={c}>
              <Badge tone="blue">{c}</Badge>
            </li>
          ))}
        </ul>
        <h1 className="mt-4 text-3xl font-semibold leading-tight tracking-tight text-slate-50 sm:text-4xl">
          {post.meta.title}
        </h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 font-mono text-xs text-faint">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            {formatDate(post.meta.date)}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {post.meta.readingTime}
          </span>
          <span>by {site.name}</span>
        </div>
      </header>

      <hr className="my-10 border-line" />

      <article className="prose-engineering">
        <MDXRemote source={post.content} />
      </article>

      <hr className="my-10 border-line" />
      <footer className="flex items-center justify-between">
        <Link
          href="/#blog"
          className="inline-flex items-center gap-2 text-sm text-muted transition-colors duration-200 hover:text-slate-100"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to all articles
        </Link>
        <a
          href={`mailto:${site.email}?subject=${encodeURIComponent(`Re: ${post.meta.title}`)}`}
          className="text-sm text-accent transition-colors duration-200 hover:text-blue-300"
        >
          Discuss via email →
        </a>
      </footer>
    </main>
  );
}
