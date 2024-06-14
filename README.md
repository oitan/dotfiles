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

## Alacritty

Install catppuccin mocha theme
`$ mkdir -p ~/.config/alacritty/themes`
`$ curl -LO --output-dir ~/.config/alacritty https://github.com/catppuccin/alacritty/raw/main/catppuccin-mocha.toml`

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

## HomeBrew Packages

`$ brew install git macchina eza fzf borders fd luv neovim ripgrep ripgrep-all starship stow tmux tree-sitter volta zoxide zsh-autosuggestions zsh-syntax-highlighting`

`$ brew install --cask nikitabobko/tap/aerospace alacritty aldente alt-tab asana discord docker dropbox font-fira-code-nerd-font hiddenbar jetbrains-toolbox keka obsidian postman raycast recut slack stats ticktick time-out visual-studio-code kitty`
