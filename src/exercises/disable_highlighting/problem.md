While ANSI escape codes make terminal output easy to read, they cause severe bugs when grep output is processed by downstream tools, saved to log files, or piped into commands like `wc`, `awk`, or `cut`.

For example, the string `"error"` has a length of 5 bytes. But `"\033[31merror\033[0m"` contains 14 bytes! If saved to a file or piped to another tool, the raw escape characters `\033[31m` will corrupt the output.

To solve this, `grep` supports controlling color formatting via `--color`:
- `--color=always`: Force ANSI color codes in output.
- `--color=never`: Suppress ANSI color codes, emitting clean plain text.

In this exercise, we define `ColorMode` and implement:
- `formatLine(line string, pattern string, mode ColorOption) (string, bool)`
- `formatLines(lines []string, pattern string, mode ColorOption) []string`

## How Color Option Control Works

1. **`ColorAlways`**:
   - Matching lines have all occurrences of `pattern` wrapped with `\033[31m` and `\033[0m`.
2. **`ColorNever`**:
   - Matching lines are returned as unmodified plain text strings.
3. In both modes:
   - Lines that do not match `pattern` return `("", false)` or are excluded from `formatLines`.

### Examples

| Lines | Pattern | Mode | Output |
| :--- | :--- | :--- | :--- |
| `["disk error"]` | `"error"` | `ColorAlways` | `["disk \033[31merror\033[0m"]` |
| `["disk error"]` | `"error"` | `ColorNever` | `["disk error"]` |
| `["all good"]` | `"error"` | `ColorAlways` | `[]` |
| `["all good"]` | `"error"` | `ColorNever` | `[]` |

---

## Problem Statement

Implement `ColorOption` (also aliased as `ColorMode`), `formatLine`, and `formatLines` in the editor on the right:

```go
type ColorOption string
type ColorMode = ColorOption

const (
    ColorAlways ColorOption = "always"
    ColorNever  ColorOption = "never"
)

func formatLine(line string, pattern string, mode ColorOption) (string, bool)
func formatLines(lines []string, pattern string, mode ColorOption) []string
```

The functions should:
- Test if lines match `pattern`.
- In `ColorAlways` mode, apply `\033[31m` ... `\033[0m` to all matching substrings in matching lines.
- In `ColorNever` mode, return matching lines as plain text without any escape sequences.
- Exclude non-matching lines from `formatLines`.
- Return `("", false)` for non-matching lines in `formatLine`.
