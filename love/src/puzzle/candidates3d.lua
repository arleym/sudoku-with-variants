-- Candidate computation for 3D sudoku.
-- A cell's candidates exclude: row, col, box within its layer, AND its pillar.

local V3 = require "src.puzzle.validator3d"

local C3 = {}

-- Returns { [v] = true } of valid candidates for cells[flat1].
function C3.get(cells, flat1, n)
  if cells[flat1] ~= nil then return {} end

  local layer, row, col = V3.decompose(flat1, n)
  local bs    = math.floor(math.sqrt(n) + 0.5)
  local depth = n

  local used = {}

  for c = 0, n - 1 do
    local v = cells[V3.compose(layer, row, c, n)]
    if v then used[v] = true end
  end
  for r = 0, n - 1 do
    local v = cells[V3.compose(layer, r, col, n)]
    if v then used[v] = true end
  end

  local br = math.floor(row / bs) * bs
  local bc = math.floor(col / bs) * bs
  for r = br, br + bs - 1 do
    for c = bc, bc + bs - 1 do
      local v = cells[V3.compose(layer, r, c, n)]
      if v then used[v] = true end
    end
  end

  for d = 0, depth - 1 do
    local v = cells[V3.compose(d, row, col, n)]
    if v then used[v] = true end
  end

  local candidates = {}
  for v = 1, n do
    if not used[v] then candidates[v] = true end
  end
  return candidates
end

-- Returns sorted candidate list for display.
function C3.get_list(cells, flat1, n)
  local set  = C3.get(cells, flat1, n)
  local list = {}
  for v = 1, n do if set[v] then list[#list + 1] = v end end
  return list
end

return C3
