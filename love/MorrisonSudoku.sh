#!/bin/bash
# Knulli / Batocera Ports launcher for Morrison Sudoku.
# Place this file at: /userdata/roms/ports/MorrisonSudoku.sh
# Place the .love file at: /userdata/roms/ports/MorrisonSudoku/morrison-sudoku.love

GAME_DIR="/userdata/roms/ports/MorrisonSudoku"
GAME="$GAME_DIR/morrison-sudoku.love"
LOG="$GAME_DIR/launch.log"

mkdir -p "$GAME_DIR"
echo "=== Morrison Sudoku launch $(date) ===" > "$LOG"

# 1. Look for a real `love` binary or AppImage in the usual + Batocera/Knulli spots.
LOVE_BIN=""
for candidate in \
  "$(command -v love 2>/dev/null)" \
  /usr/bin/love /usr/local/bin/love \
  /usr/bin/love2d /usr/local/bin/love2d \
  /userdata/system/pro/love/love \
  /usr/love/love /opt/love/love; do
  if [ -n "$candidate" ] && [ -x "$candidate" ]; then
    LOVE_BIN="$candidate"
    break
  fi
done

# 2. AppImage form (Batocera sometimes ships love as an AppImage).
if [ -z "$LOVE_BIN" ]; then
  APP="$(ls /usr/bin/love*.AppImage /userdata/**/love*.AppImage 2>/dev/null | head -n1)"
  [ -n "$APP" ] && LOVE_BIN="$APP"
fi

# 3. Last resort: search the filesystem (slow, runs only if nothing above hit).
if [ -z "$LOVE_BIN" ]; then
  echo "love not in known paths, searching filesystem..." >> "$LOG"
  FOUND="$(find /usr /userdata /opt -maxdepth 5 -type f \
            \( -name love -o -name 'love*.AppImage' \) -perm -u+x 2>/dev/null | head -n1)"
  [ -n "$FOUND" ] && LOVE_BIN="$FOUND"
fi

if [ -z "$LOVE_BIN" ]; then
  echo "LÖVE runtime not found on this device." | tee -a "$LOG"
  echo "Searched PATH, /usr, /userdata, /opt. See $LOG" | tee -a "$LOG"
  exit 1
fi

if [ ! -f "$GAME" ]; then
  echo "Game file not found: $GAME" | tee -a "$LOG"
  exit 1
fi

echo "Using LOVE_BIN=$LOVE_BIN" >> "$LOG"
echo "Running: $GAME" >> "$LOG"

# Run, capturing stdout+stderr so a crash leaves a trace in the log.
"$LOVE_BIN" "$GAME" >> "$LOG" 2>&1
echo "exit code: $?" >> "$LOG"
