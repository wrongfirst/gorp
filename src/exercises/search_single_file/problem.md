Search for matching lines within a file using Go's `io/fs.FS` filesystem interface.

## Examples

Given an `fsys` containing `app.log` (`INFO: started`, `ERROR: cannot connect to db`, `DEBUG: retrying in 3s`, `ERROR: pool exhausted`):

```go
searchFile(fsys, "app.log", "ERROR")
// => ["ERROR: cannot connect to db", "ERROR: pool exhausted"], nil

searchFile(fsys, "app.log", "^DEBUG")
// => ["DEBUG: retrying in 3s"], nil

searchFile(fsys, "nonexistent.log", "test")
// => nil, error (file not found)
```

---

## Instructions

Implement `searchFile`:

- Open and read the file at `filePath` within `fsys`, returning `nil, err` if it cannot be opened or read.
- Strip `\n` and trailing `\r` (CRLF) from each line before matching.
- Return all lines matching `pattern` in order (if `pattern` is `""`, return all lines in the file).
- Return a non-nil empty slice `[]string{}` and `nil` error if no lines match or if the file is empty.
