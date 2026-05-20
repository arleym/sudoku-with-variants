function love.conf(t)
  t.window.title     = "Morrison Sudoku"
  t.window.width     = 720
  t.window.height    = 720
  t.window.resizable = false
  t.window.vsync     = 1

  -- Disable unused modules to save memory on ARM
  t.modules.audio   = false
  t.modules.sound   = false
  t.modules.physics = false
  t.modules.video   = false
  t.modules.touch   = false
  t.modules.thread  = false
  t.modules.net     = false

  t.modules.joystick = true  -- required for gamepad input

  t.version = "11.4"
  t.console = false
end
