#!/bin/sh

# Try to cycle to the next input source.
# Attempts the two common macOS shortcuts:
# 1) Control+Space (Next/Previous input source)
# 2) Control+Option+Space (Select next source in Input menu)
# Requires Accessibility permission for System Events (osascript generates keystrokes).

# get_current_input() {
#   plist_data=$(defaults read ~/Library/Preferences/com.apple.HIToolbox.plist AppleSelectedInputSources 2>/dev/null || true)
#   echo "$plist_data" | plutil -convert xml1 -o - - 2>/dev/null | \
#     grep -A1 'KeyboardLayout Name' | tail -n1 | \
#     cut -d '>' -f2 | cut -d '<' -f1
# }

# before=$(get_current_input)

# Attempt Control+Space
# /usr/bin/osascript -e 'tell application "System Events" to key code 49 using control down' >/dev/null 2>&1
# sleep 0.1
# after=$(get_current_input)
#
# if [ -z "$after" ] || [ "$before" = "$after" ]; then
  # Fallback: Control+Option+Space
  /usr/bin/osascript -e 'tell application "System Events" to key code 49 using {control down, option down}' >/dev/null 2>&1
  sleep 0.1
# fi

# Refresh icon
"$PLUGIN_DIR/get_input_source.sh" &

exit 0
