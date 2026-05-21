-- Icon drawing library.
-- All functions draw centered at (cx, cy) within approximate radius r.
-- Caller sets love.graphics color before calling.
-- `filled` selects the filled/active variant where applicable.

local Icons = {}

-- Bootstrap three-dots-vertical  (settings / kebab menu)
function Icons.three_dots(cx, cy, r)
  local dot_r = math.max(1.5, r * 0.19)
  local gap   = r * 0.54
  love.graphics.circle("fill", cx, cy - gap, dot_r)
  love.graphics.circle("fill", cx, cy,       dot_r)
  love.graphics.circle("fill", cx, cy + gap, dot_r)
end

-- Bootstrap layers / layers-fill
-- outline = 3 diamond outlines; filled = 3 solid diamonds
function Icons.layers(cx, cy, r, filled)
  local hw  = r * 0.88   -- half-width of each diamond
  local hh  = r * 0.26   -- half-height
  local sep = r * 0.55   -- vertical spacing between diamond centres
  local mode = filled and "fill" or "line"
  love.graphics.setLineWidth(1.4)
  for i = -1, 1 do
    local dy = i * sep
    love.graphics.polygon(mode,
      cx - hw, cy + dy,
      cx,      cy + dy - hh,
      cx + hw, cy + dy,
      cx,      cy + dy + hh)
  end
  love.graphics.setLineWidth(1)
end

-- Bootstrap question-octagon / question-octagon-fill
-- Pass `font` (fonts.sm) so the "?" renders at the right size.
function Icons.question_octagon(cx, cy, r, filled, font)
  -- Regular octagon, flat side at top
  local pts = {}
  for i = 0, 7 do
    local a = (i / 8) * math.pi * 2 + math.pi / 8  -- rotate 22.5° so flat sides face N/S/E/W
    pts[#pts + 1] = cx + math.cos(a) * r * 0.88
    pts[#pts + 1] = cy + math.sin(a) * r * 0.88
  end
  if filled then
    love.graphics.polygon("fill", pts)
  else
    love.graphics.setLineWidth(1.4)
    love.graphics.polygon("line", pts)
    love.graphics.setLineWidth(1)
  end
  if font then
    love.graphics.setFont(font)
    local lbl = "?"
    local lw  = font:getWidth(lbl)
    local lh  = font:getHeight()
    love.graphics.print(lbl,
      math.floor(cx - lw / 2),
      math.floor(cy - lh / 2))
  end
end

-- Bootstrap pencil-square
-- Square border with a diagonal pencil overlaid.
function Icons.pencil_square(cx, cy, r)
  local s = r * 0.78
  love.graphics.setLineWidth(1.5)
  -- Square
  love.graphics.rectangle("line", cx - s, cy - s, s * 2, s * 2, 2)
  -- Pencil shaft (diagonal)
  local x1 = cx + s * 0.52
  local y1 = cy - s * 0.58
  local x2 = cx - s * 0.38
  local y2 = cy + s * 0.50
  love.graphics.line(x1, y1, x2, y2)
  -- Pencil tip triangle
  local tx = cx - s * 0.52
  local ty = cy + s * 0.66
  love.graphics.polygon("fill", x2 - 3, y2, x2 + 3, y2, tx, ty)
  -- Eraser end (small perpendicular line)
  local ang = math.atan2(y2 - y1, x2 - x1) + math.pi / 2
  love.graphics.line(
    x1 + math.cos(ang) * 3, y1 + math.sin(ang) * 3,
    x1 - math.cos(ang) * 3, y1 - math.sin(ang) * 3)
  love.graphics.setLineWidth(1)
end

-- Simple up/down arrows (for Layer Up / Layer Down)
function Icons.arrow_up(cx, cy, r)
  love.graphics.polygon("fill",
    cx, cy - r * 0.72,
    cx - r * 0.7, cy + r * 0.42,
    cx + r * 0.7, cy + r * 0.42)
end

function Icons.arrow_down(cx, cy, r)
  love.graphics.polygon("fill",
    cx, cy + r * 0.72,
    cx - r * 0.7, cy - r * 0.42,
    cx + r * 0.7, cy - r * 0.42)
end

-- Undo (curved arrow)
function Icons.undo(cx, cy, r)
  love.graphics.setLineWidth(2)
  love.graphics.arc("line", "open", cx + r * 0.1, cy, r * 0.65,
    math.pi * 0.35, math.pi * 1.75)
  -- arrowhead at start of arc
  local ax = cx + r * 0.1 + math.cos(math.pi * 0.35) * r * 0.65
  local ay = cy           + math.sin(math.pi * 0.35) * r * 0.65
  love.graphics.polygon("fill", ax, ay, ax - 5, ay - 4, ax + 3, ay - 6)
  love.graphics.setLineWidth(1)
end

-- Clear / X
function Icons.clear(cx, cy, r)
  local h = r * 0.66
  love.graphics.setLineWidth(2.5)
  love.graphics.line(cx - h, cy - h, cx + h, cy + h)
  love.graphics.line(cx + h, cy - h, cx - h, cy + h)
  love.graphics.setLineWidth(1)
end

return Icons
