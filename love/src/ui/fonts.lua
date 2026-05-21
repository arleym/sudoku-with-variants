-- Font management. Call Fonts.init() once in love.load().
-- Falls back to LÖVE's built-in bitmap font if the TTF is missing.

local Fonts = {}

local PATH = "assets/fonts/JetBrainsMono-Regular.ttf"

local function load(size)
  local ok, f = pcall(love.graphics.newFont, PATH, size)
  return ok and f or love.graphics.newFont(size)
end

function Fonts.init()
  Fonts.sm       = load(11)   -- labels, hints, timer
  Fonts.md       = load(15)   -- wordmark, picker numbers (9×9)
  Fonts.lg       = load(28)   -- cell values 9×9
  Fonts.cell16   = load(14)   -- cell values 16×16
  Fonts.pencil9  = load(9)    -- pencil marks 9×9
  Fonts.pencil16 = load(6)    -- pencil marks 16×16 (tiny)
  Fonts.picker16 = load(11)   -- picker numbers 16×16
end

-- Font to use for a given value in a grid of size n.
function Fonts.cell(n)
  return n <= 9 and Fonts.lg or Fonts.cell16
end

-- Font for pencil marks.
function Fonts.pencil(n)
  return n <= 9 and Fonts.pencil9 or Fonts.pencil16
end

-- Font for number picker.
function Fonts.picker(n)
  return n <= 9 and Fonts.md or Fonts.picker16
end

-- Value display string (A-G for 10-16).
function Fonts.display(v, n)
  if not v then return "" end
  if n > 9 and v > 9 then return string.char(64 + v) end  -- A=10, B=11...
  return tostring(v)
end

return Fonts
