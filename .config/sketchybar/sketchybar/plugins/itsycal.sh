#!/bin/bash

open -a "Itsycal"

osascript <<'APPLESCRIPT'
tell application "System Events"
  if exists (process "Itsycal") then
    tell process "Itsycal"
      if exists menu bar item 1 of menu bar 2 then
        click menu bar item 1 of menu bar 2
      else if exists menu bar item 1 of menu bar 1 then
        click menu bar item 1 of menu bar 1
      end if
    end tell
  end if
end tell
APPLESCRIPT
