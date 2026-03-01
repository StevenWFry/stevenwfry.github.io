# Codex Website

Standalone alternate website build located entirely in `codex/`.
Includes:
- Codex-styled UI pages (`codex/*.html`)
- Full copied mirror of the current main site (`codex/mirror/*`)

## Purpose

This directory contains a full parallel site design and implementation.
It does not modify or depend on the root website files.

## Quick Start

Run from either location:

```bash
# option A (repo root)
python3 -m http.server 8080

# option B (inside codex/)
cd codex
python3 -m http.server 8080
```

Open:

- Option A: `http://localhost:8080/codex/`
- Option B: `http://localhost:8080/`

Compatibility note:
- If you start the server inside `codex/`, `http://localhost:8080/codex/index.html` now redirects to `http://localhost:8080/index.html`.

## Pages

- `index.html` - Home / featured content
- `guides.html` - Filterable guide library + practical guide sections
- `resources.html` - Curated links and learning/tool references
- `explorer.html` - Searchable index of every mirrored page via sitemap parsing
- `visitors.html` - Visitor telemetry log viewer with search/export/clear actions
- `about.html` - Design manifesto and external recommendations
- `mirror/` - Full copied main site content

## Assets

- `css/codex.css` - Shared visual system, layout, responsive behavior, themes
- `js/app.js` - Global interactions (palette, theme cycling, copy, reveal, nav, progress)
- `js/guides.js` - Guide search/filter and guide-card rendering
- `js/resources.js` - Resource category filtering and rendering
- `js/explorer.js` - Mirror sitemap parsing + searchable page explorer
- `js/visitors.js` - Visitor log table rendering, stats, search, export, clear

## Features

- Command palette (`Ctrl/Cmd + K`)
- Theme cycling (`Sunrise`, `Ocean`, `Graphite`)
- Scroll progress bar
- Reveal-on-scroll motion
- Copy-to-clipboard command/code buttons
- Random mini-lab challenge module
- Guide search + level filtering
- Resource category filtering
- Full mirrored-site page explorer (core/guides/sql/blog/projects)
- Visitor telemetry snapshots + local visitor log dashboard
- Mobile navigation toggle

Visitor log note:
- Records are stored in the browser's `localStorage` (`codex-visitor-log-v1`) for the viewer using the site.

## Mirror Restyle

Mirrored pages under `codex/mirror/` are automatically restyled with the Codex theme layer:

- `mirror/assets/css/codex-mirror.css`
- `mirror/assets/js/codex-mirror.js`

This adds:

- Codex visual skin over copied pages
- Top fixed Codex toolbar (home/explorer/guides/resources)
- Per-page mirror theme toggle (Sunrise/Ocean/Graphite)

## Scope Guard

All Codex website changes are intended to remain inside `codex/` only.
