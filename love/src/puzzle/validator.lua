-- 2D Sudoku validator.
-- All indices are 1-based flat (1..n*n). Rows and cols are 1-based.

local V = {}

-- box size for a given grid size (3 for 9×9, 2 for 4×4, 4 for 16×16)
local function box_size(n) return math.floor(math.sqrt(n) + 0.5) end

local function row_of(idx, n) return math.floor((idx - 1) / n) + 1 end
local function col_of(idx, n) return ((idx - 1) % n) + 1 end
local function to_idx(row, col, n) return (row - 1) * n + col end

-- Returns true if placing `value` at `idx` in `cells` is valid.
-- cells: 1-indexed array, nil = empty.
function V.is_valid_placement(cells, idx, value, n)
  local row = row_of(idx, n)
  local col = col_of(idx, n)
  local bs  = box_size(n)

  -- Check row
  for c = 1, n do
    local i = to_idx(row, c, n)
    if i ~= idx and cells[i] == value then return false end
  end

  -- Check column
  for r = 1, n do
    local i = to_idx(r, col, n)
    if i ~= idx and cells[i] == value then return false end
  end

  -- Check box
  local br = math.floor((row - 1) / bs) * bs + 1
  local bc = math.floor((col - 1) / bs) * bs + 1
  for r = br, br + bs - 1 do
    for c = bc, bc + bs - 1 do
      local i = to_idx(r, c, n)
      if i ~= idx and cells[i] == value then return false end
    end
  end

  return true
end

-- Returns list of flat indices that conflict with cells[idx].
function V.get_conflicts(cells, idx, n)
  local value = cells[idx]
  if value == nil then return {} end

  local row = row_of(idx, n)
  local col = col_of(idx, n)
  local bs  = box_size(n)
  local seen = {}
  local conflicts = {}

  local function add(i)
    if i ~= idx and cells[i] == value and not seen[i] then
      seen[i] = true
      conflicts[#conflicts + 1] = i
    end
  end

  for c = 1, n do add(to_idx(row, c, n)) end
  for r = 1, n do add(to_idx(r, col, n)) end

  local br = math.floor((row - 1) / bs) * bs + 1
  local bc = math.floor((col - 1) / bs) * bs + 1
  for r = br, br + bs - 1 do
    for c = bc, bc + bs - 1 do add(to_idx(r, c, n)) end
  end

  return conflicts
end

-- Returns set (table with idx keys) of all conflicting indices across the grid.
function V.get_all_conflicts(cells, n)
  local result = {}
  for i = 1, n * n do
    if cells[i] ~= nil then
      local cs = V.get_conflicts(cells, i, n)
      if #cs > 0 then
        result[i] = true
        for _, c in ipairs(cs) do result[c] = true end
      end
    end
  end
  return result
end

-- Returns true if every cell matches the solution.
-- puzzle_cells: given clues (nil = blank), user_values: player entries.
function V.is_complete(puzzle_cells, user_values, solution, n)
  for i = 1, n * n do
    local v = puzzle_cells[i] or user_values[i]
    if v ~= solution[i] then return false end
  end
  return true
end

-- Expose helpers for other modules
V.row_of  = row_of
V.col_of  = col_of
V.to_idx  = to_idx
V.box_size = box_size

return V
