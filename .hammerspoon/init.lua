local ENGLISH_LAYOUT = "com.apple.keylayout.ABC"
local GHOSTTY_BUNDLE_ID = "com.mitchellh.ghostty"

appWatcher = hs.application.watcher.new(function(_, event, app)
  if event == hs.application.watcher.activated and app:bundleID() == GHOSTTY_BUNDLE_ID then
    hs.keycodes.currentSourceID(ENGLISH_LAYOUT)
  end
end)
appWatcher:start()
