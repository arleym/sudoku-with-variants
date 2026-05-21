-- Undo/redo stack.
-- Each entry is a snapshot of { user_values, pencil_marks } at a point in time.
-- Snapshot approach chosen over diffs: simpler, and 9×9 arrays are tiny.

local History = {}
History.__index = History

function History.new()
  return setmetatable({ stack = {}, pos = 0 }, History)
end

-- Deep-copy user_values and pencil_marks arrays.
local function snapshot(user_values, pencil_marks, n)
  local uv = {}
  local pm = {}
  for i = 1, n * n do
    uv[i] = user_values[i]
    -- pencil_marks[i] is a table { [v]=true } or nil
    if pencil_marks[i] then
      pm[i] = {}
      for v, _ in pairs(pencil_marks[i]) do pm[i][v] = true end
    end
  end
  return { user_values = uv, pencil_marks = pm }
end

-- Push current state before a change.
function History:push(user_values, pencil_marks, n)
  -- Discard any redo entries above current position
  for i = self.pos + 1, #self.stack do self.stack[i] = nil end
  self.pos = self.pos + 1
  self.stack[self.pos] = snapshot(user_values, pencil_marks, n)
end

-- Undo: return the previous snapshot, or nil if at beginning.
function History:undo()
  if self.pos <= 1 then return nil end
  self.pos = self.pos - 1
  return self.stack[self.pos]
end

-- Redo: return the next snapshot, or nil if at end.
function History:redo()
  if self.pos >= #self.stack then return nil end
  self.pos = self.pos + 1
  return self.stack[self.pos]
end

function History:can_undo() return self.pos > 1 end
function History:can_redo() return self.pos < #self.stack end

-- Clear all history (e.g. on new game).
function History:reset(user_values, pencil_marks, n)
  self.stack = {}
  self.pos   = 0
  self:push(user_values, pencil_marks, n)
end

return History
