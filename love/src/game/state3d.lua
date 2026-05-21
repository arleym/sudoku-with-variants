-- 3D game state (N×N×N puzzle).
-- cursor is a 2D flat index within the active layer (1..n*n).
-- All persistent storage uses 3D flat indices (1..n*n*n).
-- layer_view() returns a table compatible with Grid.draw().

local G3   = require "src.puzzle.generator3d"
local V3   = require "src.puzzle.validator3d"
local Hist = require "src.game.history"
local Sett = require "src.settings"

local State3D = {}
State3D.__index = State3D

function State3D.new()
  local s = setmetatable({}, State3D)
  s.n            = 4
  s.puzzle       = nil
  s.user_values  = {}
  s.pencil_marks = {}
  s.cursor       = nil    -- 2D layer index 1..n*n, nil = none
  s.active_layer = 0      -- 0-indexed, 0..n-1
  s.pick_cursor  = 1
  s.pencil_mode  = false
  s.conflicts    = {}     -- { [flat3d]=true }
  s.is_complete  = false
  s.timer        = 0.0
  s.hist         = Hist.new()
  return s
end

-- ── Index helpers ─────────────────────────────────────────────────────────────

function State3D:flat3(idx2d)
  return self.active_layer * self.n * self.n + idx2d
end

-- ── Internals ────────────────────────────────────────────────────────────────

function State3D:_merged()
  local n3   = self.n * self.n * self.n
  local m    = {}
  for i = 1, n3 do
    m[i] = self.puzzle.cells[i] or self.user_values[i]
  end
  return m
end

function State3D:_update_conflicts()
  self.conflicts = V3.get_all_conflicts(self:_merged(), self.n)
end

function State3D:_check_complete()
  self.is_complete = V3.is_complete(
    self.puzzle.cells, self.user_values, self.puzzle.solution, self.n)
end

function State3D:_save()
  self.hist:push(self.user_values, self.pencil_marks, self.n * self.n * self.n)
end

function State3D:_restore(snap)
  if not snap then return end
  self.user_values  = snap.user_values
  self.pencil_marks = snap.pencil_marks
  self:_update_conflicts()
  self:_check_complete()
end

function State3D:_clean_pencil_around(flat3, value)
  -- Remove value from pencil marks in all cells sharing row/col/box/pillar.
  -- Reuse V3 conflict logic: any cell that would conflict with this placement.
  local n    = self.n
  local temp = self:_merged()
  temp[flat3] = value
  for i = 1, n * n * n do
    if self.pencil_marks[i] then
      local conflicts = V3.get_conflicts(temp, i, n)
      -- only remove from cells that see flat3
      for _, ci in ipairs(conflicts) do
        if ci == flat3 then
          self.pencil_marks[i][value] = nil
          break
        end
      end
    end
  end
end

-- ── Public API ────────────────────────────────────────────────────────────────

function State3D:new_game(n, difficulty)
  self.n      = n
  self.puzzle = G3.generate(n, difficulty)
  local n3    = n * n * n
  self.user_values  = {}
  self.pencil_marks = {}
  for i = 1, n3 do
    self.user_values[i]  = nil
    self.pencil_marks[i] = {}
  end
  self.cursor       = nil
  self.active_layer = 0
  self.pick_cursor  = 1
  self.pencil_mode  = false
  self.conflicts    = {}
  self.is_complete  = false
  self.timer        = 0.0
  self.hist:reset(self.user_values, self.pencil_marks, n3)
end

function State3D:change_layer(d)
  self.active_layer = math.max(0, math.min(self.n - 1, self.active_layer + d))
  self.cursor = nil  -- deselect on layer change
end

function State3D:is_given(idx2d)
  return self.puzzle ~= nil and self.puzzle.cells[self:flat3(idx2d)] ~= nil
end

function State3D:move(dr, dc)
  local n = self.n
  if not self.cursor then self.cursor = 1; return end
  local row = math.floor((self.cursor - 1) / n) + 1
  local col = ((self.cursor - 1) % n) + 1
  row = ((row - 1 + dr) % n) + 1
  col = ((col - 1 + dc) % n) + 1
  self.cursor = (row - 1) * n + col
end

function State3D:move_pick(d)
  self.pick_cursor = ((self.pick_cursor - 1 + d) % self.n) + 1
end

function State3D:set_value(value)
  local idx2d = self.cursor
  if not idx2d or self:is_given(idx2d) then return end
  local flat3 = self:flat3(idx2d)
  if self.user_values[flat3] == value then
    self.user_values[flat3] = nil
  else
    self.user_values[flat3] = value
    self.pencil_marks[flat3] = {}
    if value and Sett.pencil_auto_clean then
      self:_clean_pencil_around(flat3, value)
    end
  end
  self:_save()
  self:_update_conflicts()
  self:_check_complete()
end

function State3D:toggle_pencil_mark(value)
  local idx2d = self.cursor
  if not idx2d or self:is_given(idx2d) then return end
  local flat3 = self:flat3(idx2d)
  if self.user_values[flat3] then return end
  self.pencil_marks[flat3] = self.pencil_marks[flat3] or {}
  if self.pencil_marks[flat3][value] then
    self.pencil_marks[flat3][value] = nil
  else
    self.pencil_marks[flat3][value] = true
  end
  self:_save()
end

function State3D:clear_cell()
  local idx2d = self.cursor
  if not idx2d or self:is_given(idx2d) then return end
  local flat3 = self:flat3(idx2d)
  self.user_values[flat3]  = nil
  self.pencil_marks[flat3] = {}
  self:_save()
  self:_update_conflicts()
  self:_check_complete()
end

-- Reset user progress on the current puzzle (same clues, fresh slate).
function State3D:restart()
  local n     = self.n
  local total = n * n * n
  self.user_values  = {}
  self.pencil_marks = {}
  for i = 1, total do
    self.user_values[i]  = nil
    self.pencil_marks[i] = {}
  end
  self.cursor       = nil
  self.active_layer = 0
  self.pencil_mode  = false
  self.conflicts    = {}
  self.is_complete  = false
  self.timer        = 0.0
  self.hist:reset(self.user_values, self.pencil_marks, total)
end

function State3D:select(idx) self.cursor = idx end

function State3D:undo()  self:_restore(self.hist:undo()) end
function State3D:redo()  self:_restore(self.hist:redo()) end
function State3D:can_undo() return self.hist:can_undo() end
function State3D:can_redo() return self.hist:can_redo() end

function State3D:update(dt)
  if not self.is_complete then self.timer = self.timer + dt end
end

function State3D:cursor_pos()
  if not self.cursor then return nil end
  local n   = self.n
  local row = math.floor((self.cursor - 1) / n) + 1
  local col = ((self.cursor - 1) % n) + 1
  return row, col
end

function State3D:selected_value()
  if not self.cursor then return nil end
  local flat3 = self:flat3(self.cursor)
  return self.puzzle.cells[flat3] or self.user_values[flat3]
end

function State3D:value_at(idx2d)
  local flat3 = self:flat3(idx2d)
  return self.puzzle.cells[flat3] or self.user_values[flat3]
end

-- Returns a 2D-indexed view of the active layer for Grid.draw().
function State3D:layer_view()
  local n  = self.n
  local ls = n * n
  local lo = self.active_layer * ls

  local cells_v = {}
  local uv_v    = {}
  local pm_v    = {}
  local conf_v  = {}
  for i = 1, ls do
    cells_v[i] = self.puzzle.cells[lo + i]
    uv_v[i]   = self.user_values[lo + i]
    pm_v[i]   = self.pencil_marks[lo + i]
    conf_v[i] = self.conflicts[lo + i] or nil
  end

  local cursor  = self.cursor
  local sel_val = cursor and (cells_v[cursor] or uv_v[cursor]) or nil

  local s3 = self  -- close over for method delegation

  local view = {
    n            = n,
    puzzle       = { cells = cells_v, difficulty = self.puzzle.difficulty },
    user_values  = uv_v,
    pencil_marks = pm_v,
    conflicts    = conf_v,
    cursor       = cursor,
    pick_cursor  = self.pick_cursor,
    pencil_mode  = self.pencil_mode,
    is_complete  = self.is_complete,
    timer        = self.timer,
  }
  view.is_given      = function(_, i)  return cells_v[i] ~= nil end
  view.value_at      = function(_, i)  return cells_v[i] or uv_v[i] end
  view.selected_value = function(_)    return sel_val end
  view.can_undo      = function(_)     return s3:can_undo() end
  view.can_redo      = function(_)     return s3:can_redo() end
  view.cursor_pos    = function(_)
    if not cursor then return nil end
    return math.floor((cursor-1)/n)+1, ((cursor-1)%n)+1
  end

  return view
end

return State3D
