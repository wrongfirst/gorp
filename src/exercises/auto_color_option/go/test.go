Tests.EqualCheck("ShouldColor ColorAuto with TTY and no NO_COLOR", true, ShouldColor(ColorAuto, true, false))
Tests.EqualCheck("ShouldColor ColorAuto piped (no TTY)", false, ShouldColor(ColorAuto, false, false))
Tests.EqualCheck("ShouldColor ColorAuto with NO_COLOR set", false, ShouldColor(ColorAuto, true, true))
Tests.EqualCheck("ShouldColor ColorAlways with TTY", true, ShouldColor(ColorAlways, true, false))
Tests.EqualCheck("ShouldColor ColorAlways piped (no TTY)", true, ShouldColor(ColorAlways, false, false))
Tests.EqualCheck("ShouldColor ColorAlways with NO_COLOR", true, ShouldColor(ColorAlways, true, true))
Tests.EqualCheck("ShouldColor ColorNever with TTY", false, ShouldColor(ColorNever, true, false))
Tests.EqualCheck("ShouldColor ColorNever piped", false, ShouldColor(ColorNever, false, false))
Tests.EqualCheck("ShouldColor invalid option defaults to false", false, ShouldColor(ColorOption("unknown"), true, false))

lines := []string{"connection error", "system ok", "network error"}
resAutoTTY := FormatWithColorOption(lines, "error", ColorAuto, true, false)
Tests.EqualCheck("FormatWithColorOption Auto TTY highlighted lines", []string{"connection \033[31merror\033[0m", "network \033[31merror\033[0m"}, resAutoTTY)

resAutoPiped := FormatWithColorOption(lines, "error", ColorAuto, false, false)
Tests.EqualCheck("FormatWithColorOption Auto piped plain text lines", []string{"connection error", "network error"}, resAutoPiped)

resAutoNoColor := FormatWithColorOption(lines, "error", ColorAuto, true, true)
Tests.EqualCheck("FormatWithColorOption Auto NO_COLOR plain text lines", []string{"connection error", "network error"}, resAutoNoColor)
