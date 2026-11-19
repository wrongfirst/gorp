The exact quantifier `{n}` matches the preceding token exactly `n` consecutive times.

## Examples

```go
matchPattern("caaat", "ca{3}t") // true (exactly 3 occurrences of 'a')
matchPattern("caat", "ca{3}t")  // false (only 2 occurrences)
matchPattern("123", `^\d{3}$`)  // true (exactly 3 digits)
matchPattern("ct", "ca{0}t")    // true (zero repetitions matches "ct")
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Support `{n}` matching exactly `n` occurrences of the preceding element.
- Retain existing support for quantifiers (`*`, `+`, `?`), anchors, wildcard, and character classes.
- Return `false` otherwise. If `pattern` is empty, return `true`.
