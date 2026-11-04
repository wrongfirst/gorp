l1, ok1 := formatLine("disk error found", "error", ColorAlways)
Tests.EqualCheck("ColorAlways highlights match", "disk \033[31merror\033[0m found", l1)
Tests.EqualCheck("ColorAlways returns true on match", true, ok1)

l2, ok2 := formatLine("disk error found", "error", ColorNever)
Tests.EqualCheck("ColorNever keeps plain text on match", "disk error found", l2)
Tests.EqualCheck("ColorNever returns true on match", true, ok2)

l3, ok3 := formatLine("disk okay", "error", ColorAlways)
Tests.EqualCheck("non-matching line in ColorAlways returns empty", "", l3)
Tests.EqualCheck("non-matching line in ColorAlways returns false", false, ok3)

l4, ok4 := formatLine("disk okay", "error", ColorNever)
Tests.EqualCheck("non-matching line in ColorNever returns empty", "", l4)
Tests.EqualCheck("non-matching line in ColorNever returns false", false, ok4)

lines := []string{"apple pie", "banana bread", "apple tart"}
resAlways := formatLines(lines, "apple", ColorAlways)
Tests.EqualCheck("formatLines ColorAlways lines", []string{"\033[31mapple\033[0m pie", "\033[31mapple\033[0m tart"}, resAlways)

resNever := formatLines(lines, "apple", ColorNever)
Tests.EqualCheck("formatLines ColorNever lines plain text", []string{"apple pie", "apple tart"}, resNever)

resEmpty := formatLines([]string{}, "apple", ColorAlways)
Tests.EqualCheck("formatLines empty input returns empty slice", []string{}, resEmpty)

resNoMatch := formatLines(lines, "cherry", ColorNever)
Tests.EqualCheck("formatLines no matches returns empty slice", []string{}, resNoMatch)
