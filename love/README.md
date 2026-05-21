# Morrison Sudoku — Anbernic Port

LÖVE 2D (Lua) port of Morrison Sudoku, built for the **Anbernic Cubexx** running **Knulli** firmware.

- Screen: 720×720
- Input: gamepad only (no touch)
- Engine: LÖVE 11.x

---

## Features

**2D puzzles**
| Size | Boxes | Values |
|---|---|---|
| 4×4 | 2×2 | 1–4 |
| 9×9 | 3×3 | 1–9 |
| 16×16 | 4×4 | 1–9, A–G |
| 25×25 | 5×5 | 1–9, A–O |

**3D puzzles** — each layer is a standard 2D grid; pillars (same row/col across layers) must also contain each value exactly once.

| Size | Layers | Generation |
|---|---|---|
| 4×4×4 | 4 | Backtracking + uniqueness check |
| 9×9×9 | 9 | Cyclic shift (instant) |
| 16×16×16 | 16 | Pattern + cyclic shift (instant) |

**Other**
- Dark, Nord, and Autumn colour themes
- Pencil marks with optional auto-clean
- Undo / redo (unlimited)
- Save on exit, Continue on relaunch
- Isometric cube overview for 3D navigation

---

## Controls

| Button | Action |
|---|---|
| D-pad | Navigate grid cells (wraps) |
| **A** | Place current number |
| **B** | Clear cell |
| **X** | Toggle pencil mode |
| **L1 / R1** | Move number picker *(overlay closed)* |
| **L1 / R1** | Change layer *(3D overlay open)* |
| **L2 / R2** | Undo / Redo |
| **Select** | Open / close 3D cube overview |
| **Start** | Pause menu |

---

## Running on desktop (development)

Install [LÖVE 11.x](https://love2d.org), then:

```bash
love love/           # from the repo root
# or
cd love && love .
```

On macOS: `brew install love`

**Font (optional):** drop `JetBrainsMono-Regular.ttf` into `love/assets/fonts/` for sharp text. The game falls back to LÖVE's built-in bitmap font without it.

---

## Building for device

```bash
cd love
bash build.sh
# → morrison-sudoku.love  (~40K)
```

The `.love` file is a zip of all Lua source and assets.

---

## Deploying to Knulli

```bash
# On the device (SSH or file manager):
mkdir -p /userdata/roms/ports/MorrisonSudoku
cp morrison-sudoku.love  /userdata/roms/ports/MorrisonSudoku/
cp MorrisonSudoku.sh     /userdata/roms/ports/
chmod +x                 /userdata/roms/ports/MorrisonSudoku.sh
```

Then refresh the **Ports** list in EmulationStation. LÖVE must be installed on the device — install it via Knulli's ports manager if not already present.

---

## Project structure

```
love/
├── conf.lua            LÖVE window config (720×720, gamepad on)
├── main.lua            Entry point, scene router, input handling
├── build.sh            Packages → morrison-sudoku.love
├── MorrisonSudoku.sh   Knulli ports launcher
├── assets/
│   ├── fonts/          Drop JetBrainsMono-Regular.ttf here
│   └── images/         morrison-crest-real.png (menu logo)
└── src/
    ├── const.lua        Layout constants
    ├── settings.lua     Persistent settings (love.filesystem)
    ├── scenes.lua       All non-game screens (menu, pause, etc.)
    ├── game/
    │   ├── state.lua    2D game state + undo history
    │   ├── state3d.lua  3D game state
    │   ├── history.lua  Snapshot-based undo/redo stack
    │   └── save.lua     Save / load to disk
    ├── puzzle/
    │   ├── solver.lua       Backtracking solver
    │   ├── generator.lua    2D puzzle generation
    │   ├── generator3d.lua  3D puzzle generation
    │   ├── validator.lua    2D constraint checking
    │   ├── validator3d.lua  3D constraint checking
    │   ├── candidates.lua   Pencil mark logic
    │   └── candidates3d.lua 3D pencil mark logic
    ├── ui/
    │   ├── colors.lua      Theme tables
    │   ├── fonts.lua       Font loading + display helpers
    │   ├── icons.lua       Programmatic Bootstrap-style icons
    │   ├── grid.lua        Sudoku grid renderer
    │   ├── topbar.lua      Top bar
    │   ├── sidebar.lua     Action button column
    │   ├── numberpicker.lua Bottom number strip
    │   └── isocube.lua     Isometric 3D cube overlay
    └── input/
        └── gamepad.lua     SDL2 button name constants
```

---

## Known limitations

- Pencil marks are not persisted in the save file
- Redo stack is cleared when continuing a saved game
- 25×25 number picker is very cramped (26 narrow slots)
- Hint button (Y) is wired but has no logic yet




## Next Steps:

CD into this folder

build.sh packages everything into a single .love file (it's just a zip). That's what goes on the device, along with the launcher script.

  What you copy to the device:

  /userdata/roms/ports/
  ├── MorrisonSudoku.sh              ← the launcher (tells Knulli how to run it)
  └── MorrisonSudoku/
      └── morrison-sudoku.love       ← the whole game, self-contained

  Step by step:

  # 1. Build the .love file (on your Mac, from repo root)
  cd love && bash build.sh

  # 2. Connect to device over SSH (or use a file manager / SD card)
  # Knulli default: ssh root@<device-ip>  password: linux

  # 3. Create the folder and copy files
  scp morrison-sudoku.love  root@<device-ip>:/userdata/roms/ports/MorrisonSudoku/
  scp MorrisonSudoku.sh     root@<device-ip>:/userdata/roms/ports/
  ssh root@<device-ip> "chmod +x /userdata/roms/ports/MorrisonSudoku.sh"

  # 4. Refresh ports in EmulationStation
  # Start menu → Quit → Restart EmulationStation
  # or: ssh root@<device-ip> "batoceraunix --restart"

  The big caveat first: check if LÖVE is already on the device before any of that:

  ssh root@<device-ip> "which love || echo NOT FOUND"

  If it says NOT FOUND, the launcher script will fail with an error and nothing will run. That's the first thing to figure out — Knulli may have a ports
  manager with a LÖVE package, or you may need to install it manually.
