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

# autosuggestions
autoload -Uz compinit && compinit
source /opt/homebrew/share/zsh-autosuggestions/zsh-autosuggestions.zsh
source /opt/homebrew/share/zsh-syntax-highlighting/zsh-syntax-highlighting.zsh

### ENVMAN

# Generated for envman. Do not edit.
[ -s "$HOME/.config/envman/load.sh" ] && source "$HOME/.config/envman/load.sh"

### STARSHIP
eval "$(starship init zsh)"

### ZOXIDE
eval "$(zoxide init zsh)"

### FZF
eval "$(fzf --zsh)"

### macchina - system information frontend
macchina
