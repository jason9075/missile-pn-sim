# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
just install   # npm install --ignore-scripts
just dev       # Vite dev server on :8080 (auto-installs node_modules)
just build     # production build → dist/
just preview   # build + preview on :8080
just clean     # rm -rf dist node_modules
```

`nix develop` (or direnv) provides nodejs_22 / bun / just. There is no test suite, no linter, and no build step other than Vite — verification is manual in the browser.

**NixOS noexec workaround:** every npm script is wrapped as
`node --require ./scripts/fix-noexec.cjs ./node_modules/vite/bin/vite.js …`.
The shim copies the esbuild binary and any `.node` addon to `$TMPDIR` before exec/dlopen. Always install with `--ignore-scripts` (esbuild's postinstall fails on a noexec store), and never invoke bare `vite` — it will fail. If you add a new script to `package.json`, keep the `--require` wrapper.

## Architecture

Vanilla ESM + Three.js single-page app. No framework, no bundler config beyond `vite.config.js`. `index.html` owns the entire DOM (toolbar, sidebar, telemetry HUD, math modal); JS modules only query existing element IDs and never create UI structure.

`src/main.js` is the sole orchestrator. It owns the renderer, the `isPaused` / `stepRequested` flags, and the fixed-step loop. The key separation:

- **`src/physics/`** — pure kinematics, no Three.js scene objects (only `THREE.Vector3` math). `PNController.calculateGuidance()` is a pure function of (missilePos, missileVel, targetPos, targetVel) returning a **telemetry object** that is the single data bus for the whole frame: physics integration, vector overlays, and HUD all consume it.
- **`src/scene/`** — rendering only. Models read physics state each frame and never write to it.
- **`src/ui/`** — DOM only. `Controls` communicates exclusively via the callback object passed from `main.js`; it never touches physics or scene modules directly.

### Simulation loop invariants

- Physics uses a **fixed `dt = 1/60`**, independent of the rAF delta. The rAF `delta` (clamped to 0.1s) is only for visuals (water animation, particles, camera smoothing).
- When paused, `calculateGuidance` still runs every frame so the HUD stays live for inspection; only `simulateStep` is gated. **Step Once** sets `isPaused = true` plus a one-shot `stepRequested`.
- Interception is handled in `Missile.update()` with **continuous collision detection**: it projects the target onto the current step's segment, so a 12 m proximity-fuze radius can't be tunneled through at 400 m/s. `isHit` propagates from missile → target → explosion trigger in `main.js`.
- Missile speed is **constant magnitude**: the PN command only rotates the velocity vector (`v + a·dt`, renormalized to `speed`). Adding a thrust profile means changing that renormalization.

### Fixed launch rail

The battery deliberately **does not slew** — there is no aiming code, and adding some has been explicitly rejected. `LAUNCH_AZIMUTH` (1.012 rad / 58°) and `LAUNCH_PITCH` (45°) are exported from `physics/Missile.js` and imported by `scene/Environment.js`; they are the single source for both the round's initial velocity (`Missile.reset()`) and the turret/trunnion pose (`Environment.initLauncher()`). Keep them in one place — if the two diverge the missile visually leaves the tube at the wrong angle. The third coupled value is the hardcoded initial missile position `(0.7, 31.9, -0.45)` in `main.js`, which must sit on the rail.

Consequence worth knowing: every corridor opens with a large heading error (32° head-on, 74° for `coastal-crossing`), which is what makes the guidance work visible — and what pushes `coastal-crossing` into G-limit saturation at default settings.

### Coordinates & scale

1 world unit = 1 metre. `-Z` is the missile/tube forward axis (`Missile.updateOrientation` maps `(0,0,-1)` → velocity). Terrain spans 5500 u, water 4500×6000 u; the launcher hillock sits at the origin at y≈22–26 m.

### Settings persistence

`Controls` mirrors every slider/select/checkbox into `localStorage` under `missile_pn_sim_settings_v1` on change, and `controls.loadSettings()` is called once after construction — it replays each stored value through the same callbacks, so **any new control must be added to `saveSettings`, `loadSettings`, and `bindEvents` together** or it will silently not persist.

## Known drift

- `vite.config.js` sets production `base: '/gfx-lab/'`, but the repo is `missile-pn-sim` — GitHub Pages assets 404 unless this is changed to `/missile-pn-sim/`. (The project was scaffolded from a `gfx-lab` template; `package.json` still names it `gfx-lab`.)
- `guidelines` is the original **spec**, not a description of the current code. It describes sinusoidal/circular target patterns and a `VectorMath`-backed free camera that partly differ from what exists: `Target.js` currently ships only two straight-line routes (`coastal-crossing`, `direct-inbound`). Treat it as intent, verify against source.
- `README.md`'s project tree is also stale (e.g. it lists `src/style.css`; the real file is `src/styles/nord-theme.css`, and `src/scene/Terrain.js` is missing from it).

## Conventions

- Two-space indent, single quotes, semicolons, `const` by default. Named `PascalCase` class exports, one class per file, filename matches the export.
- Section banners (`/* ─── Name ──── */`) in `main.js`; JSDoc on non-obvious public methods.
- Colours follow the Nord palette (`nord-theme.css`), with tactical accents: emerald `#32D74B` friendly, crimson `#FF3B56` hostile.
- Conventional commits (`feat:`, `fix:`, `chore:`, `ui:`).
