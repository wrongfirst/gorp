The quantifier `{n,}` matches the preceding token at least `n` consecutive times, with no upper limit.

## Examples

```go
matchPattern("caat", "ca{2,}t")  // true (meets minimum of 2 occurrences)
matchPattern("cat", "ca{2,}t")   // false (only 1 occurrence)
matchPattern("12345", `^\d{3,}$`) // true (5 digits exceeds minimum of 3)
matchPattern("aaa", "a{2,}a")    // true (backtracks to allow following literal match)
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Support `{n,}` matching at least `n` occurrences of the preceding element.
- Retain existing support for `{n}`, `*`, `+`, `?`, `.` (wildcard), anchors, and character classes.
- Return `false` otherwise. If `pattern` is empty, return `true`.
