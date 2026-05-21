-- Candidate (pencil mark) computation for 2D sudoku.

local V = require "src.puzzle.validator"

local Cand = {}

-- Returns a table { [v] = true } of valid candidates for cells[idx].
-- Returns empty table if cell is already filled.
function Cand.get(cells, idx, n)
  if cells[idx] ~= nil then return {} end

  local candidates = {}
  for v = 1, n do candidates[v] = true end

  local row = V.row_of(idx, n)
  local col = V.col_of(idx, n)
  local bs  = V.box_size(n)

  for c = 1, n do
    local v = cells[V.to_idx(row, c, n)]
    if v then candidates[v] = nil end
  end
  for r = 1, n do
    local v = cells[V.to_idx(r, col, n)]
    if v then candidates[v] = nil end
  end

  local br = math.floor((row - 1) / bs) * bs + 1
  local bc = math.floor((col - 1) / bs) * bs + 1
  for r = br, br + bs - 1 do
    for c = bc, bc + bs - 1 do
      local v = cells[V.to_idx(r, c, n)]
      if v then candidates[v] = nil end
    end
  end

  return candidates
end

-- Returns sorted list of candidate values for display.
function Cand.get_list(cells, idx, n)
  local set = Cand.get(cells, idx, n)
  local list = {}
  for v = 1, n do
    if set[v] then list[#list + 1] = v end
  end
  return list
end

-- Returns array of candidate sets, one per cell (1..n*n).
function Cand.get_all(cells, n)
  local result = {}
  for i = 1, n * n do
    result[i] = Cand.get(cells, i, n)
  end
  return result
end

-- Returns set of values that appear exactly n times across all cells
-- (i.e. values whose placement is complete — used to dim picker slots).
function Cand.completed_values(cells, n)
  local counts = {}
  for i = 1, n * n do
    local v = cells[i]
    if v then counts[v] = (counts[v] or 0) + 1 end
  end
  local done = {}
  for v = 1, n do
    if (counts[v] or 0) == n then done[v] = true end
  end
  return done
end

return Cand
