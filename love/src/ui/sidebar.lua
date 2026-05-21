-- Right sidebar: action buttons stacked vertically.
-- Buttons (top→bottom):
--   [3D only]  Layer Up
--              Undo
--              Clear
--              Hint
--              Pencil   (toggle)
--              Layers   (toggle)
--   [3D only]  Layer Down

local C = require "src.const"

local SB = {}

local function sc(c, a)
  love.graphics.setColor(c[1], c[2], c[3], a or 1)
end

-- ── Icon drawing ──────────────────────────────────────────────────────────────

local function icon_arrow_up(cx, cy, r)
  love.graphics.polygon("fill",
    cx, cy - r,
    cx - r, cy + r * 0.5,
    cx + r, cy + r * 0.5)
end

local function icon_arrow_down(cx, cy, r)
  love.graphics.polygon("fill",
    cx, cy + r,
    cx - r, cy - r * 0.5,
    cx + r, cy - r * 0.5)
end

local function icon_undo(cx, cy, r)
  love.graphics.setLineWidth(2)
  love.graphics.arc("line", "open", cx + r * 0.1, cy, r * 0.7, math.pi * 0.3, math.pi * 1.8)
  -- arrow head
  local ax = cx + r * 0.1 + math.cos(math.pi * 0.3) * r * 0.7
  local ay = cy + math.sin(math.pi * 0.3) * r * 0.7
  love.graphics.polygon("fill", ax, ay, ax - 5, ay - 5, ax + 3, ay - 7)
  love.graphics.setLineWidth(1)
end

local function icon_clear(cx, cy, r)
  local h = r * 0.72
  love.graphics.setLineWidth(2.5)
  love.graphics.line(cx - h, cy - h, cx + h, cy + h)
  love.graphics.line(cx + h, cy - h, cx - h, cy + h)
  love.graphics.setLineWidth(1)
end

local function icon_hint(cx, cy, r, font)
  love.graphics.setFont(font)
  local lw = font:getWidth("?")
  local lh = font:getHeight()
  love.graphics.print("?", math.floor(cx - lw / 2), math.floor(cy - lh / 2))
end

local function icon_pencil(cx, cy, r)
  -- pencil body
  local hw = r * 0.28
  local hh = r * 0.72
  love.graphics.setLineWidth(1.5)
  love.graphics.rectangle("line", cx - hw, cy - hh * 0.5, hw * 2, hh)
  -- tip triangle
  love.graphics.polygon("fill",
    cx - hw, cy + hh * 0.5,
    cx + hw, cy + hh * 0.5,
    cx, cy + hh * 0.5 + r * 0.45)
  love.graphics.setLineWidth(1)
end

local function icon_layers(cx, cy, r)
  -- three stacked slabs (isometric-ish)
  local w  = r * 1.2
  local gap = r * 0.45
  for i = 0, 2 do
    local y = cy - gap + i * gap
    local off = (2 - i) * 2
    love.graphics.setLineWidth(1.2)
    love.graphics.rectangle("line", cx - w + off, y - gap * 0.35, w * 2 - off, gap * 0.7, 2)
  end
  love.graphics.setLineWidth(1)
end

-- ── Button layout ─────────────────────────────────────────────────────────────

local BTN_W  = C.SIDEBAR_W - 12   -- 108px
local BTN_H  = 60
local BTN_GAP = 8
local BTN_X  = C.SIDEBAR_X + 6

local function build_buttons(is_3d)
  local btns = {}
  if is_3d then
    btns[#btns + 1] = { id = "layer_up",   label = "Layer\nUp" }
  end
  btns[#btns + 1] = { id = "undo",        label = "Undo" }
  btns[#btns + 1] = { id = "clear",       label = "Clear" }
  btns[#btns + 1] = { id = "hint",        label = "Hint" }
  btns[#btns + 1] = { id = "pencil",      label = "Pencil" }
  btns[#btns + 1] = { id = "layers",      label = "Layers" }
  if is_3d then
    btns[#btns + 1] = { id = "layer_down", label = "Layer\nDown" }
  end
  return btns
end

local function buttons_y0(n)
  local total = n * BTN_H + (n - 1) * BTN_GAP
  return C.GRID_AREA_Y + math.floor((C.GRID_AREA_H - total) / 2)
end

-- ── Draw ─────────────────────────────────────────────────────────────────────

function SB.draw(state, fonts, colors, show_overlay, is_3d)
  local co   = colors.current
  local btns = build_buttons(is_3d)
  local y0   = buttons_y0(#btns)

  -- Sidebar background
  sc(co.topbar_bg)
  love.graphics.rectangle("fill", C.SIDEBAR_X, C.TOPBAR_H, C.SIDEBAR_W, C.GRID_AREA_H)
  -- Left border
  sc(co.border_box)
  love.graphics.rectangle("fill", C.SIDEBAR_X, C.TOPBAR_H, 1, C.GRID_AREA_H)

  for i, btn in ipairs(btns) do
    local by = y0 + (i - 1) * (BTN_H + BTN_GAP)
    local cx = BTN_X + BTN_W / 2
    local cy = by + BTN_H / 2

    -- Determine active state
    local active = false
    if btn.id == "pencil"  then active = state.pencil_mode end
    if btn.id == "layers"  then active = show_overlay end

    -- Determine disabled state
    local disabled = false
    if btn.id == "undo" then disabled = not state:can_undo() end

    -- Background
    if active then
      sc(co.cell_sel_bg)
    elseif disabled then
      sc(co.label_dim, 0.3)
    else
      sc(co.picker_cell)
    end
    love.graphics.rectangle("fill", BTN_X, by, BTN_W, BTN_H, 6)

    -- Border
    love.graphics.setLineWidth(active and 1.5 or 1)
    sc(active and co.accent or co.picker_border)
    love.graphics.rectangle("line", BTN_X, by, BTN_W, BTN_H, 6)
    love.graphics.setLineWidth(1)

    -- Icon (upper half of button)
    local icon_cy = by + BTN_H * 0.38
    local icon_r  = 8
    sc(disabled and co.label_dim or (active and co.accent or co.topbar_text))

    if btn.id == "layer_up"   then icon_arrow_up(cx, icon_cy, icon_r)
    elseif btn.id == "layer_down" then icon_arrow_down(cx, icon_cy, icon_r)
    elseif btn.id == "undo"   then icon_undo(cx, icon_cy, icon_r)
    elseif btn.id == "clear"  then icon_clear(cx, icon_cy, icon_r)
    elseif btn.id == "hint"   then icon_hint(cx, icon_cy, icon_r, fonts.sm)
    elseif btn.id == "pencil" then icon_pencil(cx, icon_cy, icon_r)
    elseif btn.id == "layers" then icon_layers(cx, icon_cy, icon_r)
    end

    -- Label (lower portion)
    love.graphics.setFont(fonts.sm)
    sc(disabled and co.label_dim or (active and co.accent or co.label_txt))
    for j, line in ipairs(split_lines(btn.label)) do
      local lw = fonts.sm:getWidth(line)
      local lh = fonts.sm:getHeight()
      local ly = by + BTN_H * 0.62 + (j - 1) * (lh + 1)
      love.graphics.print(line, math.floor(BTN_X + (BTN_W - lw) / 2), math.floor(ly))
    end
  end
end

function split_lines(s)
  local lines = {}
  for line in s:gmatch("[^\n]+") do lines[#lines + 1] = line end
  return lines
end

-- ── Hit testing ───────────────────────────────────────────────────────────────

-- Returns the button id clicked at (x, y), or nil.
function SB.hit(x, y, is_3d)
  if x < C.SIDEBAR_X or x > C.W then return nil end
  if y < C.TOPBAR_H or y > C.H - C.PICKER_H then return nil end

  local btns = build_buttons(is_3d)
  local y0   = buttons_y0(#btns)

  for i, btn in ipairs(btns) do
    local by = y0 + (i - 1) * (BTN_H + BTN_GAP)
    if y >= by and y <= by + BTN_H then
      return btn.id
    end
  end
  return nil
end

return SB
