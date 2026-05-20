-- Morrison Sudoku — Phase 0 scaffold
-- Renders the full 720×720 layout with a moveable cursor.
-- No puzzle logic yet; this verifies the visual target on device.

local C      = require "src.const"
local Colors = require "src.ui.colors"
local G      = require "src.input.gamepad"

-- ── Fonts ────────────────────────────────────────────────────────────────────
-- Drop a TTF into assets/fonts/ and update the path below.
-- Falls back to LÖVE's built-in bitmap font if not found.
local function load_font(path, size)
  local ok, f = pcall(love.graphics.newFont, path, size)
  return ok and f or love.graphics.newFont(size)
end

local FONT_PATH = "assets/fonts/JetBrainsMono-Regular.ttf"
local font_sm   -- 11px  top bar labels
local font_md   -- 16px  top bar wordmark / picker numbers
local font_lg   -- 26px  grid cell values 9×9
local font_xl   -- 14px  grid cell values 16×16

-- ── State ────────────────────────────────────────────────────────────────────
local grid_size   = 9          -- active puzzle size (9 or 16)
local cursor_row  = 4          -- 0-indexed
local cursor_col  = 4
local pick_cursor = 5          -- 1-indexed, currently selected number
local pencil_mode = false
local show_overlay = false     -- 3D cube panel open

local layout  -- set in love.load via C.grid_layout(grid_size)

-- ── Helpers ──────────────────────────────────────────────────────────────────
local function set_color(c, a)
  love.graphics.setColor(c[1], c[2], c[3], a or 1)
end

local function lerp_color(a, b, t)
  return { a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t, a[3]+(b[3]-a[3])*t }
end

-- ── Draw routines ─────────────────────────────────────────────────────────────

local function draw_topbar()
  local co = Colors.current

  -- Background
  set_color(co.topbar_bg)
  love.graphics.rectangle("fill", 0, 0, C.W, C.TOPBAR_H)

  -- Bottom border
  set_color(co.border_box)
  love.graphics.rectangle("fill", 0, C.TOPBAR_H - 1, C.W, 1)

  -- Wordmark: "Morrison" accent + "SUDOKU" dim
  love.graphics.setFont(font_md)
  set_color(co.accent)
  love.graphics.print("Morrison", 18, 15)

  love.graphics.setFont(font_sm)
  set_color(co.label_txt)
  love.graphics.print("SUDOKU", 18 + font_md:getWidth("Morrison") + 7, 20)

  -- Center: difficulty · size  (placeholder)
  local center_txt = "Easy  ·  " .. grid_size .. "×" .. grid_size
  local cw = font_sm:getWidth(center_txt)
  set_color(co.topbar_text)
  love.graphics.print(center_txt, math.floor((C.W - cw) / 2), 18)

  -- Pencil indicator
  if pencil_mode then
    local ptxt = "✏ Pencil"
    local pw = font_sm:getWidth(ptxt)
    set_color(co.accent)
    love.graphics.print(ptxt, math.floor((C.W - cw) / 2) - pw - 16, 18)
  end

  -- Right: timer + three icon circles (placeholder for ?, layers, ⚙)
  set_color(co.topbar_text)
  love.graphics.setFont(font_sm)
  love.graphics.print("00:00", C.W - 160, 18)

  local icon_y = math.floor(C.TOPBAR_H / 2)
  local icon_r = 11
  local icons  = { C.W - 108, C.W - 70, C.W - 32 }
  for _, ix in ipairs(icons) do
    set_color(co.label_dim)
    love.graphics.circle("line", ix, icon_y, icon_r)
  end
  -- "?" label in first icon
  set_color(co.label_txt)
  love.graphics.setFont(font_sm)
  love.graphics.print("?", icons[1] - 3, icon_y - 6)
end

local function draw_grid()
  local co = Colors.current
  local l  = layout
  local n  = grid_size
  local bx = l.box  -- box size (3 for 9×9)

  -- Grid background
  set_color(co.grid_bg)
  love.graphics.rectangle("fill", l.x, l.y, l.px, l.px)

  for row = 0, n - 1 do
    for col = 0, n - 1 do
      local cx = l.x + col * l.cell
      local cy = l.y + row * l.cell

      -- Cell background
      local is_sel = (row == cursor_row and col == cursor_col)
      local is_hl  = (row == cursor_row or col == cursor_col or
                      (math.floor(row / bx) == math.floor(cursor_row / bx) and
                       math.floor(col / bx) == math.floor(cursor_col / bx)))

      if is_sel then
        set_color(co.cell_sel_bg)
      elseif is_hl then
        set_color(co.cell_hl_bg)
      else
        set_color(co.cell_bg)
      end
      love.graphics.rectangle("fill", cx, cy, l.cell, l.cell)
    end
  end

  -- Grid lines
  for i = 0, n do
    local is_box = (i % bx == 0)
    local thick  = is_box and 2 or 1
    set_color(is_box and co.border_box or co.border_cell)

    -- vertical
    love.graphics.rectangle("fill",
      l.x + i * l.cell - math.floor(thick / 2), l.y, thick, l.px)
    -- horizontal
    love.graphics.rectangle("fill",
      l.x, l.y + i * l.cell - math.floor(thick / 2), l.px, thick)
  end

  -- Outer border (draw last so it's clean)
  set_color(co.border_box)
  love.graphics.setLineWidth(2)
  love.graphics.rectangle("line", l.x, l.y, l.px, l.px)
  love.graphics.setLineWidth(1)
end

local function draw_picker()
  local co   = Colors.current
  local n    = grid_size
  local sw   = C.picker_slot_w(n)
  local sh   = 54
  local py   = C.H - C.PICKER_H
  local sy   = py + math.floor((C.PICKER_H - sh) / 2)
  local font = (n > 9) and font_sm or font_md

  -- Picker background
  set_color(co.picker_bg)
  love.graphics.rectangle("fill", 0, py, C.W, C.PICKER_H)

  -- Top border
  set_color(co.border_box)
  love.graphics.rectangle("fill", 0, py, C.W, 1)

  -- Total width of all slots
  local total = (n + 1) * sw + n * 6
  local sx0   = math.floor((C.W - total) / 2)

  for i = 1, n do
    local sx   = sx0 + (i - 1) * (sw + 6)
    local is_cur = (i == pick_cursor)

    set_color(is_cur and co.picker_cur or co.picker_cell)
    love.graphics.rectangle("fill", sx, sy, sw, sh, 5)

    set_color(is_cur and co.picker_cur_txt or co.picker_txt)
    love.graphics.setFont(font)
    local lbl = (n > 9 and i > 9) and string.char(55 + i) or tostring(i)
    local lw  = font:getWidth(lbl)
    local lh  = font:getHeight()
    love.graphics.print(lbl, sx + math.floor((sw - lw) / 2),
                              sy + math.floor((sh - lh) / 2))
  end

  -- Erase slot
  local ex = sx0 + n * (sw + 6)
  set_color(co.picker_cell)
  love.graphics.rectangle("fill", ex, sy, sw, sh, 5)
  set_color(co.label_txt)
  love.graphics.setFont(font_sm)
  local bw = font_sm:getWidth("⌫")
  love.graphics.print("⌫", ex + math.floor((sw - bw) / 2),
                           sy + math.floor((sh - font_sm:getHeight()) / 2))

  -- Button hint labels
  set_color(co.label_dim)
  love.graphics.setFont(font_sm)
  love.graphics.print("L1 ◀", sx0 - 38, sy + math.floor((sh - font_sm:getHeight()) / 2))
  local rh_txt = "▶ R1"
  love.graphics.print(rh_txt, sx0 + total + 4,
                               sy + math.floor((sh - font_sm:getHeight()) / 2))
end

local function draw_overlay_hint()
  if not show_overlay then return end
  local co = Colors.current

  -- Semi-transparent panel on right
  local pw = 260
  set_color({co.topbar_bg[1], co.topbar_bg[2], co.topbar_bg[3]}, 0.96)
  love.graphics.rectangle("fill", C.W - pw, C.TOPBAR_H, pw, C.GRID_AREA_H)

  set_color(co.border_box)
  love.graphics.rectangle("fill", C.W - pw, C.TOPBAR_H, 1, C.GRID_AREA_H)

  -- Placeholder text
  love.graphics.setFont(font_sm)
  set_color(co.label_txt)
  love.graphics.printf("3D Cube Overview\n\n(Phase 4)", C.W - pw + 20,
                        C.TOPBAR_H + 40, pw - 40, "center")
end

-- ── LÖVE callbacks ────────────────────────────────────────────────────────────

function love.load()
  love.graphics.setBackgroundColor(0.1, 0.1, 0.1)

  font_sm = load_font(FONT_PATH, 11)
  font_md = load_font(FONT_PATH, 16)
  font_lg = load_font(FONT_PATH, 26)
  font_xl = load_font(FONT_PATH, 14)

  layout = C.grid_layout(grid_size)
end

function love.update(dt)
  -- nothing yet; puzzle logic arrives in Phase 1
end

function love.draw()
  local co = Colors.current
  set_color(co.bg)
  love.graphics.rectangle("fill", 0, 0, C.W, C.H)

  draw_topbar()
  draw_grid()
  draw_picker()
  draw_overlay_hint()

  -- Debug: gamepad connection status (remove before ship)
  love.graphics.setFont(font_sm)
  set_color(Colors.current.label_dim)
  local js = love.joystick.getJoysticks()
  local pad_txt = #js > 0 and ("Gamepad: " .. js[1]:getName()) or "No gamepad detected"
  love.graphics.print(pad_txt, 8, C.H - 14)
end

-- ── Input ─────────────────────────────────────────────────────────────────────

local function move_cursor(dr, dc)
  cursor_row = math.max(0, math.min(grid_size - 1, cursor_row + dr))
  cursor_col = math.max(0, math.min(grid_size - 1, cursor_col + dc))
end

local function move_picker(d)
  pick_cursor = ((pick_cursor - 1 + d) % grid_size) + 1
end

-- Keyboard (for testing on desktop / Mac)
function love.keypressed(key)
  if key == "escape"  then love.event.quit()      end
  if key == "up"      then move_cursor(-1,  0)    end
  if key == "down"    then move_cursor( 1,  0)    end
  if key == "left"    then move_cursor( 0, -1)    end
  if key == "right"   then move_cursor( 0,  1)    end
  if key == "["       then move_picker(-1)         end
  if key == "]"       then move_picker( 1)         end
  if key == "p"       then pencil_mode = not pencil_mode end
  if key == "space"   then show_overlay = not show_overlay end
  -- Size toggle for testing layout
  if key == "tab" then
    grid_size = (grid_size == 9) and 16 or 9
    cursor_row = 0; cursor_col = 0; pick_cursor = 1
    layout = C.grid_layout(grid_size)
  end
end

-- Gamepad (Anbernic Cubexx on Knulli)
function love.gamepadpressed(joystick, button)
  print("gamepad:", button)  -- visible in Knulli logs during testing

  if button == G.DPUP    then move_cursor(-1,  0) end
  if button == G.DPDOWN  then move_cursor( 1,  0) end
  if button == G.DPLEFT  then move_cursor( 0, -1) end
  if button == G.DPRIGHT then move_cursor( 0,  1) end
  if button == G.L1      then move_picker(-1)      end
  if button == G.R1      then move_picker( 1)      end
  if button == G.PENCIL  then pencil_mode = not pencil_mode end
  if button == G.SELECT  then show_overlay = not show_overlay end
  if button == G.CLEAR   then love.event.quit() end  -- B = back/quit for now
end
