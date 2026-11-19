fsys := fstest.MapFS{
	"config.ini": &fstest.MapFile{
		Data: []byte("server_port=8080\nmax_connections=500\nserver_timeout=30\nlog_level=debug\n"),
	},
}

resNum, errNum := searchFileWithLineNumbers(fsys, "config.ini", "server_")
Tests.EqualCheck("searchFileWithLineNumbers no error", nil, errNum)
Tests.EqualCheck("lines with number prefixes", []string{"1:server_port=8080", "3:server_timeout=30"}, resNum)

resPlain, errPlain := searchFileWithOptions(fsys, "config.ini", "server_", false)
Tests.EqualCheck("searchFileWithOptions without line numbers no error", nil, errPlain)
Tests.EqualCheck("lines without number prefixes", []string{"server_port=8080", "server_timeout=30"}, resPlain)

resDigit, errDigit := searchFileWithLineNumbers(fsys, "config.ini", `=\d{3}$`)
Tests.EqualCheck("digit search no error", nil, errDigit)
Tests.EqualCheck("digit search matches line 2", []string{"2:max_connections=500"}, resDigit)

resNone, errNone := searchFileWithLineNumbers(fsys, "config.ini", "missing_key")
Tests.EqualCheck("no match returns no error", nil, errNone)
Tests.EqualCheck("no match returns empty slice", []string{}, resNone)

_, errMissing := searchFileWithLineNumbers(fsys, "does_not_exist_file.txt", "server_")
Tests.BoolCheck("nonexistent file returns error", errMissing != nil)

resAll, errAll := searchFileWithLineNumbers(fsys, "config.ini", "")
Tests.EqualCheck("empty pattern no error", nil, errAll)
Tests.EqualCheck("empty pattern returns all 4 lines", []string{"1:server_port=8080", "2:max_connections=500", "3:server_timeout=30", "4:log_level=debug"}, resAll)
