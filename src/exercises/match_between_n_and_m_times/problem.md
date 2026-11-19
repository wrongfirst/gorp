The quantifier `{n,m}` matches the preceding token between `n` and `m` consecutive times (inclusive).

## Examples

```go
matchPattern("caat", "^ca{2,4}t$")    // true (2 occurrences, within 2–4)
matchPattern("caaaat", "^ca{2,4}t$")  // true (4 occurrences, within 2–4)
matchPattern("cat", "^ca{2,4}t$")     // false (fewer than 2 occurrences)
matchPattern("caaaaat", "^ca{2,4}t$") // false (exceeds 4 occurrences)
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Support `{n,m}` matching between `n` and `m` occurrences of the preceding element.
- Retain existing support for `{n}`, `{n,}`, `*`, `+`, `?`, `.` (wildcard), anchors, and character classes.
- Return `false` otherwise. If `pattern` is empty, return `true`.
