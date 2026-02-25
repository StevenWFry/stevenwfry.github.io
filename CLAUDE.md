# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal blog/portfolio website for swf.wtf (Steven William Fry), hosted on GitHub Pages. Pure static HTML — no build system, no framework, no package manager. Main content uses folder URLs (`<section>/<slug>/index.html`) plus a few top-level pages.

## Local Development

No build step required. To preview locally:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

## Architecture

### Content Structure

- `index.html` — Main landing page with hero, blog post list, and links grid
- `guides/<slug>/index.html` — Guide pages
- `blog/<slug>/index.html` — Blog posts/build logs
- `guides/index.html`, `blog/index.html` — Section landing pages
- `pirate-copilot/` — Separate subproject (a GitHub Copilot experiment), has its own CSS/JS

### Styling Conventions

Pages typically include shared styles from `assets/css/site.css` plus page-specific CSS files. The color palette:

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
1. Create a new folder-based page: `blog/<slug>/index.html` or `guides/<slug>/index.html`, following the structure of an existing page in that section
2. Update `index.html` to add the post to the blog list and update the "latest post" card if applicable
3. Update `sitemap.xml`
4. Remove any "coming soon" stub for that topic if one exists in `index.html`

### JavaScript Patterns

Most pages load shared behavior from `assets/js/site.js` plus an optional page-specific script in `assets/js/`. No external JS dependencies except Google Fonts (CSS) and the ipify.org API for IP display. The `pirate-copilot/` subproject uses THREE.js for 3D rendering.
