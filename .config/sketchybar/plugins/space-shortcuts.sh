#!/usr/bin/env bash

# Update per-key items to show: <letter> <app icon>
# Reads bindings from ~/.config/aerospace/aerospace.toml and sets items: space_shortcuts.<key>

CONFIG_DIR="${CONFIG_DIR:-$HOME/.config/sketchybar}"
AEROSPACE_TOML="$HOME/.config/aerospace/aerospace.toml"
ICON_MAP="$CONFIG_DIR/plugins/icon_map.sh"

# Keys to show, in order
declare -a KEYS=("q" "w" "e" "r" "t" "y")

# Pretty key labels for display (lowercase as is, special for enter)
pretty_key() {
  local k="$1"
  case "$k" in
    enter) echo "⏎" ;;
    *) echo "$k" ;;
  esac
}

# Extract app path for a given alt-<key> binding from aerospace.toml
app_for_key() {
  local key="$1"
  # Match lines like: alt-q = 'exec-and-forget open /Applications/App.app'
  # or: alt-e = 'exec-and-forget open ~/Applications/DataGrip.app'
  local line app_path
  line=$(rg -n "^\s*alt-${key}\s*=\s*'exec-and-forget open .*'" "$AEROSPACE_TOML" 2>/dev/null | sed -E "s/^[0-9]+://" | tail -n1)
  if [[ -z "$line" ]]; then
    echo ""
    return 0
  fi
  app_path=$(echo "$line" | sed -E "s/.*exec-and-forget open ([^']*).*/\1/")
  # Normalize ~
  app_path=${app_path/#\~/$HOME}
  # Extract app name from path
  local app_name
  app_name=$(basename "$app_path")
  app_name=${app_name%.app}
  echo "$app_name"
}

update_items() {
  local args=()
  for k in "${KEYS[@]}"; do
    local item="space_shortcuts.${k}"
    local app_name icon key_label
    app_name=$(app_for_key "$k")
    key_label=$(pretty_key "$k")
    if [[ -n "$app_name" ]]; then
      icon=$("$ICON_MAP" "$app_name")
      # Single item: letter on left (icon field), app glyph on right (label field)
      args+=(--set "$item" icon="$key_label" label="$icon")
    else
      args+=(--set "$item" icon="$key_label" label="—")
    fi
  done
  if ((${#args[@]})); then
    sketchybar -m "${args[@]}" >/dev/null
  fi
}

update_items
