-- 3D puzzle generator.
-- Returns Puzzle3D: { size, depth, difficulty, cells, solution }
-- cells: 1-indexed flat array (size*size*depth), nil = blank.
-- N×N×N puzzles only (depth = size).
--
-- 4×4×4: full 3D backtracking + uniqueness check (~fast enough on ARM at 64 cells)
-- 9×9×9: cyclic-shift construction (instant — no uniqueness guarantee but correct)

local V3  = require "src.puzzle.validator3d"
local C3  = require "src.puzzle.candidates3d"
local Sol = require "src.puzzle.solver"  -- for 9×9 base layer
local V   = require "src.puzzle.validator"  -- for box_size

local G3 = {}

local function shuffle(t)
  for i = #t, 2, -1 do
    local j = math.random(i)
    t[i], t[j] = t[j], t[i]
  end
  return t
end

-- ── 4×4×4 ────────────────────────────────────────────────────────────────────

local function solve3d(cells, flat1, n, randomize)
  local total = n * n * n
  if flat1 > total then return V3.is_valid_solution(cells, n) end
  if cells[flat1] ~= nil then return solve3d(cells, flat1 + 1, n, randomize) end

  local cands = {}
  for v, _ in pairs(C3.get(cells, flat1, n)) do cands[#cands + 1] = v end
  if randomize then shuffle(cands) end

  for _, v in ipairs(cands) do
    cells[flat1] = v
    if solve3d(cells, flat1 + 1, n, randomize) then return true end
    cells[flat1] = nil
  end
  return false
end

local function count_solutions3d(cells, flat1, n, limit)
  local total = n * n * n
  if flat1 > total then return 1 end
  if cells[flat1] ~= nil then return count_solutions3d(cells, flat1 + 1, n, limit) end

  local count = 0
  for v, _ in pairs(C3.get(cells, flat1, n)) do
    cells[flat1] = v
    count = count + count_solutions3d(cells, flat1 + 1, n, limit)
    cells[flat1] = nil
    if count >= limit then return count end
  end
  return count
end

local function has_unique3d(puzzle, n)
  local grid = {}
  for i = 1, n * n * n do grid[i] = puzzle[i] end
  return count_solutions3d(grid, 1, n, 2) == 1
end

local CLUES_4 = {
  easy   = {38, 44},
  medium = {30, 37},
  hard   = {24, 29},
  expert = {18, 23},
}

local function generate_4x4x4(difficulty)
  local n    = 4
  local grid = {}
  for i = 1, n * n * n do grid[i] = nil end

  assert(solve3d(grid, 1, n, true), "Failed to generate 4×4×4 solution")
  local solution = {}
  for i = 1, n * n * n do solution[i] = grid[i] end

  local t = CLUES_4[difficulty]
  local target = t[1] + math.random(0, t[2] - t[1])
  local to_remove = n * n * n - target

  local puzzle = {}
  for i = 1, n * n * n do puzzle[i] = solution[i] end

  local indices = {}
  for i = 1, n * n * n do indices[i] = i end
  shuffle(indices)

  local removed = 0
  for _, idx in ipairs(indices) do
    if removed >= to_remove then break end
    local saved = puzzle[idx]
    puzzle[idx] = nil
    if has_unique3d(puzzle, n) then
      removed = removed + 1
    else
      puzzle[idx] = saved
    end
  end

  return { size = n, depth = n, difficulty = difficulty, cells = puzzle, solution = solution }
end

-- ── 9×9×9 ────────────────────────────────────────────────────────────────────
-- Strategy: generate one valid 9×9 layer via backtracking, then layer d =
-- cyclic shift of base by d. Guarantees valid layers + valid pillars.

local CLUES_9 = {
  easy   = 450,
  medium = 360,
  hard   = 270,
  expert = 200,
}

local function generate_9x9x9(difficulty)
  local n   = 9
  local ls  = n * n

  -- Generate base 9×9 layer
  local empty = {}
  for i = 1, ls do empty[i] = nil end
  local base = Sol.solve_random(empty, n)
  assert(base, "Failed to generate 9×9 base layer for 3D puzzle")

  local solution = {}
  for d = 0, n - 1 do
    for i = 1, ls do
      solution[d * ls + i] = ((base[i] - 1 + d) % n) + 1
    end
  end

  local target    = CLUES_9[difficulty]
  local to_remove = n * n * n - target

  local puzzle  = {}
  for i = 1, n * n * n do puzzle[i] = solution[i] end

  local indices = {}
  for i = 1, n * n * n do indices[i] = i end
  shuffle(indices)
  for i = 1, math.min(to_remove, #indices) do
    puzzle[indices[i]] = nil
  end

  return { size = n, depth = n, difficulty = difficulty, cells = puzzle, solution = solution }
end

-- ── 16×16×16 ─────────────────────────────────────────────────────────────────
-- Backtracking-solving a 16×16 base layer would hang, so we use the same
-- instant pattern-based approach as the 2D 16×16 generator, then cyclic-shift
-- across all 16 layers (same strategy as 9×9×9).

local CLUES_16 = {
  easy   = 2800,
  medium = 2200,
  hard   = 1700,
  expert = 1300,
}

local function pattern_grid_16()
  local n  = 16
  local bs = V.box_size(n)   -- 4
  local grid = {}
  for row = 0, n - 1 do
    for col = 0, n - 1 do
      local v = (bs * (row % bs) + math.floor(row / bs) + col) % n + 1
      grid[row * n + col + 1] = v
    end
  end
  return grid
end

local function swap_rows_16(grid, n, from_rows, to_rows)
  local temp = {}
  for i, r in ipairs(from_rows) do
    temp[i] = {}
    for c = 1, n do temp[i][c] = grid[(r - 1) * n + c] end
  end
  for i, r in ipairs(to_rows) do
    for c = 1, n do grid[(r - 1) * n + c] = temp[i][c] end
  end
end

local function swap_cols_16(grid, n, from_cols, to_cols)
  local temp = {}
  for i, col in ipairs(from_cols) do
    temp[i] = {}
    for r = 1, n do temp[i][r] = grid[(r - 1) * n + col] end
  end
  for i, col in ipairs(to_cols) do
    for r = 1, n do grid[(r - 1) * n + col] = temp[i][r] end
  end
end

local function shuffle_pattern_16(grid, n)
  local bs = V.box_size(n)   -- 4
  for band = 0, bs - 1 do
    local start = band * bs + 1
    local rows = {}; for i = 0, bs - 1 do rows[i + 1] = start + i end
    local s = {}; for i, v in ipairs(rows) do s[i] = v end; shuffle(s)
    swap_rows_16(grid, n, rows, s)
  end
  for stack = 0, bs - 1 do
    local start = stack * bs + 1
    local cols = {}; for i = 0, bs - 1 do cols[i + 1] = start + i end
    local s = {}; for i, v in ipairs(cols) do s[i] = v end; shuffle(s)
    swap_cols_16(grid, n, cols, s)
  end
  local map = {}; for v = 1, n do map[v] = v end; shuffle(map)
  for i = 1, n * n do grid[i] = map[grid[i]] end
end

local function generate_16x16x16(difficulty)
  local n   = 16
  local ls  = n * n

  -- Build a shuffled valid 16×16 base layer (pattern-based, instant)
  local base = pattern_grid_16()
  shuffle_pattern_16(base, n)

  -- Cyclic-shift across 16 layers
  local solution = {}
  for d = 0, n - 1 do
    for i = 1, ls do
      solution[d * ls + i] = ((base[i] - 1 + d) % n) + 1
    end
  end

  local target    = CLUES_16[difficulty]
  local to_remove = n * n * n - target
  local puzzle    = {}
  for i = 1, n * n * n do puzzle[i] = solution[i] end
  local indices   = {}
  for i = 1, n * n * n do indices[i] = i end
  shuffle(indices)
  for i = 1, math.min(to_remove, #indices) do
    puzzle[indices[i]] = nil
  end

  return { size = n, depth = n, difficulty = difficulty, cells = puzzle, solution = solution }
end

-- ── Public API ────────────────────────────────────────────────────────────────

function G3.generate(n, difficulty)
  difficulty = difficulty or "medium"
  if n == 16 then return generate_16x16x16(difficulty) end
  if n == 9  then return generate_9x9x9(difficulty) end
  return generate_4x4x4(difficulty)
end

return G3
