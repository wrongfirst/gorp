Search across multiple files in `fsys`, prefixing matches with `filePath:line` when more than one file is searched.

## Examples

Given an `fsys` containing `a.txt` (`"apple"`) and `b.txt` (`"banana"`, `"apple pie"`):

```go
searchMultipleFiles(fsys, []string{"a.txt", "b.txt"}, "apple")
// => ["a.txt:apple", "b.txt:apple pie"], nil (prefixed with filename)

searchMultipleFiles(fsys, []string{"a.txt"}, "apple")
// => ["apple"], nil (single file: no prefix)

searchMultipleFiles(fsys, []string{"a.txt", "missing.txt"}, "apple")
// => nil, error (missing file returns error)
```

---

## Instructions

Implement `searchMultipleFiles`:

- Search each file in `filePaths` in order within `fsys`, stripping `\n` and trailing `\r` (CRLF) from each line.
- Return `nil, err` if any file cannot be opened or read.
- Match each line against `pattern` (if `pattern` is `""`, every line matches).
- If `len(filePaths) > 1`, prefix matching lines with `"<filePath>:<line>"`; if `len(filePaths) == 1`, return matching lines without a filename prefix.
- Return a non-nil empty slice `[]string{}` and `nil` error if no lines match or if `filePaths` is empty.
