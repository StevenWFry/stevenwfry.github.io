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
