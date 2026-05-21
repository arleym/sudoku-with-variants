-- Bottom number picker: full-width row of large tap/click buttons.
-- 1–N values + ⌫. Each is a distinct button, not a cursor strip.
-- Active number (state.pick_cursor) is highlighted.

local C = require "src.const"

local Picker = {}

local function sc(c, a)
  love.graphics.setColor(c[1], c[2], c[3], a or 1)
end

local GAP = 4

local function slot_w(n)
  return math.floor((C.W - (n) * GAP) / (n + 1))
end

-- Returns x position of slot i (1-based, 1..n = numbers, n+1 = erase).
local function slot_x(i, sw)
  return (i - 1) * (sw + GAP)
end

function Picker.draw(state, fonts, colors)
  local co = colors.current
  local n  = state.n
  local py = C.H - C.PICKER_H
  local sh = 62
  local sy = py + math.floor((C.PICKER_H - sh) / 2)
  local sw = slot_w(n)
  local font = fonts.picker(n)

  -- Background + top border
  sc(co.picker_bg)
  love.graphics.rectangle("fill", 0, py, C.W, C.PICKER_H)
  sc(co.border_box)
  love.graphics.rectangle("fill", 0, py, C.W, 1)

  -- Completed values (placed n times → dim)
  local counts = {}
  if state.puzzle then
    for i = 1, n * n do
      local v = state:value_at(i)
      if v then counts[v] = (counts[v] or 0) + 1 end
    end
  end

  for i = 1, n do
    local sx    = slot_x(i, sw)
    local is_cur  = (i == state.pick_cursor)
    local is_done = (counts[i] or 0) >= n

    if is_cur then
      sc(co.picker_cur)
    elseif is_done then
      sc(co.cell_bg)
    else
      sc(co.picker_cell)
    end
    love.graphics.rectangle("fill", sx, sy, sw, sh, 5)

    sc(is_cur and co.accent or co.picker_border)
    love.graphics.setLineWidth(is_cur and 2 or 1)
    love.graphics.rectangle("line", sx, sy, sw, sh, 5)
    love.graphics.setLineWidth(1)

    sc(is_cur and co.picker_cur_txt or (is_done and co.label_dim or co.picker_txt))
    love.graphics.setFont(font)
    local lbl = fonts.display(i, n)
    local lw  = font:getWidth(lbl)
    local lh  = font:getHeight()
    love.graphics.print(lbl,
      math.floor(sx + (sw - lw) / 2),
      math.floor(sy + (sh - lh) / 2))
  end

  -- ⌫ erase slot
  local ex = slot_x(n + 1, sw)
  sc(co.picker_cell)
  love.graphics.rectangle("fill", ex, sy, sw, sh, 5)
  sc(co.picker_border)
  love.graphics.rectangle("line", ex, sy, sw, sh, 5)
  sc(co.label_txt)
  love.graphics.setFont(fonts.sm)
  local bw = fonts.sm:getWidth("del")
  local bh = fonts.sm:getHeight()
  love.graphics.print("del",
    math.floor(ex + (sw - bw) / 2),
    math.floor(sy + (sh - bh) / 2))
end

-- Returns number 1..n if a value slot was hit, 0 for erase, nil otherwise.
function Picker.hit(x, y, n)
  local py = C.H - C.PICKER_H
  local sh = 62
  local sy = py + math.floor((C.PICKER_H - sh) / 2)
  if y < sy or y > sy + sh then return nil end

  local sw = slot_w(n)
  for i = 1, n + 1 do
    local sx = slot_x(i, sw)
    if x >= sx and x <= sx + sw then
      return i <= n and i or 0
    end
  end
  return nil
end

return Picker
