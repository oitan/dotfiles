# Info

- Using catppuccin mocha palette wherever possible

# To-Dos

- [ ] format on save

# Setup

- Install HomeBrew
- `$ brew install git stow`
- git clone this repo to your `$HOME`
- `$ cd ~/dotfiles`
- `$ stow .`

## fzf-git

Git clone [fzf-git](https://github.com/oitan/fzf-git.sh) into `$HOME` dir

## bat

Install Catppuccin Mocha theme for `bat`

- `$ mkdir themes`
- `$ wget -P "$(bat --config-dir)/themes" https://github.com/catppuccin/bat/raw/main/themes/Catppuccin%20Mocha.tmTheme`
- `$ bat cache --build`
- Run `$ bat --list-themes`, and check if the themes are present in the list.

## zsh-syntax-highlighting

Install Catppuccin Mocha theme for zsh syntax highlighting: https://github.com/catppuccin/zsh-syntax-highlighting

## Kitty

Install catppuccin mocha theme
`$ mkdir -p ~/.config/kitty/themes`
`$ kitty +kitten themes --reload-in=all Catppuccin-Mocha`

## TMUX

Clone tpm into tmux plugins
`$ git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm`

Source tpm for tmux
`$ tmux source ~/.config/tmux/tmux.conf` or `<prefix>r` if in tmux session

Install plugins
`<C-a>I`

Check color palette
`$ ./24-bit-color.sh`

## Slack

Install Catppuccin Mocha theme for Slack: https://github.com/catppuccin/slack?tab=readme-ov-file#theme-strings

## HomeBrew Packages

```
$ brew install --formula
bat
borders
eza
fd
fzf
git
neovim
ripgrep
ripgrep-all
starship
stow
tmux
tree-sitter
volta
wget
zoxide
zsh-autosuggestions
zsh-syntax-highlighting
file-formula
yazi
ffmpegthumbnailer
unar
jq
poppler
font-symbols-only-nerd-font
jstkdng/programs/ueberzugpp
deno

```

```
$ brew install --cask
aerospace
alt-tab
asana
betterdisplay
discord
docker
dropbox
font-fira-code-nerd-font
font-symbols-only-nerd-font
hiddenbar
kitty
obsidian
postman
raycast
skype
slack
ticktick
time-out
visual-studio-code
caffeine
flux
webtorrent
ngrok
notion
dbeaver-community
```

## App Store
Gapplin
Hand Mirror
Xnip
Xmind
HEIC Converter
PDFgear
MindNode
1Password for Safari

