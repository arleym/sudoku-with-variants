-- Number picker strip renderer (76px tall, bottom of screen).
-- Shows 1–N slots + ⌫. L1/R1 moves the cursor; A confirms.

local C = require "src.const"

local Picker = {}

local function sc(c, a)
  love.graphics.setColor(c[1], c[2], c[3], a or 1)
end

function Picker.draw(state, fonts, colors)
  local co   = colors.current
  local n    = state.n
  local py   = C.H - C.PICKER_H
  local sh   = 54
  local sy   = py + math.floor((C.PICKER_H - sh) / 2)
  local font = fonts.picker(n)

  -- Background + border
  sc(co.picker_bg)
  love.graphics.rectangle("fill", 0, py, C.W, C.PICKER_H)
  sc(co.border_box)
  love.graphics.rectangle("fill", 0, py, C.W, 1)

  -- Slot geometry: (n + 1) slots with small gaps
  local gap   = n > 9 and 3 or 5
  local sw    = C.picker_slot_w(n) - gap
  local total = (n + 1) * (sw + gap) - gap
  local sx0   = math.floor((C.W - total) / 2)

  -- Completed values (all n placed → dim)
  local done = {}
  if state.puzzle then
    local counts = {}
    for i = 1, n * n do
      local v = state:value_at(i)
      if v then counts[v] = (counts[v] or 0) + 1 end
    end
    for v = 1, n do
      if (counts[v] or 0) >= n then done[v] = true end
    end
  end

  for i = 1, n do
    local sx     = sx0 + (i - 1) * (sw + gap)
    local is_cur = (i == state.pick_cursor)
    local is_done = done[i]

    -- Slot background
    if is_cur then
      sc(co.picker_cur)
    elseif is_done then
      sc(co.label_dim)
    else
      sc(co.picker_cell)
    end
    love.graphics.rectangle("fill", sx, sy, sw, sh, 4)

    -- Border
    if is_cur then
      sc(co.accent)
      love.graphics.setLineWidth(1.5)
      love.graphics.rectangle("line", sx, sy, sw, sh, 4)
      love.graphics.setLineWidth(1)
    else
      sc(co.picker_border)
      love.graphics.rectangle("line", sx, sy, sw, sh, 4)
    end

    -- Label
    sc(is_cur and co.picker_cur_txt or (is_done and co.label_dim or co.picker_txt))
    love.graphics.setFont(font)
    local lbl = fonts.display(i, n)
    local lw  = font:getWidth(lbl)
    local lh  = font:getHeight()
    love.graphics.print(lbl,
      math.floor(sx + (sw - lw) / 2),
      math.floor(sy + (sh - lh) / 2))
  end

  -- Erase slot
  local ex = sx0 + n * (sw + gap)
  sc(co.picker_cell)
  love.graphics.rectangle("fill", ex, sy, sw, sh, 4)
  sc(co.picker_border)
  love.graphics.rectangle("line", ex, sy, sw, sh, 4)
  sc(co.label_txt)
  love.graphics.setFont(fonts.sm)
  local bw = fonts.sm:getWidth("⌫")
  local bh = fonts.sm:getHeight()
  love.graphics.print("⌫",
    math.floor(ex + (sw - bw) / 2),
    math.floor(sy + (sh - bh) / 2))

  -- Button hints: L1 ◀ ... ▶ R1
  sc(co.label_dim)
  love.graphics.setFont(fonts.sm)
  local hint_y = sy + math.floor((sh - fonts.sm:getHeight()) / 2)
  love.graphics.print("L1 ◀", sx0 - 42, hint_y)
  love.graphics.print("▶ R1", sx0 + total + 6, hint_y)
end

return Picker
