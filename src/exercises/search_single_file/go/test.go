fsys := fstest.MapFS{
	"app.log": &fstest.MapFile{
		Data: []byte("INFO: app started\nERROR: disk failure\nDEBUG: ping\nERROR: memory leak\n"),
	},
	"crlf.txt": &fstest.MapFile{
		Data: []byte("first line\r\nsecond line\r\nthird line\r\n"),
	},
	"empty.txt": &fstest.MapFile{
		Data: []byte(""),
	},
}

res1, err1 := searchFile(fsys, "app.log", "ERROR")
Tests.EqualCheck("searchFile no error on valid file", nil, err1)
Tests.EqualCheck("matched error lines", []string{"ERROR: disk failure", "ERROR: memory leak"}, res1)

res2, err2 := searchFile(fsys, "app.log", "^INFO")
Tests.EqualCheck("searchFile anchor start no error", nil, err2)
Tests.EqualCheck("searchFile anchor start lines", []string{"INFO: app started"}, res2)

res3, err3 := searchFile(fsys, "app.log", "FATAL")
Tests.EqualCheck("no match returns no error", nil, err3)
Tests.EqualCheck("no match returns empty slice", []string{}, res3)

res4, err4 := searchFile(fsys, "app.log", "")
Tests.EqualCheck("empty pattern no error", nil, err4)
Tests.EqualCheck("empty pattern returns all lines count", 4, len(res4))

_, errMissing := searchFile(fsys, "nonexistent.txt", "pattern")
Tests.BoolCheck("nonexistent file returns error", errMissing != nil)

resCRLF, errCRLF := searchFile(fsys, "crlf.txt", "second")
Tests.EqualCheck("CRLF search no error", nil, errCRLF)
Tests.EqualCheck("CRLF carriage return stripped", []string{"second line"}, resCRLF)

resEmpty, errEmpty := searchFile(fsys, "empty.txt", "anything")
Tests.EqualCheck("empty file returns no error", nil, errEmpty)
Tests.EqualCheck("empty file returns 0 lines", []string{}, resEmpty)
