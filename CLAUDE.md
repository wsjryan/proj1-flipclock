# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-file flip clock website deployed to GitHub Pages at `https://wsjryan.github.io/proj1-flipclock/`. No build step, no package manager — open `index.html` directly in a browser to develop.

## Deployment

Changes go live by committing and pushing to `master`:

```bash
git add -A
git commit -m "message"
git push
```

GitHub Pages rebuilds automatically (~1 min). Check build status:

```bash
gh api repos/wsjryan/proj1-flipclock/pages --jq '.status'
```

### Auto-push on file save

```bash
node autopush.js   # watches entire folder; Ctrl+C to stop
```

Debounces 1.5 s after last change, then runs `git add -A && git commit && git push`.

## Architecture

Everything lives in `index.html` — HTML, CSS, and JS are all inline. The file is large (~370 KB) because it contains a base64-encoded logo image.

### Responsive sizing system

All dimensions derive from a single CSS variable `--dw` (card width):

```css
--dw: clamp(34px, 9vw, 98px);   /* change this one value to rescale everything */
--dh, --dhh, --dfs, --dpr, --dbr, --gcl, --ggr  /* all calc(var(--dw) * ratio) */
--dlsp: clamp(1px, 0.5vw, 3px); /* shared letter-spacing for .date and .credit */
```

To change overall clock size, only `--dw` needs adjustment.

### Flip animation — 4-element-per-digit design

Each digit (`.d`) contains four child divs to achieve overlap-free flipping:

| Element | Role | Rest state |
|---------|------|-----------|
| `.fa`   | Top half — also the exit flap (rotates 0°→-90°) | flat (visible) |
| `.fta`  | Top half — enter flap (rotates 90°→0°, delayed) | 90° (hidden) |
| `.sb`   | Bottom half — static display | flat (visible) |
| `.fb`   | Bottom half — enter flap (rotates 90°→0°, delayed) | 90° (hidden) |

Animation sequence on `.d.go`:
- Phase 1 (0–280 ms): `.fa` exits (flipOut)
- Phase 2 (280–560 ms): `.fta` and `.fb` enter simultaneously (flipIn with 280 ms delay)

`flipTo(el, nv)` uses pre-cached span refs (`el._faS`, `el._ftaS`, `el._sbS`, `el._fbS`) attached in `mkDigit()` — do **not** call `querySelector` inside `flipTo`.

### JS structure (bottom of `index.html`)

- `mkDigit(id)` — creates a `.d` element, caches child refs on the element, appends to group
- `setStatic(el, v)` — updates all spans instantly (no animation); used on first tick when `dataset.v === ''`
- `flipTo(el, nv)` — animates a digit change; no-ops if value unchanged
- `tick()` — reads `new Date()`, updates date string and all 6 digit elements; called every second via `setInterval`
- Fullscreen: `reqFS`/`exitFS` are bound once at startup; `if (!reqFS) return` guards WebViews that lack the API

### Theme / format toggles

- `body.light` class on `<body>` switches color variables; toggled by the "라이트" button
- `h24` boolean controls 12/24h display; toggled by the "12시간"/"24시간" button — toggling resets all `dataset.v` to `''` and calls `tick()` to re-render cleanly

## File header convention

Every new file must begin with a comment showing the creation date and time (KST, 24h). Format by file type:

```html
<!-- index.html | 2026-03-02 18:30 -->
```
```js
// autopush.js | 2026-03-02 18:30
```
```css
/* style.css | 2026-03-02 18:30 */
```

## Key constraints

- **No external JS** — pure vanilla JS, no frameworks
- **Single HTML file** — keep all CSS and JS inline; do not split into separate files unless the user requests it
- **Safari / WebView compat** — always add `-webkit-` prefixes alongside `backface-visibility`, `transform-origin`, and fullscreen API calls; use `touch-action: manipulation` on interactive elements
- **100dvh** — `min-height: 100dvh` must follow `min-height: 100vh` (cascade order) to fix Safari address-bar centering
