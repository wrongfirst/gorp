Recursively search directory trees, prefixing matching lines with `filePath:line` (equivalent to `grep -r`).

## Examples

Given an `fsys` containing `project/main.go` and `project/config/{app.json, db.json}`:

```go
searchDirectory(fsys, "project", "port")
// => ["project/config/app.json:{"port": 8080}", "project/config/db.json:{"port": 5432}"], nil

searchDirectory(fsys, "project", "func")
// => ["project/main.go:func main() {}"], nil

searchDirectory(fsys, "missing_dir", "test")
// => nil, error (missing directory returns error)
```

---

## Instructions

Implement `searchDirectory`:

- Recursively walk `rootDir` in `fsys`.
- Search every regular file for lines matching `pattern` (stripping `\n` and trailing `\r`; if `pattern` is `""`, every line matches).
- Format matching lines as `"<filePath>:<line>"`.
- Return `nil, err` if `rootDir` does not exist, cannot be traversed, or if reading a file fails.
- Return an empty slice `[]string{}` and `nil` error if no lines match or if the directory contains no files.
