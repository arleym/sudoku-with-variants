local C = {}

C.W          = 720
C.H          = 720
C.TOPBAR_H   = 48
C.PICKER_H   = 76
C.GRID_AREA_H = C.H - C.TOPBAR_H - C.PICKER_H  -- 596
C.GRID_AREA_Y = C.TOPBAR_H

-- Default grid: 9×9
-- Cell size rounded down so CELL_PX * SIZE fits evenly
C.GRID_SIZES = {9, 16}  -- supported 2D sizes

-- Returns layout table for a given grid size n
function C.grid_layout(n)
  local cell = math.floor(C.GRID_AREA_H / n)
  local px   = cell * n
  local x    = math.floor((C.W - px) / 2)
  local y    = C.GRID_AREA_Y + math.floor((C.GRID_AREA_H - px) / 2)
  local box  = math.floor(math.sqrt(n) + 0.5)  -- box size: 3 for 9×9, 4 for 16×16
  return { cell = cell, px = px, x = x, y = y, box = box }
end

-- Number picker slot width for a given number of values
function C.picker_slot_w(n)
  -- n values + 1 erase slot; fit into W with 12px padding each side
  return math.floor((C.W - 24) / (n + 1))
end

return C
