When working on a real codebase or server, you almost never search individual files by typing their names one by one. Instead, you run `grep -r` (or `grep -R`) to recursively search **entire directory hierarchies**:

```bash
grep -r "connection_timeout" /etc/nginx/
```

When given a directory path with recursive search enabled, `grep`:
1. Traverses the directory tree rooted at the given path.
2. Identifies every regular file (skipping directories themselves).
3. Opens and scans each file line by line.
4. Prefixes every matching line with the path to the file in which it was found:
   `"<filePath>:<line>"`
5. Returns all matching lines in deterministic (lexicographical) order.

In Go, recursive directory traversal is canonically implemented using the standard library's [`fs.WalkDir`](https://pkg.go.dev/io/fs#WalkDir):
```go
err := fs.WalkDir(fsys, rootDir, func(path string, d fs.DirEntry, err error) error {
    if err != nil {
        return err
    }
    if d.IsDir() {
        return nil
    }
    // Search file at path...
    return nil
})
```

In this exercise, we implement `searchDirectory(fsys fs.FS, rootDir string, pattern string) ([]string, error)`.

## How Recursive Directory Search Works

1. If `rootDir` does not exist or cannot be accessed (e.g. `fs.Stat(fsys, rootDir)` returns an error), return `(nil, err)`.
2. Initialize `result := make([]string, 0)`.
3. Use `fs.WalkDir(fsys, rootDir, ...)`:
   - If an error is passed to the walk function, return it.
   - If `d.IsDir()` is `true`, return `nil` to continue walking inside the directory.
   - Otherwise, `d` represents a file:
     - Open the file using `fsys.Open(path)`.
     - Scan line by line, stripping trailing `\r`.
     - For each line matching `pattern`:
       - Append `fmt.Sprintf("%s:%s", path, line)`.
     - Close the file.
4. Return `result, nil`.

### Examples

Given an `fsys` containing:
```
project/
  main.go      -> "func main() {}"
  config/
    app.json   -> "{\"port\": 8080}"
    db.json    -> "{\"port\": 5432}"
```

| rootDir | Pattern | Output Slice | Explanation |
| :--- | :--- | :--- | :--- |
| `"project"` | `"port"` | `["project/config/app.json:{\"port\": 8080}", "project/config/db.json:{\"port\": 5432}"]` | Matches across subdirectories |
| `"project"` | `"func"` | `["project/main.go:func main() {}"]` | Match in root file |
| `"project"` | `"nonexistent"` | `[]` | No matches in any files |
| `"missing_dir"` | `"test"` | `nil, error` | Missing directory returns error |

---

## Problem Statement

Implement `searchDirectory(fsys fs.FS, rootDir string, pattern string) ([]string, error)` in the editor on the right.

The function should:
- Recursively walk `rootDir` in `fsys` using `fs.WalkDir`.
- Search every file encountered for lines matching `pattern`.
- Format matching lines as `"<filePath>:<line>"`.
- Return an error if `rootDir` cannot be traversed or if reading fails.
- Return an empty slice `[]string{}` if no lines match in any file.
