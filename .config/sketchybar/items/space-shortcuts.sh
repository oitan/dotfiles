#!/usr/bin/env bash

# Sketchybar per-key items to show AeroSpace app shortcuts as compact badges

CONTROLLER="space_shortcuts.controller"

# Remove any single-label version from previous iteration
sketchybar --remove space_shortcuts >/dev/null 2>&1 || true

# Define keys. For right side placement, add in reverse so the visual order reads q w e r t y.
KEYS=(y t r e w q)

# Clean up any previously created paired items
for k in "${KEYS[@]}"; do
  sketchybar --remove "space_shortcuts.${k}.key" >/dev/null 2>&1 || true
  sketchybar --remove "space_shortcuts.${k}.icon" >/dev/null 2>&1 || true
done

# Create single pill per key: letter on the left (icon field, system font), app icon on the right (label field, icon font)
for k in "${KEYS[@]}"; do
  item="space_shortcuts.${k}"
  sketchybar --add item "$item" right \
             --set "$item" \
                  icon.font="$FONT:Semibold:15.0" \
                  icon.y_offset=-1 \
                  icon.padding_left=6 \
                  icon.padding_right=4 \
                  label.font="sketchybar-app-font:Regular:16.0" \
                  label.y_offset=-1 \
                  background.color=$BACKGROUND_1 \
                  background.border_color=$BACKGROUND_2 \
                  background.corner_radius=9 \
                  padding_left=2 \
                  padding_right=4
done

# Hidden controller item to run the updater script on events
sketchybar --add item "$CONTROLLER" right \
           --set "$CONTROLLER" drawing=off script="$PLUGIN_DIR/space-shortcuts.sh" \
           --subscribe "$CONTROLLER" aerospace_workspace_change

# Initial populate
"$PLUGIN_DIR/space-shortcuts.sh"
