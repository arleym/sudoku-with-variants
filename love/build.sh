#!/bin/bash
# Packages the LÖVE project into a .love file for deployment.
# Usage: ./build.sh
# Output: morrison-sudoku.love  (copy this to the device)

set -e
cd "$(dirname "$0")"

OUT="morrison-sudoku.love"

# .love files are zip archives containing all game files
zip -r "$OUT" \
  conf.lua \
  main.lua \
  src/ \
  assets/ \
  --exclude "*.DS_Store" \
  --exclude "*.git*"

echo "Built: $OUT  ($(du -sh "$OUT" | cut -f1))"
echo ""
echo "Deploy to Knulli:"
echo "  Copy $OUT  →  /userdata/roms/ports/MorrisonSudoku/"
echo "  Copy MorrisonSudoku.sh  →  /userdata/roms/ports/"
