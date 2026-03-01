(() => {
  const guideGrid = document.getElementById('guideGrid');
  const guideCount = document.getElementById('guideCount');
  const searchInput = document.getElementById('guideSearch');
  const levelButtons = document.querySelectorAll('[data-level]');

  if (!guideGrid || !guideCount) return;

  const guides = [
    {
      title: 'Terminal-First Dev Environment',
      level: 'beginner',
      time: '20 min',
      desc: 'Build a practical shell stack: search, navigation, diff tooling, and sane aliases.',
      tags: ['terminal', 'zsh', 'productivity'],
      link: '#guide-terminal'
    },
    {
      title: 'AI Agent Workflow with Guardrails',
      level: 'intermediate',
      time: '18 min',
      desc: 'Plan in chat mode, execute in workspace mode, then close with test and review loops.',
      tags: ['ai', 'agents', 'claude', 'codex'],
      link: '#guide-ai-workflow'
    },
    {
      title: 'Git Safety Before Refactors',
      level: 'beginner',
      time: '12 min',
      desc: 'Use branch checkpoints, clean commits, and reflog recovery before risky edits.',
      tags: ['git', 'reflog', 'recovery'],
      link: '#guide-git-safety'
    },
    {
      title: 'Linux VM Lab for Fast Learning',
      level: 'beginner',
      time: '15 min',
      desc: 'Set up a low-risk VM routine to practice real recovery scenarios.',
      tags: ['linux', 'vm', 'virtualbox'],
      link: '#guide-vm-lab'
    },
    {
      title: 'Arch Linux on VirtualBox (Omarchy-style)',
      level: 'advanced',
      time: '45+ min',
      desc: 'Deep install flow with bootloader, encryption, and structured disk layout.',
      tags: ['arch', 'virtualbox', 'install'],
      link: 'mirror/guides/arch-linux-virtualbox-omarchy/index.html'
    },
    {
      title: 'GitHub SSH Keys on Linux',
      level: 'beginner',
      time: '14 min',
      desc: 'Set up ed25519 keys and ssh-agent so pushes stop asking for passwords.',
      tags: ['ssh', 'github', 'linux'],
      link: 'mirror/guides/github-ssh-linux/index.html'
    },
    {
      title: 'Neovim for Beginners',
      level: 'intermediate',
      time: '30 min',
      desc: 'Build movement fluency and daily editing patterns that compound over time.',
      tags: ['neovim', 'editor', 'terminal'],
      link: 'mirror/guides/neovim-beginners/index.html'
    },
    {
      title: 'Linux Downloads Index',
      level: 'beginner',
      time: '6 min',
      desc: 'A curated distro list for picking the right starting point quickly.',
      tags: ['linux', 'distros', 'downloads'],
      link: 'mirror/guides/linux-downloads/index.html'
    }
  ];

  let selectedLevel = 'all';

  function render(list) {
    guideGrid.innerHTML = list.map((guide) => {
      const tags = guide.tags.map((tag) => `<span class="badge">${tag}</span>`).join('');
      const isExternal = !guide.link.startsWith('#');
      const extra = isExternal ? ' target="_blank" rel="noopener"' : '';

      return `
        <article class="guide-card">
          <h3>${guide.title}</h3>
          <div class="guide-meta">
            <span class="badge badge-level">${guide.level}</span>
            <span class="badge badge-time">${guide.time}</span>
            ${tags}
          </div>
          <p>${guide.desc}</p>
          <a href="${guide.link}"${extra}>open guide</a>
        </article>
      `;
    }).join('');

    const total = list.length;
    guideCount.textContent = `// ${total} guide${total === 1 ? '' : 's'} shown`;
  }

  function applyFilters() {
    const query = (searchInput?.value || '').trim().toLowerCase();

    const filtered = guides.filter((guide) => {
      const levelMatch = selectedLevel === 'all' || guide.level === selectedLevel;
      if (!levelMatch) return false;

      if (!query) return true;

      const searchable = `${guide.title} ${guide.desc} ${guide.tags.join(' ')}`.toLowerCase();
      return searchable.includes(query);
    });

    render(filtered);
  }

  levelButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      selectedLevel = btn.getAttribute('data-level') || 'all';
      levelButtons.forEach((chip) => chip.classList.toggle('active', chip === btn));
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener('input', applyFilters);
  }

  applyFilters();
})();
