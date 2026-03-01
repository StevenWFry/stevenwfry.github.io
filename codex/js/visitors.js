(() => {
  const doc = document;
  const logBody = doc.getElementById('visitorLogBody');
  if (!logBody) return;

  const recordCountEl = doc.getElementById('visitorRecordCount');
  const uniqueIpsEl = doc.getElementById('visitorUniqueIps');
  const uniqueFingerprintsEl = doc.getElementById('visitorUniqueFingerprints');
  const lastSeenEl = doc.getElementById('visitorLastSeen');
  const emptyStateEl = doc.getElementById('visitorEmptyState');
  const sourceEl = doc.getElementById('visitorSource');
  const searchEl = doc.getElementById('visitorLogSearch');
  const exportBtn = doc.getElementById('exportVisitorLogBtn');
  const clearBtn = doc.getElementById('clearVisitorLogBtn');

  const storageKey = 'codex-visitor-log-v1';
  const apiUrl = (() => {
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

  let usingServer = false;
  let records = [];

  function setSource(text) {
    if (!sourceEl) return;
    sourceEl.textContent = `Storage source: ${text}`;
  }

  function loadLocalRecords() {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveRecords(records) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(records));
    } catch {
      // Ignore storage write failures and keep UI responsive.
    }
  }

  async function loadServerRecords() {
    if (window.location.protocol === 'file:') {
      throw new Error('file protocol has no API support');
    }

    const response = await fetch(`${apiUrl}?limit=5000`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (!payload || !Array.isArray(payload.records)) {
      throw new Error('invalid payload');
    }
    return payload.records;
  }

  function formatDate(value) {
    if (!value) return 'unknown';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleString();
  }

  function toText(value) {
    if (value === null || value === undefined || value === '') return 'unknown';
    return String(value);
  }

  function recordMatches(record, query) {
    if (!query) return true;
    const haystack = [
      record.recordedAt,
      record.ip,
      record.location,
      record.coords,
      record.browser,
      record.userAgent,
      record.os,
      record.device,
      record.language,
      record.timezone,
      record.viewport,
      record.screen,
      record.network,
      record.page,
      record.reason,
      record.referrer,
      record.fingerprint
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  }

  function renderTable(records, query = '') {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = records.filter((record) => recordMatches(record, normalizedQuery));

    logBody.innerHTML = '';

    if (!filtered.length) {
      if (emptyStateEl) {
        emptyStateEl.hidden = false;
        if (normalizedQuery) {
          emptyStateEl.textContent = `No records match "${query}".`;
        } else {
          emptyStateEl.innerHTML = usingServer
            ? 'No visitor records in the server file yet. Visit <a href="index.html">home</a> to capture one.'
            : 'No visitor records yet. Visit <a href="index.html">home</a> to capture one.';
        }
      }
      return;
    }

    if (emptyStateEl) emptyStateEl.hidden = true;

    filtered.forEach((record) => {
      const tr = doc.createElement('tr');
      const cells = [
        formatDate(record.recordedAt),
        toText(record.ip),
        toText(record.location),
        toText(record.coords),
        toText(record.browser),
        toText(record.os),
        toText(record.device),
        toText(record.language),
        toText(record.timezone),
        toText(record.viewport),
        toText(record.screen),
        toText(record.network),
        toText(record.page),
        toText(record.reason),
        toText(record.referrer),
        toText(record.userAgent)
      ];
      cells.forEach((value) => {
        const td = doc.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });
      logBody.appendChild(tr);
    });
  }

  function updateSummary(records) {
    if (recordCountEl) recordCountEl.textContent = String(records.length);

    const uniqueIps = new Set(
      records
        .map((record) => record.ip)
        .filter((ip) => ip && ip !== 'unknown' && ip !== 'unavailable')
    );
    if (uniqueIpsEl) uniqueIpsEl.textContent = String(uniqueIps.size);

    const uniqueFingerprints = new Set(
      records
        .map((record) => record.fingerprint)
        .filter(Boolean)
    );
    if (uniqueFingerprintsEl) uniqueFingerprintsEl.textContent = String(uniqueFingerprints.size);

    if (lastSeenEl) {
      const latest = records[0];
      lastSeenEl.textContent = latest ? formatDate(latest.recordedAt) : 'none';
    }
  }

  function sortRecords(records) {
    return records
      .slice()
      .sort((a, b) => new Date(b.recordedAt || 0).getTime() - new Date(a.recordedAt || 0).getTime());
  }

  async function clearServerRecords() {
    const response = await fetch(apiUrl, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
  }

  async function initialize() {
    try {
      records = sortRecords(await loadServerRecords());
      usingServer = true;
      setSource(`server file via ${apiUrl}`);
      saveRecords(records);
    } catch {
      records = sortRecords(loadLocalRecords());
      usingServer = false;
      setSource('browser localStorage (API unavailable)');
    }

    updateSummary(records);
    renderTable(records);
  }

  if (searchEl) {
    searchEl.addEventListener('input', () => {
      renderTable(records, searchEl.value || '');
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const payload = JSON.stringify(records, null, 2);
      const blob = new Blob([payload], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = doc.createElement('a');
      const stamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.href = url;
      link.download = `codex-visitor-log-${stamp}.json`;
      doc.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', async () => {
      const message = usingServer
        ? 'Delete all stored visitor records from the server file and local cache?'
        : 'Delete all stored visitor records from this browser?';
      const ok = window.confirm(message);
      if (!ok) return;

      if (usingServer) {
        try {
          await clearServerRecords();
        } catch {
          window.alert('Could not clear server file. Is codex/server.py running?');
          return;
        }
      }

      records = [];
      localStorage.removeItem(storageKey);
      updateSummary(records);
      renderTable(records, searchEl ? searchEl.value || '' : '');
    });
  }

  initialize();
})();
