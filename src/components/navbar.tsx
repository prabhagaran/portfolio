"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X, CircuitBoard } from "lucide-react";
import { cn } from "@/lib/utils";
import { site } from "@/data/site";

const links = [
  { href: "/#about", label: "About" },
  { href: "/#projects", label: "Projects" },
  { href: "/#stack", label: "Stack" },
  { href: "/#experience", label: "Experience" },
  { href: "/#workflow", label: "Workflow" },
  { href: "/#blog", label: "Blog" },
  { href: "/#contact", label: "Contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled || open
          ? "border-b border-line bg-background/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav
        className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6"
        aria-label="Main navigation"
      >
        <Link
          href="/#top"
          className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-slate-100"
          onClick={() => setOpen(false)}
        >
          <CircuitBoard className="h-5 w-5 text-accent" aria-hidden="true" />
          <span>{site.name}</span>
          <span className="hidden font-mono text-[11px] font-normal text-faint sm:inline">
            / hardware
          </span>
        </Link>

        <ul className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="rounded-md px-3 py-2 text-sm text-muted transition-colors duration-200 hover:text-slate-100"
              >
                {l.label}
              </Link>
            </li>
          ))}
          <li className="ml-2">
            <a
              href={site.resumeUrl}
              download
              className="inline-flex h-9 items-center rounded-[10px] border border-line px-4 text-sm font-medium text-slate-200 transition-colors duration-200 hover:border-accent/60 hover:text-white"
            >
              Resume
            </a>
          </li>
        </ul>

        <button
          type="button"
          className="rounded-md p-2 text-muted hover:text-slate-100 md:hidden"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="border-t border-line bg-background/95 px-6 py-4 backdrop-blur-md md:hidden">
          <ul className="flex flex-col gap-1">
            {links.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="block rounded-md px-3 py-2.5 text-sm text-slate-200 hover:bg-surface-2"
                  onClick={() => setOpen(false)}
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              <a
                href={site.resumeUrl}
                download
                className="block rounded-md px-3 py-2.5 text-sm font-medium text-accent hover:bg-surface-2"
              >
                Download Resume
              </a>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
