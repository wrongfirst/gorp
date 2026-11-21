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

// Test 9: Long flags --line-number and --invert-match with --color=never
in9 := strings.NewReader("alpha\nbeta\ngamma\n")
out.Reset()
code9 := RunCLI(in9, &out, []string{"--line-number", "--invert-match", "--color=never", "beta"}, true, false)
Tests.EqualCheck("long flags code", 0, code9)
Tests.EqualCheck("long flags stdout", "1:alpha\n3:gamma\n", out.String())

// Test 10: Bare --color enables color even when not a TTY
in10 := strings.NewReader("warn: disk\n")
out.Reset()
code10 := RunCLI(in10, &out, []string{"--color", "warn"}, false, true)
Tests.EqualCheck("bare --color code", 0, code10)
Tests.EqualCheck("bare --color stdout", ColorRed+"warn"+ColorReset+": disk\n", out.String())

// Test 11: Color auto with NO_COLOR disables highlighting
in11 := strings.NewReader("error occurred\n")
out.Reset()
code11 := RunCLI(in11, &out, []string{"--color=auto", "error"}, true, true)
Tests.EqualCheck("color auto NO_COLOR code", 0, code11)
Tests.EqualCheck("color auto NO_COLOR stdout", "error occurred\n", out.String())

// Test 12: No matching lines returns 1
in12 := strings.NewReader("hello\nworld\n")
out.Reset()
code12 := RunCLI(in12, &out, []string{"missing"}, false, false)
Tests.EqualCheck("no match returns 1", 1, code12)
Tests.EqualCheck("no match stdout", "", out.String())

// Test 13: Invalid --color value returns 2
in13 := strings.NewReader("hello\n")
out.Reset()
code13 := RunCLI(in13, &out, []string{"--color=rainbow", "hello"}, false, false)
Tests.EqualCheck("invalid --color value returns 2", 2, code13)

// Test 14: Empty pattern returns 2
in14 := strings.NewReader("hello\n")
out.Reset()
code14 := RunCLI(in14, &out, []string{""}, false, false)
Tests.EqualCheck("empty pattern returns 2", 2, code14)

// Test 15: Unrecognized flag returns 2
in15 := strings.NewReader("hello\n")
out.Reset()
code15 := RunCLI(in15, &out, []string{"-z", "hello"}, false, false)
Tests.EqualCheck("unrecognized flag returns 2", 2, code15)

// Test 16: Extra positional argument returns 2
in16 := strings.NewReader("hello\n")
out.Reset()
code16 := RunCLI(in16, &out, []string{"hello", "extra"}, false, false)
Tests.EqualCheck("extra positional arg returns 2", 2, code16)

// Test 17: Grouped alternation with color highlighting
in17 := strings.NewReader("level: err and warn\n")
out.Reset()
code17 := RunCLI(in17, &out, []string{"--color=always", `(err|warn)`}, false, false)
Tests.EqualCheck("grouped alternation color code", 0, code17)
Tests.EqualCheck("grouped alternation color stdout", "level: "+ColorRed+"err"+ColorReset+" and "+ColorRed+"warn"+ColorReset+"\n", out.String())
