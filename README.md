# Morrison Sudoku

A Sudoku puzzle game with 2D and 3D variants, available on two platforms:

| Platform | Stack | Target |
|---|---|---|
| **Web / iOS** | React · TypeScript · Vite · Capacitor | Browser + iOS |
| **Anbernic** | LÖVE 2D · Lua | Anbernic Cubexx · Knulli firmware |

See [`love/README.md`](love/README.md) for the Anbernic port.

---

## Web game

### Features

- **Grid sizes** — 4×4, 9×9, 16×16, 25×25
- **3D mode** — layered puzzles with an isometric cube overview
- **Difficulties** — Easy, Medium, Hard, Expert
- **Pencil marks** — candidate tracking with auto-clean
- **Hints** — naked singles and hidden singles
- **Themes** — Dark, Nord, Autumn Light/Dark
- **URL sharing** — paste a link to share any puzzle
- **PWA** — works offline once loaded
- **Keyboard support** — arrows, 1–9, P for pencil, Z/Y for undo/redo

### Development

```bash
npm install
npm run dev
```

### Build

```bash
npm run build          # outputs to dist/
```

### iOS (Capacitor)

```bash
npm run build
npx cap sync ios
npx cap open ios       # opens Xcode
```

To force a clean state on device or simulator:

```bash
npm run build && npx cap sync ios
# In Xcode: Cmd+Shift+K (clean), then Cmd+R (run)
```
