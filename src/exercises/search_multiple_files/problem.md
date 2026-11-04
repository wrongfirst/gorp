When searching across multiple files on the command line:

```bash
grep "TODO" main.go auth.go db.go
```

`grep` automatically prefixes each matching line with the **name of the file** in which it was found:

```text
main.go: // TODO: add graceful shutdown
db.go:   // TODO: implement connection retry
```

This filename prefix is essential for identifying the source of each match when querying multiple files.

If only a single file is provided (e.g., `grep "TODO" main.go`), `grep` omits the filename prefix unless explicitly forced with `-H`. When two or more files are searched, the filename prefix (`"<filename>:<line>"`) is automatically included.

In this exercise, we implement `searchMultipleFiles(fsys fs.FS, filePaths []string, pattern string) ([]string, error)`.

## How Searching Multiple Files Works

1. If `filePaths` is empty, return an empty slice `[]string{}, nil`.
2. Determine if the filename prefix should be applied:
   - `prefixFilename := len(filePaths) > 1`
3. Iterate through each `filePath` in `filePaths`:
   - Open the file using `fsys.Open(filePath)`. If an error occurs, return `(nil, err)`.
   - Scan line by line, stripping trailing `\r`.
   - For each matching line:
     - If `prefixFilename` is `true`: format as `fmt.Sprintf("%s:%s", filePath, line)`.
     - If `prefixFilename` is `false`: use `line` directly.
     - Append formatted line to results.
   - Close the file.
4. Return all collected matching lines in order.

### Examples

Given an `fsys` containing `a.txt` (`"apple"`) and `b.txt` (`"banana"`, `"apple pie"`):

| filePaths | Pattern | Output Slice | Explanation |
| :--- | :--- | :--- | :--- |
| `["a.txt", "b.txt"]` | `"apple"` | `["a.txt:apple", "b.txt:apple pie"]` | Filename prefixed for multiple files |
| `["a.txt"]` | `"apple"` | `["apple"]` | Single file: no filename prefix |
| `["a.txt", "b.txt"]` | `"orange"` | `[]` | No matches in any file |
| `["a.txt", "missing.txt"]` | `"apple"` | `nil, error` | Missing file returns error |

---

## Problem Statement

Implement `searchMultipleFiles(fsys fs.FS, filePaths []string, pattern string) ([]string, error)` in the editor on the right.

The function should:
- Search each file in `filePaths` in order within `fsys`.
- Return an error if any file cannot be opened or read.
- If `len(filePaths) > 1`, prefix matching lines with `"<filePath>:<line>"`.
- If `len(filePaths) == 1`, return matching lines without filename prefix.
- Return an empty slice `[]string{}` if no lines match or if `filePaths` is empty.
