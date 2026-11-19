The question mark `?` quantifier matches zero or one occurrence of the preceding token.

## Examples

```go
matchPattern("color", "colou?r")   // true (matches with 0 'u's)
matchPattern("colour", "colou?r")  // true (matches with 1 'u')
matchPattern("colouur", "colou?r") // false (exceeds 1 occurrence)
matchPattern("-123", `^-?\d+$`)    // true (optional leading minus)
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Support `?` matching zero or one occurrence of the preceding literal, character class, or range.
- Retain existing support for `+`, anchors, and previous pattern features.
- Return `false` otherwise. If `pattern` is empty, return `true`.
