(() => {
  const grid = document.getElementById('mirrorGrid');
  const count = document.getElementById('mirrorCount');
  const searchInput = document.getElementById('mirrorSearch');
  const chips = document.querySelectorAll('[data-kind]');

  if (!grid || !count) return;

  let pages = [];
  let selectedKind = 'all';

  function normalizePath(rawPath) {
    if (!rawPath || rawPath === '/') return '/index.html';
    if (rawPath.endsWith('/')) return `${rawPath}index.html`;
    return rawPath;
  }

  function pathToTitle(pathname) {
    if (pathname === '/index.html') return 'Home';

    const cleaned = pathname
      .replace(/^\//, '')
      .replace(/index\.html$/, '')
      .replace(/\.html$/, '');

    return cleaned
      .split('/')
      .filter(Boolean)
      .map((segment) => segment.replace(/[-_]+/g, ' '))
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' / ');
  }

  function categorize(pathname) {
    if (pathname === '/index.html' || pathname === '/about.html' || pathname === '/now.html') return 'core';
    if (pathname.startsWith('/guides/sql-guide/')) return 'sql';
    if (pathname.startsWith('/guides/')) return 'guides';
    if (pathname.startsWith('/blog/')) return 'blog';
    if (pathname.startsWith('/pirate-copilot/')) return 'projects';
    return 'other';
  }

  function render(list) {
    if (!list.length) {
      grid.innerHTML = `
        <article class="feature-card">
          <h3>No pages match</h3>
          <p>Try a shorter query or switch category filters.</p>
        </article>
      `;
      count.textContent = '// 0 pages shown';
      return;
    }

    grid.innerHTML = list.map((page) => `
      <a class="link-tile" href="${page.href}">
        <span class="link-tag">${page.kind}</span>
        <strong>${page.title}</strong>
        <small>${page.path}</small>
      </a>
    `).join('');

    count.textContent = `// ${list.length} page${list.length === 1 ? '' : 's'} shown`;
  }

  function applyFilters() {
    const query = (searchInput?.value || '').trim().toLowerCase();

    const filtered = pages.filter((page) => {
      const kindOk = selectedKind === 'all' || page.kind === selectedKind;
      if (!kindOk) return false;

      if (!query) return true;

      const haystack = `${page.title} ${page.path} ${page.kind}`.toLowerCase();
      return haystack.includes(query);
    });

    render(filtered);
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      selectedKind = chip.getAttribute('data-kind') || 'all';
      chips.forEach((btn) => btn.classList.toggle('active', btn === chip));
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  async function loadSitemap() {
    try {
      const response = await fetch('mirror/sitemap.xml', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const xmlText = await response.text();
      const parsed = new DOMParser().parseFromString(xmlText, 'application/xml');
      const locNodes = Array.from(parsed.querySelectorAll('url > loc'));

      const rawLocs = locNodes
        .map((node) => node.textContent || '')
        .map((text) => text.trim())
        .filter(Boolean);

      pages = rawLocs.map((loc) => {
        let pathname = '/';

        try {
          pathname = new URL(loc).pathname;
        } catch {
          pathname = loc;
        }

        const normalized = normalizePath(pathname);
        return {
          path: normalized,
          title: pathToTitle(normalized),
          kind: categorize(normalized),
          href: `mirror${normalized}`
        };
      });

      pages.sort((a, b) => a.path.localeCompare(b.path));
      applyFilters();
    } catch (error) {
      count.textContent = '// failed to read mirror sitemap';
      grid.innerHTML = `
        <article class="feature-card">
          <h3>Sitemap load failed</h3>
          <p>${String(error)}</p>
          <a href="mirror/index.html">Open mirror home instead</a>
        </article>
      `;
    }
  }

  loadSitemap();
})();
