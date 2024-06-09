# Setup
## Alacritty
Install alacritty themes
`$ mkdir -p ~/.config/alacritty/themes`
`$ git clone https://github.com/alacritty/alacritty-theme ~/.config/alacritty/themes`
Install catppuccin mocha theme
`$ curl -LO --output-dir ~/.config/alacritty https://github.com/catppuccin/alacritty/raw/main/catppuccin-mocha.toml`
## TMUX
Clone tpm into tmux plugins
`$ git clone https://github.com/tmux-plugins/tpm ~/.config/tmux/plugins/tpm`
Source tpm for tmux
`$ tmux source ~/.config/tmux/tmux.conf`
Install plugins
`<C-a>I`
## HomeBrew Packages
`$ brew install git macchina eza fzf borders fd luv neovim ripgrep ripgrep-all starship stow tmux tree-sitter volta zoxide zsh-autosuggestions zsh-syntax-highlighting`
`$ brew install --cask nikitabobko/tap/aerospace alacritty aldente alt-tab asana discord docker dropbox font-fira-code-nerd-font hiddenbar jetbrains-toolbox keka obsidian postman raycast recut slack stats ticktick time-out visual-studio-code`

