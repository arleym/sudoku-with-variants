-- Right sidebar: action buttons stacked vertically.
-- Button order (top→bottom):
--   [3D only]  Layer Up
--              Undo
--              Clear
--              Hint
--              Pencil   (toggle)
--              Layers   (toggle)
--   [3D only]  Layer Down
--
-- In 3D mode: "Lv N" label shown above the button stack.

local C     = require "src.const"
local Icons = require "src.ui.icons"

local SB = {}

local function sc(c, a)
  love.graphics.setColor(c[1], c[2], c[3], a or 1)
end

local BTN_W   = C.SIDEBAR_W - 12   -- 108px
local BTN_H   = 60
local BTN_GAP = 8
local BTN_X   = C.SIDEBAR_X + 6

-- hint = gamepad button label shown in corner of each sidebar button
local function build_buttons(is_3d)
  local btns = {}
  if is_3d then btns[#btns+1] = { id="layer_up",   label="Layer Up",   hint="L1"  } end
  btns[#btns+1] = { id="undo",        label="Undo",       hint="L2"  }
  btns[#btns+1] = { id="clear",       label="Clear",      hint="B"   }
  btns[#btns+1] = { id="hint",        label="Hint",       hint="Y"   }
  btns[#btns+1] = { id="pencil",      label="Pencil",     hint="X"   }
  btns[#btns+1] = { id="layers",      label="Layers",     hint="Sel" }
  if is_3d then btns[#btns+1] = { id="layer_down", label="Layer Down", hint="R1"  } end
  return btns
end

local function buttons_y0(n_btns, lv_label_h)
  lv_label_h = lv_label_h or 0
  local total = n_btns * BTN_H + (n_btns - 1) * BTN_GAP + lv_label_h
  return C.GRID_AREA_Y + math.floor((C.GRID_AREA_H - total) / 2)
end

function SB.draw(state, fonts, colors, show_overlay, is_3d)
  local co   = colors.current
  local btns = build_buttons(is_3d)

  -- Sidebar background + left border
  sc(co.topbar_bg)
  love.graphics.rectangle("fill", C.SIDEBAR_X, C.TOPBAR_H, C.SIDEBAR_W, C.GRID_AREA_H)
  sc(co.border_box)
  love.graphics.rectangle("fill", C.SIDEBAR_X, C.TOPBAR_H, 1, C.GRID_AREA_H)

  -- "Lv N" label in 3D mode, above buttons
  local lv_h = 0
  if is_3d and state then
    lv_h = 26
  end

  local y0   = buttons_y0(#btns, lv_h)

  if is_3d and state then
    local lv_txt = "Lv " .. ((state.active_layer or 0) + 1)
    love.graphics.setFont(fonts.sm)
    sc(co.accent)
    local lw = fonts.sm:getWidth(lv_txt)
    love.graphics.print(lv_txt,
      math.floor(C.SIDEBAR_X + (C.SIDEBAR_W - lw) / 2),
      y0 - lv_h + 6)
  end

  for i, btn in ipairs(btns) do
    local by = y0 + (i - 1) * (BTN_H + BTN_GAP)
    local cx = BTN_X + BTN_W / 2
    local cy = by + BTN_H / 2

    -- Active / disabled states
    local active   = (btn.id == "pencil" and state and state.pencil_mode)
                  or (btn.id == "layers" and show_overlay)
    local al = state and (state.active_layer or 0) or 0
    local n  = state and (state.n or 1) or 1
    local disabled = (btn.id == "undo"       and state and not state:can_undo())
                  or (btn.id == "layer_up"   and is_3d and al == 0)
                  or (btn.id == "layer_down" and is_3d and al >= n - 1)

    -- Background
    if active then
      sc(co.cell_sel_bg)
    elseif disabled then
      sc(co.cell_bg, 0.5)
    else
      sc(co.picker_cell)
    end
    love.graphics.rectangle("fill", BTN_X, by, BTN_W, BTN_H, 6)

    -- Border
    love.graphics.setLineWidth(active and 1.5 or 1)
    sc(active and co.accent or co.picker_border)
    love.graphics.rectangle("line", BTN_X, by, BTN_W, BTN_H, 6)
    love.graphics.setLineWidth(1)

    -- Icon colour
    local icon_col = disabled and co.label_dim
                  or active    and co.accent
                  or co.topbar_text
    sc(icon_col)

    -- Icon (upper portion of button)
    local icon_cy = by + BTN_H * 0.37
    local r       = 8

    if     btn.id == "layer_up"   then Icons.arrow_up(cx, icon_cy, r)
    elseif btn.id == "layer_down" then Icons.arrow_down(cx, icon_cy, r)
    elseif btn.id == "undo"       then Icons.undo(cx, icon_cy, r)
    elseif btn.id == "clear"      then Icons.clear(cx, icon_cy, r)
    elseif btn.id == "hint"       then Icons.question_octagon(cx, icon_cy, r, false, fonts.sm)
    elseif btn.id == "pencil"     then Icons.pencil_square(cx, icon_cy, r)
    elseif btn.id == "layers"     then Icons.layers(cx, icon_cy, r, active)
    end

    -- Label (lower portion)
    love.graphics.setFont(fonts.sm)
    sc(disabled and co.label_dim or (active and co.accent or co.label_txt))
    local lw = fonts.sm:getWidth(btn.label)
    local ly = by + BTN_H * 0.64
    love.graphics.print(btn.label,
      math.floor(BTN_X + (BTN_W - lw) / 2),
      math.floor(ly))

    -- Gamepad hint (bottom-right corner, very small)
    if btn.hint then
      love.graphics.setFont(fonts.sm)
      sc(disabled and co.label_dim or co.label_dim, 0.55)
      local hw = fonts.sm:getWidth(btn.hint)
      love.graphics.print(btn.hint,
        BTN_X + BTN_W - hw - 5,
        by + BTN_H - fonts.sm:getHeight() - 3)
    end
  end
end

-- Returns button id if (x, y) hits a button, nil otherwise.
function SB.hit(x, y, is_3d)
  if x < C.SIDEBAR_X or x > C.W then return nil end
  if y < C.TOPBAR_H or y > C.H - C.PICKER_H then return nil end

  local btns = build_buttons(is_3d)
  local lv_h = is_3d and 26 or 0
  local y0   = buttons_y0(#btns, lv_h)

  for i, btn in ipairs(btns) do
    local by = y0 + (i - 1) * (BTN_H + BTN_GAP)
    if y >= by and y <= by + BTN_H then return btn.id end
  end
  return nil
end

return SB
