mockFS := fstest.MapFS{
	"single.txt":   &fstest.MapFile{Data: []byte("first hello\nsecond line\nthird hello\n")},
	"other.txt":    &fstest.MapFile{Data: []byte("other world\nfourth hello\n")},
	"dir/sub1.txt": &fstest.MapFile{Data: []byte("nested hello\n")},
	"dir/sub2.txt": &fstest.MapFile{Data: []byte("no match\n")},
}

var out bytes.Buffer

// Test 1: Missing pattern returns 2
out.Reset()
code1 := RunCLI(mockFS, &out, []string{})
Tests.EqualCheck("missing args exit code", 2, code1)

// Test 2: Directory without -r returns 2
out.Reset()
code2 := RunCLI(mockFS, &out, []string{"hello", "dir"})
Tests.EqualCheck("dir without -r returns 2", 2, code2)

// Test 3: Single file search (no path prefix)
out.Reset()
code3 := RunCLI(mockFS, &out, []string{"hello", "single.txt"})
Tests.EqualCheck("single file search code", 0, code3)
Tests.EqualCheck("single file stdout", "first hello\nthird hello\n", out.String())

// Test 4: Single file with line number (-n)
out.Reset()
code4 := RunCLI(mockFS, &out, []string{"-n", "hello", "single.txt"})
Tests.EqualCheck("single file with line number code", 0, code4)
Tests.EqualCheck("single file with line number stdout", "1:first hello\n3:third hello\n", out.String())

// Test 5: Multiple files with line numbers
out.Reset()
code5 := RunCLI(mockFS, &out, []string{"-n", "hello", "single.txt", "other.txt"})
Tests.EqualCheck("multiple files code", 0, code5)
Tests.EqualCheck("multiple files stdout", "single.txt:1:first hello\nsingle.txt:3:third hello\nother.txt:2:fourth hello\n", out.String())

// Test 6: Recursive directory search (-r, -n)
out.Reset()
code6 := RunCLI(mockFS, &out, []string{"-r", "-n", "hello", "dir"})
Tests.EqualCheck("recursive search code", 0, code6)
Tests.EqualCheck("recursive search stdout", "dir/sub1.txt:1:nested hello\n", out.String())

// Test 7: Nonexistent file returns 2
out.Reset()
code7 := RunCLI(mockFS, &out, []string{"hello", "nonexistent.txt"})
Tests.EqualCheck("nonexistent file code", 2, code7)

// Test 8: No match returns 1
out.Reset()
code8 := RunCLI(mockFS, &out, []string{"zebra", "single.txt"})
Tests.EqualCheck("no match code", 1, code8)
Tests.EqualCheck("no match stdout", "", out.String())

// Test 9: -R, --line-number, and -v / --invert-match
out.Reset()
code9 := RunCLI(mockFS, &out, []string{"-R", "--line-number", "-v", "hello", "dir"})
Tests.EqualCheck("-R --line-number -v code", 0, code9)
Tests.EqualCheck("-R --line-number -v stdout", "dir/sub2.txt:1:no match\n", out.String())

// Test 10: --recursive and --invert-match on single file includes path prefix
out.Reset()
code10 := RunCLI(mockFS, &out, []string{"--recursive", "--invert-match", "hello", "single.txt"})
Tests.EqualCheck("--recursive single file code", 0, code10)
Tests.EqualCheck("--recursive single file stdout", "single.txt:second line\n", out.String())

// Test 11: Empty pattern with target file returns 2
out.Reset()
code11 := RunCLI(mockFS, &out, []string{"", "single.txt"})
Tests.EqualCheck("empty pattern returns 2", 2, code11)

// Test 12: Unrecognized flag returns 2
out.Reset()
code12 := RunCLI(mockFS, &out, []string{"-z", "hello", "single.txt"})
Tests.EqualCheck("unrecognized flag returns 2", 2, code12)

// Test 13: Multi-target error writes no partial stdout
out.Reset()
code13 := RunCLI(mockFS, &out, []string{"hello", "single.txt", "missing.txt"})
Tests.EqualCheck("multi-target error code", 2, code13)
Tests.EqualCheck("multi-target error no partial stdout", "", out.String())

// Test 14: Grouped alternation
out.Reset()
code14 := RunCLI(mockFS, &out, []string{`(first|third) hello`, "single.txt"})
Tests.EqualCheck("grouped alternation code", 0, code14)
Tests.EqualCheck("grouped alternation stdout", "first hello\nthird hello\n", out.String())
