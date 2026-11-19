Extract all non-overlapping matching substrings from a line in left-to-right order (equivalent to `grep -o` across multiple occurrences).

## Examples

```go
findAllMatches("cat dog cat", "cat")
// => ["cat", "cat"] (two occurrences of "cat")

findAllMatches("order 123 and 456", `\d+`)
// => ["123", "456"] (extracts all digit sequences)

findAllMatches("aaaa", "aa")
// => ["aa", "aa"] (non-overlapping matches)

findAllMatches("no match here", `\d+`)
// => [] (empty slice when no match)
```

---

## Instructions

Implement `findAllMatches(line string, pattern string) []string`:
- Scan `line` from left to right to find all non-overlapping non-empty matching substrings in order (skipping zero-length matches; when multiple alternation branches match at the same starting position, take the longest match).
- Return a slice containing each matched substring in order.
- Return a non-nil empty slice `[]string{}` if no matches are found or if `pattern` is empty.
- Support anchors (`^`, `$`), character classes, quantifiers, alternation, and backreferences.
