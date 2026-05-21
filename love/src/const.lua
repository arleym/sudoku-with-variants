local C = {}

C.W         = 720
C.H         = 720
C.TOPBAR_H  = 44
C.PICKER_H  = 80
C.SIDEBAR_W = 120

-- Derived areas
C.GRID_AREA_W = C.W - C.SIDEBAR_W           -- 600  (left column)
C.GRID_AREA_H = C.H - C.TOPBAR_H - C.PICKER_H  -- 596
C.GRID_AREA_Y = C.TOPBAR_H
C.SIDEBAR_X   = C.W - C.SIDEBAR_W           -- 600

-- Grid layout: left-aligned, vertically centred within the grid area.
function C.grid_layout(n)
  local cell = math.floor(C.GRID_AREA_H / n)
  local px   = cell * n
  local x    = 4                                             -- small left margin
  local y    = C.GRID_AREA_Y + math.floor((C.GRID_AREA_H - px) / 2)
  local box  = math.floor(math.sqrt(n) + 0.5)
  return { cell = cell, px = px, x = x, y = y, box = box }
end

-- Width of each number button in the bottom picker (no cursor slot needed,
-- numbers are tapped directly; include a ⌫ slot).
function C.picker_slot_w(n)
  local slots = n + 1  -- values 1..n  +  ⌫
  local gap   = 4
  return math.floor((C.W - (slots - 1) * gap) / slots)
end

return C
