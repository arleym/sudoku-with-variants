-- Sudoku grid renderer.
-- Grid.draw(state, layout, fonts, colors)

local V = require "src.puzzle.validator"

local Grid = {}

local function sc(c, a)  -- set color helper
  love.graphics.setColor(c[1], c[2], c[3], a or 1)
end

-- ── Cell background ───────────────────────────────────────────────────────────

local function cell_bg(co, is_sel, is_hl, is_sn, is_err)
  if is_sel then return co.cell_sel_bg end
  if is_err then return co.cell_err_bg end
  if is_sn  then return co.cell_sn_bg  end
  if is_hl  then return co.cell_hl_bg  end
  return co.cell_bg
end

-- ── Pencil marks ──────────────────────────────────────────────────────────────

local function draw_pencil(marks, cx, cy, cw, ch, n, font, co)
  if not marks or next(marks) == nil then return end
  local bs   = V.box_size(n)  -- 3 for 9×9, 4 for 16×16
  local slot = cw / bs
  love.graphics.setFont(font)
  sc(co.pencil)
  for v = 1, n do
    if marks[v] then
      local si  = v - 1
      local sx  = cx + (si % bs) * slot
      local sy  = cy + math.floor(si / bs) * slot
      local lbl = (n > 9 and v > 9) and string.char(64 + v) or tostring(v)
      local lw  = font:getWidth(lbl)
      local lh  = font:getHeight()
      love.graphics.print(lbl,
        math.floor(sx + (slot - lw) / 2),
        math.floor(sy + (slot - lh) / 2))
    end
  end
end

-- ── Main draw ─────────────────────────────────────────────────────────────────

function Grid.draw(state, layout, fonts, colors)
  local co  = colors.current
  local n   = state.n
  local L   = layout  -- { x, y, px, cell, box }
  local bs  = L.box

  -- Derive selection context
  local sel_row, sel_col
  local sel_box_br, sel_box_bc  -- box top-left (1-based)
  local sel_val = state:selected_value()
  if state.cursor then
    sel_row, sel_col = state:cursor_pos()
    sel_box_br = math.floor((sel_row - 1) / bs) * bs + 1
    sel_box_bc = math.floor((sel_col - 1) / bs) * bs + 1
  end

  -- ── Cell backgrounds ──────────────────────────────────────────────────────
  for row = 1, n do
    for col = 1, n do
      local idx = (row - 1) * n + col
      local cx  = L.x + (col - 1) * L.cell
      local cy  = L.y + (row - 1) * L.cell

      local is_sel = state.cursor == idx
      local is_err = state.conflicts[idx] == true
      local val    = state:value_at(idx)

      local is_hl, is_sn = false, false
      if sel_row and not is_sel then
        local in_box_r = sel_box_br and row >= sel_box_br and row < sel_box_br + bs
        local in_box_c = sel_box_bc and col >= sel_box_bc and col < sel_box_bc + bs
        is_hl = (row == sel_row or col == sel_col or (in_box_r and in_box_c))
        is_sn = (not is_hl) and sel_val ~= nil and val == sel_val
      end

      sc(cell_bg(co, is_sel, is_hl, is_sn, is_err))
      love.graphics.rectangle("fill", cx, cy, L.cell, L.cell)
    end
  end

  -- ── Grid lines ────────────────────────────────────────────────────────────
  for i = 0, n do
    local is_box = (i % bs == 0)
    local thick  = is_box and 2 or 1
    sc(is_box and co.border_box or co.border_cell)
    -- vertical
    love.graphics.rectangle("fill",
      L.x + i * L.cell - math.floor(thick / 2), L.y, thick, L.px)
    -- horizontal
    love.graphics.rectangle("fill",
      L.x, L.y + i * L.cell - math.floor(thick / 2), L.px, thick)
  end

  -- Outer border (crisp, drawn last)
  sc(co.border_box)
  love.graphics.setLineWidth(2.5)
  love.graphics.rectangle("line", L.x + 1, L.y + 1, L.px - 2, L.px - 2)
  love.graphics.setLineWidth(1)

  -- ── Cell values and pencil marks ──────────────────────────────────────────
  local cell_font   = fonts.cell(n)
  local pencil_font = fonts.pencil(n)

  for row = 1, n do
    for col = 1, n do
      local idx = (row - 1) * n + col
      local cx  = L.x + (col - 1) * L.cell
      local cy  = L.y + (row - 1) * L.cell
      local val = state:value_at(idx)

      if val then
        -- Draw value
        local is_given = state:is_given(idx)
        local is_err   = state.conflicts[idx] == true
        local is_sel   = state.cursor == idx

        if is_err then
          sc(co.cell_err_txt)
        elseif is_given then
          sc(is_sel and co.cell_sel_txt or co.cell_given)
        else
          sc(is_sel and co.cell_sel_txt or co.cell_user)
        end

        love.graphics.setFont(cell_font)
        local lbl = fonts.display(val, n)
        local lw  = cell_font:getWidth(lbl)
        local lh  = cell_font:getHeight()
        love.graphics.print(lbl,
          math.floor(cx + (L.cell - lw) / 2),
          math.floor(cy + (L.cell - lh) / 2))

      elseif state.pencil_marks[idx] then
        draw_pencil(state.pencil_marks[idx], cx, cy, L.cell, L.cell, n, pencil_font, co)
      end
    end
  end
end

return Grid
