-- Game state for 2D sudoku.
-- Manages puzzle data, user input, undo history, timer, and derived state.

local Gen  = require "src.puzzle.generator"
local V    = require "src.puzzle.validator"
local Hist = require "src.game.history"
local Sett = require "src.settings"

local State = {}
State.__index = State

function State.new()
  local s = setmetatable({}, State)
  s.n            = 9
  s.puzzle       = nil
  s.user_values  = {}
  s.pencil_marks = {}
  s.cursor       = nil   -- 1-based flat index, nil = nothing selected
  s.pick_cursor  = 1     -- 1-based, which number is active in the picker
  s.pencil_mode  = false
  s.conflicts    = {}    -- { [idx]=true } of cells with errors
  s.is_complete  = false
  s.timer        = 0.0
  s.hist         = Hist.new()
  return s
end

-- ── Internals ────────────────────────────────────────────────────────────────

local function merged(puzzle_cells, user_values, n)
  local m = {}
  for i = 1, n * n do m[i] = puzzle_cells[i] or user_values[i] end
  return m
end

function State:_merged()
  return merged(self.puzzle.cells, self.user_values, self.n)
end

function State:_update_conflicts()
  self.conflicts = V.get_all_conflicts(self:_merged(), self.n)
end

function State:_check_complete()
  self.is_complete = V.is_complete(
    self.puzzle.cells, self.user_values, self.puzzle.solution, self.n)
end

function State:_save()
  self.hist:push(self.user_values, self.pencil_marks, self.n * self.n)
end

function State:_restore(snap)
  if not snap then return end
  self.user_values  = snap.user_values
  self.pencil_marks = snap.pencil_marks
  self:_update_conflicts()
  self:_check_complete()
end

function State:_clean_pencil_around(idx, value)
  -- Remove `value` from pencil marks in all cells in same row/col/box.
  local n  = self.n
  local bs = V.box_size(n)
  local row = math.floor((idx - 1) / n) + 1
  local col = ((idx - 1) % n) + 1
  local br  = math.floor((row - 1) / bs) * bs + 1
  local bc  = math.floor((col - 1) / bs) * bs + 1

  local function remove(i)
    if self.pencil_marks[i] then self.pencil_marks[i][value] = nil end
  end

  for c = 1, n do remove((row - 1) * n + c) end
  for r = 1, n do remove((r - 1) * n + col) end
  for r = br, br + bs - 1 do
    for c = bc, bc + bs - 1 do remove((r - 1) * n + c) end
  end
end

-- ── Public API ────────────────────────────────────────────────────────────────

function State:new_game(n, difficulty)
  self.n     = n
  self.puzzle = Gen.generate(n, difficulty)
  self.user_values  = {}
  self.pencil_marks = {}
  for i = 1, n * n do
    self.user_values[i]  = nil
    self.pencil_marks[i] = {}
  end
  self.cursor      = nil
  self.pencil_mode = false
  self.pick_cursor = 1
  self.conflicts   = {}
  self.is_complete = false
  self.timer       = 0.0
  self.hist:reset(self.user_values, self.pencil_marks, n * n)
end

function State:is_given(idx)
  return self.puzzle ~= nil and self.puzzle.cells[idx] ~= nil
end

function State:select(idx)
  self.cursor = idx
end

function State:move(dr, dc)
  local n = self.n
  if not self.cursor then self.cursor = 1; return end
  local row = math.floor((self.cursor - 1) / n) + 1
  local col = ((self.cursor - 1) % n) + 1
  row = ((row - 1 + dr) % n) + 1  -- wrap
  col = ((col - 1 + dc) % n) + 1
  self.cursor = (row - 1) * n + col
end

function State:move_pick(d)
  self.pick_cursor = ((self.pick_cursor - 1 + d) % self.n) + 1
end

function State:set_value(value)
  local idx = self.cursor
  if not idx or self:is_given(idx) then return end
  if self.user_values[idx] == value then
    self.user_values[idx] = nil
  else
    self.user_values[idx] = value
    self.pencil_marks[idx] = {}
    if value and Sett.pencil_auto_clean then
      self:_clean_pencil_around(idx, value)
    end
  end
  self:_save()  -- save the resulting state so undo restores to it
  self:_update_conflicts()
  self:_check_complete()
end

function State:toggle_pencil_mark(value)
  local idx = self.cursor
  if not idx or self:is_given(idx) then return end
  if self.user_values[idx] then return end
  if not self.pencil_marks[idx] then self.pencil_marks[idx] = {} end
  if self.pencil_marks[idx][value] then
    self.pencil_marks[idx][value] = nil
  else
    self.pencil_marks[idx][value] = true
  end
  self:_save()
end

function State:clear_cell()
  local idx = self.cursor
  if not idx or self:is_given(idx) then return end
  self.user_values[idx]  = nil
  self.pencil_marks[idx] = {}
  self:_save()
  self:_update_conflicts()
  self:_check_complete()
end

-- Reset user progress on the current puzzle (same clues, fresh slate).
function State:restart()
  local n     = self.n
  local total = n * n
  self.user_values  = {}
  self.pencil_marks = {}
  for i = 1, total do
    self.user_values[i]  = nil
    self.pencil_marks[i] = {}
  end
  self.cursor      = nil
  self.pencil_mode = false
  self.conflicts   = {}
  self.is_complete = false
  self.timer       = 0.0
  self.hist:reset(self.user_values, self.pencil_marks, total)
end

function State:undo()  self:_restore(self.hist:undo()) end
function State:redo()  self:_restore(self.hist:redo()) end
function State:can_undo() return self.hist:can_undo() end
function State:can_redo() return self.hist:can_redo() end

function State:update(dt)
  if not self.is_complete then self.timer = self.timer + dt end
end

-- Returns (row, col) of cursor (1-based), or nil.
function State:cursor_pos()
  if not self.cursor then return nil end
  local n   = self.n
  local row = math.floor((self.cursor - 1) / n) + 1
  local col = ((self.cursor - 1) % n) + 1
  return row, col
end

-- Returns the display value at idx (given or user).
function State:value_at(idx)
  return self.puzzle.cells[idx] or self.user_values[idx]
end

-- Returns the selected cell's current display value (for same-number highlight).
function State:selected_value()
  if not self.cursor then return nil end
  return self:value_at(self.cursor)
end

return State
