# Reports long commands to Herdr's Terms panel (mods/terminal-done): labels on this terminal with the command, its
# exit code, how long it ran and when it ended. Only commands that ran HC_CMD_MIN_SECS (default 10) or more are
# reported; interactive programs are skipped. Sourced from .zshrc, does nothing outside a Herdr terminal.
[[ -n $HC_TERMINAL_ID ]] || return 0
zmodload zsh/datetime
autoload -Uz add-zsh-hook
typeset -g _hc_cmd _hc_t0

_hc_preexec() { _hc_cmd=$1; _hc_t0=$EPOCHSECONDS }

_hc_precmd() {
  local code=$?
  [[ -n $_hc_t0 ]] || return 0
  local secs=$(( EPOCHSECONDS - _hc_t0 )) cmd=${_hc_cmd[1,160]}
  _hc_t0=
  (( secs >= ${HC_CMD_MIN_SECS:-10} )) || return 0
  case ${${(z)cmd}[1]} in
    vi|vim|nvim|nano|less|man|top|htop|btop|ssh|mosh|tmux|claude|codex|gemini|hc|herdr*|fg|watch|tail|lazygit) return 0 ;;
  esac
  hc label $HC_TERMINAL_ID "cmd.text=$cmd" cmd.exit=$code cmd.secs=$secs cmd.at=$(( EPOCHSECONDS * 1000 )) >/dev/null 2>&1 &!
}

add-zsh-hook preexec _hc_preexec
add-zsh-hook precmd _hc_precmd
