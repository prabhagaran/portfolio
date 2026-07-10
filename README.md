# Engineering Portfolio

Premium portfolio site for a Hardware Design Engineer (BMS / BESS / Embedded / PCB).
Built with Next.js 16, TypeScript, Tailwind CSS 4, and Framer Motion. Fully static output.

## Run

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build (fully static)
npm start       # serve the production build
```

## Where to edit content

All copy lives in data files — no component edits needed:

| File | Contents |
| --- | --- |
| `src/data/site.ts` | Name, role, tagline, email, GitHub/LinkedIn URLs, stats, philosophy, career timeline |
| `src/data/projects.ts` | Featured project cards (tags, links, status badge, visual variant) |
| `src/data/tech.ts` | Tech stack grid with experience levels (revealed on hover) |
| `src/data/skills.ts` | Skill bars with descriptions |
| `src/data/experience.ts` | Work history timeline |
| `src/data/certifications.ts` | Certification grid |
| `content/blog/*.mdx` | Technical articles (frontmatter: title, excerpt, date, categories) |
| `public/resume.pdf` | **Placeholder — replace with your real resume** |

The GitHub section (`src/components/sections/github.tsx`) fetches live data for the
username in `site.ts` from the GitHub REST API and the jogruber contributions API,
with graceful fallbacks when offline or rate-limited.

## Design system

Design tokens are defined in `src/app/globals.css` under `@theme`:
background `#0B0F14`, surface `#121821`, accent `#3B82F6` (electric blue),
secondary `#10B981` (emerald), 10–12 px radii, soft shadows, 200–300 ms transitions.
Section shells, motion primitives (`Reveal`, `Stagger`), and UI primitives
(`Button`, `Badge`) live in `src/components/`.

## Blog

Add an article by dropping a new `.mdx` file into `content/blog/`:

```mdx
---
title: "Article title"
excerpt: "One-sentence summary shown on the card."
date: "2026-07-01"
categories: ["BMS", "Embedded"]
---

Markdown/MDX content…
```

Categories must be one of: BMS, PCB, Embedded, Battery, Power Electronics, CAN
(see `src/lib/blog-types.ts` to extend). Pages are statically generated at build time.
