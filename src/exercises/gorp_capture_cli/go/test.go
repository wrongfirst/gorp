var out bytes.Buffer

// Test 1: Missing pattern returns 2
in1 := strings.NewReader("some text\n")
out.Reset()
code1 := RunCLI(in1, &out, []string{"-o"})
Tests.EqualCheck("missing pattern with -o", 2, code1)

// Test 2: Standard matching without -o
in2 := strings.NewReader("user@example.com is valid\nno email here\nadmin@test.com\n")
out.Reset()
code2 := RunCLI(in2, &out, []string{`\w+@\w+\.com`})
Tests.EqualCheck("standard match exit code", 0, code2)
Tests.EqualCheck("standard match stdout", "user@example.com is valid\nadmin@test.com\n", out.String())

// Test 3: Match-only with -o
in3 := strings.NewReader("contact alice@work.com and bob@work.com for details\nno email here\n")
out.Reset()
code3 := RunCLI(in3, &out, []string{"-o", `\w+@\w+\.com`})
Tests.EqualCheck("match-only exit code", 0, code3)
Tests.EqualCheck("match-only extracted lines", "alice@work.com\nbob@work.com\n", out.String())

// Test 4: --only-matching after pattern
in4 := strings.NewReader("item 100 and item 200\n")
out.Reset()
code4 := RunCLI(in4, &out, []string{`\d+`, "--only-matching"})
Tests.EqualCheck("only-matching after pattern code", 0, code4)
Tests.EqualCheck("only-matching after pattern stdout", "100\n200\n", out.String())

// Test 5: Backreferences with -o
in5 := strings.NewReader("cat cat\ndog cat\napple apple\n")
out.Reset()
code5 := RunCLI(in5, &out, []string{"-o", `([a-z]+) \1`})
Tests.EqualCheck("backref match code", 0, code5)
Tests.EqualCheck("backref match stdout", "cat cat\napple apple\n", out.String())

// Test 6: No matches returns 1
in6 := strings.NewReader("nothing matches\n")
out.Reset()
code6 := RunCLI(in6, &out, []string{"-o", `\d+`})
Tests.EqualCheck("no match code", 1, code6)
Tests.EqualCheck("no match stdout", "", out.String())
