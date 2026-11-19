Placing `^` at the beginning of a character group with ranges (`[^start-end]`) matches any character outside the specified ranges.

## Examples

```go
matchPattern("HELLO", "[^a-z]") // true (uppercase 'H' is outside 'a'–'z')
matchPattern("hello", "[^a-z]") // false (all characters are lowercase letters)
matchPattern("item #A", "#[^0-9]") // true ('A' is not a digit)
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Support negated character ranges `[^start-end]` and multiple negated ranges (e.g., `[^a-z]`, `[^0-9]`, `[^a-zA-Z0-9]`).
- Retain existing support for positive ranges, character classes, and token sequences.
- Return `false` otherwise. If `pattern` is empty, return `true`.
