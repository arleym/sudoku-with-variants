# Anbernic Cubexx — Sudoku LÖVE Port

Target: Anbernic Cubexx · Knulli firmware · 720×720 screen · Gamepad only (no touch)  
Engine: LÖVE (Love2D) · Language: Lua  
Reference: https://www.playgoodsudoku.com + this project's existing web app

---

## Layout (720×720)

```
┌──────────────────────────────────────────────┐  ← 44px top bar
│  L 1/4   ✏ OFF   Easy · 9×9        12:34   │     layer · mode · difficulty · timer
├──────────────────────────────────────────────┤
│                                              │
│              9×9 Sudoku Grid                 │  ← 600px grid area (66.7px/cell)
│               (600 × 600)                    │     3D cube panel slides in from right
│                                              │     over this area on [Select]
│                                              │
├──────────────────────────────────────────────┤
│  [1] [2] [3] [4] [5̲] [6] [7] [8] [9]  [⌫]  │  ← 76px number picker
└──────────────────────────────────────────────┘

Button mapping:
  D-pad        → navigate grid cells
  L / R        → move number picker cursor
  A            → place selected number into cell
  B            → clear cell
  X            → toggle pencil mode
  Y            → (TBD — hint?)
  L1 / R1      → previous / next layer (3D mode)
  L2 / R2      → undo / redo
  Select       → slide 3D cube panel in/out from right
  Start        → pause menu
```

---

## Phases

### Phase 0 — Project scaffold + Knulli launcher
- [ ] LÖVE project structure (conf.lua, main.lua, src/)
- [ ] conf.lua: 720×720, gamepad enabled, title "Sudoku"
- [ ] Knulli ports launcher shell script (.sh → .love)
- [ ] Bundle a monospace font (LÖVE ships with none)

### Phase 1 — Core puzzle engine (Lua)
- [ ] puzzle/types.lua — data model (Puzzle, Puzzle3D, Difficulty)
- [ ] puzzle/solver.lua — backtracking solver with randomization
- [ ] puzzle/generator.lua — 2D generation for 4×4 and 9×9
- [ ] puzzle/generator3d.lua — 3D generation for 4×4×4 and 9×9×9
- [ ] puzzle/validator.lua + validator3d.lua — constraint checking
- [ ] puzzle/candidates.lua — pencil mark candidate logic
- [ ] game/history.lua — undo/redo stack
- [ ] ARM perf test: 9×9 generation timing in Lua (may need puzzle bank)

### Phase 2 — Layout and grid renderer
- [ ] ui/colors.lua — theme tables (dark default, nord, autumn)
- [ ] ui/grid.lua — draw 9×9/4×4 grid with thick box borders
- [ ] ui/cell.lua — states: normal · given · selected · row/col/box highlight · same-number · error
- [ ] ui/pencilmarks.lua — small candidate digits in cell quadrants
- [ ] ui/numberpicker.lua — bottom strip, L/R cursor, A to confirm
- [ ] ui/topbar.lua — layer indicator, pencil mode, difficulty, timer

### Phase 3 — Gamepad input
- [ ] input/gamepad.lua — abstract button → action mapping
- [ ] Grid navigation (D-pad, wraps at edges)
- [ ] Number picker navigation (L/R shoulders)
- [ ] Place number (A), clear (B), pencil toggle (X)
- [ ] Layer change (L1/R1 in 3D mode)
- [ ] Undo/redo (L2/R2)
- [ ] 3D panel toggle (Select), pause (Start)

### Phase 4 — 3D mode
- [ ] ui/isocube.lua — isometric stacked layer slabs (port SVG math from IsometricCube.tsx)
- [ ] Layer colors matching web app palette
- [ ] Active layer highlighted, filled-cell dots
- [ ] Slide-in panel: 280×600px, translateX from right, ~0.2s lerp
- [ ] Layer grid: identical to 2D grid but indexed into puzzle[layer]

### Phase 5 — Menus
- [ ] scenes/mainmenu.lua — Continue / New Game / Settings
- [ ] scenes/newgame.lua — Mode (2D/3D) → Size (4×4, 9×9) → Difficulty (Easy/Medium/Hard)
- [ ] scenes/settings.lua — show errors, highlights, pencil auto-clean, color theme
- [ ] scenes/pause.lua — Resume / New Game / Settings / Quit
- [ ] scenes/complete.lua — time taken, New Game / Quit

### Phase 6 — Polish + Knulli integration
- [ ] Timer (pauses on pause menu)
- [ ] Save/load via love.filesystem (persist progress on exit)
- [ ] Button hint labels in UI (e.g. "A Confirm  B Clear  X Pencil")
- [ ] End-to-end test: 2D 9×9 and 3D 4×4×4 on device
- [ ] Verify .love file loads from Knulli ports section

---

## Notes

- **Sizes to ship:** 2D: 4×4, 9×9 — 3D: 4×4×4, 9×9×9 (skip 16×16/25×25 — ARM perf risk)
- **Number entry:** L/R shoulders move picker cursor; A places into selected grid cell.
  D-pad is always grid navigation — no mode switching needed.
- **3D panel** slides over the grid (partial overlay), does not push/resize the grid.
  You can still see the active layer while the cube is visible.
- **Theme default:** dark (best for handheld ambient light)
- **Font:** bundle a clean monospace (e.g. JetBrains Mono or similar OFL-licensed)
