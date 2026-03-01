(() => {
  const doc = document;
  const root = doc.documentElement;
  const body = doc.body;
  if (!body) return;

  body.classList.add('codex-restyled');

  const path = window.location.pathname;
  const codexBase = path.includes('/codex/mirror/') ? '/codex/' : '/';
  const mirrorBase = path.includes('/codex/mirror/') ? '/codex/mirror/' : '/mirror/';

  const toolbar = doc.createElement('div');
  toolbar.className = 'codex-mirror-toolbar';

  const left = doc.createElement('div');
  left.className = 'codex-left';
  left.innerHTML = `
    <a class="codex-badge" href="${codexBase}index.html">CODEX <small>mirror skin</small></a>
    <a href="${codexBase}explorer.html">Explorer</a>
    <a href="${codexBase}guides.html">Guides</a>
    <a href="${codexBase}resources.html">Resources</a>
  `;

  const right = doc.createElement('div');
  right.className = 'codex-right';

  const mirrorHome = doc.createElement('a');
  mirrorHome.href = `${mirrorBase}index.html`;
  mirrorHome.textContent = 'Mirror Home';

  const themeButton = doc.createElement('button');
  themeButton.type = 'button';

  const themes = [
    { key: 'sunrise', label: 'Sunrise' },
    { key: 'ocean', label: 'Ocean' },
    { key: 'graphite', label: 'Graphite' }
  ];

  function getThemeIndex(key) {
    const index = themes.findIndex((theme) => theme.key === key);
    return index >= 0 ? index : 0;
  }

  function applyTheme(key) {
    root.setAttribute('data-codex-theme', key);
    localStorage.setItem('codex-mirror-theme', key);
    const selected = themes[getThemeIndex(key)];
    themeButton.textContent = `Theme: ${selected.label}`;
  }

  const storedTheme = localStorage.getItem('codex-mirror-theme') || 'sunrise';
  applyTheme(storedTheme);

  themeButton.addEventListener('click', () => {
    const current = root.getAttribute('data-codex-theme') || 'sunrise';
    const nextIndex = (getThemeIndex(current) + 1) % themes.length;
    applyTheme(themes[nextIndex].key);
  });

  const topButton = doc.createElement('button');
  topButton.type = 'button';
  topButton.textContent = 'Top';
  topButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  right.appendChild(mirrorHome);
  right.appendChild(themeButton);
  right.appendChild(topButton);

  toolbar.appendChild(left);
  toolbar.appendChild(right);

  body.prepend(toolbar);
})();
