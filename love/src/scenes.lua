-- All non-game screens: main menu, new game config, pause, settings, complete.
-- Each screen exposes draw(fonts, colors) and input(key_or_btn) → action table.
-- Actions: { type="start_game", mode, n, diff } | { type="scene", name } | nil

local C    = require "src.const"
local Sett = require "src.settings"
local Save = require "src.game.save"

-- Lazy-loaded logo image
local _logo
local function get_logo()
  if _logo == nil then
    local ok, img = pcall(love.graphics.newImage,
      "assets/images/morrison-crest-real.png")
    _logo = ok and img or false   -- false = tried and failed, don't retry
  end
  return _logo or nil
end

local Sc = {}

-- ── Drawing primitives ────────────────────────────────────────────────────────

local function sc(c, a)
  love.graphics.setColor(c[1], c[2], c[3], a or 1)
end

local function fullscreen_bg(co)
  sc(co.bg, 0.97)
  love.graphics.rectangle("fill", 0, 0, C.W, C.H)
end

local function modal_bg(x, y, w, h, co)
  sc({0, 0, 0}, 0.65)
  love.graphics.rectangle("fill", 0, 0, C.W, C.H)
  sc(co.card_bg or co.topbar_bg)
  love.graphics.rectangle("fill", x, y, w, h, 12)
  sc(co.border_box)
  love.graphics.setLineWidth(1.5)
  love.graphics.rectangle("line", x, y, w, h, 12)
  love.graphics.setLineWidth(1)
end

local function centered_text(text, y, font, co)
  love.graphics.setFont(font)
  sc(co.topbar_text)
  love.graphics.print(text, math.floor((C.W - font:getWidth(text)) / 2), y)
end

local function accent_text(text, y, font, co)
  love.graphics.setFont(font)
  sc(co.accent)
  love.graphics.print(text, math.floor((C.W - font:getWidth(text)) / 2), y)
end

-- Vertical list of buttons; returns button height for layout calcs
local BTN_H   = 54
local BTN_W   = 320
local BTN_GAP = 10

local function list_btn(text, bx, by, selected, font, co)
  if selected then
    sc(co.cell_sel_bg)
    love.graphics.rectangle("fill", bx, by, BTN_W, BTN_H, 8)
    sc(co.accent)
    love.graphics.setLineWidth(2)
    love.graphics.rectangle("line", bx, by, BTN_W, BTN_H, 8)
    love.graphics.setLineWidth(1)
    sc(co.cell_sel_txt)
  else
    sc(co.picker_cell)
    love.graphics.rectangle("fill", bx, by, BTN_W, BTN_H, 8)
    sc(co.picker_border)
    love.graphics.rectangle("line", bx, by, BTN_W, BTN_H, 8)
    sc(co.picker_txt)
  end
  love.graphics.setFont(font)
  local tw = font:getWidth(text)
  local th = font:getHeight()
  love.graphics.print(text,
    math.floor(bx + (BTN_W - tw) / 2),
    math.floor(by + (BTN_H - th) / 2))
end

-- Draws a row: label on left, horizontal chip-options on right
local CHIP_H  = 40
local CHIP_GAP = 6

local function option_row(label, options, sel_idx, rx, ry, row_w, active_row, font_sm, font_md, co)
  -- Label
  love.graphics.setFont(font_sm)
  sc(active_row and co.topbar_text or co.label_txt)
  love.graphics.print(label, rx, ry + math.floor((CHIP_H - font_sm:getHeight()) / 2))

  -- Chips
  local label_w  = 170
  local chips_x  = rx + label_w
  local chip_w   = (row_w - label_w - CHIP_GAP * (#options - 1)) / #options
  chip_w = math.floor(chip_w)

  for i, opt in ipairs(options) do
    local cx = chips_x + (i - 1) * (chip_w + CHIP_GAP)
    local is_sel = (i == sel_idx)
    if is_sel then
      sc(co.cell_sel_bg)
      love.graphics.rectangle("fill", cx, ry, chip_w, CHIP_H, 6)
      sc(co.accent)
      love.graphics.setLineWidth(active_row and 2 or 1)
      love.graphics.rectangle("line", cx, ry, chip_w, CHIP_H, 6)
      love.graphics.setLineWidth(1)
      sc(co.cell_sel_txt)
    else
      sc(active_row and co.picker_cell or co.cell_bg)
      love.graphics.rectangle("fill", cx, ry, chip_w, CHIP_H, 6)
      sc(co.picker_border)
      love.graphics.rectangle("line", cx, ry, chip_w, CHIP_H, 6)
      sc(active_row and co.picker_txt or co.label_dim)
    end
    love.graphics.setFont(font_sm)
    local tw = font_sm:getWidth(opt)
    local th = font_sm:getHeight()
    love.graphics.print(opt,
      math.floor(cx + (chip_w - tw) / 2),
      math.floor(ry + (CHIP_H - th) / 2))
  end
end

-- Toggle row: label + pill
local function toggle_row(label, on, rx, ry, row_active, font_sm, co)
  love.graphics.setFont(font_sm)
  sc(row_active and co.topbar_text or co.label_txt)
  love.graphics.print(label, rx, ry + math.floor((CHIP_H - font_sm:getHeight()) / 2))

  local pw, ph = 44, 22
  local px = rx + 400
  local py = ry + math.floor((CHIP_H - ph) / 2)
  sc(on and co.accent or co.label_dim)
  love.graphics.rectangle("fill", px, py, pw, ph, ph / 2)
  sc({1, 1, 1}, 0.9)
  local kx = on and px + pw - ph + 2 or px + 2
  love.graphics.circle("fill", kx + (ph - 4) / 2, py + ph / 2, (ph - 4) / 2)

  -- "On"/"Off" label
  love.graphics.setFont(font_sm)
  sc(on and co.accent or co.label_dim)
  local state_lbl = on and "On" or "Off"
  love.graphics.print(state_lbl, px + pw + 8, ry + math.floor((CHIP_H - font_sm:getHeight()) / 2))
end

-- Hint bar at bottom of modals
local function hint_bar(text, y, font, co)
  love.graphics.setFont(font)
  sc(co.label_dim)
  love.graphics.print(text, math.floor((C.W - font:getWidth(text)) / 2), y)
end

-- ── Scene state ───────────────────────────────────────────────────────────────

local st = {
  menu = { cursor = 1 },

  newgame = {
    cursor = 1,   -- row: 1=mode 2=size 3=diff 4=start
    mode   = 1,   -- 1=2D 2=3D
    size   = 2,   -- index into size list (default: 9×9 for 2D, 4×4×4 for 3D)
    diff   = 2,   -- 1=Easy 2=Medium 3=Hard 4=Expert
  },

  pause  = { cursor = 1 },
  sett   = { cursor = 1 },
  done   = { cursor = 1, elapsed = 0, diff = "", n = 0 },
}

-- Menu items; Continue is inserted dynamically when a save exists.
local MENU_ITEMS_NOSAVE = { "New Game", "Settings", "Quit" }
local MENU_ITEMS_SAVE   = { "Continue", "New Game", "Settings", "Quit" }
local function menu_items(has_save)
  return has_save and MENU_ITEMS_SAVE or MENU_ITEMS_NOSAVE
end
local MENU_ITEMS = MENU_ITEMS_NOSAVE  -- compat alias (updated per-call)
local PAUSE_ITEMS = { "Resume", "New Game", "Settings", "Quit" }
local DONE_ITEMS  = { "Play Again", "New Game", "Menu" }

local DIFF_OPTS  = { "Easy", "Medium", "Hard", "Expert" }
local DIFF_VALS  = { "easy", "medium", "hard", "expert" }
local MODE_OPTS  = { "2D", "3D" }
local SIZE_2D    = { "4×4", "9×9", "16×16", "25×25" }
local SIZE_2D_N  = { 4, 9, 16, 25 }
local SIZE_3D    = { "4×4×4", "9×9×9", "16×16×16" }
local SIZE_3D_N  = { 4, 9, 16 }

local SETT_ROWS = {
  { key = "color_mode",        label = "Color Theme",    type = "cycle",  opts = {"dark","nord","autumn"} },
  { key = "show_timer",        label = "Show Timer",     type = "toggle" },
  { key = "show_errors",       label = "Show Errors",    type = "toggle" },
  { key = "highlight_related", label = "Highlight Group",type = "toggle" },
  { key = "highlight_same_num",label = "Same Numbers",   type = "toggle" },
  { key = "pencil_auto_clean", label = "Auto Clean ✏",  type = "toggle" },
}

-- ── Draw helpers ──────────────────────────────────────────────────────────────

local function size_opts()
  return st.newgame.mode == 1 and SIZE_2D or SIZE_3D
end

-- ── Main Menu ─────────────────────────────────────────────────────────────────

function Sc.draw_menu(fonts, colors, has_save)
  local co    = colors.current
  local items = menu_items(has_save)
  fullscreen_bg(co)

  -- Logo
  local logo       = get_logo()
  local logo_h     = 0
  local LOGO_SIZE  = 160   -- display size in pixels
  local LOGO_PAD   = 20    -- gap below logo before title

  if logo then
    local iw    = logo:getWidth()
    local ih    = logo:getHeight()
    local scale = LOGO_SIZE / math.max(iw, ih)
    local dw    = iw * scale
    local dh    = ih * scale
    local lx    = math.floor((C.W - dw) / 2)
    local ly    = 36
    love.graphics.setColor(1, 1, 1, 1)
    love.graphics.draw(logo, lx, ly, 0, scale, scale)
    logo_h = dh + LOGO_PAD
  end

  -- Title and subtitle, pushed down by logo
  local title_y = 36 + logo_h
  love.graphics.setFont(fonts.md)
  sc(co.accent)
  local title = "Morrison Sudoku"
  love.graphics.print(title,
    math.floor((C.W - fonts.md:getWidth(title)) / 2), title_y)

  love.graphics.setFont(fonts.sm)
  sc(co.label_txt)
  local sub = "PUZZLE COLLECTION"
  love.graphics.print(sub,
    math.floor((C.W - fonts.sm:getWidth(sub)) / 2),
    title_y + fonts.md:getHeight() + 5)

  -- Clamp cursor
  if st.menu.cursor > #items then st.menu.cursor = 1 end

  local bx  = math.floor((C.W - BTN_W) / 2)
  local by0 = title_y + fonts.md:getHeight() + fonts.sm:getHeight() + 30
  for i, lbl in ipairs(items) do
    local by = by0 + (i - 1) * (BTN_H + BTN_GAP)
    list_btn(lbl, bx, by, st.menu.cursor == i, fonts.md, co)
  end

  hint_bar("D-pad ↑↓   A / Enter to select", C.H - 36, fonts.sm, co)
end

function Sc.input_menu(key, has_save)
  has_save = has_save ~= false and Save.exists()
  local items = menu_items(has_save)
  local n     = #items
  if key == "up"   or key == "dpup"   then st.menu.cursor = ((st.menu.cursor - 2) % n) + 1 end
  if key == "down" or key == "dpdown" then st.menu.cursor = (st.menu.cursor % n) + 1 end
  if key == "confirm" or key == "return" or key == "space" then
    local item = items[st.menu.cursor]
    if item == "Continue"  then return { type = "load_save" } end
    if item == "New Game"  then return { type = "scene", name = "newgame" } end
    if item == "Settings"  then return { type = "scene", name = "settings" } end
    if item == "Quit"      then return { type = "quit" } end
  end
  return nil
end

-- ── New Game ──────────────────────────────────────────────────────────────────

function Sc.draw_newgame(fonts, colors)
  local co = colors.current
  local mx, my, mw, mh = 80, 110, 560, 480
  modal_bg(mx, my, mw, mh, co)
  accent_text("New Game", my + 26, fonts.md, co)

  local row_x  = mx + 28
  local row_w  = mw - 56
  local row_gap = 58
  local ry0    = my + 88

  -- Row 1: Mode
  option_row("Mode", MODE_OPTS, st.newgame.mode, row_x, ry0, row_w,
    st.newgame.cursor == 1, fonts.sm, fonts.md, co)
  -- Row 2: Size
  option_row("Size", size_opts(), st.newgame.size, row_x, ry0 + row_gap, row_w,
    st.newgame.cursor == 2, fonts.sm, fonts.md, co)
  -- Row 3: Difficulty
  option_row("Difficulty", DIFF_OPTS, st.newgame.diff, row_x, ry0 + row_gap * 2, row_w,
    st.newgame.cursor == 3, fonts.sm, fonts.md, co)

  -- Start button
  local bx = mx + math.floor((mw - BTN_W) / 2)
  local by = my + mh - BTN_H - 28
  list_btn("Start", bx, by, st.newgame.cursor == 4, fonts.md, co)

  hint_bar("↑↓ rows   ◀▶ options   A to Start   B back", my + mh + 10, fonts.sm, co)
end

function Sc.input_newgame(key)
  local ng    = st.newgame
  local sizes = size_opts()

  if key == "up" or key == "dpup" then
    ng.cursor = math.max(1, ng.cursor - 1)
  elseif key == "down" or key == "dpdown" then
    ng.cursor = math.min(4, ng.cursor + 1)
  elseif key == "left" or key == "dpleft" then
    if ng.cursor == 1 then
      ng.mode = ((ng.mode - 2) % 2) + 1
      ng.size = ng.mode == 1 and 2 or 1   -- 2D defaults to 9×9, 3D to 4×4×4
    elseif ng.cursor == 2 then ng.size = ((ng.size - 2) % #sizes) + 1
    elseif ng.cursor == 3 then ng.diff = ((ng.diff - 2) % #DIFF_OPTS) + 1
    end
  elseif key == "right" or key == "dpright" then
    if ng.cursor == 1 then
      ng.mode = (ng.mode % 2) + 1
      ng.size = ng.mode == 1 and 2 or 1
    elseif ng.cursor == 2 then ng.size = (ng.size % #sizes) + 1
    elseif ng.cursor == 3 then ng.diff = (ng.diff % #DIFF_OPTS) + 1
    end
  elseif key == "confirm" or key == "return" or key == "space" then
    if ng.cursor == 4 then
      local mode = ng.mode == 1 and "2d" or "3d"
      local n    = ng.mode == 1 and SIZE_2D_N[ng.size] or SIZE_3D_N[ng.size]
      local diff = DIFF_VALS[ng.diff]
      return { type = "start_game", mode = mode, n = n, diff = diff }
    end
  elseif key == "back" or key == "escape" then
    return { type = "scene", name = "menu" }
  end
  return nil
end

-- ── Pause ─────────────────────────────────────────────────────────────────────

function Sc.draw_pause(fonts, colors)
  local co = colors.current
  local mx, my, mw, mh = 200, 160, 320, 340
  modal_bg(mx, my, mw, mh, co)
  accent_text("Paused", my + 26, fonts.md, co)

  local bx  = mx + math.floor((mw - BTN_W) / 2)
  local by0 = my + 82
  for i, lbl in ipairs(PAUSE_ITEMS) do
    local by = by0 + (i - 1) * (BTN_H + BTN_GAP)
    list_btn(lbl, bx, by, st.pause.cursor == i, fonts.md, co)
  end

  hint_bar("↑↓   A select   B resume", my + mh + 10, fonts.sm, co)
end

function Sc.input_pause(key)
  local n = #PAUSE_ITEMS
  if key == "up"   or key == "dpup"   then st.pause.cursor = ((st.pause.cursor - 2) % n) + 1 end
  if key == "down" or key == "dpdown" then st.pause.cursor = (st.pause.cursor % n) + 1 end
  if key == "back" or key == "escape" or key == "start" then
    return { type = "scene", name = "game" }
  end
  if key == "confirm" or key == "return" or key == "space" then
    local item = PAUSE_ITEMS[st.pause.cursor]
    if item == "Resume"   then return { type = "scene", name = "game" } end
    if item == "New Game" then return { type = "scene", name = "newgame" } end
    if item == "Settings" then return { type = "scene", name = "settings" } end
    if item == "Quit"     then return { type = "scene", name = "menu" } end
  end
  return nil
end

-- ── Settings ──────────────────────────────────────────────────────────────────

local COLOR_LABELS = { dark = "Dark", nord = "Nord", autumn = "Autumn" }

-- Three bottom action buttons for settings
local SETT_ACTIONS = { "Restart", "New Game", "Done" }

function Sc.draw_settings(fonts, colors)
  local co  = colors.current
  local mx, my, mw, mh = 100, 60, 520, 576
  modal_bg(mx, my, mw, mh, co)
  accent_text("Settings", my + 26, fonts.md, co)

  local row_x  = mx + 28
  local row_w  = mw - 56
  local row_gap = 54
  local ry0    = my + 86

  for i, row in ipairs(SETT_ROWS) do
    local ry      = ry0 + (i - 1) * row_gap
    local active  = (st.sett.cursor == i)

    if row.type == "cycle" then
      -- Find current selection index
      local sel = 1
      for j, v in ipairs(row.opts) do
        if Sett[row.key] == v then sel = j; break end
      end
      local labels = {}
      for _, v in ipairs(row.opts) do
        labels[#labels + 1] = COLOR_LABELS[v] or v
      end
      option_row(row.label, labels, sel, row_x, ry, row_w,
        active, fonts.sm, fonts.md, co)
    else
      -- Draw active row highlight
      if active then
        sc(co.cell_hl_bg)
        love.graphics.rectangle("fill", row_x - 6, ry - 4, row_w + 12, CHIP_H + 8, 6)
      end
      toggle_row(row.label, Sett[row.key], row_x, ry, active, fonts.sm, co)
    end
  end

  -- Bottom action row: [Restart] [New Game] [Done]
  local gap3   = 10
  local bw3    = math.floor((row_w - gap3 * 2) / 3)
  local by3    = my + mh - BTN_H - 18
  for i, lbl in ipairs(SETT_ACTIONS) do
    local bx3 = row_x + (i - 1) * (bw3 + gap3)
    local sel  = (st.sett.cursor == #SETT_ROWS + i)
    if sel then
      sc(co.cell_sel_bg)
      love.graphics.rectangle("fill", bx3, by3, bw3, BTN_H, 7)
      sc(co.accent)
      love.graphics.setLineWidth(2)
      love.graphics.rectangle("line", bx3, by3, bw3, BTN_H, 7)
      love.graphics.setLineWidth(1)
      sc(co.cell_sel_txt)
    else
      sc(co.picker_cell)
      love.graphics.rectangle("fill", bx3, by3, bw3, BTN_H, 7)
      sc(co.picker_border)
      love.graphics.rectangle("line", bx3, by3, bw3, BTN_H, 7)
      sc(co.picker_txt)
    end
    love.graphics.setFont(fonts.sm)
    love.graphics.print(lbl,
      math.floor(bx3 + (bw3 - fonts.sm:getWidth(lbl)) / 2),
      math.floor(by3 + (BTN_H - fonts.sm:getHeight()) / 2))
  end

  hint_bar("↑↓   ◀▶ / A to change   B done", my + mh + 10, fonts.sm, co)
end

function Sc.input_settings(key, colors, on_theme_change)
  local total = #SETT_ROWS + #SETT_ACTIONS
  if key == "up"   or key == "dpup"   then st.sett.cursor = math.max(1, st.sett.cursor - 1) end
  if key == "down" or key == "dpdown" then st.sett.cursor = math.min(total, st.sett.cursor + 1) end

  local row = SETT_ROWS[st.sett.cursor]
  if row then
    if key == "confirm" or key == "return" or key == "space"
    or key == "left"  or key == "dpleft"
    or key == "right" or key == "dpright" then
      if row.type == "cycle" then
        local d = (key == "left" or key == "dpleft") and -1 or 1
        local n = #row.opts
        local cur = 1
        for j, v in ipairs(row.opts) do if Sett[row.key] == v then cur = j; break end end
        Sett[row.key] = row.opts[((cur - 1 + d) % n) + 1]
        Sett.save()
        if row.key == "color_mode" and on_theme_change then
          on_theme_change(Sett.color_mode)
        end
      else
        Sett.toggle(row.key)
      end
    end
  end

  -- Bottom action buttons
  local action_idx = st.sett.cursor - #SETT_ROWS
  if action_idx >= 1 and action_idx <= #SETT_ACTIONS then
    if key == "confirm" or key == "return" or key == "space" then
      local lbl = SETT_ACTIONS[action_idx]
      if lbl == "Restart"  then return { type = "restart_game" } end
      if lbl == "New Game" then return { type = "scene", name = "newgame" } end
      if lbl == "Done"     then return { type = "back" } end
    end
  end

  if key == "back" or key == "escape" then return { type = "back" } end
  return nil
end

-- ── Complete ──────────────────────────────────────────────────────────────────

function Sc.set_complete(elapsed, diff, n, is_3d)
  local ds  = st.done
  ds.elapsed = elapsed
  ds.diff    = diff
  ds.n       = n
  ds.is_3d   = is_3d
  ds.cursor  = 1
end

function Sc.draw_complete(fonts, colors)
  local co  = colors.current
  local ds  = st.done
  local mx, my, mw, mh = 120, 170, 480, 360
  modal_bg(mx, my, mw, mh, co)

  accent_text("Puzzle Complete!", my + 28, fonts.md, co)

  -- Time
  local m   = math.floor(ds.elapsed / 60)
  local s   = math.floor(ds.elapsed % 60)
  local tstr = string.format("%02d:%02d", m, s)
  centered_text(tstr, my + 82, fonts.md, co)

  local sz_lbl = ds.is_3d and (ds.n .. "×" .. ds.n .. "×" .. ds.n)
                           or (ds.n .. "×" .. ds.n)
  local sub = ds.diff:sub(1,1):upper() .. ds.diff:sub(2) .. "  ·  " .. sz_lbl
  love.graphics.setFont(fonts.sm)
  sc(co.label_txt)
  love.graphics.print(sub,
    math.floor((C.W - fonts.sm:getWidth(sub)) / 2), my + 82 + fonts.md:getHeight() + 6)

  local bx  = mx + math.floor((mw - BTN_W) / 2)
  for i, lbl in ipairs(DONE_ITEMS) do
    local by = my + 168 + (i - 1) * (BTN_H + BTN_GAP)
    list_btn(lbl, bx, by, ds.cursor == i, fonts.md, co)
  end
end

function Sc.input_complete(key, prev_mode, prev_n, prev_diff)
  local n = #DONE_ITEMS
  if key == "up"   or key == "dpup"   then st.done.cursor = math.max(1, st.done.cursor - 1) end
  if key == "down" or key == "dpdown" then st.done.cursor = math.min(n, st.done.cursor + 1) end
  if key == "confirm" or key == "return" or key == "space" then
    local item = DONE_ITEMS[st.done.cursor]
    if item == "Play Again" then
      return { type = "start_game", mode = prev_mode, n = prev_n, diff = prev_diff }
    end
    if item == "New Game" then return { type = "scene", name = "newgame" } end
    if item == "Menu"     then return { type = "scene", name = "menu" } end
  end
  return nil
end

-- ── Mouse click handlers ──────────────────────────────────────────────────────

-- Returns index of the button clicked in a vertical list, or nil.
local function list_hit(x, y, bx, by0, n)
  if x < bx or x > bx + BTN_W then return nil end
  for i = 1, n do
    local by = by0 + (i - 1) * (BTN_H + BTN_GAP)
    if y >= by and y <= by + BTN_H then return i end
  end
  return nil
end

-- Returns index of the chip clicked in an option row, or nil.
local function chip_hit(x, y, rx, ry, n_chips, row_w)
  if y < ry or y > ry + CHIP_H then return nil end
  local chips_x = rx + 170
  local chip_w  = math.floor((row_w - 170 - CHIP_GAP * (n_chips - 1)) / n_chips)
  for i = 1, n_chips do
    local cx = chips_x + (i - 1) * (chip_w + CHIP_GAP)
    if x >= cx and x <= cx + chip_w then return i end
  end
  return nil
end

function Sc.click_menu(x, y)
  local has_save = Save.exists()
  local items    = menu_items(has_save)
  local bx       = math.floor((C.W - BTN_W) / 2)

  -- Compute by0 the same way draw_menu does
  local logo_h = get_logo() and (160 + 20) or 0
  local title_y = 36 + logo_h
  local by0 = title_y + 15 + 11 + 30   -- approx md_h + sm_h + gap

  local i = list_hit(x, y, bx, by0, #items)
  if i then
    st.menu.cursor = i
    return Sc.input_menu("confirm", has_save)
  end
end

function Sc.click_newgame(x, y)
  local ng  = st.newgame
  local mx, my, mw, mh = 80, 110, 560, 480
  local rx  = mx + 28
  local rw  = mw - 56
  local ry0 = my + 88
  local rg  = 58

  -- Mode row
  local c = chip_hit(x, y, rx, ry0, #MODE_OPTS, rw)
  if c then ng.cursor = 1; ng.mode = c; ng.size = 1; return end

  -- Size row
  c = chip_hit(x, y, rx, ry0 + rg, #size_opts(), rw)
  if c then ng.cursor = 2; ng.size = c; return end

  -- Difficulty row
  c = chip_hit(x, y, rx, ry0 + rg * 2, #DIFF_OPTS, rw)
  if c then ng.cursor = 3; ng.diff = c; return end

  -- Start button
  local bx = mx + math.floor((mw - BTN_W) / 2)
  local by = my + mh - BTN_H - 28
  if x >= bx and x <= bx + BTN_W and y >= by and y <= by + BTN_H then
    ng.cursor = 4
    return Sc.input_newgame("confirm")
  end
end

function Sc.click_pause(x, y)
  local mx, my, mw = 200, 160, 320
  local bx  = mx + math.floor((mw - BTN_W) / 2)
  local by0 = my + 82
  local i   = list_hit(x, y, bx, by0, #PAUSE_ITEMS)
  if i then
    st.pause.cursor = i
    return Sc.input_pause("confirm")
  end
end

function Sc.click_settings(x, y, colors, on_theme_change)
  local mx, my, mw, mh = 100, 60, 520, 576
  local rx  = mx + 28
  local rw  = mw - 56
  local ry0 = my + 86
  local rg  = 54

  for i, row in ipairs(SETT_ROWS) do
    local ry = ry0 + (i - 1) * rg
    if row.type == "cycle" then
      local c = chip_hit(x, y, rx, ry, #row.opts, rw)
      if c then
        st.sett.cursor = i
        Sett[row.key] = row.opts[c]
        Sett.save()
        if row.key == "color_mode" and on_theme_change then
          on_theme_change(Sett.color_mode)
        end
        return
      end
    else
      if x >= rx and x <= rx + rw and y >= ry and y <= ry + CHIP_H then
        st.sett.cursor = i
        Sett.toggle(row.key)
        return
      end
    end
  end

  -- Bottom action buttons: [Restart] [New Game] [Done]
  local gap3 = 10
  local bw3  = math.floor((rw - gap3 * 2) / 3)
  local by3  = my + mh - BTN_H - 18
  if y >= by3 and y <= by3 + BTN_H then
    for i, lbl in ipairs(SETT_ACTIONS) do
      local bx3 = rx + (i - 1) * (bw3 + gap3)
      if x >= bx3 and x <= bx3 + bw3 then
        st.sett.cursor = #SETT_ROWS + i
        if lbl == "Restart"  then return { type = "restart_game" } end
        if lbl == "New Game" then return { type = "scene", name = "newgame" } end
        if lbl == "Done"     then return { type = "back" } end
      end
    end
  end
end

function Sc.click_complete(x, y, prev_mode, prev_n, prev_diff)
  local mx, my, mw = 120, 170, 480
  local bx  = mx + math.floor((mw - BTN_W) / 2)
  local by0 = my + 168
  local i   = list_hit(x, y, bx, by0, #DONE_ITEMS)
  if i then
    st.done.cursor = i
    return Sc.input_complete("confirm", prev_mode, prev_n, prev_diff)
  end
end

return Sc
