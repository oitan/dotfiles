#!/usr/bin/env bash
set -euo pipefail

# Homebrew bootstrap script for a new machine.
# Installs formulae and casks listed below, idempotently.

if ! command -v brew >/dev/null 2>&1; then
  echo "Homebrew not found. Please install Homebrew first: https://brew.sh" >&2
  exit 1
fi

brew update

# --- Formulae ---
FORMULAE=(
  atuin
  bat
  borders
  btop
  ca-certificates
  carapace
  cmake
  codex
  eza
  fd
  fzf
  gh
  git
  jq
  lazydocker
  lazygit
  Adembc/homebrew-tap/lazyssh
  lua
  mise
  neovim
  nushell
  ripgrep
  ripgrep-all
  sdkman-cli
  showkey
  sketchybar
  sqlite
  starship
  stow
  tree-sitter
  unar
  unbound
  usage
  wget
  yazi
  zoxide
  zsh-autosuggestions
  zsh-syntax-highlighting
)

# --- Casks ---
CASKS=(
  aerospace
  alt-tab
  betterdisplay
  caffeine
  chatgpt-atlas
  coderabbit
  docker
  docker-desktop
  dropbox
  flux-app
  font-fira-code-nerd-font
  font-hack-nerd-font
  font-jetbrains-mono-nerd-font
  font-sf-mono
  font-sf-pro
  font-sketchybar-app-font
  font-symbols-only-nerd-font
  frame0
  ghostty
  github
  jetbrains-toolbox
  karabiner-elements
  ngrok
  notion
  notion-calendar
  notion-mail
  obs
  postman
  raycast
  tor-browser
  visual-studio-code
  vlc
  webtorrent
)

# Tap fonts if font casks are present
if printf '%s\n' "${CASKS[@]}" | grep -q '^font-'; then
  brew tap homebrew/cask-fonts >/dev/null 2>&1 || true
fi

echo "Installing formulae (${#FORMULAE[@]})..."
for pkg in "${FORMULAE[@]}"; do
  if brew list --formula "$pkg" >/dev/null 2>&1; then
    echo "✓ $pkg already installed"
  else
    brew install "$pkg"
  fi
done

echo "Installing casks (${#CASKS[@]}...)"
for cask in "${CASKS[@]}"; do
  if brew list --cask "$cask" >/dev/null 2>&1; then
    echo "✓ $cask already installed"
  else
    brew install --cask "$cask"
  fi
done

echo "All set."

