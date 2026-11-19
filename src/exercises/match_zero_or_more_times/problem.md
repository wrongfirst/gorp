The asterisk `*` quantifier matches zero or more occurrences of the preceding token.

## Examples

```go
matchPattern("ct", "ca*t")    // true (zero occurrences of 'a')
matchPattern("cat", "ca*t")   // true (one occurrence of 'a')
matchPattern("caaat", "ca*t") // true (multiple occurrences of 'a')
matchPattern("123", `^\d*$`)  // true (digits match \d*)
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Support `*` matching zero or more occurrences of the preceding literal, character class, or range.
- Support backtracking when subsequent tokens need to match remaining characters.
- Retain existing support for `+`, `?`, anchors, and character classes.
- Return `false` otherwise. If `pattern` is empty, return `true`.
