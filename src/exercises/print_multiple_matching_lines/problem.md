When `grep` runs against an input stream or file with multiple lines, it filters all lines sequentially.

Each line is tested against the pattern in order:
- If line `i` matches, it is included in the output.
- If line `i` does not match, it is skipped.
- The relative ordering of matching lines is strictly preserved.

For example, given the lines:
```text
1. "INFO: server started"
2. "ERROR: connection refused"
3. "DEBUG: retrying in 5s"
4. "ERROR: timeout after 30s"
5. "INFO: shutdown complete"
```
And the pattern `"ERROR"`, `grep` outputs:
```text
"ERROR: connection refused"
"ERROR: timeout after 30s"
```

Let's implement multi-line filtering in Go.

## How Multi-Line Filtering Works

Given a slice of lines `lines []string` and a `pattern string`:
1. Initialize an empty results slice: `var matched []string`.
2. Iterate through each line in `lines`.
3. Check if the line matches `pattern` using `matchPattern(line, pattern)`.
4. If it matches, append the line to `matched`.
5. Return `matched`. If no lines match, return an empty slice (not `nil`, or length 0).

### Examples

| Lines | Pattern | Output Lines | Explanation |
| :--- | :--- | :--- | :--- |
| `["apple", "banana", "apricot"]` | `"^ap"` | `["apple", "apricot"]` | Only lines starting with `"ap"` |
| `["cat", "dog", "bird"]` | `"fish"` | `[]` | No lines match |
| `["100", "abc", "200"]` | `"^\\d+$"` | `["100", "200"]` | Only lines that are purely digits |
| `["line 1", "line 2"]` | `""` | `["line 1", "line 2"]` | Empty pattern matches all lines |

---

## Problem Statement

Implement `grepLines(lines []string, pattern string) []string` in the editor on the right.

The function should:
- Filter `lines` using `pattern`, returning only the lines that match.
- Preserve the order of lines from the original slice.
- Return an empty slice `[]string{}` if no lines match or if `lines` is empty.
- If `pattern` is empty, return all lines.
