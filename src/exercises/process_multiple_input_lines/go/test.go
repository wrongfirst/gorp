input1 := "INFO: system ready\nERROR: disk full\nDEBUG: trace\nERROR: timeout"
res1 := processInput(input1, "ERROR")
Tests.EqualCheck("multiline input matches", []string{"ERROR: disk full", "ERROR: timeout"}, res1)

input2 := "100\n200\nabc\n300\n"
res2 := processInput(input2, `^\d+$`)
Tests.EqualCheck("digit lines with trailing newline", []string{"100", "200", "300"}, res2)

input3 := "line 1\r\nline 2\r\nline 3"
res3 := processInput(input3, "line")
Tests.EqualCheck("CRLF input matches stripped", []string{"line 1", "line 2", "line 3"}, res3)

res4 := processInput("", "ERROR")
Tests.EqualCheck("empty input returns empty slice", []string{}, res4)

input5 := "apple\nbanana\ncherry"
res5 := processInput(input5, "orange")
Tests.EqualCheck("no matching lines returns empty slice", []string{}, res5)

input6 := "cat and cat\ncat and dog\ndog and dog"
res6 := processInput(input6, `^(\w+) and \1$`)
Tests.EqualCheck("backreference line filter matches", []string{"cat and cat", "dog and dog"}, res6)

readerRes, readerErr := processReader(strings.NewReader(input1), "ERROR")
Tests.EqualCheck("processReader no error", nil, readerErr)
Tests.EqualCheck("processReader matching lines", []string{"ERROR: disk full", "ERROR: timeout"}, readerRes)

emptyReaderRes, emptyReaderErr := processReader(strings.NewReader(""), "ERROR")
Tests.EqualCheck("processReader empty reader no error", nil, emptyReaderErr)
Tests.EqualCheck("processReader empty reader returns 0 lines", []string{}, emptyReaderRes)

crlfReaderRes, crlfReaderErr := processReader(strings.NewReader("item 1\r\nitem 2\r\n"), "item")
Tests.EqualCheck("processReader CRLF no error", nil, crlfReaderErr)
Tests.EqualCheck("processReader CRLF matching lines", []string{"item 1", "item 2"}, crlfReaderRes)
