-- Morrison Sudoku — main entry point

local C      = require "src.const"
local Colors = require "src.ui.colors"
local Fonts  = require "src.ui.fonts"
local State  = require "src.game.state"
local Grid   = require "src.ui.grid"
local TB     = require "src.ui.topbar"
local Picker = require "src.ui.numberpicker"
local G      = require "src.input.gamepad"

local state        -- game state object
local layout       -- grid layout table from C.grid_layout(n)
local show_overlay = false  -- 3D cube panel visible

-- ── Helpers ──────────────────────────────────────────────────────────────────

local function sc(c, a)
  love.graphics.setColor(c[1], c[2], c[3], a or 1)
end

local function start_game(n, difficulty)
  state = State.new()
  state:new_game(n, difficulty)
  layout = C.grid_layout(n)
  show_overlay = false
end

local function confirm()
  if not state.cursor then return end
  if state.pencil_mode then
    state:toggle_pencil_mark(state.pick_cursor)
  else
    state:set_value(state.pick_cursor)
  end
end

-- ── LÖVE callbacks ────────────────────────────────────────────────────────────

function love.load()
  math.randomseed(os.time())
  Fonts.init()
  Colors.set("dark")
  start_game(9, "medium")
end

function love.update(dt)
  state:update(dt)
end

function love.draw()
  local co = Colors.current

  -- Background
  sc(co.bg)
  love.graphics.rectangle("fill", 0, 0, C.W, C.H)

  TB.draw(state, Fonts, Colors, show_overlay)
  Grid.draw(state, layout, Fonts, Colors)
  Picker.draw(state, Fonts, Colors)

  -- Overlay placeholder (Phase 4 will add isometric cube here)
  if show_overlay then
    local pw = 272
    sc({co.topbar_bg[1], co.topbar_bg[2], co.topbar_bg[3]}, 0.97)
    love.graphics.rectangle("fill", C.W - pw, C.TOPBAR_H, pw, C.GRID_AREA_H)
    sc(co.border_box)
    love.graphics.rectangle("fill", C.W - pw, C.TOPBAR_H, 1, C.GRID_AREA_H)
    love.graphics.setFont(Fonts.sm)
    sc(co.label_txt)
    love.graphics.printf("3D Overview\n(Phase 4)", C.W - pw + 20,
      C.TOPBAR_H + 40, pw - 40, "center")
  end

  -- Completion banner
  if state.is_complete then
    sc({0.1, 0.1, 0.1}, 0.85)
    love.graphics.rectangle("fill", 0, C.H / 2 - 40, C.W, 80)
    love.graphics.setFont(Fonts.md)
    sc(Colors.current.accent)
    local msg = "Puzzle Complete!"
    local mw  = Fonts.md:getWidth(msg)
    love.graphics.print(msg, math.floor((C.W - mw) / 2), C.H / 2 - 10)
  end

  -- Debug: gamepad name (remove before ship)
  local js = love.joystick.getJoysticks()
  love.graphics.setFont(Fonts.sm)
  sc(Colors.current.label_dim)
  love.graphics.print(#js > 0 and js[1]:getName() or "no gamepad", 6, C.H - 14)
end

-- ── Input ─────────────────────────────────────────────────────────────────────

function love.keypressed(key)
  if key == "escape" then love.event.quit() end

  -- Cursor movement
  if key == "up"    then state:move(-1,  0) end
  if key == "down"  then state:move( 1,  0) end
  if key == "left"  then state:move( 0, -1) end
  if key == "right" then state:move( 0,  1) end

  -- Picker navigation
  if key == "[" then state:move_pick(-1) end
  if key == "]" then state:move_pick( 1) end

  -- Actions
  if key == "return" or key == "space" then confirm() end
  if key == "backspace" or key == "delete" then state:clear_cell() end
  if key == "p" then state.pencil_mode = not state.pencil_mode end
  if key == "tab" then show_overlay = not show_overlay end

  -- Undo/redo
  if key == "z" then state:undo() end
  if key == "y" then state:redo() end

  -- Direct number keys (1-9, also a-g for 10-16)
  local num = tonumber(key)
  if num and num >= 1 and num <= state.n then
    state.pick_cursor = num
    confirm()
  end
  if #key == 1 and key >= "a" and key <= "p" then
    local v = key:byte() - string.byte("a") + 10
    if v >= 10 and v <= state.n then
      state.pick_cursor = v
      confirm()
    end
  end

  -- Dev shortcuts
  if key == "f1" then start_game(9, "easy")   end
  if key == "f2" then start_game(9, "medium") end
  if key == "f3" then start_game(9, "hard")   end
  if key == "f4" then start_game(16, "easy")  end
  if key == "f5" then Colors.set("dark")      end
  if key == "f6" then Colors.set("nord")      end
  if key == "f7" then Colors.set("autumn")    end
end

function love.gamepadpressed(joystick, button)
  if button == G.DPUP    then state:move(-1,  0) end
  if button == G.DPDOWN  then state:move( 1,  0) end
  if button == G.DPLEFT  then state:move( 0, -1) end
  if button == G.DPRIGHT then state:move( 0,  1) end

  if button == G.L1      then state:move_pick(-1) end
  if button == G.R1      then state:move_pick( 1) end

  if button == G.CONFIRM then confirm() end
  if button == G.CLEAR   then state:clear_cell() end
  if button == G.PENCIL  then state.pencil_mode = not state.pencil_mode end
  if button == G.SELECT  then show_overlay = not show_overlay end

  if button == G.L2      then state:undo() end
  if button == G.R2      then state:redo() end

  if button == G.START   then
    -- TODO Phase 5: pause menu
  end
end

function love.mousepressed(x, y, button)
  if button ~= 1 then return end

  -- Top bar icon clicks
  local icon = TB.hit_test(x, y)
  if icon == "layers" then show_overlay = not show_overlay; return end

  -- Grid cell clicks (desktop testing)
  if y > C.TOPBAR_H and y < C.H - C.PICKER_H then
    local col = math.floor((x - layout.x) / layout.cell) + 1
    local row = math.floor((y - layout.y) / layout.cell) + 1
    if row >= 1 and row <= state.n and col >= 1 and col <= state.n then
      local idx = (row - 1) * state.n + col
      if state.cursor == idx then
        state:select(nil)  -- deselect on second click
      else
        state:select(idx)
      end
    end
  end
end
