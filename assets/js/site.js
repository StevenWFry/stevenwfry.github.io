(function () {
  const cursor = document.getElementById('cursor');
  if (cursor) {
    document.addEventListener('mousemove', (e) => {
      cursor.classList.add('active');
      cursor.style.transform = `translate(${e.clientX - 2}px, ${e.clientY}px)`;
    });

    document.addEventListener('mousedown', () => {
      cursor.style.opacity = '0';
    });

    document.addEventListener('mouseup', () => {
      cursor.style.opacity = '1';
    });
  }

  if (document.body && document.body.dataset.konami === 'true') {
    const konamiHue = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    const konamiCodex = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyA', 'KeyB'];
    const maxLen = Math.max(konamiHue.length, konamiCodex.length);
    const history = [];

    const endsWithSequence = (sequence) => {
      if (history.length < sequence.length) return false;
      for (let i = 0; i < sequence.length; i += 1) {
        if (history[history.length - sequence.length + i] !== sequence[i]) {
          return false;
        }
      }
      return true;
    };

    document.addEventListener('keydown', (e) => {
      history.push(e.code);
      if (history.length > maxLen) {
        history.shift();
      }

      if (endsWithSequence(konamiHue)) {
        document.body.style.filter = 'hue-rotate(180deg)';
        setTimeout(() => {
          document.body.style.filter = '';
        }, 2000);
        return;
      }

      if (endsWithSequence(konamiCodex)) {
        window.location.href = '/codex/index.html';
      }
    });
  }
})();

window.switchTab = function switchTab(distro) {
  const panels = document.querySelectorAll('.distro-panel');
  if (!panels.length) return;

  panels.forEach((p) => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
  document.querySelectorAll('.nav-distro-btn').forEach((b) => b.classList.remove('active'));

  const panel = document.getElementById(`panel-${distro}`);
  const tab = document.getElementById(`tab-${distro}`);
  if (panel) panel.classList.add('active');
  if (tab) tab.classList.add('active');

  document.querySelectorAll('.nav-distro-btn').forEach((b) => {
    const text = b.textContent.toLowerCase();
    if (text.includes(distro === 'arch' ? 'arch' : distro === 'mint' ? 'mint' : distro)) {
      b.classList.add('active');
    }
  });

  const tabs = document.querySelector('.distro-tabs');
  if (tabs) {
    tabs.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
};

window.copyCode = function copyCode(btn) {
  const pre = btn.closest('.code-block')?.querySelector('pre');
  if (!pre) return;

  navigator.clipboard.writeText(pre.innerText).then(() => {
    btn.textContent = 'copied!';
    setTimeout(() => {
      btn.textContent = 'copy';
    }, 1500);
  });
};

window.toggleTrouble = function toggleTrouble(el) {
  if (el) el.classList.toggle('open');
};

/* ── SWF TERMINAL — press ` anywhere to open ── */
(function () {
  if (window.__swfTermInit) return;
  window.__swfTermInit = true;

  let term = null;
  let body = null;
  let input = null;
  const history = [];
  let historyIndex = -1;

  const esc = (s) => s.replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

  const DIRS = {
    '~': '/',
    '/': '/',
    home: '/',
    guides: '/guides/',
    blog: '/blog/',
    apps: '/apps/',
    'pirate-copilot': '/pirate-copilot/',
  };

  const FILES = {
    'about.txt': [
      'Terminal maximalist. Arch on Linux, macOS + iTerm2 on the desktop,',
      'shipping iOS apps. Occasional chaos agent.',
      '',
      '→ full manpage: <a href="/about.html">man swf.wtf(1)</a>',
    ],
    'now.txt': [
      'What I\'m up to right now → <a href="/now.html">/now</a>',
    ],
    '.secrets': [
      '↑ ↑ ↓ ↓ ← → ← → B A',
    ],
  };

  function print(html, cls) {
    const line = document.createElement('div');
    line.className = `swf-term-line${cls ? ` ${cls}` : ''}`;
    line.innerHTML = html || '&nbsp;';
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
  }

  function printPrompt(cmd) {
    print(`<span class="swf-term-prompt-echo"><span class="p-user">visitor@swf.wtf</span>:~$ </span>${esc(cmd)}`);
  }

  const COMMANDS = {
    help() {
      print('available commands:', 't-warn');
      print('  help            this list');
      print('  ls [-a]         list site contents');
      print('  cd &lt;dir&gt;        go somewhere (guides, blog, apps, pirate-copilot, ~)');
      print('  cat &lt;file&gt;      read a file');
      print('  whoami          who are you?');
      print('  neofetch        site info, the proper way');
      print('  date            current date');
      print('  echo &lt;text&gt;     echo echo echo');
      print('  clear           clear the screen');
      print('  exit            close terminal (or press ` / esc)');
    },
    ls(args) {
      const all = args.includes('-a') || args.includes('-la') || args.includes('-al');
      const entries = ['<a href="/guides/">guides/</a>', '<a href="/blog/">blog/</a>', '<a href="/apps/">apps/</a>', '<a href="/pirate-copilot/">pirate-copilot/</a>', 'about.txt', 'now.txt'];
      if (all) entries.unshift('<span class="t-dim">.secrets</span>');
      print(entries.join('  '));
    },
    cd(args) {
      const target = (args[0] || '~').replace(/\/+$/, '') || '/';
      const dest = DIRS[target];
      if (!dest) {
        print(`cd: no such directory: ${esc(target)}`, 't-err');
        return;
      }
      print(`navigating to ${dest} ...`, 't-dim');
      setTimeout(() => { window.location.href = dest; }, 350);
    },
    cat(args) {
      const name = args[0];
      if (!name) { print('cat: missing operand', 't-err'); return; }
      const file = FILES[name];
      if (!file) { print(`cat: ${esc(name)}: No such file or directory`, 't-err'); return; }
      file.forEach((l) => print(l));
    },
    whoami() {
      print('visitor');
      print('(relax — see the visitor card on the homepage for everything this browser admits to)', 't-dim');
    },
    neofetch() {
      const pre = document.createElement('pre');
      pre.innerHTML = [
        '<span style="color:var(--accent)">   ▄▄▄▄ ▄     ▄ ▄▄▄▄▄</span>   <span class="p-user">visitor@swf.wtf</span>',
        '<span style="color:var(--accent)">  █     █  █  █ █    </span>   ─────────────────',
        '<span style="color:var(--accent)">   ▀▀▀█ █ █ █ █ █▀▀▀ </span>   OS: GitHub Pages (static, btw)',
        '<span style="color:var(--accent)">  ▄▄▄▄▀  ▀   ▀  █    </span>   Kernel: HTML5 + CSS3',
        '                         Shell: vanilla JS, no framework',
        '                         Packages: 0 (no build system)',
        '                         Editor: nvim (of course)',
        '                         Theme: terminal-noir [<span style="color:var(--accent)">#00ff9d</span>]',
        '                         Host: <a href="/">swf.wtf</a>',
      ].join('\n');
      body.appendChild(pre);
      body.scrollTop = body.scrollHeight;
    },
    date() {
      print(esc(new Date().toString()));
    },
    echo(args) {
      print(esc(args.join(' ')) || '&nbsp;');
    },
    sudo() {
      print('visitor is not in the sudoers file.', 't-err');
      print('This incident will be reported.', 't-err');
    },
    rm() {
      print('rm: permission denied. nice try though.', 't-err');
    },
    vim() { COMMANDS.nvim(); },
    nvim() {
      print('E37: No write since last change — wait, wrong window. Try the real thing.', 't-warn');
    },
    clear() {
      body.innerHTML = '';
    },
    exit() {
      toggle(false);
    },
  };

  function run(raw) {
    const cmd = raw.trim();
    printPrompt(cmd);
    if (!cmd) return;
    history.push(cmd);
    historyIndex = history.length;
    const parts = cmd.split(/\s+/);
    const name = parts[0].toLowerCase();
    const args = parts.slice(1);
    const fn = COMMANDS[name];
    if (fn) {
      fn(args);
    } else {
      print(`swf: command not found: ${esc(name)} (try 'help')`, 't-err');
    }
  }

  function build() {
    term = document.createElement('div');
    term.className = 'swf-term';
    term.setAttribute('role', 'dialog');
    term.setAttribute('aria-label', 'swf.wtf terminal');
    term.innerHTML = `
      <div class="swf-term-bar">
        <div class="swf-term-dot r"></div>
        <div class="swf-term-dot y"></div>
        <div class="swf-term-dot g"></div>
        <div class="swf-term-title">visitor@swf.wtf — zsh</div>
        <button type="button" class="swf-term-close" aria-label="close terminal">✕</button>
      </div>
      <div class="swf-term-body"></div>
      <div class="swf-term-input-row">
        <span class="swf-term-ps1"><span class="p-user">visitor@swf.wtf</span><span class="p-dim">:~$</span></span>
        <input type="text" class="swf-term-input" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="terminal input">
      </div>`;
    document.body.appendChild(term);

    body = term.querySelector('.swf-term-body');
    input = term.querySelector('.swf-term-input');

    term.querySelector('.swf-term-close').addEventListener('click', () => toggle(false));
    body.addEventListener('click', () => input.focus());

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        run(input.value);
        input.value = '';
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex > 0) {
          historyIndex -= 1;
          input.value = history[historyIndex] || '';
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex < history.length - 1) {
          historyIndex += 1;
          input.value = history[historyIndex] || '';
        } else {
          historyIndex = history.length;
          input.value = '';
        }
      }
    });

    print('swf.wtf terminal — type <span class="t-warn">help</span> to get started, <span class="t-warn">`</span> or <span class="t-warn">esc</span> to close.', 't-dim');
  }

  function toggle(force) {
    if (!term) build();
    const open = typeof force === 'boolean' ? force : !term.classList.contains('open');
    term.classList.toggle('open', open);
    if (open) input.focus();
  }

  window.swfTerm = { open: () => toggle(true), close: () => toggle(false) };

  document.addEventListener('keydown', (e) => {
    if (e.code === 'Backquote' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
      const t = e.target;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (typing && t !== input) return;
      e.preventDefault();
      toggle();
    } else if (e.key === 'Escape' && term && term.classList.contains('open')) {
      toggle(false);
    }
  });

  const tag = document.querySelector('.site-tag');
  if (tag) {
    tag.setAttribute('role', 'button');
    tag.setAttribute('tabindex', '0');
    tag.title = 'open terminal (`)';
    tag.addEventListener('click', () => toggle());
    tag.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
    });
  }
})();
