Filter a slice of lines to keep only matching lines, highlighting all match occurrences with ANSI escape codes (`\033[31m` ... `\033[0m`).

## Examples

```go
lines := []string{"cat and dog", "bird only", "another cat"}
highlightLines(lines, "cat")
// => ["\033[31mcat\033[0m and dog", "another \033[31mcat\033[0m"]

highlightLines([]string{"user 100", "admin", "guest 200"}, `\d+`)
// => ["user \033[31m100\033[0m", "guest \033[31m200\033[0m"]

highlightLines([]string{"apple", "banana"}, "cherry")
// => []
```

---

## Instructions

Implement `highlightLines(lines []string, pattern string) []string`:
- Filter `lines`, returning only lines that contain a match for `pattern`.
- In each matching line, highlight all non-overlapping occurrences of `pattern` with `\033[31m` and `\033[0m`.
- Preserve the original order of lines.
- Return an empty slice `[]string{}` if no lines match or if `lines` is empty.
- If `pattern` is empty, return all `lines` without highlights.
