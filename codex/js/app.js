(() => {
  const doc = document;
  const root = doc.documentElement;

  const themeCycleButtons = doc.querySelectorAll('[data-theme-cycle]');
  const themes = [
    { key: 'sunrise', label: 'Sunrise' },
    { key: 'ocean', label: 'Ocean' },
    { key: 'graphite', label: 'Graphite' }
  ];

  function getThemeIndex(key) {
    const idx = themes.findIndex((t) => t.key === key);
    return idx >= 0 ? idx : 0;
  }

  function applyTheme(key) {
    root.setAttribute('data-theme', key);
    localStorage.setItem('codex-theme', key);
    const selected = themes[getThemeIndex(key)];
    themeCycleButtons.forEach((btn) => {
      btn.textContent = `Theme: ${selected.label}`;
    });
  }

  const storedTheme = localStorage.getItem('codex-theme');
  applyTheme(storedTheme || root.getAttribute('data-theme') || 'sunrise');

  themeCycleButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') || 'sunrise';
      const nextIdx = (getThemeIndex(current) + 1) % themes.length;
      applyTheme(themes[nextIdx].key);
    });
  });

  const menuToggle = doc.getElementById('menuToggle');
  const siteNav = doc.getElementById('siteNav');

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = siteNav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
    });

    siteNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        siteNav.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  const progress = doc.getElementById('scrollProgress');
  if (progress) {
    const updateProgress = () => {
      const max = doc.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      progress.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  const revealEls = doc.querySelectorAll('.reveal');
  if (revealEls.length) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach((el) => observer.observe(el));
  }

  function setCopied(button, successText = 'copied') {
    const original = button.dataset.originalLabel || button.textContent;
    button.dataset.originalLabel = original;
    button.textContent = successText;
    setTimeout(() => {
      button.textContent = original;
    }, 1300);
  }

  async function copyText(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      if (button) setCopied(button, 'copied');
    } catch {
      if (button) setCopied(button, 'copy failed');
    }
  }

  doc.querySelectorAll('[data-copy-text]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const text = btn.getAttribute('data-copy-text') || '';
      copyText(text, btn);
    });
  });

  doc.querySelectorAll('[data-copy-target]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const block = btn.closest('.code-block');
      const pre = block ? block.querySelector('pre') : null;
      if (!pre) return;
      copyText(pre.innerText, btn);
    });
  });

  const challengeText = doc.getElementById('challengeText');
  const newChallengeBtn = doc.getElementById('newChallengeBtn');
  const challenges = [
    'Build a shell alias file with at least 8 aliases and 2 helper functions.',
    'Set up a tiny Flask or Express app and containerize it with a minimal Dockerfile.',
    'Create a Git branch, make 3 focused commits, then squash into one clean commit.',
    'Spin up a VM and intentionally break package mirrors, then recover them.',
    'Write a script that finds your 20 largest files and outputs a cleanup plan.',
    'Add a command palette to a static site with keyboard navigation and filter search.',
    'Configure SSH for two GitHub identities and verify both with host aliases.',
    'Draft a rollback plan before your next big refactor and test it once.'
  ];

  function setRandomChallenge() {
    if (!challengeText) return;
    const item = challenges[Math.floor(Math.random() * challenges.length)];
    challengeText.textContent = item;
  }

  if (challengeText) {
    setRandomChallenge();
    if (newChallengeBtn) {
      newChallengeBtn.addEventListener('click', setRandomChallenge);
    }
  }

  const swfS = doc.getElementById('swf-s');
  const swfW = doc.getElementById('swf-w');
  const swfF = doc.getElementById('swf-f');
  if (swfS && swfW && swfF) {
    const swfNames = [
      ['Sudo', 'Wget', 'Fedora'],
      ['Shell', 'Wrangler', 'Forever'],
      ['Somehow', 'Works', 'Fine'],
      ['Still', 'Working', 'Frantically'],
      ['Suspicious', 'Wireshark', 'Fan'],
      ['Symlink', 'Wizard', 'Forever'],
      ['Syntax', 'Warning', 'Found'],
      ['Script', 'Writing', 'Fiend'],
      ['Seriously', 'Weird', 'Fonts'],
      ['Strictly', 'Vanilla', 'Fedora'],
      ['Sometimes', 'Works', 'Fridays'],
      ['Sending', 'Weird', 'Files'],
      ['Static', 'Website', 'Fan'],
      ['Skeleton', 'With', 'Fingers']
    ];
    const dayIndex = Math.floor(Date.now() / 86400000) % swfNames.length;
    const [s, w, f] = swfNames[dayIndex];
    swfS.textContent = s;
    swfW.textContent = w;
    swfF.textContent = f;
  }

  const codexPostCount = doc.getElementById('codexPostCount');
  if (codexPostCount) {
    const featured = doc.querySelectorAll('.blog-feature[href]').length;
    const listed = doc.querySelectorAll('#codexPostRail .post-row[href]').length;
    codexPostCount.textContent = String(featured + listed);
  }

  const visitorIpEl = doc.getElementById('visitorIp');
  if (visitorIpEl) {
    const visitorLocationEl = doc.getElementById('visitorLocation');
    const visitorCoordsEl = doc.getElementById('visitorCoords');
    const visitorBrowserEl = doc.getElementById('visitorBrowser');
    const visitorUserAgentEl = doc.getElementById('visitorUserAgent');
    const visitorOSEl = doc.getElementById('visitorOS');
    const visitorDeviceEl = doc.getElementById('visitorDevice');
    const visitorLanguageEl = doc.getElementById('visitorLanguage');
    const visitorTimezoneEl = doc.getElementById('visitorTimezone');
    const visitorViewportEl = doc.getElementById('visitorViewport');
    const visitorScreenEl = doc.getElementById('visitorScreen');
    const visitorNetworkEl = doc.getElementById('visitorNetwork');
    const geolocateBtn = doc.getElementById('geolocateBtn');
    const refreshVisitorBtn = doc.getElementById('refreshVisitorBtn');
    const visitorLogStorageKey = 'codex-visitor-log-v1';
    const visitorLogLimit = 400;
    const visitorApiUrl = (() => {
      const path = window.location.pathname || '';
      const marker = '/codex/';
      const markerIndex = path.indexOf(marker);
      if (markerIndex >= 0) {
        return `${path.slice(0, markerIndex)}/codex/api/visitors`;
      }
      if (path === '/codex' || path.endsWith('/codex')) {
        return `${path}/api/visitors`;
      }
      return '/api/visitors';
    })();

    const ua = navigator.userAgent || '';

    const detectBrowser = () => {
      if (/Edg\//.test(ua)) return 'Edge';
      if (/OPR\//.test(ua)) return 'Opera';
      if (/Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua)) return 'Chrome';
      if (/Firefox\//.test(ua)) return 'Firefox';
      if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
      return 'Unknown';
    };

    const detectOS = () => {
      if (/Windows NT/.test(ua)) return 'Windows';
      if (/Mac OS X/.test(ua) && !/iPhone|iPad/.test(ua)) return 'macOS';
      if (/iPhone|iPad|iPod/.test(ua)) return 'iOS';
      if (/Android/.test(ua)) return 'Android';
      if (/Linux/.test(ua)) return 'Linux';
      return 'Unknown';
    };

    const detectDevice = () => {
      if (/iPad|Tablet/.test(ua)) return 'Tablet';
      if (/Mobi|Android/.test(ua)) return 'Mobile';
      const touch = navigator.maxTouchPoints && navigator.maxTouchPoints > 0;
      return touch ? 'Touch laptop/desktop' : 'Desktop';
    };

    const updateViewportInfo = () => {
      if (visitorViewportEl) visitorViewportEl.textContent = `${window.innerWidth}x${window.innerHeight}`;
      if (visitorScreenEl) visitorScreenEl.textContent = `${window.screen.width}x${window.screen.height} @ ${window.devicePixelRatio || 1}x`;
    };

    const updateNetworkInfo = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (!visitorNetworkEl) return;
      if (!navigator.onLine) {
        visitorNetworkEl.textContent = 'offline';
        return;
      }
      if (!connection) {
        visitorNetworkEl.textContent = 'online';
        return;
      }
      const type = connection.effectiveType || 'unknown';
      const downlink = connection.downlink ? `${connection.downlink}Mbps` : '?Mbps';
      visitorNetworkEl.textContent = `${type} ${downlink}`;
    };

    const readVisitorLog = () => {
      try {
        const raw = localStorage.getItem(visitorLogStorageKey);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    };

    const writeVisitorLog = (records) => {
      try {
        localStorage.setItem(visitorLogStorageKey, JSON.stringify(records));
      } catch {
        // Keep page behavior stable even if storage quota fails.
      }
    };

    const writeVisitorLogRemote = async (record) => {
      if (window.location.protocol === 'file:') return;
      try {
        await fetch(visitorApiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(record),
          keepalive: true
        });
      } catch {
        // API may be unavailable (e.g. static hosting); localStorage remains fallback.
      }
    };

    const valueFrom = (el, fallback = 'unknown') => {
      if (!el || typeof el.textContent !== 'string') return fallback;
      const text = el.textContent.trim();
      return text || fallback;
    };

    const storeVisitorRecord = (reason) => {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
      const ip = valueFrom(visitorIpEl);
      const browser = detectBrowser();
      const os = detectOS();
      const record = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        recordedAt: new Date().toISOString(),
        page: window.location.pathname || 'unknown',
        reason: reason || 'auto',
        referrer: doc.referrer || 'direct',
        ip,
        location: valueFrom(visitorLocationEl),
        coords: valueFrom(visitorCoordsEl),
        browser,
        userAgent: ua || 'unknown',
        os,
        device: valueFrom(visitorDeviceEl),
        language: valueFrom(visitorLanguageEl),
        timezone: valueFrom(visitorTimezoneEl, timezone),
        viewport: valueFrom(visitorViewportEl, `${window.innerWidth}x${window.innerHeight}`),
        screen: valueFrom(visitorScreenEl, `${window.screen.width}x${window.screen.height}`),
        network: valueFrom(visitorNetworkEl),
        fingerprint: `${ip}|${browser}|${os}|${timezone}|${ua}`
      };

      const next = readVisitorLog();
      next.push(record);
      if (next.length > visitorLogLimit) {
        next.splice(0, next.length - visitorLogLimit);
      }
      writeVisitorLog(next);
      void writeVisitorLogRemote(record);
    };

    const fetchJson = async (url, timeoutMs = 4500) => {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
      } finally {
        clearTimeout(timer);
      }
    };

    const loadPublicIpAndGeo = async (reason = 'initial') => {
      visitorIpEl.textContent = 'loading…';
      if (visitorLocationEl) visitorLocationEl.textContent = 'loading…';

      try {
        const ipData = await fetchJson('https://api.ipify.org?format=json');
        visitorIpEl.textContent = ipData.ip || 'unavailable';
      } catch {
        visitorIpEl.textContent = 'unavailable';
      }

      try {
        const geoData = await fetchJson('https://ipapi.co/json/');
        const city = geoData.city || '';
        const region = geoData.region || '';
        const country = geoData.country_name || geoData.country || '';
        const parts = [city, region, country].filter(Boolean);
        if (visitorLocationEl) visitorLocationEl.textContent = parts.length ? parts.join(', ') : 'unavailable';

        if (visitorCoordsEl && geoData.latitude && geoData.longitude) {
          visitorCoordsEl.textContent = `${geoData.latitude}, ${geoData.longitude} (ip approx)`;
        }
      } catch {
        if (visitorLocationEl) visitorLocationEl.textContent = 'unavailable';
        if (visitorCoordsEl && visitorCoordsEl.textContent === 'waiting…') {
          visitorCoordsEl.textContent = 'unavailable';
        }
      }

      storeVisitorRecord(reason);
    };

    if (visitorBrowserEl) visitorBrowserEl.textContent = detectBrowser();
    if (visitorUserAgentEl) visitorUserAgentEl.textContent = ua || 'unavailable';
    if (visitorOSEl) visitorOSEl.textContent = detectOS();
    if (visitorDeviceEl) {
      const cpu = navigator.hardwareConcurrency ? `, ${navigator.hardwareConcurrency} threads` : '';
      const mem = navigator.deviceMemory ? `, ${navigator.deviceMemory}GB mem` : '';
      visitorDeviceEl.textContent = `${detectDevice()}${cpu}${mem}`;
    }
    if (visitorLanguageEl) {
      const langs = (navigator.languages && navigator.languages.length)
        ? navigator.languages.slice(0, 3).join(', ')
        : (navigator.language || 'unknown');
      visitorLanguageEl.textContent = langs;
    }
    if (visitorTimezoneEl) {
      visitorTimezoneEl.textContent = Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown';
    }

    updateViewportInfo();
    updateNetworkInfo();
    loadPublicIpAndGeo('initial-load');

    window.addEventListener('resize', updateViewportInfo);
    window.addEventListener('online', updateNetworkInfo);
    window.addEventListener('offline', updateNetworkInfo);

    if (geolocateBtn) {
      if (!navigator.geolocation) {
        geolocateBtn.disabled = true;
        geolocateBtn.textContent = 'geolocation unavailable';
      } else {
        geolocateBtn.addEventListener('click', () => {
          geolocateBtn.disabled = true;
          geolocateBtn.textContent = 'locating…';
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const { latitude, longitude, accuracy } = position.coords;
              if (visitorCoordsEl) visitorCoordsEl.textContent = `${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(accuracy)}m)`;
              storeVisitorRecord('precise-geolocation');
              geolocateBtn.textContent = 'location updated';
              setTimeout(() => {
                geolocateBtn.disabled = false;
                geolocateBtn.textContent = 'request precise geolocation';
              }, 1200);
            },
            () => {
              geolocateBtn.disabled = false;
              geolocateBtn.textContent = 'geolocation blocked';
              setTimeout(() => {
                geolocateBtn.textContent = 'request precise geolocation';
              }, 1500);
            },
            { enableHighAccuracy: false, timeout: 8000, maximumAge: 60000 }
          );
        });
      }
    }

    if (refreshVisitorBtn) {
      refreshVisitorBtn.addEventListener('click', () => {
        loadPublicIpAndGeo('manual-refresh');
        updateViewportInfo();
        updateNetworkInfo();
      });
    }
  }

  const startupTasks = Array.from(doc.querySelectorAll('[data-start-task]'));
  const startupDone = doc.getElementById('startupDone');
  const resetChecklistBtn = doc.getElementById('resetChecklistBtn');
  const checklistStorageKey = 'codex-startup-checklist-v1';

  if (startupTasks.length) {
    let checklistState = {};
    const raw = localStorage.getItem(checklistStorageKey);
    if (raw) {
      try {
        checklistState = JSON.parse(raw) || {};
      } catch {
        checklistState = {};
      }
    }

    const syncChecklistStat = () => {
      const done = startupTasks.filter((task) => task.checked).length;
      if (startupDone) startupDone.textContent = String(done);
    };

    const persistChecklist = () => {
      const next = {};
      startupTasks.forEach((task) => {
        const key = task.getAttribute('data-start-task');
        if (!key) return;
        next[key] = task.checked;
      });
      localStorage.setItem(checklistStorageKey, JSON.stringify(next));
      syncChecklistStat();
    };

    startupTasks.forEach((task) => {
      const key = task.getAttribute('data-start-task');
      if (key && checklistState[key]) {
        task.checked = true;
      }
      task.addEventListener('change', persistChecklist);
    });

    if (resetChecklistBtn) {
      resetChecklistBtn.addEventListener('click', () => {
        startupTasks.forEach((task) => {
          task.checked = false;
        });
        localStorage.removeItem(checklistStorageKey);
        syncChecklistStat();
      });
    }

    syncChecklistStat();
  }

  const paletteBackdrop = doc.getElementById('commandPalette');
  const commandInput = doc.getElementById('commandInput');
  const commandList = doc.getElementById('commandList');
  const openButtons = doc.querySelectorAll('[data-command-open]');
  const closeButton = doc.querySelector('[data-command-close]');

  const page = doc.body.dataset.page || 'home';

  const commandSet = [
    {
      label: 'Go to Home',
      hint: 'navigation',
      keywords: 'home index main',
      run: () => { window.location.href = 'index.html'; }
    },
    {
      label: 'Go to Guides',
      hint: 'navigation',
      keywords: 'guides howto tutorial',
      run: () => { window.location.href = 'guides.html'; }
    },
    {
      label: 'Go to Resources',
      hint: 'navigation',
      keywords: 'resources docs links',
      run: () => { window.location.href = 'resources.html'; }
    },
    {
      label: 'Go to Mirror Explorer',
      hint: 'navigation',
      keywords: 'mirror explorer sitemap pages',
      run: () => { window.location.href = 'explorer.html'; }
    },
    {
      label: 'Go to Visitor Log',
      hint: 'navigation',
      keywords: 'visitors telemetry tracking log',
      run: () => { window.location.href = 'visitors.html'; }
    },
    {
      label: 'Go to About',
      hint: 'navigation',
      keywords: 'about manifesto',
      run: () => { window.location.href = 'about.html'; }
    },
    {
      label: 'Cycle Theme',
      hint: 'ui',
      keywords: 'theme color palette',
      run: () => {
        const current = root.getAttribute('data-theme') || 'sunrise';
        const nextIdx = (getThemeIndex(current) + 1) % themes.length;
        applyTheme(themes[nextIdx].key);
      }
    },
    {
      label: 'Scroll to Top',
      hint: 'ui',
      keywords: 'top beginning scroll',
      run: () => { window.scrollTo({ top: 0, behavior: 'smooth' }); }
    },
    {
      label: 'Open Mirrored Home',
      hint: 'mirror',
      keywords: 'mirror home original copy',
      run: () => { window.location.href = 'mirror/index.html'; }
    }
  ];

  if (page === 'guides') {
    commandSet.push(
      {
        label: 'Jump to AI Workflow Guide',
        hint: 'guide',
        keywords: 'ai workflow cowork claude codex',
        run: () => { window.location.hash = 'guide-ai-workflow'; }
      },
      {
        label: 'Jump to Git Safety Guide',
        hint: 'guide',
        keywords: 'git reflog safety',
        run: () => { window.location.hash = 'guide-git-safety'; }
      }
    );
  }

  if (page === 'resources') {
    commandSet.push({
      label: 'Open ArchWiki',
      hint: 'external',
      keywords: 'archwiki docs linux',
      run: () => { window.open('https://wiki.archlinux.org/', '_blank', 'noopener'); }
    });
  }

  if (page === 'explorer') {
    commandSet.push(
      {
        label: 'Open Mirrored Guides',
        hint: 'mirror',
        keywords: 'mirror guides full copy',
        run: () => { window.location.href = 'mirror/guides/index.html'; }
      },
      {
        label: 'Open Mirrored SQL Guide',
        hint: 'mirror',
        keywords: 'mirror sql chapters oracle mysql',
        run: () => { window.location.href = 'mirror/guides/sql-guide/index.html'; }
      },
      {
        label: 'Open Mirrored Blog',
        hint: 'mirror',
        keywords: 'mirror blog posts',
        run: () => { window.location.href = 'mirror/blog/index.html'; }
      }
    );
  }

  if (page === 'visitors') {
    commandSet.push(
      {
        label: 'Export Visitor Log JSON',
        hint: 'visitors',
        keywords: 'visitor export json download',
        run: () => { doc.getElementById('exportVisitorLogBtn')?.click(); }
      },
      {
        label: 'Clear Visitor Log',
        hint: 'visitors',
        keywords: 'visitor clear reset delete log',
        run: () => { doc.getElementById('clearVisitorLogBtn')?.click(); }
      }
    );
  }

  let filtered = [...commandSet];
  let activeIndex = 0;

  function renderCommands() {
    if (!commandList) return;
    commandList.innerHTML = '';

    if (!filtered.length) {
      const li = doc.createElement('li');
      li.innerHTML = '<button class="command-item" type="button" disabled>No matching commands</button>';
      commandList.appendChild(li);
      return;
    }

    filtered.forEach((command, idx) => {
      const li = doc.createElement('li');
      const btn = doc.createElement('button');
      btn.type = 'button';
      btn.className = `command-item${idx === activeIndex ? ' active' : ''}`;
      btn.innerHTML = `<span>${command.label}</span><small>${command.hint}</small>`;
      btn.addEventListener('click', () => {
        command.run();
        closePalette();
      });
      li.appendChild(btn);
      commandList.appendChild(li);
    });
  }

  function filterCommands(query) {
    const q = query.trim().toLowerCase();
    filtered = !q
      ? [...commandSet]
      : commandSet.filter((command) => {
          const haystack = `${command.label} ${command.keywords} ${command.hint}`.toLowerCase();
          return haystack.includes(q);
        });
    activeIndex = 0;
    renderCommands();
  }

  function openPalette() {
    if (!paletteBackdrop || !commandInput) return;
    paletteBackdrop.hidden = false;
    filterCommands(commandInput.value || '');
    requestAnimationFrame(() => commandInput.focus());
    doc.body.style.overflow = 'hidden';
  }

  function closePalette() {
    if (!paletteBackdrop || !commandInput) return;
    paletteBackdrop.hidden = true;
    commandInput.value = '';
    doc.body.style.overflow = '';
  }

  openButtons.forEach((btn) => btn.addEventListener('click', openPalette));
  if (closeButton) closeButton.addEventListener('click', closePalette);

  if (paletteBackdrop) {
    paletteBackdrop.addEventListener('click', (event) => {
      if (event.target === paletteBackdrop) closePalette();
    });
  }

  if (commandInput) {
    commandInput.addEventListener('input', (event) => {
      filterCommands(event.target.value);
    });

    commandInput.addEventListener('keydown', (event) => {
      if (!filtered.length) return;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        activeIndex = (activeIndex + 1) % filtered.length;
        renderCommands();
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        activeIndex = (activeIndex - 1 + filtered.length) % filtered.length;
        renderCommands();
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        const selected = filtered[activeIndex];
        if (!selected) return;
        selected.run();
        closePalette();
      }

      if (event.key === 'Escape') {
        closePalette();
      }
    });
  }

  doc.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      openPalette();
    }

    if (event.key === 'Escape' && paletteBackdrop && !paletteBackdrop.hidden) {
      closePalette();
    }
  });
})();
