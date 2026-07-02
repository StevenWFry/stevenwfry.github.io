<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom">
<xsl:output method="html" encoding="UTF-8"/>

<xsl:template match="/">
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title><xsl:value-of select="/rss/channel/title"/> — RSS feed</title>
<style>
  :root {
    --bg: #080b0f;
    --surface: #0e1318;
    --border: #1e2a36;
    --accent: #00ff9d;
    --accent2: #ff4d6d;
    --accent3: #ffd60a;
    --text: #d4e0ec;
    --muted: #5a7a94;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: var(--bg);
    color: var(--text);
    font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
    line-height: 1.6;
    padding: 2.5rem 1.25rem 4rem;
  }
  .wrap { max-width: 720px; margin: 0 auto; }
  .eyebrow {
    color: var(--accent3);
    text-transform: uppercase;
    letter-spacing: 0.14em;
    font-size: 0.65rem;
    margin-bottom: 0.75rem;
  }
  h1 { font-size: 1.6rem; margin-bottom: 0.5rem; }
  h1 a { color: var(--accent); text-decoration: none; }
  .desc { color: var(--muted); font-size: 0.85rem; margin-bottom: 1.5rem; }
  .howto {
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent);
    border-radius: 8px;
    background: var(--surface);
    padding: 0.9rem 1rem;
    font-size: 0.8rem;
    margin-bottom: 2rem;
    color: var(--muted);
  }
  .howto strong { color: var(--accent); font-weight: 600; }
  .howto code {
    color: var(--text);
    background: rgba(0, 255, 157, 0.08);
    padding: 0.1em 0.4em;
    border-radius: 4px;
    user-select: all;
  }
  .item {
    display: block;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--surface);
    padding: 1rem 1.1rem;
    margin-bottom: 12px;
    text-decoration: none;
    transition: border-color 0.15s;
  }
  .item:hover { border-color: rgba(0, 255, 157, 0.35); }
  .item-date {
    color: var(--accent3);
    font-size: 0.62rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    margin-bottom: 0.35rem;
  }
  .item-title { color: var(--text); font-size: 0.9rem; margin-bottom: 0.35rem; }
  .item:hover .item-title { color: var(--accent); }
  .item-desc { color: var(--muted); font-size: 0.8rem; }
  .home {
    display: inline-block;
    color: var(--muted);
    text-decoration: none;
    font-size: 0.75rem;
    letter-spacing: 0.08em;
    margin-bottom: 1.4rem;
  }
  .home:hover { color: var(--accent); }
</style>
</head>
<body>
<div class="wrap">
  <a class="home" href="/">&#8592; swf.wtf</a>
  <div class="eyebrow">RSS Feed</div>
  <h1><a href="/"><xsl:value-of select="/rss/channel/title"/></a></h1>
  <p class="desc"><xsl:value-of select="/rss/channel/description"/></p>
  <div class="howto">
    <strong>This is an RSS feed.</strong> You're seeing a friendly preview because you opened it in a browser.
    To subscribe, copy this URL into your feed reader: <code>https://swf.wtf/feed.xml</code>
  </div>
  <xsl:for-each select="/rss/channel/item">
    <a class="item">
      <xsl:attribute name="href"><xsl:value-of select="link"/></xsl:attribute>
      <div class="item-date"><xsl:value-of select="substring(pubDate, 1, 16)"/></div>
      <div class="item-title"><xsl:value-of select="title"/></div>
      <div class="item-desc"><xsl:value-of select="description"/></div>
    </a>
  </xsl:for-each>
</div>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
