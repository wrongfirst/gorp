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

// Test 6: Unrecognized flag returns 2
in6 := strings.NewReader("some text\n")
out.Reset()
code6 := RunCLI(in6, &out, []string{"-z"})
Tests.EqualCheck("unrecognized flag exit code", 2, code6)

// Test 7: Extra positional argument returns 2
in7 := strings.NewReader("some text\n")
out.Reset()
code7 := RunCLI(in7, &out, []string{"foo", "bar"})
Tests.EqualCheck("extra positional arg exit code", 2, code7)

// Test 8: Multiple character ranges and escaped dot
in8 := strings.NewReader("v1.0\nv1x0\n99\n")
out.Reset()
code8 := RunCLI(in8, &out, []string{`^[a-z0-9]+\.[0-9]+$`})
Tests.EqualCheck("range and escaped dot exit code", 0, code8)
Tests.EqualCheck("range and escaped dot stdout", "v1.0\n", out.String())
