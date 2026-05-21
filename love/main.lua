-- Morrison Sudoku

local C       = require "src.const"
local Colors  = require "src.ui.colors"
local Fonts   = require "src.ui.fonts"
local Sett    = require "src.settings"
local Scenes  = require "src.scenes"
local State   = require "src.game.state"
local State3D = require "src.game.state3d"
local Grid    = require "src.ui.grid"
local TB      = require "src.ui.topbar"
local SB      = require "src.ui.sidebar"
local Picker  = require "src.ui.numberpicker"
local Iso     = require "src.ui.isocube"
local G       = require "src.input.gamepad"

-- ── App state ────────────────────────────────────────────────────────────────

local scene        = "menu"   -- "menu"|"game"|"pause"|"newgame"|"settings"|"complete"
local prev_scene   = "menu"   -- where to return from settings
local state        -- State or State3D
local layout
local is_3d        = false
local show_overlay = false

-- Track last game config for "Play Again"
local last_mode = "2d"
local last_n    = 9
local last_diff = "medium"

-- ── Helpers ──────────────────────────────────────────────────────────────────

local function sc(c, a)
  love.graphics.setColor(c[1], c[2], c[3], a or 1)
end

local function start_game(mode, n, diff)
  last_mode     = mode
  last_n        = n
  last_diff     = diff
  is_3d         = (mode == "3d")
  show_overlay  = false
  if is_3d then
    state = State3D.new()
  else
    state = State.new()
  end
  state:new_game(n, diff)
  layout = C.grid_layout(n)
  scene  = "game"
end

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
  elseif id == "hint"       then  -- Phase 6 TODO
  end
end

-- Handle an action table returned by a Scenes input function
local function handle_action(action)
  if not action then return end
  if action.type == "scene" then
    if action.name == "settings" then
      prev_scene = scene  -- remember where we came from
    end
    scene = action.name
  elseif action.type == "start_game" then
    start_game(action.mode, action.n, action.diff)
  elseif action.type == "back" then
    scene = prev_scene
  elseif action.type == "quit" then
    Sett.save()
    love.event.quit()
  end
end

-- ── LÖVE callbacks ────────────────────────────────────────────────────────────

function love.load()
  math.randomseed(os.time())
  Sett.load()
  Fonts.init()
  Colors.set(Sett.color_mode)
end

function love.update(dt)
  if scene == "game" and state then
    state:update(dt)
    if state.is_complete and scene == "game" then
      Scenes.set_complete(state.timer, last_diff, last_n, is_3d)
      scene = "complete"
    end
  end
end

function love.draw()
  local co = Colors.current

  -- Always draw game underneath modals (except main menu)
  if scene ~= "menu" and state then
    local ds = draw_state()
    sc(co.bg)
    love.graphics.rectangle("fill", 0, 0, C.W, C.H)
    TB.draw(state, Fonts, Colors)
    Grid.draw(ds, layout, Fonts, Colors)
    SB.draw(state, Fonts, Colors, show_overlay, is_3d)
    Picker.draw(ds, Fonts, Colors)
    if show_overlay and is_3d then
      Iso.draw(state, Fonts, Colors)
    end
  end

  -- Scene overlays
  if scene == "menu" then
    Scenes.draw_menu(Fonts, Colors, false)
  elseif scene == "newgame" then
    Scenes.draw_newgame(Fonts, Colors)
  elseif scene == "pause" then
    Scenes.draw_pause(Fonts, Colors)
  elseif scene == "settings" then
    Scenes.draw_settings(Fonts, Colors)
  elseif scene == "complete" then
    Scenes.draw_complete(Fonts, Colors)
  end

  -- Gamepad debug
  local js = love.joystick.getJoysticks()
  love.graphics.setFont(Fonts.sm)
  sc(co.label_dim)
  love.graphics.print(#js > 0 and js[1]:getName() or "no gamepad", 6, C.H - 13)
end

-- ── Unified input handler ─────────────────────────────────────────────────────

-- Translate a raw key or gamepad button into a semantic action key
local function semantic(raw)
  local map = {
    up="up", down="down", left="left", right="right",
    dpup="up", dpdown="down", dpleft="left", dpright="right",
    ["return"]="confirm", space="confirm", a="confirm",
    escape="back", b="back",
    p="start", start="start",
  }
  return map[raw] or raw
end

local function handle_input(raw)
  local key = semantic(raw)

  if scene == "game" then
    -- D-pad → grid cursor
    if raw == "up"    or raw == "dpup"    then state:move(-1,  0) return end
    if raw == "down"  or raw == "dpdown"  then state:move( 1,  0) return end
    if raw == "left"  or raw == "dpleft"  then state:move( 0, -1) return end
    if raw == "right" or raw == "dpright" then state:move( 0,  1) return end

    -- Shoulders: layer in 3D, picker in 2D
    if raw == "leftshoulder"  or raw == "[" then
      if is_3d then state:change_layer(-1) else state:move_pick(-1) end; return
    end
    if raw == "rightshoulder" or raw == "]" then
      if is_3d then state:change_layer( 1) else state:move_pick( 1) end; return
    end

    if raw == "a" or raw == "return" then place_number(state.pick_cursor); return end
    if raw == "b" or raw == "backspace" or raw == "delete" then state:clear_cell(); return end
    if raw == "x" or raw == "p" then state.pencil_mode = not state.pencil_mode; return end
    if raw == "back" or raw == "tab" then show_overlay = not show_overlay; return end
    if raw == "lefttrigger"  or raw == "z" then state:undo(); return end
    if raw == "righttrigger" or raw == "y" then state:redo(); return end
    if raw == "start" or raw == "escape" then scene = "pause"; return end

    -- Direct number keys
    local num = tonumber(raw)
    if num and num >= 1 and num <= state.n then place_number(num); return end
    if #raw == 1 and raw >= "a" and raw <= "p" then
      local v = raw:byte() - string.byte("a") + 10
      if v >= 10 and v <= state.n then place_number(v) end
      return
    end

  elseif scene == "menu" then
    handle_action(Scenes.input_menu(key))

  elseif scene == "newgame" then
    handle_action(Scenes.input_newgame(key))

  elseif scene == "pause" then
    if raw == "start" then key = "back" end
    handle_action(Scenes.input_pause(key))

  elseif scene == "settings" then
    handle_action(Scenes.input_settings(key, Colors, function(theme)
      Colors.set(theme)
    end))

  elseif scene == "complete" then
    handle_action(Scenes.input_complete(key, last_mode, last_n, last_diff))
  end

  -- Dev shortcuts (F-keys, always active)
  if raw == "f1" then start_game("2d", 9,  "easy")   end
  if raw == "f2" then start_game("2d", 9,  "medium") end
  if raw == "f3" then start_game("2d", 9,  "hard")   end
  if raw == "f4" then start_game("2d", 16, "easy")   end
  if raw == "f8" then start_game("3d", 4,  "easy")   end
  if raw == "f9" then start_game("3d", 9,  "medium") end
end

function love.keypressed(key) handle_input(key) end

function love.gamepadpressed(joystick, button) handle_input(button) end

-- ── Mouse ─────────────────────────────────────────────────────────────────────

function love.mousepressed(x, y, button)
  if button ~= 1 then return end

  -- Non-game scenes: delegate to Scenes click handlers
  if scene == "menu" then
    handle_action(Scenes.click_menu(x, y)); return
  elseif scene == "newgame" then
    handle_action(Scenes.click_newgame(x, y)); return
  elseif scene == "pause" then
    handle_action(Scenes.click_pause(x, y)); return
  elseif scene == "settings" then
    handle_action(Scenes.click_settings(x, y, Colors, function(theme)
      Colors.set(theme)
    end)); return
  elseif scene == "complete" then
    handle_action(Scenes.click_complete(x, y, last_mode, last_n, last_diff)); return
  end

  if y < C.TOPBAR_H then
    if TB.settings_hit(x, y) then
      prev_scene = scene; scene = "settings"
    end
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
