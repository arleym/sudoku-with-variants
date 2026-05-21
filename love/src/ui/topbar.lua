-- Top bar (44px). Wordmark left, settings icon right. Timer + state centre.

local C = require "src.const"

local TB = {}

local function sc(c, a)
  love.graphics.setColor(c[1], c[2], c[3], a or 1)
end

local function fmt_time(t)
  return string.format("%02d:%02d", math.floor(t / 60), math.floor(t % 60))
end

local SETTINGS_X = C.W - 30
local SETTINGS_Y = math.floor(C.TOPBAR_H / 2)
local SETTINGS_R = 13

function TB.draw(state, fonts, colors)
  local co = colors.current
  local cy = math.floor(C.TOPBAR_H / 2)

  sc(co.topbar_bg)
  love.graphics.rectangle("fill", 0, 0, C.W, C.TOPBAR_H)
  sc(co.border_box)
  love.graphics.rectangle("fill", 0, C.TOPBAR_H - 1, C.W, 1)

  -- Wordmark
  love.graphics.setFont(fonts.md)
  sc(co.accent)
  love.graphics.print("Morrison", 14, math.floor(cy - fonts.md:getHeight() / 2))
  love.graphics.setFont(fonts.sm)
  sc(co.label_txt)
  love.graphics.print("SUDOKU",
    14 + fonts.md:getWidth("Morrison") + 6,
    math.floor(cy - fonts.sm:getHeight() / 2) + 2)

  -- Centre: difficulty · size · timer
  if state.puzzle then
    local diff  = state.puzzle.difficulty
    local label = diff:sub(1,1):upper() .. diff:sub(2)
                  .. "  ·  " .. state.n .. "×" .. state.n
                  .. "  ·  " .. fmt_time(state.timer)
    love.graphics.setFont(fonts.sm)
    sc(co.topbar_text)
    local lw = fonts.sm:getWidth(label)
    love.graphics.print(label,
      math.floor((C.W - lw) / 2),
      math.floor(cy - fonts.sm:getHeight() / 2))
  end

  -- Settings icon (gear drawn with lines)
  sc(co.label_txt)
  love.graphics.setLineWidth(1.5)
  love.graphics.circle("line", SETTINGS_X, SETTINGS_Y, 5)
  -- 8 tick marks around circumference
  for i = 0, 7 do
    local a  = i * math.pi / 4
    local x1 = SETTINGS_X + math.cos(a) * 7
    local y1 = SETTINGS_Y + math.sin(a) * 7
    local x2 = SETTINGS_X + math.cos(a) * 10
    local y2 = SETTINGS_Y + math.sin(a) * 10
    love.graphics.line(x1, y1, x2, y2)
  end
  love.graphics.setLineWidth(1)
end

function TB.settings_hit(x, y)
  local dx = x - SETTINGS_X
  local dy = y - SETTINGS_Y
  return dx * dx + dy * dy <= SETTINGS_R * SETTINGS_R
end

return TB
