line1, ok1 := grepLine("ERROR: disk space low", "ERROR")
Tests.EqualCheck("matching line returns line content", "ERROR: disk space low", line1)
Tests.EqualCheck("matching line returns true", true, ok1)

line2, ok2 := grepLine("INFO: everything okay", "ERROR")
Tests.EqualCheck("non-matching line returns empty string", "", line2)
Tests.EqualCheck("non-matching line returns false", false, ok2)

line3, ok3 := grepLine("user_42 connected", `\d+`)
Tests.EqualCheck("regex match returns line content", "user_42 connected", line3)
Tests.EqualCheck("regex match returns true", true, ok3)

line4, ok4 := grepLine("user connected", `\d+`)
Tests.EqualCheck("regex non-match returns empty string", "", line4)
Tests.EqualCheck("regex non-match returns false", false, ok4)

line5, ok5 := grepLine("apple pie", "^apple")
Tests.EqualCheck("start anchor match returns line", "apple pie", line5)
Tests.EqualCheck("start anchor match returns true", true, ok5)

line6, ok6 := grepLine("good apple pie", "^apple")
Tests.EqualCheck("start anchor non-match returns empty string", "", line6)
Tests.EqualCheck("start anchor non-match returns false", false, ok6)

line7, ok7 := grepLine("banana", "a$")
Tests.EqualCheck("end anchor match returns line", "banana", line7)
Tests.EqualCheck("end anchor match returns true", true, ok7)

line8, ok8 := grepLine("any text here", "")
Tests.EqualCheck("empty pattern matches any line and returns it", "any text here", line8)
Tests.EqualCheck("empty pattern returns true", true, ok8)
