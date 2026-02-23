const data = [
  // Section 0: Terminal & Shell
  [
    {
      name: "Install Zsh", badge: "dnf",
      desc: "Zsh is a powerful shell with a rich plugin ecosystem. Set it as your default after installing.",
      cmd: "sudo dnf install -y zsh && chsh -s $(which zsh)"
    },
    {
      name: "Install Oh My Zsh", badge: "manual",
      desc: "Framework for managing Zsh configuration with plugins and themes baked in.",
      cmd: 'sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"'
    },
    {
      name: "Install Starship prompt", badge: "manual",
      desc: "Minimal, blazing-fast cross-shell prompt. The Omakub aesthetic equivalent for Fedora.",
      cmd: 'curl -sS https://starship.rs/install.sh | sh'
    },
    {
      name: "Install Alacritty terminal", badge: "dnf",
      desc: "GPU-accelerated terminal used by Omakub. Fast, minimal, themeable.",
      cmd: "sudo dnf install -y alacritty"
    },
    {
      name: "Install Zellij (terminal multiplexer)", badge: "manual",
      desc: "Modern tmux alternative. Omakub uses this for multi-pane sessions and tab layout.",
      cmd: "cargo install --locked zellij\n# or: sudo dnf copr enable varlad/zellij && sudo dnf install zellij"
    },
    {
      name: "Install Nerd Font (JetBrains Mono)", badge: "manual",
      desc: "Nerd Fonts add developer icons to your terminal. JetBrains Mono is Omakub's default. Place in ~/.local/share/fonts/ and run fc-cache.",
      cmd: "mkdir -p ~/.local/share/fonts && cd ~/.local/share/fonts && curl -fLo 'JetBrainsMono.zip' https://github.com/ryanoasis/nerd-fonts/releases/latest/download/JetBrainsMono.zip && unzip JetBrainsMono.zip && fc-cache -fv"
    },
    {
      name: "Configure Alacritty with Tokyo Night theme", badge: "config",
      desc: "Create ~/.config/alacritty/alacritty.toml with the Tokyo Night color scheme. Omakub ships this as a default.",
      cmd: "mkdir -p ~/.config/alacritty\n# Download a ready-made config:\ncurl -fLo ~/.config/alacritty/alacritty.toml https://raw.githubusercontent.com/folke/tokyonight.nvim/main/extras/alacritty/tokyonight_night.toml"
    },
    {
      name: "Install zsh-autosuggestions & zsh-syntax-highlighting", badge: "dnf",
      desc: "Essential Zsh plugins that mimic fish shell UX. Omakub enables both by default.",
      cmd: "sudo dnf install -y zsh-autosuggestions zsh-syntax-highlighting"
    },
    {
      name: "Install modern CLI tools (eza, fzf, ripgrep, zoxide, bat)", badge: "manual",
      desc: "The exact CLI utility stack from Omakub. Replaces ls, cat, grep, cd with smarter alternatives. Note: eza isn't in the default Fedora repos — install it via cargo.",
      cmd: "sudo dnf install -y fzf ripgrep zoxide bat\n# eza isn't in default Fedora repos — install via cargo:\ncargo install eza"
    },
  ],
  // Section 1: GNOME Theming
  [
    {
      name: "Install GNOME Tweaks", badge: "dnf",
      desc: "Essential tool to apply themes, change fonts, and tweak GNOME Shell behavior.",
      cmd: "sudo dnf install -y gnome-tweaks"
    },
    {
      name: "Install GNOME Extensions app", badge: "flatpak",
      desc: "Manage GNOME Shell extensions via a GUI. Needed to enable window tiling & other Omakub-style enhancements.",
      cmd: "flatpak install -y flathub org.gnome.Extensions"
    },
    {
      name: "Enable Pop Shell (tiling windows)", badge: "dnf",
      desc: "Omakub uses GNOME's built-in tiling + keyboard shortcuts. Pop Shell gives you a similar experience on Fedora.",
      cmd: "sudo dnf install -y gnome-shell-extension-pop-shell"
    },
    {
      name: "Disable GNOME animations", badge: "config",
      desc: "Omakub removes animations entirely for instant workspace switching. Run this via gsettings.",
      cmd: "gsettings set org.gnome.desktop.interface enable-animations false"
    },
    {
      name: "Install Papirus icon theme", badge: "dnf",
      desc: "Clean, consistent icon set that pairs well with the Tokyo Night color palette.",
      cmd: "sudo dnf install -y papirus-icon-theme"
    },
    {
      name: "Apply icon theme", badge: "config",
      desc: "Set Papirus as the active icon theme system-wide using gsettings.",
      cmd: "gsettings set org.gnome.desktop.interface icon-theme 'Papirus-Dark'"
    },
    {
      name: "Install & apply Adwaita Dark (or Graphite theme)", badge: "manual",
      desc: "Use GNOME's built-in dark mode, or install Graphite for a more refined dark shell experience.",
      cmd: "gsettings set org.gnome.desktop.interface color-scheme 'prefer-dark'\n# For Graphite: https://github.com/vinceliuice/Graphite-gtk-theme"
    },
    {
      name: "Set up keyboard-first workspace shortcuts", badge: "config",
      desc: "Omakub binds Super+1–6 for workspace switching. Configure this in Settings → Keyboard → Shortcuts.",
      cmd: "# Go to: Settings → Keyboard → Keyboard Shortcuts → Navigation\n# Set 'Switch to workspace N' to Super+N"
    },
    {
      name: "Install Catppuccin or Tokyo Night GNOME theme", badge: "manual",
      desc: "A dark color palette to match your terminal. Catppuccin Mocha mirrors the Omakub aesthetic closely on Fedora.",
      cmd: "# Catppuccin GTK: https://github.com/catppuccin/gtk\ncurl -LsSO https://github.com/catppuccin/gtk/releases/latest/download/Catppuccin-Mocha-Standard-Blue-Dark.zip"
    },
    {
      name: "Customize Alacritty: remove window decorations", badge: "config",
      desc: "Omakub runs Alacritty without a system title bar for a cleaner look. Add decorations = 'none' to your alacritty.toml.",
      cmd: "# In ~/.config/alacritty/alacritty.toml add:\n# [window]\n# decorations = \"none\"\n# opacity = 0.95"
    },
  ],
  // Section 2: App Installations
  [
    {
      name: "Install Flatpak & Flathub", badge: "dnf",
      desc: "Fedora ships with Flatpak. Add the Flathub remote to access the full app catalog Omakub uses.",
      cmd: "flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo"
    },
    {
      name: "Install Google Chrome", badge: "manual",
      desc: "Omakub sets Chrome as the default browser. Add the repo and install via dnf.",
      cmd: "sudo dnf install -y 'https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm'"
    },
    {
      name: "Install VSCode", badge: "manual",
      desc: "Omakub ships VSCode preconfigured. Add Microsoft's dnf repo for updates.",
      cmd: "sudo rpm --import https://packages.microsoft.com/keys/microsoft.asc && sudo sh -c 'echo -e \"[code]\\nname=Visual Studio Code\\nbaseurl=https://packages.microsoft.com/yumrepos/vscode\\nenabled=1\\ngpgcheck=1\\ngpgkey=https://packages.microsoft.com/keys/microsoft.asc\" > /etc/yum.repos.d/vscode.repo' && sudo dnf install -y code"
    },
    {
      name: "Install Neovim (latest)", badge: "dnf",
      desc: "Omakub's in-terminal editor. Install the latest build for LazyVim compatibility.",
      cmd: "sudo dnf install -y neovim"
    },
    {
      name: "Install LazyVim (Neovim distro)", badge: "manual",
      desc: "The Neovim config Omakub uses. Backs up your existing config and installs LazyVim starter.",
      cmd: "git clone https://github.com/LazyVim/starter ~/.config/nvim && rm -rf ~/.config/nvim/.git"
    },
    {
      name: "Install Docker", badge: "manual",
      desc: "Omakub sets up Docker with preconfigured MySQL & Redis containers. Use the official Docker repo on Fedora.",
      cmd: "sudo dnf -y install dnf-plugins-core && sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo && sudo dnf install -y docker-ce docker-ce-cli containerd.io && sudo systemctl enable --now docker && sudo usermod -aG docker $USER"
    },
    {
      name: "Install lazydocker (Docker TUI)", badge: "manual",
      desc: "Omakub's Docker dashboard — a beautiful terminal UI to manage containers.",
      cmd: 'curl https://raw.githubusercontent.com/jesseduffield/lazydocker/master/scripts/install_update_lazydocker.sh | bash'
    },
    {
      name: "Install mise (runtime version manager)", badge: "manual",
      desc: "Omakub uses mise to manage Node.js, Ruby, Python, Go. Replaces nvm/rbenv/pyenv with one tool.",
      cmd: "curl https://mise.run | sh\n# Then add to ~/.zshrc: eval \"$(mise activate zsh)\"\nmise use --global node@lts ruby@latest"
    },
    {
      name: "Install GitHub CLI (gh)", badge: "dnf",
      desc: "Official GitHub command-line tool — clone, PR, issue workflows from the terminal.",
      cmd: "sudo dnf install -y gh"
    },
    {
      name: "Install Flameshot (screenshots)", badge: "dnf",
      desc: "Omakub replaces the default screenshot tool with Flameshot for annotation and quick sharing. Bind to Ctrl+Print.",
      cmd: "sudo dnf install -y flameshot"
    },
    {
      name: "Install Signal & Spotify", badge: "flatpak",
      desc: "Communication and music apps included in Omakub's daily driver setup.",
      cmd: "flatpak install -y flathub org.signal.Signal com.spotify.Client"
    },
    {
      name: "Install VLC & Obsidian", badge: "flatpak",
      desc: "VLC for media, Obsidian for Markdown note-taking. Both in Omakub's GUI app list.",
      cmd: "flatpak install -y flathub org.videolan.VLC md.obsidian.Obsidian"
    },
  ],
  // Section 3: Dotfiles & Config
  [
    {
      name: "Configure Starship prompt (Tokyo Night preset)", badge: "config",
      desc: "Set up your Starship config to match Omakub's clean, informative prompt style.",
      cmd: "mkdir -p ~/.config && starship preset tokyo-night -o ~/.config/starship.toml\n# Add to ~/.zshrc: eval \"$(starship init zsh)\""
    },
    {
      name: "Create ~/.zshrc with Omakub-style aliases", badge: "config",
      desc: "Add useful aliases: ls → eza, cat → bat, cd → zoxide, etc. These come preconfigured in Omakub.",
      cmd: "# Add to ~/.zshrc:\nalias ls='eza --icons'\nalias ll='eza -la --icons'\nalias cat='bat'\nalias cd='z'\nalias lzd='lazydocker'\neval \"$(zoxide init zsh)\""
    },
    {
      name: "Set up fzf key bindings & fuzzy completion", badge: "config",
      desc: "fzf integrates with Ctrl+R (history), Ctrl+T (files), Alt+C (dirs). Omakub enables all three.",
      cmd: "# Add to ~/.zshrc:\nsource /usr/share/fzf/shell/key-bindings.zsh\nsource /usr/share/fzf/shell/completion.zsh"
    },
    {
      name: "Configure Neovim (Tokyo Night colorscheme)", badge: "config",
      desc: "If using LazyVim, add Tokyo Night as your theme in ~/.config/nvim/lua/plugins/colorscheme.lua.",
      cmd: '# In ~/.config/nvim/lua/plugins/colorscheme.lua:\n# { "folke/tokyonight.nvim", opts = { style = "night" } }'
    },
    {
      name: "Configure Zellij layout (Omakub-style)", badge: "config",
      desc: "Set Zellij default layout with a status bar and pane structure. Place config in ~/.config/zellij/.",
      cmd: "mkdir -p ~/.config/zellij && zellij setup --dump-config > ~/.config/zellij/config.kdl"
    },
    {
      name: "Install and configure git with global settings", badge: "config",
      desc: "Omakub sets global git settings including delta as a pager, and your identity.",
      cmd: "git config --global user.name 'Your Name'\ngit config --global user.email 'you@example.com'\ngit config --global core.pager delta\ngit config --global init.defaultBranch main"
    },
    {
      name: "Install delta (git diff pager)", badge: "dnf",
      desc: "Beautiful syntax-highlighted git diffs. Omakub configures delta as the default git pager.",
      cmd: "sudo dnf install -y git-delta"
    },
    {
      name: "Set up SSH keys for GitHub", badge: "manual",
      desc: "Generate an ed25519 key, add to ssh-agent, and paste the public key to GitHub.",
      cmd: 'ssh-keygen -t ed25519 -C "you@example.com"\neval "$(ssh-agent -s)"\nssh-add ~/.ssh/id_ed25519\ngh ssh-key add ~/.ssh/id_ed25519.pub'
    },
  ],
];

const sectionColors = [
  '#58a6ff', '#d2a8ff', '#3fb950', '#f78166'
];

let state = [];

function init() {
  // Load state from localStorage
  const saved = localStorage.getItem('fedora-omakub-state');
  
  let totalCount = 0;
  data.forEach((section, si) => {
    section.forEach((item, ii) => {
      totalCount++;
    });
  });
  document.getElementById('totalCount').textContent = totalCount;

  data.forEach((section, si) => {
    const container = document.getElementById(`section-${si}`);
    if (!state[si]) state[si] = {};

    section.forEach((item, ii) => {
      const isDone = saved ? (JSON.parse(saved)[`${si}-${ii}`] || false) : false;
      state[`${si}-${ii}`] = isDone;
      container.appendChild(createItem(item, si, ii, isDone));
    });
  });

  updateProgress();
}

function createItem(item, si, ii, isDone) {
  const div = document.createElement('div');
  div.className = 'item' + (isDone ? ' done' : '');
  div.id = `item-${si}-${ii}`;
  div.onclick = () => toggle(si, ii);

  const badgeClass = {
    dnf: 'badge-dnf', flatpak: 'badge-flatpak', manual: 'badge-manual', config: 'badge-config'
  }[item.badge] || 'badge-config';

  div.innerHTML = `
    <div class="checkbox"><span class="checkmark">✓</span></div>
    <div class="item-body">
      <div class="item-name">
        ${item.name}
        <span class="badge ${badgeClass}">${item.badge}</span>
      </div>
      <div class="item-desc">${item.desc}</div>
      ${item.cmd ? `<div class="item-cmd">
        <span class="prompt">$</span>
        <span style="flex:1; padding-right: 40px">${item.cmd.replace(/\n/g, '<br>')}</span>
        <button class="copy-btn" data-cmd="${item.cmd.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/\n/g, '&#10;')}" onclick="event.stopPropagation(); copyCmd(this)">copy</button>
      </div>` : ''}
    </div>
  `;
  return div;
}

function toggle(si, ii) {
  const key = `${si}-${ii}`;
  state[key] = !state[key];
  const el = document.getElementById(`item-${si}-${ii}`);
  el.classList.toggle('done', state[key]);
  saveState();
  updateProgress();
}

function updateProgress() {
  const total = Object.keys(state).length;
  const done = Object.values(state).filter(Boolean).length;
  document.getElementById('doneCount').textContent = done;
  document.getElementById('progressFill').style.width = total ? `${(done/total)*100}%` : '0%';

  // Section counts
  data.forEach((section, si) => {
    const sectionDone = section.filter((_, ii) => state[`${si}-${ii}`]).length;
    document.getElementById(`count-${si}`).textContent = `${sectionDone}/${section.length}`;
  });

  const congrats = document.getElementById('congrats');
  if (done === total && total > 0) {
    congrats.classList.add('show');
  } else {
    congrats.classList.remove('show');
  }
}

function saveState() {
  const toSave = {};
  Object.entries(state).forEach(([k, v]) => { toSave[k] = v; });
  localStorage.setItem('fedora-omakub-state', JSON.stringify(toSave));
}

function resetAll() {
  if (!confirm('Reset all checkboxes?')) return;
  Object.keys(state).forEach(k => state[k] = false);
  document.querySelectorAll('.item').forEach(el => el.classList.remove('done'));
  localStorage.removeItem('fedora-omakub-state');
  updateProgress();
}

function copyCmd(btn) {
  navigator.clipboard.writeText(btn.dataset.cmd).then(() => {
    btn.textContent = 'copied!';
    setTimeout(() => btn.textContent = 'copy', 1500);
  });
}

init();
