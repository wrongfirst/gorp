lines1 := []string{"cat and dog", "bird only", "another cat"}
res1 := highlightLines(lines1, "cat")
Tests.EqualCheck("filters and highlights matching lines", []string{"\033[31mcat\033[0m and dog", "another \033[31mcat\033[0m"}, res1)

lines2 := []string{"user 100", "admin", "guest 200"}
res2 := highlightLines(lines2, `\d+`)
Tests.EqualCheck("digit lines highlighted", []string{"user \033[31m100\033[0m", "guest \033[31m200\033[0m"}, res2)

lines3 := []string{"apple", "banana"}
res3 := highlightLines(lines3, "cherry")
Tests.EqualCheck("no matching lines returns empty slice", []string{}, res3)

res4 := highlightLines([]string{}, "cat")
Tests.EqualCheck("empty input lines returns empty slice", []string{}, res4)

lines5 := []string{"first", "second", "third"}
res5 := highlightLines(lines5, "")
Tests.EqualCheck("empty pattern preserves all lines without highlight", []string{"first", "second", "third"}, res5)

lines6 := []string{"apple and apple", "banana", "cherry and apple"}
res6 := highlightLines(lines6, "apple")
Tests.EqualCheck("multiple highlights on matching lines", []string{"\033[31mapple\033[0m and \033[31mapple\033[0m", "cherry and \033[31mapple\033[0m"}, res6)

lines7 := []string{"start one", "not start", "start two"}
res7 := highlightLines(lines7, "^start")
Tests.EqualCheck("start anchor matching lines", []string{"\033[31mstart\033[0m one", "\033[31mstart\033[0m two"}, res7)
