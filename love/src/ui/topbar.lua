-- Top bar renderer (48px tall).
-- Shows: wordmark | difficulty · size [· layer] [· ✏] | timer | icons

local C = require "src.const"

local TB = {}

local function sc(c, a)
  love.graphics.setColor(c[1], c[2], c[3], a or 1)
end

local function fmt_time(t)
  local m = math.floor(t / 60)
  local s = math.floor(t % 60)
  return string.format("%02d:%02d", m, s)
end

-- Draw a minimal icon circle with a character inside.
local function icon(x, y, r, label, font, active, co)
  if active then
    sc(co.cell_sel_bg)
    love.graphics.circle("fill", x, y, r)
    sc(co.accent)
    love.graphics.setLineWidth(1.5)
    love.graphics.circle("line", x, y, r)
    love.graphics.setLineWidth(1)
  else
    sc(co.label_dim)
    love.graphics.setLineWidth(1)
    love.graphics.circle("line", x, y, r)
  end
  love.graphics.setFont(font)
  sc(active and co.accent or co.label_txt)
  local lw = font:getWidth(label)
  local lh = font:getHeight()
  love.graphics.print(label, math.floor(x - lw / 2), math.floor(y - lh / 2))
end

function TB.draw(state, fonts, colors, show_overlay)
  local co = colors.current
  local cy = math.floor(C.TOPBAR_H / 2)  -- vertical center

  -- Background
  sc(co.topbar_bg)
  love.graphics.rectangle("fill", 0, 0, C.W, C.TOPBAR_H)
  -- Border
  sc(co.border_box)
  love.graphics.rectangle("fill", 0, C.TOPBAR_H - 1, C.W, 1)

  -- ── Wordmark (left) ───────────────────────────────────────────────────────
  love.graphics.setFont(fonts.md)
  sc(co.accent)
  love.graphics.print("Morrison", 18, math.floor(cy - fonts.md:getHeight() / 2))

  love.graphics.setFont(fonts.sm)
  sc(co.label_txt)
  local sub_x = 18 + fonts.md:getWidth("Morrison") + 6
  love.graphics.print("SUDOKU", sub_x, math.floor(cy - fonts.sm:getHeight() / 2) + 2)

  -- ── Center meta ───────────────────────────────────────────────────────────
  love.graphics.setFont(fonts.sm)
  local parts = {}
  if state.puzzle then
    parts[#parts + 1] = state.puzzle.difficulty:sub(1,1):upper() .. state.puzzle.difficulty:sub(2)
    parts[#parts + 1] = state.n .. "×" .. state.n
  end
  if state.pencil_mode then parts[#parts + 1] = "✏" end

  local center_txt = table.concat(parts, "  ·  ")
  local cw = fonts.sm:getWidth(center_txt)
  sc(co.topbar_text)
  love.graphics.print(center_txt,
    math.floor((C.W - cw) / 2),
    math.floor(cy - fonts.sm:getHeight() / 2))

  -- ── Right: timer + icons ──────────────────────────────────────────────────
  local timer_str = state.puzzle and fmt_time(state.timer) or "--:--"
  local timer_w   = fonts.sm:getWidth(timer_str)

  local icon_r  = 11
  local icons_x = { C.W - 32, C.W - 70, C.W - 108 }  -- ⚙, layers, ?
  local timer_x = icons_x[3] - timer_w - 14

  love.graphics.setFont(fonts.sm)
  sc(co.topbar_text)
  love.graphics.print(timer_str, timer_x, math.floor(cy - fonts.sm:getHeight() / 2))

  icon(icons_x[3], cy, icon_r, "?", fonts.sm, false, co)
  icon(icons_x[2], cy, icon_r, "◫", fonts.sm, show_overlay, co)
  icon(icons_x[1], cy, icon_r, "⚙", fonts.sm, false, co)
end

-- Returns which icon (if any) was hit by a tap at (x, y).
-- Returns "help", "layers", "settings", or nil.
function TB.hit_test(x, y)
  local cy = math.floor(C.TOPBAR_H / 2)
  local r  = 11
  local checks = {
    { x = C.W - 108, name = "help" },
    { x = C.W - 70,  name = "layers" },
    { x = C.W - 32,  name = "settings" },
  }
  for _, ic in ipairs(checks) do
    local dx = x - ic.x
    local dy = y - cy
    if dx * dx + dy * dy <= r * r then return ic.name end
  end
  return nil
end

return TB
