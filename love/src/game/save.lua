-- Save / load game state to love.filesystem.
-- Format: plain text, one key=value per line.
-- Pencil marks are not persisted (acceptable for v1).

local Save = {}

local FILE = "savegame.txt"

-- ── Serialise ─────────────────────────────────────────────────────────────────

local function arr_to_str(arr, n)
  local parts = {}
  for i = 1, n do
    parts[i] = arr[i] ~= nil and tostring(arr[i]) or "."
  end
  return table.concat(parts, ",")
end

local function str_to_arr(s, as_num)
  local arr = {}
  local i = 0
  for tok in (s .. ","):gmatch("([^,]*),") do
    i = i + 1
    if tok == "." then
      arr[i] = nil
    elseif as_num then
      arr[i] = tonumber(tok)
    else
      arr[i] = tok
    end
  end
  return arr
end

function Save.write(state, is_3d)
  if not state or not state.puzzle then return end
  local p   = state.puzzle
  local n   = state.n
  local n3  = is_3d and (n * n * n) or (n * n)
  local n2  = n * n

  local lines = {
    "VERSION=2",
    "MODE="        .. (is_3d and "3d" or "2d"),
    "N="           .. n,
    "DEPTH="       .. (is_3d and p.depth or n),
    "DIFFICULTY="  .. p.difficulty,
    "TIMER="       .. string.format("%.2f", state.timer),
    "LAYER="       .. (is_3d and (state.active_layer or 0) or 0),
    "PUZZLE="      .. arr_to_str(p.cells,        n3),
    "SOLUTION="    .. arr_to_str(p.solution,      n3),
    "USER="        .. arr_to_str(state.user_values, n3),
  }

  love.filesystem.write(FILE, table.concat(lines, "\n"))
end

function Save.read()
  if not love.filesystem.getInfo(FILE) then return nil end
  local ok, content = pcall(love.filesystem.read, FILE)
  if not ok or not content then return nil end

  local kv = {}
  for line in content:gmatch("[^\n]+") do
    local k, v = line:match("^([%w_]+)=(.*)$")
    if k then kv[k] = v end
  end

  if not kv.VERSION or not kv.MODE or not kv.N then return nil end

  local n    = tonumber(kv.N)
  local n3   = kv.MODE == "3d" and (n * n * n) or (n * n)

  return {
    mode       = kv.MODE,
    n          = n,
    depth      = tonumber(kv.DEPTH) or n,
    difficulty = kv.DIFFICULTY or "medium",
    timer      = tonumber(kv.TIMER) or 0,
    layer      = tonumber(kv.LAYER) or 0,
    puzzle_cells  = str_to_arr(kv.PUZZLE   or "", true),
    solution      = str_to_arr(kv.SOLUTION or "", true),
    user_values   = str_to_arr(kv.USER     or "", true),
  }
end

-- Returns true if a save file exists.
function Save.exists()
  return love.filesystem.getInfo(FILE) ~= nil
end

-- Delete the save file (called on new game or completion).
function Save.delete()
  if love.filesystem.getInfo(FILE) then
    love.filesystem.remove(FILE)
  end
end

return Save
