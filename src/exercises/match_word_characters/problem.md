The word character class `\w` matches any Unicode letter, Unicode digit, or underscore (`_`).

## Examples

```go
matchPattern("hello", `\w`)   // true (contains letters)
matchPattern("$!?", `\w`)     // false (contains only punctuation symbols)
matchPattern("item_42", `\w`) // true (matches letters, digits, or underscore)
```

---

## Instructions

Implement `matchPattern(line string, pattern string) bool`:
- Return `true` if `pattern` is `\w` and `line` contains any word character (Unicode letter, Unicode digit, or `_`).
- Retain existing support for `\d` and literal character matching.
- Return `false` otherwise. If `pattern` is empty, return `true`.
