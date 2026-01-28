#!/bin/bash

prayer=(
  icon=🌙
  icon.font="$FONT:Black:12.0"
  icon.color=$BLUE
  icon.padding_right=6
  background.drawing=on
  background.color=$BACKGROUND_1
  background.border_color=$POPUP_BORDER_COLOR
  background.border_width=1
  label.align=left
  update_freq=300
  script="$PLUGIN_DIR/prayer_times.sh"
  click_script='sketchybar --set prayer popup.drawing=toggle'
)

sketchybar --add item prayer left       \
           --set prayer "${prayer[@]}" \
           --subscribe prayer system_woke
