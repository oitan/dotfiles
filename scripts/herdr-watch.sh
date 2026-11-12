#!/bin/bash
# Keeps Herdr's hot reload working for stowed files: watches ~/dotfiles/.config/herdr-app and hands
# each batch of changes to herdr-touch.sh. Run by the dev.oitan.herdr-reload LaunchAgent.
# Install once (needs `brew install fswatch`):
#   ln -sf ~/dotfiles/scripts/dev.oitan.herdr-reload.plist ~/Library/LaunchAgents/
#   launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/dev.oitan.herdr-reload.plist
# Log: ~/Library/Logs/herdr-reload.log
set -o pipefail
SRC="$HOME/dotfiles/.config/herdr-app"
TOUCH="$HOME/dotfiles/scripts/herdr-touch.sh"
batch=()
/opt/homebrew/bin/fswatch -r -0 -l 0.3 --batch-marker "$SRC" | while IFS= read -r -d '' f; do
  if [ "$f" = NoOp ]; then
    [ ${#batch[@]} -gt 0 ] && "$TOUCH" "${batch[@]}"
    batch=()
  else
    batch+=("$f")
  fi
done
