(() => {
  const resourceGrid = document.getElementById('resourceGrid');
  const resourceCount = document.getElementById('resourceCount');
  const chips = document.querySelectorAll('[data-category]');

  if (!resourceGrid || !resourceCount) return;

  const resources = [
    {
      title: 'ArchWiki',
      category: 'docs',
      desc: 'Still the best practical Linux reference, even outside Arch.',
      url: 'https://wiki.archlinux.org/'
    },
    {
      title: 'MDN Web Docs',
      category: 'docs',
      desc: 'Authoritative references for HTML, CSS, JS, and web APIs.',
      url: 'https://developer.mozilla.org/'
    },
    {
      title: 'Git Documentation',
      category: 'docs',
      desc: 'Official manual pages and conceptual docs for serious Git use.',
      url: 'https://git-scm.com/doc'
    },
    {
      title: 'The Missing Semester',
      category: 'learning',
      desc: 'MIT course covering command line, editors, data wrangling, and automation.',
      url: 'https://missing.csail.mit.edu/'
    },
    {
      title: 'roadmap.sh',
      category: 'learning',
      desc: 'Structured maps for backend, frontend, DevOps, and more.',
      url: 'https://roadmap.sh/'
    },
    {
      title: 'ThePrimeagen Channel',
      category: 'video',
      desc: 'Fast pacing, high signal editor and programming content.',
      url: 'https://www.youtube.com/@ThePrimeagen'
    },
    {
      title: 'Fireship',
      category: 'video',
      desc: 'Compact overviews for languages, frameworks, and architecture concepts.',
      url: 'https://www.youtube.com/@Fireship'
    },
    {
      title: 'Computerphile',
      category: 'video',
      desc: 'Excellent CS and security explainers with academic context.',
      url: 'https://www.youtube.com/@Computerphile'
    },
    {
      title: 'Excalidraw',
      category: 'tools',
      desc: 'Fast visual thinking for architecture sketches and planning diagrams.',
      url: 'https://excalidraw.com/'
    },
    {
      title: 'Regex101',
      category: 'tools',
      desc: 'Interactive regex testing with explanations and flavor controls.',
      url: 'https://regex101.com/'
    },
    {
      title: 'JSON Crack',
      category: 'tools',
      desc: 'Visualize complex JSON quickly when debugging payloads.',
      url: 'https://jsoncrack.com/'
    },
    {
      title: 'Awesome Open Source',
      category: 'tools',
      desc: 'Curated discoverability for practical open source projects.',
      url: 'https://awesomeopensource.com/'
    }
  ];

  let selectedCategory = 'all';

  function render(list) {
    resourceGrid.innerHTML = list.map((item) => `
      <a class="link-tile" href="${item.url}" target="_blank" rel="noopener">
        <span class="link-tag">${item.category}</span>
        <strong>${item.title}</strong>
        <small>${item.desc}</small>
      </a>
    `).join('');

    resourceCount.textContent = `// ${list.length} resource${list.length === 1 ? '' : 's'} shown`;
  }

  function applyFilter() {
    const filtered = selectedCategory === 'all'
      ? resources
      : resources.filter((item) => item.category === selectedCategory);

    render(filtered);
  }

  chips.forEach((chip) => {
    chip.addEventListener('click', () => {
      selectedCategory = chip.getAttribute('data-category') || 'all';
      chips.forEach((btn) => btn.classList.toggle('active', btn === chip));
      applyFilter();
    });
  });

  applyFilter();
})();
