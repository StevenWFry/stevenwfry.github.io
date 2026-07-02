#!/usr/bin/env python3
"""Regenerate feed.xml, sitemap.xml, and the homepage post list from
scripts/posts.json.

Publishing a post now means: write the post page, add one entry to
scripts/posts.json, run this script, commit. This script owns:

  - feed.xml (entirely)
  - sitemap.xml (entirely)
  - index.html between the BUILD:FEATURED / BUILD:POSTLIST markers,
    plus the post-count span in the visitor card

Everything else stays hand-written.
"""

import json
import re
import sys
from datetime import datetime, timezone
from email.utils import format_datetime
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "scripts" / "posts.json"
HOMEPAGE_LIST_SIZE = 4

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
          "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


def parse_date(s):
    return datetime.strptime(s, "%Y-%m-%d")


def display_date(s):
    d = parse_date(s)
    return f"{MONTHS[d.month - 1]} {d.day}, {d.year}"


def rfc822(s):
    d = parse_date(s).replace(hour=12, tzinfo=timezone.utc)
    return format_datetime(d)


def build_feed(site, posts):
    lines = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<?xml-stylesheet type="text/xsl" href="/feed.xsl"?>',
        '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
        "<channel>",
        f"  <title>{escape(site['title'])}</title>",
        f"  <link>{site['url']}/</link>",
        f"  <description>{escape(site['description'])}</description>",
        "  <language>en</language>",
        f"  <lastBuildDate>{rfc822(posts[0]['date'])}</lastBuildDate>",
        f'  <atom:link href="{site["url"]}/feed.xml" rel="self" type="application/rss+xml"/>',
    ]
    for p in posts:
        url = site["url"] + p["url"]
        lines += [
            "  <item>",
            f"    <title>{escape(p['title'])}</title>",
            f"    <link>{url}</link>",
            f'    <guid isPermaLink="true">{url}</guid>',
            f"    <pubDate>{rfc822(p['date'])}</pubDate>",
            f"    <description>{escape(p['description'])}</description>",
            "  </item>",
        ]
    lines += ["</channel>", "</rss>", ""]
    return "\n".join(lines)


def build_sitemap(site, posts, pages):
    entries = [(p["url"], p.get("lastmod", p["date"])) for p in posts]
    entries += [(pg["loc"], pg["lastmod"]) for pg in pages]
    entries.sort(key=lambda e: e[0])
    lines = [
        '<?xml version="1.0" encoding="utf-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ]
    for loc, lastmod in entries:
        lines += [
            "  <url>",
            f"    <loc>{site['url']}{loc}</loc>",
            f"    <lastmod>{lastmod}</lastmod>",
            "  </url>",
        ]
    lines += ["</urlset>", ""]
    return "\n".join(lines)


def build_featured(post):
    label = "★ Latest guide" if post["type"] == "guide" else "★ Latest post"
    tags = "".join(
        f'\n        <span class="tag">{escape(t)}</span>'
        for t in post.get("tags", [post["tag"]])
    )
    return f'''    <a href="{post['url']}" class="post-featured">
      <div class="post-featured-label">{label}</div>
      <div class="post-featured-title">{escape(post['title'])}</div>
      <div class="post-featured-excerpt">
        {escape(post['description'])}
      </div>
      <div class="post-meta">
        <span>{display_date(post['date'])}</span>
        <span>·</span>
        <span>{post['type']}</span>{tags}
      </div>
    </a>'''


def build_post_list(posts):
    items = []
    for p in posts:
        title = p.get("shortTitle", p["title"])
        items.append(f'''      <a href="{p['url']}" class="post-item">
        <span class="post-item-date">{display_date(p['date'])}</span>
        <span class="post-item-title">{escape(title)}</span>
        <span class="post-item-tag">{escape(p['tag'])}</span>
      </a>''')
    return '    <div class="post-list">\n' + "\n".join(items) + "\n    </div>"


def replace_between(text, start_marker, end_marker, replacement, path):
    pattern = re.compile(
        re.escape(start_marker) + r".*?" + re.escape(end_marker), re.DOTALL
    )
    if not pattern.search(text):
        sys.exit(f"error: markers {start_marker!r} … {end_marker!r} not found in {path}")
    return pattern.sub(start_marker + "\n" + replacement + "\n    " + end_marker, text)


def main():
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    site, posts, pages = manifest["site"], manifest["posts"], manifest["pages"]

    posts.sort(key=lambda p: p["date"], reverse=True)

    (ROOT / "feed.xml").write_text(build_feed(site, posts), encoding="utf-8")
    (ROOT / "sitemap.xml").write_text(build_sitemap(site, posts, pages), encoding="utf-8")

    index_path = ROOT / "index.html"
    html = index_path.read_text(encoding="utf-8")
    html = replace_between(
        html, "<!-- BUILD:FEATURED START -->", "<!-- BUILD:FEATURED END -->",
        build_featured(posts[0]), index_path,
    )
    html = replace_between(
        html, "<!-- BUILD:POSTLIST START -->", "<!-- BUILD:POSTLIST END -->",
        build_post_list(posts[1 : 1 + HOMEPAGE_LIST_SIZE]), index_path,
    )
    html, n = re.subn(
        r'(<span id="post-count">)\d+(</span>)',
        rf"\g<1>{len(posts)}\g<2>", html,
    )
    if n != 1:
        sys.exit("error: post-count span not found in index.html")
    index_path.write_text(html, encoding="utf-8")

    print(f"built feed.xml ({len(posts)} items), sitemap.xml "
          f"({len(posts) + len(pages)} urls), index.html (featured + top {HOMEPAGE_LIST_SIZE})")


if __name__ == "__main__":
    main()
