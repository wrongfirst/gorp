res1 := grepLines([]string{"INFO: ok", "ERROR: fail", "DEBUG: trace", "ERROR: crash"}, "ERROR")
Tests.EqualCheck("filters multiple matching lines", []string{"ERROR: fail", "ERROR: crash"}, res1)

res2 := grepLines([]string{"apple", "banana", "cherry"}, "orange")
Tests.EqualCheck("no matches returns empty slice", []string{}, res2)

res3 := grepLines([]string{"123", "abc", "456", "def", "789"}, `^\d+$`)
Tests.EqualCheck("regex anchored matching lines", []string{"123", "456", "789"}, res3)

res4 := grepLines([]string{}, "apple")
Tests.EqualCheck("empty input lines returns empty slice", []string{}, res4)

res5 := grepLines([]string{"first", "second", "third"}, "")
Tests.EqualCheck("empty pattern returns all lines", []string{"first", "second", "third"}, res5)

res6 := grepLines([]string{"cat and cat", "cat and dog", "dog and dog"}, `^(\w+) and \1$`)
Tests.EqualCheck("backreference filter matching lines", []string{"cat and cat", "dog and dog"}, res6)
