-- Global settings. Persisted to love.filesystem between sessions.

local S = {}

S.color_mode         = "dark"   -- "dark" | "nord" | "autumn"
S.show_errors        = true
S.highlight_related  = true     -- row / col / box of selected cell
S.highlight_same_num = true     -- cells with same value as selected
S.pencil_auto_clean  = true     -- remove pencil marks when value placed
S.show_timer         = true     -- show elapsed time in top bar

local FILE = "settings.txt"

function S.save()
  local lines = {
    "color_mode="         .. S.color_mode,
    "show_errors="        .. tostring(S.show_errors),
    "highlight_related="  .. tostring(S.highlight_related),
    "highlight_same_num=" .. tostring(S.highlight_same_num),
    "pencil_auto_clean="  .. tostring(S.pencil_auto_clean),
    "show_timer="         .. tostring(S.show_timer),
  }
  love.filesystem.write(FILE, table.concat(lines, "\n"))
end

function S.load()
  if not love.filesystem.getInfo(FILE) then return end
  local ok, content = pcall(love.filesystem.read, FILE)
  if not ok then return end
  for line in content:gmatch("[^\n]+") do
    local k, v = line:match("^([%w_]+)=(.+)$")
    if k and S[k] ~= nil and type(S[k]) ~= "function" then
      if v == "true" then S[k] = true
      elseif v == "false" then S[k] = false
      else S[k] = v end
    end
  end
end

function S.toggle(key)
  if type(S[key]) == "boolean" then
    S[key] = not S[key]
    S.save()
  end
end

function S.cycle(key, options)
  for i, v in ipairs(options) do
    if S[key] == v then
      S[key] = options[(i % #options) + 1]
      S.save()
      return
    end
  end
  S[key] = options[1]
  S.save()
end

return S
