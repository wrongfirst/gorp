var out bytes.Buffer

// Test 1: Missing pattern returns 2
in1 := strings.NewReader("some text\n")
out.Reset()
code1 := RunCLI(in1, &out, []string{"-n"}, false, false)
Tests.EqualCheck("missing pattern returns 2", 2, code1)

// Test 2: Line numbers with -n
in2 := strings.NewReader("first line\nsecond match line\nthird line\nfourth match line\n")
out.Reset()
code2 := RunCLI(in2, &out, []string{"-n", "match"}, false, false)
Tests.EqualCheck("line numbers match code", 0, code2)
Tests.EqualCheck("line numbers stdout", "2:second match line\n4:fourth match line\n", out.String())

// Test 3: Invert match with -v
in3 := strings.NewReader("apple\nbanana\napricot\n")
out.Reset()
code3 := RunCLI(in3, &out, []string{"-v", "^ap"}, false, false)
Tests.EqualCheck("invert match code", 0, code3)
Tests.EqualCheck("invert match stdout", "banana\n", out.String())

// Test 4: Line numbers + Invert match (-n, -v)
in4 := strings.NewReader("apple\nbanana\napricot\n")
out.Reset()
code4 := RunCLI(in4, &out, []string{"-n", "-v", "^ap"}, false, false)
Tests.EqualCheck("line numbers + invert code", 0, code4)
Tests.EqualCheck("line numbers + invert stdout", "2:banana\n", out.String())

// Test 5: Color always with --color=always
in5 := strings.NewReader("error occurred\nnormal\n")
out.Reset()
code5 := RunCLI(in5, &out, []string{"--color=always", "error"}, false, true)
Tests.EqualCheck("color always code", 0, code5)
Tests.EqualCheck("color always stdout", ColorRed+"error"+ColorReset+" occurred\n", out.String())

// Test 6: Color auto when not a TTY
in6 := strings.NewReader("error occurred\n")
out.Reset()
code6 := RunCLI(in6, &out, []string{"--color=auto", "error"}, false, false)
Tests.EqualCheck("color auto no-tty code", 0, code6)
Tests.EqualCheck("color auto no-tty stdout", "error occurred\n", out.String())

// Test 7: Color auto when is a TTY
in7 := strings.NewReader("error occurred\n")
out.Reset()
code7 := RunCLI(in7, &out, []string{"--color=auto", "error"}, true, false)
Tests.EqualCheck("color auto is-tty code", 0, code7)
Tests.EqualCheck("color auto is-tty stdout", ColorRed+"error"+ColorReset+" occurred\n", out.String())

// Test 8: Invert match does not colorize
in8 := strings.NewReader("hello\nworld\n")
out.Reset()
code8 := RunCLI(in8, &out, []string{"-v", "--color=always", "foo"}, true, false)
Tests.EqualCheck("invert no color code", 0, code8)
Tests.EqualCheck("invert no color stdout", "hello\nworld\n", out.String())
