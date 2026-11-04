In Unix `grep`, one of the most widely used flags is `-n` (`--line-number`), which prefixes each matching line with its 1-based line number within its source file:

```bash
grep -n "ERROR" server.log
# Output:
# 2:ERROR: disk read failure
# 14:ERROR: timeout connecting to redis
```

This makes it trivial to navigate directly to the relevant line in an editor or debugger.

In this exercise, we implement:
- `searchFileWithOptions(fsys fs.FS, filePath string, pattern string, showLineNumbers bool) ([]string, error)`
- `searchFileWithLineNumbers(fsys fs.FS, filePath string, pattern string) ([]string, error)`

## How Line-Numbered File Search Works

1. Open the file at `filePath` within `fsys` using `fsys.Open`. If an error occurs, return `(nil, err)`.
2. Initialize a 1-based line counter: `lineNum := 1`.
3. Read the file line by line using `bufio.NewScanner`.
4. For each line:
   - Strip any trailing `\r`.
   - Test whether the line matches `pattern`.
   - If it matches:
     - If `showLineNumbers` is `true`: format as `fmt.Sprintf("%d:%s", lineNum, line)`.
     - If `showLineNumbers` is `false`: use `line` directly.
     - Append to the results slice.
   - Increment `lineNum++`.
5. Return the results slice.

### Examples

Given `config.ini` containing:
```text
1: server_port=8080
2: max_connections=500
3: server_timeout=30
```

| Pattern | showLineNumbers | Output Slice | Explanation |
| :--- | :--- | :--- | :--- |
| `"server_"` | `true` | `["1:server_port=8080", "3:server_timeout=30"]` | Line 1 and 3 prefixed with numbers |
| `"server_"` | `false` | `["server_port=8080", "server_timeout=30"]` | Without line numbers |
| `"database"` | `true` | `[]` | No matches |

---

## Problem Statement

Implement `searchFileWithOptions` and `searchFileWithLineNumbers` in the editor on the right:

```go
func searchFileWithOptions(fsys fs.FS, filePath string, pattern string, showLineNumbers bool) ([]string, error)
func searchFileWithLineNumbers(fsys fs.FS, filePath string, pattern string) ([]string, error)
```

The functions should:
- Open and read the file at `filePath` within `fsys`.
- Keep track of the 1-based line number as each line is read.
- Filter lines that match `pattern`.
- When line numbers are enabled, format matching lines as `"<line_number>:<line_content>"`.
- Return an error if the file cannot be opened or read.
