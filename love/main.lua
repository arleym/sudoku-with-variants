-- Morrison Sudoku — main entry point

local C      = require "src.const"
local Colors = require "src.ui.colors"
local Fonts  = require "src.ui.fonts"
local State  = require "src.game.state"
local Grid   = require "src.ui.grid"
local TB     = require "src.ui.topbar"
local SB     = require "src.ui.sidebar"
local Picker = require "src.ui.numberpicker"
local G      = require "src.input.gamepad"

local state
local layout
local show_overlay = false
local is_3d        = false   -- Phase 4 will flip this

-- ── Helpers ──────────────────────────────────────────────────────────────────

local function sc(c, a)
  love.graphics.setColor(c[1], c[2], c[3], a or 1)
end

local function start_game(n, difficulty)
  is_3d  = false
  state  = State.new()
  state:new_game(n, difficulty)
  layout = C.grid_layout(n)
  show_overlay = false
end

local function place_number(v)
  if not state.cursor then return end
  state.pick_cursor = v
  if state.pencil_mode then
    state:toggle_pencil_mark(v)
  else
    state:set_value(v)
  end
end

local function do_sidebar(id)
  if id == "undo"       then state:undo()
  elseif id == "clear"  then state:clear_cell()
  elseif id == "pencil" then state.pencil_mode = not state.pencil_mode
  elseif id == "layers" then show_overlay = not show_overlay
  elseif id == "hint"   then  -- Phase 5
  elseif id == "layer_up"   then  -- Phase 4
  elseif id == "layer_down" then  -- Phase 4
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

  sc(co.bg)
  love.graphics.rectangle("fill", 0, 0, C.W, C.H)

  TB.draw(state, Fonts, Colors)
  Grid.draw(state, layout, Fonts, Colors)
  SB.draw(state, Fonts, Colors, show_overlay, is_3d)
  Picker.draw(state, Fonts, Colors)

  -- 3D overlay placeholder (replaced in Phase 4)
  if show_overlay then
    local pw = C.SIDEBAR_X - 4
    local ox = 4
    sc({co.topbar_bg[1], co.topbar_bg[2], co.topbar_bg[3]}, 0.94)
    love.graphics.rectangle("fill", ox, C.TOPBAR_H, pw, C.GRID_AREA_H)
    sc(co.border_box)
    love.graphics.rectangle("line", ox, C.TOPBAR_H, pw, C.GRID_AREA_H)
    love.graphics.setFont(Fonts.sm)
    sc(co.label_txt)
    love.graphics.printf("3D Overview — Phase 4", ox + 20, C.TOPBAR_H + 40, pw - 40, "center")
  end

  -- Completion banner
  if state.is_complete then
    sc({0.05, 0.05, 0.05}, 0.88)
    love.graphics.rectangle("fill", 0, C.H / 2 - 44, C.W, 88)
    love.graphics.setFont(Fonts.md)
    sc(co.accent)
    local msg = "Puzzle complete!"
    love.graphics.print(msg, math.floor((C.W - Fonts.md:getWidth(msg)) / 2), C.H / 2 - 10)
  end

  -- Gamepad debug label
  local js = love.joystick.getJoysticks()
  love.graphics.setFont(Fonts.sm)
  sc(co.label_dim)
  love.graphics.print(#js > 0 and js[1]:getName() or "no gamepad", 6, C.H - 13)
end

-- ── Keyboard (desktop testing) ────────────────────────────────────────────────

function love.keypressed(key)
  if key == "escape" then love.event.quit() end

  if key == "up"    then state:move(-1,  0) end
  if key == "down"  then state:move( 1,  0) end
  if key == "left"  then state:move( 0, -1) end
  if key == "right" then state:move( 0,  1) end

  -- Picker navigation (L1/R1 equivalent)
  if key == "[" then state:move_pick(-1) end
  if key == "]" then state:move_pick( 1) end

  if key == "return" then place_number(state.pick_cursor) end
  if key == "backspace" or key == "delete" then state:clear_cell() end
  if key == "p"  then state.pencil_mode = not state.pencil_mode end
  if key == "tab" then show_overlay = not show_overlay end
  if key == "z"  then state:undo() end
  if key == "y"  then state:redo() end

  -- Direct number keys
  local num = tonumber(key)
  if num and num >= 1 and num <= state.n then
    place_number(num)
  end
  if #key == 1 and key >= "a" and key <= "p" then
    local v = key:byte() - string.byte("a") + 10
    if v >= 10 and v <= state.n then place_number(v) end
  end

  -- Dev shortcuts
  if key == "f1" then start_game(9,  "easy")   end
  if key == "f2" then start_game(9,  "medium") end
  if key == "f3" then start_game(9,  "hard")   end
  if key == "f4" then start_game(16, "easy")   end
  if key == "f5" then Colors.set("dark")       end
  if key == "f6" then Colors.set("nord")       end
  if key == "f7" then Colors.set("autumn")     end
end

-- ── Gamepad ───────────────────────────────────────────────────────────────────

function love.gamepadpressed(joystick, button)
  if button == G.DPUP    then state:move(-1,  0) end
  if button == G.DPDOWN  then state:move( 1,  0) end
  if button == G.DPLEFT  then state:move( 0, -1) end
  if button == G.DPRIGHT then state:move( 0,  1) end

  if button == G.L1      then state:move_pick(-1)                    end
  if button == G.R1      then state:move_pick( 1)                    end
  if button == G.CONFIRM then place_number(state.pick_cursor)        end
  if button == G.CLEAR   then state:clear_cell()                     end
  if button == G.PENCIL  then state.pencil_mode = not state.pencil_mode end
  if button == G.SELECT  then show_overlay = not show_overlay        end
  if button == G.L2      then state:undo()                           end
  if button == G.R2      then state:redo()                           end
  if button == G.START   then  -- Phase 5: pause menu
  end
end

-- ── Mouse (desktop testing + future touch) ───────────────────────────────────

function love.mousepressed(x, y, button)
  if button ~= 1 then return end

  -- Top bar
  if y < C.TOPBAR_H then
    if TB.settings_hit(x, y) then
      -- Phase 5: open settings
    end
    return
  end

  -- Sidebar buttons
  local sb_id = SB.hit(x, y, is_3d)
  if sb_id then do_sidebar(sb_id); return end

  -- Number picker buttons
  if y > C.H - C.PICKER_H then
    local v = Picker.hit(x, y, state.n)
    if v == 0 then
      state:clear_cell()
    elseif v then
      place_number(v)
    end
    return
  end

  -- Grid cell click
  if x < C.SIDEBAR_X then
    local col = math.floor((x - layout.x) / layout.cell) + 1
    local row = math.floor((y - layout.y) / layout.cell) + 1
    if row >= 1 and row <= state.n and col >= 1 and col <= state.n then
      local idx = (row - 1) * state.n + col
      state:select(state.cursor == idx and nil or idx)
    end
  end
end
