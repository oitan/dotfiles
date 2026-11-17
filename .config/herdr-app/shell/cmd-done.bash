# bash version of cmd-done.zsh: reports long commands to Herdr's Terms panel (labels on this terminal with the
# command, its exit code, how long it ran and when it ended). Only commands that ran HC_CMD_MIN_SECS (default 10) or
# more are reported; interactive programs are skipped. Does nothing outside a Herdr terminal. Needs bash 4.4+.
[[ -n $HC_TERMINAL_ID ]] && command -v hc >/dev/null || return 0
[[ ${BASH_VERSINFO[0]}${BASH_VERSINFO[1]} -ge 44 ]] || return 0

_hc_t0= _hc_cmd= _hc_ready=

# Runs before every simple command; only the first one after a prompt is the user's command line.
_hc_debug() {
  [[ -n $_hc_ready ]] || return 0
  _hc_ready=
  _hc_cmd=$(HISTTIMEFORMAT= history 1 | sed 's/^ *[0-9]* *//')
  printf -v _hc_t0 '%(%s)T' -1
}

_hc_prompt() {
  local code=$? now secs
  if [[ -n $_hc_t0 ]]; then
    printf -v now '%(%s)T' -1
    secs=$(( now - _hc_t0 ))
    _hc_t0=
    if (( secs >= ${HC_CMD_MIN_SECS:-10} )); then
      case ${_hc_cmd%% *} in
        vi|vim|nvim|nano|less|man|top|htop|btop|ssh|mosh|tmux|claude|codex|gemini|hc|herdr*|fg|watch|tail|lazygit) ;;
        *) ( hc label "$HC_TERMINAL_ID" "cmd.text=${_hc_cmd:0:160}" "cmd.exit=$code" "cmd.secs=$secs" "cmd.at=${now}000" >/dev/null 2>&1 & ) ;;
      esac
    fi
  fi
  _hc_ready=1
  return $code
}

trap '_hc_debug' DEBUG
PROMPT_COMMAND="_hc_prompt${PROMPT_COMMAND:+;$PROMPT_COMMAND}"
