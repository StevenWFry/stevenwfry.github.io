(function () {
  const cursor = document.getElementById('cursor');
  if (cursor) {
    document.addEventListener('mousemove', (e) => {
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
    const konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA'];
    let ki = 0;

    document.addEventListener('keydown', (e) => {
      if (e.code === konami[ki]) {
        ki += 1;
        if (ki === konami.length) {
          document.body.style.filter = 'hue-rotate(180deg)';
          setTimeout(() => {
            document.body.style.filter = '';
          }, 2000);
          ki = 0;
        }
      } else {
        ki = 0;
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
