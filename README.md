# swf.wtf

Static personal website hosted on GitHub Pages.

## Project Structure

- `*.html`: Top-level pages (home, posts, guides, about).
- `assets/css/site.css`: Shared base styles and theme tokens for the main site pages.
- `assets/css/*.css`: Page styles extracted from inline `<style>` blocks.
- `assets/js/site.js`: Shared client-side behavior (cursor, Konami, common helpers).
- `assets/js/*.js`: Page scripts extracted from inline `<script>` blocks.
- `pirate-copilot/`: Separate experimental mini-site with its own assets.
- `CNAME`: Custom domain configuration for GitHub Pages.

## Local Preview

1. Clone the repository.
2. Open any top-level HTML file (for example, `index.html`) in your browser.

## Maintenance Notes

- Keep shared behavior and styling external in `assets/` rather than inline in HTML.
- If you add a new page, prefer creating `assets/css/<page>.css` and `assets/js/<page>.js`.
