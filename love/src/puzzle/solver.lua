-- Backtracking solver for 2D sudoku.
-- Operates on 1-indexed flat arrays; nil = empty cell.

local V = require "src.puzzle.validator"

local Solver = {}

local function shuffle(t)
  for i = #t, 2, -1 do
    local j = math.random(i)
    t[i], t[j] = t[j], t[i]
  end
  return t
end

local function find_empty(cells, n)
  for i = 1, n * n do
    if cells[i] == nil then return i end
  end
  return nil
end

-- Deterministic solve. Returns true and fills cells in-place on success.
local function backtrack(cells, n)
  local idx = find_empty(cells, n)
  if not idx then return true end

  for v = 1, n do
    if V.is_valid_placement(cells, idx, v, n) then
      cells[idx] = v
      if backtrack(cells, n) then return true end
      cells[idx] = nil
    end
  end
  return false
end

-- Randomised solve (for puzzle generation). Returns true and fills cells in-place.
local function backtrack_random(cells, n)
  local idx = find_empty(cells, n)
  if not idx then return true end

  local values = {}
  for v = 1, n do values[v] = v end
  shuffle(values)

  for _, v in ipairs(values) do
    if V.is_valid_placement(cells, idx, v, n) then
      cells[idx] = v
      if backtrack_random(cells, n) then return true end
      cells[idx] = nil
    end
  end
  return false
end

-- Count solutions up to `limit` (default 2 — enough to detect uniqueness).
local function count_solutions(cells, n, limit)
  limit = limit or 2
  local count = 0

  local function bt()
    local idx = find_empty(cells, n)
    if not idx then
      count = count + 1
      return count >= limit
    end
    for v = 1, n do
      if V.is_valid_placement(cells, idx, v, n) then
        cells[idx] = v
        if bt() then
          cells[idx] = nil
          return true
        end
        cells[idx] = nil
      end
    end
    return false
  end

  bt()
  return count
end

-- Public API ──────────────────────────────────────────────────────────────────

-- Solve deterministically. Returns solved copy or nil.
function Solver.solve(cells, n)
  local grid = {}
  for i = 1, n * n do grid[i] = cells[i] end
  if backtrack(grid, n) then return grid end
  return nil
end

-- Solve with randomised value order (for generation). Returns filled copy or nil.
function Solver.solve_random(cells, n)
  local grid = {}
  for i = 1, n * n do grid[i] = cells[i] end
  if backtrack_random(grid, n) then return grid end
  return nil
end

-- Returns true if the puzzle has exactly one solution.
function Solver.has_unique_solution(cells, n)
  local grid = {}
  for i = 1, n * n do grid[i] = cells[i] end
  return count_solutions(grid, n, 2) == 1
end

return Solver
