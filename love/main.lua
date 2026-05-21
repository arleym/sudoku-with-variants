-- Morrison Sudoku

local C       = require "src.const"
local Colors  = require "src.ui.colors"
local Fonts   = require "src.ui.fonts"
local State   = require "src.game.state"
local State3D = require "src.game.state3d"
local Grid    = require "src.ui.grid"
local TB      = require "src.ui.topbar"
local SB      = require "src.ui.sidebar"
local Picker  = require "src.ui.numberpicker"
local Iso     = require "src.ui.isocube"
local G       = require "src.input.gamepad"

local state        -- State or State3D
local layout
local is_3d        = false
local show_overlay = false

-- ── Helpers ──────────────────────────────────────────────────────────────────

local function sc(c, a)
  love.graphics.setColor(c[1], c[2], c[3], a or 1)
end

local function start_2d(n, diff)
  is_3d         = false
  show_overlay  = false
  state         = State.new()
  state:new_game(n, diff)
  layout        = C.grid_layout(n)
end

local function start_3d(n, diff)
  is_3d         = true
  show_overlay  = false
  state         = State3D.new()
  state:new_game(n, diff)
  layout        = C.grid_layout(n)
end

-- Returns the state object to pass to Grid.draw() and Picker.draw().
-- In 3D mode this is a 2D layer-view; in 2D mode it's the state directly.
local function draw_state()
  return is_3d and state:layer_view() or state
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
  if     id == "undo"       then state:undo()
  elseif id == "clear"      then state:clear_cell()
  elseif id == "pencil"     then state.pencil_mode = not state.pencil_mode
  elseif id == "layers"     then show_overlay = not show_overlay
  elseif id == "layer_up"   then if is_3d then state:change_layer(-1) end
  elseif id == "layer_down" then if is_3d then state:change_layer( 1) end
  elseif id == "hint"       then  -- Phase 5
  end
end

-- ── LÖVE callbacks ────────────────────────────────────────────────────────────

function love.load()
  math.randomseed(os.time())
  Fonts.init()
  Colors.set("dark")
  start_2d(9, "medium")
end

function love.update(dt)
  state:update(dt)
end

function love.draw()
  local co = Colors.current
  local ds = draw_state()

  sc(co.bg)
  love.graphics.rectangle("fill", 0, 0, C.W, C.H)

  -- Top bar uses raw state for timer/difficulty
  TB.draw(state, Fonts, Colors)

  -- Grid always shows active-layer view
  Grid.draw(ds, layout, Fonts, Colors)

  -- Sidebar (needs can_undo from the real state)
  SB.draw(ds, Fonts, Colors, show_overlay, is_3d)

  -- Picker
  Picker.draw(ds, Fonts, Colors)

  -- Isometric cube overlay (covers grid area when open)
  if show_overlay and is_3d then
    Iso.draw(state, Fonts, Colors)
  elseif show_overlay then
    -- 2D mode: small hint panel (future: puzzle stats)
    sc(co.topbar_bg, 0.94)
    love.graphics.rectangle("fill", 4, C.TOPBAR_H, C.SIDEBAR_X - 8, C.GRID_AREA_H)
    sc(co.border_box)
    love.graphics.rectangle("line", 4, C.TOPBAR_H, C.SIDEBAR_X - 8, C.GRID_AREA_H)
    love.graphics.setFont(Fonts.sm)
    sc(co.label_txt)
    love.graphics.printf("Stats / Info\n(Phase 5)", 24, C.TOPBAR_H + 40, C.SIDEBAR_X - 40, "center")
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

  -- Debug
  local js = love.joystick.getJoysticks()
  love.graphics.setFont(Fonts.sm)
  sc(co.label_dim)
  love.graphics.print(#js > 0 and js[1]:getName() or "no gamepad", 6, C.H - 13)
end

-- ── Keyboard ──────────────────────────────────────────────────────────────────

function love.keypressed(key)
  if key == "escape" then love.event.quit() end

  if key == "up"        then state:move(-1,  0) end
  if key == "down"      then state:move( 1,  0) end
  if key == "left"      then state:move( 0, -1) end
  if key == "right"     then state:move( 0,  1) end

  -- Layer nav in 3D, picker nav in 2D
  if is_3d then
    if key == "[" then state:change_layer(-1) end
    if key == "]" then state:change_layer( 1) end
  else
    if key == "[" then state:move_pick(-1) end
    if key == "]" then state:move_pick( 1) end
  end

  if key == "return"    then place_number(state.pick_cursor) end
  if key == "backspace" or key == "delete" then state:clear_cell() end
  if key == "p"         then state.pencil_mode = not state.pencil_mode end
  if key == "tab"       then show_overlay = not show_overlay end
  if key == "z"         then state:undo() end
  if key == "y"         then state:redo() end

  local num = tonumber(key)
  if num and num >= 1 and num <= state.n then place_number(num) end
  if #key == 1 and key >= "a" and key <= "p" then
    local v = key:byte() - string.byte("a") + 10
    if v >= 10 and v <= state.n then place_number(v) end
  end

  -- Dev shortcuts
  if key == "f1" then start_2d(9,  "easy")   end
  if key == "f2" then start_2d(9,  "medium") end
  if key == "f3" then start_2d(9,  "hard")   end
  if key == "f4" then start_2d(16, "easy")   end
  if key == "f8" then start_3d(4,  "easy")   end
  if key == "f9" then start_3d(9,  "medium") end
  if key == "f5" then Colors.set("dark")     end
  if key == "f6" then Colors.set("nord")     end
  if key == "f7" then Colors.set("autumn")   end
end

-- ── Gamepad ───────────────────────────────────────────────────────────────────

function love.gamepadpressed(joystick, button)
  if button == G.DPUP    then state:move(-1,  0) end
  if button == G.DPDOWN  then state:move( 1,  0) end
  if button == G.DPLEFT  then state:move( 0, -1) end
  if button == G.DPRIGHT then state:move( 0,  1) end

  if is_3d then
    if button == G.L1 then state:change_layer(-1) end
    if button == G.R1 then state:change_layer( 1) end
  else
    if button == G.L1 then state:move_pick(-1) end
    if button == G.R1 then state:move_pick( 1) end
  end

  if button == G.CONFIRM then place_number(state.pick_cursor) end
  if button == G.CLEAR   then state:clear_cell()              end
  if button == G.PENCIL  then state.pencil_mode = not state.pencil_mode end
  if button == G.SELECT  then show_overlay = not show_overlay end
  if button == G.L2      then state:undo() end
  if button == G.R2      then state:redo() end
  if button == G.START   then  -- Phase 5
  end
end

-- ── Mouse ─────────────────────────────────────────────────────────────────────

function love.mousepressed(x, y, button)
  if button ~= 1 then return end

  if y < C.TOPBAR_H then
    if TB.settings_hit(x, y) then end  -- Phase 5
    return
  end

  local sb_id = SB.hit(x, y, is_3d)
  if sb_id then do_sidebar(sb_id); return end

  if y > C.H - C.PICKER_H then
    local v = Picker.hit(x, y, state.n)
    if v == 0 then state:clear_cell()
    elseif v  then place_number(v) end
    return
  end

  -- Grid click (closes overlay if open)
  if x < C.SIDEBAR_X then
    if show_overlay then show_overlay = false; return end
    local col = math.floor((x - layout.x) / layout.cell) + 1
    local row = math.floor((y - layout.y) / layout.cell) + 1
    if row >= 1 and row <= state.n and col >= 1 and col <= state.n then
      local idx = (row - 1) * state.n + col
      state:select(state.cursor == idx and nil or idx)
    end
  end
end
