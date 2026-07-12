"use client";

import { useState, type FormEvent } from "react";
import { Mail, MapPin, Download, Send } from "lucide-react";
import { FaGithub, FaLinkedin } from "react-icons/fa6";
import { Section } from "@/components/section";
import { Reveal } from "@/components/motion";
import { Button } from "@/components/ui/button";
import { site } from "@/data/site";

const channels = [
  {
    label: "Email",
    value: site.email,
    href: `mailto:${site.email}`,
    icon: <Mail className="h-4 w-4" aria-hidden="true" />,
  },
  {
    label: "GitHub",
    value: `@${site.github}`,
    href: site.githubUrl,
    icon: <FaGithub className="h-4 w-4" aria-hidden="true" />,
  },
  {
    label: "LinkedIn",
    value: "Connect on LinkedIn",
    href: site.linkedinUrl,
    icon: <FaLinkedin className="h-4 w-4" aria-hidden="true" />,
  },
  {
    label: "Resume",
    value: "Download PDF",
    href: site.resumeUrl,
    icon: <Download className="h-4 w-4" aria-hidden="true" />,
  },
];

const inputStyles =
  "w-full rounded-[10px] border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-slate-100 " +
  "placeholder:text-faint transition-colors duration-200 " +
  "hover:border-line-strong focus:border-accent/70 focus:outline-none";

export function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  // No backend — compose a prefilled email in the visitor's mail client.
  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Portfolio contact from ${name}`);
    const body = encodeURIComponent(`${message}\n\n— ${name} (${email})`);
    window.location.href = `mailto:${site.email}?subject=${subject}&body=${body}`;
  }

  return (
    <Section
      id="contact"
      eyebrow="11 · Contact"
      title="Let's build something reliable"
      description="Open to hardware design, BMS/BESS, and embedded systems roles — or a conversation about a hard battery problem."
    >
      <div className="grid gap-8 lg:grid-cols-5">
        {/* Form */}
        <Reveal className="lg:col-span-3">
          <form
            onSubmit={handleSubmit}
            className="rounded-card border border-line bg-surface p-6 shadow-card"
            aria-label="Contact form"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-name" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Name
                </label>
                <input
                  id="contact-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputStyles}
                  placeholder="Jane Engineer"
                  autoComplete="name"
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="mb-1.5 block text-xs font-medium text-slate-300">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputStyles}
                  placeholder="jane@company.com"
                  autoComplete="email"
                />
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="contact-message" className="mb-1.5 block text-xs font-medium text-slate-300">
                Message
              </label>
              <textarea
                id="contact-message"
                required
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={inputStyles}
                placeholder="Tell me about the system you're building…"
              />
            </div>
            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="text-xs text-faint">Opens your email client — no data stored.</p>
              <Button type="submit">
                <Send className="h-4 w-4" aria-hidden="true" />
                Send Message
              </Button>
            </div>
          </form>
        </Reveal>

        {/* Channels */}
        <Reveal delay={0.1} className="lg:col-span-2">
          <div className="flex h-full flex-col gap-3">
            {channels.map((c) => (
              <a
                key={c.label}
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                download={c.label === "Resume" || undefined}
                className="flex items-center gap-4 rounded-card border border-line bg-surface p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-line-strong"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-surface-2 text-accent">
                  {c.icon}
                </span>
                <span>
                  <span className="block text-xs text-faint">{c.label}</span>
                  <span className="block text-sm font-medium text-slate-200">{c.value}</span>
                </span>
              </a>
            ))}
            <div className="flex items-center gap-4 rounded-card border border-line bg-surface p-4 shadow-card">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-surface-2 text-emerald">
                <MapPin className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>
                <span className="block text-xs text-faint">Location</span>
                <span className="block text-sm font-medium text-slate-200">
                  {site.location} · Open to relocation
                </span>
              </span>
            </div>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}
