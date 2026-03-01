// Daily SWF name rotation
const swfNames = [
  ["Steven",       "William",    "Fry"],
  ["Sudo",         "Wget",       "Fedora"],
  ["Shell",        "Wrangler",   "Forever"],
  ["Somehow",      "Works",      "Fine"],
  ["Still",        "Working",    "Frantically"],
  ["Suspicious",   "Wireshark",  "Fan"],
  ["Symlink",      "Wizard",     "Forever"],
  ["Syntax",       "Warning",    "Found"],
  ["Script",       "Writing",    "Fiend"],
  ["Seriously",    "Weird",      "Fonts"],
  ["Strictly",     "Vanilla",    "Fedora"],
  ["Sometimes",    "Works",      "Fridays"],
  ["Sending",      "Weird",      "Files"],
  ["Static",       "Website",    "Fan"],
  ["Skeleton",     "With",       "Fingers"],
];
const [s, w, f] = swfNames[Math.floor(Date.now() / 86400000) % swfNames.length];
document.getElementById('swf-s').textContent = s;
document.getElementById('swf-w').textContent = w;
document.getElementById('swf-f').textContent = f;

const postCountEl = document.getElementById('post-count');
if (postCountEl) {
  const featuredPosts = document.querySelectorAll('#writing .post-featured[href]:not(.post-item--soon)').length;
  const listedPosts = document.querySelectorAll('#writing .post-list .post-item[href]:not(.post-item--soon)').length;
  postCountEl.textContent = String(featuredPosts + listedPosts);
}

const visitorIpEl = document.getElementById('visitor-ip');
if (visitorIpEl) {
  const visitorLocationEl = document.getElementById('visitor-location');
  const visitorCoordsEl = document.getElementById('visitor-coords');
  const visitorBrowserEl = document.getElementById('visitor-browser');
  const visitorUserAgentEl = document.getElementById('visitor-user-agent');
  const visitorOsEl = document.getElementById('visitor-os');
  const visitorDeviceEl = document.getElementById('visitor-device');
  const visitorLanguageEl = document.getElementById('visitor-language');
  const visitorTimezoneEl = document.getElementById('visitor-timezone');
  const visitorViewportEl = document.getElementById('visitor-viewport');
  const visitorScreenEl = document.getElementById('visitor-screen');
  const visitorNetworkEl = document.getElementById('visitor-network');
  const visitorRefreshBtn = document.getElementById('visitor-refresh-btn');

  const ua = navigator.userAgent || '';

  const detectBrowser = () => {
    if (/Edg\//.test(ua)) return 'Edge';
    if (/OPR\//.test(ua)) return 'Opera';
    if (/Chrome\//.test(ua) && !/Edg\//.test(ua) && !/OPR\//.test(ua)) return 'Chrome';
    if (/Firefox\//.test(ua)) return 'Firefox';
    if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari';
    return 'Unknown';
  };

  const detectOs = () => {
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

  const fetchJson = async (url, timeoutMs = 4500) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  };

  const loadPublicIpAndGeo = async () => {
    visitorIpEl.textContent = 'loading...';
    if (visitorLocationEl) visitorLocationEl.textContent = 'loading...';
    if (visitorCoordsEl) visitorCoordsEl.textContent = 'loading...';

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
      } else if (visitorCoordsEl) {
        visitorCoordsEl.textContent = 'unavailable';
      }
    } catch {
      if (visitorLocationEl) visitorLocationEl.textContent = 'unavailable';
      if (visitorCoordsEl) visitorCoordsEl.textContent = 'unavailable';
    }
  };

  if (visitorBrowserEl) visitorBrowserEl.textContent = detectBrowser();
  if (visitorUserAgentEl) visitorUserAgentEl.textContent = ua || 'unavailable';
  if (visitorOsEl) visitorOsEl.textContent = detectOs();
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
  loadPublicIpAndGeo();

  window.addEventListener('resize', updateViewportInfo);
  window.addEventListener('online', updateNetworkInfo);
  window.addEventListener('offline', updateNetworkInfo);

  if (visitorRefreshBtn) {
    visitorRefreshBtn.addEventListener('click', () => {
      updateViewportInfo();
      updateNetworkInfo();
      loadPublicIpAndGeo();
    });
  }
}

const tickerInner = document.querySelector('.ticker-inner');
if (tickerInner) {
  const tickerItems = Array.from(tickerInner.querySelectorAll('.ticker-item'));
  const firstLoopCount = Math.floor(tickerItems.length / 2);
  let resizeTimer;

  const syncTickerLoop = () => {
    if (firstLoopCount === 0) return;
    const firstLoopWidth = tickerItems
      .slice(0, firstLoopCount)
      .reduce((total, item) => total + item.getBoundingClientRect().width, 0);
    if (firstLoopWidth <= 0) return;

    tickerInner.style.setProperty('--ticker-loop-width', `${Math.round(firstLoopWidth)}px`);
    const pxPerSecond = 70;
    const duration = Math.max(16, firstLoopWidth / pxPerSecond);
    tickerInner.style.setProperty('--ticker-duration', `${duration.toFixed(2)}s`);
  };

  syncTickerLoop();

  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(syncTickerLoop, 120);
  });

  window.addEventListener('load', syncTickerLoop, { once: true });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(syncTickerLoop).catch(() => {});
  }
}
