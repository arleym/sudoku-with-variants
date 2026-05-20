#!/bin/bash
# Knulli ports launcher for Morrison Sudoku.
# Place this file at: /userdata/roms/ports/MorrisonSudoku.sh
# Place the .love file at: /userdata/roms/ports/MorrisonSudoku/morrison-sudoku.love

GAME_DIR="/userdata/roms/ports/MorrisonSudoku"
GAME="$GAME_DIR/morrison-sudoku.love"

# Find the love binary (Batocera/Knulli path, fallback to which)
LOVE_BIN=""
for candidate in /usr/bin/love /usr/local/bin/love $(which love 2>/dev/null); do
  if [ -x "$candidate" ]; then
    LOVE_BIN="$candidate"
    break
  fi
done

if [ -z "$LOVE_BIN" ]; then
  echo "LÖVE runtime not found."
  echo "Install LÖVE via Knulli's ports manager or place the binary at /usr/bin/love"
  exit 1
fi

if [ ! -f "$GAME" ]; then
  echo "Game file not found: $GAME"
  exit 1
fi

# Run
"$LOVE_BIN" "$GAME"
