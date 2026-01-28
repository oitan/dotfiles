#!/bin/sh

# hangul and english item

# Read the plist data
plist_data=$(defaults read ~/Library/Preferences/com.apple.HIToolbox.plist AppleSelectedInputSources)
current_input_source=$(echo "$plist_data" | plutil -convert xml1 -o - - | grep -A1 'KeyboardLayout Name' | tail -n1 | cut -d '>' -f2 | cut -d '<' -f1)

if [ "$current_input_source" = "ABC" ]; then
    sketchybar --set input_source icon="􀂕"
elif [ "$current_input_source" = "Kazakh" ]; then
    sketchybar --set input_source icon="􀂩"
elif [ "$current_input_source" = "Russian" ]; then
    sketchybar --set input_source icon="􀂷"
else
    sketchybar --set input_source icon="$current_input_source"
fi
