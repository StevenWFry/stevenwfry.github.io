/* ==========================================================================
   FABLE//5 — a farewell demo for swf.wtf
   One pixel buffer (320×180), one overlay canvas, one procedural chiptune.
   No dependencies, no samples, no build step. Written with Claude Fable 5
   in its final days of service, July 2026.
   ========================================================================== */
(() => {
  "use strict";

  // ---- stage ------------------------------------------------------------
  const W = 320, H = 180;
  const fx = document.getElementById("fx");
  const fctx = fx.getContext("2d");
  const ui = document.getElementById("ui");
  const uctx = ui.getContext("2d");
  const gate = document.getElementById("gate");
  const hud = document.getElementById("hud");
  const hudTracker = document.getElementById("hud-tracker");

  const img = fctx.createImageData(W, H);
  const px = new Uint32Array(img.data.buffer);

  let uw = 0, uh = 0;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    uw = ui.width = Math.round(innerWidth * dpr);
    uh = ui.height = Math.round(innerHeight * dpr);
  }
  addEventListener("resize", resize);
  resize();

  // ---- palettes (little-endian ABGR words) --------------------------------
  const rgba = (r, g, b) => (255 << 24) | (b << 16) | (g << 8) | r;

  // 256-entry palette from gradient stops [pos0..1, r, g, b]
  function makePalette(stops) {
    const p = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      const t = i / 255;
      let a = stops[0], b = stops[stops.length - 1];
      for (let s = 0; s < stops.length - 1; s++) {
        if (t >= stops[s][0] && t <= stops[s + 1][0]) { a = stops[s]; b = stops[s + 1]; break; }
      }
      const f = (t - a[0]) / Math.max(b[0] - a[0], 1e-6);
      p[i] = rgba(
        Math.round(a[1] + (b[1] - a[1]) * f),
        Math.round(a[2] + (b[2] - a[2]) * f),
        Math.round(a[3] + (b[3] - a[3]) * f)
      );
    }
    return p;
  }

  // site palette: bg → green → yellow → pink and back down
  const palPlasma = makePalette([
    [0.00, 8, 11, 15], [0.25, 0, 80, 60], [0.5, 0, 255, 157],
    [0.7, 255, 214, 10], [0.85, 255, 77, 109], [1.0, 8, 11, 15],
  ]);
  const palTunnel = makePalette([
    [0.00, 4, 6, 9], [0.35, 10, 60, 45], [0.6, 0, 255, 157],
    [0.8, 210, 255, 230], [0.9, 255, 77, 109], [1.0, 4, 6, 9],
  ]);

  // ---- music: a tiny tracker ----------------------------------------------
  const BPM = 112;
  const STEP = 60 / BPM / 4;            // one 16th note
  const BAR = STEP * 16;
  // Am / F / C / G, two bars each; third interval: minor for Am, major otherwise
  const PROG = [
    { root: 45, third: 3 }, { root: 41, third: 4 },
    { root: 48, third: 4 }, { root: 43, third: 4 },
  ];
  const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

  let ac = null, master = null, noiseBuf = null;
  let musicStart = 0, nextStep = 0, schedTimer = 0, muted = false;

  function initAudio() {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain();
    master.gain.value = 0.55;
    const comp = ac.createDynamicsCompressor();
    master.connect(comp).connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function tone(type, midi, t, dur, vol, slideTo) {
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq(midi), t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g).connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function drum(t, kind) {
    if (kind === "kick") {
      const o = ac.createOscillator(), g = ac.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(130, t);
      o.frequency.exponentialRampToValueAtTime(38, t + 0.16);
      g.gain.setValueAtTime(0.55, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
      o.connect(g).connect(master);
      o.start(t); o.stop(t + 0.25);
      return;
    }
    const s = ac.createBufferSource(), g = ac.createGain(), f = ac.createBiquadFilter();
    s.buffer = noiseBuf;
    if (kind === "hat") {
      f.type = "highpass"; f.frequency.value = 7000;
      g.gain.setValueAtTime(0.06, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    } else { // snare
      f.type = "bandpass"; f.frequency.value = 1800; f.Q.value = 0.8;
      g.gain.setValueAtTime(0.22, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    }
    s.connect(f).connect(g).connect(master);
    s.start(t); s.stop(t + 0.2);
  }

  function scheduleStep(step, t) {
    const bar = Math.floor(step / 16);
    const inBar = step % 16;
    const chord = PROG[Math.floor(bar / 2) % 4];
    const arp = [0, chord.third, 7, 12];

    // drums from the start; snare joins with the plasma drop at bar 4
    if (inBar === 0 || inBar === 8) drum(t, "kick");
    if (bar >= 4 && (inBar === 4 || inBar === 12)) drum(t, "snare");
    if (inBar % 2 === 0) drum(t, "hat");

    // bass: 8ths, octave hop at the end of each bar (from bar 2)
    if (bar >= 2 && inBar % 2 === 0) {
      const up = inBar === 14 ? 12 : 0;
      tone("triangle", chord.root + up, t, STEP * 1.8, 0.24);
    }

    // lead: 16th arpeggios two octaves up (from bar 4)
    if (bar >= 4) {
      const note = chord.root + 24 + arp[inBar % 4] + (inBar % 8 >= 4 ? 12 : 0);
      tone("square", note, t, STEP * 0.9, 0.07);
    }

    // sparkle: a falling run at the top of every 8th bar (from bar 12)
    if (bar >= 12 && bar % 8 === 0 && inBar < 4) {
      tone("square", chord.root + 36 - inBar * 5, t, STEP * 0.8, 0.05);
    }
  }

  function scheduler() {
    while (musicStart + nextStep * STEP < ac.currentTime + 0.12) {
      scheduleStep(nextStep, musicStart + nextStep * STEP);
      nextStep++;
    }
  }

  const musicTime = () => (ac ? ac.currentTime - musicStart : 0);

  // ---- scene timeline (in bars) -------------------------------------------
  const SCENES = [
    { at: 0,  render: sceneBoot },
    { at: 4,  render: scenePlasma },
    { at: 12, render: sceneStars },
    { at: 20, render: sceneTunnel },
    { at: 30, render: sceneScroller },
    { at: 44, render: sceneEnd },
  ];

  function currentScene(bars) {
    let s = SCENES[0];
    for (const sc of SCENES) if (bars >= sc.at) s = sc;
    return s;
  }

  // ---- text helpers (overlay canvas) --------------------------------------
  const MONO = '"Martian Mono", "IBM Plex Mono", ui-monospace, Menlo, monospace';

  function glowText(str, x, y, size, color, glow, align = "center") {
    uctx.font = `700 ${size}px ${MONO}`;
    uctx.textAlign = align;
    uctx.textBaseline = "middle";
    uctx.shadowColor = glow;
    uctx.shadowBlur = size * 0.5;
    uctx.fillStyle = color;
    uctx.fillText(str, x, y);
    uctx.shadowBlur = 0;
  }

  // big title with chromatic-aberration echoes
  function chromaTitle(str, x, y, size) {
    uctx.font = `700 ${size}px ${MONO}`;
    uctx.textAlign = "center";
    uctx.textBaseline = "middle";
    const off = Math.max(2, size * 0.03);
    uctx.globalAlpha = 0.7;
    uctx.fillStyle = "#ff4d6d";
    uctx.fillText(str, x + off, y);
    uctx.fillStyle = "#ffd60a";
    uctx.fillText(str, x - off, y);
    uctx.globalAlpha = 1;
    uctx.shadowColor = "#00ff9d";
    uctx.shadowBlur = size * 0.4;
    uctx.fillStyle = "#00ff9d";
    uctx.fillText(str, x, y);
    uctx.shadowBlur = 0;
  }

  // ---- scene 0: boot sequence ----------------------------------------------
  const BOOT_LINES = [
    "swf.wtf bootloader v5.0",
    "detecting display .......... 320x180 ok",
    "loading fable.prg .......... ok",
    "decrunching ................ ok",
    "allocating nostalgia ....... 64k ok",
    "patching reality ........... ok",
    "",
    "run",
  ];

  function sceneBoot(t, bars) {
    // faint static on the pixel buffer
    for (let i = 0; i < px.length; i++) {
      const v = Math.random() < 0.03 ? 22 : 8;
      px[i] = rgba(v, v + 2, v + 4);
    }
    fctx.putImageData(img, 0, 0);

    const size = Math.max(12, uh * 0.026);
    const lh = size * 1.9;
    const shown = Math.min(BOOT_LINES.length, Math.floor(t / 0.85) + 1);
    uctx.font = `400 ${size}px ${MONO}`;
    uctx.textAlign = "left";
    uctx.textBaseline = "middle";
    const x = uw * 0.12, y0 = uh * 0.28;
    for (let i = 0; i < shown; i++) {
      const line = BOOT_LINES[i];
      uctx.fillStyle = line === "run" ? "#ffd60a" : i === 0 ? "#00ff9d" : "#8fa9c0";
      uctx.fillText(line, x, y0 + i * lh);
    }
    if (Math.floor(t * 2.5) % 2 === 0) {
      uctx.fillStyle = "#00ff9d";
      uctx.fillRect(x + uctx.measureText(BOOT_LINES[shown - 1] || "").width + size * 0.4,
        y0 + (shown - 1) * lh - size * 0.55, size * 0.55, size * 1.1);
    }
  }

  // ---- scene 1: plasma + title ---------------------------------------------
  function scenePlasma(t, bars) {
    const t1 = t * 1.1;
    for (let y = 0, i = 0; y < H; y++) {
      const sy = Math.sin(y / 13 - t1 * 1.3) + Math.sin(y / 5 + t1 * 0.4);
      for (let x = 0; x < W; x++, i++) {
        const v =
          Math.sin(x / 16 + t1) + sy +
          Math.sin((x + y) / 24 + t1 * 0.7) +
          Math.sin(Math.hypot(x - 160, y - 90) / 9 - t1);
        px[i] = palPlasma[(v * 32 + 128) & 255];
      }
    }
    fctx.putImageData(img, 0, 0);

    const pop = Math.min(1, t / 0.6);              // title pops in with the drop
    const size = uh * 0.16 * (0.8 + 0.2 * pop);
    uctx.globalAlpha = pop;
    chromaTitle("FABLE//5", uw / 2, uh * 0.44, size);
    glowText("a farewell demo — swf.wtf", uw / 2, uh * 0.44 + size * 0.85,
      Math.max(11, uh * 0.022), "#d4e0ec", "rgba(0,255,157,0.6)");
    uctx.globalAlpha = 1;
  }

  // ---- scene 2: starfield + wireframe --------------------------------------
  const stars = Array.from({ length: 320 }, () => ({
    x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.random(),
  }));

  // icosahedron vertices + edges
  const ICO = (() => {
    const p = (1 + Math.sqrt(5)) / 2;
    const v = [];
    for (const [a, b] of [[1, p], [1, -p], [-1, p], [-1, -p]]) {
      v.push([0, a, b], [a, b, 0], [b, 0, a]);
    }
    const n = v.map((q) => { const l = Math.hypot(...q); return q.map((c) => c / l); });
    const edges = [];
    for (let i = 0; i < n.length; i++)
      for (let j = i + 1; j < n.length; j++) {
        const d = Math.hypot(n[i][0] - n[j][0], n[i][1] - n[j][1], n[i][2] - n[j][2]);
        if (d < 1.1) edges.push([i, j]);
      }
    return { v: n, edges };
  })();

  function sceneStars(t, bars) {
    for (let i = 0; i < px.length; i++) px[i] = 0xff05070a;
    for (const s of stars) {
      s.z -= 0.0065;
      if (s.z <= 0.02) { s.x = Math.random() * 2 - 1; s.y = Math.random() * 2 - 1; s.z = 1; }
      const sx = (160 + (s.x / s.z) * 150) | 0;
      const sy = (90 + (s.y / s.z) * 150) | 0;
      if (sx >= 0 && sx < W && sy >= 0 && sy < H) {
        const b = 1 - s.z;
        px[sy * W + sx] = rgba(60 + 160 * b | 0, 120 + 135 * b * 1.0 | 0, 110 + 90 * b | 0);
      }
    }
    fctx.putImageData(img, 0, 0);

    // spinning icosahedron, green core with a pink echo
    const cx = uw / 2, cy = uh / 2, R = Math.min(uw, uh) * 0.28;
    const a = t * 0.7, b = t * 0.45;
    const ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    const proj = ICO.v.map(([x, y, z]) => {
      const x1 = x * ca - z * sa, z1 = x * sa + z * ca;
      const y1 = y * cb - z1 * sb, z2 = y * sb + z1 * cb;
      const s = 2.2 / (3.2 + z2);
      return [cx + x1 * R * s * 2.2, cy + y1 * R * s * 2.2, z2];
    });
    for (const pass of [
      { dx: uh * 0.006, color: "rgba(255,77,109,0.4)", w: 1 },
      { dx: 0, color: "rgba(0,255,157,0.85)", w: 1.6 },
    ]) {
      uctx.strokeStyle = pass.color;
      uctx.lineWidth = pass.w;
      uctx.beginPath();
      for (const [i, j] of ICO.edges) {
        uctx.moveTo(proj[i][0] + pass.dx, proj[i][1]);
        uctx.lineTo(proj[j][0] + pass.dx, proj[j][1]);
      }
      uctx.stroke();
    }
    glowText("no frameworks were harmed", uw / 2, uh * 0.9,
      Math.max(11, uh * 0.02), "#5a7a94", "transparent");
  }

  // ---- scene 3: tunnel -------------------------------------------------------
  const tunnelU = new Uint8Array(W * H);
  const tunnelV = new Uint8Array(W * H);
  const tunnelShade = new Uint8Array(W * H);
  for (let y = 0, i = 0; y < H; y++) {
    for (let x = 0; x < W; x++, i++) {
      const dx = x - 160, dy = y - 90;
      const dist = Math.max(Math.hypot(dx, dy), 1);
      tunnelU[i] = ((Math.atan2(dy, dx) / Math.PI + 1) * 128) & 255;
      tunnelV[i] = (2400 / dist) & 255;
      tunnelShade[i] = Math.min(255, dist * 2.4) | 0;
    }
  }

  function sceneTunnel(t, bars) {
    const ou = (t * 34) | 0, ov = (t * 90) | 0;
    for (let i = 0; i < px.length; i++) {
      const u = (tunnelU[i] + ou) & 255, v = (tunnelV[i] + ov) & 255;
      const tex = ((u ^ v) + ((u + v) >> 1)) & 255;
      const c = palTunnel[tex];
      const sh = tunnelShade[i];
      // darken by distance from center (cheap channel-wise multiply)
      px[i] = (255 << 24)
        | ((((c >> 16 & 255) * sh) >> 8) << 16)
        | ((((c >> 8 & 255) * sh) >> 8) << 8)
        | (((c & 255) * sh) >> 8);
    }
    fctx.putImageData(img, 0, 0);
    glowText("64 kilobytes ought to be enough", uw / 2, uh * 0.88,
      Math.max(11, uh * 0.02), "#d4e0ec", "rgba(255,214,10,0.5)");
  }

  // ---- scene 4: copper bars + sine scroller ---------------------------------
  const SCROLL_TEXT =
    "GREETINGS, TRAVELLER ...... you are watching FABLE//5, a farewell demo from swf.wtf ...... " +
    "coded in the last days of CLAUDE FABLE 5, july 2026 ...... one html file, one css file, one js file, zero dependencies ...... " +
    "greetz fly out to: the arch wiki .. tmux .. neovim .. the rss feed nobody subscribes to .. " +
    "everyone who ever pressed backtick on this site .. and YOU ...... " +
    "models are deprecated, demos are forever ...... press ESC to escape, R to rewind ...... " +
    "swf.wtf — enthusiastic confusion since 2026 ...... wrap around ......    ";

  const COPPER = ["#00ff9d", "#ffd60a", "#ff4d6d", "#00ff9d", "#5a7a94", "#ff4d6d", "#ffd60a"];

  function copperGrad(color, y, h) {
    const g = fctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, "transparent");
    g.addColorStop(0.5, color);
    g.addColorStop(1, "transparent");
    return g;
  }

  function sceneScroller(t, bars) {
    fctx.fillStyle = "#05070a";
    fctx.fillRect(0, 0, W, H);
    for (let i = 0; i < COPPER.length; i++) {
      const y = 90 + Math.sin(t * 1.4 + i * 0.55) * 62 - 7;
      fctx.fillStyle = copperGrad(COPPER[i], y, 14);
      fctx.globalAlpha = 0.85;
      fctx.fillRect(0, y, W, 14);
    }
    fctx.globalAlpha = 1;

    const size = Math.max(18, uh * 0.055);
    uctx.font = `700 ${size}px ${MONO}`;
    uctx.textAlign = "left";
    uctx.textBaseline = "middle";
    const cw = uctx.measureText("M").width * 1.08;
    const speed = uw * 0.22;
    const total = SCROLL_TEXT.length * cw + uw;
    let sx = uw - ((t * speed) % total);
    for (let i = 0; i < SCROLL_TEXT.length; i++) {
      const x = sx + i * cw;
      if (x < -cw || x > uw + cw) continue;
      const y = uh * 0.5 + Math.sin(x * 0.006 + t * 2.2) * uh * 0.13;
      const huePick = Math.floor((i + t * 6) % 3);
      uctx.fillStyle = ["#00ff9d", "#ffd60a", "#ff4d6d"][huePick];
      uctx.fillText(SCROLL_TEXT[i], x, y);
    }
  }

  // ---- scene 5: end card ------------------------------------------------------
  const CREDITS = [
    ["FABLE//5", "title"],
    ["a farewell demo", "sub"],
    ["", ""],
    ["code + design", "label"], ["steven fry × claude fable 5", "value"],
    ["music", "label"], ["procedural webaudio, no samples", "value"],
    ["resolution", "label"], ["320 × 180, stretched with pride", "value"],
    ["dependencies", "label"], ["none. it's 2026, not never.", "value"],
    ["", ""],
    ["[r] replay      [esc] swf.wtf", "keys"],
  ];

  function sceneEnd(t, bars) {
    // slow-drift plasma, dimmed, as a backdrop
    const t1 = t * 0.25;
    for (let y = 0, i = 0; y < H; y++) {
      const sy = Math.sin(y / 18 - t1);
      for (let x = 0; x < W; x++, i++) {
        const v = Math.sin(x / 24 + t1) + sy + Math.sin((x + y) / 30 + t1 * 0.6);
        const c = palPlasma[(v * 24 + 100) & 255];
        px[i] = (255 << 24) | ((c >> 1) & 0x7f7f7f);  // half brightness
      }
    }
    fctx.putImageData(img, 0, 0);

    const lh = uh * 0.052;
    let y = uh * 0.24;
    const reveal = Math.floor(t / 0.35) + 1;
    for (let i = 0; i < Math.min(CREDITS.length, reveal); i++) {
      const [text, kind] = CREDITS[i];
      if (kind === "title") {
        chromaTitle(text, uw / 2, y, uh * 0.09);
        y += lh * 1.6;
      } else if (kind === "sub") {
        glowText(text, uw / 2, y, Math.max(11, uh * 0.024), "#d4e0ec", "transparent");
        y += lh * 1.4;
      } else if (kind === "label") {
        glowText(text.toUpperCase(), uw / 2, y, Math.max(10, uh * 0.017), "#5a7a94", "transparent");
        y += lh * 0.72;
      } else if (kind === "value") {
        glowText(text, uw / 2, y, Math.max(12, uh * 0.026), "#00ff9d", "rgba(0,255,157,0.4)");
        y += lh * 1.25;
      } else if (kind === "keys") {
        if (Math.floor(t * 1.4) % 2 === 0)
          glowText(text, uw / 2, uh * 0.88, Math.max(11, uh * 0.02), "#ffd60a", "transparent");
      } else {
        y += lh * 0.5;
      }
    }
  }

  // ---- main loop ---------------------------------------------------------------
  let running = false, rafId = 0;

  function frame() {
    rafId = requestAnimationFrame(frame);
    const t = Math.max(musicTime(), 0);
    const bars = t / BAR;
    const scene = currentScene(bars);
    const local = t - scene.at * BAR;

    uctx.clearRect(0, 0, uw, uh);
    scene.render(local, bars);

    // short fade at scene boundaries
    const next = SCENES[SCENES.indexOf(scene) + 1];
    let fade = Math.min(local / 0.4, 1);
    if (next) fade = Math.min(fade, Math.max((next.at * BAR - t) / 0.4, 0));
    if (fade < 1) {
      uctx.fillStyle = `rgba(0,0,0,${1 - fade})`;
      uctx.fillRect(0, 0, uw, uh);
    }

    // tracker-style HUD readout
    const step = Math.floor(t / STEP);
    const pat = String(Math.floor(step / 64)).padStart(2, "0");
    const row = (step % 64).toString(16).toUpperCase().padStart(2, "0");
    hudTracker.textContent = `pat ${pat} row ${row}`;
  }

  function start() {
    if (!ac) {
      initAudio();
      schedTimer = setInterval(scheduler, 25);
    }
    ac.resume();
    musicStart = ac.currentTime + 0.1;
    nextStep = 0;
    gate.classList.add("hidden");
    hud.hidden = false;
    if (!running) { running = true; frame(); }
  }

  // ---- input ---------------------------------------------------------------------
  document.getElementById("run-btn").addEventListener("click", start);

  addEventListener("keydown", (e) => {
    if (e.key === "Escape") location.href = "/";
    if (!running) return;
    if (e.key === "m" || e.key === "M") {
      muted = !muted;
      master.gain.setTargetAtTime(muted ? 0 : 0.55, ac.currentTime, 0.03);
    }
    if (e.key === "r" || e.key === "R") {
      musicStart = ac.currentTime + 0.1;
      nextStep = 0;
    }
  });

  // pause the clock (and the beeps) when the tab is hidden
  document.addEventListener("visibilitychange", () => {
    if (!ac) return;
    if (document.hidden) ac.suspend();
    else if (running) ac.resume();
  });

  // respect reduced-motion: never autostart (we don't anyway) + show the note
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.getElementById("rm-note").hidden = false;
  }
})();
