The plus sign `+` quantifier matches one or more occurrences of the preceding token.

## Examples

```go
matchPattern("cat", "ca+t")   // true (matches one 'a')
matchPattern("ct", "ca+t")    // false (requires at least one occurrence)
matchPattern("12345", `^\d+$`) // true (entire line consists of digits)
matchPattern("aaa", "a+a")    // true (backtracks to match remaining 'a')
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Support `+` matching one or more occurrences of the preceding literal, character class, or range.
- Support backtracking when subsequent tokens require remaining characters.
- Retain existing support for anchors (`^`, `$`) and all previous pattern features.
- Return `false` otherwise. If `pattern` is empty, return `true`.
