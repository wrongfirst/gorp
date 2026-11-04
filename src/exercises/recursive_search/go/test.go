fsys := fstest.MapFS{
	"root.txt":            &fstest.MapFile{Data: []byte("hello root\nkey=val1\n")},
	"sub/sub.txt":         &fstest.MapFile{Data: []byte("hello sub\nkey=val2\n")},
	"sub/nested/deep.txt": &fstest.MapFile{Data: []byte("hello deep\nkey=val3\n")},
}

resKey, errKey := searchDirectory(fsys, ".", "^key=")
Tests.EqualCheck("searchDirectory key no error", nil, errKey)
Tests.EqualCheck("searchDirectory key matches count", 3, len(resKey))
expectedKey := []string{
	"root.txt:key=val1",
	"sub/nested/deep.txt:key=val3",
	"sub/sub.txt:key=val2",
}
Tests.EqualCheck("searchDirectory key matches elements", SortStrings(expectedKey), SortStrings(resKey))

resHello, errHello := searchDirectory(fsys, ".", "hello")
Tests.EqualCheck("searchDirectory hello no error", nil, errHello)
Tests.EqualCheck("searchDirectory hello matches count", 3, len(resHello))
expectedHello := []string{
	"root.txt:hello root",
	"sub/nested/deep.txt:hello deep",
	"sub/sub.txt:hello sub",
}
Tests.EqualCheck("searchDirectory hello matches elements", SortStrings(expectedHello), SortStrings(resHello))

resNone, errNone := searchDirectory(fsys, ".", "nonexistent_string_123")
Tests.EqualCheck("no matches in directory returns empty slice", 0, len(resNone))
Tests.EqualCheck("no matches in directory no error", nil, errNone)

resSubOnly, errSubOnly := searchDirectory(fsys, "sub", "hello")
Tests.EqualCheck("search subdirectory no error", nil, errSubOnly)
Tests.EqualCheck("search subdirectory count", 2, len(resSubOnly))
expectedSub := []string{
	"sub/nested/deep.txt:hello deep",
	"sub/sub.txt:hello sub",
}
Tests.EqualCheck("search subdirectory elements", SortStrings(expectedSub), SortStrings(resSubOnly))

_, errMissing := searchDirectory(fsys, "nonexistent_dir_98765", "test")
Tests.BoolCheck("missing directory returns error", errMissing != nil)

resDigit, errDigit := searchDirectory(fsys, ".", `val\d`)
Tests.EqualCheck("digit pattern search no error", nil, errDigit)
Tests.EqualCheck("digit pattern search count", 3, len(resDigit))
expectedDigit := []string{
	"root.txt:key=val1",
	"sub/nested/deep.txt:key=val3",
	"sub/sub.txt:key=val2",
}
Tests.EqualCheck("digit pattern search elements", SortStrings(expectedDigit), SortStrings(resDigit))

emptyFS := fstest.MapFS{
	"empty_dir": &fstest.MapFile{Mode: fs.ModeDir},
}
resEmptyDir, errEmptyDir := searchDirectory(emptyFS, "empty_dir", "pattern")
Tests.EqualCheck("empty directory returns empty slice", 0, len(resEmptyDir))
Tests.EqualCheck("empty directory no error", nil, errEmptyDir)
