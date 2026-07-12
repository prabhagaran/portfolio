---
name: verify
description: Build, launch and drive this portfolio app (classic + /city + /f1 3D modes) to verify changes at the browser surface.
---

# Verifying this repo

## Build & launch

```bash
npx next build            # from repo root; TS errors surface here
npx next start -p 3211    # run in background; kill port holder first (see gotchas)
npx eslint src            # lint; react-hooks carve-outs for 3D code live in eslint.config.mjs
```

## Drive (browser surface)

Playwright (npm-installed in a scratch dir, **no browser download needed**) with
`chromium.launch({ channel: "msedge", headless: true, args: ["--enable-unsafe-swiftshader"] })`
renders WebGL fine headless on this machine.

- Fresh context = fresh localStorage → the three-way mode gate appears on `/`.
  Click cards via `[role="dialog"] button:has-text("F1 Track")` — a bare
  `text=` selector hits the identical navbar link behind the modal.
- `/f1` HUD state is observable from the DOM without touching React:
  - speed: `span.text-3xl` (rAF-updated text)
  - car + pit world coordinates: the minimap SVG circles' `cx`/`cy` ARE world
    coords (last circle = car; pit dots are colored by section accent).
- The car can be auto-driven into a pit ring with a bang-bang controller:
  poll the minimap dot, steer with timed ArrowLeft/ArrowRight key bursts
  proportional to the velocity→target angle, throttle/brake to keep the map-dot
  speed ~1–3 units/tick, slower near the target. Reaches a pit in ~6–10s.
  A working script from the first verification: scratchpad `f1-verify.mjs`
  (session-local; recreate from this recipe if gone).
- Pit panel assertion: `[role="dialog"][aria-label="Projects"]` etc.
- Mode persistence probe: after choosing a 3D mode, `goto /` should redirect
  to `/city` or `/f1`; `/?mode=classic&reason=webgl` shows the fallback notice.

## Gotchas

- **Windows: TaskStop on the background `next start` shell does NOT kill the
  node child.** Free the port before restarting:
  `Get-NetTCPConnection -LocalPort 3211 -State Listen | ... Stop-Process` (PowerShell tool,
  not inline via bash — bash eats `$conn`).
- Rebuilding `.next` while the old server runs → 500s on next request. Always
  kill → build → start.
- `next start` serves stale JS if you forget to rebuild after edits.
