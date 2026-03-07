# iOS App - Morrison Sudoku

## Status: In Progress

Capacitor is installed and the iOS project is scaffolded. The web app builds and syncs into the native wrapper. Next steps are split between dev work and tasks for you (graphics/account).

---

## Your Tasks (Arley)

- [ ] **Apple Developer Account** - Enroll at developer.apple.com ($99/year)
- [ ] **App Icon** - Create 1024x1024 master icon (Xcode will generate all sizes)
  - Place in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
  - Needs to be square, no transparency, no rounded corners (iOS rounds them)
- [ ] **Splash/Launch Screen** - Design or customize `ios/App/App/Base.lproj/LaunchScreen.storyboard`
  - Currently uses default Capacitor splash; replace with Morrison Sudoku branding
- [ ] **App Store Listing**
  - Screenshots (6.7" iPhone, 6.5" iPhone, 12.9" iPad recommended)
  - App description, keywords, category (Games > Puzzle)
  - Privacy policy URL (required even if you collect nothing)
  - Support URL

---

## Dev Tasks (Done)

- [x] Install Capacitor core + CLI
- [x] Initialize Capacitor (`com.morrison.sudoku`)
- [x] Add iOS platform
- [x] Install native plugins (status-bar, haptics, keyboard)
- [x] Add `viewport-fit=cover` for notch/Dynamic Island
- [x] Add `env(safe-area-inset-*)` padding to body
- [x] Disable overscroll bounce (`overscroll-behavior: none`)
- [x] Add npm scripts: `ios:sync`, `ios:open`, `ios:dev`

## Dev Tasks (Todo)

- [ ] **Status bar styling** - Match status bar color to active theme (light/dark content)
- [ ] **Haptic feedback** - Light tap on cell select, medium on number entry
- [ ] **Keyboard handling** - Ensure Capacitor keyboard plugin hides virtual keyboard properly (no text inputs in game, but modals may trigger it)
- [ ] **App Store submission build** - Set up signing, provisioning profile, archive & upload via Xcode
- [ ] **Test on physical device** - Run on real iPhone to verify touch targets, safe areas, performance
- [ ] **Review 3D mode** - Ensure isometric view works well on smaller screens
- [ ] **Disable PWA service worker in native** - Not needed inside Capacitor shell; may cause caching issues

---

## How to Build & Run

```bash
# Build web + sync to iOS
npm run ios:sync

# Open in Xcode
npm run ios:open

# Or do both in one step
npm run ios:dev
```

In Xcode: select a simulator or connected device, then press Run (Cmd+R).

---

## File Structure

```
ios/                    # Native Xcode project (committed to git)
capacitor.config.ts     # Capacitor configuration
```
