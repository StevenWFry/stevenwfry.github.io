const distros = [
  // Desktop
  {
    name: "Ubuntu", cat: "desktop",
    desc: "The most popular Linux desktop. Backed by Canonical with huge community support and 5-year LTS releases.",
    url: "https://ubuntu.com/download/desktop",
    tags: ["debian-based", "gnome", "lts", "beginner-friendly"]
  },
  {
    name: "Linux Mint", cat: "desktop",
    desc: "Beginner-friendly Ubuntu/Debian variant. Familiar to Windows users. Ships with Cinnamon, MATE, or Xfce.",
    url: "https://linuxmint.com/download.php",
    tags: ["debian-based", "cinnamon", "beginner-friendly"]
  },
  {
    name: "Fedora Workstation", cat: "desktop",
    desc: "Cutting-edge GNOME desktop with the latest upstream software. Upstream of RHEL.",
    url: "https://fedoraproject.org/workstation/download/",
    tags: ["rpm-based", "gnome", "upstream-rhel"]
  },
  {
    name: "Pop!_OS", cat: "desktop",
    desc: "Developer-focused Ubuntu fork from System76. Excellent NVIDIA support and a built-in tiling window manager.",
    url: "https://pop.system76.com/",
    tags: ["debian-based", "ubuntu", "nvidia-friendly"]
  },
  {
    name: "elementary OS", cat: "desktop",
    desc: "Polished, macOS-inspired desktop built around the Pantheon environment. Beautiful out of the box.",
    url: "https://elementary.io/",
    tags: ["debian-based", "pantheon", "ui-focused"]
  },
  {
    name: "Zorin OS", cat: "desktop",
    desc: "Windows- and macOS-like layouts designed to ease the transition to Linux for switchers.",
    url: "https://zorin.com/os/download/",
    tags: ["debian-based", "beginner-friendly", "layouts"]
  },
  {
    name: "KDE neon", cat: "desktop",
    desc: "Ubuntu LTS base with the latest KDE Plasma desktop. Best place to run a current KDE.",
    url: "https://neon.kde.org/download",
    tags: ["debian-based", "kde", "plasma"]
  },
  // Rolling
  {
    name: "Arch Linux", cat: "rolling",
    desc: "Build your system from scratch. Rolling release, minimal base, the legendary Arch Wiki. DIY required.",
    url: "https://archlinux.org/download/",
    tags: ["rolling", "diy", "arch-wiki"]
  },
  {
    name: "Manjaro", cat: "rolling",
    desc: "Arch-based but accessible. Packages tested before release, graphical installer, multiple desktop flavours.",
    url: "https://manjaro.org/download/",
    tags: ["arch-based", "rolling", "user-friendly"]
  },
  {
    name: "EndeavourOS", cat: "rolling",
    desc: "Near-vanilla Arch with a guided installer and active community. As close to Arch as you can get with hand-holding.",
    url: "https://endeavouros.com/",
    tags: ["arch-based", "rolling", "minimal"]
  },
  {
    name: "Garuda Linux", cat: "rolling",
    desc: "Arch-based with gorgeous defaults, performance tweaks, and Btrfs snapshots built in from the start.",
    url: "https://garudalinux.org/downloads/",
    tags: ["arch-based", "rolling", "btrfs"]
  },
  {
    name: "Void Linux", cat: "rolling",
    desc: "Independent rolling distro using runit instead of systemd. Available with glibc or musl.",
    url: "https://voidlinux.org/download/",
    tags: ["rolling", "runit", "systemd-free", "musl"]
  },
  {
    name: "openSUSE Tumbleweed", cat: "rolling",
    desc: "Rolling openSUSE with automated testing to keep packages stable. YaST and snapper for easy rollbacks.",
    url: "https://get.opensuse.org/tumbleweed/",
    tags: ["rolling", "rpm-based", "btrfs"]
  },
  // Server / Enterprise
  {
    name: "Debian", cat: "server",
    desc: "The universal OS. Rock-solid stability, vast package repos, and the foundation for countless other distros.",
    url: "https://www.debian.org/distrib/",
    tags: ["stable", "server", "universal"]
  },
  {
    name: "Ubuntu Server", cat: "server",
    desc: "The most widely deployed Linux in the cloud. LTS releases with 5-year support and strong cloud tooling.",
    url: "https://ubuntu.com/download/server",
    tags: ["debian-based", "lts", "cloud"]
  },
  {
    name: "Rocky Linux", cat: "server",
    desc: "Community-built RHEL binary-compatible rebuild. The CentOS successor that enterprises reached for.",
    url: "https://rockylinux.org/download/",
    tags: ["rhel-compatible", "enterprise", "rpm-based"]
  },
  {
    name: "AlmaLinux", cat: "server",
    desc: "Another RHEL-compatible community rebuild. Stable, free, production-ready from day one.",
    url: "https://almalinux.org/get-almalinux/",
    tags: ["rhel-compatible", "enterprise", "rpm-based"]
  },
  {
    name: "CentOS Stream", cat: "server",
    desc: "Rolling preview of the next RHEL minor release. The upstream development platform for RHEL.",
    url: "https://www.centos.org/centos-stream/",
    tags: ["rhel-upstream", "rpm-based", "rolling"]
  },
  {
    name: "openSUSE Leap", cat: "server",
    desc: "Stable openSUSE release tracked to SUSE Linux Enterprise. Conservative, reliable, enterprise-ready.",
    url: "https://get.opensuse.org/leap/",
    tags: ["stable", "rpm-based", "enterprise"]
  },
  // Security
  {
    name: "Kali Linux", cat: "security",
    desc: "The go-to distro for penetration testing and security research. 600+ preinstalled security tools.",
    url: "https://www.kali.org/get-kali/",
    tags: ["debian-based", "pentesting", "security-tools"]
  },
  {
    name: "Parrot OS", cat: "security",
    desc: "Lighter than Kali with a focus on security, privacy, and development. Also available as a daily driver.",
    url: "https://www.parrotsec.org/download/",
    tags: ["debian-based", "security", "privacy"]
  },
  {
    name: "Tails", cat: "security",
    desc: "Amnesic live OS for privacy. Routes all traffic through Tor and leaves no trace on the host machine.",
    url: "https://tails.boum.org/install/",
    tags: ["live-only", "tor", "amnesic", "privacy"]
  },
  {
    name: "Whonix", cat: "security",
    desc: "Privacy-focused OS that runs inside VMs. Isolates your identity with a gateway/workstation split.",
    url: "https://www.whonix.org/wiki/Download",
    tags: ["vm-based", "tor", "privacy"]
  },
  // Minimal
  {
    name: "Alpine Linux", cat: "minimal",
    desc: "Tiny, security-hardened base using musl and BusyBox. The default choice for container base images.",
    url: "https://alpinelinux.org/downloads/",
    tags: ["musl", "busybox", "containers", "minimal"]
  },
  {
    name: "antiX", cat: "minimal",
    desc: "Lightweight, systemd-free Debian-based distro. Runs well on older hardware with as little as 256 MB RAM.",
    url: "https://antixlinux.com/",
    tags: ["debian-based", "systemd-free", "lightweight", "old-hardware"]
  },
  {
    name: "Raspberry Pi OS", cat: "minimal",
    desc: "Official OS for Raspberry Pi. Debian-based, available in Desktop, Desktop+Recommended, and Lite editions.",
    url: "https://www.raspberrypi.com/software/",
    tags: ["arm", "debian-based", "raspberry-pi"]
  },
  {
    name: "Puppy Linux", cat: "minimal",
    desc: "Runs entirely in RAM. Tiny footprint, boots from a USB, saves sessions back to the drive.",
    url: "https://puppylinux-woof-ce.github.io/",
    tags: ["runs-in-ram", "portable", "lightweight"]
  },
  // Immutable
  {
    name: "NixOS", cat: "immutable",
    desc: "Declarative, reproducible OS. Entire system config in one file. Atomic upgrades with reliable rollbacks.",
    url: "https://nixos.org/download/",
    tags: ["declarative", "reproducible", "nix", "rollbacks"]
  },
  {
    name: "Fedora Silverblue", cat: "immutable",
    desc: "Immutable GNOME desktop based on rpm-ostree. Updates atomically, applications via Flatpak.",
    url: "https://fedoraproject.org/silverblue/",
    tags: ["immutable", "gnome", "rpm-ostree", "flatpak"]
  },
  {
    name: "Fedora Kinoite", cat: "immutable",
    desc: "Immutable KDE Plasma desktop. Same atomic update model as Silverblue.",
    url: "https://fedoraproject.org/kinoite/",
    tags: ["immutable", "kde", "rpm-ostree", "flatpak"]
  },
];

const catLabels = {
  desktop: "desktop", rolling: "rolling", server: "server",
  security: "security", minimal: "minimal", immutable: "immutable"
};

let currentFilter = "all";

function render() {
  const filtered = currentFilter === "all" ? distros : distros.filter(d => d.cat === currentFilter);
  const count = filtered.length;

  document.getElementById("resultCount").textContent =
    `// ${count} distro${count !== 1 ? "s" : ""}${currentFilter !== "all" ? " · " + currentFilter : ""}`;

  document.getElementById("grid").innerHTML = filtered.map(d => `
    <a href="${d.url}" target="_blank" rel="noopener" class="distro-card cat-${d.cat}">
      <div class="card-top">
        <div class="card-name">${d.name}</div>
        <span class="cat-badge cat-${d.cat}">${catLabels[d.cat]}</span>
      </div>
      <div class="card-desc">${d.desc}</div>
      <div class="card-tags">${d.tags.map(t => `<span class="card-tag">${t}</span>`).join("")}</div>
      <div class="card-link">↗ download</div>
    </a>
  `).join("");
}

function setFilter(f) {
  currentFilter = f;
  document.querySelectorAll(".filter-btn").forEach(b =>
    b.classList.toggle("active", b.dataset.filter === f)
  );
  render();
}

document.querySelectorAll(".filter-btn").forEach(btn =>
  btn.addEventListener("click", () => setFilter(btn.dataset.filter))
);

render();
