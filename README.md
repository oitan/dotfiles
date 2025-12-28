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
- `$ stow .` or `$stow --adopt .`

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
