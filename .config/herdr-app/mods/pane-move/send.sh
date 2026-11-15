#!/bin/bash
# send.sh <space-id> <tab-id|-> <terminal>...
# Moves running terminals into a space: park them, show the space, keep each as a new tab (tab "-") or split beside the
# panes of the given tab. One script, not the popup's timers: the popup is gone before the steps finish, and a terminal
# that was parked but never kept is lost from every screen. If the space cannot be shown (a space whose last terminals
# were parked is closed, and gets a new id), the terminals are kept where the app is, so nothing is lost.
space=$1; tab=$2; shift 2
do_() { herdr-app do "$1" "$2" >/dev/null 2>&1; }
for t in "$@"; do do_ terminal.park "{\"terminal\":\"$t\"}"; done
sleep 1.5
do_ space.select "{\"id\":\"$space\"}"
sleep 1.5
[ "$tab" != "-" ] && { do_ tab.select "{\"id\":\"$tab\"}"; sleep 1; }
i=0
for t in "$@"; do
  place=right; [ "$tab" = "-" ] && [ $i -eq 0 ] && place=tab
  do_ terminal.keep "{\"terminal\":\"$t\",\"place\":\"$place\"}"
  sleep 1
  i=$((i + 1))
done
