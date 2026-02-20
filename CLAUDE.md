# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog/portfolio website for swf.wtf (Steven William Fry), hosted on GitHub Pages. Pure static HTML — no build system, no framework, no package manager. Each page is a self-contained `.html` file.

## Local Development

No build step required. To preview locally:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

## Architecture

### Content Structure

- `index.html` — Main landing page with hero, blog post list, and links grid
- `how-i-set-up-swf-wtf.html`, `fedora-setup.html`, `virtualbox-guest-additions.html` — Standalone blog post pages
- `pirate-copilot/` — Separate subproject (a GitHub Copilot experiment), has its own CSS/JS

### Styling Conventions

All pages use the same CSS custom properties defined inline (not a shared stylesheet). The color palette:

```css
--bg: #080b0f;
--surface: #0e1318;
--accent: #00ff9d;    /* neon green — primary accent */
--accent2: #ff4d6d;   /* pink */
--accent3: #ffd60a;   /* yellow */
--text: #d4e0ec;
--muted: #5a7a94;
```

Aesthetic: dark terminal/hacker vibe with scanline overlays, monospace fonts (Martian Mono, IBM Plex Mono), and CSS animations. New pages should match this visual language.

### New Blog Posts

When adding a new post:
1. Create a new `.html` file at the repo root, following the structure of an existing post (e.g., `fedora-setup.html`)
2. Update `index.html` to add the post to the blog list and update the "latest post" card if applicable
3. Remove any "coming soon" stub for that topic if one exists in `index.html`

### JavaScript Patterns

Each page includes a small inline `<script>` with site-specific interactivity (custom cursor, Konami code easter egg, back-to-top button). No external JS dependencies except Google Fonts (CSS) and the ipify.org API for IP display. The `pirate-copilot/` subproject uses THREE.js for 3D rendering.
