-- Gamepad button mapping for Anbernic Cubexx on Knulli.
-- LÖVE uses SDL2 gamepad names (xinput-compatible layout).
--
-- Physical layout (Anbernic face buttons):
--   A = east (right)   B = south (bottom)
--   X = north (top)    Y = west (left)
--
-- Note: L1/R1 are contextual —
--   2D mode:  L1/R1 move the number picker cursor
--   3D mode:  L1/R1 change the active layer
--   In both modes: L2/R2 = undo/redo

local G = {}

-- Button name constants (SDL2 gamepad axis/button strings)
G.CONFIRM     = "a"               -- place selected number
G.CLEAR       = "b"               -- clear cell / back
G.PENCIL      = "x"               -- toggle pencil mode
G.HINT        = "y"               -- show hint (TBD)
G.L1          = "leftshoulder"    -- picker prev / layer prev
G.R1          = "rightshoulder"   -- picker next / layer next
G.L2          = "lefttrigger"     -- undo
G.R2          = "righttrigger"    -- redo
G.SELECT      = "back"            -- toggle 3D cube overlay
G.START       = "start"           -- pause menu
G.DPUP        = "dpup"
G.DPDOWN      = "dpdown"
G.DPLEFT      = "dpleft"
G.DPRIGHT     = "dpright"

-- Action → button lookup (reverse map, for UI hints)
G.labels = {
  confirm  = "A",
  clear    = "B",
  pencil   = "X",
  hint     = "Y",
  prev     = "L1",
  next     = "R1",
  undo     = "L2",
  redo     = "R2",
  overlay  = "Select",
  menu     = "Start",
}

-- Returns true if the gamepad button string matches a given action constant
function G.is(button, action_const)
  return button == action_const
end

return G
