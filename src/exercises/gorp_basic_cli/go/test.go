var out bytes.Buffer

// Test 1: Empty args returns 2
in1 := strings.NewReader("some text\n")
out.Reset()
code1 := RunCLI(in1, &out, []string{})
Tests.EqualCheck("empty args exit code", 2, code1)

// Test 2: Empty pattern returns 2
in2 := strings.NewReader("some text\n")
out.Reset()
code2 := RunCLI(in2, &out, []string{""})
Tests.EqualCheck("empty pattern exit code", 2, code2)

// Test 3: Matching lines with anchor
in3 := strings.NewReader("apple\nbanana\napricot\ncherry\n")
out.Reset()
code3 := RunCLI(in3, &out, []string{"^ap"})
Tests.EqualCheck("matching exit code", 0, code3)
Tests.EqualCheck("matching stdout", "apple\napricot\n", out.String())

// Test 4: No matching lines returns 1
in4 := strings.NewReader("banana\ncherry\n")
out.Reset()
code4 := RunCLI(in4, &out, []string{"^ap"})
Tests.EqualCheck("no match exit code", 1, code4)
Tests.EqualCheck("no match empty stdout", "", out.String())

// Test 5: Character class and quantifier
in5 := strings.NewReader("cat 123\ndog abc\npig 456\n")
out.Reset()
code5 := RunCLI(in5, &out, []string{`\d+`})
Tests.EqualCheck("digit match exit code", 0, code5)
Tests.EqualCheck("digit match stdout", "cat 123\npig 456\n", out.String())
