-- Color themes. All values are LÖVE-format: {r, g, b} in 0-1 range.
-- Ported from globals.css in the web project.

local function hex(h)
  h = h:gsub("^#", "")
  if #h == 3 then
    h = h:sub(1,1):rep(2) .. h:sub(2,2):rep(2) .. h:sub(3,3):rep(2)
  end
  local r = tonumber(h:sub(1,2), 16) / 255
  local g = tonumber(h:sub(3,4), 16) / 255
  local b = tonumber(h:sub(5,6), 16) / 255
  return {r, g, b}
end

local themes = {}

themes.dark = {
  bg           = hex "#1a1a1a",
  topbar_bg    = hex "#222222",
  topbar_text  = hex "#aaaaaa",
  accent       = hex "#5a9ee6",
  grid_bg      = hex "#2a2a2a",
  border_box   = hex "#888888",
  border_cell  = hex "#3e3e3e",
  cell_bg      = hex "#2e2e2e",
  cell_given   = hex "#e8e8e8",
  cell_user    = hex "#5a9ee6",
  cell_sel_bg  = hex "#1e3a5f",
  cell_sel_txt = hex "#90caf9",
  cell_hl_bg   = hex "#1e3040",
  cell_sn_bg   = hex "#2a3d25",
  cell_sn_txt  = hex "#7ec87e",
  cell_err_bg  = hex "#4a1a1a",
  cell_err_txt = hex "#e57373",
  pencil       = hex "#778899",
  picker_bg    = hex "#222222",
  picker_cell  = hex "#333333",
  picker_txt   = hex "#cccccc",
  picker_cur   = hex "#1e3a5f",
  picker_cur_txt = hex "#90caf9",
  picker_border  = hex "#444444",
  label_dim    = hex "#555555",
  label_txt    = hex "#888888",
}

themes.nord = {
  bg           = hex "#2e3440",
  topbar_bg    = hex "#3b4252",
  topbar_text  = hex "#81a1c1",
  accent       = hex "#88c0d0",
  grid_bg      = hex "#3b4252",
  border_box   = hex "#81a1c1",
  border_cell  = hex "#4c566a",
  cell_bg      = hex "#434c5e",
  cell_given   = hex "#eceff4",
  cell_user    = hex "#88c0d0",
  cell_sel_bg  = hex "#5e81ac",
  cell_sel_txt = hex "#eceff4",
  cell_hl_bg   = hex "#4c566a",
  cell_sn_bg   = hex "#3d4f3d",
  cell_sn_txt  = hex "#a3be8c",
  cell_err_bg  = hex "#4c3030",
  cell_err_txt = hex "#bf616a",
  pencil       = hex "#81a1c1",
  picker_bg    = hex "#3b4252",
  picker_cell  = hex "#434c5e",
  picker_txt   = hex "#d8dee9",
  picker_cur   = hex "#5e81ac",
  picker_cur_txt = hex "#eceff4",
  picker_border  = hex "#4c566a",
  label_dim    = hex "#4c566a",
  label_txt    = hex "#81a1c1",
}

themes.autumn = {
  bg           = hex "#1c1410",
  topbar_bg    = hex "#241a12",
  topbar_text  = hex "#a89480",
  accent       = hex "#c87533",
  grid_bg      = hex "#2a1f18",
  border_box   = hex "#7a6050",
  border_cell  = hex "#4a3828",
  cell_bg      = hex "#332820",
  cell_given   = hex "#f5ebe0",
  cell_user    = hex "#e8a060",
  cell_sel_bg  = hex "#5a3820",
  cell_sel_txt = hex "#f5d0a0",
  cell_hl_bg   = hex "#3a2e22",
  cell_sn_bg   = hex "#2a3018",
  cell_sn_txt  = hex "#8aaa50",
  cell_err_bg  = hex "#4a1a1a",
  cell_err_txt = hex "#e07070",
  pencil       = hex "#a89480",
  picker_bg    = hex "#241a12",
  picker_cell  = hex "#3a2e22",
  picker_txt   = hex "#e8ddd0",
  picker_cur   = hex "#5a3820",
  picker_cur_txt = hex "#f5d0a0",
  picker_border  = hex "#5a4838",
  label_dim    = hex "#4a3828",
  label_txt    = hex "#a89480",
}

-- Active theme (set at startup, changeable from settings)
local Colors = {}
Colors.themes = themes
Colors.current = themes.dark

function Colors.set(name)
  Colors.current = themes[name] or themes.dark
end

-- Shorthand: Colors.c.bg etc.
setmetatable(Colors, {
  __index = function(_, k) return Colors.current[k] end
})

return Colors
