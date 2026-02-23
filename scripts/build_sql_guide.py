#!/usr/bin/env python3
"""
Generate styled HTML pages for sql-guide markdown notes.

Outputs:
- sql-guide/index.html
- sql-guide/<chapter>.html for every chapter markdown file
"""

from __future__ import annotations

import html
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SQL_DIR = ROOT / "sql-guide"
TOC_MD = SQL_DIR / "00_TABLE_OF_CONTENTS.md"


LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
BOLD_RE = re.compile(r"\*\*(.+?)\*\*")
ITALIC_RE = re.compile(r"(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)")
CODE_SPAN_RE = re.compile(r"`([^`]+)`")
HEADING_RE = re.compile(r"^\s*(?:\ufeff)?(#{1,6})\s+(.+?)\s*$")
UL_RE = re.compile(r"^\s*-\s+(.+?)\s*$")
OL_RE = re.compile(r"^\s*(\d+)\.\s+(.+?)\s*$")


def short_text(text: str, limit: int = 180) -> str:
    clean = re.sub(r"\s+", " ", text).strip()
    if len(clean) <= limit:
        return clean
    return clean[: limit - 1].rstrip() + "..."


def strip_markdown_markers(text: str) -> str:
    text = LINK_RE.sub(r"\1", text)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"(?<!\*)\*(?!\s)(.+?)(?<!\s)\*(?!\*)", r"\1", text)
    return re.sub(r"\s+", " ", text).strip()


def format_inline(text: str) -> str:
    code_tokens: list[str] = []

    def stash_code(match: re.Match[str]) -> str:
        token = f"@@CODE{len(code_tokens)}@@"
        code_tokens.append(f"<code>{html.escape(match.group(1))}</code>")
        return token

    text_with_tokens = CODE_SPAN_RE.sub(stash_code, text)
    escaped = html.escape(text_with_tokens)

    def link_repl(match: re.Match[str]) -> str:
        label = match.group(1)
        url = html.unescape(match.group(2)).strip()
        if url.endswith(".md"):
            url = url[:-3] + ".html"
        attrs = ""
        if url.startswith("http://") or url.startswith("https://"):
            attrs = ' target="_blank" rel="noopener"'
        return f'<a href="{html.escape(url, quote=True)}"{attrs}>{label}</a>'

    escaped = LINK_RE.sub(link_repl, escaped)
    escaped = BOLD_RE.sub(r"<strong>\1</strong>", escaped)
    escaped = ITALIC_RE.sub(r"<em>\1</em>", escaped)

    for idx, code_html in enumerate(code_tokens):
        escaped = escaped.replace(f"@@CODE{idx}@@", code_html)
    return escaped


def markdown_to_html(markdown_text: str) -> str:
    lines = markdown_text.splitlines()
    out: list[str] = []
    para_lines: list[str] = []

    list_type: str | None = None  # "ul" or "ol"
    list_items: list[list[str]] = []
    current_item: list[str] = []

    in_code = False
    code_lang = ""
    code_lines: list[str] = []

    def flush_paragraph() -> None:
        nonlocal para_lines
        if not para_lines:
            return

        text_parts: list[str] = []
        for idx, line in enumerate(para_lines):
            line_clean = line.rstrip()
            if not line_clean:
                continue
            if idx > 0:
                if para_lines[idx - 1].endswith("  "):
                    text_parts.append("<br>")
                else:
                    text_parts.append(" ")
            text_parts.append(format_inline(line_clean))
        out.append(f"<p>{''.join(text_parts)}</p>")
        para_lines = []

    def flush_list() -> None:
        nonlocal list_type, list_items, current_item
        if not list_type:
            return

        if current_item:
            list_items.append(current_item)
            current_item = []

        out.append(f"<{list_type}>")
        for item_lines in list_items:
            li_parts: list[str] = []
            for idx, text in enumerate(item_lines):
                if idx > 0:
                    li_parts.append("<br>")
                li_parts.append(format_inline(text.strip()))
            out.append(f"<li>{''.join(li_parts)}</li>")
        out.append(f"</{list_type}>")

        list_type = None
        list_items = []
        current_item = []

    def flush_code() -> None:
        nonlocal in_code, code_lang, code_lines
        cls = f' class="language-{html.escape(code_lang)}"' if code_lang else ""
        code = html.escape("\n".join(code_lines))
        out.append(f"<pre><code{cls}>{code}</code></pre>")
        in_code = False
        code_lang = ""
        code_lines = []

    for line in lines:
        if in_code:
            if line.strip().startswith("```"):
                flush_code()
            else:
                code_lines.append(line)
            continue

        code_open = line.strip().startswith("```")
        if code_open:
            flush_paragraph()
            flush_list()
            in_code = True
            code_lang = line.strip()[3:].strip()
            code_lines = []
            continue

        if not line.strip():
            flush_paragraph()
            # Keep list context across blank lines so list items with
            # wrapped/loose formatting are rendered as one list.
            if list_type:
                continue
            continue

        heading_match = HEADING_RE.match(line)
        if heading_match:
            flush_paragraph()
            flush_list()
            level = len(heading_match.group(1))
            text = format_inline(heading_match.group(2).strip())
            out.append(f"<h{level}>{text}</h{level}>")
            continue

        if re.match(r"^\s*---+\s*$", line):
            flush_paragraph()
            flush_list()
            out.append("<hr>")
            continue

        ul_match = UL_RE.match(line)
        if ul_match:
            flush_paragraph()
            if list_type != "ul":
                flush_list()
                list_type = "ul"
            if current_item:
                list_items.append(current_item)
            current_item = [ul_match.group(1)]
            continue

        ol_match = OL_RE.match(line)
        if ol_match:
            flush_paragraph()
            if list_type != "ol":
                flush_list()
                list_type = "ol"
            if current_item:
                list_items.append(current_item)
            current_item = [ol_match.group(2)]
            continue

        if list_type and current_item and re.match(r"^\s{2,}\S", line):
            current_item.append(line.strip())
            continue

        if list_type:
            flush_list()

        para_lines.append(line.strip())

    if in_code:
        flush_code()
    flush_paragraph()
    flush_list()

    return "\n".join(out)


def extract_first_heading(markdown_text: str) -> str:
    for line in markdown_text.splitlines():
        match = HEADING_RE.match(line.lstrip("\ufeff"))
        if match:
            return match.group(2).strip()
    return "SQL Lesson"


def strip_first_heading(markdown_text: str) -> str:
    lines = markdown_text.splitlines()
    first_content_idx = None
    for idx, line in enumerate(lines):
        if line.strip():
            first_content_idx = idx
            break
    if first_content_idx is None:
        return markdown_text
    if HEADING_RE.match(lines[first_content_idx].lstrip("\ufeff")):
        del lines[first_content_idx]
    return "\n".join(lines)


def extract_summary(markdown_text: str) -> str:
    blocks = re.split(r"\n\s*\n", markdown_text)
    for block in blocks:
        text = block.strip().lstrip("\ufeff")
        if not text:
            continue
        if text.startswith("#"):
            continue
        if re.match(r"^[-*]\s+", text):
            continue
        if re.match(r"^\d+\.\s+", text):
            continue
        return short_text(strip_markdown_markers(text), 220)
    return "Detailed SQL study notes."


def parse_toc_entries() -> list[tuple[str, str]]:
    if not TOC_MD.exists():
        return []

    entries: list[tuple[str, str]] = []
    for line in TOC_MD.read_text(encoding="utf-8").splitlines():
        line = line.lstrip("\ufeff")
        m = re.match(r"^\s*\d+\.\s+\[(.+?)\]\(([^)]+\.md)\)\s*$", line)
        if not m:
            continue
        label = m.group(1).strip()
        md_name = m.group(2).strip()
        entries.append((label, md_name))
    return entries


def chapter_sort_key(path: Path) -> tuple[int, str, str]:
    m = re.match(r"^(\d+)([A-Z]?)_", path.stem)
    if not m:
        return (999, "", path.stem.lower())
    return (int(m.group(1)), m.group(2), path.stem.lower())


def discover_chapters() -> list[dict[str, str]]:
    chapter_map: dict[str, dict[str, str]] = {}

    for md in sorted(SQL_DIR.glob("*.md"), key=chapter_sort_key):
        if md.name == "00_TABLE_OF_CONTENTS.md":
            continue
        raw = md.read_text(encoding="utf-8").lstrip("\ufeff")
        chapter_map[md.name] = {
            "md_name": md.name,
            "label": md.stem.replace("_", " "),
            "title": extract_first_heading(raw),
            "summary": extract_summary(raw),
            "raw": raw,
        }

    toc_entries = parse_toc_entries()
    ordered: list[dict[str, str]] = []
    used: set[str] = set()

    for label, md_name in toc_entries:
        if md_name not in chapter_map:
            continue
        meta = chapter_map[md_name].copy()
        meta["label"] = label
        ordered.append(meta)
        used.add(md_name)

    for md_name, meta in chapter_map.items():
        if md_name in used:
            continue
        ordered.append(meta.copy())

    for meta in ordered:
        meta["html_name"] = meta["md_name"][:-3] + ".html"

    return ordered


def chapter_template(meta: dict[str, str], chapter_html: str, prev_link: str, next_link: str) -> str:
    title = html.escape(meta["title"])
    desc = html.escape(short_text(meta["summary"], 155))
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{title} - SQL Guide - swf.wtf</title>
<meta name="description" content="{desc}">
<link rel="stylesheet" href="../assets/css/site.css">
<link rel="stylesheet" href="../assets/css/sql-guide.css">
</head>
<body>

<div class="cursor" id="cursor"></div>

<nav>
  <div class="inner">
    <a href="../index.html" class="logo">swf.wtf</a>
    <a href="index.html">&larr; sql guide</a>
  </div>
</nav>

<main class="sql-page">
  <header class="sql-header">
    <div class="sql-eyebrow">SQL Guide Chapter</div>
    <h1>{title}</h1>
    <p>{html.escape(meta["summary"])}</p>
    <div class="sql-meta">
      <span class="sql-pill">oracle 19c</span>
      <span class="sql-pill">mysql notes</span>
      <span class="sql-pill">study chapter</span>
    </div>
  </header>

  <article class="chapter">
{chapter_html}
  </article>

  <div class="chapter-nav">
    <a href="{prev_link}">&larr; previous</a>
    <a href="{meta["md_name"]}">view source markdown</a>
    <a href="{next_link}">next &rarr;</a>
  </div>

  <div class="sql-footer">// sql-guide generated from markdown notes</div>
</main>

<script defer src="../assets/js/site.js"></script>

</body>
</html>
"""


def index_template(chapters: list[dict[str, str]]) -> str:
    cards: list[str] = []
    for meta in chapters:
        title = html.escape(meta["label"])
        summary = html.escape(short_text(meta["summary"], 170))
        chapter_tag = html.escape(meta["md_name"].split("_", 1)[0])
        cards.append(
            f"""    <a href="{meta["html_name"]}" class="lesson-card">
      <div class="lesson-tag">{chapter_tag}</div>
      <div class="lesson-title">{title}</div>
      <div class="lesson-summary">{summary}</div>
      <div class="lesson-cta">Open chapter &rarr;</div>
    </a>"""
        )

    card_html = "\n".join(cards)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>SQL Guide - swf.wtf</title>
<meta name="description" content="Oracle 19c and MySQL SQL study notes, converted to web chapters.">
<link rel="stylesheet" href="../assets/css/site.css">
<link rel="stylesheet" href="../assets/css/sql-guide.css">
</head>
<body>

<div class="cursor" id="cursor"></div>

<nav>
  <div class="inner">
    <a href="../index.html" class="logo">swf.wtf</a>
    <a href="../index.html">&larr; home</a>
  </div>
</nav>

<main class="sql-page">
  <header class="sql-header">
    <div class="sql-eyebrow">Study Notes</div>
    <h1>SQL Guide</h1>
    <p>Structured notes from my Oracle 19c SQL workshop study pass. Same site aesthetic, less context switching, and no hunting through filenames at midnight.</p>
    <div class="sql-meta">
      <span class="sql-pill">{len(chapters)} chapters</span>
      <span class="sql-pill">oracle + mysql</span>
      <span class="sql-pill">markdown-backed</span>
    </div>
  </header>

  <hr class="sql-divider">

  <section class="lesson-grid">
{card_html}
  </section>

  <div class="sql-links">
    <a href="00_TABLE_OF_CONTENTS.md">Table of contents (.md)</a>
    <a href="01_Course_Introduction.md">Raw notes folder</a>
  </div>

  <div class="sql-footer">// generated by scripts/build_sql_guide.py</div>
</main>

<script defer src="../assets/js/site.js"></script>

</body>
</html>
"""


def write_chapters(chapters: list[dict[str, str]]) -> None:
    for idx, meta in enumerate(chapters):
        raw = meta["raw"]
        body_md = strip_first_heading(raw)
        body_html = markdown_to_html(body_md)
        indented_body = "\n".join(f"    {line}" for line in body_html.splitlines())

        prev_link = chapters[idx - 1]["html_name"] if idx > 0 else "index.html"
        next_link = chapters[idx + 1]["html_name"] if idx < len(chapters) - 1 else "index.html"

        page_html = chapter_template(meta, indented_body, prev_link, next_link)
        (SQL_DIR / meta["html_name"]).write_text(page_html, encoding="utf-8")


def write_index(chapters: list[dict[str, str]]) -> None:
    (SQL_DIR / "index.html").write_text(index_template(chapters), encoding="utf-8")


def main() -> None:
    chapters = discover_chapters()
    if not chapters:
        raise SystemExit("No chapter markdown files found in sql-guide.")
    write_chapters(chapters)
    write_index(chapters)
    print(f"Generated {len(chapters)} chapter pages and sql-guide/index.html")


if __name__ == "__main__":
    main()
