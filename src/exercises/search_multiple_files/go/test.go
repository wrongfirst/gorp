fsys := fstest.MapFS{
	"f1.txt": &fstest.MapFile{Data: []byte("apple red\nbanana yellow\n")},
	"f2.txt": &fstest.MapFile{Data: []byte("cherry red\napple green\n")},
	"f3.txt": &fstest.MapFile{Data: []byte("date brown\nfig purple\n")},
}

resMulti, errMulti := searchMultipleFiles(fsys, []string{"f1.txt", "f2.txt"}, "apple")
Tests.EqualCheck("searchMultipleFiles multiple files no error", nil, errMulti)
Tests.EqualCheck("f1 and f2 matches have filename prefixes", []string{"f1.txt:apple red", "f2.txt:apple green"}, resMulti)

resSingle, errSingle := searchMultipleFiles(fsys, []string{"f1.txt"}, "apple")
Tests.EqualCheck("single file search no error", nil, errSingle)
Tests.EqualCheck("single file search has NO filename prefix", []string{"apple red"}, resSingle)

resThree, errThree := searchMultipleFiles(fsys, []string{"f1.txt", "f2.txt", "f3.txt"}, "red")
Tests.EqualCheck("three files search no error", nil, errThree)
Tests.EqualCheck("three files red matches", []string{"f1.txt:apple red", "f2.txt:cherry red"}, resThree)

resNone, errNone := searchMultipleFiles(fsys, []string{"f1.txt", "f2.txt"}, "blueberry")
Tests.EqualCheck("no matches across files no error", nil, errNone)
Tests.EqualCheck("no matches across files returns empty slice", []string{}, resNone)

resEmpty, errEmpty := searchMultipleFiles(fsys, []string{}, "apple")
Tests.EqualCheck("empty file list no error", nil, errEmpty)
Tests.EqualCheck("empty file list returns empty slice", []string{}, resEmpty)

_, errMissing := searchMultipleFiles(fsys, []string{"f1.txt", "missing_file_xyz.txt"}, "apple")
Tests.BoolCheck("missing file in list returns error", errMissing != nil)
