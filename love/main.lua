-- Morrison Sudoku

local C       = require "src.const"
local Colors  = require "src.ui.colors"
local Fonts   = require "src.ui.fonts"
local Sett    = require "src.settings"
local Scenes  = require "src.scenes"
local State   = require "src.game.state"
local State3D = require "src.game.state3d"
local Save    = require "src.game.save"
local Grid    = require "src.ui.grid"
local TB      = require "src.ui.topbar"
local SB      = require "src.ui.sidebar"
local Picker  = require "src.ui.numberpicker"
local Iso     = require "src.ui.isocube"
local G       = require "src.input.gamepad"

-- ── App state ────────────────────────────────────────────────────────────────

local scene        = "menu"
local prev_scene   = "menu"
local state
local layout
local is_3d        = false
local show_overlay = false

-- Deferred generation: set these then set scene="loading" for one frame
local pending_gen  = nil   -- { mode, n, diff }

-- Track last game config for "Play Again"
local last_mode = "2d"
local last_n    = 9
local last_diff = "medium"

-- ── Helpers ──────────────────────────────────────────────────────────────────

local function sc(c, a)
  love.graphics.setColor(c[1], c[2], c[3], a or 1)
end

-- Queue a game to generate on the next frame (shows loading screen first).
local function request_game(mode, n, diff)
  last_mode    = mode
  last_n       = n
  last_diff    = diff
  pending_gen  = { mode=mode, n=n, diff=diff }
  scene        = "loading"
end

local function start_game(mode, n, diff)
  last_mode    = mode
  last_n       = n
  last_diff    = diff
  is_3d        = (mode == "3d")
  show_overlay = false
  if is_3d then state = State3D.new() else state = State.new() end
  state:new_game(n, diff)
  layout = C.grid_layout(n)
  Save.delete()   -- clear any existing save for this new game
  scene  = "game"
end

-- Restore a previously saved game from disk.
local function restore_game(sv)
  is_3d        = (sv.mode == "3d")
  show_overlay = false
  last_mode    = sv.mode
  last_n       = sv.n
  last_diff    = sv.difficulty

  if is_3d then state = State3D.new() else state = State.new() end
  local n = sv.n

  -- Reconstruct puzzle table
  state.n = n
  state.puzzle = {
    size       = n,
    depth      = sv.depth,
    difficulty = sv.difficulty,
    cells      = sv.puzzle_cells,
    solution   = sv.solution,
  }
  state.user_values  = {}
  state.pencil_marks = {}
  local total = is_3d and (n*n*n) or (n*n)
  for i = 1, total do
    state.user_values[i]  = sv.user_values[i]
    state.pencil_marks[i] = {}
  end
  state.timer        = sv.timer
  state.cursor       = nil
  state.pencil_mode  = false
  state.pick_cursor  = 1
  state.is_complete  = false
  if is_3d then state.active_layer = sv.layer end

  -- Seed history with the restored state so undo works from here
  state.hist:reset(state.user_values, state.pencil_marks, total)

  -- Recompute derived state
  local V = is_3d and require("src.puzzle.validator3d") or require("src.puzzle.validator")
  if is_3d then
    state.conflicts = V.get_all_conflicts(
      (function()
        local m = {}
        for i = 1, total do m[i] = state.puzzle.cells[i] or state.user_values[i] end
        return m
      end)(), n)
  else
    local merged = {}
    for i = 1, total do merged[i] = state.puzzle.cells[i] or state.user_values[i] end
    state.conflicts = V.get_all_conflicts(merged, n)
  end
  state.is_complete = false  -- don't auto-complete a restored game

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
    if action.name == "settings" then prev_scene = scene end
    if action.name == "menu" and state then Save.write(state, is_3d) end
    scene = action.name
  elseif action.type == "restart_game" then
    if state and state.puzzle then
      state:restart()
      Save.delete()
      scene = "game"
    else
      request_game("2d", 9, "medium")
    end
  elseif action.type == "load_save" then
    local sv = Save.read()
    if sv then restore_game(sv) else request_game("2d", 9, "medium") end
  elseif action.type == "start_game" then
    request_game(action.mode, action.n, action.diff)
  elseif action.type == "back" then
    scene = prev_scene
  elseif action.type == "quit" then
    if state then Save.write(state, is_3d) end
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
  -- If a save exists, show "Continue" as first option
  -- (Scenes module reads Save.exists() to enable the button)
end

function love.update(dt)
  -- Deferred puzzle generation (runs the frame after "loading" is drawn)
  if pending_gen then
    local cfg  = pending_gen
    pending_gen = nil
    start_game(cfg.mode, cfg.n, cfg.diff)
    return
  end

  if scene == "game" and state then
    state:update(dt)
    if state.is_complete and scene == "game" then
      Save.delete()
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

  -- Loading screen (one frame while generation runs)
  if scene == "loading" then
    local co = Colors.current
    sc(co.bg)
    love.graphics.rectangle("fill", 0, 0, C.W, C.H)
    love.graphics.setFont(Fonts.md)
    sc(co.accent)
    local msg = "Generating puzzle..."
    love.graphics.print(msg,
      math.floor((C.W - Fonts.md:getWidth(msg)) / 2),
      math.floor(C.H / 2 - Fonts.md:getHeight() / 2))
    return
  end

  -- Scene overlays
  if scene == "menu" then
    Scenes.draw_menu(Fonts, Colors, Save.exists())
  elseif scene == "newgame" then
    Scenes.draw_newgame(Fonts, Colors)
  elseif scene == "pause" then
    Scenes.draw_pause(Fonts, Colors)
  elseif scene == "settings" then
    Scenes.draw_settings(Fonts, Colors)
  elseif scene == "complete" then
    Scenes.draw_complete(Fonts, Colors)
  end

  -- Version watermark
  love.graphics.setFont(Fonts.sm)
  sc(co.label_dim, 0.35)
  love.graphics.print("v0.1", C.W - Fonts.sm:getWidth("v0.1") - 6, C.H - 13)
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

    -- Shoulders: when the 3D cube panel is open, change layers.
    -- Otherwise (including 2D mode), navigate the number picker.
    -- This means: open the Layers panel → shoulder buttons flip through layers.
    --             Close it → shoulder buttons pick a number.
    if raw == "leftshoulder"  or raw == "[" then
      if is_3d and show_overlay then state:change_layer(-1)
      else state:move_pick(-1) end; return
    end
    if raw == "rightshoulder" or raw == "]" then
      if is_3d and show_overlay then state:change_layer( 1)
      else state:move_pick( 1) end; return
    end

    if raw == "a" or raw == "return" then place_number(state.pick_cursor); return end
    if raw == "b" or raw == "backspace" or raw == "delete" then state:clear_cell(); return end
    if raw == "x" or raw == "p" then state.pencil_mode = not state.pencil_mode; return end
    if raw == "back" or raw == "tab" then show_overlay = not show_overlay; return end
    if raw == "lefttrigger"  or raw == "z" then state:undo(); return end
    if raw == "righttrigger" or raw == "y" then state:redo(); return end
    if raw == "start" or raw == "escape" then
      Save.write(state, is_3d)
      scene = "pause"
      return
    end

    -- Direct number keys
    local num = tonumber(raw)
    if num and num >= 1 and num <= state.n then place_number(num); return end
    if #raw == 1 and raw >= "a" and raw <= "p" then
      local v = raw:byte() - string.byte("a") + 10
      if v >= 10 and v <= state.n then place_number(v) end
      return
    end

  elseif scene == "menu" then
    handle_action(Scenes.input_menu(key, Save.exists()))

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
