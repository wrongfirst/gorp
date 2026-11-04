The most fundamental use case of `grep` is searching for patterns inside a file:

```bash
grep "ERROR" /var/log/syslog
```

In idiomatic Go (Go 1.16+), file operations are designed around the standard `io/fs.FS` filesystem interface. This allows search utilities to operate seamlessly across both physical disk filesystems (via `os.DirFS`) and in-memory virtual filesystems (via `fstest.MapFS` in tests and WASM environments).

When given a filesystem and file path, `grep`:
1. Opens the target file via `fsys.Open(filePath)`.
2. If the file cannot be opened (e.g., does not exist or permission denied), returns `(nil, err)`.
3. Reads the file line by line using `bufio.NewScanner(file)`.
4. Trims newline delimiters (`\n` and `\r`).
5. Evaluates each line against `pattern` with `matchPattern(line, pattern)`.
6. Returns all matching lines in order.

In this exercise, we implement `searchFile(fsys fs.FS, filePath string, pattern string) ([]string, error)`.

## How Single File Search Works

1. **Open File**:
   - Call `file, err := fsys.Open(filePath)`. If an error occurs, return `(nil, err)`.
   - Ensure the file is closed when reading finishes (`defer file.Close()`).
2. **Scan Lines**:
   - Use `bufio.NewScanner(file)` to iterate through lines.
   - For each line, strip any trailing `\r` (carriage return): `line = strings.TrimRight(line, "\r")`.
   - Test whether the line matches `pattern` using `matchPattern(line, pattern)`.
   - If it matches, append to the results slice.
3. **Handle Errors and Return**:
   - Check `scanner.Err()`. If an error occurred during scanning, return `(nil, err)`.
   - Return the slice of matching lines. If no lines match, return an empty slice `[]string{}`.

### Examples

Assuming an `fsys` containing `app.log`:
```text
INFO: application started
ERROR: cannot connect to db
DEBUG: retrying in 3s
ERROR: pool exhausted
```

| File | Pattern | Output Lines | Explanation |
| :--- | :--- | :--- | :--- |
| `"app.log"` | `"ERROR"` | `["ERROR: cannot connect to db", "ERROR: pool exhausted"]` | Matching error lines |
| `"app.log"` | `"^DEBUG"` | `["DEBUG: retrying in 3s"]` | Line starting with DEBUG |
| `"app.log"` | `"FATAL"` | `[]` | No lines match |
| `"nonexistent.log"` | `"test"` | `nil, error` | File not found error |

---

## Problem Statement

Implement `searchFile(fsys fs.FS, filePath string, pattern string) ([]string, error)` in the editor on the right.

The function should:
- Open and read the file at `filePath` within `fsys`.
- Return an error if the file cannot be opened or read.
- Filter and return all lines matching `pattern`.
- Return an empty slice `[]string{}` if no lines match.
- If `pattern` is empty, return all lines in the file.
