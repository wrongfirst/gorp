Filter a slice of lines, returning all lines that match the pattern in their original order.

## Examples

```go
lines := []string{"apple", "banana", "apricot"}
grepLines(lines, "^ap")
// => ["apple", "apricot"] (matches lines starting with "ap")

grepLines([]string{"cat", "dog"}, "fish")
// => [] (no lines match)

grepLines([]string{"100", "abc", "200"}, `^\d+$`)
// => ["100", "200"] (matches lines of only digits)
```

---

## Instructions

Implement `grepLines(lines []string, pattern string) []string`:
- Filter `lines` using `pattern`, returning only matching lines.
- Preserve the original slice order.
- Return an empty slice `[]string{}` if no lines match or if `lines` is empty.
- If `pattern` is empty, return all lines.
