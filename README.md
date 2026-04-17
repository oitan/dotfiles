# Info

- Using _catppuccin frappe_ (previously I used mocha) palette wherever possible

# To-Dos

- [x] format on save
- [ ] update all packages, plugins, apps, extensions, etc.

# Setup

- Install HomeBrew
- `$ brew install git stow`
- git clone this repo to your `$HOME`
- `$ cd ~/dotfiles`
- `$ stow .` or `$ stow --adopt .`

### Adding new config files

Always add new files in `~/dotfiles`, then re-run `$ stow .` to create symlinks in `$HOME`. Stow only symlinks files that exist in the repo at the time it runs.

Tracked global agent instruction files:

- `~/.config/opencode/AGENTS.md`
- `~/.claude/CLAUDE.md`
- `~/.gemini/GEMINI.md`
- `~/.codex/AGENTS.md`

### Adopting existing config files from `$HOME`

If a program creates a new config file in `$HOME` that you want tracked:

```bash
cd ~/dotfiles && stow --adopt . --target=$HOME
```

This moves the home file into the repo and replaces it with a symlink.

## fzf-git

Git clone [fzf-git](https://github.com/oitan/fzf-git.sh) into `$HOME` dir

## bat

Install Catppuccin Frappe theme for `bat`

- `$ mkdir themes`
- `$ wget -P "$(bat --config-dir)/themes" https://github.com/catppuccin/bat/raw/main/themes/Catppuccin%20Frappe.tmTheme`
- `$ bat cache --build`
- Run `$ bat --list-themes`, and check if the themes are present in the list.

## zsh-syntax-highlighting

Install Catppuccin Frappe theme for zsh syntax highlighting: https://github.com/catppuccin/zsh-syntax-highlighting

## HomeBrew

Install packages using Brewfile

- `$ brew bundle`

## App Store

Gapplin
Hand Mirror
Xnip
HEIC Converter
PDFgear
Spark Classic
