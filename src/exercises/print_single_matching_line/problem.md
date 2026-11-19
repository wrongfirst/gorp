Filter a single line, returning the line if it matches the pattern or suppressing it if it does not.

## Examples

```go
grepLine("ERROR: disk full", "ERROR")
// => "ERROR: disk full", true (line matches pattern)

grepLine("INFO: normal", "ERROR")
// => "", false (non-matching line suppressed)

grepLine("apple pie", "^apple")
// => "apple pie", true (anchored match)
```

---

## Instructions

Implement `grepLine(line string, pattern string) (string, bool)`:
- Test whether `line` matches `pattern`.
- If `line` matches, return `(line, true)`.
- If `line` does not match, return `("", false)`.
- If `pattern` is empty, return `(line, true)`.
