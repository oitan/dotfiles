#!/bin/bash

# Displays next prayer name and time using Aladhan API
# Configurable via env vars: PRAYER_CITY, PRAYER_COUNTRY, PRAYER_METHOD, PRAYER_SCHOOL, PRAYER_LAT_ADJ

CITY=${PRAYER_CITY:-"Aktobe"}
COUNTRY=${PRAYER_COUNTRY:-"Kazakhstan"}
# Default to a common setup used in Kazakhstan: MWL method + Hanafi school
# METHOD 4 = MWL, SCHOOL 1 = Hanafi (Asr shadow factor 2)
METHOD=${PRAYER_METHOD:-4}
SCHOOL=${PRAYER_SCHOOL:-1}
# Latitude adjustment: 3 = AngleBased (safer for high latitudes)
LAT_ADJ=${PRAYER_LAT_ADJ:-3}

sketchybar --set "$NAME" label="Loading…"

DATE_TODAY=$(date +%d-%m-%Y)
base_url="https://api.aladhan.com/v1/timingsByCity/${DATE_TODAY}"

RESP=$(curl -sS --fail "${base_url}?city=$(printf %s "$CITY" | sed 's/ /%20/g')&country=$(printf %s "$COUNTRY" | sed 's/ /%20/g')&method=$METHOD&school=$SCHOOL&latitudeAdjustmentMethod=$LAT_ADJ" 2>/dev/null)

# Fallback: show city name if API fails
if [ -z "$RESP" ]; then
  sketchybar --set "$NAME" label="$CITY"
  exit 0
fi

# Ensure jq is available and response code is 200
if ! command -v jq >/dev/null 2>&1; then
  sketchybar --set "$NAME" label="$CITY"
  exit 0
fi

CODE=$(echo "$RESP" | jq -r 'try (.code|tonumber) catch -1')
if [ "$CODE" -ne 200 ]; then
  sketchybar --set "$NAME" label="$CITY"
  exit 0
fi

Fajr=$(echo "$RESP" | jq -r '.data.timings.Fajr' | cut -d' ' -f1)
Dhuhr=$(echo "$RESP" | jq -r '.data.timings.Dhuhr' | cut -d' ' -f1)
Asr=$(echo "$RESP" | jq -r '.data.timings.Asr' | cut -d' ' -f1)
Maghrib=$(echo "$RESP" | jq -r '.data.timings.Maghrib' | cut -d' ' -f1)
Isha=$(echo "$RESP" | jq -r '.data.timings.Isha' | cut -d' ' -f1)

# Use API-provided timezone and date to avoid mismatches
API_TZ=$(echo "$RESP" | jq -r '.data.meta.timezone // empty')
GREG=$(echo "$RESP" | jq -r '.data.date.gregorian.date // empty')  # DD-MM-YYYY
HIJRI=$(echo "$RESP" | jq -r '.data.date.hijri.date // empty')     # DD-MM-YYYY
READABLE=$(echo "$RESP" | jq -r '.data.date.readable // empty')     # e.g., 30 Oct 2025
if [ -z "$GREG" ]; then
  # Fallback to local date in API TZ if available, else system
  if [ -n "$API_TZ" ]; then
    GREG=$(TZ="$API_TZ" date +%d-%m-%Y)
  else
    GREG=$(date +%d-%m-%Y)
  fi
fi

if [ -n "$API_TZ" ]; then
  now_s=$(TZ="$API_TZ" date +%s)
else
  now_s=$(date +%s)
fi

# Convert HH:MM to epoch seconds for the API date (BSD date on macOS)
to_epoch() {
  if [ -n "$API_TZ" ]; then
    TZ="$API_TZ" date -j -f "%d-%m-%Y %H:%M" "$GREG $1" +%s 2>/dev/null
  else
    date -j -f "%d-%m-%Y %H:%M" "$GREG $1" +%s 2>/dev/null
  fi
}

# Determine next prayer and seconds until then
next_name="Fajr"
next_time="$Fajr"
next_epoch=$(to_epoch "$Fajr")

for name in Fajr Dhuhr Asr Maghrib Isha; do
  t=$(eval echo "\$$name")
  e=$(to_epoch "$t")
  if [ -n "$e" ] && [ "$e" -ge "$now_s" ]; then
    next_name="$name"
    next_time="$t"
    next_epoch="$e"
    break
  fi
done

# If all today's prayers passed, wrap to tomorrow's Fajr (add 24h)
if [ -z "$next_epoch" ] || [ "$next_epoch" -lt "$now_s" ]; then
  next_name="Fajr"
  next_time="$Fajr"
  e=$(to_epoch "$Fajr")
  if [ -n "$e" ]; then
    next_epoch=$((e + 86400))
  fi
fi

if [ -n "$next_epoch" ]; then
  remain=$((next_epoch - now_s))
  if [ $remain -lt 0 ]; then remain=0; fi
  rh=$((remain / 3600))
  rm=$(((remain % 3600) / 60))
  if [ $rh -gt 0 ]; then
    remain_str="${rh}h${rm}m"
  else
    remain_str="${rm}m"
  fi
  sketchybar --set "$NAME" label="$next_name in $remain_str"
else
  sketchybar --set "$NAME" label="$next_name $next_time"
fi

# Populate/update popup with all times
add_or_set() {
  local item="$1"; shift
  if sketchybar --query "$item" >/dev/null 2>&1; then
    sketchybar --set "$item" "$@"
  else
    sketchybar --add item "$item" popup.prayer --set "$item" "$@"
  fi
}

# Add or update a header line showing the date(s)
date_line=""
if [ -n "$READABLE" ]; then
  date_line="$READABLE"
elif [ -n "$GREG" ]; then
  date_line="$GREG"
fi
if [ -n "$HIJRI" ]; then
  if [ -n "$date_line" ]; then
    date_line="$date_line • Hijri $HIJRI"
  else
    date_line="Hijri $HIJRI"
  fi
fi

if [ -n "$date_line" ]; then
  add_or_set prayer.date label="$date_line" \
                        label.font="$FONT:Bold:12.0" \
                        label.color=$YELLOW \
                        icon.drawing=off \
                        padding_left=8 \
                        padding_right=8
fi

add_or_set prayer.fajr    icon="🌅"  icon.padding_right=6 label="Fajr    $Fajr"
add_or_set prayer.dhuhr   icon="☀️"  icon.padding_right=6 label="Dhuhr   $Dhuhr"
add_or_set prayer.asr     icon="🌓"  icon.padding_right=6 label="Asr     $Asr"
add_or_set prayer.maghrib icon="🌇"  icon.padding_right=6 label="Maghrib $Maghrib"
add_or_set prayer.isha    icon="🌙"  icon.padding_right=6 label="Isha    $Isha"
