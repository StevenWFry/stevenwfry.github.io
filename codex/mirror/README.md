# swf.wtf

Static personal website hosted on GitHub Pages.

## Project Structure

- `index.html`, `about.html`, `now.html`: Core top-level pages.
- `guides/<slug>/index.html`: Guide pages with folder-based URLs.
- `blog/<slug>/index.html`: Blog posts with folder-based URLs.
- `guides/index.html`, `blog/index.html`: Section landing pages.
- `assets/css/site.css`: Shared base styles and theme tokens for the main site pages.
- `assets/css/*.css`: Page styles extracted from inline `<style>` blocks.
- `assets/js/site.js`: Shared client-side behavior (cursor, Konami, common helpers).
- `assets/js/*.js`: Page scripts extracted from inline `<script>` blocks.
- `guides/sql-guide/`: SQL study notes (`.md`) plus generated web chapter pages (`.html`).
- `scripts/build_sql_guide.py`: Markdown-to-HTML generator for `guides/sql-guide/`.
- `pirate-copilot/`: Separate experimental mini-site with its own assets.
- `CNAME`: Custom domain configuration for GitHub Pages.

## Local Preview

1. Clone the repository.
2. Open `index.html` in your browser.

## Maintenance Notes

- Keep shared behavior and styling external in `assets/` rather than inline in HTML.
- If you add a new page, prefer creating `assets/css/<page>.css` and `assets/js/<page>.js`.
- New written content should use folder URLs: `guides/<slug>/index.html` or `blog/<slug>/index.html`.
- Update `sitemap.xml` when adding, moving, or removing indexable pages.
- Rebuild SQL guide pages after changing SQL markdown notes:
  `python scripts/build_sql_guide.py`

