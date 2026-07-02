/* ==========================================================================
   KILL -9 — a terminal typing defender for swf.wtf
   Rogue processes fall toward your kernel; type their names to stop them.
   One canvas, synthesized sound, zero dependencies. Written with Claude
   Fable 5 in its final days of service, July 2026.
   ========================================================================== */
(() => {
  "use strict";

  // ---- stage ------------------------------------------------------------
  const cv = document.getElementById("game");
  const cx = cv.getContext("2d");
  const overlays = {
    start: document.getElementById("start"),
    pause: document.getElementById("pause"),
    over: document.getElementById("over"),
  };
  const MONO = '"Martian Mono", "IBM Plex Mono", ui-monospace, Menlo, monospace';
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  let W = 0, H = 0, KERNEL_Y = 0;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = cv.width = Math.round(innerWidth * dpr);
    H = cv.height = Math.round(innerHeight * dpr);
    KERNEL_Y = H - Math.max(70, H * 0.12);
  }
  addEventListener("resize", resize);
  resize();

  // ---- the process table ---------------------------------------------------
  const POOL = [
    // quick vermin
    "bug", "imp", "spam", "worm", "virus", "hexd", "ghost", "chaosd", "popupd",
    "gremlin", "zombied", "minerd", "phishd", "wormsig", "cursed.sh",
    // mid-tier daemons
    "forkbomb", "memleak", "trojand", "adware.sys", "rootkitd", "entropyd",
    "telemetryd", "keylogger", "segfaultd", "tracker.js", "malvertd",
    "bloatwared", "spyware.bin", "sudo-abuse", "nullptrd",
    // heavies (worth the keystrokes)
    "cryptominer", "botnet-agent", "cred-stealer", "kernel-panic",
    "infinite-loop", "packet-sniffer", "stackoverflowd", "ransomware.bin",
    "hypervisor-rootkit",
  ];

  // ---- state -----------------------------------------------------------------
  let state = "idle"; // idle | playing | paused | over
  let words, particles, floats, target;
  let score, combo, maxCombo, kills, typedOk, typedBad, leaks;
  let integrity, wave, spawnTimer, shake, slowmo, lastTime;

  const HS_KEY = "kill9-hiscore";
  const hiscore = () => parseInt(localStorage.getItem(HS_KEY) || "0", 10);

  function reset() {
    words = []; particles = []; floats = []; target = null;
    score = 0; combo = 0; maxCombo = 0; kills = 0;
    typedOk = 0; typedBad = 0; leaks = 0;
    integrity = 100; wave = 1; spawnTimer = 0.6; shake = 0; slowmo = 1;
  }

  const waveOf = () => Math.floor(kills / 10) + 1;
  const fallSpeed = () => (H * 0.032) * (1 + (wave - 1) * 0.22);
  const spawnEvery = () => Math.max(2.3 - (wave - 1) * 0.22, 0.75);
  const maxWords = () => Math.min(4 + wave, 10);

  // ---- audio: tiny synth -------------------------------------------------------
  let ac = null, master = null, noiseBuf = null, muted = false;

  function initAudio() {
    if (ac) return;
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain();
    master.gain.value = 0.5;
    master.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate / 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function blip(f0, f1, dur, vol, type = "square") {
    if (!ac) return;
    const t = ac.currentTime;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function burst(dur, vol, freq) {
    if (!ac) return;
    const t = ac.currentTime;
    const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
    s.buffer = noiseBuf;
    f.type = "bandpass"; f.frequency.value = freq; f.Q.value = 0.9;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(g).connect(master);
    s.start(t); s.stop(t + dur);
  }

  const sfx = {
    key: () => blip(1100, 900, 0.03, 0.05),
    kill: () => { blip(700, 90, 0.16, 0.14); burst(0.14, 0.12, 2600); },
    miss: () => blip(130, 90, 0.12, 0.12, "sawtooth"),
    leak: () => { blip(300, 60, 0.4, 0.18, "sawtooth"); burst(0.3, 0.1, 500); },
    wave: () => { blip(440, 0, 0.09, 0.1); setTimeout(() => blip(660, 0, 0.09, 0.1), 90); setTimeout(() => blip(880, 0, 0.14, 0.1), 180); },
    over: () => { blip(220, 40, 1.1, 0.2, "sawtooth"); burst(0.9, 0.14, 300); },
  };

  // ---- spawning -------------------------------------------------------------------
  function spawn() {
    // early waves lean short; later waves pull from the whole table
    const cap = Math.min(8 + wave * 3, 40);
    const pick = POOL.filter((w) => w.length <= cap);
    const text = pick[(Math.random() * pick.length) | 0];
    if (words.some((w) => w.text === text)) return;
    const fs = Math.max(14, Math.min(W, H) * 0.022);
    cx.font = `700 ${fs}px ${MONO}`;
    const tw = cx.measureText(text).width;
    words.push({
      text,
      typed: 0,
      x: 20 + Math.random() * Math.max(W - tw - 40, 1),
      y: -20,
      v: fallSpeed() * (0.85 + Math.random() * 0.4),
      fs,
      hot: text.length >= 11, // heavies render pink and pay double
    });
  }

  // ---- combat -----------------------------------------------------------------------
  function keyChar(ch) {
    if (state !== "playing") return;
    if (!target) {
      const candidates = words.filter((w) => w.text[0] === ch);
      if (!candidates.length) return miss();
      target = candidates.reduce((a, b) => (a.y > b.y ? a : b));
      target.typed = 1;
    } else if (target.text[target.typed] === ch) {
      target.typed++;
    } else {
      return miss();
    }
    typedOk++;
    sfx.key();
    if (target.typed >= target.text.length) kill(target);
  }

  function miss() {
    typedBad++;
    combo = 0;
    shake = Math.max(shake, reducedMotion ? 0 : 4);
    sfx.miss();
  }

  function kill(w) {
    words.splice(words.indexOf(w), 1);
    target = null;
    combo++;
    maxCombo = Math.max(maxCombo, combo);
    kills++;
    const pts = Math.round(w.text.length * 10 * (1 + combo / 10) * (w.hot ? 2 : 1));
    score += pts;
    sfx.kill();
    floats.push({ x: w.x, y: w.y, text: `+${pts}`, life: 0.9, color: w.hot ? "#ff4d6d" : "#00ff9d" });
    const n = reducedMotion ? 6 : 18;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = 60 + Math.random() * 220;
      particles.push({
        x: w.x + Math.random() * 60, y: w.y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        life: 0.5 + Math.random() * 0.5,
        color: w.hot ? "#ff4d6d" : ["#00ff9d", "#ffd60a"][i % 2],
      });
    }
    const newWave = waveOf();
    if (newWave > wave) {
      wave = newWave;
      sfx.wave();
      floats.push({ x: W / 2 - 60, y: H * 0.3, text: `WAVE ${String(wave).padStart(2, "0")}`, life: 1.6, color: "#ffd60a", big: true });
    }
  }

  function leak(w) {
    words.splice(words.indexOf(w), 1);
    if (target === w) target = null;
    leaks++;
    combo = 0;
    integrity -= 8 + w.text.length;
    shake = Math.max(shake, reducedMotion ? 0 : 10);
    sfx.leak();
    if (integrity <= 0) {
      integrity = 0;
      gameOver();
    }
  }

  // ---- flow --------------------------------------------------------------------------
  function setOverlay(name) {
    for (const key of Object.keys(overlays)) overlays[key].hidden = key !== name;
    if (name) overlays[name].classList.remove("hidden");
  }

  function startGame() {
    initAudio();
    ac.resume();
    reset();
    state = "playing";
    setOverlay(null);
    for (const key of Object.keys(overlays)) overlays[key].hidden = true;
  }

  function pauseGame() {
    if (state !== "playing") return;
    state = "paused";
    overlays.pause.hidden = false;
    if (ac) ac.suspend();
  }

  function resumeGame() {
    if (state !== "paused") return;
    state = "playing";
    overlays.pause.hidden = true;
    lastTime = 0;
    if (ac) ac.resume();
  }

  function quitToStart() {
    state = "idle";
    overlays.pause.hidden = true;
    overlays.start.hidden = false;
    updateHiscoreLine();
    if (ac) ac.resume();
  }

  function gameOver() {
    state = "over";
    slowmo = 0.25;
    sfx.over();
    const acc = typedOk + typedBad ? Math.round((typedOk / (typedOk + typedBad)) * 100) : 100;
    const best = Math.max(score, hiscore());
    const isNew = score > 0 && score >= best && score > hiscore();
    localStorage.setItem(HS_KEY, String(best));
    document.getElementById("stats").innerHTML =
      `<span class="k">score</span><span class="v${isNew ? " hi" : ""}">${score}${isNew ? " — new high!" : ""}</span>` +
      `<span class="k">high score</span><span class="v">${best}</span>` +
      `<span class="k">processes killed</span><span class="v">${kills}</span>` +
      `<span class="k">best combo</span><span class="v">×${maxCombo}</span>` +
      `<span class="k">accuracy</span><span class="v">${acc}%</span>` +
      `<span class="k">wave reached</span><span class="v">${String(wave).padStart(2, "0")}</span>`;
    setTimeout(() => { overlays.over.hidden = false; }, 900);
  }

  function updateHiscoreLine() {
    document.getElementById("hiscore-line").textContent = `high score: ${hiscore()}`;
  }
  updateHiscoreLine();

  // ---- render ------------------------------------------------------------------------
  function drawBackground(t) {
    cx.fillStyle = "#080b0f";
    cx.fillRect(0, 0, W, H);
    // faint drifting grid
    cx.strokeStyle = "rgba(0,255,157,0.045)";
    cx.lineWidth = 1;
    const g = Math.max(40, H * 0.07);
    const oy = (t * 12) % g;
    cx.beginPath();
    for (let y = -g + oy; y < H; y += g) { cx.moveTo(0, y); cx.lineTo(W, y); }
    for (let x = 0; x < W; x += g) { cx.moveTo(x, 0); cx.lineTo(x, H); }
    cx.stroke();
  }

  function drawKernel(t) {
    const pulse = 0.5 + Math.sin(t * 3) * 0.15;
    cx.strokeStyle = integrity > 30 ? `rgba(0,255,157,${pulse})` : `rgba(255,77,109,${pulse + 0.2})`;
    cx.lineWidth = 2;
    cx.setLineDash([10, 6]);
    cx.beginPath();
    cx.moveTo(0, KERNEL_Y);
    cx.lineTo(W, KERNEL_Y);
    cx.stroke();
    cx.setLineDash([]);

    const fs = Math.max(11, H * 0.016);
    cx.font = `400 ${fs}px ${MONO}`;
    cx.textAlign = "left";
    cx.textBaseline = "top";
    cx.fillStyle = "#5a7a94";
    cx.fillText("/kernel", 14, KERNEL_Y + 10);

    // integrity bar
    const bw = Math.min(W * 0.3, 300);
    const bx = W - bw - 14, by = KERNEL_Y + 12;
    cx.strokeStyle = "rgba(90,122,148,0.5)";
    cx.lineWidth = 1;
    cx.strokeRect(bx, by, bw, 8);
    cx.fillStyle = integrity > 60 ? "#00ff9d" : integrity > 30 ? "#ffd60a" : "#ff4d6d";
    cx.fillRect(bx + 1, by + 1, (bw - 2) * (integrity / 100), 6);
    cx.textAlign = "right";
    cx.fillStyle = "#5a7a94";
    cx.fillText(`integrity ${integrity}%`, W - 14, by + 14);
  }

  function drawHud() {
    const fs = Math.max(12, H * 0.02);
    cx.font = `700 ${fs}px ${MONO}`;
    cx.textBaseline = "top";
    cx.textAlign = "left";
    cx.fillStyle = "#d4e0ec";
    cx.fillText(`score ${score}`, 14, 12);
    cx.fillStyle = "#5a7a94";
    cx.fillText(`wave ${String(wave).padStart(2, "0")}`, 14, 12 + fs * 1.5);
    if (combo >= 3) {
      cx.textAlign = "right";
      cx.fillStyle = combo >= 10 ? "#ff4d6d" : "#ffd60a";
      cx.fillText(`combo ×${combo}`, W - 14, 12);
    }
  }

  function drawWords() {
    cx.textBaseline = "alphabetic";
    cx.textAlign = "left";
    for (const w of words) {
      cx.font = `700 ${w.fs}px ${MONO}`;
      const base = w.hot ? "#ff8aa0" : "#d4e0ec";
      if (w.typed > 0) {
        const done = w.text.slice(0, w.typed);
        const rest = w.text.slice(w.typed);
        const dw = cx.measureText(done).width;
        cx.shadowColor = "#00ff9d";
        cx.shadowBlur = 10;
        cx.fillStyle = "#00ff9d";
        cx.fillText(done, w.x, w.y);
        cx.shadowBlur = 0;
        cx.fillStyle = base;
        cx.fillText(rest, w.x + dw, w.y);
        if (w === target) {
          const tw = cx.measureText(w.text).width;
          cx.strokeStyle = "rgba(0,255,157,0.5)";
          cx.lineWidth = 1;
          cx.strokeRect(w.x - 6, w.y - w.fs - 4, tw + 12, w.fs + 12);
        }
      } else {
        cx.fillStyle = base;
        cx.fillText(w.text, w.x, w.y);
      }
    }
  }

  function drawParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life -= dt;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 400 * dt;
      cx.globalAlpha = Math.min(p.life * 2, 1);
      cx.fillStyle = p.color;
      cx.fillRect(p.x, p.y, 3, 3);
    }
    cx.globalAlpha = 1;
    for (let i = floats.length - 1; i >= 0; i--) {
      const f = floats[i];
      f.life -= dt;
      if (f.life <= 0) { floats.splice(i, 1); continue; }
      f.y -= 30 * dt;
      cx.globalAlpha = Math.min(f.life * 1.5, 1);
      cx.font = `700 ${f.big ? Math.max(26, H * 0.05) : Math.max(13, H * 0.02)}px ${MONO}`;
      cx.textAlign = f.big ? "center" : "left";
      cx.fillStyle = f.color;
      cx.fillText(f.text, f.big ? W / 2 : f.x, f.y);
    }
    cx.globalAlpha = 1;
    cx.textAlign = "left";
  }

  // ---- main loop -----------------------------------------------------------------------
  let clock = 0;
  function frame(ts) {
    requestAnimationFrame(frame);
    if (!lastTime) lastTime = ts;
    let dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;
    if (state === "paused" || state === "idle") { lastTime = ts; }
    dt *= slowmo;
    clock += dt;

    if (state === "playing") {
      spawnTimer -= dt;
      if (spawnTimer <= 0 && words.length < maxWords()) {
        spawn();
        spawnTimer = spawnEvery();
      }
      for (let i = words.length - 1; i >= 0; i--) {
        const w = words[i];
        w.y += w.v * dt;
        if (w.y >= KERNEL_Y) leak(w);
      }
    } else if (state === "over") {
      slowmo = Math.min(slowmo + dt * 0.4, 1);
      for (const w of words) w.y += w.v * dt * 0.3;
    }

    cx.save();
    if (shake > 0.1) {
      shake *= 0.86;
      cx.translate((Math.random() - 0.5) * shake * 2, (Math.random() - 0.5) * shake * 2);
    }
    drawBackground(clock);
    if (state !== "idle") {
      drawWords();
      drawParticles(dt);
      drawKernel(clock);
      drawHud();
    } else {
      drawKernel(clock);
    }
    cx.restore();
  }
  requestAnimationFrame(frame);

  // ---- input ----------------------------------------------------------------------------
  document.getElementById("start-btn").addEventListener("click", startGame);
  document.getElementById("retry-btn").addEventListener("click", startGame);
  document.getElementById("resume-btn").addEventListener("click", resumeGame);
  document.getElementById("quit-btn").addEventListener("click", quitToStart);

  addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (state === "playing") pauseGame();
      else if (state === "paused") resumeGame();
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (state === "idle" && e.key === "Enter") return startGame();
    if (e.key === "m" || e.key === "M") {
      // 'm' appears in process names — only treat as mute outside play
      if (state !== "playing") {
        muted = !muted;
        if (master) master.gain.value = muted ? 0 : 0.5;
        return;
      }
    }
    if (e.key.length === 1 && /[a-z0-9.\-!]/.test(e.key)) {
      e.preventDefault();
      keyChar(e.key);
    }
  });

  // touch devices: tapping the stage summons the soft keyboard
  const mobileInput = document.getElementById("mobile-input");
  cv.addEventListener("touchstart", () => { if (state === "playing") mobileInput.focus(); });
  mobileInput.addEventListener("input", () => {
    const ch = mobileInput.value.slice(-1).toLowerCase();
    mobileInput.value = "";
    if (ch && /[a-z0-9.\-!]/.test(ch)) keyChar(ch);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && state === "playing") pauseGame();
  });
})();
