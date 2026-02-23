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
