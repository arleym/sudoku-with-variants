-- Font management. Call Fonts.init() once in love.load().
-- Falls back to LÖVE's built-in bitmap font if the TTF is missing.

local Fonts = {}

local PATH = "assets/fonts/JetBrainsMono-Regular.ttf"

local function load(size)
  local ok, f = pcall(love.graphics.newFont, PATH, size)
  return ok and f or love.graphics.newFont(size)
end

function Fonts.init()
  Fonts.sm        = load(11)   -- labels, hints, timer, sidebar
  Fonts.md        = load(15)   -- wordmark, picker (9×9)

  Fonts.cell4     = load(52)   -- cell values  4×4  (149px cells)
  Fonts.lg        = load(28)   -- cell values  9×9  (66px cells)
  Fonts.cell16    = load(14)   -- cell values 16×16 (37px cells)
  Fonts.cell25    = load(10)   -- cell values 25×25 (23px cells)

  Fonts.pencil4   = load(18)   -- pencil marks  4×4  (2×2 subgrid, ~74px slots)
  Fonts.pencil9   = load(9)    -- pencil marks  9×9  (3×3 subgrid, ~22px slots)
  Fonts.pencil16  = load(6)    -- pencil marks 16×16 (4×4 subgrid, ~9px slots)
  -- 25×25: 5×5 subgrid → ~4.7px slots → skip pencil marks entirely

  Fonts.picker4   = load(34)   -- picker numbers  4×4  (very wide slots)
  Fonts.picker16  = load(11)   -- picker numbers 16×16
  Fonts.picker25  = load(9)    -- picker numbers 25×25 (very narrow slots)
end

function Fonts.cell(n)
  if n <= 4  then return Fonts.cell4
  elseif n <= 9  then return Fonts.lg
  elseif n <= 16 then return Fonts.cell16
  else return Fonts.cell25 end
end

function Fonts.pencil(n)
  if n <= 4  then return Fonts.pencil4
  elseif n <= 9  then return Fonts.pencil9
  else return Fonts.pencil16 end
  -- n=25: caller checks slot size and skips if too small
end

function Fonts.picker(n)
  if n <= 4  then return Fonts.picker4
  elseif n <= 9  then return Fonts.md
  elseif n <= 16 then return Fonts.picker16
  else return Fonts.picker25 end
end

-- Value display string (A-G for 10-16, A-O for 10-25 etc.)
function Fonts.display(v, n)
  if not v then return "" end
  if n > 9 and v > 9 then return string.char(64 + v) end  -- A=10, B=11...
  return tostring(v)
end

return Fonts
