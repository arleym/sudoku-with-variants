-- Isometric cube overlay renderer.
-- Draws N stacked layer-slabs over the grid area (left 600×596px column).
-- Ported from IsometricCube.tsx SVG math to love.graphics polygon calls.

local C = require "src.const"

local Iso = {}

-- Layer accent colours (matches web app)
local LAYER_COL = {
  {0.29, 0.56, 0.85}, {0.36, 0.66, 0.36}, {0.88, 0.48, 0.22}, {0.61, 0.35, 0.71},
  {0.91, 0.30, 0.24}, {0.10, 0.74, 0.61}, {0.95, 0.61, 0.07}, {0.56, 0.27, 0.68},
  {0.16, 0.50, 0.73},
}

local function lc(layer)
  local c = LAYER_COL[(layer % #LAYER_COL) + 1]
  return c[1], c[2], c[3]
end

local function sc(r, g, b, a)
  love.graphics.setColor(r, g, b, a or 1)
end

-- ── Isometric parameters ──────────────────────────────────────────────────────

local function iso_params(n, depth, panel_w, panel_h)
  -- IX = half the slab width / N; choose so the cube fills ~75% of panel width
  local target_w = panel_w * 0.72
  local IX = math.floor(target_w / (2 * n))
  IX = math.max(8, math.min(IX, 55))
  local IY  = math.floor(IX / 2)
  local JX  = -IX
  local JY  = IY

  -- Layer step: spread layers so they're distinct but fit vertically
  local slab_h    = n * IY * 2   -- approx height of one slab
  local available = panel_h - slab_h - 40
  local step_y    = math.max(10, math.floor(available / depth))
  local max_step  = depth <= 4 and 52 or depth <= 9 and 28 or 16
  step_y          = math.min(step_y, max_step)

  local total_h = 20 + depth * step_y + n * IY
  local ox = math.floor(panel_w / 2)
  local oy = math.floor((panel_h - total_h) / 2) + 20

  return { IX=IX, IY=IY, JX=JX, JY=JY, step_y=step_y, ox=ox, oy=oy }
end

-- Origin of a specific layer in panel-local coords
local function layer_origin(layer, p)
  return p.ox, p.oy + layer * p.step_y
end

-- 4 corners of a slab in screen coords (panel-local)
local function slab_corners(layer, n, p)
  local ox, oy = layer_origin(layer, p)
  return {
    ox,                           oy,
    ox + n * p.IX,                oy + n * p.IY,
    ox + n * p.IX + n * p.JX,    oy + n * p.IY + n * p.JY,
    ox + n * p.JX,                oy + n * p.JY,
  }
end

-- 4 corners of a single cell on a slab
local function cell_corners(layer, row, col, p)
  local ox, oy = layer_origin(layer, p)
  local tlx = ox + col * p.IX + row * p.JX
  local tly = oy + col * p.IY + row * p.JY
  return {
    tlx,            tly,
    tlx + p.IX,     tly + p.IY,
    tlx + p.IX + p.JX, tly + p.IY + p.JY,
    tlx + p.JX,     tly + p.JY,
  }
end

-- Centre of a slab in panel-local coords (for label)
local function slab_centre(layer, n, p)
  local ox, oy = layer_origin(layer, p)
  local half = (n - 1) / 2
  local cx = ox + half * p.IX + half * p.JX + (p.IX + p.JX) / 2
  local cy = oy + half * p.IY + half * p.JY + (p.IY + p.JY) / 2
  return cx, cy
end

-- ── Draw ─────────────────────────────────────────────────────────────────────

function Iso.draw(state3d, fonts, colors)
  local co    = colors.current
  local n     = state3d.n
  local depth = state3d.puzzle.depth
  local ls    = n * n

  -- Panel bounds (screen coords)
  local px = 0
  local py = C.TOPBAR_H
  local pw = C.SIDEBAR_X  -- 600
  local ph = C.GRID_AREA_H

  -- Semi-transparent panel background
  sc(co.topbar_bg[1], co.topbar_bg[2], co.topbar_bg[3], 0.96)
  love.graphics.rectangle("fill", px, py, pw, ph)
  sc(co.border_box[1], co.border_box[2], co.border_box[3])
  love.graphics.rectangle("line", px, py, pw, ph)

  local p  = iso_params(n, depth, pw, ph)
  local al = state3d.active_layer

  -- Draw layers bottom-to-top so upper layers paint over lower
  for di = depth - 1, 0, -1 do
    local r, g, b = lc(di)
    local is_active = (di == al)
    local alpha = is_active and 1.0 or 0.45

    local corners = slab_corners(di, n, p)

    -- Slab fill
    sc(r, g, b, is_active and 0.18 or 0.06)
    love.graphics.polygon("fill", corners)

    -- Filled cell dots
    local lo = di * ls
    for i = 0, ls - 1 do
      local flat3 = lo + i + 1
      local val   = state3d.puzzle.cells[flat3] or state3d.user_values[flat3]
      if val then
        local row_i = math.floor(i / n)
        local col_i = i % n
        local cc = cell_corners(di, row_i, col_i, p)
        sc(r, g, b, is_active and 0.7 or 0.3)
        love.graphics.polygon("fill", cc)
      end
    end

    -- Grid lines
    local ox, oy = layer_origin(di, p)
    local bs = math.floor(math.sqrt(n) + 0.5)
    love.graphics.setLineWidth(1)
    for i = 0, n do
      local is_box = (i % bs == 0)
      sc(r, g, b, is_active and (is_box and 0.7 or 0.35) or 0.2)
      love.graphics.setLineWidth(is_box and 1.5 or 0.8)
      -- row direction lines
      love.graphics.line(
        ox + i * p.JX,              oy + i * p.JY,
        ox + i * p.JX + n * p.IX,   oy + i * p.JY + n * p.IY)
      -- col direction lines
      love.graphics.line(
        ox + i * p.IX,              oy + i * p.IY,
        ox + i * p.IX + n * p.JX,   oy + i * p.IY + n * p.JY)
    end
    love.graphics.setLineWidth(1)

    -- Slab outline
    sc(r, g, b, alpha)
    love.graphics.setLineWidth(is_active and 2 or 1)
    love.graphics.polygon("line", corners)
    love.graphics.setLineWidth(1)

    -- Layer label
    local cx, cy = slab_centre(di, n, p)
    love.graphics.setFont(fonts.sm)
    sc(r, g, b, alpha)
    local lbl = "L" .. (di + 1)
    local lw  = fonts.sm:getWidth(lbl)
    local lh  = fonts.sm:getHeight()
    love.graphics.print(lbl,
      math.floor(px + cx - lw / 2),
      math.floor(py + cy - lh / 2))
  end

  -- Active layer indicator text at bottom of panel
  love.graphics.setFont(fonts.sm)
  sc(co.topbar_text[1], co.topbar_text[2], co.topbar_text[3])
  local hint = "Layer " .. (al + 1) .. " / " .. depth .. "   L1 ▲   R1 ▼"
  local hw   = fonts.sm:getWidth(hint)
  love.graphics.print(hint, px + math.floor((pw - hw) / 2), py + ph - 22)
end

return Iso
