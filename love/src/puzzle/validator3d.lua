-- 3D Sudoku validator.
-- Flat index (1-based): layer * size*size + row * size + col  (all 0-based internally)
-- Public API uses 1-based flat indices to match Lua convention.
-- Puzzle is N×N×N: depth = size.

local V3 = {}

-- Convert 1-based flat index → 0-based (layer, row, col)
local function decompose(flat1, n)
  local f  = flat1 - 1
  local ls = n * n
  local layer = math.floor(f / ls)
  local li    = f % ls
  local row   = math.floor(li / n)
  local col   = li % n
  return layer, row, col
end

-- 0-based (layer, row, col) → 1-based flat index
local function compose(layer, row, col, n)
  return layer * n * n + row * n + col + 1
end

V3.compose   = compose
V3.decompose = decompose

-- Returns true if placing `value` at `flat1` is valid.
function V3.is_valid_placement(cells, flat1, value, n)
  local layer, row, col = decompose(flat1, n)
  local bs    = math.floor(math.sqrt(n) + 0.5)
  local depth = n  -- N×N×N

  -- Row in layer
  for c = 0, n - 1 do
    local i = compose(layer, row, c, n)
    if i ~= flat1 and cells[i] == value then return false end
  end
  -- Col in layer
  for r = 0, n - 1 do
    local i = compose(layer, r, col, n)
    if i ~= flat1 and cells[i] == value then return false end
  end
  -- Box in layer
  local br = math.floor(row / bs) * bs
  local bc = math.floor(col / bs) * bs
  for r = br, br + bs - 1 do
    for c = bc, bc + bs - 1 do
      local i = compose(layer, r, c, n)
      if i ~= flat1 and cells[i] == value then return false end
    end
  end
  -- Pillar (same row/col across all layers)
  for d = 0, depth - 1 do
    local i = compose(d, row, col, n)
    if i ~= flat1 and cells[i] == value then return false end
  end

  return true
end

-- Returns list of conflicting 1-based flat indices for cells[flat1].
function V3.get_conflicts(cells, flat1, n)
  local value = cells[flat1]
  if value == nil then return {} end

  local layer, row, col = decompose(flat1, n)
  local bs    = math.floor(math.sqrt(n) + 0.5)
  local depth = n
  local seen  = {}
  local out   = {}

  local function add(i)
    if i ~= flat1 and cells[i] == value and not seen[i] then
      seen[i] = true
      out[#out + 1] = i
    end
  end

  for c = 0, n - 1 do add(compose(layer, row, c, n)) end
  for r = 0, n - 1 do add(compose(layer, r, col, n)) end

  local br = math.floor(row / bs) * bs
  local bc = math.floor(col / bs) * bs
  for r = br, br + bs - 1 do
    for c = bc, bc + bs - 1 do add(compose(layer, r, c, n)) end
  end

  for d = 0, depth - 1 do add(compose(d, row, col, n)) end

  return out
end

-- Returns set of all conflicting 1-based indices across the full 3D grid.
function V3.get_all_conflicts(cells, n)
  local result = {}
  for i = 1, n * n * n do
    if cells[i] ~= nil then
      local cs = V3.get_conflicts(cells, i, n)
      if #cs > 0 then
        result[i] = true
        for _, c in ipairs(cs) do result[c] = true end
      end
    end
  end
  return result
end

-- Returns true if the complete grid satisfies all 3D constraints.
function V3.is_valid_solution(grid, n)
  local bs     = math.floor(math.sqrt(n) + 0.5)
  local nb     = n / bs
  local depth  = n

  for d = 0, depth - 1 do
    -- Rows
    for r = 0, n - 1 do
      local seen = {}
      for c = 0, n - 1 do
        local v = grid[compose(d, r, c, n)]
        if v == nil or seen[v] then return false end
        seen[v] = true
      end
    end
    -- Cols
    for c = 0, n - 1 do
      local seen = {}
      for r = 0, n - 1 do
        local v = grid[compose(d, r, c, n)]
        if v == nil or seen[v] then return false end
        seen[v] = true
      end
    end
    -- Boxes
    for br = 0, nb - 1 do
      for bc = 0, nb - 1 do
        local seen = {}
        for r = br * bs, br * bs + bs - 1 do
          for c = bc * bs, bc * bs + bs - 1 do
            local v = grid[compose(d, r, c, n)]
            if v == nil or seen[v] then return false end
            seen[v] = true
          end
        end
      end
    end
  end

  -- Pillars
  for r = 0, n - 1 do
    for c = 0, n - 1 do
      local seen = {}
      for d = 0, depth - 1 do
        local v = grid[compose(d, r, c, n)]
        if v == nil or seen[v] then return false end
        seen[v] = true
      end
    end
  end

  return true
end

-- Returns true if all cells match the solution.
function V3.is_complete(puzzle_cells, user_values, solution, n)
  for i = 1, n * n * n do
    local v = puzzle_cells[i] or user_values[i]
    if v ~= solution[i] then return false end
  end
  return true
end

return V3
