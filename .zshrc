### ZSHELL

# history
SAVEHIST=10000
HISTSIZE=9999
setopt share_history
setopt hist_expire_dups_first
setopt hist_ignore_dups
setopt hist_verify

# key bindings
# remove ctrl-p and ctrl-n from switch between history to switch between tmux windows
bindkey -r "^P"
bindkey -r "^N"
bindkey "^[[A" history-search-backward
bindkey "^[[B" history-search-forward
bindkey "^[[1;3D" backward-word
bindkey "^[[1;3C" forward-word
bindkey "^[[1;9D" beginning-of-line
bindkey "^[[1;9C" end-of-line

## Catppuccin theme

# zsh syntax highlighting
source ~/zsh-syntax-highlighting/themes/catppuccin_mocha-zsh-syntax-highlighting.zsh

# fzf
export FZF_DEFAULT_OPTS=" \
--color=bg+:#313244,bg:#1e1e2e,spinner:#f5e0dc,hl:#f38ba8 \
--color=fg:#cdd6f4,header:#f38ba8,info:#cba6f7,pointer:#f5e0dc \
--color=marker:#f5e0dc,fg+:#cdd6f4,prompt:#cba6f7,hl+:#f38ba8"

# autosuggestions
autoload -Uz compinit && compinit
source /opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh
source /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

# NGROK
if command -v ngrok &>/dev/null; then
  eval "$(ngrok completion)"
fi

### VOLTA
VOLTA_HOME=$HOME/.volta
PATH=$VOLTA_HOME/bin:$PATH


### ENVMAN

# Generated for envman. Do not edit.
[ -s "$HOME/.config/envman/load.sh" ] && source "$HOME/.config/envman/load.sh"

### STARSHIP
eval "$(starship init zsh)"

### ZOXIDE
eval "$(zoxide init zsh)"

### FZF
eval "$(fzf --zsh)"
# use fd instead of find
export FZF_DEFAULT_COMMAND='fd --hidden --follow --exclude .git --exclude node_modules'
source ~/fzf-git.sh/fzf-git.sh

### Yazi
function yy() {
	local tmp="$(mktemp -t "yazi-cwd.XXXXXX")"
	yazi "$@" --cwd-file="$tmp"
	if cwd="$(cat -- "$tmp")" && [ -n "$cwd" ] && [ "$cwd" != "$PWD" ]; then
		cd -- "$cwd"
	fi
	rm -f -- "$tmp"
}

### Restart
function restart() {
  clear
  source ~/.zshrc
}

# load aliases
source $HOME/.aliases

# EDITOR
export EDITOR="nvim"

### macchina - system information frontend
macchina
