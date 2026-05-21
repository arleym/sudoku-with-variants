-- 2D puzzle generator.
-- Supports sizes 9 (backtracking + uniqueness) and 16 (fast pattern-based).
-- Returns a Puzzle table: { size, difficulty, cells, solution }
-- cells: 1-indexed flat array, nil = blank, number = given clue.

local Solver = require "src.puzzle.solver"
local V      = require "src.puzzle.validator"

local Gen = {}

-- Clue targets per size and difficulty { min, max }
local CLUE_TARGETS = {
  [4] = {
    easy   = {10, 12},
    medium = { 8, 10},
    hard   = { 6,  8},
    expert = { 4,  6},
  },
  [9] = {
    easy   = {36, 45},
    medium = {32, 36},
    hard   = {28, 32},
    expert = {22, 28},
  },
  [16] = {
    easy   = {130, 160},
    medium = {100, 130},
    hard   = { 80, 100},
    expert = { 60,  80},
  },
}

local function shuffle(t)
  for i = #t, 2, -1 do
    local j = math.random(i)
    t[i], t[j] = t[j], t[i]
  end
  return t
end

local function target_clues(n, difficulty)
  local t = CLUE_TARGETS[n][difficulty]
  return t[1] + math.random(0, t[2] - t[1])
end

-- Remove cells while preserving unique solution (for n ≤ 9).
local function remove_with_check(solution, n, target_clues_count)
  local puzzle = {}
  for i = 1, n * n do puzzle[i] = solution[i] end

  local indices = {}
  for i = 1, n * n do indices[i] = i end
  shuffle(indices)

  local removed = 0
  local to_remove = n * n - target_clues_count

  for _, idx in ipairs(indices) do
    if removed >= to_remove then break end
    local saved = puzzle[idx]
    puzzle[idx] = nil
    if Solver.has_unique_solution(puzzle, n) then
      removed = removed + 1
    else
      puzzle[idx] = saved
    end
  end

  return puzzle
end

-- Simple removal without uniqueness check (fast, for n ≥ 16).
local function remove_simple(solution, target_clues_count)
  local n2 = #solution
  local puzzle = {}
  for i = 1, n2 do puzzle[i] = solution[i] end

  local indices = {}
  for i = 1, n2 do indices[i] = i end
  shuffle(indices)

  local to_remove = n2 - target_clues_count
  for i = 1, math.min(to_remove, n2) do
    puzzle[indices[i]] = nil
  end
  return puzzle
end

-- Pattern-based valid grid for large sizes (16×16).
local function create_pattern_grid(n)
  local bs = V.box_size(n)  -- box rows = box cols = bs
  local grid = {}
  for row = 0, n - 1 do
    for col = 0, n - 1 do
      -- Formula from the TS generator: produces a valid sudoku layout
      local value = (bs * (row % bs) + math.floor(row / bs) + col) % n + 1
      grid[row * n + col + 1] = value
    end
  end
  return grid
end

local function swap_rows(grid, n, from_rows, to_rows)
  local temp = {}
  for i, r in ipairs(from_rows) do
    temp[i] = {}
    for c = 1, n do temp[i][c] = grid[(r - 1) * n + c] end
  end
  for i, r in ipairs(to_rows) do
    for c = 1, n do grid[(r - 1) * n + c] = temp[i][c] end
  end
end

local function swap_cols(grid, n, from_cols, to_cols)
  local temp = {}
  for i, col in ipairs(from_cols) do
    temp[i] = {}
    for r = 1, n do temp[i][r] = grid[(r - 1) * n + col] end
  end
  for i, col in ipairs(to_cols) do
    for r = 1, n do grid[(r - 1) * n + col] = temp[i][r] end
  end
end

local function shuffle_pattern_grid(grid, n)
  local bs = V.box_size(n)

  -- Shuffle rows within each horizontal band
  for band = 0, bs - 1 do
    local start = band * bs + 1
    local rows = {}; for i = 0, bs - 1 do rows[i + 1] = start + i end
    local shuffled = {}; for i, v in ipairs(rows) do shuffled[i] = v end
    shuffle(shuffled)
    swap_rows(grid, n, rows, shuffled)
  end

  -- Shuffle cols within each vertical stack
  for stack = 0, bs - 1 do
    local start = stack * bs + 1
    local cols = {}; for i = 0, bs - 1 do cols[i + 1] = start + i end
    local shuffled = {}; for i, v in ipairs(cols) do shuffled[i] = v end
    shuffle(shuffled)
    swap_cols(grid, n, cols, shuffled)
  end

  -- Remap values
  local map = {}; for v = 1, n do map[v] = v end
  shuffle(map)
  for i = 1, n * n do grid[i] = map[grid[i]] end
end

-- Assess difficulty from clue count and solving simulation.
-- Returns 'easy', 'medium', 'hard', or 'expert'.
local function assess_difficulty(cells, n, target_diff)
  local clues = 0
  for i = 1, n * n do if cells[i] then clues = clues + 1 end end
  -- Simple heuristic: classify by clue density
  local density = clues / (n * n)
  if density >= 0.45 then return "easy"
  elseif density >= 0.37 then return "medium"
  elseif density >= 0.30 then return "hard"
  else return "expert" end
end

-- Public API ──────────────────────────────────────────────────────────────────

-- Generate a puzzle. Returns { size, difficulty, cells, solution }.
-- For n=9: backtracking + unique solution check (may take ~0.5s on ARM).
-- For n=16: fast pattern-based (instant).
function Gen.generate(n, difficulty)
  difficulty = difficulty or "medium"
  local solution, puzzle

  if n >= 16 then
    solution = create_pattern_grid(n)
    shuffle_pattern_grid(solution, n)
    local tc = target_clues(n, difficulty)
    puzzle = remove_simple(solution, tc)
  else
    -- Backtracking generation with unique solution guarantee
    local empty = {}
    for i = 1, n * n do empty[i] = nil end
    solution = Solver.solve_random(empty, n)
    assert(solution, "Failed to generate solution for " .. n .. "×" .. n)
    local tc = target_clues(n, difficulty)
    puzzle = remove_with_check(solution, n, tc)
  end

  local actual_diff = assess_difficulty(puzzle, n, difficulty)

  return {
    size       = n,
    difficulty = actual_diff,
    cells      = puzzle,    -- given clues (nil = blank)
    solution   = solution,  -- complete solution
  }
end

return Gen
