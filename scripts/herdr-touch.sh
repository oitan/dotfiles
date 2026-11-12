#!/bin/bash
# Herdr only watches ~/.config/herdr-app, but stowed files live in ~/dotfiles, so editing them
# there never triggers its hot reload. For each changed path (under either root) this touches the
# symlink Herdr can see (`touch -h`): the mod folder for mods/<name>/..., else the file itself.
# Usage: herdr-touch.sh <path>...
SRC="$HOME/dotfiles/.config/herdr-app"
DST="$HOME/.config/herdr-app"
links=""
for f in "$@"; do
  case "$f" in
    "$SRC"/*) rel=${f#"$SRC"/} ;;
    "$DST"/*) rel=${f#"$DST"/} ;;
    *) continue ;;
  esac
  case "$rel" in
    # Written by Herdr itself (it doesn't reload on them), editor leftovers, hidden files.
    *.d.ts|*/jsconfig.json|jsconfig.json|.*|*/.*|*~|*.swp|*.swx|*.tmp|*.reset-*) continue ;;
    mods/*/*) name=${rel#mods/}; links+="$DST/mods/${name%%/*}"$'\n' ;;
    */*/*) continue ;;
    *) links+="$DST/$rel"$'\n' ;;
  esac
done
printf '%s' "$links" | sort -u | while IFS= read -r l; do
  [ -L "$l" ] && touch -h "$l"
done
exit 0
