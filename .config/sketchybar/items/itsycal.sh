#!/bin/bash

itsycal=(
  icon=$CALENDAR
  icon.font="$FONT:Black:14.0"
  label.drawing=off
  padding_left=12
  padding_right=12
  click_script="$PLUGIN_DIR/itsycal.sh"
)

sketchybar --add item itsycal right \
           --set itsycal "${itsycal[@]}"
